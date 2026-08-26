import { existsSync } from "node:fs"
import { loadEnvFile } from "node:process"

// Next.js loads these files automatically; standalone tsx scripts do not.
// Load local overrides first, then the shared .env file without printing secrets.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) loadEnvFile(file)
}
