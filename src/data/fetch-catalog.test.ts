// @vitest-environment node

import { gzipSync } from "node:zlib"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { siteConfig } from "@/config/site"
import { fetchCatalogData } from "@/data/fetch-catalog"

const TEST_XOR_KEY = "fixture-key-for-tests"
const FILE_MAGIC = Buffer.from("PCTCAT2:", "ascii")
const version = "a1b2c3"

interface FixtureProduct {
  "Product Name": string
  "Active Ingredient": string
  Manufacturer: number | null
  Packaging: number | null
  "RATE (USD)": string
}

const row: FixtureProduct = {
  "Product Name": "ALPHA 10MG",
  "Active Ingredient": "Example ingredient",
  Manufacturer: 0,
  Packaging: 0,
  "RATE (USD)": "1.25",
}

const catalogPayload = {
  metadata: { minPrice: 1.25, maxPrice: 2.5 },
  products: [row],
}
const manufacturersPayload = {
  kind: "manufacturers",
  values: ["Acme Laboratories"],
}
const packagingPayload = {
  kind: "packaging",
  values: ["1x10"],
}

function encodeArtifact(value: unknown, key = TEST_XOR_KEY) {
  const keyBytes = Buffer.from(key, "utf8")
  const compressed = gzipSync(Buffer.from(JSON.stringify(value), "utf8"))
  const obfuscated = Buffer.from(
    compressed.map(
      (byte, index) => byte ^ (keyBytes.at(index % keyBytes.length) ?? 0)
    )
  )

  return Buffer.concat([FILE_MAGIC, obfuscated])
}

function buildResponseMap() {
  return new Map<string, Buffer>([
    [`catalog.${version}.dat`, encodeArtifact(catalogPayload)],
    [`manufacturers.${version}.dat`, encodeArtifact(manufacturersPayload)],
    [`packaging.${version}.dat`, encodeArtifact(packagingPayload)],
  ])
}

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  return input instanceof URL ? input.href : input.url
}

function installFetchMock(files = buildResponseMap(), failingFile?: string) {
  const fetchMock = vi.fn(
    (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      const fileName =
        new URL(requestUrl(input)).pathname.split("/").at(-1) ?? ""
      if (fileName === failingFile) {
        return Promise.resolve(new Response("missing", { status: 404 }))
      }

      const body = files.get(fileName)
      return Promise.resolve(
        body
          ? new Response(new Uint8Array(body), { status: 200 })
          : new Response("not found", { status: 404 })
      )
    }
  )

  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

beforeEach(() => {
  siteConfig.catalog.xorKey = TEST_XOR_KEY
})

describe("fetchCatalogData", () => {
  it("fetches, decodes, and joins version-matched catalog and dictionary files", async () => {
    const fetchMock = installFetchMock()
    const dataset = await fetchCatalogData(
      `https://pct-test.example/data/catalog.${version}.dat`
    )

    expect(dataset.products).toEqual([
      {
        content: "Example ingredient",
        product: "ALPHA 10MG",
        manufacturer: "Acme Laboratories",
        packSize: "1x10",
        rate: "1.25",
      },
    ])
    expect(dataset.manufacturers).toEqual(["Acme Laboratories"])
    expect(dataset.packaging).toEqual(["1x10"])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls.map(([input]) => requestUrl(input))).toEqual(
      expect.arrayContaining([
        `https://pct-test.example/data/catalog.${version}.dat`,
        `https://pct-test.example/data/manufacturers.${version}.dat`,
        `https://pct-test.example/data/packaging.${version}.dat`,
      ])
    )

    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toMatchObject({
        cache: "force-cache",
        credentials: "omit",
        mode: "cors",
      })
    }
  })

  it("rejects a missing companion dictionary instead of returning partial data", async () => {
    installFetchMock(undefined, `manufacturers.${version}.dat`)

    await expect(
      fetchCatalogData(`https://pct-test.example/data/catalog.${version}.dat`)
    ).rejects.toThrow(
      "Manufacturers dictionary request failed with status 404."
    )
  })

  it("fails with a clear message when an obfuscated artifact has no key", async () => {
    installFetchMock()
    siteConfig.catalog.xorKey = ""

    await expect(
      fetchCatalogData(`https://pct-test.example/data/catalog.${version}.dat`)
    ).rejects.toThrow(/NEXT_PUBLIC_CATALOG_XOR_KEY is not set/i)
  })

  it("reports invalid JSON and invalid catalog filenames clearly", async () => {
    const invalidJson = Buffer.from("{not json", "utf8")
    const keyBytes = Buffer.from(TEST_XOR_KEY)
    const obfuscated = Buffer.from(
      invalidJson.map(
        (byte, index) => byte ^ (keyBytes.at(index % keyBytes.length) ?? 0)
      )
    )
    const files = new Map([
      [`catalog.${version}.dat`, Buffer.concat([FILE_MAGIC, obfuscated])],
    ])
    installFetchMock(files)

    await expect(
      fetchCatalogData(`https://pct-test.example/data/catalog.${version}.dat`)
    ).rejects.toThrow(/catalog file is not valid JSON/i)

    installFetchMock(
      new Map([["catalog.json", encodeArtifact(catalogPayload)]])
    )
    await expect(
      fetchCatalogData("https://pct-test.example/data/catalog.json")
    ).rejects.toThrow(/catalog URL must point to catalog\.<version>\.dat/i)
  })

  it("retains support for a single legacy combined catalog file", async () => {
    const combined = {
      ...catalogPayload,
      manufacturers: ["Acme Laboratories"],
      packaging: ["1x10"],
    }
    const fetchMock = installFetchMock(
      new Map([[`catalog.${version}.dat`, encodeArtifact(combined)]])
    )

    const dataset = await fetchCatalogData(
      `https://pct-test.example/data/catalog.${version}.dat`
    )

    expect(dataset.products[0]?.manufacturer).toBe("Acme Laboratories")
    expect(dataset.products[0]?.packSize).toBe("1x10")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
