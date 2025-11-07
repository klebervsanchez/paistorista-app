let map;
let directionsService;
let directionsRenderer;
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  }
});

function initMap() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -23.5505, lng: -46.6333 }, // SP
    zoom: 12
  });
  directionsRenderer.setMap(map);
}

function useCurrentLocation() {
  navigator.geolocation.getCurrentPosition(
    position => {
      const latlng = `${position.coords.latitude},${position.coords.longitude}`;
      document.getElementById("origin").value = latlng;
      map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
    },
    error => alert("Erro ao obter localização")
  );
}

function traceRoute() {
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;
  if (!origin || !destination) {
    alert("Preencha origem e destino");
    return;
  }
  directionsService.route({
    origin,
    destination,
    travelMode: "DRIVING"
  }, (result, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
    } else {
      alert("Erro ao traçar rota: " + status);
    }
  });
}

function saveRoute() {
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;
  const user = auth.currentUser;
  if (origin && destination && user) {
    db.collection("caronas").add({
      uid: user.uid,
      origem: origin,
      destino: destination,
      criadoEm: new Date()
    }).then(() => {
      M.toast({ html: "Carona salva!" });
    }).catch(err => alert("Erro: " + err));
  } else {
    alert("Preencha origem, destino e esteja logado.");
  }
}

function showSavedRoutes() {
  db.collection("caronas").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      new google.maps.Marker({
        position: { lat: parseFloat(data.origem.split(',')[0]), lng: parseFloat(data.origem.split(',')[1]) },
        map: map,
        title: `Destino: ${data.destino}`
      });
    });
  });
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}
