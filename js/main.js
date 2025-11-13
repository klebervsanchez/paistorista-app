// js/main.js

// Importações do Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Função de logout (comum)
export async function logoutUser() {
  try {
    await auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    alert('⚠️ Erro ao sair: ' + error.message);
  }
}

// Função comum para mostrar/esconder loading
function showLoading(show) {
  const loading = document.getElementById('loading');
  const main = document.querySelector('main');
  if (loading && main) {
    loading.style.display = show ? 'block' : 'none';
    main.style.display = show ? 'none' : 'block';
  }
}

// Lógica geral: Espera auth state em todas as páginas protegidas
document.addEventListener('DOMContentLoaded', () => {
  showLoading(true);  // Mostra loading inicialmente
  M.AutoInit();  // Inicializa Materialize

  auth.onAuthStateChanged(async user => {
    if (!user) {
      showLoading(false);
      window.location.href = 'login.html';
      return;
    }

    // Usuário logado: Carrega dados específicos da página
    if (window.location.pathname.endsWith('passageiro.html')) {
      await loadPassengerPage(user);
    } else if (window.location.pathname.endsWith('app.html')) {
      await loadDriverPage(user);
    }

    showLoading(false);  // Esconde loading após carregar
  });
});

// Função para carregar página de passageiro
async function loadPassengerPage(user) {
  const schoolList = document.getElementById('school-list');
  const ridesList = document.getElementById('rides-list');
  const myRequests = document.getElementById('my-requests');

  // Listener em tempo real para caronas, para extrair escolas únicas
  db.collection('caronas').onSnapshot(snapshot => {
    const schools = new Set(); // Usar Set para nomes únicos de escolas
    snapshot.forEach(doc => {
      const ride = doc.data();
      if (ride.escola && ride.vagas > 0) {
        schools.add(ride.escola); // Adiciona nome da escola se houver vagas
      }
    });

    // Limpa e popula lista de escolas
    schoolList.innerHTML = '<li class="collection-header"><h6>Lista de Escolas</h6></li>';
    schools.forEach(schoolName => {
      const li = document.createElement('li');
      li.classList.add('collection-item');
      li.innerHTML = `
        <div>${schoolName} <span class="secondary-content"><i class="material-icons">school</i></span></div>
      `;
      li.addEventListener('click', () => loadRidesForSchool(schoolName));
      schoolList.appendChild(li);
    });
  });

  let unsubscribeRides; // Para cancelar listener anterior de caronas

  // Função para carregar e escutar caronas de uma escola específica em tempo real (por nome da escola)
  function loadRidesForSchool(schoolName) {
    if (unsubscribeRides) unsubscribeRides(); // Cancela listener anterior

    ridesList.innerHTML = '<li class="collection-header"><h6>Caronas para esta escola</h6></li>'; // Limpa lista

    unsubscribeRides = db.collection('caronas')
      .where('escola', '==', schoolName)
      .where('vagas', '>', 0)
      .onSnapshot(snapshot => {
        // Limpa itens existentes (exceto header)
        while (ridesList.children.length > 1) {
          ridesList.removeChild(ridesList.lastChild);
        }

        snapshot.forEach(doc => {
          const ride = doc.data();
          const li = document.createElement('li');
          li.classList.add('collection-item');
          li.innerHTML = `
            <div>Motorista: ${ride.motorista} | Vagas: ${ride.vagas}
              <a href="#!" class="secondary-content" onclick="requestRide('${doc.id}')"><i class="material-icons">add_circle</i></a>
            </div>
          `;
          ridesList.appendChild(li);
        });
      });
  }

  // Função para solicitar carona
  window.requestRide = async function(rideId) {
    try {
      // Adiciona solicitação como documento separado
      await db.collection('solicitacoes').add({
        passageiroId: user.uid,
        rideId,
        status: 'pendente',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Atualiza a carona para decrementar vagas (opcional, se quiser gerenciar vagas)
      const rideRef = db.collection('caronas').doc(rideId);
      await db.runTransaction(async (transaction) => {
        const rideDoc = await transaction.get(rideRef);
        if (!rideDoc.exists) throw "Carona não existe";
        const newVagas = rideDoc.data().vagas - 1;
        if (newVagas < 0) throw "Sem vagas disponíveis";
        transaction.update(rideRef, { vagas: newVagas });
      });

      alert('✅ Solicitação enviada!');
    } catch (error) {
      alert('⚠️ Erro ao solicitar: ' + error.message);
    }
  };

  // Listener em tempo real para minhas solicitações
  db.collection('solicitacoes')
    .where('passageiroId', '==', user.uid)
    .onSnapshot(snapshot => {
      myRequests.innerHTML = '<li class="collection-header"><h6>Solicitações realizadas</h6></li>'; // Limpa

      snapshot.forEach(doc => {
        const req = doc.data();
        const li = document.createElement('li');
        li.classList.add('collection-item');
        li.innerHTML = `Carona ID: ${req.rideId} | Status: ${req.status}`;
        myRequests.appendChild(li);
      });
    });
}

// Função para carregar página de motorista
async function loadDriverPage(user) {
  let map, directionsService, directionsRenderer, geocoder, currentMarker;

  // Inicializa o mapa (callback do Google Maps)
  window.initMap = function() {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: { lat: -23.5505, lng: -46.6333 } // Centro padrão (São Paulo)
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    geocoder = new google.maps.Geocoder(); // Inicializa o Geocoder
  };

  if (typeof window.initMap === 'function') window.initMap();

  // Botão para usar localização atual como origem
  document.getElementById('btn-location').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const latlng = new google.maps.LatLng(latitude, longitude);

        // Usa reverse geocoding para obter o endereço
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK') {
            if (results[0]) {
              document.getElementById('origin').value = results[0].formatted_address;
              M.updateTextFields(); // Atualiza label do Materialize

              // Atualiza o mapa: centraliza e adiciona marcador
              map.setCenter(latlng);
              map.setZoom(15); // Aumenta o zoom para focar na localização

              // Remove marcador anterior se existir
              if (currentMarker) {
                currentMarker.setMap(null);
              }

              // Adiciona novo marcador
              currentMarker = new google.maps.Marker({
                position: latlng,
                map: map,
                title: 'Localização Atual'
              });
            } else {
              alert('⚠️ Nenhum resultado encontrado.');
            }
          } else {
            alert('⚠️ Erro no geocoding: ' + status);
          }
        });
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

  // Botão para salvar carona (ajustado para estrutura do seu Firebase)
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
      await db.collection('caronas').add({
        escola: school,  // Salva como string (nome da escola)
        motorista: user.displayName,
        uid: user.uid,
        vagas: seats,
        vagasDisponiveis: seats,  // Campo extra se precisar
        origem: origin,
        destino: destination,
        dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'ativa',
        solicitacoes: []  // Inicializa como array vazio para solicitações
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
}

// Listener de logout
document.getElementById('btn-logout')?.addEventListener('click', logoutUser);
