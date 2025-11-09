let map;
let directionsService;
let directionsRenderer;

function initMap() {
  // Posição padrão caso geolocalização falhe
  const defaultPos = { lat: -23.55052, lng: -46.633308 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // ✅ Autocomplete nos campos de origem e destino
  const originInput = document.getElementById("origin");
  const destinationInput = document.getElementById("destination");

  const autocompleteOrigin = new google.maps.places.Autocomplete(originInput);
  const autocompleteDestination = new google.maps.places.Autocomplete(destinationInput);

  // 📍 Botão de localização atual
  document.getElementById("btn-location").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Centraliza o mapa e adiciona marcador
        map.setCenter(currentPos);
        new google.maps.Marker({
          position: currentPos,
          map: map,
          title: "Sua localização"
        });

        // 🧭 Geocoder reverso: coordenadas -> endereço
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: currentPos }, (results, status) => {
          if (status === "OK") {
            if (results[0]) {
              document.getElementById("origin").value = results[0].formatted_address;
            } else {
              alert("Endereço não encontrado.");
            }
          } else {
            alert("Erro ao obter endereço: " + status);
          }
        });

      },
      () => alert("Erro ao obter localização.")
    );
  } else {
    alert("Geolocalização não suportada.");
  }
});


  // 🧭 Botão traçar rota
  document.getElementById("btn-route").addEventListener("click", () => {
    const origem = originInput.value;
    const destino = destinationInput.value;

    if (!origem || !destino) {
      alert("Preencha origem e destino!");
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

  // 💾 Botão salvar (simulado)
  document.getElementById("btn-save").addEventListener("click", () => {
    const origem = originInput.value;
    const destino = destinationInput.value;
    alert(`Carona salva!\nOrigem: ${origem}\nDestino: ${destino}`);
  });

  // 🔒 Botão logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      window.location.href = "login.html";
    });
  });
}

