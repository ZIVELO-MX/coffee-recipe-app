import { existsSync } from "node:fs"
import { loadEnvFile } from "node:process"

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file)

if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}
