import { z } from "zod"

export const methodSchema = z.enum([
  "v60",
  "chemex",
  "aeropress",
  "french-press",
  "moka",
  "kalita",
])

export const brewmarkMethodSchema = z.enum([
  "v60",
  "chemex",
  "aeropress",
  "frenchpress",
  "moka",
  "flatbottom",
])

export const recipeStepSchema = z.object({
  instruction: z.string().trim().min(1).max(240),
  start: z.number().int().min(0),
  end: z.number().int().min(1).optional(),
})

export const recipeInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  author: z.string().trim().min(1).max(120),
  method: methodSchema,
  coffee_g: z.number().positive().max(2000),
  water_ml: z.number().positive().max(10000),
  temperature_c: z.number().min(0).max(120),
  grind: z.object({ target: brewmarkMethodSchema }),
  preparation: z.array(z.string().trim().min(1).max(300)).min(1).max(30),
  steps: z.array(recipeStepSchema).min(1).max(100),
  image: z.string().url().optional(),
})

export type RecipeInput = z.infer<typeof recipeInputSchema>
export type RecipeStep = z.infer<typeof recipeStepSchema>

export type RecipeDocument = RecipeInput & {
  _id: string
  created_at: Date
  updated_at: Date
}

export type RecipeListItem = Omit<RecipeDocument, "preparation" | "steps"> & {
  total_seconds: number
  like_count: number
  viewer_liked: boolean
  viewer_saved: boolean
}

export const methodToBrewmark: Record<RecipeInput["method"], RecipeInput["grind"]["target"]> = {
  v60: "v60",
  chemex: "chemex",
  aeropress: "aeropress",
  "french-press": "frenchpress",
  moka: "moka",
  kalita: "flatbottom",
}

export function validateTimeline(steps: RecipeStep[]): RecipeStep[] {
  if (steps.at(-1)?.end === undefined) {
    throw new Error("The final recipe step must have an end time")
  }

  for (let index = 0; index < steps.length; index += 1) {
    const current = steps[index]
    const next = steps[index + 1]
    if (next && next.start <= current.start) {
      throw new Error("Recipe step start times must increase")
    }
    const effectiveEnd = current.end ?? next?.start
    if (effectiveEnd !== undefined && effectiveEnd <= current.start) {
      throw new Error("Recipe step end times must be after their start")
    }
    if (next && current.end !== undefined && current.end > next.start) {
      throw new Error("Recipe steps cannot overlap")
    }
  }
  return steps
}

export function totalSeconds(steps: RecipeStep[]): number {
  const last = steps.at(-1)
  return last?.end ?? last?.start ?? 0
}

export function activeStepIndex(steps: RecipeStep[], elapsed: number): number {
  if (steps.length === 0) return -1
  const index = steps.findLastIndex((step) => elapsed >= step.start)
  return index < 0 ? 0 : Math.min(index, steps.length - 1)
}
