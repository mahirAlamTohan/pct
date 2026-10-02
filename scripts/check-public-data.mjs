#!/usr/bin/env node

import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const publicDataDirectory = path.resolve(scriptDirectory, "../public/data")

let entries = []

try {
  entries = readdirSync(publicDataDirectory, { withFileTypes: true })
} catch (error) {
  if (error?.code !== "ENOENT") throw error
}

const stagedJsonFiles = entries
  .filter((entry) => entry.isFile() && entry.name.toLocaleLowerCase().endsWith(".json"))
  .map((entry) => entry.name)

if (stagedJsonFiles.length > 0) {
  console.error(
    [
      "Refusing to build while raw catalog JSON is present under public/data:",
      ...stagedJsonFiles.map((file) => `  - ${file}`),
      "Remove the temporary source JSON before building; only the versioned .dat artifacts should ship.",
    ].join("\n")
  )
  process.exitCode = 1
} else {
  console.log("Catalog staging check passed: no raw JSON files are present in public/data.")
}
