import "@/scripts/load-env"
import { randomUUID } from "node:crypto"
import { ObjectId } from "mongodb"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { SEED_RECIPES } from "@/scripts/seed-data"

vi.mock("@/lib/brewmark", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/brewmark")>()
  return {
    ...actual,
    getGrinderCatalog: vi.fn().mockResolvedValue({
      grinders: [{
        id: 62,
        brand: "Baratza",
        name: "Encore ESP",
        minSetting: 1,
        maxSetting: 40,
        settingUnit: "NUMBER",
        espressoAnchor: 3,
        mokaAnchor: 8,
        filterAnchor: 18,
        frenchPressAnchor: 25,
        coarseAnchor: 33,
        burrType: "CONICAL",
      }],
    }),
  }
})

const enabled = process.env.RUN_MONGO_INTEGRATION === "1" && Boolean(process.env.MONGODB_URI)
const suite = enabled ? describe : describe.skip

suite("MongoDB recipe persistence", () => {
  let closeDatabase: () => Promise<void>
  let getDatabase: typeof import("@/lib/db")["getDatabase"]
  let getRecipePage: typeof import("@/lib/recipes")["getRecipePage"]
  let getSavedRecipes: typeof import("@/lib/recipes")["getSavedRecipes"]
  let apiKeys: typeof import("@/lib/api-keys")
  let personalRecipes: typeof import("@/lib/personal-recipes")

  beforeAll(async () => {
    process.env.MONGODB_DB = `coffee_test_${randomUUID().slice(0, 12)}`
    const dbModule = await import("@/lib/db")
    const recipeModule = await import("@/lib/recipes")
    apiKeys = await import("@/lib/api-keys")
    personalRecipes = await import("@/lib/personal-recipes")
    closeDatabase = dbModule.closeDatabase
    getDatabase = dbModule.getDatabase
    getRecipePage = recipeModule.getRecipePage
    getSavedRecipes = recipeModule.getSavedRecipes
    const db = await getDatabase()
    const now = new Date()
    await db.collection("recipes").insertMany(SEED_RECIPES.map(({ legacy_id, ...recipe }) => ({ ...recipe, legacy_id, created_at: now, updated_at: now })))
    await db.collection("saved_recipes").createIndex({ clerk_user_id: 1, recipe_id: 1 }, { unique: true })
    await db.collection("likes").createIndex({ clerk_user_id: 1, recipe_id: 1 }, { unique: true })
    await db.collection("api_keys").createIndex({ clerk_user_id: 1 }, { unique: true })
    await db.collection("api_keys").createIndex({ key_hash: 1 }, { unique: true })
    await db.collection("api_idempotency").createIndex({ clerk_user_id: 1, scope: 1, key_hash: 1 }, { unique: true })
  })

  afterAll(async () => {
    if (!enabled) return
    await (await getDatabase()).dropDatabase()
    await closeDatabase()
  })

  it("filters recipe ranges and methods", async () => {
    const result = await getRecipePage({ q: "", method: ["v60"], coffee: [], water: ["150-250"], temperature: [], duration: [], page: 1, pageSize: 20 })
    expect(result.total).toBe(1)
    expect(result.data[0]?.name).toBe("V60 Regular")
  })

  it("isolates saved recipes and likes by Clerk user", async () => {
    const db = await getDatabase()
    const recipe = await db.collection("recipes").findOne({ legacy_id: "r6" })
    expect(recipe?._id).toBeInstanceOf(ObjectId)
    await db.collection("saved_recipes").insertOne({ clerk_user_id: "user_a", recipe_id: recipe?._id, created_at: new Date() })
    await db.collection("likes").insertMany([
      { clerk_user_id: "user_a", recipe_id: recipe?._id, created_at: new Date() },
      { clerk_user_id: "user_b", recipe_id: recipe?._id, created_at: new Date() },
    ])
    const saved = await getSavedRecipes("user_a")
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ viewer_saved: true, viewer_liked: true, like_count: 2 })
    await expect(db.collection("saved_recipes").insertOne({ clerk_user_id: "user_a", recipe_id: recipe?._id, created_at: new Date() })).rejects.toThrow()
  })

  it("stores API keys as hashes and invalidates the previous key on rotation", async () => {
    const first = await apiKeys.createApiKeyForUser("user_api")
    await expect(apiKeys.authenticateApiKey(new Request("http://localhost", {
      headers: { authorization: `Bearer ${first.api_key}` },
    }))).resolves.toEqual({ userId: "user_api" })

    const stored = await (await getDatabase()).collection("api_keys").findOne({ clerk_user_id: "user_api" })
    expect(stored?.key_hash).toBe(apiKeys.hashApiKey(first.api_key))
    expect(JSON.stringify(stored)).not.toContain(first.api_key)

    const rotated = await apiKeys.rotateApiKeyForUser("user_api")
    await expect(apiKeys.authenticateApiKey(new Request("http://localhost", {
      headers: { authorization: `Bearer ${first.api_key}` },
    }))).rejects.toBeInstanceOf(apiKeys.InvalidApiKeyError)
    await expect(apiKeys.authenticateApiKey(new Request("http://localhost", {
      headers: { authorization: `Bearer ${rotated.api_key}` },
    }))).resolves.toEqual({ userId: "user_api" })
  })

  it("limits personal updates and deletes to the recipe owner", async () => {
    const db = await getDatabase()
    const { legacy_id: _legacyId, ...seed } = SEED_RECIPES[0]
    const inserted = await db.collection("recipes").insertOne({
      ...seed,
      created_by_clerk_user_id: "owner_1",
      created_at: new Date(),
      updated_at: new Date(),
    })

    await expect(personalRecipes.patchPersonalRecipe(inserted.insertedId.toString(), { name: "Ajena" }, "owner_2"))
      .rejects.toBeInstanceOf(personalRecipes.PersonalRecipeNotFoundError)
    await personalRecipes.patchPersonalRecipe(inserted.insertedId.toString(), {
      name: "Propia",
      appearance: { icon: "timer", background: "mocha" },
    }, "owner_1")
    expect(await db.collection("recipes").findOne({ _id: inserted.insertedId })).toMatchObject({
      name: "Propia",
      appearance: { icon: "timer", background: "mocha" },
    })

    await db.collection("likes").insertOne({ clerk_user_id: "fan", recipe_id: inserted.insertedId, created_at: new Date() })
    await db.collection("saved_recipes").insertOne({ clerk_user_id: "fan", recipe_id: inserted.insertedId, created_at: new Date() })
    await personalRecipes.deletePersonalRecipe(inserted.insertedId.toString(), "owner_1")
    expect(await db.collection("recipes").findOne({ _id: inserted.insertedId })).toBeNull()
    expect(await db.collection("likes").countDocuments({ recipe_id: inserted.insertedId })).toBe(0)
    expect(await db.collection("saved_recipes").countDocuments({ recipe_id: inserted.insertedId })).toBe(0)
  })
})
