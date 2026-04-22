const CACHE_NAME = 'arvaabiisi-v2';

// Kaikki tiedostot, jotka tallennetaan puhelimen muistiin (välimuistiin)
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './kuva.png',
  // Paikalliset tietokantatiedostot (varmista, että nämä on ladattu GitHub-kansioon)
  './sessionSet01.js',
  './sessionSet02.js',
  './sessionSet03.js',
  './sessionSet04.js',
  './sessionSet05.js',
  './sessionSet06.js',
  './sessionSet07.js',
  './sessionSet08.js',
  './sessionSet09.js',
  './sessionSet10.js',
  './sessionSet11.js',
  './sessionSet12.js',
  './sessionSet13.js',
  './sessionSet14.js',
  './sessionSet15.js',
  './sessionSet16.js',
  './sessionSet17.js',
  './sessionSet18.js',
  './folkwikiSet1.js',
  './folkwikiSet2.js',
  './folkwikiSet3.js',
  './fsfolkdiktning01.js',
  './fsfolkdiktning02.js',
  './extrasetti5.js'
];

// 1. Asennusvaihe: Tallennetaan yllä olevat tiedostot välimuistiin
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Tallennetaan tiedostot välimuistiin...');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Aktivointi: Poistetaan vanhat välimuistit jos nimi muuttuu
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Poistetaan vanha välimuisti:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Pyyntöjen käsittely: Käytetään välimuistia jos mahdollista, muuten haetaan verkosta
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Palautetaan tiedosto välimuistista tai haetaan se verkosta
      return response || fetch(event.request);
    })
  );
});
