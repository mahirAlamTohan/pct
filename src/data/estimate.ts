import type { CatalogProduct } from "@/types/catalog"
import type {
  EstimateLineItem,
  EstimateStorageDocument,
} from "@/types/estimate"

export const ESTIMATE_STORAGE_KEY = "pct24x7:order-estimate:v1"
export const MAX_ESTIMATE_QUANTITY = 9_999
const MAX_UNIT_PRICE_CENTS = Math.floor(
  Number.MAX_SAFE_INTEGER / MAX_ESTIMATE_QUANTITY
)
const MAX_TEXT_LENGTH = 4_096
const MAX_STORAGE_DOCUMENT_LENGTH = 1_000_000

function normalizedText(value: string) {
  return value.trim().normalize("NFKC").replace(/\s+/g, " ").toLowerCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function usableText(value: unknown, required = false): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_TEXT_LENGTH &&
    (!required || value.trim().length > 0)
  )
}

function estimateItemId(item: Omit<EstimateLineItem, "id" | "quantity">) {
  return JSON.stringify([
    normalizedText(item.product),
    normalizedText(item.content),
    normalizedText(item.manufacturer),
    normalizedText(item.packSize),
    item.unitPriceCents,
  ])
}

export function parseUsdToCents(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_TEXT_LENGTH) return null

  const withoutCurrency = trimmed.startsWith("$")
    ? trimmed.slice(1).trimStart()
    : trimmed
  const decimalSeparator = withoutCurrency.indexOf(".")
  if (
    decimalSeparator !== withoutCurrency.lastIndexOf(".") ||
    decimalSeparator === 0
  ) {
    return null
  }
  const wholePart =
    decimalSeparator === -1
      ? withoutCurrency
      : withoutCurrency.slice(0, decimalSeparator)
  const decimalPart: string | undefined =
    decimalSeparator === -1
      ? undefined
      : withoutCurrency.slice(decimalSeparator + 1)
  const digitGroups = wholePart.split(",")
  const isDigits = (part: string) => {
    if (part.length === 0) return false
    for (let index = 0; index < part.length; index += 1) {
      const digit = part.charCodeAt(index)
      if (digit < 48 || digit > 57) return false
    }
    return true
  }
  if (!digitGroups.every(isDigits)) return null
  const firstComma = wholePart.indexOf(",")
  const firstDigitGroup =
    firstComma === -1 ? wholePart : wholePart.slice(0, firstComma)
  if (
    digitGroups.length > 1 &&
    (firstDigitGroup.length > 3 ||
      digitGroups.slice(1).some((group) => group.length !== 3))
  ) {
    return null
  }
  if (decimalPart !== undefined && !isDigits(decimalPart)) return null

  const wholeDollars = Number(digitGroups.join(""))
  const centDigits = (decimalPart ?? "").slice(0, 2).padEnd(2, "0")
  const fractionalCents =
    Number(centDigits) + ((decimalPart?.charCodeAt(2) ?? 48) >= 53 ? 1 : 0)
  const cents = wholeDollars * 100 + fractionalCents
  return Number.isSafeInteger(cents) && cents <= MAX_UNIT_PRICE_CENTS
    ? cents
    : null
}

export function createEstimateLineItem(
  product: CatalogProduct
): EstimateLineItem | null {
  const name = product.product.trim()
  const unitPriceCents = parseUsdToCents(product.rate)
  if (!name || unitPriceCents === null) return null

  const details = {
    product: name,
    content: product.content.trim(),
    manufacturer: product.manufacturer.trim(),
    packSize: product.packSize.trim(),
    unitPriceCents,
  }

  return {
    ...details,
    id: estimateItemId(details),
    quantity: 1,
  }
}

export function clampEstimateQuantity(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(MAX_ESTIMATE_QUANTITY, Math.max(1, Math.trunc(value)))
}

export function normalizeEstimateItems(value: unknown): EstimateLineItem[] {
  if (!Array.isArray(value)) return []

  const normalized = new Map<string, EstimateLineItem>()
  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !usableText(candidate.product, true) ||
      !usableText(candidate.content) ||
      !usableText(candidate.manufacturer) ||
      !usableText(candidate.packSize) ||
      !Number.isSafeInteger(candidate.unitPriceCents) ||
      (candidate.unitPriceCents as number) < 0 ||
      (candidate.unitPriceCents as number) > MAX_UNIT_PRICE_CENTS ||
      !Number.isFinite(candidate.quantity)
    ) {
      continue
    }

    const details = {
      product: candidate.product.trim(),
      content: candidate.content.trim(),
      manufacturer: candidate.manufacturer.trim(),
      packSize: candidate.packSize.trim(),
      unitPriceCents: candidate.unitPriceCents as number,
    }
    const id = estimateItemId(details)
    const quantity = clampEstimateQuantity(candidate.quantity as number)
    const existing = normalized.get(id)

    if (existing) {
      existing.quantity = clampEstimateQuantity(existing.quantity + quantity)
      continue
    }

    normalized.set(id, { ...details, id, quantity })
  }

  return [...normalized.values()]
}

export function serializeEstimateItems(
  items: readonly EstimateLineItem[]
): string {
  const document: EstimateStorageDocument = {
    version: 1,
    items: normalizeEstimateItems(items),
  }
  return JSON.stringify(document)
}

export function parseStoredEstimate(value: string | null): EstimateLineItem[] {
  if (!value || value.length > MAX_STORAGE_DOCUMENT_LENGTH) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed) || parsed.version !== 1) return []
    return normalizeEstimateItems(parsed.items)
  } catch {
    return []
  }
}

export function calculateLineTotalCents(item: EstimateLineItem) {
  return BigInt(item.unitPriceCents) * BigInt(item.quantity)
}

export function calculateEstimateTotalCents(
  items: readonly EstimateLineItem[]
) {
  return items.reduce(
    (total, item) => total + calculateLineTotalCents(item),
    BigInt(0)
  )
}

export function formatUsdCents(cents: number | bigint) {
  const zero = BigInt(0)
  const oneHundred = BigInt(100)
  const normalizedCents =
    typeof cents === "bigint"
      ? cents < zero
        ? zero
        : cents
      : Number.isFinite(cents)
        ? BigInt(Math.max(0, Math.round(cents)))
        : zero
  const dollars = normalizedCents / oneHundred
  const fractionalCents = (normalizedCents % oneHundred)
    .toString()
    .padStart(2, "0")
  const formattedDollars = new Intl.NumberFormat("en-US").format(dollars)
  return `$${formattedDollars}.${fractionalCents}`
}

export function createEstimateSummary(
  items: readonly EstimateLineItem[],
  siteName: string
) {
  const lines = [
    `${siteName} — order estimate (not an order)`,
    "",
    ...items.map((item) => {
      const packetLabel = item.quantity === 1 ? "packet" : "packets"
      const packDetails = item.packSize ? ` of ${item.packSize}` : ""
      return `${item.product} — ${String(item.quantity)} ${packetLabel}${packDetails} at ${formatUsdCents(item.unitPriceCents)} each = ${formatUsdCents(calculateLineTotalCents(item))}`
    }),
    "",
    `Estimated total: ${formatUsdCents(calculateEstimateTotalCents(items))}`,
    "Prices are estimates and may change. No order or payment has been submitted.",
  ]

  return lines.join("\n")
}
