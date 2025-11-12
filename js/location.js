import { map } from './map.js';

export function getCurrentLocation() {
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
  }, () => alert("⚠️ Não foi possível obter a localização."));
}