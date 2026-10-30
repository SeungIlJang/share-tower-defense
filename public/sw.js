/**
 * 📦 모두의 타워디펜스 오프라인 캐시(서비스 워커)
 * - 게임 코드(assets/ — 이름에 해시가 붙어 바뀌면 새 파일): 캐시 우선
 * - 그림·소리·효과(sprites/ audio/ effects/): 캐시에서 바로 주고 뒤에서 새로 받아 둠(다음 실행에 반영)
 * - 첫 화면(index.html)·매니페스트(json): 네트워크 우선, 안 되면 캐시(인터넷 없을 때도 실행)
 */
const CACHE = 'ld-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ld-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 첫 실행 땐 서비스 워커가 늦게 켜져 첫 화면·게임 코드가 캐시에 없음 → 페이지가 알려 준 주소를 바로 저장
self.addEventListener('message', (e) => {
  const urls = e.data && e.data.type === 'precache' ? e.data.urls : null;
  if (Array.isArray(urls)) e.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => c.add(u).catch(() => undefined)))));
});

function put(req, res) {
  if (res && res.ok && res.type !== 'opaque') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 광고·통계 등 다른 서버는 건드리지 않음
  const path = url.pathname;

  // 게임 코드 — 해시 이름이라 한 번 받으면 그대로
  if (path.includes('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }
  // 그림·소리·효과 — 캐시 먼저(빠름), 뒤에서 새로 받아 둠
  if (/\/(sprites|audio|effects)\//.test(path)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => put(req, res))
          .catch(() => hit);
        return hit || net;
      })
    );
    return;
  }
  // 첫 화면·매니페스트 — 새 버전 먼저, 오프라인이면 캐시
  if (req.mode === 'navigate' || path.endsWith('.html') || path.endsWith('.json') || path.endsWith('/')) {
    e.respondWith(
      fetch(req)
        .then((res) => put(req, res))
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./')))
    );
  }
});
