import { METHOD_LABEL, type RecipeView, type RecipeStep } from "@/lib/domain"
import { mmss, ratio } from "@/lib/format"
import { watchyRecipeSchema, type WatchyRecipe, type WatchyTimedStep } from "./schema"

export class WatchyRecipeCompatibilityError extends Error {}

function stepEnd(step: RecipeStep, next?: RecipeStep): number {
  return step.end ?? next?.start ?? 0
}

function validateSemantics(recipe: RecipeView): void {
  let accumulated = 0
  for (let index = 0; index < recipe.steps.length; index += 1) {
    const step = recipe.steps[index]
    const semantics = step.semantics
    const end = stepEnd(step, recipe.steps[index + 1])
    if (!semantics) throw new WatchyRecipeCompatibilityError(`Step ${index} has no Watchy semantics`)
    if (end <= step.start) throw new WatchyRecipeCompatibilityError(`Step ${index} has an invalid interval`)
    if (semantics.haptic_at_seconds !== undefined && (semantics.haptic_at_seconds < step.start || semantics.haptic_at_seconds > end)) {
      throw new WatchyRecipeCompatibilityError(`Step ${index} has an invalid haptic time`)
    }
    if (semantics.action === "pour") {
      if (semantics.water_ml === undefined || semantics.target_total_water_ml === undefined) throw new WatchyRecipeCompatibilityError(`Pour step ${index} needs water amounts`)
      accumulated += semantics.water_ml
      if (semantics.target_total_water_ml < semantics.water_ml || semantics.target_total_water_ml > recipe.water_ml) throw new WatchyRecipeCompatibilityError(`Pour step ${index} has an invalid target total`)
      if (semantics.target_total_water_ml < accumulated - 0.0001) throw new WatchyRecipeCompatibilityError(`Pour step ${index} has an incoherent target total`)
    }
    if (semantics.action === "wait" && semantics.until_seconds !== undefined && semantics.until_seconds !== end) throw new WatchyRecipeCompatibilityError(`Wait step ${index} has an incoherent until time`)
  }
}

function adaptStep(recipe: RecipeView, step: RecipeStep, index: number): WatchyTimedStep {
  const semantics = step.semantics!
  const end = stepEnd(step, recipe.steps[index + 1])
  const haptic = semantics.haptic_at_seconds === undefined ? {} : { hapticNotificationAtSeconds: semantics.haptic_at_seconds }
  if (semantics.action === "pour") {
    const blooming = semantics.phase === "blooming"
    return {
      actionType: "pour",
      startTimeSeconds: step.start,
      endTimeSeconds: end,
      waterAmountMl: semantics.water_ml!,
      targetTotalWaterMl: semantics.target_total_water_ml!,
      primaryValue: `${semantics.water_ml} ml`,
      actionLabel: blooming ? "Blooming" : "Pour",
      ...(semantics.target_total_water_ml !== semantics.water_ml ? { secondaryValue: `${semantics.target_total_water_ml} ml total` } : {}),
      ...haptic,
    }
  }
  return {
    actionType: "wait",
    startTimeSeconds: step.start,
    endTimeSeconds: end,
    ...(semantics.until_seconds !== undefined ? { waitUntilSeconds: semantics.until_seconds, secondaryValue: `Until ${mmss(semantics.until_seconds)}` } : {}),
    ...(semantics.condition ? { waitCondition: semantics.condition, secondaryValue: "Drain completely" } : {}),
    actionLabel: "Wait",
    ...haptic,
  }
}

export function toWatchyRecipe(recipe: RecipeView): WatchyRecipe {
  validateSemantics(recipe)
  const adapted = {
    schemaVersion: 1 as const,
    id: recipe._id,
    brewMethod: METHOD_LABEL[recipe.method],
    recipeName: recipe.name,
    ...(recipe.author ? { authorName: recipe.author } : {}),
    coffeeAmountGrams: recipe.coffee_g,
    waterAmountMl: recipe.water_ml,
    ratio: ratio(recipe),
    totalBrewTimeSeconds: recipe.total_seconds,
    timedSteps: recipe.steps.map((step, index) => adaptStep(recipe, step, index)),
  }
  const parsed = watchyRecipeSchema.safeParse(adapted)
  if (!parsed.success) throw new WatchyRecipeCompatibilityError("Recipe does not match Watchy schema")
  return parsed.data
}
