const PRECACHE_PREFIX = "pct-precache-"
const PRECACHE_VERSION = "__PCT_PRECACHE_VERSION__"
const PRECACHE_NAME = `${PRECACHE_PREFIX}${PRECACHE_VERSION}`
const MANIFEST_URL = "/precache-manifest.json"

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch(MANIFEST_URL, { cache: "no-store" })
      if (!response.ok)
        throw new Error("Could not load the offline asset list.")

      const manifest = await response.json()
      if (
        manifest.version !== PRECACHE_VERSION ||
        !Array.isArray(manifest.assets)
      ) {
        throw new Error("The offline asset list does not match this build.")
      }

      const cache = await caches.open(PRECACHE_NAME)
      await cache.addAll(manifest.assets)
    })()
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const oldCaches = (await caches.keys()).filter(
        (name) => name.startsWith(PRECACHE_PREFIX) && name !== PRECACHE_NAME
      )
      await Promise.all(oldCaches.map((name) => caches.delete(name)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(PRECACHE_NAME)
            await cache.put(request, response.clone()).catch(() => undefined)
          }
          return response
        } catch {
          const cachedPage = await caches.match(request, { ignoreSearch: true })
          if (cachedPage) return cachedPage

          const homePage = await caches.match(
            new URL("/", self.location.origin)
          )
          if (homePage) return homePage

          const offlinePage = await caches.match(
            new URL("/offline.html", self.location.origin)
          )
          return offlinePage ?? Response.error()
        }
      })()
    )
    return
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) return cachedResponse

      try {
        const response = await fetch(request)
        if (response.ok && response.type !== "opaque") {
          const cache = await caches.open(PRECACHE_NAME)
          await cache.put(request, response.clone()).catch(() => undefined)
        }
        return response
      } catch {
        const fallback = await caches.match(request)
        return fallback ?? Response.error()
      }
    })()
  )
})
