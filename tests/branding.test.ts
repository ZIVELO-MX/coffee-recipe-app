import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import manifest from "@/app/manifest"

const root = resolve(process.cwd())

describe("Koda Brew branding", () => {
  it("uses Koda Brew in the PWA manifest", () => {
    const appManifest = manifest()
    expect(appManifest.name).toContain("Koda Brew")
    expect(appManifest.short_name).toBe("Koda Brew")
    expect(appManifest.id).toBe("/")
    expect(appManifest.lang).toBe("es-MX")
    expect(appManifest.orientation).toBe("portrait-primary")
    expect(appManifest.shortcuts).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "/recipes" }),
      expect.objectContaining({ url: "/saved" }),
      expect.objectContaining({ url: "/profile" }),
    ]))
    expect(appManifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/pwa-icon-192.png" }),
      expect.objectContaining({ src: "/pwa-icon-512.png" }),
    ]))
  })

  it("ships branded social images for the app and recipes", () => {
    const files = [
      "app/opengraph-image.tsx",
      "app/twitter-image.tsx",
      "app/(product)/recipes/[id]/opengraph-image.tsx",
      "app/(product)/recipes/[id]/twitter-image.tsx",
    ]
    for (const file of files) expect(readFileSync(resolve(root, file), "utf8").length).toBeGreaterThan(20)
    expect(readFileSync(resolve(root, "components/brand/social-image.tsx"), "utf8")).toContain("Koda Brew")
  })

  it("does not ship the former product name in user-facing metadata", () => {
    const files = [
      "app/layout.tsx",
      "app/manifest.ts",
      "app/(product)/recipes/[id]/page.tsx",
      "README.md",
      "coffee-recipe-app-mvp-spec.md",
    ]
    const contents = files.map((file) => readFileSync(resolve(root, file), "utf8")).join("\n")
    expect(contents).not.toMatch(/Cafe[ií]na|Coffee Recipe App/i)
  })

  it("includes a multi-size ICO favicon", () => {
    const favicon = readFileSync(resolve(root, "app/favicon.ico"))
    expect(favicon.subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]))
    expect(favicon.readUInt16LE(4)).toBeGreaterThanOrEqual(3)
  })
})
