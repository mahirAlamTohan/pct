import { siteConfig } from "@/config/site"
import { normalizeCatalogData } from "@/data/catalog-format"
import type { CatalogDataset } from "@/types/catalog"

const CATALOG_MAGIC_V1 = "PCTCAT1:"
const CATALOG_MAGIC_V2 = "PCTCAT2:"

function xorDecode(bytes: Uint8Array, key: string) {
  const keyBytes = new TextEncoder().encode(key)

  if (keyBytes.length === 0) {
    throw new Error("The catalog XOR key is empty.")
  }

  return bytes.map(
    (byte, index) => byte ^ (keyBytes.at(index % keyBytes.length) ?? 0)
  )
}

export async function fetchCatalogData(
  url: string,
  signal?: AbortSignal
): Promise<CatalogDataset> {
  const response = await fetch(url, {
    cache: "force-cache",
    credentials: "omit",
    mode: "cors",
    signal,
  })

  if (!response.ok) {
    throw new Error(
      `Catalog request failed with status ${response.status.toString()}.`
    )
  }

  const responseBytes = new Uint8Array(await response.arrayBuffer())
  const responseMagic = new TextDecoder().decode(
    responseBytes.subarray(0, CATALOG_MAGIC_V2.length)
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

    payload = xorDecode(responseBytes.slice(CATALOG_MAGIC_V2.length), key)
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

  return normalizeCatalogData(JSON.parse(jsonText) as unknown)
}
