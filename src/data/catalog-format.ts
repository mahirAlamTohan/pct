export interface CatalogProduct {
  content: string
  product: string
  packSize: string
  rate: string
  manufacturer: string
}

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
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "")
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
    if (aliasKeys.has(normalizeKey(key))) {
      return value
    }
  }

  return undefined
}

function asText(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim()
  }

  return ""
}

function rowsFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    const rows: unknown[] = value
    const [headerCandidate, ...dataRows] = rows

    if (rows.length > 1 && Array.isArray(headerCandidate)) {
      const headers: unknown[] = headerCandidate

      if (headers.every((item): item is string => typeof item === "string")) {
        return dataRows.map((row) => {
          if (!Array.isArray(row)) {
            return row
          }

          const cells: unknown[] = row

          return Object.fromEntries(
            // Index pairs parallel header and row arrays; headers are validated strings.
            // eslint-disable-next-line security/detect-object-injection -- array index is bounded by the validated header count
            headers.map((header, index) => [header, cells[index]])
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
      if (rowKeyNames.has(normalizeKey(key))) {
        return rowsFrom(nested)
      }
    }

    const values = Object.values(record)
    if (values.length > 0 && values.every((item) => asRecord(item) !== null)) {
      return values
    }
  }

  throw new Error("Catalog data must be an array of product records.")
}

export function normalizeCatalogData(value: unknown): CatalogProduct[] {
  return rowsFrom(value).flatMap((row) => {
    const record = asRecord(row)

    if (!record) {
      return []
    }

    const content = asText(findField(record, FIELD_ALIASES.content))
    const product = asText(findField(record, FIELD_ALIASES.product))

    if (!content || !product) {
      return []
    }

    const rate = asText(findField(record, FIELD_ALIASES.rate)).replace(
      /^\$\s*/,
      ""
    )

    return [
      {
        content,
        product,
        packSize: asText(findField(record, FIELD_ALIASES.packSize)),
        rate,
        manufacturer: asText(findField(record, FIELD_ALIASES.manufacturer)),
      },
    ]
  })
}
