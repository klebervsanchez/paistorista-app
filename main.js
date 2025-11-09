// main.js
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    window.location.href = "app.html";
  } else {
    window.location.href = "login.html";
  }
});
