const $eleOffline = document.getElementById('offline');
const offlineAttrib = 'data-offline'

window.addEventListener("offline", function () {
  $eleOffline.setAttribute(offlineAttrib, true);
  $eleOffline.classList.add('is-true');
});

window.addEventListener("online", function () {
  $eleOffline.setAttribute(offlineAttrib, false);
  $eleOffline.classList.remove('is-true');
  self.navigator.serviceWorker.ready
    .then(
      register => {
        register.sync.register('syncDb')
      }
    )
});
