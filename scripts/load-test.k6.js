/*
 * Gated 10,000-VU HTTP workload. Run only with explicit approval in the
 * agreed production window; see TESTING.md. This approximates browser asset caching but does not
 * execute JavaScript or render the page.
 */
import http from "k6/http"
import { check, sleep } from "k6"
import { Counter, Rate, Trend } from "k6/metrics"

const PRODUCTION_ORIGIN = "https://pct.mahiralamtohan.workers.dev"
const PRODUCTION_CONFIRMATION = "I_AUTHORIZE_THE_PCT_10K_PRODUCTION_TEST"
const DEFAULT_HEADERS = {
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}
const NAVIGATION_HEADERS = {
  ...DEFAULT_HEADERS,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Upgrade-Insecure-Requests": "1",
}
const ASSET_EXTENSIONS = new Set([
  ".avif",
  ".css",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".mjs",
  ".otf",
  ".png",
  ".svg",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
])
function parseHttpUrl(value) {
  const match = value
    .toString()
    .trim()
    .match(/^(https?):\/\/([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$/i)

  if (!match) {
    throw new Error(`Expected an absolute HTTP(S) URL, received: ${value}`)
  }

  const protocol = `${match[1].toLowerCase()}:`
  const authority = match[2].toLowerCase()
  if (authority.includes("@")) {
    throw new Error("BASE_URL must not contain credentials.")
  }

  const hostname = authority.startsWith("[")
    ? authority.slice(1, authority.indexOf("]"))
    : authority.split(":")[0]
  const origin = `${protocol}//${authority}`
  const pathname = match[3] || "/"
  const search = match[4] || ""
  const hash = match[5] || ""

  return {
    protocol,
    origin,
    hostname,
    pathname,
    search,
    hash,
    href: `${origin}${pathname}${search}${hash}`,
  }
}

function normalizePath(pathname) {
  const hasTrailingSlash = pathname.endsWith("/")
  const segments = []

  for (const segment of pathname.split("/")) {
    if (!segment || segment === ".") continue
    if (segment === "..") {
      if (segments.length > 0) segments.pop()
    } else {
      segments.push(segment)
    }
  }

  const normalizedPath = `/${segments.join("/")}`
  return hasTrailingSlash && segments.length > 0
    ? `${normalizedPath}/`
    : normalizedPath
}

function splitReference(reference) {
  const hashIndex = reference.indexOf("#")
  const withoutHash = hashIndex < 0 ? reference : reference.slice(0, hashIndex)
  const queryIndex = withoutHash.indexOf("?")

  return {
    pathname: queryIndex < 0 ? withoutHash : withoutHash.slice(0, queryIndex),
    search: queryIndex < 0 ? "" : withoutHash.slice(queryIndex),
  }
}

function resolveUrl(reference, relativeTo = PAGE_URL) {
  const value = reference.trim()
  if (!value || /^(?:data|blob|javascript|mailto):/i.test(value)) return null

  const base =
    typeof relativeTo === "string" ? parseHttpUrl(relativeTo) : relativeTo
  const absoluteValue = value.startsWith("//")
    ? `${base.protocol}${value}`
    : value

  if (/^https?:\/\//i.test(absoluteValue)) {
    try {
      const absoluteUrl = parseHttpUrl(absoluteValue)
      return {
        ...absoluteUrl,
        hash: "",
        href: `${absoluteUrl.origin}${absoluteUrl.pathname}${absoluteUrl.search}`,
      }
    } catch {
      return null
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(absoluteValue)) return null

  const { pathname: referencePath, search } = splitReference(absoluteValue)
  const relativeDirectory = base.pathname.slice(
    0,
    base.pathname.lastIndexOf("/") + 1
  )
  const pathname = referencePath.startsWith("/")
    ? normalizePath(referencePath)
    : referencePath
      ? normalizePath(`${relativeDirectory}${referencePath}`)
      : base.pathname
  const resolvedSearch = search || (referencePath ? "" : base.search)

  return {
    ...base,
    pathname,
    search: resolvedSearch,
    hash: "",
    href: `${base.origin}${pathname}${resolvedSearch}`,
  }
}

const PAGE_URL = parseHttpUrl(__ENV.BASE_URL || `${PRODUCTION_ORIGIN}/`)
const DEFAULT_RUN_ID = new Date().toISOString().replace(/[:.]/g, "-")
const RUN_ID =
  (__ENV.K6_RUN_ID || DEFAULT_RUN_ID)
    .toString()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || DEFAULT_RUN_ID

if (PAGE_URL.pathname !== "/" || PAGE_URL.search || PAGE_URL.hash) {
  throw new Error(
    "BASE_URL must be the site origin, for example https://example.com/."
  )
}
const isProductionHostname =
  PAGE_URL.hostname.replace(/\.$/, "") === "pct.mahiralamtohan.workers.dev"

if (isProductionHostname) {
  if (PAGE_URL.origin !== PRODUCTION_ORIGIN || PAGE_URL.protocol !== "https:") {
    throw new Error(
      `Use the exact approved production origin ${PRODUCTION_ORIGIN}/.`
    )
  }
  if (__ENV.K6_CONFIRM_PRODUCTION_TEST !== PRODUCTION_CONFIRMATION) {
    throw new Error(
      `Production traffic is gated. Re-run with -e K6_CONFIRM_PRODUCTION_TEST=${PRODUCTION_CONFIRMATION} only during the approved test window.`
    )
  }
} else {
  const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    PAGE_URL.hostname
  )

  if (__ENV.K6_ALLOW_NON_PRODUCTION !== "true") {
    throw new Error(
      "Non-production targets require -e K6_ALLOW_NON_PRODUCTION=true. Check BASE_URL carefully."
    )
  }
  if (!isLoopback && __ENV.K6_APPROVED_TARGET_HOST !== PAGE_URL.hostname) {
    throw new Error(
      "Remote non-production targets also require K6_APPROVED_TARGET_HOST to exactly match BASE_URL's hostname."
    )
  }
}

const pageDocumentFailures = new Rate("page_document_failures")
const staticAssetFailures = new Rate("static_asset_failures")
const catalogArtifactFailures = new Rate("catalog_artifact_failures")
const server5xxRate = new Rate("server_5xx_rate")
const cloudflareThrottleEvents = new Counter("cloudflare_throttle_events")
const connectionFailureEvents = new Counter("connection_failure_events")
const cdnCacheHitRate = new Rate("cdn_cache_hit_rate")
const cdnCacheObservations = new Counter("cdn_cache_observations")
const cdnCacheHits = new Counter("cdn_cache_hits")
const cdnCacheMisses = new Counter("cdn_cache_misses")
const cdnCacheOther = new Counter("cdn_cache_other")
const cdnCacheNoHeader = new Counter("cdn_cache_no_header")
const responseStatusCounts = new Counter("response_status_counts")
const observedRequestTypes = [
  "setup_document",
  "setup_asset_discovery",
  "setup_cdn_warmup",
  "page_document",
  "static_asset",
  "catalog_artifact",
  "catalog_manufacturer_dictionary",
  "catalog_packaging_dictionary",
]
const responseStatusBuckets = ["2xx", "3xx", "4xx", "5xx", "no_response", "other"]
const responseStatusMetrics = Object.fromEntries(
  observedRequestTypes.map((requestType) => [
    requestType,
    Object.fromEntries(
      responseStatusBuckets.map((bucket) => [
        bucket,
        new Counter(`response_status_${requestType}_${bucket}`),
      ])
    ),
  ])
)
const cdnCacheBuckets = ["hit", "miss", "other", "no_header"]
const cdnCacheMetrics = Object.fromEntries(
  observedRequestTypes.map((requestType) => [
    requestType,
    Object.fromEntries(
      cdnCacheBuckets.map((bucket) => [
        bucket,
        new Counter(`cdn_cache_${requestType}_${bucket}`),
      ])
    ),
  ])
)

function createTimingMetrics(prefix, includePhases = true) {
  const metrics = {
    duration: new Trend(`${prefix}_duration`, true),
  }

  if (includePhases) {
    metrics.blocked = new Trend(`${prefix}_blocked`, true)
    metrics.connecting = new Trend(`${prefix}_connecting`, true)
    metrics.tls = new Trend(`${prefix}_tls_handshaking`, true)
    metrics.sending = new Trend(`${prefix}_sending`, true)
    metrics.ttfb = new Trend(`${prefix}_ttfb`, true)
    metrics.receiving = new Trend(`${prefix}_receiving`, true)
  }

  return metrics
}

const requestTimingMetrics = {
  setup_document: createTimingMetrics("setup_document", false),
  setup_asset_discovery: createTimingMetrics("setup_asset_discovery", false),
  setup_cdn_warmup: createTimingMetrics("setup_cdn_warmup", false),
  page_document: createTimingMetrics("page_document"),
  static_asset: createTimingMetrics("static_asset"),
  catalog_artifact: createTimingMetrics("catalog_artifact"),
  catalog_manufacturer_dictionary: createTimingMetrics(
    "catalog_manufacturer_dictionary"
  ),
  catalog_packaging_dictionary: createTimingMetrics(
    "catalog_packaging_dictionary"
  ),
}
const timingMetricPhases = [
  ["blocked", "blocked"],
  ["connecting", "connecting"],
  ["tls", "tls_handshaking"],
  ["sending", "sending"],
  ["ttfb", "waiting"],
  ["receiving", "receiving"],
]
const staticAssetKinds = ["javascript", "stylesheet", "font", "image", "other"]
const staticAssetExtensionKinds = {
  ".js": "javascript",
  ".mjs": "javascript",
  ".css": "stylesheet",
  ".otf": "font",
  ".ttf": "font",
  ".woff": "font",
  ".woff2": "font",
  ".avif": "image",
  ".gif": "image",
  ".ico": "image",
  ".jpeg": "image",
  ".jpg": "image",
  ".png": "image",
  ".svg": "image",
  ".webp": "image",
}
const staticAssetKindMetrics = Object.fromEntries(
  staticAssetKinds.map((kind) => [
    kind,
    {
      duration: new Trend(`static_asset_${kind}_duration`, true),
      ttfb: new Trend(`static_asset_${kind}_ttfb`, true),
    },
  ])
)

const stageRamp = "1m"
const stageHold = "2m"

export const options = {
  discardResponseBodies: true,
  batch: 20,
  batchPerHost: 6,
  setupTimeout: "90s",
  teardownTimeout: "30s",
  summaryTrendStats: [
    "avg",
    "min",
    "med",
    "p(90)",
    "p(95)",
    "p(99)",
    "max",
  ],
  scenarios: {
    warm_page_visitors: {
      executor: "ramping-vus",
      startVUs: 0,
      gracefulRampDown: "30s",
      stages: [
        { duration: stageRamp, target: 100 },
        { duration: stageHold, target: 100 },
        { duration: stageRamp, target: 1_000 },
        { duration: stageHold, target: 1_000 },
        { duration: stageRamp, target: 2_500 },
        { duration: stageHold, target: 2_500 },
        { duration: stageRamp, target: 5_000 },
        { duration: stageHold, target: 5_000 },
        { duration: stageRamp, target: 10_000 },
        { duration: stageHold, target: 10_000 },
        { duration: stageRamp, target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: [
      {
        threshold: "rate<0.01",
        abortOnFail: true,
        delayAbortEval: "60s",
      },
    ],
    http_req_duration: [
      {
        threshold: "p(95)<2000",
        abortOnFail: true,
        delayAbortEval: "60s",
      },
    ],
    server_5xx_rate: [
      {
        threshold: "rate<0.01",
        abortOnFail: true,
        delayAbortEval: "60s",
      },
    ],
    cloudflare_throttle_events: [{ threshold: "count<1", abortOnFail: true }],
    connection_failure_events: [{ threshold: "count<1", abortOnFail: true }],
  },
}

function normalizedResponseHeader(response, name) {
  const headers = response?.headers || {}
  const targetName = name.toLowerCase()
  const directMatch =
    headers[name] ||
    headers[targetName] ||
    headers[name.toUpperCase()]

  if (directMatch) return directMatch.toString()

  const matchingKey = Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === targetName
  )

  return matchingKey ? headers[matchingKey].toString() : ""
}

function timingValue(response, key) {
  const value = response?.timings?.[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function observeResponse(
  response,
  requestType,
  assetKind = "other",
  isSetupResponse = false
) {
  const status = response?.status ?? 0
  if (!isSetupResponse) server5xxRate.add(status >= 500)
  responseStatusCounts.add(1, {
    request_type: requestType,
    status: status.toString(),
  })
  const statusBucket =
    status === 0
      ? "no_response"
      : status >= 200 && status < 300
        ? "2xx"
        : status >= 300 && status < 400
          ? "3xx"
          : status >= 400 && status < 500
            ? "4xx"
            : status >= 500
              ? "5xx"
              : "other"
  const statusMetric = responseStatusMetrics[requestType]?.[statusBucket]
  if (statusMetric) statusMetric.add(1)

  const categoryMetrics = requestTimingMetrics[requestType]
  if (categoryMetrics) {
    const duration = timingValue(response, "duration")
    if (duration !== null) categoryMetrics.duration.add(duration)

    for (const [metricName, timingName] of timingMetricPhases) {
      const metric = categoryMetrics[metricName]
      const value = timingValue(response, timingName)
      if (metric && value !== null) metric.add(value)
    }

    if (requestType === "static_asset") {
      const kindMetrics = staticAssetKindMetrics[assetKind]
      const ttfb = timingValue(response, "waiting")
      if (kindMetrics && duration !== null) kindMetrics.duration.add(duration)
      if (kindMetrics && ttfb !== null) kindMetrics.ttfb.add(ttfb)
    }
  }

  const isCloudflareBlocked =
    status === 429 ||
    (status === 403 &&
      normalizedResponseHeader(response, "server")
        .toLowerCase()
        .includes("cloudflare")) ||
    normalizedResponseHeader(response, "cf-mitigated").toLowerCase() ===
      "challenge"
  if (!isSetupResponse) {
    if (isCloudflareBlocked) cloudflareThrottleEvents.add(1)
    if (status === 0) connectionFailureEvents.add(1)
  }

  const cacheStatus = normalizedResponseHeader(
    response,
    "cf-cache-status"
  ).toLowerCase()
  const cacheBucket = !cacheStatus
    ? "no_header"
    : cacheStatus === "hit"
      ? "hit"
      : cacheStatus === "miss"
        ? "miss"
        : "other"
  cdnCacheMetrics[requestType]?.[cacheBucket]?.add(1)

  // Keep the original run-level cache and safety-rate metrics scoped to VU
  // traffic; setup requests have their own request-type diagnostics above.
  if (!isSetupResponse) {
    if (!cacheStatus) {
      cdnCacheNoHeader.add(1)
    } else {
      cdnCacheObservations.add(1)
      cdnCacheHitRate.add(cacheStatus === "hit")
      if (cacheBucket === "hit") {
        cdnCacheHits.add(1)
      } else if (cacheBucket === "miss") {
        cdnCacheMisses.add(1)
      } else {
        cdnCacheOther.add(1, { cache_status: cacheStatus })
      }
    }
  }
}

function isSuccessful(response) {
  return response.status >= 200 && response.status < 400
}

function resolveAsset(reference, relativeTo = PAGE_URL) {
  if (!reference) return ""

  const assetUrl = resolveUrl(reference, relativeTo)
  if (!assetUrl || assetUrl.origin !== PAGE_URL.origin) return ""
  if (!ASSET_EXTENSIONS.has(assetExtension(assetUrl.pathname))) return ""

  return assetUrl.href
}

function assetExtension(pathname) {
  const fileName = pathname.slice(pathname.lastIndexOf("/") + 1) || ""
  const extensionIndex = fileName.lastIndexOf(".")
  return extensionIndex < 0 ? "" : fileName.slice(extensionIndex).toLowerCase()
}

function staticAssetKind(url) {
  const extension = assetExtension(parseHttpUrl(url).pathname)
  return staticAssetExtensionKinds[extension] || "other"
}

function extractHtmlAssets(html) {
  const assets = new Set()
  const attributePattern = /\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi
  const srcsetPattern = /\bsrcset\s*=\s*(["'])(.*?)\1/gi

  for (const match of html.matchAll(attributePattern)) {
    const assetUrl = resolveAsset(match[2])
    if (assetUrl) assets.add(assetUrl)
  }

  for (const match of html.matchAll(srcsetPattern)) {
    for (const candidate of match[2].split(",")) {
      const source = candidate.trim().split(/\s+/)[0]
      const assetUrl = resolveAsset(source)
      if (assetUrl) assets.add(assetUrl)
    }
  }

  return assets
}

function extractCssAssets(css, stylesheetUrl) {
  const assets = new Set()
  const urlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi

  for (const match of css.matchAll(urlPattern)) {
    const assetUrl = resolveAsset(match[2], stylesheetUrl)
    if (assetUrl) assets.add(assetUrl)
  }

  return assets
}

function responseBody(response, description) {
  if (
    !response ||
    !isSuccessful(response) ||
    response.body === null ||
    response.body === undefined
  ) {
    const status = response ? response.status.toString() : "no response"
    throw new Error(`${description} discovery failed (${status}).`)
  }

  return response.body.toString()
}

function discoverCatalogUrl(scriptBodies) {
  const catalogPattern = /\/data\/catalog(?:\.[a-z0-9-]+)?\.dat/gi
  const matches = new Set()

  for (const body of scriptBodies) {
    for (const match of body.matchAll(catalogPattern)) {
      const catalogUrl = resolveUrl(match[0])
      if (catalogUrl && catalogUrl.origin === PAGE_URL.origin) {
        matches.add(catalogUrl.href)
      }
    }
  }

  if (matches.size !== 1) {
    throw new Error(
      `Expected one same-origin catalog.<version>.dat URL in the page bundles; found ${matches.size.toString()}. Set BASE_URL to the deployed site and verify its catalog configuration.`
    )
  }

  return [...matches][0]
}

function companionCatalogUrls(catalogUrl) {
  const artifactUrl = parseHttpUrl(catalogUrl)
  const fileName =
    artifactUrl.pathname.slice(artifactUrl.pathname.lastIndexOf("/") + 1) || ""
  const versionMatch = fileName.match(/^catalog(\.[a-z0-9-]+)?\.dat$/i)

  if (!versionMatch) {
    throw new Error(`Unexpected catalog artifact name: ${fileName}`)
  }

  const directory = artifactUrl.pathname.slice(
    0,
    artifactUrl.pathname.lastIndexOf("/") + 1
  )
  const version = versionMatch[1] || ""

  return [
    `${artifactUrl.origin}${directory}manufacturers${version}.dat`,
    `${artifactUrl.origin}${directory}packaging${version}.dat`,
  ]
}

function taggedGet(url, name, responseType) {
  return {
    method: "GET",
    url,
    params: {
      headers: DEFAULT_HEADERS,
      ...(responseType ? { responseType } : {}),
      tags: { name },
      timeout: "30s",
    },
  }
}

export function setup() {
  console.log(`k6 target: ${PAGE_URL.origin}`)
  console.log(
    "Profile: 100 → 1,000 → 2,500 → 5,000 → 10,000 VUs; 1m ramps, 2m holds; 15s think time."
  )

  const pageResponse = http.get(PAGE_URL.href, {
    headers: NAVIGATION_HEADERS,
    responseType: "text",
    tags: { name: "setup_document" },
    timeout: "30s",
  })
  observeResponse(pageResponse, "setup_document", "other", true)
  const html = responseBody(pageResponse, "Home page")
  const assetUrls = extractHtmlAssets(html)
  const discoveryUrls = [...assetUrls].filter((url) => {
    const extension = assetExtension(parseHttpUrl(url).pathname)
    return extension === ".js" || extension === ".mjs" || extension === ".css"
  })

  if (discoveryUrls.length === 0) {
    throw new Error(
      "No same-origin JavaScript or CSS assets were found in the page HTML."
    )
  }

  const discoveryRequests = discoveryUrls.map((url) =>
    taggedGet(url, "setup_asset_discovery", "text")
  )
  const discoveryResponses = http.batch(discoveryRequests)
  for (const response of discoveryResponses) {
    observeResponse(response, "setup_asset_discovery", "other", true)
  }
  const discoveredText = discoveryResponses.map((response, index) =>
    responseBody(response, `Asset ${discoveryUrls[index]}`)
  )
  const scriptBodies = discoveryResponses.flatMap((response, index) =>
    [".js", ".mjs"].includes(
      assetExtension(parseHttpUrl(discoveryUrls[index]).pathname)
    )
      ? [response.body.toString()]
      : []
  )
  const stylesheets = discoveryResponses.flatMap((response, index) =>
    assetExtension(parseHttpUrl(discoveryUrls[index]).pathname) === ".css"
      ? [[discoveryUrls[index], response.body.toString()]]
      : []
  )

  for (const [stylesheetUrl, css] of stylesheets) {
    for (const assetUrl of extractCssAssets(css, stylesheetUrl)) {
      assetUrls.add(assetUrl)
    }
  }

  const catalogUrl = discoverCatalogUrl(scriptBodies)
  const catalogUrls = [catalogUrl, ...companionCatalogUrls(catalogUrl)]
  const allAssetUrls = [...assetUrls]
  const discoverySet = new Set(discoveryUrls)
  const warmUrls = [
    ...allAssetUrls.filter((url) => !discoverySet.has(url)),
    ...catalogUrls,
  ]

  if (warmUrls.length > 0) {
    const warmResponses = http.batch(
      warmUrls.map((url) => taggedGet(url, "setup_cdn_warmup"))
    )
    for (const response of warmResponses) {
      observeResponse(response, "setup_cdn_warmup", "other", true)
    }
    const failedWarmups = warmResponses.flatMap((response, index) =>
      isSuccessful(response)
        ? []
        : [`${warmUrls[index]} (${response.status.toString()})`]
    )

    if (failedWarmups.length > 0) {
      throw new Error(
        `CDN pre-warm found unavailable resources: ${failedWarmups.join(", ")}`
      )
    }
  }

  console.log(
    `Warm-up complete: ${allAssetUrls.length.toString()} same-origin assets and ${catalogUrls.length.toString()} catalog artifacts; ${discoveredText.length.toString()} bundles inspected.`
  )

  return {
    assetUrls: allAssetUrls,
    catalogUrls,
    pageUrl: PAGE_URL.href,
  }
}

let browserCacheWarm = false

export default function (manifest) {
  const pageResponse = http.get(manifest.pageUrl, {
    headers: NAVIGATION_HEADERS,
    tags: { name: "page_document" },
    timeout: "30s",
  })
  pageDocumentFailures.add(!isSuccessful(pageResponse))
  observeResponse(pageResponse, "page_document")
  check(pageResponse, {
    "home page responds successfully": isSuccessful,
  })

  if (!browserCacheWarm) {
    const assetResponses = http.batch(
      manifest.assetUrls.map((url) => taggedGet(url, "static_asset"))
    )
    for (const [index, response] of assetResponses.entries()) {
      staticAssetFailures.add(!isSuccessful(response))
      observeResponse(
        response,
        "static_asset",
        staticAssetKind(manifest.assetUrls[index])
      )
      check(response, {
        "static asset responds successfully": isSuccessful,
      })
    }

    const catalogResponse = http.get(manifest.catalogUrls[0], {
      headers: DEFAULT_HEADERS,
      tags: { name: "catalog_artifact" },
      timeout: "30s",
    })
    catalogArtifactFailures.add(!isSuccessful(catalogResponse))
    observeResponse(catalogResponse, "catalog_artifact")
    check(catalogResponse, {
      "catalog artifact responds successfully": isSuccessful,
    })

    const dictionaryUrls = manifest.catalogUrls.slice(1)
    const dictionaryResponses = http.batch(
      dictionaryUrls.map((url, index) =>
        taggedGet(
          url,
          index === 0
            ? "catalog_manufacturer_dictionary"
            : "catalog_packaging_dictionary"
        )
      )
    )
    for (const [index, response] of dictionaryResponses.entries()) {
      catalogArtifactFailures.add(!isSuccessful(response))
      observeResponse(
        response,
        index === 0
          ? "catalog_manufacturer_dictionary"
          : "catalog_packaging_dictionary"
      )
      check(response, {
        "catalog dictionary responds successfully": isSuccessful,
      })
    }

    browserCacheWarm = true
  }

  sleep(15)
}

const requestTimingSections = [
  { key: "setup_document", label: "Setup page document", phases: false },
  {
    key: "setup_asset_discovery",
    label: "Setup asset discovery",
    phases: false,
  },
  { key: "setup_cdn_warmup", label: "Setup CDN warm-up", phases: false },
  { key: "page_document", label: "Page document", phases: true },
  { key: "static_asset", label: "Static assets (all)", phases: true },
  { key: "catalog_artifact", label: "Catalog artifact", phases: true },
  {
    key: "catalog_manufacturer_dictionary",
    label: "Manufacturer dictionary",
    phases: true,
  },
  {
    key: "catalog_packaging_dictionary",
    label: "Packaging dictionary",
    phases: true,
  },
]
const timingPhaseLabels = [
  ["blocked", "Blocked"],
  ["connecting", "Connecting"],
  ["tls_handshaking", "TLS handshake"],
  ["sending", "Sending"],
  ["ttfb", "Waiting / TTFB"],
  ["receiving", "Receiving"],
]
const safetyThresholdMetricNames = new Set([
  "http_req_failed",
  "http_req_duration",
  "server_5xx_rate",
  "cloudflare_throttle_events",
  "connection_failure_events",
])

function metricValues(summary, name) {
  return summary?.metrics?.[name]?.values || null
}

function formatMilliseconds(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a"
  return `${value.toFixed(value >= 1000 ? 0 : 2)} ms`
}

function formatCount(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value).toString()
    : "0"
}

function trendStatsLine(summary, metricName, label) {
  const values = metricValues(summary, metricName)
  if (!values) return `${label}: no samples`

  const stats = [
    ["min", "min"],
    ["avg", "avg"],
    ["med", "median"],
    ["p(90)", "p90"],
    ["p(95)", "p95"],
    ["p(99)", "p99"],
    ["max", "max"],
  ]
    .filter(([key]) => typeof values[key] === "number")
    .map(([key, title]) => `${title} ${formatMilliseconds(values[key])}`)
  const sampleCount =
    typeof values.count === "number" ? `n=${formatCount(values.count)}; ` : ""

  return stats.length > 0
    ? `${label}: ${sampleCount}${stats.join(", ")}`
    : `${label}: no summary statistics`
}

function briefMetric(summary, metricName) {
  const values = metricValues(summary, metricName)
  if (!values) return "not recorded"

  if (typeof values.rate === "number") {
    const sampleCount =
      typeof values.passes === "number" && typeof values.fails === "number"
        ? ` (${formatCount(values.passes + values.fails)} samples)`
        : ""
    return `${(values.rate * 100).toFixed(2)}%${sampleCount}`
  }
  if (typeof values.count === "number") {
    const rate =
      typeof values.rate === "number" ? `; ${values.rate.toFixed(2)}/s` : ""
    return `${formatCount(values.count)}${rate}`
  }
  if (typeof values.value === "number") return values.value.toString()
  if (typeof values.max === "number") {
    return `max ${formatCount(values.max)}${
      typeof values.min === "number" ? `; min ${formatCount(values.min)}` : ""
    }`
  }
  return "recorded; see JSON summary"
}

function collectThresholdResults(summary) {
  const results = []
  for (const [metricName, metric] of Object.entries(summary?.metrics || {})) {
    for (const [expression, result] of Object.entries(metric.thresholds || {})) {
      results.push({
        metric: metricName,
        expression,
        ok:
          typeof result === "boolean"
            ? result
            : typeof result?.ok === "boolean"
              ? result.ok
              : null,
        safetyGate: safetyThresholdMetricNames.has(metricName),
      })
    }
  }
  return results
}

function thresholdStatus(results) {
  if (results.length === 0) return "NOT EVALUATED"
  if (results.some((result) => result.ok === false)) return "FAIL"
  if (results.every((result) => result.ok === true)) return "PASS"
  return "INCOMPLETE"
}

function buildTextSummary(report) {
  const summary = report.k6Summary || {}
  const thresholds = report.thresholdResults || []
  const safetyThresholds = thresholds.filter((result) => result.safetyGate)
  const lines = [
    "PCT k6 load-test diagnostic summary",
    `Run ID: ${report.run.id}`,
    `Generated: ${report.run.generatedAt}`,
    `Target: ${report.run.targetOrigin}${report.run.isProduction ? " (production)" : " (non-production)"}`,
    `Requested peak: ${formatCount(report.run.profile.requestedPeakVUs)} VUs`,
    `Observed peak active VUs: ${briefMetric(summary, "vus")}`,
    `Preallocated VU maximum: ${briefMetric(summary, "vus_max")}`,
    `Safety gates: ${thresholdStatus(safetyThresholds)}`,
    "Category latency percentiles are report-only; no additional thresholds or exit conditions are added.",
    "",
    "Run-level signals",
    `- HTTP requests: ${briefMetric(summary, "http_reqs")}`,
    `- ${trendStatsLine(summary, "http_req_duration", "Overall HTTP request duration")}`,
    `- Failed-request rate: ${briefMetric(summary, "http_req_failed")}`,
    `- Page-document failure rate (VU workload): ${briefMetric(summary, "page_document_failures")}`,
    `- Static-asset failure rate (VU workload): ${briefMetric(summary, "static_asset_failures")}`,
    `- Catalog-artifact failure rate (VU workload): ${briefMetric(summary, "catalog_artifact_failures")}`,
    `- 5xx response rate: ${briefMetric(summary, "server_5xx_rate")}`,
    `- Cloudflare throttle/challenge events: ${briefMetric(summary, "cloudflare_throttle_events")}`,
    `- Connection failures: ${briefMetric(summary, "connection_failure_events")}`,
    `- Dropped iterations: ${briefMetric(summary, "dropped_iterations")}`,
    "",
    "Latency by request type (milliseconds)",
  ]

  for (const section of requestTimingSections) {
    lines.push(
      `- ${trendStatsLine(summary, `${section.key}_duration`, section.label)}`
    )
    if (section.phases) {
      for (const [phaseKey, phaseLabel] of timingPhaseLabels) {
        lines.push(
          `  - ${trendStatsLine(
            summary,
            `${section.key}_${phaseKey}`,
            phaseLabel
          )}`
        )
      }
    }
  }

  lines.push("", "Static asset latency by kind")
  for (const kind of staticAssetKinds) {
    lines.push(
      `- ${trendStatsLine(summary, `static_asset_${kind}_duration`, `${kind} duration`)}`
    )
    lines.push(
      `  - ${trendStatsLine(summary, `static_asset_${kind}_ttfb`, `${kind} waiting / TTFB`)}`
    )
  }

  lines.push("", "Response status classes by request type")
  for (const requestType of observedRequestTypes) {
    const counts = responseStatusBuckets.map((bucket) => [
      bucket,
      metricValues(summary, `response_status_${requestType}_${bucket}`)?.count || 0,
    ])
    if (counts.every(([, count]) => count === 0)) continue
    lines.push(
      `- ${requestType}: ${counts
        .map(([bucket, count]) => `${bucket}=${formatCount(count)}`)
        .join(", ")}`
    )
  }

  lines.push("", "CDN cache observations by request type")
  lines.push(
    `- Overall VU-traffic hit rate (setup excluded): ${briefMetric(summary, "cdn_cache_hit_rate")}`,
    "- Per-request-type counts include setup diagnostics and VU workload requests."
  )
  for (const requestType of observedRequestTypes) {
    const counts = cdnCacheBuckets.map((bucket) => [
      bucket,
      metricValues(summary, `cdn_cache_${requestType}_${bucket}`)?.count || 0,
    ])
    if (counts.every(([, count]) => count === 0)) continue
    lines.push(
      `- ${requestType}: ${counts
        .map(([bucket, count]) => `${bucket}=${formatCount(count)}`)
        .join(", ")}`
    )
  }
  lines.push(
    `- VU cache hits: ${briefMetric(summary, "cdn_cache_hits")}`,
    `- VU cache misses: ${briefMetric(summary, "cdn_cache_misses")}`,
    `- VU other cache statuses: ${briefMetric(summary, "cdn_cache_other")}`,
    `- VU-traffic cache-status headers (setup excluded): ${briefMetric(summary, "cdn_cache_observations")}`,
    `- VU responses without cf-cache-status: ${briefMetric(summary, "cdn_cache_no_header")}`
  )

  lines.push("", "Threshold results")
  if (thresholds.length === 0) {
    lines.push("- No threshold results were included in the k6 summary.")
  } else {
    for (const result of thresholds) {
      const status =
        result.ok === true ? "PASS" : result.ok === false ? "FAIL" : "UNKNOWN"
      lines.push(
        `- ${status} ${result.metric}: ${result.expression}${
          result.safetyGate ? " (safety gate)" : " (diagnostic only)"
        }`
      )
    }
  }

  lines.push(
    "",
    "Interpretation limits",
    "- k6 response timings split request duration into blocked, connection, TLS, sending, waiting/TTFB, and receiving phases. Waiting/TTFB includes network transit plus CDN/Worker/origin response work; these measurements cannot isolate Worker CPU, CDN queueing, origin time, or DNS on their own.",
    "- Zero connection/TLS time can mean connection reuse or that a phase did not apply; it does not prove the endpoint itself was fast.",
    "- This workload does not execute JavaScript or render the page. Each virtual user fetches assets/catalog once, then requests only the document, approximating warm repeat visits rather than a real browser cache.",
    "- Compare observed active VUs with the requested profile, inspect dropped iterations, and monitor generator CPU, memory, and network; generator saturation can distort latency.",
    "",
    `Detailed JSON: ${report.outputFiles.json}`,
    `Text report: ${report.outputFiles.text}`
  )

  return `${lines.join("\n")}\n`
}

export function handleSummary(data) {
  const generatedAt = new Date().toISOString()
  const jsonPath = `k6-load-test-summary-${RUN_ID}.json`
  const textPath = `k6-load-test-summary-${RUN_ID}.txt`
  const report = {
    schemaVersion: 1,
    run: {
      id: RUN_ID,
      generatedAt,
      targetOrigin: PAGE_URL.origin,
      targetHostname: PAGE_URL.hostname,
      isProduction: isProductionHostname,
      profile: {
        scenario: "warm_page_visitors",
        requestedPeakVUs: 10_000,
        thinkTimeSeconds: 15,
        stages: options.scenarios.warm_page_visitors.stages,
        requestSettings: {
          batch: options.batch,
          batchPerHost: options.batchPerHost,
          discardResponseBodies: options.discardResponseBodies,
          setupTimeout: options.setupTimeout,
          teardownTimeout: options.teardownTimeout,
        },
      },
      safetyGates: {
        http_req_failed: options.thresholds.http_req_failed,
        http_req_duration: options.thresholds.http_req_duration,
        server_5xx_rate: options.thresholds.server_5xx_rate,
        cloudflare_throttle_events:
          options.thresholds.cloudflare_throttle_events,
        connection_failure_events: options.thresholds.connection_failure_events,
      },
    },
    diagnosticDefinitions: {
      timingSource: "k6 response.timings",
      ttfbMetric: "response.timings.waiting (time waiting for the response)",
      cacheModel:
        "Each VU fetches assets and catalog artifacts in its first iteration only; later iterations fetch the HTML document only. Overall cache-rate counters cover VU workload responses; per-request-type cache counts also include setup requests.",
      limitations: [
        "No browser JavaScript execution or rendering.",
        "Waiting/TTFB combines network transit with CDN, Worker, and origin processing; the test cannot attribute delay among them.",
        "DNS is not separately exposed by the response.timings fields recorded here.",
        "Connection and TLS phases can be zero when a connection is reused or the phase does not apply.",
        "Load-generator saturation can distort latency; compare vus with the requested profile, inspect dropped_iterations, and monitor OS-level CPU, memory, and network.",
      ],
    },
    outputFiles: { json: jsonPath, text: textPath },
    thresholdResults: collectThresholdResults(data),
    k6Summary: data,
  }
  const text = buildTextSummary(report)

  return {
    [jsonPath]: `${JSON.stringify(report, null, 2)}\n`,
    [textPath]: text,
    stdout: text,
  }
}
