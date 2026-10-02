# Testing

## Unit and component tests

```sh
npm test
npm run test:coverage
```

Vitest runs the data-format/fetch tests and React component tests in jsdom. The component fixtures are synthetic and test-only; they are not bundled into the site.

## Browser and accessibility tests

Install the Playwright browser once if it is not already available:

```sh
npx playwright install chromium
```

Then run:

```sh
npm run test:e2e
```

This builds the static export with a test-only catalog URL/key, serves it on loopback, and runs Playwright against Chromium. Browser routes supply in-memory catalog fixtures; the test suite does not fetch production catalog artifacts. Axe checks WCAG 2.2 A/AA rules on the catalog page with filters open. The build's public-data guard still runs, and temporary raw catalog JSON must not be left under `public/data`.

`npm run test:all` runs lint, type checking, unit/component tests, and the browser suite. It requires the Playwright browser installation above.

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

This is a single-machine load generator. A 10,000-VU run can be limited by the PC's CPU, memory, sockets, or network before the service is; monitor generator utilization and treat results as inconclusive if it saturates. Do not commit generated load-test summaries. The production authorization in this session applies to the target/profile above; review the run window and monitoring again before each execution. No k6 production run was performed from the development sandbox.
