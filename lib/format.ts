import type { Recipe } from "./mock-data"

/** Ratio café:agua, ej. "1:16.7" */
export function ratio(recipe: Recipe): string {
  const r = recipe.water_ml / recipe.coffee_g
  return `1:${r.toFixed(1)}`
}

/** Celsius a Fahrenheit redondeado */
export function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

/** Temperatura formateada según unidad */
export function formatTemp(c: number, unit: "C" | "F"): string {
  return unit === "C" ? `${c} °C` : `${cToF(c)} °F`
}

/** Tiempo total de la receta en segundos (fin del último paso) */
export function totalSeconds(recipe: Recipe): number {
  if (recipe.steps.length === 0) return 0
  return recipe.steps[recipe.steps.length - 1].end
}

/** Segundos a mm:ss */
export function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
