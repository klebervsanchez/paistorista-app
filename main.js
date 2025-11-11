let map, directionsService, directionsRenderer;
let currentUser = null;

// 🔁 Inicializar mapa
function initMap() {
  const defaultPos = { lat: -23.55052, lng: -46.633308 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // 🧭 Autocomplete Google Places
  const originInput = document.getElementById("origin");
  const destinationInput = document.getElementById("destination");

  if (originInput && destinationInput) {
    new google.maps.places.Autocomplete(originInput);
    new google.maps.places.Autocomplete(destinationInput);
  }

  // 🔐 Observar autenticação
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
    } else {
      window.location.href = "login.html";
    }
  });

  // 📍 Eventos de botões
  document.getElementById("btn-location")?.addEventListener("click", getCurrentLocation);
  document.getElementById("btn-route")?.addEventListener("click", drawRoute);
  document.getElementById("btn-save")?.addEventListener("click", saveRide);
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    firebase.auth().signOut().then(() => window.location.href = "login.html");
  });

  // 👁️ Se estiver no painel do passageiro
  if (document.getElementById("rides-list")) {
    loadAvailableRides();
  }
}

// 📍 Usar localização atual
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
  }, () => {
    alert("⚠️ Não foi possível obter a localização.");
  });
}

// 🗺️ Traçar rota
function drawRoute() {
  const origin = document.getElementById("origin")?.value;
  const destination = document.getElementById("destination")?.value;

  if (!origin || !destination) return alert("⚠️ Preencha origem e destino.");

  directionsService.route({
    origin,
    destination,
    travelMode: 'DRIVING'
  }, (result, status) => {
    if (status === 'OK') {
      directionsRenderer.setDirections(result);
    } else {
      alert("❌ Erro ao traçar rota.");
    }
  });
}

// 💾 Salvar carona no Firestore
function saveRide() {
  const origin = document.getElementById("origin")?.value.trim();
  const destination = document.getElementById("destination")?.value.trim();
  const schoolName = document.getElementById("school")?.value.trim();
  const seats = parseInt(document.getElementById("seats")?.value);

  if (!origin || !destination || !schoolName || isNaN(seats) || seats <= 0) {
    return alert("⚠️ Preencha todos os campos corretamente.");
  }

  if (!currentUser) {
    return alert("⚠️ Usuário não autenticado.");
  }

  db.collection("caronas").add({
    uid: currentUser.uid,
    motorista: currentUser.displayName || "Motorista",
    origem: origin,
    destino: destination,
    escola: schoolName,
    vagas: seats,
    vagasDisponiveis: seats,
    status: "ativa",
    solicitacoes: [],
    dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("✅ Carona cadastrada com sucesso!");
  }).catch(err => {
    alert("❌ Erro ao salvar carona: " + err.message);
  });
}

// 🧾 Listar caronas disponíveis para passageiro
function loadAvailableRides() {
  const list = document.getElementById("rides-list");
  if (!list) return;

  db.collection("caronas").where("status", "==", "ativa")
    .onSnapshot(snapshot => {
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const carona = doc.data();

        // Evita exibir caronas do próprio usuário
        if (carona.uid === currentUser?.uid) return;

        const li = document.createElement("li");
        li.className = "collection-item";
        li.innerHTML = `
          <strong>🏫 ${carona.escola}</strong><br>
          Origem: ${carona.origem}<br>
          Destino: ${carona.destino}<br>
          Vagas: ${carona.vagasDisponiveis}/${carona.vagas}<br>
          <button class="btn-small blue" onclick="solicitarCarona('${doc.id}')">Solicitar</button>
        `;
        list.appendChild(li);
      });
    });
}

// 🙋 Solicitar carona
function solicitarCarona(caronaId) {
  const uid = currentUser?.uid;
  if (!uid) return alert("⚠️ Usuário não autenticado.");

  const solicitacao = { uid, status: "pendente" };

  const ref = db.collection("caronas").doc(caronaId);

  ref.get().then(doc => {
    const data = doc.data();
    const jaSolicitou = (data.solicitacoes || []).some(s => s.uid === uid);

    if (jaSolicitou) {
      alert("⚠️ Você já solicitou esta carona.");
      return;
    }

    ref.update({
      solicitacoes: firebase.firestore.FieldValue.arrayUnion(solicitacao)
    }).then(() => {
      alert("🚗 Solicitação enviada com sucesso!");
    }).catch(err => {
      alert("❌ Erro ao solicitar carona: " + err.message);
    });
  });
}

// ✅ Torna funções globais para o HTML acessar
window.initMap = initMap;
window.solicitarCarona = solicitarCarona;
