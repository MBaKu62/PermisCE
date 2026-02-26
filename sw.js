"icons": [
  {
      "src": "https://www.pwabuilder.com/assets/icons/icon_512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
  }
]
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(assetsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker enregistré'))
    .catch(err => console.log('Erreur Service Worker', err));
}
});

