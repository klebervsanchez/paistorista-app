let map, directionsService, directionsRenderer;

function initMap() {
  const defaultPos = { lat: -23.5505, lng: -46.6333 };
  map = new google.maps.Map(document.getElementById("map"), { zoom: 13, center: defaultPos });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  const originInput = document.getElementById("origin");
  new google.maps.places.Autocomplete(originInput);

  document.getElementById("btn-location").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setCenter(current);
      new google.maps.Marker({ map, position: current, title: "Sua localização" });

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: current }, (results, status) => {
        if (status === "OK") {
          originInput.value = results[0]?.formatted_address || "Localização atual";
        }
      });
    });
  });

  document.getElementById("btn-route").addEventListener("click", () => {
    const origin = originInput.value;
    const school = document.getElementById("school").value;
    if (!origin || !school) return alert("Preencha origem e destino");

    directionsService.route({
      origin: origin,
      destination: school,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === "OK") directionsRenderer.setDirections(result);
      else alert("Erro ao traçar rota");
    });
  });

  document.getElementById("btn-save").addEventListener("click", () => {
    const school = document.getElementById("school").value;
    const origin = originInput.value;
    const vagas = parseInt(document.getElementById("vagas").value || "0");

    const user = firebase.auth().currentUser;
    if (!user || !school || !origin || vagas <= 0) return alert("Preencha todos os campos corretamente.");

    firebase.firestore().collection("caronas").add({
      uid: user.uid,
      nomeMotorista: user.displayName,
      origem: origin,
      destino: school,
      vagasDisponiveis: vagas,
      vagasPreenchidas: 0,
      status: "ativa",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      M.toast({ html: "Carona oferecida com sucesso!" });
    });
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    firebase.auth().signOut().then(() => window.location.href = "login.html");
  });
}
