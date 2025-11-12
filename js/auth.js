export let currentUser = null;
export let db = null;

export function initAuth(onAuthSuccess) {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      db = firebase.firestore();
      onAuthSuccess();
    } else {
      window.location.href = "login.html";
    }
  });
}

export function logoutUser() {
  firebase.auth().signOut()
    .then(() => window.location.href = "login.html")
    .catch(err => alert("Erro ao fazer logout."));
}