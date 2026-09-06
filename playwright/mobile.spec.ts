import "./load-env"
import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

test("a mobile visitor can open a recipe and start its timer", async ({ page }) => {
  if (process.env.CLERK_SECRET_KEY) {
    await setupClerkTestingToken({ page })
  }

  await page.goto("/recipes")
  await page.getByRole("link", { name: /V60 Regular/ }).click()

  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("heading", { name: "V60 Regular" })).toBeVisible()
  await page.getByRole("button", { name: "Iniciar", exact: true }).click()
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible()
})
