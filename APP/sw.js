const CACHE_NAME = "permis-ce-cache-v1";
const urlsToCache = [
  "/index.html",
  "/css/style.css",
  "/js/script.js",
  "/acceuil/feuille-notation",
  "/fiche-ecrite/5.5",
  "/fiche-ecrite/50-km-h-remorque", 
  "/fiche-ecrite/70-5,5t", 
  "/fiche-ecrite/acces-interdit-explosif",  
  "/fiche-ecrite/accotement-meuble", 
  "/fiche-ecrite/arbres-inclines", 
  "/fiche-ecrite/carrefour-giratoire", 
  "/fiche-ecrite/descente-dangereuse", 
  "/fiche-ecrite/deviation", 
  "/fiche-ecrite/interdiction-de-tourner-a-gauche-vehicule-marchandise", 
  "/fiche-ecrite/interdiction-vehicule-plus-de-230-m", 
  "/fiche-ecrite/panneau_obligation_voie_bus", 
  "/fiche-ecrite/panneau-camion-interdiction-de-depasser", 
  "/fiche-ecrite/panneau-essieu", 
  "/fiche-ecrite/panneau-hauteur", 
  "/fiche-ecrite/polluant", 
  "/fiche-ecrite/transport-produit-dangereux", 
  "/fiche-ecrite/vehicule-10m", 
  "/fiche-ecrite/voie-de-detresse-a-droite", 
  "/icons/icon-192",
  "/icons/icon-512",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});