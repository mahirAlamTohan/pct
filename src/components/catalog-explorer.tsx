"use client"

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  LoaderCircle,
  Search,
  X,
} from "lucide-react"
import MiniSearch, { type SearchResult } from "minisearch"
import { useEffect, useMemo, useState } from "react"

import { fetchCatalogData } from "@/data/fetch-catalog"
import type { CatalogProduct } from "@/data/catalog-format"

const PAGE_SIZE = 10
const CATALOG_PDF_URL = "https://pct247.ru/products.pdf"
const SEARCH_FIELDS = ["content", "product", "packSize", "rate", "manufacturer"]

type CatalogMatch = SearchResult["match"]
type CatalogSearchDocument = CatalogProduct & { id: number }
interface CatalogEntry {
  product: CatalogProduct
  serial: number
  matches: CatalogMatch
}

type CatalogLoadState = "preview" | "loading" | "loaded" | "error"

interface CatalogExplorerProps {
  products: CatalogProduct[]
  catalogDataUrl?: string
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!text || terms.length === 0) {
    return <>{text || "—"}</>
  }

  const normalizedTerms = new Set(terms.map(normalize))
  const parts = Array.from(
    text.matchAll(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu),
    (match) => ({ text: match[0], start: match.index })
  )

  return (
    <>
      {parts.map(({ text: part, start }) => {
        const isWord = /^[\p{L}\p{N}]+$/u.test(part)

        return isWord && normalizedTerms.has(normalize(part)) ? (
          <mark className="search-highlight" key={start.toString()}>
            {part}
          </mark>
        ) : (
          part
        )
      })}
    </>
  )
}

function fieldTerms(matches: CatalogMatch, field: string) {
  return Object.entries(matches)
    .filter(([, fields]) => fields.includes(field))
    .map(([term]) => term)
}

function highlightForField(text: string, matches: CatalogMatch, field: string) {
  return <HighlightedText text={text} terms={fieldTerms(matches, field)} />
}

function truncateIngredient(content: string, matchedTerms: string[] = []) {
  const maximumLength = 112
  const normalized = content.trim()

  if (normalized.length <= maximumLength) {
    return normalized
  }

  const normalizedContent = normalize(normalized)
  const matchStart = matchedTerms
    .map((term) => normalizedContent.indexOf(normalize(term)))
    .find((index) => index >= maximumLength)

  if (matchStart !== undefined) {
    let start = Math.max(0, matchStart - 36)
    let end = Math.min(normalized.length, start + maximumLength)

    if (start > 0) {
      const nextSpace = normalized.indexOf(" ", start)
      start = nextSpace >= 0 && nextSpace < matchStart ? nextSpace + 1 : start
    }

    if (end < normalized.length) {
      const previousSpace = normalized.lastIndexOf(" ", end)
      if (previousSpace > matchStart) end = previousSpace
    }

    return `${start > 0 ? "…" : ""}${normalized.slice(start, end).trim()}${end < normalized.length ? "…" : ""}`
  }

  const prefix = normalized.slice(0, maximumLength)
  const lastSpace = prefix.lastIndexOf(" ")

  return `${prefix.slice(0, lastSpace > 70 ? lastSpace : maximumLength).trimEnd()}…`
}

export function CatalogExplorer({
  products: initialProducts,
  catalogDataUrl,
}: CatalogExplorerProps) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState(initialProducts)
  const [loadState, setLoadState] = useState<CatalogLoadState>(
    catalogDataUrl ? "loading" : "preview"
  )
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    if (!catalogDataUrl) {
      return
    }

    const controller = new AbortController()

    fetchCatalogData(catalogDataUrl, controller.signal)
      .then((catalogProducts) => {
        if (catalogProducts.length === 0) {
          throw new Error(
            "The catalog file did not contain any valid products."
          )
        }

        setProducts(catalogProducts)
        setPage(1)
        setLoadState("loaded")
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "The catalog could not be loaded."
        )
        setLoadState("error")
      })

    return () => {
      controller.abort()
    }
  }, [catalogDataUrl])

  const searchIndex = useMemo(() => {
    const index = new MiniSearch<CatalogSearchDocument>({
      fields: SEARCH_FIELDS,
      idField: "id",
      processTerm: (term) => normalize(term),
      searchOptions: {
        boost: { product: 3, content: 2, manufacturer: 1.5 },
        combineWith: "AND",
        fuzzy: 0.2,
        prefix: true,
      },
    })

    index.addAll(
      products.map((product, index) => ({
        ...product,
        id: index + 1,
      }))
    )

    return index
  }, [products])

  const entries = useMemo<CatalogEntry[]>(() => {
    const searchTerm = query.trim()

    if (!searchTerm) {
      return products.map((product, index) => ({
        product,
        serial: index + 1,
        matches: {},
      }))
    }

    return searchIndex
      .search(searchTerm, {
        fields: SEARCH_FIELDS,
        boost: { product: 3, content: 2, manufacturer: 1.5 },
        combineWith: "AND",
        fuzzy: 0.2,
        prefix: true,
      })
      .flatMap((result) => {
        const serial = Number(result.id)
        const product = products[serial - 1]

        if (
          !Number.isInteger(serial) ||
          serial < 1 ||
          serial > products.length
        ) {
          return []
        }

        return [{ product, serial, matches: result.match }]
      })
  }, [products, query, searchIndex])

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstProductIndex = (currentPage - 1) * PAGE_SIZE
  const pageEntries = entries.slice(
    firstProductIndex,
    firstProductIndex + PAGE_SIZE
  )
  const firstVisible = entries.length === 0 ? 0 : firstProductIndex + 1
  const lastVisible = Math.min(firstProductIndex + PAGE_SIZE, entries.length)

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  const statusMessage = (() => {
    switch (loadState) {
      case "preview":
        return `Showing ${products.length.toLocaleString()} bundled preview rows.`
      case "loading":
        return "Loading the full product catalog…"
      case "loaded":
        return `Full catalog loaded: ${products.length.toLocaleString()} products.`
      case "error":
        return `Full catalog unavailable. Showing the ${products.length.toLocaleString()}-row preview.`
    }
  })()

  return (
    <section className="catalog-section page-section" id="catalog">
      <div className="site-container">
        <div className="section-heading catalog-section-heading">
          <span className="eyebrow">
            <span className="eyebrow-marker" aria-hidden="true" />
            Pharmaceutical Catalog
          </span>
          <h2>Search the medicine catalog</h2>
          <p>
            Find products by active ingredient, brand, manufacturer or pack
            size. Search supports partial matches and common typos.
          </p>
        </div>

        <div className="catalog-card">
          <div className="catalog-card-heading">
            <div>
              <span className="catalog-overline">
                PCT24X7 product directory
              </span>
              <h3>Find the right product</h3>
              <p>
                Search across full ingredient names, product names, packaging,
                pricing and manufacturer details.
              </p>
            </div>
            <div className="catalog-total-pill" aria-live="polite">
              <span className="catalog-total-icon">
                {loadState === "loading" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="catalog-spinner"
                    size={17}
                  />
                ) : (
                  <CheckCircle2 aria-hidden="true" size={17} />
                )}
              </span>
              <span>
                <strong>{products.length.toLocaleString()} products</strong>
                <small>
                  {loadState === "loaded" ? "full catalog" : "searchable now"}
                </small>
              </span>
            </div>
          </div>

          <div className="catalog-toolbar">
            <label className="catalog-search">
              <Search aria-hidden="true" size={19} />
              <span className="sr-only">Search the medicine catalog</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  updateQuery(event.target.value)
                }}
                placeholder="Search by ingredient, product, pack…"
                autoComplete="off"
                aria-describedby="catalog-search-help"
              />
            </label>
            <div className="catalog-toolbar-actions">
              <button
                className="button button-clear"
                type="button"
                onClick={() => {
                  updateQuery("")
                }}
                disabled={!query}
              >
                <X aria-hidden="true" size={15} />
                Clear
              </button>
              <a
                className="button button-download"
                href={CATALOG_PDF_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Download aria-hidden="true" size={17} />
                Download full catalog
                <ArrowUpRight aria-hidden="true" size={15} />
              </a>
            </div>
          </div>
          <p className="catalog-search-help sr-only" id="catalog-search-help">
            Fuzzy search checks active ingredient, product, pack size, rate and
            manufacturer.
          </p>

          <div className="catalog-status-row" aria-live="polite">
            <span className={`loaded-status status-${loadState}`}>
              {loadState === "loading" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="catalog-spinner"
                  size={14}
                />
              ) : loadState === "error" ? (
                <AlertCircle aria-hidden="true" size={14} />
              ) : (
                <span className="loaded-dot" aria-hidden="true" />
              )}
              {statusMessage}
            </span>
            <span className="catalog-result-count">
              {query.trim()
                ? `${entries.length.toLocaleString()} matching ${entries.length === 1 ? "product" : "products"}`
                : `${products.length.toLocaleString()} searchable products`}
            </span>
          </div>
          {loadState === "error" && (
            <p className="catalog-load-error" role="status">
              {loadError} Check the catalog URL, XOR key, CORS headers and file
              format.
            </p>
          )}

          {pageEntries.length > 0 ? (
            <div className="catalog-table-scroll">
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th scope="col" className="serial-column">
                      S. NO.
                    </th>
                    <th scope="col">ACTIVE INGREDIENT</th>
                    <th scope="col">PRODUCT NAME</th>
                    <th scope="col">PACKAGING</th>
                    <th scope="col">MANUFACTURER</th>
                    <th scope="col" className="price-heading">
                      RATE (USD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageEntries.map(({ product, serial, matches }) => {
                    const shortContent = truncateIngredient(
                      product.content,
                      fieldTerms(matches, "content")
                    )

                    return (
                      <tr key={`${serial.toString()}-${product.product}`}>
                        <td className="serial-cell">{serial}</td>
                        <td
                          className="content-cell"
                          title={product.content}
                          aria-label={product.content}
                        >
                          <span className="ingredient-display">
                            {highlightForField(
                              shortContent,
                              matches,
                              "content"
                            )}
                          </span>
                        </td>
                        <td className="product-cell">
                          {highlightForField(
                            product.product,
                            matches,
                            "product"
                          )}
                        </td>
                        <td>
                          <span className="pack-size-pill">
                            {highlightForField(
                              product.packSize,
                              matches,
                              "packSize"
                            )}
                          </span>
                        </td>
                        <td className="manufacturer-cell">
                          {highlightForField(
                            product.manufacturer,
                            matches,
                            "manufacturer"
                          )}
                        </td>
                        <td className="price-cell">
                          {product.rate ? (
                            <>
                              {"$ "}
                              {highlightForField(product.rate, matches, "rate")}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results" role="status">
              <span className="no-results-icon">
                <Search aria-hidden="true" size={23} />
              </span>
              <h4>No matches</h4>
              <p>
                Try another ingredient, product name, manufacturer or pack size,
                or open the full catalog PDF.
              </p>
              <a
                className="button button-secondary"
                href={CATALOG_PDF_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Download aria-hidden="true" size={16} />
                Open the full product catalog
              </a>
            </div>
          )}

          <div className="catalog-footer">
            <p className="catalog-range">
              {entries.length > 0 ? (
                <>
                  Showing{" "}
                  <strong>
                    {firstVisible}–{lastVisible}
                  </strong>{" "}
                  of <strong>{entries.length.toLocaleString()}</strong>{" "}
                  {query.trim() ? "matching products" : "products"}
                </>
              ) : (
                <>No products to display</>
              )}
            </p>
            <div className="pagination" aria-label="Catalog pagination">
              <button
                className="page-button"
                type="button"
                onClick={() => {
                  setPage((current) => Math.max(current - 1, 1))
                }}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft aria-hidden="true" size={17} />
                <span>Prev</span>
              </button>
              <span className="page-count">
                {currentPage} <span>/</span> {pageCount}
              </span>
              <button
                className="page-button"
                type="button"
                onClick={() => {
                  setPage((current) => Math.min(current + 1, pageCount))
                }}
                disabled={currentPage === pageCount}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight aria-hidden="true" size={17} />
              </button>
            </div>
          </div>

          <p className="catalog-source-note">
            Product data is searchable locally in your browser. The bundled list
            is a preview until the full normalized catalog is available at the
            configured catalog URL.
          </p>
        </div>
      </div>
    </section>
  )
}
