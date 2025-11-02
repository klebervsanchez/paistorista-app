import { auth, provider, db } from "./firebase-config.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginBtn = document.getElementById("google-login");
const logoutBtn = document.getElementById("logout");
const userPanel = document.getElementById("user-panel");
const userName = document.getElementById("user-name");
const rotaPanel = document.getElementById("rota-panel");

const origemInput = document.getElementById("origem");
const destinoInput = document.getElementById("destino");
const horarioInput = document.getElementById("horario");
const salvarRotaBtn = document.getElementById("salvar-rota");
const listaRotas = document.getElementById("lista-rotas");

let currentUser = null;

loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => showUser(result.user))
    .catch((error) => console.error("Erro no login:", error));
});

logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      loginBtn.classList.remove("hidden");
      userPanel.classList.add("hidden");
      rotaPanel.classList.add("hidden");
    })
    .catch((error) => console.error("Erro ao sair:", error));
});

onAuthStateChanged(auth, (user) => {
  if (user) showUser(user);
});

function showUser(user) {
  currentUser = user;
  userName.textContent = user.displayName;
  loginBtn.classList.add("hidden");
  userPanel.classList.remove("hidden");
  rotaPanel.classList.remove("hidden");
  document.getElementById("map").classList.remove("hidden");
  carregarRotas();
  showLocation(); // Mostrar localização no login
}

salvarRotaBtn.addEventListener("click", async () => {
  const origem = origemInput.value;
  const destino = destinoInput.value;
  const horario = horarioInput.value;

  if (!origem || !destino || !horario) return;

  await addDoc(collection(db, "rotas"), {
    uid: currentUser.uid,
    origem,
    destino,
    horario
  });

  origemInput.value = "";
  destinoInput.value = "";
  horarioInput.value = "";
  carregarRotas();
});

async function carregarRotas() {
  listaRotas.innerHTML = "";
  const rotasRef = collection(db, "rotas");
  const q = query(rotasRef, where("uid", "==", currentUser.uid));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const rota = doc.data();
    const li = document.createElement("li");
    li.textContent = `Origem: ${rota.origem}, Destino: ${rota.destino}, Horário: ${rota.horario}`;
    listaRotas.appendChild(li);
  });
}

// MAPA (Google Maps)
let map;
let marker;

function initMap(lat, lng) {
  const location = { lat, lng };
  map = new google.maps.Map(document.getElementById("map"), {
    center: location,
    zoom: 15,
  });
  marker = new google.maps.Marker({
    position: location,
    map: map,
    title: "Você está aqui",
  });
}

function showLocation() {
  const mapDiv = document.getElementById("map");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        initMap(lat, lng);
      },
      () => alert("Erro ao acessar a localização.")
    );
  } else {
    alert("Geolocalização não suportada.");
  }
}
