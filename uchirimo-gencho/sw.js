// Retire cached legacy apps without modifying the carport or browser-saved records.
const retired = {
  '/madoremo-gencho.html': 'https://madorimo.ktm-work.com/',
  '/kutai-system/': 'https://tool-a7.ktm-work.com/',
  '/kutai-system/index.html': 'https://tool-a7.ktm-work.com/',
  '/uchirimo-gencho/': 'https://tool-k3.ktm-work.com/',
  '/uchirimo-gencho/index.html': 'https://tool-k3.ktm-work.com/',
  '/genba-check.html': 'https://tool-r8.ktm-work.com/',
  '/saisun.html': null
};
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        if (url.origin === self.location.origin && Object.hasOwn(retired, url.pathname)) await cache.delete(request);
      }
    }
    await self.clients.claim();
    for (const client of await self.clients.matchAll({type:'window'})) {
      const url = new URL(client.url);
      if (url.origin === self.location.origin && Object.hasOwn(retired,url.pathname)) await client.navigate(client.url);
    }
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !Object.hasOwn(retired,url.pathname)) return;
  const next = retired[url.pathname];
  event.respondWith(Promise.resolve(new Response('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>旧URLの提供終了</title><body style="font-family:system-ui;max-width:640px;margin:60px auto;padding:24px;line-height:1.8"><h1>旧URLは提供を終了しました</h1><p>このURLではアプリをご利用いただけません。</p>' + (next ? '<p><a href="'+next+'">新しいアプリを開く</a></p>' : '') + '</body></html>', {status:410,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
