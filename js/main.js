import { initMapCore } from './map.js';
import { initAuth, logoutUser } from './auth.js';
import { getCurrentLocation } from './location.js';
import { drawRoute, saveRide, loadAvailableRides, solicitarCarona } from './rides.js';
import { loadMyRequests } from './requests.js';

window.initMap = () => {
  initMapCore();

  initAuth(() => {
    if (document.getElementById("rides-list")) loadAvailableRides();
    if (document.getElementById("my-requests")) loadMyRequests();
  });

  document.getElementById("btn-location")?.addEventListener("click", getCurrentLocation);
  document.getElementById("btn-route")?.addEventListener("click", drawRoute);
  document.getElementById("btn-save")?.addEventListener("click", saveRide);
  document.getElementById("btn-logout")?.addEventListener("click", logoutUser);
};

window.solicitarCarona = solicitarCarona;