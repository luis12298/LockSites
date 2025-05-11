//script.js
document.addEventListener("DOMContentLoaded", () => {

   const resetButton = document.getElementById("reset");
   const resetAllButton = document.getElementById("resetAll");
   const addAndUnlockButton = document.getElementById("addAndUnlock");
   const btnBlocknow = document.getElementById("btnBlocknow");
   const keymaster = "Admin";
   // Cargar la lista actual de blacklistconst resetAllButton = document.getElementById("resetAll");
   const messageDiv = document.querySelector(".Mensaje");

   loadBlacklist(); // Cargar la blacklist al cargar la página

   // Bloquear el sitio actual
   // Bloquear el sitio actual
   btnBlocknow.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs.length === 0) return;
         const currentTab = tabs[0];

         // Enviar un mensaje al background.js para eliminar el localStorage
         chrome.runtime.sendMessage({ action: "unlockSite" }, (response) => {
            if (response && response.success) {
               console.log(response.message);
               chrome.tabs.reload(currentTab.id); // Recargar la pestaña
            } else {
               alert(response.message || "Error al desbloquear el sitio.");
            }
         });
      });
   });

   addAndUnlockButton.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs.length === 0) return;
         const currentUrl = new URL(tabs[0].url).hostname;

         chrome.storage.local.get(["blacklist", "password"], (result) => {
            let blacklist = result.blacklist || [];
            const storedPassword = result.password;

            // Verificar si el sitio ya está en la lista negra
            if (!blacklist.includes(currentUrl)) {
               // Si no está en la lista negra, agregarlo
               blacklist.push(currentUrl);
               chrome.storage.local.set({ blacklist }, () => {
                  alert(`El sitio ${currentUrl} ha sido agregado a la lista negra.\n Bloqueo automatico en 1 minuto`);

                  loadBlacklist(); // Recargar la lista de sitios bloqueados
               });
            } else {
               // Si está en la lista negra, desbloquearlo
               if (confirm(`El sitio ${currentUrl} ya está en la lista negra. ¿Quieres desbloquearlo?`)) {
                  // Si hay una contraseña, desbloquearlo
                  if (storedPassword) {
                     const password = prompt("Introduce la contraseña:");
                     if (password === storedPassword) {
                        blacklist = blacklist.filter((site) => site !== currentUrl);
                        chrome.storage.local.set({ blacklist }, () => {
                           alert(`El sitio ${currentUrl} ha sido desbloqueado.`);
                           loadBlacklist(); // Recargar la lista de sitios bloqueados
                        });
                     } else {
                        alert("Contraseña incorrecta.");
                     }
                  } else {
                     alert("No hay contraseña configurada.");
                  }
               }
            }
         });
      });
   });
   // Vaciar todos los datos de chrome.storage.local
   resetAllButton.addEventListener("click", () => {
      if (confirm("¿Estás seguro de que quieres borrar todos los datos (lista negra y contraseña)?")) {
         chrome.storage.local.clear(() => {
            alert("Todos los datos han sido eliminados.");
            messageDiv.innerHTML = "No hay datos guardados.";
         });
      }
   });
   function loadBlacklist() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs.length === 0) return;
         const currentUrl = new URL(tabs[0].url).hostname;

         chrome.storage.local.get(["blacklist", "password"], (result) => {
            const blacklist = result.blacklist || [];

            if (blacklist.includes(currentUrl)) {

               addAndUnlockButton.innerHTML = "Desbloquear " + currentUrl;
            } else {
               addAndUnlockButton.innerHTML = "Bloquear";
            }
         }
         );
      });
      chrome.storage.local.get(["blacklist"], (result) => {
         const blacklist = result.blacklist || [];

         messageDiv.innerHTML = blacklist.length
            ? "Sitios bloqueados:<br>" + blacklist.join("<br>")
            : "No hay sitios bloqueados.";
      });
   }



   // Resetear la contraseña
   resetButton.addEventListener("click", () => {
      chrome.storage.local.get(["blacklist", "password"], (result) => {
         const storedPassword = result.password;

         // Si hay una contraseña, resetear
         if (storedPassword) {
            pass = prompt("Introduce la contraseña maestra:");
            if (pass === keymaster) {
               chrome.storage.local.set({ password: "" }, () => {
                  alert("La contraseña ha sido eliminada.");
               });
            } else {
               alert("Contraseña incorrecta.");
            }

         } else {
            if (confirm("No hay contraseña configurada. ¿Quieres configurar una?")) {
               const password = prompt("Introduce la nueva contraseña:");
               if (password) {
                  chrome.storage.local.set({ password }, () => {
                     alert("La contraseña ha sido configurada.");
                  });
               }
            }

         }
      });
   });

}
);
