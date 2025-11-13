// js/main.js

// Importações do Firebase (já configurado em firebase-config.js, que é carregado antes)
const auth = firebase.auth();
const db = firebase.firestore();

// Função de logout (comum a todas as páginas)
export async function logoutUser() {
  try {
    await auth.signOut();
    window.location.href = 'login.html'; // Redireciona para login após logout
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    alert('⚠️ Erro ao sair: ' + error.message);
  }
}

// Funções específicas para passageiro.html
if (window.location.pathname.endsWith('passageiro.html')) {
  document.addEventListener('DOMContentLoaded', async () => {
    M.AutoInit(); // Inicializa componentes do Materialize (ex.: selects, modals)

    const user = auth.currentUser;
    if (!user) {
      window.location.href = 'login.html'; // Garante que usuário esteja logado
      return;
    }

    // Carregar lista de escolas (assumindo coleção 'escolas' no Firestore)
    const schoolList = document.getElementById('school-list');
    const schoolsSnapshot = await db.collection('escolas').get();
    schoolsSnapshot.forEach(doc => {
      const school = doc.data();
      const li = document.createElement('li');
      li.classList.add('collection-item');
      li.innerHTML = `
        <div>${school.nome} <span class="secondary-content"><i class="material-icons">school</i></span></div>
      `;
      li.addEventListener('click', () => loadRidesForSchool(doc.id)); // Clique para carregar caronas
      schoolList.appendChild(li);
    });

    // Função para carregar caronas de uma escola específica (coleção 'caronas' com filtro por escolaId)
    async function loadRidesForSchool(schoolId) {
      const ridesList = document.getElementById('rides-list');
      ridesList.innerHTML = '<li class="collection-header"><h6>Caronas para esta escola</h6></li>'; // Limpa lista

      const ridesSnapshot = await db.collection('caronas')
        .where('escolaId', '==', schoolId)
        .where('vagas', '>', 0) // Apenas caronas com vagas disponíveis
        .get();

      ridesSnapshot.forEach(doc => {
        const ride = doc.data();
        const li = document.createElement('li');
        li.classList.add('collection-item');
        li.innerHTML = `
          <div>Motorista: ${ride.motoristaNome} | Vagas: ${ride.vagas}
            <a href="#!" class="secondary-content" onclick="requestRide('${doc.id}')"><i class="material-icons">add_circle</i></a>
          </div>
        `;
        ridesList.appendChild(li);
      });
    }

    // Função para solicitar carona (salva na coleção 'solicitacoes')
    window.requestRide = async function(rideId) {
      try {
        await db.collection('solicitacoes').add({
          passageiroId: user.uid,
          rideId,
          status: 'pendente',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Solicitação enviada!');
        loadMyRequests(); // Atualiza lista de solicitações
      } catch (error) {
        alert('⚠️ Erro ao solicitar: ' + error.message);
      }
    };

    // Carregar minhas solicitações
    async function loadMyRequests() {
      const myRequests = document.getElementById('my-requests');
      myRequests.innerHTML = '<li class="collection-header"><h6>Solicitações realizadas</h6></li>'; // Limpa

      const requestsSnapshot = await db.collection('solicitacoes')
        .where('passageiroId', '==', user.uid)
        .get();

      requestsSnapshot.forEach(doc => {
        const req = doc.data();
        const li = document.createElement('li');
        li.classList.add('collection-item');
        li.innerHTML = `Carona ID: ${req.rideId} | Status: ${req.status}`;
        myRequests.appendChild(li);
      });
    }

    loadMyRequests(); // Carrega ao iniciar
  });
}

// Funções específicas para app.html (motorista)
if (window.location.pathname.endsWith('app.html')) {
  let map, directionsService, directionsRenderer;

  // Inicializa o mapa (callback do Google Maps)
  window.initMap = function() {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: { lat: -23.5505, lng: -46.6333 } // Centro padrão (São Paulo, ajuste se necessário)
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
  };

  document.addEventListener('DOMContentLoaded', () => {
    M.AutoInit(); // Inicializa Materialize

    const user = auth.currentUser;
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Botão para usar localização atual como origem
    document.getElementById('btn-location').addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          const { latitude, longitude } = position.coords;
          document.getElementById('origin').value = `${latitude}, ${longitude}`;
          M.updateTextFields(); // Atualiza label do Materialize
        }, error => {
          alert('⚠️ Erro ao obter localização: ' + error.message);
        });
      } else {
        alert('⚠️ Geolocalização não suportada.');
      }
    });

    // Botão para traçar rota
    document.getElementById('btn-route').addEventListener('click', () => {
      const origin = document.getElementById('origin').value;
      const destination = document.getElementById('destination').value;
      if (!origin || !destination) {
        alert('⚠️ Preencha origem e destino.');
        return;
      }

      directionsService.route({
        origin,
        destination,
        travelMode: 'DRIVING'
      }, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          alert('⚠️ Erro ao traçar rota: ' + status);
        }
      });
    });

    // Botão para salvar carona
    document.getElementById('btn-save').addEventListener('click', async () => {
      const school = document.getElementById('school').value;
      const seats = parseInt(document.getElementById('seats').value);
      const origin = document.getElementById('origin').value;
      const destination = document.getElementById('destination').value;

      if (!school || !seats || !origin || !destination) {
        alert('⚠️ Preencha todos os campos.');
        return;
      }

      try {
        // Salva escola se não existir (opcional, assumindo coleção 'escolas')
        const schoolRef = await db.collection('escolas').add({ nome: school });

        // Salva carona
        await db.collection('caronas').add({
          escolaId: schoolRef.id,
          motoristaId: user.uid,
          motoristaNome: user.displayName,
          vagas: seats,
          origem: origin,
          destino: destination,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Carona salva com sucesso!');
        // Limpa formulário
        document.getElementById('school').value = '';
        document.getElementById('seats').value = '';
        document.getElementById('origin').value = '';
        document.getElementById('destination').value = '';
        M.updateTextFields();
      } catch (error) {
        alert('⚠️ Erro ao salvar: ' + error.message);
      }
    });
  });
}

// Adiciona listener de logout (já referenciado nos HTMLs)
document.getElementById('btn-logout')?.addEventListener('click', logoutUser);
