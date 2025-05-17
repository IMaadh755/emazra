// PWA Installation Prompt
let deferredPrompt;
const installButton = document.createElement('button');
installButton.innerHTML = 'Install 1st-Bite App';
installButton.className = 'btn btn-primary pwa-install-btn';
installButton.style.display = 'none';

// Add button to body (you can position it wherever you want)
document.body.appendChild(installButton);

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install button
  installButton.style.display = 'block';
  
  // Create and show a custom install prompt
  showInstallPromotion();
});

installButton.addEventListener('click', () => {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  }
});

// Show a beautiful install promotion
function showInstallPromotion() {
  // Create a modal for install promotion
  const installModal = document.createElement('div');
  installModal.className = 'pwa-install-modal';
  installModal.innerHTML = `
    <div class="pwa-install-content">
      <div class="pwa-install-header">
        <img src="https://imaadh755.github.io/emazra/icons/icon-192x192.png" alt="1st-Bite" class="pwa-install-icon">
        <h3>Install 1st-Bite</h3>
      </div>
      <div class="pwa-install-body">
        <p>Get the best food review experience with our app!</p>
        <div class="pwa-install-features">
          <div class="feature">
            <i class="fas fa-bolt"></i>
            <span>Fast & Reliable</span>
          </div>
          <div class="feature">
            <i class="fas fa-home"></i>
            <span>Home Screen Access</span>
          </div>
        </div>
      </div>
      <div class="pwa-install-footer">
        <button class="btn btn-outline-secondary" id="pwa-install-later">Maybe Later</button>
        <button class="btn btn-primary" id="pwa-install-now">Install Now</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(installModal);
  
  // Add event listeners
  document.getElementById('pwa-install-now').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        installModal.remove();
      });
    }
  });
  
  document.getElementById('pwa-install-later').addEventListener('click', () => {
    installModal.remove();
  });
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful');
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

/* Online/Offline Detection */
window.addEventListener('online', () => {
  document.querySelector('.offline-status').style.display = 'none';
});

window.addEventListener('offline', () => {
  document.querySelector('.offline-status').style.display = 'block';
});

// Add offline status element
const offlineStatus = document.createElement('div');
offlineStatus.className = 'offline-status';
offlineStatus.textContent = 'Offline Mode';
document.body.appendChild(offlineStatus);
