import { currentUser, db } from './auth.js';
import { directionsService, directionsRenderer } from './map.js';

export function drawRoute() {
  const origin = document.getElementById("origin")?.value;
  const destination = document.getElementById("destination")?.value;

  if (!origin || !destination) return alert("⚠️ Preencha origem e destino.");

  directionsService.route({
    origin,
    destination,
    travelMode: 'DRIVING'
  }, (result, status) => {
    if (status === 'OK') {
      directionsRenderer.setDirections(result);
    } else {
      alert("❌ Erro ao traçar rota.");
    }
  });
}

export function saveRide() {
  const origin = document.getElementById("origin")?.value.trim();
  const destination = document.getElementById("destination")?.value.trim();
  const schoolName = document.getElementById("school")?.value.trim();
  const seats = parseInt(document.getElementById("seats")?.value);

  if (!origin || !destination || !schoolName || isNaN(seats) || seats <= 0) {
    return alert("⚠️ Preencha todos os campos corretamente.");
  }

  if (!currentUser || !db) {
    return alert("⚠️ Usuário não autenticado.");
  }

  db.collection("caronas").add({
    uid: currentUser.uid,
    motorista: currentUser.displayName || "Motorista",
    origem: origin,
    destino: destination,
    escola: schoolName,
    vagas: seats,
    vagasDisponiveis: seats,
    status: "ativa",
    solicitacoes: [],
    dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("✅ Carona cadastrada com sucesso!");
  }).catch(err => {
    alert("❌ Erro ao salvar carona: " + err.message);
  });
}

export function loadAvailableRides() {
  const list = document.getElementById("rides-list");
  if (!list || !db) return;

  db.collection("caronas").where("status", "==", "ativa")
    .onSnapshot(snapshot => {
      list.innerHTML = '<li class="collection-header"><h6>Caronas Ativas</h6></li>';
      snapshot.forEach(doc => {
        const carona = doc.data();
        if (carona.uid === currentUser?.uid) return;

        const li = document.createElement("li");
        li.className = "collection-item";
        li.innerHTML = `
          <strong>🏫 ${carona.escola}</strong><br>
          Origem: ${carona.origem}<br>
          Destino: ${carona.destino}<br>
          Vagas: ${carona.vagasDisponiveis}/${carona.vagas}<br>
          <button class="btn-small blue" onclick="solicitarCarona('${doc.id}')">Solicitar</button>
        `;
        list.appendChild(li);
      });
    });
}

export function solicitarCarona(caronaId) {
  const uid = currentUser?.uid;
  if (!uid || !db) return alert("⚠️ Usuário não autenticado.");

  const ref = db.collection("caronas").doc(caronaId);

  ref.get().then(doc => {
    const data = doc.data();
    const jaSolicitado = (data.solicitacoes || []).some(s => s.uid === uid);

    if (jaSolicitado) {
      alert("⚠️ Você já solicitou esta carona.");
      return;
    }

    const solicitacao = {
      uid,
      status: "pendente",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    ref.update({
      solicitacoes: firebase.firestore.FieldValue.arrayUnion(solicitacao)
    }).then(() => {
      alert("🚗 Solicitação enviada com sucesso!");
    }).catch(err => {
      alert("❌ Erro ao solicitar carona: " + err.message);
    });
  });
}