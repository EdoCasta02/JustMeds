document.addEventListener("DOMContentLoaded", () => {
  fetchLoginStatus().then((data) => {
    if (data.isLoggedIn) {
      if (data.userRole === 'admin') {
        window.location.href = '../admin/admin.html'; 
      } else {
        addCartIcon();
        setupLogoutLink();
      }
    }
  });
});


function addCartIcon() {
  const navBar = document.querySelector(".navbar-nav");
  const cartIconLink = document.createElement("a");
  cartIconLink.className = "nav-link";
  cartIconLink.href = "/order/cart.html"; 
  cartIconLink.id = "cartIconLink";
  const icon = document.createElement("i");
  icon.className = "fas fa-shopping-cart";
  cartIconLink.appendChild(icon);
  const cartName = document.createElement("span");
  cartName.textContent = " Carrello";
  cartIconLink.appendChild(cartName);

  navBar.appendChild(cartIconLink);
}

function setupLogoutLink() {
  const navBar = document.querySelector(".navbar-nav");
  const logoutLink = document.createElement("a");
  logoutLink.className = "nav-link";
  logoutLink.href = "/api/v1/logout";
  logoutLink.textContent = "Logout";
  navBar.appendChild(logoutLink);
}

function fetchLoginStatus() {
  return fetch("/api/v1/check-login", { credentials: "include" })
    .then((response) => response.json())
    .then((data) => {
      return data; 
    })
    .catch((error) => {
      console.error("Error fetching login status:", error);
      throw error;
    });
}

document.addEventListener("DOMContentLoaded", function () {
  function showSection(sectionId) {
    document.querySelectorAll("#content > div").forEach(section => {
      section.classList.add("hidden");
    });
    document.getElementById(sectionId).classList.remove("hidden");

    if (sectionId === 'impostazioniSection') {
      loadProfile();
    } else if (sectionId === 'orderSection') {
      loadOrders();
    } else if (sectionId === 'formSection') {
      loadForms();
    }
  }

  async function loadForms() {
    try {
      const response = await fetch('/api/v1/forms', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Errore durante il caricamento dei forms');
      }
      const forms = await response.json();
      const container = document.getElementById('formRequestsTable');
      container.innerHTML = '';

      if (!Array.isArray(forms) || forms.length === 0) {
        container.innerHTML = '<tr><td colspan="3">Nessuna richiesta trovata.</td></tr>';
        return;
      }

      forms.forEach((form, index) => {
        const formElement = document.createElement('tr');
        formElement.innerHTML = `
          <td>${index + 1}</td>
          <td>${form.message}</td>
          <td>${form.createdAt}</td>
          <td>${form.answer}</td>
          <td>${form.answeredAt || 'N/A'}</td>
        `;
        container.appendChild(formElement);
      });
    } catch (error) {
      console.error('Errore durante il caricamento delle forme:', error);
      const container = document.getElementById('formContainer');
      container.innerHTML = '<tr><td colspan="3">Errore durante il caricamento delle forme.</td></tr>';
    }
  }

  async function loadProfile() {
    try {
      const response = await fetch('/api/v1/profile', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Errore durante il caricamento del profilo');
      }
      const profile = await response.json();
      document.getElementById('profileEmail').textContent = profile.email;
      document.getElementById('profilePassword').textContent = '********';
      document.getElementById('profileName').textContent = profile.name;
      document.getElementById('profileSurname').textContent = profile.surname;
      document.getElementById('profileCity').textContent = profile.city;
      document.getElementById('profileCap').textContent = profile.cap;
      document.getElementById('profileProvince').textContent = profile.province;
      document.getElementById('profileAddress').textContent = profile.address;
    } catch (error) {
      console.error('Errore durante il caricamento del profilo:', error);
    }
  }

  function showChangePassword() {
    document.getElementById('changePasswordSection').classList.remove('hidden');
}

function changePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (oldPassword && newPassword) {
        fetch('/api/v1/editpassword', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ oldPassword, newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Password aggiornata con successo') {
                alert('Password aggiornata con successo');
                document.getElementById('changePasswordSection').classList.add('hidden');
                document.getElementById('profilePassword').innerText = '********';
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Errore durante l\'aggiornamento della password:', error);
            alert('Errore durante l\'aggiornamento della password');
        });
    } else {
        alert('Inserisci la vecchia e la nuova password.');
    }
}


  async function loadOrders() {
    try {
      const response = await fetch('/api/v1/ordini', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Errore durante il caricamento degli ordini');
      }
      const orders = await response.json();
      const ongoingContainer = document.getElementById('ongoingOrders');
      const historicalContainer = document.getElementById('historicalOrders');
      ongoingContainer.innerHTML = '';
      historicalContainer.innerHTML = '';

      if (!Array.isArray(orders) || orders.length === 0) {
        ongoingContainer.innerHTML = '<tr><td colspan="8">Nessun ordine trovato.</td></tr>';
        return;
      }

      const createOrderElement = (order, index) => {
        const totalOrderPrice = order.prodotti.reduce((total, product) => total + (product.prezzo * product.quantita), 0);
        const orderElement = document.createElement('tr');
        let rowClass = '';
        let actions = '';

        switch(order.stato) {
          case 'confermato':
            rowClass = 'table-success';
            break;
          case 'accettato':
            rowClass = 'table-warning';
            actions = `<button class="btn btn-primary" onclick='window.location.href="../pagamento/pagamento.html?orderId=${order._id}"'>Pagamento</button>`;
            break;
          case 'rifiutato':
            rowClass = 'table-danger';
            actions = `<button class="btn btn-danger" onclick='cancelOrder("${order._id}")'>Rimuovi</button>`;
            break;
          case 'attesa':
            rowClass = 'table-warning';
            break;
          case 'inviato':
            rowClass = 'table-secondary';
            break;
          case 'inconsegna':
            rowClass = 'table-info';
            break;
          case 'consegnato':
            rowClass = 'table-success';
            break;
          case 'cancellato':
            rowClass = 'table-danger';
            break;
        }

        orderElement.className = rowClass;
        orderElement.innerHTML = `
          <td>${index + 1}</td>
          <td>${order.stato}</td>
          <td>${order.prodotti.map(p => `${p._id.Farmaco} - ${p.quantita}`).join('<br>')}</td>
          <td>${order.prodotti.map(p => `€${(p.prezzo * p.quantita).toFixed(2)}`).join('<br>')}</td>
          <td>${order.farmaciaNome}</td>
          <td>${order.indirizzoCliente.città}, ${order.indirizzoCliente.cap}, ${order.indirizzoCliente.provincia}, ${order.indirizzoCliente.via}</td>
          <td>
            <button class="btn btn-secondary" onclick='indaga("${order._id}", "${order.farmaciaID}", ${totalOrderPrice.toFixed(2)}, ${order.prezzoFinale})'>Dettagli</button>
            ${actions}
          </td>
        `;
        return orderElement;
      };

      orders.forEach((order, index) => {
        const orderElement = createOrderElement(order, index);

        if (order.stato === 'consegnato' || order.stato === 'cancellato') {
          historicalContainer.appendChild(orderElement);
        } else {
          ongoingContainer.appendChild(orderElement);
        }
      });
    } catch (error) {
      console.error('Errore durante il caricamento degli ordini:', error);
      const container = document.getElementById('ongoingOrders');
      container.innerHTML = '<tr><td colspan="8">Errore durante il caricamento degli ordini.</td></tr>';
    }
  }

  async function cancelOrder(orderId) {
    try {
      const response = await fetch(`/api/v1/ordini/${orderId}/cancella`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Ordine cancellato con successo');
        loadOrders();
      } else {
        alert('Errore durante la cancellazione dell\'ordine');
      }
    } catch (error) {
      console.error('Errore durante la cancellazione dell\'ordine:', error);
    }
  }

  async function enableEditProfile() {
    document.getElementById('profileCity').contentEditable = true;
    document.getElementById('profileCap').contentEditable = true;
    document.getElementById('profileProvince').contentEditable = true;
    document.getElementById('profileAddress').contentEditable = true;
    document.getElementById('saveProfileBtn').classList.remove('hidden');
  }



  async function saveProfile() {
    const address = document.getElementById('profileAddress').textContent;
    const city = document.getElementById('profileCity').textContent;
    const cap = document.getElementById('profileCap').textContent;
    const province = document.getElementById('profileProvince').textContent;

    try {
      const response = await fetch('/api/v1/editprofile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ city, cap, province, address})
      });
      if (!response.ok) {
        throw new Error('Errore durante il salvataggio del profilo');
      }
      alert('Profilo aggiornato con successo');
      document.getElementById('profileAddress').contentEditable = false;
      document.getElementById('profileCity').contentEditable = false;
      document.getElementById('profileCap').contentEditable = false;
      document.getElementById('profileProvince').contentEditable = false;
      document.getElementById('saveProfileBtn').classList.add('hidden');
    } catch (error) {
      console.error('Errore durante il salvataggio del profilo:', error);
    }
  }



  function indaga(orderId, farmaciaId, totalPrice, finalPrice) {
    alert(`ID ordine: ${orderId}\nID farmacia: ${farmaciaId}\nPrezzo totale di riferimento: €${totalPrice}\nPrezzo totale finale: €${finalPrice}`);
  }
  

  showSection('orderSection');
  window.showSection = showSection;
  window.indaga = indaga;
  window.enableEditProfile = enableEditProfile;
  window.saveProfile = saveProfile;
  window.cancelOrder = cancelOrder;
  window.showChangePassword = showChangePassword;
  window.changePassword = changePassword;
});
