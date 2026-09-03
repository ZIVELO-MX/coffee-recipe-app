import { describe, expect, it } from "vitest"
import { GET } from "@/app/api/openapi.json/route"
import { OPENAPI_DOCUMENT } from "@/lib/openapi"

describe("OpenAPI document", () => {
  it("documents the public API and personal bearer authentication", () => {
    expect(OPENAPI_DOCUMENT.openapi).toBe("3.1.0")
    expect(Object.keys(OPENAPI_DOCUMENT.paths)).toEqual([
      "/api/recipes",
      "/api/recipes/{id}",
      "/api/recipes/bulk",
      "/api/grinders",
    ])
    expect(OPENAPI_DOCUMENT.paths["/api/recipes"].post.security).toEqual([{ PersonalApiKey: [] }])
    expect(OPENAPI_DOCUMENT.paths["/api/recipes"].post.parameters).toContainEqual(expect.objectContaining({ name: "Idempotency-Key" }))
    expect(OPENAPI_DOCUMENT.paths["/api/recipes/{id}"].patch.security).toEqual([{ PersonalApiKey: [] }])
    expect(OPENAPI_DOCUMENT.paths["/api/recipes/bulk"].post.security).toEqual([{ PersonalApiKey: [] }])
    expect(OPENAPI_DOCUMENT.components.securitySchemes.PersonalApiKey).toMatchObject({ type: "http", scheme: "bearer" })
  })

  it("does not allow clients to provide recipe authors", () => {
    const schema = OPENAPI_DOCUMENT.components.schemas.RecipeCreateInput
    expect(schema.properties).not.toHaveProperty("author")
    expect(schema.required).not.toContain("author")
    expect(schema.additionalProperties).toBe(false)
  })

  it("documents curated recipe appearances instead of images", () => {
    expect(OPENAPI_DOCUMENT.info.version).toBe("0.2.0")
    expect(OPENAPI_DOCUMENT.components.schemas.Recipe.required).toContain("appearance")
    expect(OPENAPI_DOCUMENT.components.schemas.Recipe.properties).not.toHaveProperty("image")
    expect(OPENAPI_DOCUMENT.components.schemas.Appearance.properties.icon.enum).toContain("coffee")
    expect(OPENAPI_DOCUMENT.components.schemas.Appearance.properties.background.enum).toContain("caramel")
    expect(OPENAPI_DOCUMENT.components.schemas.RecipeCreateInput.properties).not.toHaveProperty("image")
  })

  it("serves the document as cacheable JSON", async () => {
    const response = GET()
    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toContain("max-age=3600")
    expect(await response.json()).toEqual(OPENAPI_DOCUMENT)
  })
})
