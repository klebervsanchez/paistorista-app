let map;
let directionsService;
let directionsRenderer;
let markers = [];

function initMap() {
  const defaultPos = { lat: -23.55052, lng: -46.633308 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // 🔄 Autocomplete nos inputs
  new google.maps.places.Autocomplete(document.getElementById("origin"));
  new google.maps.places.Autocomplete(document.getElementById("destination"));

  // 📍 Localização atual
  document.getElementById("btn-location").addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          map.setCenter(pos);
          new google.maps.Marker({ position: pos, map, title: "Você está aqui" });
          document.getElementById("origin").value = `${pos.lat}, ${pos.lng}`;
        },
        () => alert("Não foi possível obter sua localização.")
      );
    } else {
      alert("Geolocalização não suportada.");
    }
  });

  // 🗺️ Traçar rota
  document.getElementById("btn-route").addEventListener("click", () => {
    const origem = document.getElementById("origin").value;
    const destino = document.getElementById("destination").value;

    if (!origem || !destino) {
      M.toast({ html: "Preencha origem e destino!" });
      return;
    }

    const request = {
      origin: origem,
      destination: destino,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        alert("Não foi possível traçar a rota.");
      }
    });
  });

  // 💾 Salvar carona
  document.getElementById("btn-save").addEventListener("click", () => {
    const origem = document.getElementById("origin").value;
    const destino = document.getElementById("destination").value;

    if (!origem || !destino) return;

    firebase.firestore().collection("caronas").add({
      origem,
      destino,
      data: new Date(),
      user: firebase.auth().currentUser.email,
    }).then(() => {
      M.toast({ html: "Carona salva!" });
      loadRides(); // Atualizar mapa
    });
  });

  // 🚪 Logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      window.location.href = "login.html";
    });
  });

  // 📦 Carregar caronas salvas
  loadRides();
}

function loadRides() {
  // Limpa marcadores antigos
  markers.forEach(m => m.setMap(null));
  markers = [];

  firebase.firestore().collection("caronas").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: data.origem }, (results, status) => {
        if (status === "OK") {
          const marker = new google.maps.Marker({
            position: results[0].geometry.location,
            map,
            title: `Origem: ${data.origem}\nDestino: ${data.destino}`,
            icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });
          markers.push(marker);
        }
      });
    });
  });
}
