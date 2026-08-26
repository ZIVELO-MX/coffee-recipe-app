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

test("the recipe sheet changes to preparation without navigating", async ({ page }) => {
  if (process.env.CLERK_SECRET_KEY) await setupClerkTestingToken({ page })
  await page.goto("/recipes")
  await page.getByRole("link", { name: /Moka mañanera/ }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Más acciones" }).click()
  await expect(dialog.getByRole("menu", { name: "Acciones de receta" })).toBeVisible()
  await dialog.getByRole("button", { name: "Más acciones" }).click()
  await dialog.getByRole("button", { name: "Iniciar", exact: true }).click()
  await expect(dialog.getByRole("heading", { name: "Moka mañanera" })).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Cerrar receta" })).toHaveCount(0)
  await expect(dialog.getByRole("button", { name: "Pausar" })).toBeVisible()
  await dialog.getByRole("button", { name: "Pausar" }).click()
  await expect(dialog.getByRole("button", { name: "Contraer receta" })).toBeVisible()
  await dialog.getByRole("button", { name: "Contraer receta" }).click()
  await expect(dialog.getByRole("button", { name: "Cerrar receta" })).toBeVisible()
  await dialog.getByRole("button", { name: "Cerrar receta" }).click()
})

test("an authenticated user can persist a saved recipe", async ({ page }) => {
  test.skip(!process.env.CLERK_E2E_USER_EMAIL, "CLERK_E2E_USER_EMAIL is not configured")
  await setupClerkTestingToken({ page })
  await page.goto("/recipes")
  await clerk.signIn({ page, emailAddress: process.env.CLERK_E2E_USER_EMAIL! })
  await page.reload()
  await page.getByRole("link", { name: /Moka mañanera/ }).click()
  await page.getByRole("button", { name: "Guardar" }).click()
  await page.goto("/saved")
  await expect(page.getByRole("link", { name: /Moka mañanera/ })).toBeVisible()
})
