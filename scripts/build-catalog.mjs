#!/usr/bin/env node

import { randomBytes } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import { gzipSync } from "node:zlib"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..")
const ENV_FILE = path.join(REPOSITORY_ROOT, ".env")
const XOR_KEY_NAME = "NEXT_PUBLIC_CATALOG_XOR_KEY"
const FILE_MAGIC = Buffer.from("PCTCAT2:", "ascii")

const FIELD_ALIASES = {
  content: [
    "content",
    "active ingredient",
    "active ingredients",
    "activeingredient",
    "ingredient",
    "generic name",
    "composition",
    "drug content",
    "salt",
  ],
  product: [
    "product",
    "product name",
    "productname",
    "brand name",
    "brand",
    "medicine name",
    "item name",
    "drug name",
    "name",
  ],
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
}

const OUTPUT_FIELDS = {
  product: "Product Name",
  content: "Active Ingredient",
  manufacturer: "Manufacturer",
  packSize: "Packaging",
  rate: "RATE (USD)",
}

function printUsage() {
  console.log(`Usage:
  node scripts/build-catalog.mjs --input <absolute-json-path> --output <absolute-output-folder>

PowerShell example:
  node .\\scripts\\build-catalog.mjs --input "C:\\data\\Price List.json" --output "C:\\data\\catalog-output"

The builder writes catalog.<version>.dat, manufacturers.<version>.dat, and packaging.<version>.dat.
The XOR key is read from ${XOR_KEY_NAME} in the repository .env file or process environment.`)
}

function parseArguments(args) {
  const options = { input: "", output: "" }
  const positional = []

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]

    if (argument === "--help" || argument === "-h") {
      printUsage()
      process.exit(0)
    }

    if (argument === "--input" || argument === "-i") {
      options.input = args[index + 1] ?? ""
      index += 1
      continue
    }

    if (argument === "--output" || argument === "-o") {
      options.output = args[index + 1] ?? ""
      index += 1
      continue
    }

    if (argument.startsWith("--input=")) {
      options.input = argument.slice("--input=".length)
      continue
    }

    if (argument.startsWith("--output=")) {
      options.output = argument.slice("--output=".length)
      continue
    }

    positional.push(argument)
  }

  options.input ||= positional[0] ?? ""
  options.output ||= positional[1] ?? ""
  return options
}

function parseEnvValue(lineValue) {
  const value = lineValue.trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const unquoted = value.slice(1, -1)
    return value.startsWith('"')
      ? unquoted
          .replaceAll("\\n", "\n")
          .replaceAll("\\r", "\r")
          .replaceAll('\\"', '"')
          .replaceAll("\\\\", "\\")
      : unquoted
  }

  return value.replace(/\s+#.*$/, "").trim()
}

function readEnvValue(name) {
  const processValue = process.env[name]?.trim()
  if (processValue) return processValue

  if (!existsSync(ENV_FILE)) return ""

  const lines = readFileSync(ENV_FILE, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim().replace(/^export\s+/, "")
    const separator = trimmed.indexOf("=")
    if (separator < 0) continue

    const key = trimmed.slice(0, separator).trim()
    if (key === name) {
      return parseEnvValue(trimmed.slice(separator + 1))
    }
  }

  return ""
}

function normalizeKey(value) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function rowsFrom(value) {
  if (Array.isArray(value)) {
    const [firstRow, ...dataRows] = value

    if (
      value.length > 1 &&
      Array.isArray(firstRow) &&
      firstRow.every((cell) => typeof cell === "string")
    ) {
      return dataRows.map((row) => {
        if (!Array.isArray(row)) return row
        return Object.fromEntries(
          firstRow.map((header, index) => [header, row[index]])
        )
      })
    }

    return value
  }

  if (isRecord(value)) {
    const rowKeys = new Set([
      "products",
      "catalog",
      "items",
      "data",
      "rows",
      "values",
    ])

    for (const [key, nested] of Object.entries(value)) {
      if (rowKeys.has(normalizeKey(key))) return rowsFrom(nested)
    }

    const values = Object.values(value)
    if (values.length > 0 && values.every(isRecord)) return values
  }

  throw new Error(
    "The JSON must contain product records as an array, a headed rows/values table, or an object with a products/data/rows/values property."
  )
}

function asText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim()
  }
  return ""
}

function numericPrice(value) {
  const normalized = asText(value).replace(/[$,\s]/g, "")
  if (!normalized) return null

  const number = Number(normalized)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function findField(record, aliases) {
  const aliasesByKey = new Set(aliases.map(normalizeKey))

  for (const [key, value] of Object.entries(record)) {
    if (aliasesByKey.has(normalizeKey(key))) return value
  }

  return undefined
}

function normalizeRows(parsedJson) {
  const sourceRows = rowsFrom(parsedJson)
  const products = []
  const manufacturers = []
  const packaging = []
  const manufacturerIndexes = new Map()
  const packagingIndexes = new Map()
  let skippedRows = 0
  let nonRecordRows = 0
  let missingProductNames = 0
  let missingIngredients = 0
  const skippedExamples = { nonObject: [], missingProductName: [] }
  const missingIngredientExamples = []

  function dictionaryIndex(value, values, indexes) {
    const text = asText(value)
    if (!text) return null

    const key = normalizeKey(text)
    const existingIndex = indexes.get(key)
    if (existingIndex !== undefined) return existingIndex

    const index = values.length
    values.push(text)
    indexes.set(key, index)
    return index
  }

  for (const [rowIndex, row] of sourceRows.entries()) {
    if (!isRecord(row)) {
      skippedRows += 1
      nonRecordRows += 1
      if (skippedExamples.nonObject.length < 5) {
        skippedExamples.nonObject.push({ row: rowIndex + 1 })
      }
      continue
    }

    const content = asText(findField(row, FIELD_ALIASES.content))
    const product = asText(findField(row, FIELD_ALIASES.product))

    if (!product) {
      skippedRows += 1
      missingProductNames += 1
      if (skippedExamples.missingProductName.length < 5) {
        skippedExamples.missingProductName.push({
          row: rowIndex + 1,
          activeIngredient: content.slice(0, 100),
          sourceFields: Object.keys(row).slice(0, 8),
        })
      }
      continue
    }

    if (!content) {
      missingIngredients += 1
      if (missingIngredientExamples.length < 5) {
        missingIngredientExamples.push({
          row: rowIndex + 1,
          product: product.slice(0, 100),
          sourceFields: Object.keys(row).slice(0, 8),
        })
      }
    }

    const manufacturer = asText(findField(row, FIELD_ALIASES.manufacturer))
    const packSize = asText(findField(row, FIELD_ALIASES.packSize))
    const rate = asText(findField(row, FIELD_ALIASES.rate)).replace(
      /^\$\s*/,
      ""
    )

    products.push({
      [OUTPUT_FIELDS.product]: product,
      [OUTPUT_FIELDS.content]: content,
      [OUTPUT_FIELDS.manufacturer]: dictionaryIndex(
        manufacturer,
        manufacturers,
        manufacturerIndexes
      ),
      [OUTPUT_FIELDS.packSize]: dictionaryIndex(
        packSize,
        packaging,
        packagingIndexes
      ),
      [OUTPUT_FIELDS.rate]: rate,
    })
  }

  if (products.length === 0) {
    throw new Error(
      "No valid products were found. A Product Name (or supported alias) is required; Active Ingredient may be blank."
    )
  }

  const prices = products
    .map((product) => numericPrice(product[OUTPUT_FIELDS.rate]))
    .filter((price) => price !== null)
  const minPrice =
    prices.length > 0
      ? Math.floor(
          prices.reduce((lowest, price) => Math.min(lowest, price), Infinity) *
            100
        ) / 100
      : 0
  let maxPrice =
    prices.length > 0
      ? Math.ceil(
          prices.reduce(
            (highest, price) => Math.max(highest, price),
            -Infinity
          ) * 100
        ) / 100
      : 1000

  if (maxPrice <= minPrice) {
    maxPrice = Math.round((minPrice + 0.01) * 100) / 100
  }

  return {
    catalog: {
      metadata: { minPrice, maxPrice },
      products,
    },
    manufacturers: { kind: "manufacturers", values: manufacturers },
    packaging: { kind: "packaging", values: packaging },
    manufacturerCount: manufacturers.length,
    packagingCount: packaging.length,
    sourceRows: sourceRows.length,
    skippedRows,
    nonRecordRows,
    missingProductNames,
    missingIngredients,
    skippedExamples,
    missingIngredientExamples,
  }
}
function xorBytes(bytes, keyBytes) {
  const result = Buffer.allocUnsafe(bytes.length)

  for (let index = 0; index < bytes.length; index += 1) {
    result[index] = bytes[index] ^ keyBytes[index % keyBytes.length]
  }

  return result
}

async function writeVersionedArtifacts(outputDirectory, payloads) {
  for (;;) {
    const version = randomBytes(3).toString("hex")
    const files = payloads.map(({ name, payload }) => ({
      fileName: `${name}.${version}.dat`,
      outputPath: path.join(outputDirectory, `${name}.${version}.dat`),
      payload,
    }))
    const createdPaths = []

    try {
      for (const file of files) {
        await writeFile(file.outputPath, file.payload, { flag: "wx" })
        createdPaths.push(file.outputPath)
      }

      return { version, files }
    } catch (error) {
      await Promise.all(
        createdPaths.map((outputPath) => unlink(outputPath).catch(() => {}))
      )
      if (error?.code === "EEXIST") continue
      throw error
    }
  }
}

async function main() {
  const { input, output } = parseArguments(process.argv.slice(2))

  if (!input || !output) {
    printUsage()
    throw new Error("Both --input and --output are required.")
  }

  if (!path.isAbsolute(input)) {
    throw new Error(`Input path must be absolute: ${input}`)
  }

  if (!path.isAbsolute(output)) {
    throw new Error(`Output folder path must be absolute: ${output}`)
  }

  if (path.extname(input).toLocaleLowerCase() !== ".json") {
    throw new Error(`Input file must have a .json extension: ${input}`)
  }

  const xorKey = readEnvValue(XOR_KEY_NAME)
  if (!xorKey) {
    throw new Error(
      `Missing ${XOR_KEY_NAME}. Add it to the repository .env or provide it in the process environment. Do not use a sensitive secret: this key is also included in the browser build so the site can decode the catalog.`
    )
  }

  const keyBytes = Buffer.from(xorKey, "utf8")
  if (keyBytes.length === 0) {
    throw new Error(`${XOR_KEY_NAME} must not be empty.`)
  }

  const inputContents = await readFile(input, "utf8")
  let parsedJson

  try {
    parsedJson = JSON.parse(inputContents.replace(/^\uFEFF/, ""))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON."
    throw new Error(`Could not parse input JSON: ${message}`)
  }

  const {
    catalog,
    manufacturers,
    packaging,
    manufacturerCount,
    packagingCount,
    sourceRows,
    skippedRows,
    nonRecordRows,
    missingProductNames,
    missingIngredients,
    skippedExamples,
    missingIngredientExamples,
  } = normalizeRows(parsedJson)
  const payloads = [
    { name: "catalog", value: catalog },
    { name: "manufacturers", value: manufacturers },
    { name: "packaging", value: packaging },
  ].map(({ name, value }) => {
    const jsonBytes = Buffer.from(JSON.stringify(value), "utf8")
    const gzipBytes = gzipSync(jsonBytes, { level: 9 })
    const encryptedPayload = xorBytes(gzipBytes, keyBytes)

    return {
      name,
      jsonBytes,
      payload: Buffer.concat([FILE_MAGIC, encryptedPayload]),
    }
  })

  await mkdir(output, { recursive: true })
  const result = await writeVersionedArtifacts(output, payloads)
  const filesByName = new Map(
    result.files.map((file) => [
      path.basename(file.outputPath, `.${result.version}.dat`),
      file,
    ])
  )

  console.log("Catalog build complete")
  console.log(`Version: ${result.version}`)
  console.log(`Output folder: ${output}`)
  for (const name of ["catalog", "manufacturers", "packaging"]) {
    const file = filesByName.get(name)
    if (file) {
      console.log(
        `${name}: ${file.fileName} (${file.payload.length.toLocaleString()} bytes)`
      )
    }
  }
  console.log(`Rows: ${catalog.products.length.toLocaleString()} normalized`)
  console.log(
    `Rows skipped: ${skippedRows.toLocaleString()} of ${sourceRows.toLocaleString()} (${nonRecordRows.toLocaleString()} non-object rows; ${missingProductNames.toLocaleString()} missing Product Name)`
  )
  console.log(
    `Rows retained without Active Ingredient: ${missingIngredients.toLocaleString()}`
  )
  if (missingIngredientExamples.length > 0) {
    console.log(
      `Rows missing Active Ingredient samples: ${JSON.stringify(missingIngredientExamples)}`
    )
  }
  if (skippedExamples.missingProductName.length > 0) {
    console.log(
      `Rows skipped for missing Product Name samples: ${JSON.stringify(skippedExamples.missingProductName)}`
    )
  }
  if (skippedExamples.nonObject.length > 0) {
    console.log(
      `Non-object row samples: ${JSON.stringify(skippedExamples.nonObject)}`
    )
  }
  console.log(
    `Dictionary values: ${manufacturerCount.toLocaleString()} manufacturers, ${packagingCount.toLocaleString()} packaging options`
  )
  console.log(
    `Price metadata: USD ${catalog.metadata.minPrice.toFixed(2)}–${catalog.metadata.maxPrice.toFixed(2)}`
  )
  console.log(
    `Normalized JSON: ${payloads
      .map(({ jsonBytes }) => jsonBytes.length)
      .reduce((total, size) => total + size, 0)
      .toLocaleString()} bytes total`
  )
  console.log(
    "Upload all three version-matched files to the same data folder; set NEXT_PUBLIC_CATALOG_DATA_URL to the catalog file URL."
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Catalog build failed: ${message}`)
  process.exitCode = 1
})
