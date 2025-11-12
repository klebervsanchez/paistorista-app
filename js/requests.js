import { currentUser, db } from './auth.js';

export function loadMyRequests() {
  const list = document.getElementById("my-requests");
  if (!list || !db) return;

  db.collection("caronas").where("status", "==", "ativa").onSnapshot(snapshot => {
    list.innerHTML = '<li class="collection-header"><h6>Solicitações realizadas</h6></li>';
    snapshot.forEach(doc => {
      const carona = doc.data();
      const solicitacao = (carona.solicitacoes || []).find(s => s.uid === currentUser.uid);
      if (solicitacao) {
        const li = document.createElement("li");
        li.className = "collection-item";
        li.innerHTML = `
          <strong>🏫 ${carona.escola}</strong><br>
          Origem: ${carona.origem}<br>
          Destino: ${carona.destino}<br>
          Status: <span class="status-label">${solicitacao.status}</span>
        `;
        list.appendChild(li);
      }
    });
  });
}