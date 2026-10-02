#!/usr/bin/env node

import { createHash } from "node:crypto"
import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import nextEnv from "@next/env"

const { loadEnvConfig } = nextEnv

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)
const outputDirectory = path.join(projectRoot, "out")
const workerVersionToken = "__PCT_PRECACHE_VERSION__"
const defaultSiteUrl = "https://pct.mahiralamtohan.workers.dev"

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name)
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, relativePath)))
    } else if (entry.isFile()) {
      files.push({ fullPath, relativePath })
    }
  }

  return files
}

function collectInlineScriptHashes(html) {
  const hashes = new Set()
  const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
  let match

  while ((match = scripts.exec(html)) !== null) {
    const attributes = match[1] ?? ""
    const body = match[2] ?? ""
    if (/\bsrc\s*=/i.test(attributes) || body.length === 0) continue

    const digest = createHash("sha256").update(body, "utf8").digest("base64")
    hashes.add(`'sha256-${digest}'`)
  }

  return hashes
}

function createContentSecurityPolicy(inlineScriptHashes, siteUrl, catalogUrl) {
  const connectSources = new Set(["'self'"])

  if (catalogUrl) {
    const catalog = new URL(catalogUrl, siteUrl)
    if (catalog.protocol !== "https:") {
      throw new Error("The catalog URL must use HTTPS in the production build.")
    }
    if (catalog.origin !== siteUrl.origin) connectSources.add(catalog.origin)
  }

  const scriptSources = ["'self'", ...inlineScriptHashes].join(" ")
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSources}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${[...connectSources].join(" ")}`,
    "manifest-src 'self'",
    "worker-src 'self'",
  ].join("; ")
}

async function main() {
  loadEnvConfig(projectRoot, false)

  const files = await listFiles(outputDirectory)
  const byRelativePath = new Map(
    files.map((file) => [file.relativePath, file.fullPath])
  )
  const indexPath = byRelativePath.get("index.html")
  const workerPath = byRelativePath.get("sw.js")
  const headersPath = byRelativePath.get("_headers")

  if (!indexPath || !workerPath || !headersPath) {
    throw new Error(
      "Static export is missing index.html, sw.js, or _headers; cannot prepare the offline build."
    )
  }

  const precachePaths = ["/"]
  const fingerprint = createHash("sha256")
  const htmlPaths = []

  for (const file of files) {
    const relativePath = file.relativePath.split(path.sep).join("/")
    const extension = path.extname(relativePath).toLowerCase()

    if (extension === ".html") htmlPaths.push(file.fullPath)
    if (relativePath === "index.html") {
      fingerprint.update("/")
      fingerprint.update(await readFile(file.fullPath))
    }
    if (
      relativePath === "index.html" ||
      relativePath === "sw.js" ||
      relativePath === "_headers" ||
      relativePath === "precache-manifest.json" ||
      relativePath === "404.html" ||
      (extension === ".html" && relativePath !== "offline.html")
    ) {
      continue
    }

    precachePaths.push(`/${relativePath}`)
    fingerprint.update(relativePath)
    fingerprint.update(await readFile(file.fullPath))
  }

  const uniquePrecachePaths = [...new Set(precachePaths)].sort((left, right) =>
    left === "/" ? -1 : right === "/" ? 1 : left.localeCompare(right)
  )
  const workerTemplate = await readFile(workerPath, "utf8")
  if (!workerTemplate.includes(workerVersionToken)) {
    throw new Error(
      "The service worker is missing its generated version token."
    )
  }
  fingerprint.update(workerTemplate)

  const version = fingerprint.digest("hex").slice(0, 16)
  const manifest = {
    version,
    assets: uniquePrecachePaths,
  }
  await writeFile(
    path.join(outputDirectory, "precache-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
  await writeFile(
    workerPath,
    workerTemplate.replace(workerVersionToken, version)
  )

  const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl)
  if (siteUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS for the static build.")
  }

  const inlineScriptHashes = new Set()
  for (const htmlPath of htmlPaths) {
    const html = await readFile(htmlPath, "utf8")
    for (const hash of collectInlineScriptHashes(html)) {
      inlineScriptHashes.add(hash)
    }
  }

  const contentSecurityPolicy = createContentSecurityPolicy(
    inlineScriptHashes,
    siteUrl,
    process.env.NEXT_PUBLIC_CATALOG_DATA_URL || ""
  )
  const headerContents = await readFile(headersPath, "utf8")
  if (!/^\/\*\s*$/m.test(headerContents)) {
    throw new Error("The _headers file must include a global /* rule.")
  }
  if (/^\s*Content-Security-Policy:/im.test(headerContents)) {
    throw new Error("Content-Security-Policy must be generated only once.")
  }
  await writeFile(
    headersPath,
    `${headerContents.trimEnd()}\n  Content-Security-Policy: ${contentSecurityPolicy}\n`
  )

  console.log(
    `Offline build ready: version ${version}, ${uniquePrecachePaths.length.toString()} cached assets, ${inlineScriptHashes.size.toString()} inline script hashes.`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
