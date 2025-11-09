let map, directionsService, directionsRenderer;

function initMap() {
  const defaultPos = { lat: -23.55052, lng: -46.633308 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 14,
  });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  new google.maps.places.Autocomplete(document.getElementById("origin"));
  new google.maps.places.Autocomplete(document.getElementById("destination"));

  document.getElementById("btn-location").addEventListener("click", usarLocalizacaoAtual);
  document.getElementById("btn-route").addEventListener("click", traçarRota);
  document.getElementById("btn-save").addEventListener("click", salvarCarona);
  document.getElementById("btn-logout").addEventListener("click", sair);
}

function usarLocalizacaoAtual() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(pos);
      new google.maps.Marker({ position: pos, map, title: "Você está aqui" });

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: pos }, (results, status) => {
        if (status === "OK" && results[0]) {
          document.getElementById("origin").value = results[0].formatted_address;
        } else {
          alert("Endereço não encontrado.");
        }
      });
    });
  }
}

function traçarRota() {
  const origem = document.getElementById("origin").value;
  const destino = document.getElementById("destination").value;
  if (!origem || !destino) return alert("Preencha origem e destino.");

  const request = {
    origin: origem,
    destination: destino,
    travelMode: "DRIVING",
  };

  directionsService.route(request, (result, status) => {
    if (status === "OK") directionsRenderer.setDirections(result);
    else alert("Erro ao traçar rota: " + status);
  });
}

function salvarCarona() {
  const origem = document.getElementById("origin").value;
  const destino = document.getElementById("destination").value;
  const escola = document.getElementById("school").value;
  const vagas = parseInt(document.getElementById("vagas").value);
  const encontrosPermitidos = document.getElementById("encontrosPermitidos").checked;
  const user = firebase.auth().currentUser;

  if (!user) return alert("Usuário não autenticado.");
  if (!origem || !destino || !escola || !vagas) return alert("Preencha todos os campos.");

  db.collection("caronas").add({
    motorista: user.displayName,
    uid: user.uid,
    origem,
    destino,
    escola,
    vagas,
    vagasDisponiveis: vagas,
    encontrosPermitidos,
    status: "ativa",
    rotaCriadaEm: new Date()
  }).then(() => {
    M.toast({ html: "✅ Carona cadastrada com sucesso!" });
  }).catch(err => alert("Erro ao salvar carona: " + err.message));
}

function sair() {
  firebase.auth().signOut().then(() => window.location.href = "login.html");
}
