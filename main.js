import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let map;
let directionsRenderer;
let directionsService;

// LOGIN
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

// INICIALIZAR MAPA
window.initMap = async function () {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: latitude, lng: longitude },
      zoom: 14,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map,
      title: "Você está aqui!",
    });

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

    mostrarUsuariosAtivos();
  });
};

// TRAÇAR ROTA
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

      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "rotas"), {
          uid: user.uid,
          nome: user.displayName,
          origem,
          destino,
          rota: result.routes[0].overview_path.map(p => ({
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

// MOSTRAR USUÁRIOS ATIVOS
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

// BOTÃO 📍 ORIGEM AUTOMÁTICA
window.usarLocalizacaoAtual = function () {
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: latitude, lng: longitude };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK" && results[0]) {
        document.getElementById("origin").value = results[0].formatted_address;
      } else {
        alert("Não foi possível converter para endereço.");
      }
    });
  });
};
