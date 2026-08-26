import "./load-env"
import { closeDatabase, getDatabase } from "@/lib/db"

async function main() {
  const db = await getDatabase()
  await db.collection("recipes").createIndex({ name: "text", author: "text" }, { weights: { name: 5, author: 1 } })
  await db.collection("recipes").createIndex({ method: 1, _id: -1 })
  await db.collection("likes").createIndex({ clerk_user_id: 1, recipe_id: 1 }, { unique: true })
  await db.collection("saved_recipes").createIndex({ clerk_user_id: 1, recipe_id: 1 }, { unique: true })
  await db.collection("user_preferences").createIndex({ clerk_user_id: 1 }, { unique: true })
  console.log("MongoDB indexes created")
}

main()
  .catch((error) => {
    console.error("MongoDB index setup failed", error)
    process.exitCode = 1
  })
  .finally(closeDatabase)
