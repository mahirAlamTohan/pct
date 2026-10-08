#!/usr/bin/env node

import { createReadStream } from "node:fs"
import { readFile, stat } from "node:fs/promises"
import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, "..")

function readOption(name, fallback) {
  const optionIndex = process.argv.indexOf(name)
  return optionIndex >= 0
    ? (process.argv[optionIndex + 1] ?? fallback)
    : fallback
}

const rootDirectory = path.resolve(
  repositoryRoot,
  readOption("--directory", "out")
)
const host = readOption("--host", "127.0.0.1")
const port = Number(readOption("--port", "4173"))

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid server port: ${port.toString()}`)
}

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".dat", "application/octet-stream"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
])

function escapeRegularExpression(value) {
  return value.replaceAll(".", "\\.")
}

async function loadHeaderRules() {
  let contents
  try {
    contents = await readFile(path.join(rootDirectory, "_headers"), "utf8")
  } catch {
    return []
  }

  const rules = []
  let currentRule

  for (const line of contents.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue
    if (!/^\s/.test(line)) {
      currentRule = { pattern: line.trim(), headers: new Map() }
      rules.push(currentRule)
      continue
    }

    const separator = line.indexOf(":")
    if (separator < 1 || !currentRule) continue
    currentRule.headers.set(
      line.slice(0, separator).trim(),
      line.slice(separator + 1).trim()
    )
  }

  return rules.map((rule) => ({
    ...rule,
    matcher: new RegExp(
      `^${rule.pattern.split("*").map(escapeRegularExpression).join(".*")}$`
    ),
  }))
}

const headerRules = await loadHeaderRules()

function headersFor(pathname) {
  const headers = new Map()

  for (const rule of headerRules) {
    if (!rule.matcher.test(pathname)) continue
    for (const [name, value] of rule.headers) headers.set(name, value)
  }

  return Object.fromEntries(headers)
}

function isInsideRoot(filePath) {
  return (
    filePath === rootDirectory ||
    filePath.startsWith(`${rootDirectory}${path.sep}`)
  )
}

async function resolveFile(pathname) {
  const decodedPath = decodeURIComponent(pathname)
  const relativePath = decodedPath.replace(/^[/\\]+/, "")
  const requestedPath = path.resolve(rootDirectory, relativePath)

  if (!isInsideRoot(requestedPath)) return null

  const candidates = [requestedPath]
  if (!path.extname(requestedPath)) {
    candidates.push(path.join(requestedPath, "index.html"))
  }
  if (decodedPath.endsWith("/")) {
    candidates.unshift(path.join(requestedPath, "index.html"))
  }

  for (const candidate of candidates) {
    try {
      const fileInfo = await stat(candidate)
      if (fileInfo.isDirectory()) {
        const indexFile = path.join(candidate, "index.html")
        const indexInfo = await stat(indexFile)
        if (indexInfo.isFile()) return indexFile
      }
      if (fileInfo.isFile()) return candidate
    } catch {
      // Continue to the next candidate and return a regular 404 if none exists.
    }
  }

  return null
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end()
    return
  }

  let pathname
  try {
    pathname = new URL(request.url ?? "/", `http://${host}`).pathname
  } catch {
    response.writeHead(400).end("Bad request")
    return
  }

  let filePath
  try {
    filePath = await resolveFile(pathname)
  } catch {
    response.writeHead(400).end("Bad request")
    return
  }

  if (!filePath) {
    response
      .writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        ...headersFor(pathname),
      })
      .end("Not found")
    return
  }

  try {
    const fileInfo = await stat(filePath)
    const extension = path.extname(filePath).toLowerCase()
    const cacheControl = filePath.includes(
      `${path.sep}_next${path.sep}static${path.sep}`
    )
      ? "public, max-age=31536000, immutable"
      : "no-cache"

    response.writeHead(200, {
      "Cache-Control": cacheControl,
      "Content-Length": fileInfo.size,
      "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      ...headersFor(pathname),
    })

    if (request.method === "HEAD") {
      response.end()
      return
    }

    createReadStream(filePath).pipe(response)
  } catch {
    if (!response.headersSent) response.writeHead(500)
    response.end("Unable to serve file")
  }
})

server.listen(port, host, () => {
  console.log(`Serving ${rootDirectory} at http://${host}:${port.toString()}`)
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
  })
}
