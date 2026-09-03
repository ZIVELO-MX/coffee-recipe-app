import { z } from "zod"
import type { GrinderUnit, RecipeGrind } from "@/lib/domain"

const baseUrl = "https://brewmark.io"

export const FALLBACK_GRINDERS = [
  { id: 76, brand: "Timemore", name: "C3" },
]

export const grinderSchema = z.object({
  id: z.number().int().positive(),
  brand: z.string(),
  name: z.string(),
  minSetting: z.number().finite(),
  maxSetting: z.number().finite(),
  settingUnit: z.enum(["NUMBER", "CLICKS", "ROTATIONS"]),
  espressoAnchor: z.number().finite(),
  mokaAnchor: z.number().finite().nullable().optional(),
  filterAnchor: z.number().finite(),
  frenchPressAnchor: z.number().finite().nullable().optional(),
  coarseAnchor: z.number().finite(),
  burrType: z.enum(["CONICAL", "FLAT"]).nullable(),
})

const grinderCatalogSchema = z.object({
  grinders: z.array(grinderSchema),
})

export type BrewmarkGrinder = z.infer<typeof grinderSchema>

export class BrewmarkUnavailableError extends Error {}
export class GrinderNotFoundError extends Error {}
export class InvalidGrindSettingError extends Error {}

async function brewmarkFetch<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      next: { revalidate: 86400, tags: ["brewmark", `brewmark:${path}`] },
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) throw new Error(`BrewMark returned ${response.status}`)
    return schema.parse(await response.json())
  } catch (error) {
    throw new BrewmarkUnavailableError("BrewMark is unavailable", { cause: error })
  }
}

export function getGrinderCatalog() {
  return brewmarkFetch("/api/grinders", grinderCatalogSchema)
}

export async function getGrinders() {
  const { grinders } = await getGrinderCatalog()
  return {
    grinders: grinders.map(({ id, brand, name }) => ({ id, brand, name })),
    count: grinders.length,
  }
}

export async function getGrinder(grinderId: number): Promise<BrewmarkGrinder> {
  const { grinders } = await getGrinderCatalog()
  const grinder = grinders.find(({ id }) => id === grinderId)
  if (!grinder) throw new GrinderNotFoundError(`Unknown grinder ${grinderId}`)
  return grinder
}

type Point = readonly [index: number, setting: number]

function points(grinder: BrewmarkGrinder): Point[] {
  const moka = grinder.mokaAnchor ?? grinder.espressoAnchor + 0.375 * (grinder.filterAnchor - grinder.espressoAnchor)
  const frenchPress = grinder.frenchPressAnchor ?? grinder.filterAnchor + 0.5 * (grinder.coarseAnchor - grinder.filterAnchor)
  return [
    [0, grinder.espressoAnchor],
    [15, moka],
    [40, grinder.filterAnchor],
    [70, frenchPress],
    [100, grinder.coarseAnchor],
  ]
}

function linearInterpolate(curve: Point[], index: number): number {
  for (let position = 0; position < curve.length - 1; position += 1) {
    const [leftIndex, leftSetting] = curve[position]
    const [rightIndex, rightSetting] = curve[position + 1]
    if (index <= rightIndex) {
      if (rightIndex === leftIndex) return leftSetting
      return leftSetting + ((index - leftIndex) / (rightIndex - leftIndex)) * (rightSetting - leftSetting)
    }
  }
  return curve.at(-1)?.[1] ?? 0
}

function linearInverse(curve: Point[], setting: number): number {
  for (let position = 0; position < curve.length - 1; position += 1) {
    const [leftIndex, leftSetting] = curve[position]
    const [rightIndex, rightSetting] = curve[position + 1]
    if (setting >= Math.min(leftSetting, rightSetting) && setting <= Math.max(leftSetting, rightSetting)) {
      if (rightSetting === leftSetting) return leftIndex
      return leftIndex + ((setting - leftSetting) / (rightSetting - leftSetting)) * (rightIndex - leftIndex)
    }
  }
  const [firstIndex, firstSetting] = curve[0]
  const [lastIndex, lastSetting] = curve.at(-1) ?? curve[0]
  if (setting <= Math.min(firstSetting, lastSetting)) return firstSetting <= lastSetting ? firstIndex : lastIndex
  return firstSetting <= lastSetting ? lastIndex : firstIndex
}

function monotoneInterpolate(curve: Point[], index: number): number {
  if (curve.length < 3) return linearInterpolate(curve, index)
  const indexes = curve.map(([value]) => value)
  const settings = curve.map(([, value]) => value)
  const intervals: number[] = []
  const slopes: number[] = []
  for (let position = 0; position < curve.length - 1; position += 1) {
    intervals.push(indexes[position + 1] - indexes[position])
    slopes.push(intervals[position] === 0 ? 0 : (settings[position + 1] - settings[position]) / intervals[position])
  }

  const tangents = Array<number>(curve.length)
  tangents[0] = slopes[0]
  tangents[curve.length - 1] = slopes.at(-1) ?? 0
  for (let position = 1; position < curve.length - 1; position += 1) {
    tangents[position] = slopes[position - 1] * slopes[position] <= 0 ? 0 : (slopes[position - 1] + slopes[position]) / 2
  }
  for (let position = 0; position < curve.length - 1; position += 1) {
    if (slopes[position] === 0) {
      tangents[position] = 0
      tangents[position + 1] = 0
      continue
    }
    const leftRatio = tangents[position] / slopes[position]
    const rightRatio = tangents[position + 1] / slopes[position]
    const magnitude = leftRatio ** 2 + rightRatio ** 2
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude)
      tangents[position] = scale * leftRatio * slopes[position]
      tangents[position + 1] = scale * rightRatio * slopes[position]
    }
  }

  let segment = 0
  for (let position = 0; position < curve.length - 1; position += 1) {
    segment = position
    if (index <= indexes[position + 1]) break
  }
  const width = indexes[segment + 1] - indexes[segment]
  if (width === 0) return settings[segment]
  const progress = (index - indexes[segment]) / width
  const squared = progress ** 2
  const cubed = squared * progress
  return (2 * cubed - 3 * squared + 1) * settings[segment]
    + (cubed - 2 * squared + progress) * width * tangents[segment]
    + (-2 * cubed + 3 * squared) * settings[segment + 1]
    + (cubed - squared) * width * tangents[segment + 1]
}

function toGrindIndex(grinder: BrewmarkGrinder, setting: number): number {
  const curve = points(grinder)
  if (grinder.burrType === "FLAT") return Math.round(linearInverse(curve, setting) * 10) / 10
  let index = Math.max(0, Math.min(100, linearInverse(curve, setting)))
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const currentSetting = monotoneInterpolate(curve, index)
    const error = currentSetting - setting
    if (Math.abs(error) < 0.001) break
    const derivative = (monotoneInterpolate(curve, Math.min(100, index + 0.01)) - currentSetting) / 0.01
    if (Math.abs(derivative) < 1e-10) break
    index = Math.max(0, Math.min(100, index - error / derivative))
  }
  return Math.round(index * 10) / 10
}

function fromGrindIndex(grinder: BrewmarkGrinder, index: number): number {
  const boundedIndex = Math.max(0, Math.min(100, index))
  const calculated = grinder.burrType === "CONICAL"
    ? monotoneInterpolate(points(grinder), boundedIndex)
    : linearInterpolate(points(grinder), boundedIndex)
  return Math.max(grinder.minSetting, Math.min(grinder.maxSetting, Math.round(calculated * 10) / 10))
}

function actionableSetting(setting: number, unit: GrinderUnit): number {
  return unit === "CLICKS" ? Math.round(setting) : Math.round(setting * 10) / 10
}

export function grinderName(grinder: BrewmarkGrinder): string {
  return `${grinder.brand} ${grinder.name}`
}

export function assertValidGrind(grinder: BrewmarkGrinder, setting: number): void {
  if (!Number.isFinite(setting) || setting < grinder.minSetting || setting > grinder.maxSetting) {
    throw new InvalidGrindSettingError(`Setting must be between ${grinder.minSetting} and ${grinder.maxSetting}`)
  }
  if (grinder.settingUnit === "CLICKS" && !Number.isInteger(setting)) {
    throw new InvalidGrindSettingError("Click settings must be whole numbers")
  }
}

export async function validateRecipeGrind(grind: RecipeGrind): Promise<BrewmarkGrinder> {
  const { grinders } = await getGrinderCatalog()
  return validateRecipeGrindFromCatalog(grind, grinders)
}

export function validateRecipeGrindFromCatalog(
  grind: RecipeGrind,
  grinders: BrewmarkGrinder[],
): BrewmarkGrinder {
  const grinder = grinders.find(({ id }) => id === grind.grinder_id)
  if (!grinder) throw new GrinderNotFoundError(`Unknown grinder ${grind.grinder_id}`)
  assertValidGrind(grinder, grind.setting)
  return grinder
}

export function convertGrindSetting(source: BrewmarkGrinder, sourceSetting: number, target: BrewmarkGrinder): number {
  assertValidGrind(source, sourceSetting)
  if (source.id === target.id) return actionableSetting(sourceSetting, target.settingUnit)
  return actionableSetting(fromGrindIndex(target, toGrindIndex(source, sourceSetting)), target.settingUnit)
}
