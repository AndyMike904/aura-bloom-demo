const CACHE='aura-bloom-pwa-v1';
const FILES=['./','./index.html','./style.css','./app.js','./model.js','./api.js','./config.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./s1.jpg','./s2.jpg','./s3.jpg','./s4.jpg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('aura-bloom-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 const path=new URL(event.request.url).pathname;
 // La configuración de Google y las actualizaciones se consultan por red primero.
 if(event.request.mode==='navigate'||/\.(js|css|webmanifest)$/.test(path)){
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request).then(result=>result||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
