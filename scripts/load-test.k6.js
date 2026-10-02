/*
 * Approved, gated 10,000-VU HTTP workload. Run only in the agreed production
 * window; see TESTING.md. This approximates browser asset caching but does not
 * execute JavaScript or render the page.
 */
import http from "k6/http"
import { check, sleep } from "k6"
import { Counter, Rate } from "k6/metrics"

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

const stageRamp = "1m"
const stageHold = "2m"

export const options = {
  discardResponseBodies: true,
  batch: 20,
  batchPerHost: 6,
  setupTimeout: "90s",
  teardownTimeout: "30s",
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
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
  const targetName = name.toLowerCase()
  const directMatch =
    response.headers[name] ||
    response.headers[targetName] ||
    response.headers[name.toUpperCase()]

  if (directMatch) return directMatch.toString()

  const matchingKey = Object.keys(response.headers).find(
    (headerName) => headerName.toLowerCase() === targetName
  )

  return matchingKey ? response.headers[matchingKey].toString() : ""
}

function observeResponse(response) {
  server5xxRate.add(response.status >= 500)

  const isCloudflareBlocked =
    response.status === 429 ||
    (response.status === 403 &&
      normalizedResponseHeader(response, "server")
        .toLowerCase()
        .includes("cloudflare")) ||
    normalizedResponseHeader(response, "cf-mitigated").toLowerCase() ===
      "challenge"
  if (isCloudflareBlocked) cloudflareThrottleEvents.add(1)
  if (response.status === 0) connectionFailureEvents.add(1)

  const cacheStatus = normalizedResponseHeader(
    response,
    "cf-cache-status"
  ).toLowerCase()
  if (cacheStatus) {
    cdnCacheObservations.add(1)
    cdnCacheHitRate.add(cacheStatus === "hit")
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
  observeResponse(pageResponse)
  check(pageResponse, {
    "home page responds successfully": isSuccessful,
  })

  if (!browserCacheWarm) {
    const assetResponses = http.batch(
      manifest.assetUrls.map((url) => taggedGet(url, "static_asset"))
    )
    for (const response of assetResponses) {
      staticAssetFailures.add(!isSuccessful(response))
      observeResponse(response)
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
    observeResponse(catalogResponse)
    check(catalogResponse, {
      "catalog artifact responds successfully": isSuccessful,
    })

    const dictionaryResponses = http.batch(
      manifest.catalogUrls
        .slice(1)
        .map((url) => taggedGet(url, "catalog_dictionary"))
    )
    for (const response of dictionaryResponses) {
      catalogArtifactFailures.add(!isSuccessful(response))
      observeResponse(response)
      check(response, {
        "catalog dictionary responds successfully": isSuccessful,
      })
    }

    browserCacheWarm = true
  }

  sleep(15)
}
