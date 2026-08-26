import "./load-env"
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

test("an anonymous visitor can browse and open a recipe", async ({ page }) => {
  if (process.env.CLERK_SECRET_KEY) await setupClerkTestingToken({ page })
  await page.goto("/recipes")
  await expect(page.getByRole("heading", { name: "¿Qué preparamos hoy?" })).toBeVisible()
  const recipe = page.getByRole("link", { name: /Moka mañanera/ })
  await expect(recipe).toBeVisible()
  await recipe.click()
  await expect(page).toHaveURL(/\/recipes\/[a-f0-9]{24}$/)
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Moka mañanera" })).toBeVisible()
  await page.getByRole("button", { name: "Cerrar receta" }).click()
  await expect(page).toHaveURL(/\/recipes$/)
})

test("search filters are represented in the URL", async ({ page }) => {
  if (process.env.CLERK_SECRET_KEY) await setupClerkTestingToken({ page })
  await page.goto("/recipes")
  await page.getByRole("button", { name: "Filtros" }).click()
  await page.getByRole("button", { name: "V60" }).click()
  await page.getByRole("button", { name: "Ver resultados" }).click()
  await expect(page).toHaveURL(/method=v60/)
  await expect(page.getByRole("link", { name: /V60 clásico balanceado/ })).toBeVisible()
})

test("an authenticated user can persist a saved recipe", async ({ page }) => {
  test.skip(!process.env.CLERK_E2E_USER_EMAIL, "CLERK_E2E_USER_EMAIL is not configured")
  await page.goto("/recipes")
  await clerk.signIn({ page, emailAddress: process.env.CLERK_E2E_USER_EMAIL! })
  await page.reload()
  await page.getByRole("link", { name: /Moka mañanera/ }).click()
  await page.getByRole("button", { name: "Guardar" }).click()
  await page.goto("/saved")
  await expect(page.getByRole("link", { name: /Moka mañanera/ })).toBeVisible()
})
