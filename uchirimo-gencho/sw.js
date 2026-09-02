const CACHE = 'uchirimo-gencho-v6';
const ASSETS = ['./','./index.html','../cloud-backup.js','../pdf-zip-lock.js','../vendor/jspdf.umd.min.js','../vendor/html2canvas.min.js','../vendor/jspdf.plugin.autotable.min.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).catch(()=>caches.match('./index.html'))));});
