#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { performance } from "node:perf_hooks"

import {
  packageManagerExec,
  packageManagerLabel,
  packageManagerRun,
  runPackageManager,
} from "./package-manager.mjs"

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)
const startedAt = new Date()
const steps = [
  {
    name: "Generate Next.js route types",
    args: packageManagerExec("next", "typegen"),
  },
  { name: "Production static build", args: packageManagerRun("build") },
  { name: "ESLint", args: packageManagerRun("lint") },
  { name: "TypeScript", args: packageManagerRun("typecheck") },
  {
    name: "Unit and component tests",
    args: packageManagerExec("vitest", "run", "--reporter=dot"),
  },
  {
    name: "Chromium end-to-end tests",
    args: packageManagerRun("test:e2e"),
  },
]

function commandLabel(args) {
  return packageManagerLabel(args)
}

function runStep(step) {
  console.log(
    `\n\n${"=".repeat(76)}\n${step.name}\n$ ${commandLabel(step.args)}\n${"=".repeat(76)}\n`
  )
  const started = performance.now()
  let result
  try {
    result = runPackageManager(step.args, {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    })
  } catch (error) {
    result = { error, status: null, signal: null }
  }
  const durationMs = Math.round(performance.now() - started)
  const exitCode = result.error ? 1 : (result.status ?? 1)

  if (result.error) console.error(result.error)

  const outcome = {
    name: step.name,
    command: commandLabel(step.args),
    status: exitCode === 0 ? "passed" : "failed",
    exitCode,
    durationMs,
    ...(result.signal ? { signal: result.signal } : {}),
    ...(result.error ? { error: result.error.message } : {}),
  }

  console.log(
    `\n${outcome.status === "passed" ? "PASS" : "FAIL"}: ${step.name} (${(durationMs / 1000).toFixed(1)}s)`
  )
  return outcome
}

async function writeSummary(results) {
  const finishedAt = new Date()
  const reportDirectory = path.join(projectRoot, "test-results")
  const jsonPath = path.join(reportDirectory, "full-suite-summary.json")
  const textPath = path.join(reportDirectory, "full-suite-summary.txt")
  const failed = results.some((result) => result.status !== "passed")
  const summary = {
    status: failed ? "failed" : "passed",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    steps: results,
    reports: {
      e2eHtml: "playwright-report/index.html",
      e2eJson: "test-results/e2e-results.json",
      testArtifacts: "test-results/",
    },
  }
  const lines = [
    "PCT full verification summary",
    `Status: ${summary.status.toUpperCase()}`,
    `Started: ${summary.startedAt}`,
    `Finished: ${summary.finishedAt}`,
    `Duration: ${(summary.durationMs / 1000).toFixed(1)}s`,
    "",
    ...results.map(
      (result) =>
        `${result.status === "passed" ? "PASS" : "FAIL"}  ${result.name} (${(result.durationMs / 1000).toFixed(1)}s, exit ${result.exitCode})`
    ),
    "",
    "Playwright HTML report: playwright-report/index.html",
    "Playwright JSON report: test-results/e2e-results.json",
  ]

  await mkdir(reportDirectory, { recursive: true })
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  await writeFile(textPath, `${lines.join("\n")}\n`)

  return { failed, jsonPath, textPath }
}

async function main() {
  console.log("PCT full verification runner")
  console.log(
    "Every stage runs so one failure does not hide the results from later checks."
  )

  const results = steps.map(runStep)
  const summary = await writeSummary(results)

  console.log(`\n${"=".repeat(76)}`)
  console.log(
    summary.failed
      ? "FULL SUITE FAILED — review the failed stage(s) above."
      : "FULL SUITE PASSED — all configured checks completed successfully."
  )
  console.log(`Summary: ${path.relative(projectRoot, summary.textPath)}`)
  console.log(`JSON:    ${path.relative(projectRoot, summary.jsonPath)}`)
  console.log("E2E HTML: playwright-report/index.html")
  console.log(
    `The E2E run writes test-only settings to out/. Run \`${packageManagerLabel(packageManagerRun("build"))}\` again before deploying.`
  )

  if (summary.failed) process.exitCode = 1
}

main().catch((error) => {
  console.error("Full verification runner could not complete.", error)
  process.exitCode = 1
})
