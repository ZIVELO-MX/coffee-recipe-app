import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = resolve(process.cwd())

describe("PWA shell", () => {
  it("keeps authenticated and personalized requests out of runtime caches", () => {
    const serviceWorker = readFileSync(resolve(root, "public/sw.js"), "utf8")
    expect(serviceWorker).toContain('request.mode === "navigate"')
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")')
    expect(serviceWorker).toContain('url.pathname.startsWith("/__clerk/")')
    expect(serviceWorker).not.toContain("cache.put(request, response)")
    expect(serviceWorker).toContain('caches.match(OFFLINE_URL)')
  })

  it("registers the worker only in production", () => {
    const registration = readFileSync(resolve(root, "components/pwa/service-worker-registration.tsx"), "utf8")
    expect(registration).toContain('process.env.NODE_ENV !== "production"')
    expect(registration).toContain('register("/sw.js"')
  })

  it("provides an offline recovery screen", () => {
    const offlinePage = readFileSync(resolve(root, "app/offline/page.tsx"), "utf8")
    expect(offlinePage).toContain("Estás sin conexión")
    expect(offlinePage).toContain('href="/recipes"')
  })
})
