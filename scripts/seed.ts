import { getDatabase } from "@/lib/db"
import { RECIPES } from "@/lib/mock-data"
import { methodToBrewmark } from "@/lib/domain"

async function main() {
  const db = await getDatabase()
  const collection = db.collection("recipes")

  for (const recipe of RECIPES) {
    const now = new Date()
    await collection.updateOne(
      { legacy_id: recipe._id },
      {
        $set: {
          name: recipe.name,
          author: recipe.author,
          method: recipe.method,
          coffee_g: recipe.coffee_g,
          water_ml: recipe.water_ml,
          temperature_c: recipe.temperature_c,
          grind: { target: methodToBrewmark[recipe.method] },
          preparation: recipe.preparation,
          steps: recipe.steps,
          updated_at: now,
        },
        $setOnInsert: { legacy_id: recipe._id, created_at: now },
      },
      { upsert: true },
    )
  }

  console.log(`Seeded ${RECIPES.length} recipes`)
}

main().catch((error) => {
  console.error("Seed failed", error)
  process.exitCode = 1
})
