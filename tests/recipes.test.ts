import { describe, expect, it } from "vitest"
import { METHOD_APPEARANCE, personalRecipePatchSchema, recipeAppearance, recipeInputSchema, validateTimeline } from "@/lib/domain"
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
    expect(SEED_RECIPES).toHaveLength(1)
    for (const { legacy_id, ...recipe } of SEED_RECIPES) {
      expect(legacy_id).toMatch(/^r\d+$/)
      const parsed = recipeInputSchema.parse(recipe)
      expect(validateTimeline(parsed.steps)).toEqual(parsed.steps)
    }
  })

  it("stores the author's grinder and exact setting instead of a method target", () => {
    expect(SEED_RECIPES[0].grind).toEqual({ grinder_id: 62, setting: 28 })
    expect(recipeInputSchema.safeParse({ ...SEED_RECIPES[0], grind: { target: "v60" } }).success).toBe(false)
  })

  it("accepts curated appearances and rejects legacy images or arbitrary values", () => {
    const { legacy_id: _, ...recipe } = SEED_RECIPES[0]
    expect(recipeInputSchema.safeParse(recipe).success).toBe(true)
    expect(recipeInputSchema.safeParse({ ...recipe, appearance: { icon: "emoji", background: "#fff" } }).success).toBe(false)
    expect(recipeInputSchema.safeParse({ ...recipe, image: "/methods/v60.png" }).success).toBe(false)
  })

  it("uses deterministic method fallbacks for legacy recipes", () => {
    for (const [method, appearance] of Object.entries(METHOD_APPEARANCE)) {
      expect(recipeAppearance(method as keyof typeof METHOD_APPEARANCE)).toEqual(appearance)
    }
    expect(recipeAppearance("v60", { icon: "bean", background: "olive" })).toEqual({ icon: "bean", background: "olive" })
  })
})

describe("personal recipe patches", () => {
  it("accepts partial editable fields and complete appearances", () => {
    expect(personalRecipePatchSchema.safeParse({ name: "Nuevo nombre" }).success).toBe(true)
    expect(personalRecipePatchSchema.safeParse({ appearance: { icon: "timer", background: "mocha" } }).success).toBe(true)
    expect(personalRecipePatchSchema.safeParse({ appearance: { icon: "timer" } }).success).toBe(false)
  })

  it("rejects empty patches, authors, images and internal ownership fields", () => {
    expect(personalRecipePatchSchema.safeParse({}).success).toBe(false)
    expect(personalRecipePatchSchema.safeParse({ author: "Otra persona" }).success).toBe(false)
    expect(personalRecipePatchSchema.safeParse({ image: null }).success).toBe(false)
    expect(personalRecipePatchSchema.safeParse({ created_by_clerk_user_id: "user_2" }).success).toBe(false)
  })
})
