import "./load-env"
import { closeDatabase, getDatabase } from "@/lib/db"
import { recipeInputSchema, validateTimeline } from "@/lib/domain"
import { SEED_RECIPES } from "./seed-data"

async function main() {
  const db = await getDatabase()
  const collection = db.collection("recipes")

  for (const seedRecipe of SEED_RECIPES) {
    const { legacy_id, ...input } = seedRecipe
    const recipe = recipeInputSchema.parse(input)
    validateTimeline(recipe.steps)
    const now = new Date()
    await collection.updateOne(
      { legacy_id },
      {
        $set: {
          ...recipe,
          updated_at: now,
        },
        $setOnInsert: { legacy_id, created_at: now },
      },
      { upsert: true },
    )
  }

  console.log(`Seeded ${SEED_RECIPES.length} recipes`)
}

main()
  .catch((error) => {
    console.error("Seed failed", error)
    process.exitCode = 1
  })
  .finally(closeDatabase)
