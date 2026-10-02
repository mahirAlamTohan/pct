import { describe, expect, it } from "vitest"

import {
  normalizeCatalogData,
  normalizeCatalogFiles,
} from "@/data/catalog-format"

const catalogFixture = {
  metadata: { minPrice: 1.25, maxPrice: 9.5 },
  products: [
    {
      "Product Name": "ALPHA 10MG",
      "Active Ingredient": "Example ingredient",
      Manufacturer: 0,
      Packaging: 0,
      "RATE (USD)": "1.25",
    },
    {
      "Product Name": "BETA 20MG",
      "Active Ingredient": "",
      Manufacturer: null,
      Packaging: 1,
      "RATE (USD)": "9.50",
    },
    null,
    {
      "Product Name": "",
      "Active Ingredient": "Orphan ingredient",
      Manufacturer: null,
      Packaging: null,
      "RATE (USD)": "3.00",
    },
  ],
}

const manufacturersFixture = {
  kind: "manufacturers",
  values: ["Acme Laboratories"],
}

const packagingFixture = {
  kind: "packaging",
  values: ["1x10", "bottle of 100"],
}

describe("catalog normalization", () => {
  it("expands independent dictionary indexes and preserves the five source fields", () => {
    const dataset = normalizeCatalogFiles(
      catalogFixture,
      manufacturersFixture,
      packagingFixture
    )

    expect(dataset.products).toHaveLength(2)
    expect(dataset.products[0]).toEqual({
      content: "Example ingredient",
      product: "ALPHA 10MG",
      manufacturer: "Acme Laboratories",
      packSize: "1x10",
      rate: "1.25",
    })
    expect(dataset.products[1]).toEqual({
      content: "",
      product: "BETA 20MG",
      manufacturer: "",
      packSize: "bottle of 100",
      rate: "9.50",
    })
    expect(dataset.manufacturers).toEqual(["Acme Laboratories"])
    expect(dataset.packaging).toEqual(["1x10", "bottle of 100"])
    expect(dataset.metadata).toEqual({ minPrice: 1.25, maxPrice: 9.5 })
    expect(Object.keys(dataset.products[0]).sort()).toEqual(
      ["content", "product", "manufacturer", "packSize", "rate"].sort()
    )
  })

  it.each([
    [
      "manufacturer",
      {
        ...catalogFixture,
        products: [{ ...catalogFixture.products[0], Manufacturer: 1 }],
      },
    ],
    [
      "packaging",
      {
        ...catalogFixture,
        products: [{ ...catalogFixture.products[0], Packaging: 2 }],
      },
    ],
  ])(
    "rejects an out-of-range %s dictionary index",
    (_field, invalidCatalog) => {
      expect(() =>
        normalizeCatalogFiles(
          invalidCatalog,
          manufacturersFixture,
          packagingFixture
        )
      ).toThrow(/dictionary contains an invalid index/i)
    }
  )

  it("rejects swapped, malformed, or empty dictionary artifacts", () => {
    expect(() =>
      normalizeCatalogFiles(
        catalogFixture,
        packagingFixture,
        manufacturersFixture
      )
    ).toThrow(/manufacturers catalog dictionary file is invalid/i)
    expect(() =>
      normalizeCatalogFiles(
        catalogFixture,
        { kind: "manufacturers", values: [""] },
        packagingFixture
      )
    ).toThrow(/manufacturers catalog dictionary contains empty values/i)
  })

  it("keeps products with blank ingredients but skips non-record and nameless rows", () => {
    const dataset = normalizeCatalogFiles(
      catalogFixture,
      manufacturersFixture,
      packagingFixture
    )

    expect(dataset.products.map(({ product }) => product)).toEqual([
      "ALPHA 10MG",
      "BETA 20MG",
    ])
    expect(dataset.products[1]?.content).toBe("")
  })

  it("supports the legacy combined catalog format and derives separate facets", () => {
    const dataset = normalizeCatalogData({
      products: [
        {
          "Product Name": "LEGACY ITEM",
          "Active Ingredient": "legacy ingredient",
          Manufacturer: "Legacy Labs",
          Packaging: "1x30",
          "RATE (USD)": "$2.00",
        },
      ],
    })

    expect(dataset.products[0]?.manufacturer).toBe("Legacy Labs")
    expect(dataset.manufacturers).toEqual(["Legacy Labs"])
    expect(dataset.packaging).toEqual(["1x30"])
    expect(dataset.products[0]?.rate).toBe("2.00")
  })

  it("ignores invalid price metadata without losing otherwise valid products", () => {
    const dataset = normalizeCatalogData({
      products: [
        {
          "Product Name": "ITEM",
          "RATE (USD)": "1.00",
        },
      ],
      manufacturers: [],
      packaging: [],
      metadata: { minPrice: 5, maxPrice: 1 },
    })

    expect(dataset.products).toHaveLength(1)
    expect(dataset.metadata).toBeUndefined()
  })

  it("rejects a payload that cannot be interpreted as product records", () => {
    expect(() => normalizeCatalogData(null)).toThrow(
      /catalog data must be an array of product records/i
    )
  })
})
