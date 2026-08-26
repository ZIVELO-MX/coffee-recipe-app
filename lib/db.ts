import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB ?? "coffee_recipe_app"

declare global {
  var coffeeMongoClient: MongoClient | undefined
}

function getClient(): MongoClient {
  if (!uri) throw new Error("MONGODB_URI is not configured")
  globalThis.coffeeMongoClient ??= new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  })
  return globalThis.coffeeMongoClient
}

export async function getDatabase(): Promise<Db> {
  const client = getClient()
  await client.connect()
  return client.db(dbName)
}

export async function closeDatabase(): Promise<void> {
  if (!globalThis.coffeeMongoClient) return
  await globalThis.coffeeMongoClient.close()
  globalThis.coffeeMongoClient = undefined
}
