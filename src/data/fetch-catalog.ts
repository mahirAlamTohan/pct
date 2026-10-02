import { siteConfig } from "@/config/site"
import {
  normalizeCatalogData,
  normalizeCatalogFiles,
} from "@/data/catalog-format"
import type { CatalogDataset } from "@/types/catalog"

const CATALOG_MAGIC_V1 = "PCTCAT1:"
const CATALOG_MAGIC_V2 = "PCTCAT2:"
const CATALOG_CACHE_NAME = "pct-catalog-data-v1"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function xorDecode(bytes: Uint8Array, key: string) {
  const keyBytes = new TextEncoder().encode(key)

  if (keyBytes.length === 0) {
    throw new Error("The catalog XOR key is empty.")
  }

  return bytes.map(
    (byte, index) => byte ^ (keyBytes.at(index % keyBytes.length) ?? 0)
  )
}

function siblingArtifactUrl(catalogUrl: string, artifactName: string) {
  const baseUrl =
    typeof window === "undefined" ? "http://localhost/" : window.location.href
  const url = new URL(catalogUrl, baseUrl)
  const pathSegments = url.pathname.split("/")
  const fileName = pathSegments.pop() ?? ""
  const normalizedFileName = fileName.toLocaleLowerCase()
  const hasCatalogVersion =
    normalizedFileName.startsWith("catalog.") &&
    normalizedFileName.endsWith(".dat")
  const version = hasCatalogVersion
    ? normalizedFileName.slice("catalog".length, -".dat".length)
    : ""
  const isValidVersion =
    version.length > 1 &&
    version.length <= 33 &&
    Array.from(version.slice(1)).every((character) => {
      const code = character.charCodeAt(0)
      return (
        (code >= 48 && code <= 57) ||
        (code >= 97 && code <= 122) ||
        character === "-"
      )
    })
  const isUnversionedCatalog = normalizedFileName === "catalog.dat"

  if (!isUnversionedCatalog && !isValidVersion) {
    throw new Error(
      "The catalog URL must point to catalog.<version>.dat so its manufacturer and packaging files can be located."
    )
  }

  pathSegments.push(`${artifactName}${isUnversionedCatalog ? "" : version}.dat`)
  url.pathname = pathSegments.join("/")
  return url.toString()
}

async function getCachedArtifact(url: string) {
  if (typeof caches === "undefined") return undefined

  try {
    return await caches.match(url)
  } catch {
    return undefined
  }
}

async function storeCachedArtifact(url: string, response: Response) {
  if (typeof caches === "undefined" || response.type === "opaque") return

  try {
    const cache = await caches.open(CATALOG_CACHE_NAME)
    await cache.put(url, response.clone())
  } catch {
    // Quota or privacy settings may disable caching; network use still works.
  }
}

async function fetchArtifact(
  url: string,
  signal: AbortSignal | undefined,
  label: string
): Promise<unknown> {
  let response: Response
  let shouldCacheResponse = false

  try {
    response = await fetch(url, {
      cache: "force-cache",
      credentials: "omit",
      mode: "cors",
      signal,
    })
    if (!response.ok) {
      const cachedResponse = await getCachedArtifact(url)
      if (cachedResponse) {
        response = cachedResponse
      } else {
        throw new Error(
          `${label} request failed with status ${response.status.toString()}.`
        )
      }
    } else {
      shouldCacheResponse = true
    }
  } catch (error) {
    if (signal?.aborted) throw error

    const cachedResponse = await getCachedArtifact(url)
    if (!cachedResponse) throw error
    response = cachedResponse
  }

  if (!response.ok) {
    throw new Error(
      `${label} request failed with status ${response.status.toString()}.`
    )
  }

  const responseToCache = shouldCacheResponse ? response.clone() : undefined
  const responseBytes = new Uint8Array(await response.arrayBuffer())
  const magicLength = CATALOG_MAGIC_V2.length
  const responseMagic = new TextDecoder().decode(
    responseBytes.subarray(0, magicLength)
  )
  const isObfuscated =
    responseMagic === CATALOG_MAGIC_V1 || responseMagic === CATALOG_MAGIC_V2
  let payload = responseBytes

  if (isObfuscated) {
    const key = siteConfig.catalog.xorKey

    if (!key) {
      throw new Error(
        "The catalog is XOR-obfuscated, but NEXT_PUBLIC_CATALOG_XOR_KEY is not set in the site build."
      )
    }

    payload = xorDecode(responseBytes.slice(magicLength), key)
  }

  const isGzipPayload = payload[0] === 0x1f && payload[1] === 0x8b
  let jsonText: string

  if (isGzipPayload) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser does not support gzip catalog downloads.")
    }

    const stream = new Blob([payload.buffer])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"))
    jsonText = await new Response(stream).text()
  } else {
    jsonText = new TextDecoder().decode(payload)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText) as unknown
  } catch {
    throw new Error(`The ${label.toLocaleLowerCase()} file is not valid JSON.`)
  }

  if (responseToCache) await storeCachedArtifact(url, responseToCache)
  return parsed
}

export async function fetchCatalogData(
  url: string,
  signal?: AbortSignal
): Promise<CatalogDataset> {
  const catalogPayload = await fetchArtifact(url, signal, "Catalog")

  if (!isRecord(catalogPayload) || !Array.isArray(catalogPayload.products)) {
    return normalizeCatalogData(catalogPayload)
  }

  if (
    Array.isArray(catalogPayload.manufacturers) &&
    Array.isArray(catalogPayload.packaging)
  ) {
    return normalizeCatalogData(catalogPayload)
  }

  const manufacturersUrl = siblingArtifactUrl(url, "manufacturers")
  const packagingUrl = siblingArtifactUrl(url, "packaging")
  const [manufacturersPayload, packagingPayload] = await Promise.all([
    fetchArtifact(manufacturersUrl, signal, "Manufacturers dictionary"),
    fetchArtifact(packagingUrl, signal, "Packaging dictionary"),
  ])

  return normalizeCatalogFiles(
    catalogPayload,
    manufacturersPayload,
    packagingPayload
  )
}
