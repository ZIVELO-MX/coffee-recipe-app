import { ObjectId, type Document, type Filter } from "mongodb"
import { getDatabase } from "@/lib/db"
import {
  BrewmarkUnavailableError,
  convertGrindSetting,
  getGrinderCatalog,
  GrinderNotFoundError,
  grinderName,
} from "@/lib/brewmark"
import {
  recipeFiltersSchema,
  type RecipeFilters,
  type RecipePage,
  type RecipeView,
  METHOD_LABEL,
  totalSeconds,
} from "@/lib/domain"

type SearchInput = URLSearchParams | Record<string, string | string[] | undefined>

export type RecipeShareData = {
  id: string
  name: string
  author: string
  method: string
  coffeeGrams: number
  waterMilliliters: number
  totalSeconds: number
}

function values(input: SearchInput, key: string): string[] {
  if (input instanceof URLSearchParams) return input.getAll(key)
  const value = input[key]
  return Array.isArray(value) ? value : value ? [value] : []
}

export function parseRecipeFilters(input: SearchInput): RecipeFilters {
  const page = Number(values(input, "page")[0] ?? 1)
  const pageSize = Number(values(input, "pageSize")[0] ?? 20)
  return recipeFiltersSchema.parse({
    q: values(input, "q")[0] ?? "",
    method: values(input, "method"),
    coffee: values(input, "coffee"),
    water: values(input, "water"),
    temperature: values(input, "temperature"),
    duration: values(input, "duration"),
    page,
    pageSize,
  })
}

function rangeCondition(field: string, tokens: string[]): Document | undefined {
  if (!tokens.length) return undefined
  return {
    $or: tokens.map((token) => {
      const [startValue, endValue] = token.split("-")
      const start = Number(startValue)
      if (endValue === "plus") return { [field]: { $gte: start } }
      if (endValue === "less") return { [field]: { $lt: start } }
      return { [field]: { $gte: start, $lte: Number(endValue) } }
    }),
  }
}

function serializeRecipe(document: Document): RecipeView {
  return {
    _id: document._id.toString(),
    name: document.name,
    author: document.author,
    method: document.method,
    image: document.image ?? "/icon.svg",
    coffee_g: document.coffee_g,
    water_ml: document.water_ml,
    temperature_c: document.temperature_c,
    grind: {
      source: {
        grinder_id: document.grind.grinder_id,
        grinder_name: null,
        setting: document.grind.setting,
        setting_unit: null,
      },
    },
    preparation: document.preparation ?? [],
    steps: document.steps ?? [],
    total_seconds: document.total_seconds ?? totalSeconds(document.steps ?? []),
    like_count: 0,
    viewer_liked: false,
    viewer_saved: false,
  }
}

async function resolveRecipeGrinds(recipes: RecipeView[], targetGrinderId?: number): Promise<RecipeView[]> {
  if (!recipes.length) return recipes
  try {
    const { grinders } = await getGrinderCatalog()
    const byId = new Map(grinders.map((grinder) => [grinder.id, grinder]))
    const target = targetGrinderId === undefined ? undefined : byId.get(targetGrinderId)
    if (targetGrinderId !== undefined && !target) {
      throw new GrinderNotFoundError(`Unknown grinder ${targetGrinderId}`)
    }
    return recipes.map((recipe) => {
      const source = byId.get(recipe.grind.source.grinder_id)
      const sourceView = source
        ? {
            ...recipe.grind.source,
            grinder_name: grinderName(source),
            setting_unit: source.settingUnit,
          }
        : recipe.grind.source
      if (!target) return { ...recipe, grind: { source: sourceView } }
      if (!source) {
        throw new GrinderNotFoundError(`Unknown grinder ${recipe.grind.source.grinder_id}`)
      }
      return {
        ...recipe,
        grind: {
          source: sourceView,
          converted: {
            grinder_id: target.id,
            grinder_name: grinderName(target),
            setting: convertGrindSetting(source, recipe.grind.source.setting, target),
            setting_unit: target.settingUnit,
          },
        },
      }
    })
  } catch (error) {
    if (error instanceof BrewmarkUnavailableError && targetGrinderId === undefined) return recipes
    throw error
  }
}

async function mergeViewerState(recipes: RecipeView[], userId?: string | null): Promise<RecipeView[]> {
  if (!recipes.length) return recipes
  const db = await getDatabase()
  const ids = recipes.map((recipe) => new ObjectId(recipe._id))
  const [likeCounts, viewerLikes, viewerSaves] = await Promise.all([
    db.collection("likes").aggregate<{ _id: ObjectId; count: number }>([
      { $match: { recipe_id: { $in: ids } } },
      { $group: { _id: "$recipe_id", count: { $sum: 1 } } },
    ]).toArray(),
    userId
      ? db.collection("likes").find({ clerk_user_id: userId, recipe_id: { $in: ids } }).project({ recipe_id: 1 }).toArray()
      : Promise.resolve([]),
    userId
      ? db.collection("saved_recipes").find({ clerk_user_id: userId, recipe_id: { $in: ids } }).project({ recipe_id: 1 }).toArray()
      : Promise.resolve([]),
  ])
  const counts = new Map(likeCounts.map((item) => [item._id.toString(), item.count]))
  const liked = new Set(viewerLikes.map((item) => item.recipe_id.toString()))
  const saved = new Set(viewerSaves.map((item) => item.recipe_id.toString()))
  return recipes.map((recipe) => ({
    ...recipe,
    like_count: counts.get(recipe._id) ?? 0,
    viewer_liked: liked.has(recipe._id),
    viewer_saved: saved.has(recipe._id),
  }))
}

export async function getRecipePage(filters: RecipeFilters, userId?: string | null): Promise<RecipePage> {
  const db = await getDatabase()
  const baseMatch: Filter<Document> = {}
  if (filters.q) baseMatch.$text = { $search: filters.q }
  if (filters.method.length) baseMatch.method = { $in: filters.method }

  const rangeMatches = [
    rangeCondition("coffee_g", filters.coffee),
    rangeCondition("water_ml", filters.water),
    rangeCondition("temperature_c", filters.temperature),
  ].filter(Boolean)
  const durationMatch = rangeCondition("total_seconds", filters.duration)
  const pipeline: Document[] = [
    { $match: baseMatch },
    ...(rangeMatches.length ? [{ $match: { $and: rangeMatches } }] : []),
    {
      $addFields: {
        total_seconds: {
          $ifNull: [
            { $arrayElemAt: ["$steps.end", -1] },
            { $arrayElemAt: ["$steps.start", -1] },
          ],
        },
      },
    },
    ...(durationMatch ? [{ $match: durationMatch }] : []),
    { $sort: { _id: -1 } },
    {
      $facet: {
        data: [{ $skip: (filters.page - 1) * filters.pageSize }, { $limit: filters.pageSize }],
        metadata: [{ $count: "total" }],
      },
    },
  ]
  const [result] = await db.collection("recipes").aggregate(pipeline).toArray()
  const recipes = (result?.data ?? []).map(serializeRecipe)
  const [withViewerState, withGrinds] = await Promise.all([
    mergeViewerState(recipes, userId),
    resolveRecipeGrinds(recipes),
  ])
  return {
    data: withViewerState.map((recipe, index) => ({ ...recipe, grind: withGrinds[index].grind })),
    total: result?.metadata?.[0]?.total ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
  }
}

export async function getRecipeById(id: string, userId?: string | null, targetGrinderId?: number): Promise<RecipeView | null> {
  if (!ObjectId.isValid(id)) return null
  const recipe = await (await getDatabase()).collection("recipes").findOne({ _id: new ObjectId(id) })
  if (!recipe) return null
  const serialized = serializeRecipe(recipe)
  const [withViewerState, withGrind] = await Promise.all([
    mergeViewerState([serialized], userId),
    resolveRecipeGrinds([serialized], targetGrinderId),
  ])
  return { ...withViewerState[0], grind: withGrind[0].grind }
}

export async function getRecipeShareData(id: string): Promise<RecipeShareData | null> {
  if (!ObjectId.isValid(id)) return null
  const recipe = await (await getDatabase()).collection("recipes").findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, author: 1, method: 1, coffee_g: 1, water_ml: 1, steps: 1, total_seconds: 1 } },
  )
  if (!recipe) return null
  return {
    id: recipe._id.toString(),
    name: recipe.name,
    author: recipe.author,
    method: METHOD_LABEL[recipe.method as keyof typeof METHOD_LABEL] ?? recipe.method,
    coffeeGrams: recipe.coffee_g,
    waterMilliliters: recipe.water_ml,
    totalSeconds: recipe.total_seconds ?? totalSeconds(recipe.steps ?? []),
  }
}

export async function getSavedRecipes(userId: string): Promise<RecipeView[]> {
  const db = await getDatabase()
  const saved = await db.collection("saved_recipes").find({ clerk_user_id: userId }).sort({ created_at: -1 }).toArray()
  const ids = saved.map((item) => item.recipe_id).filter((id): id is ObjectId => id instanceof ObjectId)
  if (!ids.length) return []
  const documents = await db.collection("recipes").find({ _id: { $in: ids } }).toArray()
  const byId = new Map(documents.map((document) => [document._id.toString(), serializeRecipe(document)]))
  const ordered = ids.map((id) => byId.get(id.toString())).filter((recipe): recipe is RecipeView => Boolean(recipe))
  const [withViewerState, withGrinds] = await Promise.all([
    mergeViewerState(ordered, userId),
    resolveRecipeGrinds(ordered),
  ])
  return withViewerState.map((recipe, index) => ({ ...recipe, grind: withGrinds[index].grind }))
}
