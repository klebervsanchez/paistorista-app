import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let map, directionsService, directionsRenderer, currentUser;

// 🔐 Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    alert(`Bem-vindo, ${currentUser.displayName}`);
    document.getElementById("map").style.display = "block";
    initMap();
  } catch (error) {
    alert("Erro no login: " + error.message);
  }
});

window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -23.55, lng: -46.63 },
    zoom: 12,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  mostrarCaronasNoMapa();
};

// 📍 Geolocalização
window.usarLocalizacaoAtual = function () {
  if (!navigator.geolocation) return alert("Geolocalização não suportada");

  navigator.geolocation.getCurrentPosition(position => {
    const latlng = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK" && results[0]) {
        document.getElementById("origem").value = results[0].formatted_address;
      }
    });
  });
};

// 💾 Salvar rota
window.salvarRota = async function () {
  const origem = document.getElementById("origem").value;
  const destino = document.getElementById("destino").value;
  const horario = document.getElementById("horario").value;

  if (!origem || !destino || !horario || !currentUser) {
    return alert("Preencha tudo e faça login.");
  }

  await addDoc(collection(db, "rotas"), {
    origem, destino, horario,
    uid: currentUser.uid,
    nome: currentUser.displayName,
    timestamp: new Date()
  });

  alert("Rota salva.");
  mostrarCaronasNoMapa();
};

// 🗺️ Traçar rota
window.tracarRota = function () {
  const origem = document.getElementById("origem").value;
  const destino = document.getElementById("destino").value;
  if (!origem || !destino) return;

  const request = {
    origin: origem,
    destination: destino,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(request, (result, status) => {
    if (status === "OK") directionsRenderer.setDirections(result);
  });
};

// 📍 Mostrar caronas no mapa
async function mostrarCaronasNoMapa() {
  const snap = await getDocs(collection(db, "rotas"));
  const now = new Date();
  const horaAtual = now.toTimeString().slice(0, 5); // ex: "14:30"

  const geocoder = new google.maps.Geocoder();

  snap.forEach(doc => {
    const data = doc.data();
    if (data.horario >= horaAtual) {
      geocoder.geocode({ address: data.origem }, (results, status) => {
        if (status === "OK" && results[0]) {
          const marker = new google.maps.Marker({
            position: results[0].geometry.location,
            map,
            title: data.nome
          });

          const info = new google.maps.InfoWindow({
            content: `
              <strong>${data.nome}</strong><br>
              Origem: ${data.origem}<br>
              Destino: ${data.destino}<br>
              <button onclick="abrirChat('${data.uid}', '${data.nome}')">💬 Enviar mensagem</button>
            `
          });

          marker.addListener("click", () => info.open(map, marker));
        }
      });
    }
  });
}

// 💬 Chat
let chatComUid = null;

window.abrirChat = async function (uidDestino, nome) {
  chatComUid = uidDestino;
  document.getElementById("chatBox").style.display = "block";
  document.getElementById("chatCom").innerText = nome;
  await carregarMensagens();
};

window.enviarMensagem = async function () {
  const texto = document.getElementById("mensagemInput").value;
  if (!texto || !currentUser || !chatComUid) return;

  await addDoc(collection(db, "mensagens"), {
    de: currentUser.uid,
    para: chatComUid,
    nome: currentUser.displayName,
    texto,
    timestamp: new Date()
  });

  document.getElementById("mensagemInput").value = "";
  await carregarMensagens();
};

async function carregarMensagens() {
  const snap = await getDocs(query(
    collection(db, "mensagens"),
    orderBy("timestamp")
  ));

  const msgs = [];
  snap.forEach(doc => {
    const m = doc.data();
    const conversaCom = (m.de === currentUser.uid && m.para === chatComUid) ||
                        (m.de === chatComUid && m.para === currentUser.uid);
    if (conversaCom) {
      msgs.push(`<b>${m.nome}:</b> ${m.texto}`);
    }
  });

  document.getElementById("mensagens").innerHTML = msgs.join("<br>");
}
