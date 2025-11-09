let map;
let directionsService;
let directionsRenderer;

function initMap() {
  const defaultPos = { lat: -23.55052, lng: -46.633308 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // ✅ Autocomplete com Google Places
  const originInput = document.getElementById("origin");
  const destinationInput = document.getElementById("destination");

  new google.maps.places.Autocomplete(originInput);
  new google.maps.places.Autocomplete(destinationInput);

  // 📍 Localização atual + geocoder reverso
  const btnLocation = document.getElementById("btn-location");
  if (btnLocation) {
    btnLocation.addEventListener("click", () => {
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
              map,
              title: "Sua localização"
            });

            // Obter endereço da coordenada
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: currentPos }, (results, status) => {
              if (status === "OK" && results[0]) {
                originInput.value = results[0].formatted_address;
              } else {
                alert("Não foi possível encontrar o endereço.");
              }
            });
          },
          error => {
            alert("Erro ao obter localização: " + error.message);
          }
        );
      } else {
        alert("Geolocalização não suportada neste navegador.");
      }
    });
  }

  // 🗺️ Traçar rota
  const btnRoute = document.getElementById("btn-route");
  if (btnRoute) {
    btnRoute.addEventListener("click", () => {
      const origem = originInput.value.trim();
      const destino = destinationInput.value.trim();

      if (!origem || !destino) {
        alert("Preencha os campos de origem e destino.");
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
          alert("Erro ao traçar rota: " + status);
        }
      });
    });
  }

  // 💾 Simular salvar carona
  const btnSave = document.getElementById("btn-save");
  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const origem = originInput.value;
      const destino = destinationInput.value;
      alert(`🚘 Carona salva!\nOrigem: ${origem}\nDestino: ${destino}`);
    });
  }

  // 🔒 Logout (corrigido)
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
          .then(() => {
            console.log("Logout realizado.");
            window.location.href = "login.html";
          })
          .catch(error => {
            console.error("Erro ao sair:", error);
            alert("Erro ao sair: " + error.message);
          });
      } else {
        alert("Firebase não carregado corretamente.");
      }
    });
  }
}
