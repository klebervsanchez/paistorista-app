let map, directionsService, directionsRenderer;
const user = firebase.auth().currentUser;

function initMap() {
  const defaultPos = { lat: -23.55052, lng: -46.633308 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  new google.maps.places.Autocomplete(document.getElementById("origin"));
  new google.maps.places.Autocomplete(document.getElementById("destination"));

  document.getElementById("btn-location").addEventListener("click", getCurrentLocation);
  document.getElementById("btn-route").addEventListener("click", drawRoute);
  document.getElementById("btn-save").addEventListener("click", saveRide);
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    firebase.auth().signOut().then(() => window.location.href = "login.html");
  });

  if (document.getElementById("rides-list")) loadAvailableRides();
}

function getCurrentLocation() {
  navigator.geolocation.getCurrentPosition(position => {
    const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
    map.setCenter(pos);
    new google.maps.Marker({ position: pos, map });

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === "OK" && results[0]) {
        document.getElementById("origin").value = results[0].formatted_address;
      }
    });
  });
}

function drawRoute() {
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;

  directionsService.route({
    origin,
    destination,
    travelMode: 'DRIVING'
  }, (result, status) => {
    if (status === 'OK') {
      directionsRenderer.setDirections(result);
    } else {
      alert("Erro ao traçar rota");
    }
  });
}

function saveRide() {
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;
  const schoolName = document.getElementById("school").value;
  const seats = parseInt(document.getElementById("seats").value);

  if (!origin || !destination || !schoolName || isNaN(seats)) {
    return alert("Preencha todos os campos.");
  }

  db.collection("caronas").add({
    uid: user?.uid,
    motorista: user?.displayName || "Motorista",
    origem: origin,
    destino: destination,
    escola: schoolName,
    vagas: seats,
    vagasDisponiveis: seats,
    status: "ativa",
    solicitacoes: [],
    dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Carona cadastrada!");
  });
}

function loadAvailableRides() {
  const list = document.getElementById("rides-list");
  db.collection("caronas").where("status", "==", "ativa")
    .onSnapshot(snapshot => {
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const carona = doc.data();
        const li = document.createElement("li");
        li.className = "collection-item";
        li.innerHTML = `
          <strong>${carona.escola}</strong><br>
          Origem: ${carona.origem}<br>
          Destino: ${carona.destino}<br>
          Vagas: ${carona.vagasDisponiveis}/${carona.vagas}
          <br>
          <button class="btn-small blue" onclick="solicitarCarona('${doc.id}')">Solicitar</button>
        `;
        list.appendChild(li);
      });
    });
}

function solicitarCarona(caronaId) {
  const uid = firebase.auth().currentUser?.uid;
  db.collection("caronas").doc(caronaId).update({
    solicitacoes: firebase.firestore.FieldValue.arrayUnion({
      uid,
      status: "pendente",
    })
  }).then(() => {
    alert("Solicitação enviada!");
  });
}
