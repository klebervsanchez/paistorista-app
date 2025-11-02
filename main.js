import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let map;
let directionsRenderer;
let directionsService;

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Bem-vindo, ${user.displayName}`);
    document.getElementById("map").style.display = "block";
    initMap();
  } catch (error) {
    alert("Erro ao fazer login: " + error.message);
  }
});

window.initMap = async function () {
  if (!navigator.geolocation) {
    alert("Geolocalização não suportada.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: latitude, lng: longitude },
      zoom: 14,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Marcador do usuário atual
    new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map,
      title: "Você está aqui!",
    });

    // Salvar localização atual no Firestore
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, "usuarios_ativos"), {
        uid: user.uid,
        nome: user.displayName,
        latitude,
        longitude,
        timestamp: new Date()
      });
    }

    // Mostrar todos usuários ativos
    mostrarUsuariosAtivos();
  });
};

// Traçar rota de A até B
window.traceRoute = async function () {
  const origem = document.getElementById("origin").value;
  const destino = document.getElementById("destination").value;

  if (!origem || !destino) {
    alert("Preencha origem e destino!");
    return;
  }

  const request = {
    origin: origem,
    destination: destino,
    travelMode: google.maps.TravelMode.DRIVING,
  };

  directionsService.route(request, async (result, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(result);

      // Salva no Firestore
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "rotas"), {
          uid: user.uid,
          nome: user.displayName,
          origem,
          destino,
          rota: result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng()
          })),
          timestamp: new Date()
        });
      }

      alert("Rota traçada e salva com sucesso!");
    } else {
      alert("Erro ao traçar rota: " + status);
    }
  });
};

// Mostrar todos usuários ativos no mapa
async function mostrarUsuariosAtivos() {
  const querySnapshot = await getDocs(collection(db, "usuarios_ativos"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.latitude && data.longitude) {
      new google.maps.Marker({
        position: { lat: data.latitude, lng: data.longitude },
        map,
        title: data.nome,
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      });
    }
  });
}
