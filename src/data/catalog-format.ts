import type { CatalogDataset, CatalogProduct } from "@/types/catalog"

const FIELD_ALIASES = {
  content: [
    "content",
    "active ingredient",
    "activeingredient",
    "ingredient",
    "salt",
  ],
  product: ["product", "product name", "productname", "brand name", "brand"],
  packSize: ["pack size", "packsize", "packaging", "package", "pack"],
  rate: [
    "rate (usd)",
    "rate usd",
    "rate",
    "price in usd",
    "usd price",
    "price",
  ],
  manufacturer: [
    "manufacturer",
    "manufacturer name",
    "maker",
    "mfr",
    "company",
  ],
} as const

function normalizeKey(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function findField(
  record: Record<string, unknown>,
  aliases: readonly string[]
) {
  const aliasKeys = new Set(aliases.map(normalizeKey))

  for (const [key, value] of Object.entries(record)) {
    if (aliasKeys.has(normalizeKey(key))) return value
  }

  return undefined
}

function asText(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim()
  }

  return ""
}

function distinctValues(values: string[]) {
  const distinct = new Map<string, string>()

  for (const value of values) {
    const trimmed = value.trim()
    const key = normalizeKey(trimmed)
    if (key && !distinct.has(key)) distinct.set(key, trimmed)
  }

  return [...distinct.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" })
  )
}

function rowsFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    const rows: unknown[] = value
    const [headerCandidate, ...dataRows] = rows

    if (rows.length > 1 && Array.isArray(headerCandidate)) {
      const headers: unknown[] = headerCandidate

      if (headers.every((item): item is string => typeof item === "string")) {
        return dataRows.map((row) => {
          if (!Array.isArray(row)) return row

          const cells: unknown[] = row
          return Object.fromEntries(
            headers.map((header, index) => [header, cells.at(index)])
          )
        })
      }
    }

    return rows
  }

  const record = asRecord(value)

  if (record) {
    const rowKeyNames = new Set([
      "products",
      "catalog",
      "items",
      "data",
      "rows",
      "values",
    ])

    for (const [key, nested] of Object.entries(record)) {
      if (rowKeyNames.has(normalizeKey(key))) return rowsFrom(nested)
    }

    const values = Object.values(record)
    if (values.length > 0 && values.every((item) => asRecord(item) !== null)) {
      return values
    }
  }

  throw new Error("Catalog data must be an array of product records.")
}

function normalizeProduct(
  record: Record<string, unknown>,
  dictionaries?: { manufacturers: string[]; packaging: string[] }
): CatalogProduct | null {
  const content = asText(findField(record, FIELD_ALIASES.content))
  const product = asText(findField(record, FIELD_ALIASES.product))

  if (!content || !product) return null

  const rawRate = asText(findField(record, FIELD_ALIASES.rate))
  const rate = rawRate.replace(/^\$\s*/, "")
  const manufacturerValue = findField(record, FIELD_ALIASES.manufacturer)
  const packagingValue = findField(record, FIELD_ALIASES.packSize)

  if (dictionaries) {
    return {
      content,
      product,
      rate,
      manufacturer: resolveDictionaryValue(
        manufacturerValue,
        dictionaries.manufacturers,
        "manufacturer"
      ),
      packSize: resolveDictionaryValue(
        packagingValue,
        dictionaries.packaging,
        "packaging"
      ),
    }
  }

  return {
    content,
    product,
    rate,
    manufacturer: asText(manufacturerValue),
    packSize: asText(packagingValue),
  }
}

function resolveDictionaryValue(
  value: unknown,
  dictionary: string[],
  field: string
) {
  if (value === null || value === undefined || value === "") return ""

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value >= dictionary.length
  ) {
    throw new Error(`Catalog ${field} dictionary contains an invalid index.`)
  }

  return dictionary.at(value) ?? ""
}

function normalizePriceMetadata(value: unknown) {
  const metadata = asRecord(value)
  if (!metadata) return undefined

  const minPrice =
    typeof metadata.minPrice === "number" ? metadata.minPrice : Number.NaN
  const maxPrice =
    typeof metadata.maxPrice === "number" ? metadata.maxPrice : Number.NaN

  if (
    !Number.isFinite(minPrice) ||
    !Number.isFinite(maxPrice) ||
    minPrice < 0 ||
    maxPrice <= minPrice
  ) {
    return undefined
  }

  return { minPrice, maxPrice }
}

function normalizeLegacyRows(rows: unknown[]): CatalogDataset {
  const products = rows.flatMap((row) => {
    const record = asRecord(row)
    if (!record) return []

    const normalized = normalizeProduct(record)
    return normalized ? [normalized] : []
  })

  return {
    products,
    manufacturers: distinctValues(
      products.map(({ manufacturer }) => manufacturer)
    ),
    packaging: distinctValues(products.map(({ packSize }) => packSize)),
  }
}

export function normalizeCatalogData(value: unknown): CatalogDataset {
  const record = asRecord(value)

  if (
    record &&
    Array.isArray(record.products) &&
    Array.isArray(record.manufacturers) &&
    Array.isArray(record.packaging)
  ) {
    const manufacturers = record.manufacturers.map(asText)
    const packaging = record.packaging.map(asText)

    if (
      manufacturers.some((entry) => !entry) ||
      packaging.some((entry) => !entry)
    ) {
      throw new Error("Catalog dictionaries cannot contain empty values.")
    }

    const dictionaries = { manufacturers, packaging }
    const products = record.products.flatMap((row) => {
      const productRecord = asRecord(row)
      if (!productRecord) return []

      const product = normalizeProduct(productRecord, dictionaries)
      return product ? [product] : []
    })

    return {
      products,
      manufacturers,
      packaging,
      metadata: normalizePriceMetadata(record.metadata),
    }
  }

  return normalizeLegacyRows(rowsFrom(value))
}
