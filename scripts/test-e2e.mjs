#!/usr/bin/env node

import { spawnSync } from "node:child_process"

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"
const fixtureEnvironment = {
  ...process.env,
  NEXT_PUBLIC_CATALOG_DATA_URL: "/__fixtures__/catalog.a1b2c3.dat",
  NEXT_PUBLIC_CATALOG_XOR_KEY: "pct-e2e-fixture-key-not-a-secret",
}

function runNpm(args, env = process.env) {
  const result = spawnSync(npmCommand, args, {
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log("Building a static export with local-only browser-test fixtures.")
runNpm(["run", "build"], fixtureEnvironment)
runNpm(["exec", "--", "playwright", "test", ...process.argv.slice(2)])
