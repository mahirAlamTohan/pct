import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)
const baseURL = `http://127.0.0.1:${port.toString()}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `node scripts/serve-static.mjs --directory out --host 127.0.0.1 --port ${port.toString()}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
