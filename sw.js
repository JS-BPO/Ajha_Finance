/* AJHA Finance — service worker (funcionar sem internet)
   >>> Troque VERSAO toda vez que publicar uma mudança no app. <<< */
const VERSAO = "ajha-finance-v18";
const CASCA = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192-b.png", "./icons/icon-512-b.png",
  "./icons/icon-maskable-b.png", "./icons/icon-180-b.png", "./icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Firebase (login e banco): sempre rede, nunca cache
  if (/googleapis\.com|firebaseio\.com|firebaseapp\.com|identitytoolkit|securetoken/.test(url.hostname) && !/fonts\.googleapis\.com/.test(url.hostname)) return;

  // a página: rede primeiro, cache como reserva (offline)
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone();
      caches.open(VERSAO).then(c => c.put("./index.html", copia));
      return r;
    }).catch(() => caches.match("./index.html")));
    return;
  }

  // resto (ícones, fontes, SDK do Firebase): cache primeiro
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || /gstatic\.com|fonts\.googleapis\.com/.test(url.hostname))) {
      const copia = r.clone();
      caches.open(VERSAO).then(c => c.put(req, copia));
    }
    return r;
  }).catch(() => hit)));
});
