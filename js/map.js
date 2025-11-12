export let map, directionsService, directionsRenderer;

export function initMapCore() {
  const defaultPos = { lat: -23.55052, lng: -46.633308 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: defaultPos,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  const originInput = document.getElementById("origin");
  const destinationInput = document.getElementById("destination");

  if (originInput && destinationInput) {
    new google.maps.places.Autocomplete(originInput);
    new google.maps.places.Autocomplete(destinationInput);
  }
}