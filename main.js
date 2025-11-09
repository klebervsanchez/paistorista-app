let map;
let directionsService;
let directionsRenderer;

function initMap() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -23.5505, lng: -46.6333 }, // São Paulo
    zoom: 12
  });
  directionsRenderer.setMap(map);

  // 🔽 Autocomplete nos inputs
  const originInput = document.getElementById("origin");
  const destinationInput = document.getElementById("destination");

  new google.maps.places.Autocomplete(originInput);
  new google.maps.places.Autocomplete(destinationInput);
}

  // Posição padrão caso geolocalização falhe
  const defaultPos = { lat: -23.55052, lng: -46.633308 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // Botão de localização atual
  document.getElementById("btn-location").addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          map.setCenter(currentPos);
          new google.maps.Marker({
            position: currentPos,
            map: map,
            title: "Sua localização",
          });

          document.getElementById("origin").value =
            `${currentPos.lat}, ${currentPos.lng}`;
        },
        () => alert("Erro ao obter localização.")
      );
    } else {
      alert("Geolocalização não suportada.");
    }
  });

  // Botão traçar rota
  document.getElementById("btn-route").addEventListener("click", () => {
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

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        alert("Não foi possível traçar a rota.");
      }
    });
  });

  // Botão salvar (simulado)
  document.getElementById("btn-save").addEventListener("click", () => {
    const origem = document.getElementById("origin").value;
    const destino = document.getElementById("destination").value;
    alert(`Carona salva!\nOrigem: ${origem}\nDestino: ${destino}`);
  });

  // Botão logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      window.location.href = "login.html";
    });
  });
}

