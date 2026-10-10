import { describe, expect, it } from "vitest"

import {
  calculateEstimateTotalCents,
  calculateLineTotalCents,
  clampEstimateQuantity,
  createEstimateLineItem,
  createEstimateSummary,
  formatUsdCents,
  normalizeEstimateItems,
  parseStoredEstimate,
  parseUsdToCents,
  serializeEstimateItems,
} from "@/data/estimate"
import type { CatalogProduct } from "@/types/catalog"

const alpha: CatalogProduct = {
  product: "ALPHA 10MG",
  content: "Example ingredient",
  manufacturer: "Acme Labs",
  packSize: "1x10",
  rate: "1.25",
}

function estimateItem(product: CatalogProduct, quantity = 1) {
  const item = createEstimateLineItem(product)
  if (!item)
    throw new Error(`Unable to create test item for ${product.product}`)
  return { ...item, quantity }
}

describe("client-side estimate calculations", () => {
  it("parses valid USD rates to integer cents and rejects unusable values", () => {
    expect(parseUsdToCents("$ 1.25")).toBe(125)
    expect(parseUsdToCents("1,200.50")).toBe(120_050)
    expect(parseUsdToCents("0")).toBe(0)
    expect(parseUsdToCents("1.2")).toBe(120)
    expect(parseUsdToCents("1,000")).toBe(100_000)
    expect(parseUsdToCents("")).toBeNull()
    expect(parseUsdToCents("contact us")).toBeNull()
    expect(parseUsdToCents("-1.00")).toBeNull()
    expect(parseUsdToCents("1.234")).toBe(123)
    expect(parseUsdToCents("1.235")).toBe(124)
    expect(parseUsdToCents("0.665")).toBe(67)
    expect(parseUsdToCents("1.2349")).toBe(123)
    expect(parseUsdToCents("$1,200.505")).toBe(120_051)
    expect(parseUsdToCents("12,34.00")).toBeNull()
    expect(parseUsdToCents("1,23,456.00")).toBeNull()
  })

  it("creates stable product snapshots and skips rows without a valid rate", () => {
    const item = createEstimateLineItem(alpha)
    expect(item).toMatchObject({
      product: "ALPHA 10MG",
      content: "Example ingredient",
      manufacturer: "Acme Labs",
      packSize: "1x10",
      unitPriceCents: 125,
      quantity: 1,
    })
    expect(item?.id).toBe(createEstimateLineItem({ ...alpha })?.id)
    expect(
      createEstimateLineItem({ ...alpha, rate: "price on request" })
    ).toBeNull()
    expect(createEstimateLineItem({ ...alpha, product: " " })).toBeNull()
  })

  it("uses integer-cent arithmetic for line subtotals and grand totals", () => {
    const first = estimateItem(alpha, 3)
    const second = estimateItem({ ...alpha, product: "BETA", rate: "0.50" }, 2)

    expect(calculateLineTotalCents(first)).toBe(BigInt(375))
    expect(calculateEstimateTotalCents([first, second])).toBe(BigInt(475))
    expect(formatUsdCents(BigInt(475))).toBe("$4.75")
    expect(formatUsdCents(475)).toBe("$4.75")

    const highValueAlpha = estimateItem(
      { ...alpha, rate: "9000000000.00" },
      9_999
    )
    const highValueBeta = estimateItem(
      { ...alpha, product: "BETA", rate: "9000000000.00" },
      9_999
    )
    expect(calculateEstimateTotalCents([highValueAlpha, highValueBeta])).toBe(
      BigInt("17998200000000000")
    )
    expect(
      formatUsdCents(
        calculateEstimateTotalCents([highValueAlpha, highValueBeta])
      )
    ).toBe("$179,982,000,000,000.00")
  })

  it("clamps quantities and safely normalizes malformed or duplicated local data", () => {
    expect(clampEstimateQuantity(0)).toBe(1)
    expect(clampEstimateQuantity(4.9)).toBe(4)
    expect(clampEstimateQuantity(Number.POSITIVE_INFINITY)).toBe(1)

    const item = estimateItem(alpha)
    expect(
      normalizeEstimateItems([
        { ...item, quantity: 2 },
        { ...item, id: "untrusted-id", quantity: 3 },
        { ...item, quantity: -10 },
        { ...item, unitPriceCents: Number.NaN },
        null,
      ])
    ).toEqual([{ ...item, quantity: 6 }])
    expect(parseStoredEstimate('{"version":2,"items":[]}')).toEqual([])
    expect(parseStoredEstimate("not json")).toEqual([])
  })

  it("round-trips the versioned local storage document and labels copied text as an estimate", () => {
    const item = estimateItem(alpha, 2)
    const serialized = serializeEstimateItems([item])

    expect(parseStoredEstimate(serialized)).toEqual([item])
    expect(createEstimateSummary([item], "PCT24X7")).toContain(
      "PCT24X7 — order estimate (not an order)"
    )
    expect(createEstimateSummary([item], "PCT24X7")).toContain(
      "2 packets of 1x10 at $1.25 each = $2.50"
    )
    expect(createEstimateSummary([item], "PCT24X7")).toContain(
      "Estimated total: $2.50"
    )
    expect(createEstimateSummary([item], "PCT24X7")).toContain(
      "No order or payment has been submitted."
    )
  })
})
