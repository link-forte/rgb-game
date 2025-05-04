const CACHE_NAME = 'rgb-game-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-96x96.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// インストール時に必要なリソースをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを開きました');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 通信リクエスト時の処理
self.addEventListener('fetch', event => {
  // chrome-extension:// や file:// などのURLスキームをスキップ
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // 非HTTPリクエストの場合は処理しない
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュに該当データがあればそれを返す
        if (response) {
          return response;
        }

        // キャッシュになければネットワークからフェッチ
        return fetch(event.request)
          .then(response => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            try {
              // 有効なレスポンスはコピーしてキャッシュに追加
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                })
                .catch(error => {
                  console.error('キャッシュに追加できませんでした:', error);
                });
            } catch (error) {
              console.error('キャッシュ処理中にエラーが発生しました:', error);
            }

            return response;
          });
      })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
