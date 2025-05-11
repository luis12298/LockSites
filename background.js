(function () {
   // Limpiar cualquier estado de desbloqueo al cargar la página
   sessionStorage.removeItem("siteUnlocked");

   // Obtener la lista de sitios bloqueados y la contraseña almacenada
   chrome.storage.local.get(["blacklist", "password"], (result) => {
      const blacklist = result.blacklist || [];
      const storedPassword = result.password;

      if (!blacklist.length) return; // No hay sitios bloqueados, salir

      const currentUrl = window.location.hostname.toLowerCase().trim();

      // Verificar si la URL actual está en la lista negra
      if (blacklist.some(site => currentUrl.includes(site))) {
         // Verificar si ya se ingresó la contraseña en esta sesión
         if (sessionStorage.getItem("siteUnlocked") === "true") {
            console.log("Acceso permitido en esta sesión.");
            createFloatingButton();
            setupKeyboardShortcut();
            return;
         }

         // Si hay contraseña guardada, solicitarla
         if (storedPassword) {
            const userPassword = prompt("Este sitio está bloqueado. Ingrese la contraseña para continuar:");

            if (userPassword !== storedPassword) {
               alert("Contraseña incorrecta...");
               window.location.reload();
            } else {
               alert("Acceso concedido (solo para esta sesión).");

               // Guardar en sessionStorage en lugar de localStorage
               sessionStorage.setItem("siteUnlocked", "true");

               createFloatingButton();
               setupKeyboardShortcut();

               // Establecer un temporizador para eliminar el estado de desbloqueo después de 5 minutos
               setTimeout(() => {
                  sessionStorage.removeItem("siteUnlocked");
                  console.log("El desbloqueo ha expirado después de 5 minutos.");
                  window.location.reload();
               }, 5 * 60 * 1000);
            }
         } else {
            alert("No hay contraseña configurada. No se puede desbloquear.");
            window.location.replace("about:blank");
         }
      }
   });

   // [El resto del código permanece igual...]
   function setupKeyboardShortcut() {
      document.addEventListener('keydown', function (event) {
         if (event.ctrlKey && event.shiftKey && event.keyCode === 76) {
            event.preventDefault();
            lockSiteNow();
         }
      });
   }

   function lockSiteNow() {
      sessionStorage.removeItem("siteUnlocked");
      window.location.reload();
   }

   function createFloatingButton() {
      if (document.getElementById('site-blocker-button')) return;

      const button = document.createElement('button');
      button.id = 'site-blocker-button';
      button.textContent = '🔒 Bloquear ahora (Ctrl + ⇧ + L)';

      // [Estilos permanecen igual...]

      button.addEventListener('click', () => {
         if (confirm("¿Está seguro de que desea bloquear el sitio ahora?")) {
            lockSiteNow();
         }
      });

      document.body.appendChild(button);
   }

   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "unlockSite") {
         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
               sendResponse({ success: false, message: "No hay pestañas activas." });
               return;
            }

            const currentTab = tabs[0];
            chrome.scripting.executeScript({
               target: { tabId: currentTab.id },
               function: () => {
                  sessionStorage.removeItem("siteUnlocked");
               }
            }, () => {
               if (chrome.runtime.lastError) {
                  console.error('Error al ejecutar el script:', chrome.runtime.lastError);
                  sendResponse({ success: false, message: "Error al eliminar sessionStorage." });
               } else {
                  sendResponse({ success: true, message: "Sitio desbloqueado correctamente." });
               }
            });
         });
         return true;
      }
   });

})();