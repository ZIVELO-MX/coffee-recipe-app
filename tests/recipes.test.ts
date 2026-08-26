import { describe, expect, it } from "vitest"
import { recipeInputSchema, validateTimeline } from "@/lib/domain"
import { parseRecipeFilters } from "@/lib/recipes"
import { SEED_RECIPES } from "@/scripts/seed-data"

describe("recipe filters", () => {
  it("parses repeated filters and pagination", () => {
    const params = new URLSearchParams("q=v60&method=v60&method=chemex&water=250-350&page=2&pageSize=10")
    expect(parseRecipeFilters(params)).toMatchObject({ q: "v60", method: ["v60", "chemex"], water: ["250-350"], page: 2, pageSize: 10 })
  })

  it("rejects invalid methods, ranges and page sizes", () => {
    expect(() => parseRecipeFilters(new URLSearchParams("method=espresso"))).toThrow()
    expect(() => parseRecipeFilters(new URLSearchParams("water=large"))).toThrow()
    expect(() => parseRecipeFilters(new URLSearchParams("pageSize=100"))).toThrow()
  })
})

describe("recipe seed", () => {
  it("contains valid, unambiguous recipes", () => {
    expect(SEED_RECIPES).toHaveLength(5)
    for (const { legacy_id, ...recipe } of SEED_RECIPES) {
      expect(legacy_id).toMatch(/^r\d+$/)
      const parsed = recipeInputSchema.parse(recipe)
      expect(validateTimeline(parsed.steps)).toEqual(parsed.steps)
    }
  })

  it("accepts local and HTTPS images while rejecting unsafe protocols", () => {
    const { legacy_id: _, ...recipe } = SEED_RECIPES[0]
    expect(recipeInputSchema.safeParse({ ...recipe, image: "/methods/v60.png" }).success).toBe(true)
    expect(recipeInputSchema.safeParse({ ...recipe, image: "https://images.example.com/v60.webp" }).success).toBe(true)
    expect(recipeInputSchema.safeParse({ ...recipe, image: "not-a-url" }).success).toBe(false)
    expect(recipeInputSchema.safeParse({ ...recipe, image: "javascript:alert(1)" }).success).toBe(false)
  })
})
