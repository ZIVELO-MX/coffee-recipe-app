import { describe, expect, it } from "vitest"
import { toWatchyRecipe, WatchyRecipeCompatibilityError } from "@/lib/watchy/adapter"
import { watchyRecipeSchema } from "@/lib/watchy/schema"
import { SEED_RECIPES } from "@/scripts/seed-data"
import type { RecipeView } from "@/lib/domain"

function recipe(overrides: Partial<RecipeView> = {}): RecipeView {
  const seed = SEED_RECIPES[0]
  return {
    ...seed,
    _id: "recipe-1",
    appearance: seed.appearance!,
    grind: { source: { grinder_id: 62, grinder_name: "Baratza Encore ESP", setting: 28, setting_unit: "NUMBER" } },
    total_seconds: 150,
    like_count: 0,
    viewer_liked: false,
    viewer_saved: false,
    ...overrides,
  }
}

describe("Watchy recipe adapter", () => {
  it("serializes the complete V60 metadata and timeline", () => {
    const result = toWatchyRecipe(recipe())
    expect(result).toMatchObject({ schemaVersion: 1, brewMethod: "V60", recipeName: "V60 Regular", authorName: "Benji Rodriguez", coffeeAmountGrams: 15, waterAmountMl: 200, ratio: "1:13.3", totalBrewTimeSeconds: 150 })
    expect(result.timedSteps).toEqual([
      expect.objectContaining({ actionType: "pour", actionLabel: "Blooming", waterAmountMl: 50, targetTotalWaterMl: 50 }),
      expect.objectContaining({ actionType: "wait", waitUntilSeconds: 30 }),
      expect.objectContaining({ actionType: "pour", actionLabel: "Pour", waterAmountMl: 150, targetTotalWaterMl: 200 }),
      expect.objectContaining({ actionType: "wait", waitCondition: "drain_completely" }),
    ])
    expect(watchyRecipeSchema.parse(result)).toEqual(result)
  })

  it("preserves optional haptics and decimal values", () => {
    const result = toWatchyRecipe(recipe({ coffee_g: 15.5, water_ml: 210.5, steps: [
      { instruction: "Bloom", start: 0, end: 10, semantics: { action: "pour", phase: "blooming", water_ml: 50.5, target_total_water_ml: 50.5, haptic_at_seconds: 8 } },
      { instruction: "Wait", start: 10, end: 30, semantics: { action: "wait", until_seconds: 30 } },
      { instruction: "Pour", start: 30, end: 40, semantics: { action: "pour", water_ml: 160, target_total_water_ml: 210.5 } },
    ], total_seconds: 40 }))
    expect(result.coffeeAmountGrams).toBe(15.5)
    expect(result.timedSteps[0]).toMatchObject({ hapticNotificationAtSeconds: 8, waterAmountMl: 50.5 })
  })

  it("rejects valid Koda recipes without Watchy semantics", () => {
    expect(() => toWatchyRecipe(recipe({ steps: [{ instruction: "Brew", start: 0, end: 10 }] }))).toThrow(WatchyRecipeCompatibilityError)
  })

  it("rejects incoherent accumulated water", () => {
    expect(() => toWatchyRecipe(recipe({ steps: [{ instruction: "Pour", start: 0, end: 10, semantics: { action: "pour", water_ml: 150, target_total_water_ml: 100 } }] }))).toThrow(WatchyRecipeCompatibilityError)
  })
})
