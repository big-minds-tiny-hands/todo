// Bump VERSION to drop every cache this worker owns. Any byte change here ships as an update.
const VERSION = 1;
const PREFIX = "todo";
const OFFLINE_URL = "/offline";
const NAV_TIMEOUT_MS = 3000;

const CACHES = {
  pages: `${PREFIX}-v${VERSION}-pages`,
  static: `${PREFIX}-v${VERSION}-static`,
  assets: `${PREFIX}-v${VERSION}-assets`,
};

// Hashed chunks from old deploys pile up in the static cache, so every cache has a cap.
const LIMITS = {
  [CACHES.pages]: 30,
  [CACHES.static]: 300,
  [CACHES.assets]: 60,
};

const PRECACHE = {
  [CACHES.pages]: [OFFLINE_URL],
  [CACHES.assets]: [
    "/manifest.webmanifest",
    "/icon.svg",
    "/apple-icon.png",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/maskable-512.png",
  ],
};

const PRECACHED = new Set(Object.values(PRECACHE).flat().map((path) => new URL(path, self.location.origin).href));

const NEVER_CACHE = ["/api/", "/ingest", "/monitoring"];
const ASSET_DESTINATIONS = new Set(["image", "font", "manifest"]);

// First match wins. A null handler lets the request reach the network untouched.
const ROUTES = [
  {
    when: (request, url) =>
      request.method !== "GET" ||
      url.origin !== self.location.origin ||
      NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix)),
    handle: null,
  },
  { when: (request) => request.mode === "navigate", handle: networkFirstPage },
  { when: (_, url) => url.pathname.startsWith("/_next/static/"), handle: (event) => cacheFirst(event, CACHES.static) },
  { when: (request) => ASSET_DESTINATIONS.has(request.destination), handle: (event) => staleWhileRevalidate(event, CACHES.assets) },
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all(
      Object.entries(PRECACHE).map(async ([name, paths]) => {
        const cache = await caches.open(name);
        await cache.addAll(paths.map((path) => new Request(path, { cache: "reload" })));
      }),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const current = new Set(Object.values(CACHES));
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith(`${PREFIX}-`) && !current.has(name)).map((name) => caches.delete(name)));
      await self.registration.navigationPreload?.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const route = ROUTES.find((candidate) => candidate.when(event.request, url));
  if (route?.handle) event.respondWith(route.handle(event));
});

async function networkFirstPage(event) {
  const { request } = event;
  const network = Promise.resolve(event.preloadResponse).then((preloaded) => preloaded || fetch(request));
  // This reaction is attached before any reader, so the clone happens before the body is used.
  const saved = network.then((response) => response.ok && put(CACHES.pages, request, response.clone()));
  event.waitUntil(saved.catch(() => {}));

  try {
    const first = await Promise.race([network, sleep(NAV_TIMEOUT_MS)]);
    if (first) return first;
    // Slow is not offline: serve the cached copy if there is one, else keep waiting.
    return (await cachedPage(request)) ?? (await network);
  } catch {
    return (await cachedPage(request)) ?? (await cachedPage(OFFLINE_URL)) ?? Response.error();
  }
}

async function cacheFirst(event, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  if (hit) return hit;
  const response = await fetch(event.request);
  if (response.ok) event.waitUntil(put(cacheName, event.request, response.clone()));
  return response;
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  const refresh = fetch(event.request).then(async (response) => {
    if (response.ok) await put(cacheName, event.request, response.clone());
    return response;
  });
  event.waitUntil(refresh.catch(() => {}));
  return hit ?? refresh;
}

async function cachedPage(request) {
  const cache = await caches.open(CACHES.pages);
  // Next.js varies pages on router headers that a plain navigation never sends.
  return cache.match(request, { ignoreVary: true });
}

async function put(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  const evictable = (await cache.keys()).filter((key) => !PRECACHED.has(key.url));
  const excess = evictable.length - LIMITS[cacheName];
  if (excess > 0) await Promise.all(evictable.slice(0, excess).map((key) => cache.delete(key)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
