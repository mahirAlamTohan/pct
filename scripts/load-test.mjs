#!/usr/bin/env node

import autocannon from "autocannon"

const DEFAULT_URL = "http://127.0.0.1:4173/"
const PRODUCTION_WORKER_HOST = "pct.mahiralamtohan.workers.dev"
const target = new URL(process.env.LOAD_TEST_URL ?? DEFAULT_URL)
const hostname = target.hostname.toLowerCase().replace(/\.$/, "")
const isLoopback =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname === "[::1]"
const isKnownProductionHost =
  hostname === PRODUCTION_WORKER_HOST ||
  hostname.endsWith(".workers.dev") ||
  hostname.endsWith(".pages.dev")
const stagingHost =
  process.env.LOAD_TEST_APPROVED_STAGING_HOST?.toLowerCase().replace(/\.$/, "")
const hasStagingHostname = /(^|[.-])staging([.-]|$)/i.test(hostname)
const isExplicitlyApprovedStaging =
  process.env.LOAD_TEST_ENV === "staging" &&
  process.env.LOAD_TEST_STAGING_AUTHORIZED === "true" &&
  hasStagingHostname &&
  stagingHost === hostname

if (target.protocol !== "http:" && target.protocol !== "https:") {
  throw new Error("LOAD_TEST_URL must use HTTP or HTTPS.")
}
if (target.username || target.password) {
  throw new Error("Do not put credentials in LOAD_TEST_URL.")
}
if (isKnownProductionHost) {
  throw new Error(
    "Production Workers and Pages hosts are blocked from this load-test script."
  )
}
if (!isLoopback && !isExplicitlyApprovedStaging) {
  throw new Error(
    [
      "Load tests are local-only by default.",
      "For an explicitly approved staging run, set LOAD_TEST_ENV=staging,",
      "LOAD_TEST_STAGING_AUTHORIZED=true, and LOAD_TEST_APPROVED_STAGING_HOST",
      "to the exact staging hostname. Production hosts remain blocked.",
    ].join(" ")
  )
}

const isStaging = !isLoopback
const maxConnections = isStaging ? 5 : 25
const maxDuration = isStaging ? 15 : 30
const connections = Number(process.env.LOAD_TEST_CONNECTIONS ?? 5)
const duration = Number(process.env.LOAD_TEST_DURATION_SECONDS ?? 10)

if (
  !Number.isInteger(connections) ||
  connections < 1 ||
  connections > maxConnections
) {
  throw new Error(
    `LOAD_TEST_CONNECTIONS must be between 1 and ${maxConnections.toString()}.`
  )
}
if (!Number.isInteger(duration) || duration < 1 || duration > maxDuration) {
  throw new Error(
    `LOAD_TEST_DURATION_SECONDS must be between 1 and ${maxDuration.toString()}.`
  )
}

console.log(
  [
    `Running a bounded ${isStaging ? "staging" : "local"} HTTP smoke test against ${target.origin}${target.pathname}`,
    `Connections: ${connections.toString()} · duration: ${duration.toString()}s · pipelining: 1`,
    "This measures only this client-to-target test path; it is not a 10K-concurrency or production-capacity test.",
  ].join("\n")
)

const result = await new Promise((resolve, reject) => {
  autocannon(
    {
      url: target.toString(),
      connections,
      duration,
      pipelining: 1,
      timeout: 10,
      title: "PCT bounded load smoke test",
    },
    (error, measurements) => {
      if (error) reject(error)
      else resolve(measurements)
    }
  )
})

const throughputMiBPerSecond = result.throughput.average / (1024 * 1024)
console.table({
  durationSeconds: result.duration.toFixed(1),
  totalRequests: result.requests.total,
  requestsPerSecond: result.requests.average.toFixed(2),
  throughputMiBPerSecond: throughputMiBPerSecond.toFixed(2),
  latencyP50Milliseconds: result.latency.p50.toFixed(1),
  latencyP97_5Milliseconds: result.latency.p97_5.toFixed(1),
  latencyP99Milliseconds: result.latency.p99.toFixed(1),
  errors: result.errors,
  timeouts: result.timeouts,
  non2xxResponses: result.non2xx,
})

if (result.errors > 0 || result.timeouts > 0 || result.non2xx > 0) {
  process.exitCode = 1
}
