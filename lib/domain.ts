import { z } from "zod"

export const appearanceIconSchema = z.enum([
  "coffee",
  "bean",
  "droplets",
  "flame",
  "timer",
  "scale",
  "gauge",
  "sparkles",
])

export const appearanceBackgroundSchema = z.enum([
  "caramel",
  "crema",
  "terracotta",
  "olive",
  "mocha",
  "slate",
])

export const appearanceSchema = z.object({
  icon: appearanceIconSchema,
  background: appearanceBackgroundSchema,
}).strict()

export type Appearance = z.infer<typeof appearanceSchema>
export type AppearanceIcon = z.infer<typeof appearanceIconSchema>
export type AppearanceBackground = z.infer<typeof appearanceBackgroundSchema>

export const methodSchema = z.enum([
  "v60",
  "chemex",
  "aeropress",
  "french-press",
  "moka",
  "kalita",
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
  grind: z.object({
    grinder_id: z.number().int().positive(),
    setting: z.number().finite().min(0),
  }),
  preparation: z.array(z.string().trim().min(1).max(300)).min(1).max(30),
  steps: z.array(recipeStepSchema).min(1).max(100),
  appearance: appearanceSchema.optional(),
}).strict()

export type RecipeInput = z.infer<typeof recipeInputSchema>
export const personalRecipeInputSchema = recipeInputSchema.omit({ author: true }).strict()
export type PersonalRecipeInput = z.infer<typeof personalRecipeInputSchema>
export const personalRecipePatchSchema = personalRecipeInputSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required")
export type PersonalRecipePatch = z.infer<typeof personalRecipePatchSchema>

export const bulkRecipeCreateSchema = z.object({
  items: z.array(z.unknown()).min(1).max(50),
}).strict()

export const bulkRecipePatchItemSchema = z.object({
  id: z.string(),
  changes: personalRecipePatchSchema,
}).strict()

export const bulkRecipePatchSchema = z.object({
  items: z.array(z.unknown()).min(1).max(50),
}).strict()

export const bulkRecipeDeleteSchema = z.object({
  ids: z.array(z.unknown()).min(1).max(50),
}).strict()
export type RecipeStep = z.infer<typeof recipeStepSchema>
export type Method = RecipeInput["method"]
export type RecipeGrind = RecipeInput["grind"]

export const METHOD_LABEL: Record<Method, string> = {
  v60: "V60",
  chemex: "Chemex",
  aeropress: "AeroPress",
  "french-press": "Prensa francesa",
  moka: "Moka",
  kalita: "Kalita",
}

export const DEFAULT_AVATAR_APPEARANCE: Appearance = {
  icon: "coffee",
  background: "caramel",
}

export const METHOD_APPEARANCE: Record<Method, Appearance> = {
  v60: { icon: "droplets", background: "caramel" },
  chemex: { icon: "sparkles", background: "crema" },
  aeropress: { icon: "gauge", background: "terracotta" },
  "french-press": { icon: "coffee", background: "olive" },
  moka: { icon: "flame", background: "mocha" },
  kalita: { icon: "scale", background: "slate" },
}

export function recipeAppearance(method: Method, value?: unknown): Appearance {
  const parsed = appearanceSchema.safeParse(value)
  return parsed.success ? parsed.data : METHOD_APPEARANCE[method]
}

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

export const grinderUnitSchema = z.enum(["NUMBER", "CLICKS", "ROTATIONS"])
export type GrinderUnit = z.infer<typeof grinderUnitSchema>

export type GrindSettingView = {
  grinder_id: number
  grinder_name: string | null
  setting: number
  setting_unit: GrinderUnit | null
}

export type RecipeView = Omit<RecipeInput, "grind" | "appearance"> & {
  _id: string
  appearance: Appearance
  grind: {
    source: GrindSettingView
    converted?: GrindSettingView
  }
  total_seconds: number
  like_count: number
  viewer_liked: boolean
  viewer_saved: boolean
}

export const temperatureUnitSchema = z.enum(["C", "F"])
export type TemperatureUnit = z.infer<typeof temperatureUnitSchema>

export type UserPreferences = {
  temperature_unit: TemperatureUnit
  default_grinder_id: number
  default_grinder_name: string | null
  avatar: Appearance
}

export type ViewerUser = {
  name: string
  email: string
  guest?: boolean
}

export type ApiKeyStatus =
  | { has_key: false }
  | {
      has_key: true
      last_four: string
      created_at: string
      rotated_at: string | null
    }

export type IssuedApiKey = {
  api_key: string
  status: Extract<ApiKeyStatus, { has_key: true }>
}

const rangeTokenSchema = z.string().regex(/^\d+-\d+$|^\d+-(?:plus|less)$/)

export const recipeFiltersSchema = z.object({
  q: z.string().trim().max(120).default(""),
  method: z.array(methodSchema).default([]),
  coffee: z.array(rangeTokenSchema).default([]),
  water: z.array(rangeTokenSchema).default([]),
  temperature: z.array(rangeTokenSchema).default([]),
  duration: z.array(rangeTokenSchema).default([]),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
})

export type RecipeFilters = z.infer<typeof recipeFiltersSchema>

export type RecipePage = {
  data: RecipeView[]
  total: number
  page: number
  pageSize: number
}

export type ActionErrorCode = "AUTH_REQUIRED" | "NOT_FOUND" | "INVALID_INPUT" | "CONFLICT" | "DB_UNAVAILABLE"

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ActionErrorCode; message: string } }

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
