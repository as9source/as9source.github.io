// Service Workerを自動削除
// このファイルは自分自身を削除して、キャッシュ問題を解決します

self.addEventListener('install', function(e) {
  // すぐにアクティブ化
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    // Service Workerを登録解除
    self.registration.unregister()
      .then(function() {
        // すべてのキャッシュを削除
        return caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              return caches.delete(cacheName);
            })
          );
        });
      })
      .then(function() {
        // すべてのクライアント（タブ）を取得
        return self.clients.matchAll();
      })
      .then(function(clients) {
        // すべてのタブをリロード
        clients.forEach(function(client) {
          client.navigate(client.url);
        });
      })
  );
});

