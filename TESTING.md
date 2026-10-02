# Testing

## After pulling: run the complete local suite

Install the project dependencies, then run the single full-suite command:

```sh
npm install --no-package-lock --no-audit --no-fund
npm run test:all
```

If you use pnpm, the equivalent is `pnpm install` followed by `pnpm test:all`.

`test:all` generates Next.js route types, builds the production static export, runs ESLint, TypeScript checks, unit/component tests, and then the Chromium end-to-end suite. It continues through every stage and records failures instead of stopping at the first one. If the Playwright-managed Chromium browser is missing, the E2E runner installs it automatically on first use. Playwright starts and stops the local static test server; no separate server terminal is needed. The tests use local, synthetic catalog fixtures and do not send test traffic to production.

The run prints results in the terminal and writes `test-results/full-suite-summary.txt` and `.json`, `playwright-report/index.html`, and `test-results/e2e-results.json`. On browser-test failures, screenshots, traces, and other artifacts are also saved under `test-results/`; share the full-suite summary and E2E JSON/report for review. You can open the HTML report with `npx playwright show-report`.

The E2E build deliberately writes test-only catalog settings to `out/`. Do **not** deploy that output. Run `npm run build` again after testing to generate a production-configured export.

## Unit and component tests

```sh
npm test
npm run test:coverage
```

Vitest runs the data-format/fetch tests and React component tests in jsdom. The component fixtures are synthetic and test-only; they are not bundled into the site.

## Browser and accessibility tests

To run just the end-to-end browser suite:

```sh
npm run test:e2e
```

The runner checks for Playwright's Chromium browser and installs it if needed, builds the static export with a test-only catalog URL/key, and lets Playwright start and stop the loopback server. No separate server terminal is needed. The current Chromium suite has 36 tests covering versioned catalog/dictionary loading, no catalog records embedded in the app shell, credential-free artifact requests, fuzzy search and highlighting across all five fields, include/exclude keyboard states and removable summaries, pagination, USD sliders, empty/error/malformed data, a 500-manufacturer virtualized list, and narrow-screen table scrolling. Site tests cover SEO/social metadata, same-origin network requests, CSP/security headers, responsive navigation across phone/tablet/desktop breakpoints, fixed-header animation, theme persistence, all configured FAQ entries and keyboard controls, contact destinations, safe external links, footer navigation, and PWA metadata/icons. Axe checks WCAG 2.2 A/AA in both themes with filters open and on mobile with contact actions expanded. Offline tests verify app-shell caching, catalog artifacts saved by the app and reloaded offline, plus connection-status transitions. Browser routes supply in-memory catalog fixtures; tests do not fetch production catalog artifacts. The public-data guard still runs, and temporary raw catalog JSON must not be left under `public/data`. The Playwright config uses two workers for consistent resource usage across local platforms.

The Playwright report and JSON results are saved under `playwright-report/` and `test-results/`. The E2E build uses test-only settings and overwrites `out/`; regenerate a production build before deploying.

## Bounded local load smoke test

Build the static site, then serve it only on loopback:

```sh
npm run build
node scripts/serve-static.mjs --directory out --host 127.0.0.1 --port 4173
```

In a second terminal:

```sh
npm run test:load
```

The default workload is 5 connections for 10 seconds, with pipelining disabled. Local runs are capped at 25 connections and 30 seconds. The test reports client-side request rate, latency, errors, and bytes transferred for this specific local server and machine.

Remote targets are rejected unless an explicitly approved hostname containing a `staging` label and an authorization flag are provided. The exact hostname must match `LOAD_TEST_APPROVED_STAGING_HOST`. Staging is capped at 5 connections and 15 seconds, and `*.workers.dev` / `*.pages.dev` (including the known production Worker host) are blocked. Example for a separately approved staging target:

```sh
LOAD_TEST_ENV=staging \
LOAD_TEST_STAGING_AUTHORIZED=true \
LOAD_TEST_APPROVED_STAGING_HOST=staging.example.com \
LOAD_TEST_URL=https://staging.example.com/ \
LOAD_TEST_CONNECTIONS=3 \
LOAD_TEST_DURATION_SECONDS=10 \
npm run test:load
```

The guard is a safety rail, not authorization: agree on the staging target, workload, duration, monitoring, and test window before a remote run. This bounded Autocannon smoke test is **not** a 10,000-concurrent-user test and cannot establish production capacity; that requires an approved, representative distributed workload and confirmation of the hosting/CDN limits.

## Authorized 10,000-VU k6 profile

`scripts/load-test.k6.js` is a separate, explicitly gated k6 test for the approved production target. It is not the bounded Autocannon test above. Install k6 on the load-generator PC, confirm the production test window and monitoring are active, then run:

```sh
k6 run -e BASE_URL=https://pct.mahiralamtohan.workers.dev/ -e K6_CONFIRM_PRODUCTION_TEST=I_AUTHORIZE_THE_PCT_10K_PRODUCTION_TEST scripts/load-test.k6.js
```

The fixed profile ramps through 100, 1,000, 2,500, 5,000, and 10,000 VUs, holding each level for two minutes with one-minute ramps, then ramps down. Each VU visits the home page and fetches the discovered same-origin JS/CSS/media assets plus the catalog and its manufacturer/packaging artifacts on its first iteration; the setup phase warms the CDN first. Later visits request the page document only, with 15 seconds of think time. Response bodies are discarded during the load phase to reduce load-generator memory use. The summary reports Cloudflare cache-hit observations when `cf-cache-status` is present. This is an HTTP-level page-visit approximation: k6 does not execute the site's JavaScript, render the UI, or decode the catalog as a real browser would.

The script fails closed if the target is changed without an opt-in, the production confirmation flag is missing, the deployed page does not expose exactly one catalog artifact, or setup resources cannot be fetched. The production confirmation applies only to the exact Worker origin above. Other remote targets additionally require `K6_ALLOW_NON_PRODUCTION=true` and `K6_APPROVED_TARGET_HOST` to exactly match the target hostname; loopback requires only the non-production opt-in. It aborts on any connection failure, Cloudflare 429/challenge throttling, 1% or more failed requests or 5xx responses, or request-level p95 latency at/above two seconds. k6's 60-second `delayAbortEval` is a startup grace for the error-rate and latency gates; it is intentionally conservative and may abort as soon as a limit is still exceeded after that grace, rather than measuring a separate rolling 60-second window.

This is a single-machine load generator. A 10,000-VU run can be limited by the PC's CPU, memory, sockets, or network before the service is; monitor generator utilization and treat results as inconclusive if it saturates. Do not commit generated load-test summaries. The script's confirmation flag is a technical gate, not standing authorization. Do not run production against a new deployment until the owner confirms deployment and explicitly approves the target, workload, monitoring, and test window. No k6 production run was performed for this diagnostic update.

### Diagnostics and generated reports

Each run writes two files in the current working directory, named `k6-load-test-summary-<run-id>.json` and `.txt`. Both patterns are ignored by Git. The JSON preserves the full k6 summary, run target/profile, threshold results, and diagnostic notes; the text file is a readable report and is also printed at the end of the run. `K6_RUN_ID` may be set to label a run; otherwise the script generates a timestamp-based ID.

The report records latency separately for setup, page documents, static assets, the catalog artifact, and the manufacturer and packaging dictionaries. Request timings include blocked, connecting, TLS handshake, sending, waiting/TTFB, and receiving phases. Static assets are further grouped by JavaScript, stylesheet, font, image, and other. It also reports response-status classes and `cf-cache-status` observations by request type. The overall cache-hit rate remains scoped to VU workload traffic; the per-type cache counts also include setup requests. The original production abort gates are unchanged. Category percentiles are report-only and add no threshold or exit conditions.

`waiting` is k6's response-waiting/TTFB measurement. It combines network transit with CDN, Worker, and origin processing, so it cannot by itself identify which layer caused a delay. DNS is not separately reported here, and zero connection/TLS time may mean connection reuse. The workload does not execute or render the application: each VU fetches assets/catalog once and subsequently requests only the document. It approximates warm repeat visits, not full browser behavior. Compare observed active VUs with the requested profile, inspect dropped iterations, and monitor the generator's CPU, memory, sockets, and network to check whether it kept up.

### What the previously observed results establish

The earlier run recorded p95 latency of **2.53 s** and p99 of **4.85 s**, exceeding the configured 2 s p95 safety threshold; the median was **128.78 ms**. It reported **0% failed requests**, with no 5xx responses, Cloudflare throttles, or connection failures, and stopped at **288 actual VUs** before reaching the configured 10,000-VU ceiling. This establishes a long latency tail in that run, despite a much lower median, and that the test ended before exercising the full planned load.

Those aggregate results do **not** establish whether the tail came from page documents, assets, catalog files, a connection phase, or response waiting; nor do they identify whether the Worker, Cloudflare, the origin, the network path, or the load generator was responsible. Do not attribute the delay to any one layer without the new category/phase measurements and supporting platform or generator telemetry. No new live test was run while making these diagnostic changes.
