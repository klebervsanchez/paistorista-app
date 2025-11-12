let map, directionsService, directionsRenderer;
let currentUser = null;
let db = null;

// 🔁 Inicializar mapa
function initMap() {
  const defaultPos = { lat: -23.55052, lng: -46.633308 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // 🧭 Autocomplete
  const originInput = document.getElementById("origin");
  const destinationInput = document.getElementById("destination");

  if (originInput && destinationInput) {
    new google.maps.places.Autocomplete(originInput);
    new google.maps.places.Autocomplete(destinationInput);
  }

  // 🔐 Autenticação
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      db = firebase.firestore();

      if (document.getElementById("rides-list")) loadAvailableRides();
      if (document.getElementById("my-requests")) loadMyRequests();

      // Iniciar o temporizador de inatividade após login
      startInactivityTimer();

    } else {
      window.location.href = "login.html";
    }
  });

  // 📍 Eventos
  document.getElementById("btn-location")?.addEventListener("click", getCurrentLocation);
  document.getElementById("btn-route")?.addEventListener("click", drawRoute);
  document.getElementById("btn-save")?.addEventListener("click", saveRide);
  document.getElementById("btn-logout")?.addEventListener("click", logoutUser);
}

// 🚪 Função de logout
function logoutUser() {
  firebase.auth().signOut()
    .then(() => {
      alert("Logout realizado com sucesso.");
      window.location.href = "login.html";
    })
    .catch(err => {
      console.error("Erro ao sair:", err);
      alert("Erro ao fazer logout.");
    });
}

// 📍 Localização
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

// 🗺️ Rota
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

// 💾 Salvar carona
function saveRide() {
  const origin = document.getElementById("origin")?.value.trim();
  const destination = document.getElementById("destination")?.value.trim();
  const schoolName = document.getElementById("school")?.value.trim();
  const seats = parseInt(document.getElementById("seats")?.value);

  if (!origin || !destination || !schoolName || isNaN(seats) || seats <= 0) {
    return alert("⚠️ Preencha todos os campos corretamente.");
  }

  if (!currentUser || !db) {
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

// 🧾 Listar caronas
function loadAvailableRides() {
  const list = document.getElementById("rides-list");
  if (!list || !db) return;

  db.collection("caronas").where("status", "==", "ativa")
    .onSnapshot(snapshot => {
      list.innerHTML = '<li class="collection-header"><h6>Caronas Ativas</h6></li>';
      snapshot.forEach(doc => {
        const carona = doc.data();

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
  if (!uid || !db) return alert("⚠️ Usuário não autenticado.");

  const ref = db.collection("caronas").doc(caronaId);

  ref.get().then(doc => {
    const data = doc.data();
    const jaSolicitado = (data.solicitacoes || []).some(s => s.uid === uid);

    if (jaSolicitado) {
      alert("⚠️ Você já solicitou esta carona.");
      return;
    }

    const solicitacao = {
      uid,
      status: "pendente",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    ref.update({
      solicitacoes: firebase.firestore.FieldValue.arrayUnion(solicitacao)
    }).then(() => {
      alert("🚗 Solicitação enviada com sucesso!");
    }).catch(err => {
      alert("❌ Erro ao solicitar carona: " + err.message);
    });
  });
}

// 📋 Minhas solicitações
function loadMyRequests() {
  const list = document.getElementById("my-requests");
  if (!list || !db) return;

  db.collection("caronas").where("status", "==", "ativa").onSnapshot(snapshot => {
    list.innerHTML = '<li class="collection-header"><h6>Solicitações realizadas</h6></li>';
    snapshot.forEach(doc => {
      const carona = doc.data();
      const solicitacao = (carona.solicitacoes || []).find(s => s.uid === currentUser.uid);
      if (solicitacao) {
        const li = document.createElement("li");
        li.className = "collection-item";
        li.innerHTML = `
          <strong>🏫 ${carona.escola}</strong><br>
          Origem: ${carona.origem}<br>
          Destino: ${carona.destino}<br>
          Status: <span class="status-label">${solicitacao.status}</span>
        `;
        list.appendChild(li);
      }
    });
  });
}

// ✅ AUTO LOGOUT POR INATIVIDADE
let inactivityTimeout;

function startInactivityTimer() {
  resetInactivityTimer();

  ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    alert("Sessão expirada por inatividade. Você será desconectado.");
    logoutUser();
  }, 60 * 60 * 1000); // 1 hora (3600000 ms)
}

// ✅ Exportar
window.initMap = initMap;
window.solicitarCarona = solicitarCarona;
