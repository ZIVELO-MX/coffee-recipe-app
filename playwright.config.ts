import "./playwright/load-env"
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./playwright",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    { name: "chromium", testMatch: /app\.spec\.ts/, use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
    { name: "mobile-chromium", testMatch: /mobile\.spec\.ts/, use: { ...devices["iPhone 13"] }, dependencies: ["setup"] },
    { name: "mobile-webkit", testMatch: /mobile\.spec\.ts/, use: { ...devices["iPhone 13"], browserName: "webkit" }, dependencies: ["setup"] },
  ],
  webServer: { command: "pnpm dev", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI, timeout: 120_000 },
})
