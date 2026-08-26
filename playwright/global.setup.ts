import "./load-env"
import { clerkSetup } from "@clerk/testing/playwright"
import { test as setup } from "@playwright/test"

setup.describe.configure({ mode: "serial" })

setup("Clerk", async () => {
  if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) return
  await clerkSetup({ publishableKey: process.env.CLERK_PUBLISHABLE_KEY })
})
