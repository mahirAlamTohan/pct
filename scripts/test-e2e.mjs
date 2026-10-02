#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "@playwright/test"

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"
const fixtureEnvironment = {
  ...process.env,
  NEXT_PUBLIC_CATALOG_DATA_URL: "/__fixtures__/catalog.a1b2c3.dat",
  NEXT_PUBLIC_CATALOG_XOR_KEY: "pct-e2e-fixture-key-not-a-secret",
}

function runNpm(args, env, label) {
  console.log(`\n=== ${label} ===\n`)
  const result = spawnSync(npmCommand, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.error) throw result.error
  return result.status ?? 1
}

function reportFailure(step, status) {
  console.error(`\nE2E stopped: ${step} failed with exit code ${status}.`)
  process.exitCode = status
}

async function chromiumLaunchError() {
  let browser

  try {
    browser = await chromium.launch({ headless: true })
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  } finally {
    await browser?.close()
  }
}

async function ensureChromium() {
  const initialError = await chromiumLaunchError()
  if (initialError === undefined) return true

  console.error(`Initial Chromium launch check failed: ${initialError}`)
  console.log(
    "Playwright Chromium is not ready. Installing the browser required by the E2E suite..."
  )
  const installStatus = runNpm(
    ["exec", "--", "playwright", "install", "chromium"],
    process.env,
    "Install Playwright Chromium (one-time setup)"
  )

  if (installStatus !== 0) {
    console.error(
      "Could not install Playwright Chromium. Check the network connection, then run `npx playwright install chromium` and retry."
    )
    process.exitCode = installStatus
    return false
  }

  const launchError = await chromiumLaunchError()
  if (launchError !== undefined) {
    console.error(
      "Chromium was installed but could not launch. On Linux, install its system libraries with `npx playwright install --with-deps chromium`, then retry."
    )
    console.error(`Browser launch error: ${launchError}`)
    process.exitCode = 1
    return false
  }

  return true
}

async function main() {
  console.log("PCT end-to-end test runner")
  console.log(
    "The test server is started and stopped automatically by Playwright."
  )

  if (!(await ensureChromium())) return

  const buildStatus = runNpm(
    ["run", "build"],
    fixtureEnvironment,
    "Build static site with isolated E2E catalog fixtures"
  )
  if (buildStatus !== 0) {
    reportFailure("static E2E build", buildStatus)
    return
  }

  const testStatus = runNpm(
    ["exec", "--", "playwright", "test", ...process.argv.slice(2)],
    process.env,
    "Run Chromium browser tests"
  )
  if (testStatus !== 0) {
    reportFailure("Playwright tests", testStatus)
    console.error(
      "Failure artifacts and machine-readable results are saved under test-results/; the HTML report is under playwright-report/."
    )
    return
  }

  console.log("\nAll Playwright E2E tests passed.")
  console.log("HTML report: playwright-report/index.html")
  console.log("JSON results: test-results/e2e-results.json")
  console.log(
    "The generated out/ directory uses test-only catalog settings. Run `npm run build` again before deploying."
  )
}

main().catch((error) => {
  console.error("E2E runner could not complete.", error)
  process.exitCode = 1
})
