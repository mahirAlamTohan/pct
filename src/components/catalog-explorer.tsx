"use client"

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  CircleCheck,
  CircleMinus,
  ChevronRight,
  Download,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import type MiniSearch from "minisearch"
import type { SearchResult } from "minisearch"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"

import { Button, ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Input } from "@/components/ui/input"
import { RangeSlider } from "@/components/ui/slider"
import { siteConfig } from "@/config/site"
import { siteContent } from "@/config/content"
import { fetchCatalogData } from "@/data/fetch-catalog"
import { cn } from "@/lib/utils"
import type {
  CatalogExplorerProps,
  CatalogFacetKind,
  CatalogFilterMode,
  CatalogLoadState,
  CatalogMetadata,
  CatalogProduct,
} from "@/types/catalog"

const PAGE_SIZE = 10
const DEFAULT_PRICE_BOUNDS: [number, number] = [0, 1000]
const PRICE_STEP = 0.01
const SEARCH_FIELDS = ["content", "product", "packSize", "rate", "manufacturer"]

type CatalogMatch = SearchResult["match"]
type CatalogSearchDocument = CatalogProduct & { id: number }

interface CatalogEntry {
  product: CatalogProduct
  productIndex: number
  price: number | null
  matches: CatalogMatch
}

type FacetSelections = Record<
  "manufacturer" | "packaging",
  Map<string, CatalogFilterMode>
>

interface FacetOptionGroupProps {
  kind: CatalogFacetKind
  label: string
  displayMode: "list" | "pills"
  options: string[]
  selections: Map<string, CatalogFilterMode>
  search: string
  onSearchChange: (value: string) => void
  onCycle: (kind: CatalogFacetKind, value: string) => void
}

interface SelectionSummaryItem {
  key: string
  kind: CatalogFacetKind
  value: string
  label: string
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
}

function distinctValues(values: string[]) {
  const distinct = new Map<string, string>()

  for (const value of values) {
    const trimmed = value.trim()
    const key = normalize(trimmed)
    if (key && !distinct.has(key)) distinct.set(key, trimmed)
  }

  return [...distinct.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" })
  )
}

function numericValue(value: string) {
  if (!value.trim()) return null

  const number = Number(value.replace(/[,$\s]/g, ""))
  return Number.isFinite(number) ? number : null
}

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template
  )
}

function resolvePriceBounds(metadata?: CatalogMetadata): [number, number] {
  if (!metadata) return [...DEFAULT_PRICE_BOUNDS]

  const minPrice = metadata.minPrice
  const maxPrice = metadata.maxPrice

  if (
    !Number.isFinite(minPrice) ||
    !Number.isFinite(maxPrice) ||
    minPrice < 0 ||
    maxPrice <= minPrice
  ) {
    return [...DEFAULT_PRICE_BOUNDS]
  }

  return [minPrice, maxPrice]
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value)
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!text || terms.length === 0) return <>{text || "—"}</>

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
          <mark
            className="rounded-[3px] bg-amber-200 px-0.5 font-extrabold text-amber-950 dark:bg-amber-700/70 dark:text-amber-50"
            key={start.toString()}
          >
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

  if (normalized.length <= maximumLength) return normalized

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

function cycleSelection(
  selections: Map<string, CatalogFilterMode>,
  value: string
) {
  const nextSelections = new Map(selections)
  const currentMode = nextSelections.get(value)
  const nextMode =
    currentMode === "include"
      ? "exclude"
      : currentMode === "exclude"
        ? undefined
        : "include"

  if (nextMode) nextSelections.set(value, nextMode)
  else nextSelections.delete(value)

  return nextSelections
}

function FacetOptionGroup({
  kind,
  label,
  displayMode,
  options,
  selections,
  search,
  onSearchChange,
  onCycle,
}: FacetOptionGroupProps) {
  const copy = siteContent.catalog
  const deferredSearch = useDeferredValue(search.trim())
  const visibleOptions = useMemo(
    () =>
      options.filter((option) =>
        normalize(option).includes(normalize(deferredSearch))
      ),
    [options, deferredSearch]
  )
  const [scrollPosition, setScrollPosition] = useState({ query: "", top: 0 })
  const listRef = useRef<HTMLDivElement>(null)
  const isList = displayMode === "list"

  useEffect(() => {
    if (isList && listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [deferredSearch, isList])
  const rowHeight = 44
  const viewportHeight = 288
  const overscan = 5
  const scrollTop =
    scrollPosition.query === deferredSearch ? scrollPosition.top : 0
  const firstVisibleIndex = isList
    ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    : 0
  const lastVisibleIndex = isList
    ? Math.min(
        visibleOptions.length,
        Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
      )
    : visibleOptions.length
  const renderedOptions = visibleOptions.slice(
    firstVisibleIndex,
    lastVisibleIndex
  )

  function renderOption(option: string) {
    const mode = selections.get(option)
    const modeLabel =
      mode === "include"
        ? copy.includeSelected
        : mode === "exclude"
          ? copy.excludeSelected
          : copy.unselectedLabel
    const ModeIcon =
      mode === "include" ? CircleCheck : mode === "exclude" ? CircleMinus : Plus

    return (
      <Button
        aria-label={formatMessage(copy.facetCycleAriaLabel, {
          label: `${label}: ${option}`,
          mode: modeLabel,
        })}
        aria-pressed={Boolean(mode)}
        className={cn(
          "min-w-0 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
          isList
            ? "h-10 w-full justify-start rounded-lg px-3 text-xs"
            : "h-auto min-h-9 max-w-full justify-start gap-2 rounded-full px-3 py-1.5 text-xs",
          mode === "include" &&
            "border-primary bg-primary text-white shadow-md shadow-primary/15 hover:border-primary hover:bg-primary/90 hover:text-white",
          mode === "exclude" &&
            "border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-900/15 hover:border-violet-600 hover:bg-violet-700 hover:text-white",
          !mode &&
            "border-border bg-background text-ink-soft hover:border-primary/45 hover:bg-accent dark:text-foreground"
        )}
        data-selection-state={mode ?? "none"}
        key={`${kind}-${option}`}
        onClick={() => {
          onCycle(kind, option)
        }}
        title={option}
        type="button"
        variant="outline"
      >
        <ModeIcon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate text-left">{option}</span>
        {mode && (
          <span className="ml-auto rounded-full bg-white/15 px-1.5 py-0.5 text-[0.54rem] font-extrabold tracking-wide uppercase">
            {modeLabel}
          </span>
        )}
      </Button>
    )
  }

  return (
    <fieldset className="min-w-0 space-y-2.5">
      <legend className="flex w-full items-center justify-between gap-2 text-xs font-extrabold text-ink-soft dark:text-foreground">
        <span>{label}</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.62rem] font-bold text-primary">
          {formatMessage(copy.selectedCount, {
            count: selections.size.toLocaleString(),
          })}
        </span>
      </legend>

      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-muted-foreground shadow-sm transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/10">
        <Search aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <span className="sr-only">
          {formatMessage(copy.facetSearchAriaLabel, { label })}
        </span>
        <Input
          autoComplete="off"
          className="h-9 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0"
          onChange={(event) => {
            const value = event.target.value
            if (isList) {
              setScrollPosition({ query: value.trim(), top: 0 })
              if (listRef.current) listRef.current.scrollTop = 0
            }
            onSearchChange(value)
          }}
          placeholder={formatMessage(copy.facetSearchPlaceholder, { label })}
          type="search"
          value={search}
        />
      </label>

      {visibleOptions.length > 0 ? (
        isList ? (
          <div
            className="max-h-72 overflow-y-auto rounded-xl border border-border/80 bg-background/55 p-2"
            ref={listRef}
            onScroll={(event) => {
              setScrollPosition({
                query: deferredSearch,
                top: event.currentTarget.scrollTop,
              })
            }}
          >
            <div
              className="flex flex-col"
              style={{
                paddingBottom: `${((visibleOptions.length - lastVisibleIndex) * rowHeight).toString()}px`,
                paddingTop: `${(firstVisibleIndex * rowHeight).toString()}px`,
              }}
            >
              {renderedOptions.map((option) => (
                <div className="h-11 shrink-0 py-0.5" key={`${kind}-${option}`}>
                  {renderOption(option)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto rounded-xl border border-border/80 bg-background/55 p-2">
            <div className="flex flex-wrap gap-2">
              {visibleOptions.map((option) => renderOption(option))}
            </div>
          </div>
        )
      ) : (
        <p className="m-0 rounded-xl border border-border/80 bg-background/55 px-3 py-5 text-center text-xs text-muted-foreground">
          {options.length === 0 ? copy.noFacetValues : copy.noFacetMatches}
        </p>
      )}
    </fieldset>
  )
}

function SelectionSummary({
  title,
  items,
  emptyMessage,
  mode,
  onRemove,
}: {
  title: string
  items: SelectionSummaryItem[]
  emptyMessage: string
  mode: CatalogFilterMode
  onRemove: (kind: CatalogFacetKind, value: string) => void
}) {
  const copy = siteContent.catalog
  const Icon = mode === "include" ? CircleCheck : CircleMinus

  return (
    <section
      aria-label={title}
      className="min-w-0 rounded-2xl border border-border/80 bg-background/60 p-3.5"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h5 className="m-0 inline-flex items-center gap-2 text-xs font-extrabold text-ink-soft dark:text-foreground">
          <Icon
            aria-hidden="true"
            className={cn(
              "size-4",
              mode === "include" ? "text-primary" : "text-violet-500"
            )}
          />
          {title}
        </h5>
        <span className="text-[0.62rem] font-semibold text-muted-foreground">
          {items.length.toLocaleString()}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
          {items.map((item) => (
            <Button
              aria-label={formatMessage(copy.removeFilterAriaLabel, {
                label: item.label,
                mode: mode === "include" ? "included" : "excluded",
              })}
              className={cn(
                "h-auto min-h-8 max-w-full justify-between gap-1.5 rounded-lg px-2.5 py-1 text-left text-[0.65rem] font-bold transition-colors",
                mode === "include"
                  ? "border-primary/25 bg-primary/10 text-primary hover:border-primary/45 hover:bg-primary/15 hover:text-primary"
                  : "border-violet-500/25 bg-violet-500/10 text-violet-800 hover:border-violet-500/45 hover:bg-violet-500/15 hover:text-violet-900 dark:text-violet-200 dark:hover:text-violet-100"
              )}
              key={item.key}
              onClick={() => {
                onRemove(item.kind, item.value)
              }}
              title={item.label}
              type="button"
              variant="outline"
            >
              <span className="truncate">{item.label}</span>
              <X aria-hidden="true" className="size-3 shrink-0" />
            </Button>
          ))}
        </div>
      ) : (
        <p className="m-0 min-h-7 text-[0.68rem] leading-5 text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </section>
  )
}

export function CatalogExplorer({ catalogDataUrl }: CatalogExplorerProps) {
  const copy = siteContent.catalog
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [searchIndex, setSearchIndex] =
    useState<MiniSearch<CatalogSearchDocument> | null>(null)
  const [isSearchIndexing, setIsSearchIndexing] = useState(false)
  const [searchIndexError, setSearchIndexError] = useState("")
  const indexedProductsRef = useRef<CatalogProduct[] | null>(null)
  const [manufacturerOptions, setManufacturerOptions] = useState<string[]>([])
  const [packagingOptions, setPackagingOptions] = useState<string[]>([])
  const [loadState, setLoadState] = useState<CatalogLoadState>(
    catalogDataUrl ? "loading" : "unconfigured"
  )
  const [loadError, setLoadError] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [manufacturerSearch, setManufacturerSearch] = useState("")
  const [packagingSearch, setPackagingSearch] = useState("")
  const [priceBounds, setPriceBounds] = useState<[number, number]>(() => [
    ...DEFAULT_PRICE_BOUNDS,
  ])
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    ...DEFAULT_PRICE_BOUNDS,
  ])
  const deferredPriceRange = useDeferredValue(priceRange)
  const [facetSelections, setFacetSelections] = useState<FacetSelections>(
    () => ({
      manufacturer: new Map(),
      packaging: new Map(),
    })
  )
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!catalogDataUrl) return

    const controller = new AbortController()

    fetchCatalogData(catalogDataUrl, controller.signal)
      .then((dataset) => {
        if (controller.signal.aborted) return

        indexedProductsRef.current = null
        setSearchIndex(null)
        setSearchIndexError("")
        setIsSearchIndexing(false)
        setProducts(dataset.products)
        setManufacturerOptions(
          dataset.manufacturers.length > 0
            ? dataset.manufacturers
            : distinctValues(
                dataset.products.map(({ manufacturer }) => manufacturer)
              )
        )
        setPackagingOptions(
          dataset.packaging.length > 0
            ? dataset.packaging
            : distinctValues(dataset.products.map(({ packSize }) => packSize))
        )
        const nextPriceBounds = resolvePriceBounds(dataset.metadata)
        setPriceBounds(nextPriceBounds)
        setPriceRange(nextPriceBounds)
        setPage(1)

        setLoadState("loaded")
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

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

  useEffect(() => {
    if (!deferredQuery.trim() || products.length === 0 || searchIndex) return
    if (indexedProductsRef.current === products) return

    indexedProductsRef.current = products
    setIsSearchIndexing(true)
    setSearchIndexError("")

    void (async () => {
      try {
        const { default: MiniSearchConstructor } = await import("minisearch")
        const index = new MiniSearchConstructor<CatalogSearchDocument>({
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

        await index.addAllAsync(
          products.map((product, index) => ({
            ...product,
            id: index + 1,
          })),
          { chunkSize: 200 }
        )

        if (indexedProductsRef.current !== products) return
        setSearchIndex(index)
      } catch (error) {
        if (indexedProductsRef.current !== products) return
        setSearchIndexError(
          error instanceof Error
            ? error.message
            : "Search could not be prepared."
        )
      } finally {
        if (indexedProductsRef.current === products) {
          setIsSearchIndexing(false)
        }
      }
    })()
  }, [deferredQuery, products, searchIndex])

  const productPrices = useMemo(
    () => products.map(({ rate }) => numericValue(rate)),
    [products]
  )

  const searchEntries = useMemo<CatalogEntry[]>(() => {
    const searchTerm = deferredQuery.trim()

    if (!searchTerm) {
      return products.map((product, productIndex) => ({
        product,
        productIndex,
        price: productPrices.at(productIndex) ?? null,
        matches: {},
      }))
    }
    if (!searchIndex) return []

    return searchIndex
      .search(searchTerm, {
        fields: SEARCH_FIELDS,
        boost: { product: 3, content: 2, manufacturer: 1.5 },
        combineWith: "AND",
        fuzzy: 0.2,
        prefix: true,
      })
      .flatMap((result) => {
        const productId = Number(result.id)
        if (
          !Number.isInteger(productId) ||
          productId < 1 ||
          productId > products.length
        ) {
          return []
        }

        const productIndex = productId - 1
        const product = products.at(productIndex)
        if (!product) return []

        return [
          {
            product,
            productIndex,
            price: productPrices.at(productIndex) ?? null,
            matches: result.match,
          },
        ]
      })
  }, [deferredQuery, products, productPrices, searchIndex])

  const includedManufacturers = useMemo(
    () =>
      new Set(
        Array.from(facetSelections.manufacturer.entries())
          .filter(([, mode]) => mode === "include")
          .map(([value]) => value)
      ),
    [facetSelections.manufacturer]
  )
  const excludedManufacturers = useMemo(
    () =>
      new Set(
        Array.from(facetSelections.manufacturer.entries())
          .filter(([, mode]) => mode === "exclude")
          .map(([value]) => value)
      ),
    [facetSelections.manufacturer]
  )
  const includedPackaging = useMemo(
    () =>
      new Set(
        Array.from(facetSelections.packaging.entries())
          .filter(([, mode]) => mode === "include")
          .map(([value]) => value)
      ),
    [facetSelections.packaging]
  )
  const excludedPackaging = useMemo(
    () =>
      new Set(
        Array.from(facetSelections.packaging.entries())
          .filter(([, mode]) => mode === "exclude")
          .map(([value]) => value)
      ),
    [facetSelections.packaging]
  )
  const priceRangeActive =
    priceRange[0] > priceBounds[0] + PRICE_STEP / 2 ||
    priceRange[1] < priceBounds[1] - PRICE_STEP / 2
  const deferredPriceRangeActive =
    deferredPriceRange[0] > priceBounds[0] + PRICE_STEP / 2 ||
    deferredPriceRange[1] < priceBounds[1] - PRICE_STEP / 2

  const filteredEntries = useMemo(
    () =>
      searchEntries.filter(({ product, price }) => {
        if (
          deferredPriceRangeActive &&
          (price === null ||
            price < deferredPriceRange[0] ||
            price > deferredPriceRange[1])
        ) {
          return false
        }

        if (
          includedManufacturers.size > 0 &&
          !includedManufacturers.has(product.manufacturer)
        ) {
          return false
        }
        if (excludedManufacturers.has(product.manufacturer)) return false

        if (
          includedPackaging.size > 0 &&
          !includedPackaging.has(product.packSize)
        ) {
          return false
        }
        if (excludedPackaging.has(product.packSize)) return false

        return true
      }),
    [
      searchEntries,
      deferredPriceRange,
      deferredPriceRangeActive,
      includedManufacturers,
      excludedManufacturers,
      includedPackaging,
      excludedPackaging,
    ]
  )

  const selectedFacetCount =
    facetSelections.manufacturer.size + facetSelections.packaging.size
  const activeFilterCount = selectedFacetCount + Number(priceRangeActive)

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstProductIndex = (currentPage - 1) * PAGE_SIZE
  const pageEntries = filteredEntries.slice(
    firstProductIndex,
    firstProductIndex + PAGE_SIZE
  )
  const firstVisible = filteredEntries.length === 0 ? 0 : firstProductIndex + 1
  const lastVisible = Math.min(
    firstProductIndex + PAGE_SIZE,
    filteredEntries.length
  )

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function cycleFacet(kind: CatalogFacetKind, value: string) {
    setFacetSelections((current) => {
      if (kind === "manufacturer") {
        return {
          ...current,
          manufacturer: cycleSelection(current.manufacturer, value),
        }
      }

      return {
        ...current,
        packaging: cycleSelection(current.packaging, value),
      }
    })
    setPage(1)
  }

  function removeFacet(kind: CatalogFacetKind, value: string) {
    setFacetSelections((current) => {
      if (kind === "manufacturer") {
        const manufacturer = new Map(current.manufacturer)
        manufacturer.delete(value)
        return { ...current, manufacturer }
      }

      const packaging = new Map(current.packaging)
      packaging.delete(value)
      return { ...current, packaging }
    })
    setPage(1)
  }

  function clearFilters() {
    setPage(1)
    setPriceRange(priceBounds)
    setManufacturerSearch("")
    setPackagingSearch("")
    setFacetSelections({
      manufacturer: new Map(),
      packaging: new Map(),
    })
  }

  function summaryItemsFor(mode: CatalogFilterMode): SelectionSummaryItem[] {
    const selectedValues: {
      kind: CatalogFacetKind
      label: string
      selections: Map<string, CatalogFilterMode>
    }[] = [
      {
        kind: "manufacturer",
        label: copy.manufacturerLabel,
        selections: facetSelections.manufacturer,
      },
      {
        kind: "packaging",
        label: copy.packagingLabel,
        selections: facetSelections.packaging,
      },
    ]

    return selectedValues.flatMap(({ kind, label, selections }) =>
      Array.from(selections.entries())
        .filter(([, selectionMode]) => selectionMode === mode)
        .map(([value]) => ({
          key: `${kind}:${value}`,
          kind,
          value,
          label: `${label}: ${value}`,
        }))
    )
  }

  const includedSummary = summaryItemsFor("include")
  const excludedSummary = summaryItemsFor("exclude")

  const statusMessage = searchIndexError
    ? copy.status.searchError
    : isSearchIndexing
      ? copy.status.indexing
      : (() => {
          switch (loadState) {
            case "unconfigured":
              return copy.status.unconfigured
            case "loading":
              return copy.status.loading
            case "loaded":
              return formatMessage(copy.status.loaded, {
                count: products.length.toLocaleString(),
              })
            case "error":
              return copy.status.error
          }
        })()
  const emptyStateTitle = searchIndexError
    ? copy.status.searchError
    : isSearchIndexing
      ? copy.status.indexing
      : loadState === "loading"
        ? copy.status.loading
        : loadState === "loaded" && products.length > 0
          ? copy.emptyTitle
          : copy.noCatalogRecordsTitle
  const emptyStateDescription = searchIndexError
    ? searchIndexError
    : isSearchIndexing || loadState === "loading"
      ? ""
      : loadState === "unconfigured"
        ? copy.noCatalogConfiguredDescription
        : loadState === "error"
          ? copy.noCatalogUnavailableDescription
          : products.length === 0
            ? copy.noCatalogRecordsDescription
            : copy.emptyDescription

  return (
    <section
      className="bg-linear-to-br from-catalog-surface via-background to-catalog-end py-16 sm:py-20 lg:py-24"
      id="catalog"
    >
      <Container>
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-9">
          <span className="inline-flex items-center justify-center gap-2 text-[0.68rem] font-extrabold tracking-[0.12em] text-primary uppercase">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-blue-500 shadow-[0_0_0_4px_#e3efff]"
            />
            {copy.eyebrow}
          </span>
          <h2 className="mt-3 font-display text-[clamp(1.95rem,4vw,2.7rem)] leading-tight font-extrabold tracking-[-0.045em] text-ink dark:text-foreground">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <Card className="overflow-hidden rounded-[21px] border-blue-100/80 bg-card shadow-soft dark:border-border">
          <div className="flex flex-col justify-between gap-4 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:px-7 sm:pt-6">
            <div>
              <span className="text-[0.62rem] font-extrabold tracking-[0.12em] text-blue-700 uppercase dark:text-blue-300">
                {copy.overline}
              </span>
              <h3 className="my-1 font-display text-lg font-bold tracking-tight text-ink sm:text-xl dark:text-foreground">
                {copy.cardTitle}
              </h3>
              <p className="m-0 max-w-xl text-xs leading-5 text-muted-foreground">
                {copy.cardDescription}
              </p>
            </div>

            <div
              aria-live="polite"
              className="flex w-fit shrink-0 items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-2.5 py-2 dark:border-border dark:bg-slate-900/70"
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-lg bg-white shadow-sm dark:bg-blue-950",
                  loadState === "loaded"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : loadState === "error"
                      ? "text-rose-700 dark:text-rose-300"
                      : "text-muted-foreground"
                )}
              >
                {loadState === "loading" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-[17px] animate-spin"
                  />
                ) : loadState === "loaded" ? (
                  <CheckCircle2 aria-hidden="true" className="size-[17px]" />
                ) : (
                  <AlertCircle aria-hidden="true" className="size-[17px]" />
                )}
              </span>
              <span className="flex flex-col leading-tight">
                <strong className="text-xs font-extrabold text-ink-soft dark:text-foreground">
                  {products.length.toLocaleString()}{" "}
                  {products.length === 1
                    ? copy.productSingular
                    : copy.productPlural}
                </strong>
                <small className="mt-0.5 text-[0.62rem] text-muted-foreground">
                  {loadState === "loaded"
                    ? copy.fullCatalogLabel
                    : loadState === "loading"
                      ? copy.searchNowLabel
                      : copy.noCatalogRecordsTitle}
                </small>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 pb-4 sm:px-7">
            <label className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-input bg-background px-3.5 text-muted-foreground shadow-sm transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/10">
              <Search
                aria-hidden="true"
                className="size-5 shrink-0 text-blue-600 dark:text-blue-300"
              />
              <span className="sr-only">{copy.searchLabel}</span>
              <Input
                aria-describedby="catalog-search-help"
                autoComplete="off"
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                onChange={(event) => {
                  updateQuery(event.target.value)
                }}
                placeholder={copy.searchPlaceholder}
                type="search"
                value={query}
              />
            </label>

            <p className="sr-only" id="catalog-search-help">
              {copy.searchHelp}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  aria-controls="catalog-filters"
                  aria-expanded={filtersOpen}
                  className="h-10 border-border bg-background px-3.5 text-xs text-ink-soft shadow-sm hover:border-primary/35 hover:bg-accent dark:text-foreground"
                  onClick={() => {
                    setFiltersOpen((open) => !open)
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {filtersOpen ? (
                    <X aria-hidden="true" />
                  ) : (
                    <SlidersHorizontal aria-hidden="true" />
                  )}
                  {filtersOpen ? copy.closeFiltersAction : copy.filtersAction}
                  {activeFilterCount > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.62rem] font-extrabold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                <Button
                  className="h-10 border-border bg-background px-3.5 text-xs text-muted-foreground hover:border-primary/35 hover:bg-accent hover:text-foreground"
                  disabled={activeFilterCount === 0}
                  onClick={clearFilters}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw aria-hidden="true" />
                  {copy.clearFiltersAction}
                </Button>
              </div>

              {siteConfig.catalog.pdfUrl && (
                <ButtonLink
                  className="min-h-10 gap-1.5 bg-blue-50 px-3.5 text-xs text-blue-800 shadow-sm hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900"
                  href={siteConfig.catalog.pdfUrl}
                  rel="noreferrer"
                  size="sm"
                  target="_blank"
                  variant="secondary"
                >
                  <Download aria-hidden="true" />
                  {copy.downloadAction}
                  <ArrowUpRight aria-hidden="true" />
                </ButtonLink>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div
                animate={{ height: "auto", opacity: 1, y: 0 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0, y: -8 }}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { height: 0, opacity: 0, y: -8 }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0.01 }
                    : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <div
                  aria-label={copy.filtersAction}
                  className="border-y border-border bg-slate-50/80 p-5 sm:px-7 dark:bg-slate-950/30"
                  id="catalog-filters"
                  role="region"
                >
                  <div className="space-y-5">
                    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                      <FacetOptionGroup
                        displayMode="list"
                        kind="manufacturer"
                        label={copy.manufacturerLabel}
                        onCycle={cycleFacet}
                        onSearchChange={setManufacturerSearch}
                        options={manufacturerOptions}
                        search={manufacturerSearch}
                        selections={facetSelections.manufacturer}
                      />
                      <FacetOptionGroup
                        displayMode="pills"
                        kind="packaging"
                        label={copy.packagingLabel}
                        onCycle={cycleFacet}
                        onSearchChange={setPackagingSearch}
                        options={packagingOptions}
                        search={packagingSearch}
                        selections={facetSelections.packaging}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <SelectionSummary
                        emptyMessage={copy.noIncludedFilters}
                        items={includedSummary}
                        mode="include"
                        onRemove={removeFacet}
                        title={copy.includedFiltersTitle}
                      />
                      <SelectionSummary
                        emptyMessage={copy.noExcludedFilters}
                        items={excludedSummary}
                        mode="exclude"
                        onRemove={removeFacet}
                        title={copy.excludedFiltersTitle}
                      />
                    </div>

                    <section className="rounded-2xl border border-border/80 bg-background/75 p-4 sm:p-5">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="m-0 text-xs font-extrabold text-ink-soft dark:text-foreground">
                            {copy.priceRangeTitle}
                          </h4>
                          <p className="m-0 mt-1 text-[0.68rem] text-muted-foreground">
                            {copy.priceLimitHelp}
                          </p>
                        </div>
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-extrabold text-primary tabular-nums">
                          {formatPrice(priceRange[0])} –{" "}
                          {formatPrice(priceRange[1])}
                        </span>
                      </div>
                      <RangeSlider
                        max={priceBounds[1]}
                        maximumLabel={copy.maximumPriceAriaLabel}
                        min={priceBounds[0]}
                        minimumLabel={copy.minimumPriceAriaLabel}
                        onValueChange={(nextRange) => {
                          setPriceRange(nextRange)
                          setPage(1)
                        }}
                        step={PRICE_STEP}
                        value={priceRange}
                      />
                      <div className="mt-1 flex justify-between text-[0.62rem] font-semibold text-muted-foreground tabular-nums">
                        <span>
                          {copy.minimumPriceLabel}:{" "}
                          {formatPrice(priceBounds[0])}
                        </span>
                        <span>
                          {copy.maximumPriceLabel}:{" "}
                          {formatPrice(priceBounds[1])}
                        </span>
                      </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                      <p
                        aria-live="polite"
                        className="m-0 text-xs font-semibold text-muted-foreground"
                      >
                        {filteredEntries.length.toLocaleString()} {"matching "}
                        {filteredEntries.length === 1
                          ? copy.productSingular
                          : copy.productPlural}
                      </p>
                      <p className="m-0 text-[0.62rem] text-muted-foreground">
                        {formatMessage(copy.selectedCount, {
                          count: selectedFacetCount.toLocaleString(),
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            aria-live="polite"
            className="flex min-h-10 flex-col justify-center gap-1 border-t border-border px-5 text-[0.68rem] sm:flex-row sm:items-center sm:justify-between sm:px-7"
          >
            <span
              className={cn(
                "inline-flex items-center gap-2 font-semibold",
                loadState === "loaded" &&
                  !searchIndexError &&
                  !isSearchIndexing &&
                  "text-emerald-800 dark:text-emerald-300",
                (loadState === "loading" || isSearchIndexing) &&
                  "text-blue-700 dark:text-blue-300",
                (loadState === "error" || searchIndexError) &&
                  "text-rose-700 dark:text-rose-300",
                loadState === "unconfigured" && "text-muted-foreground"
              )}
            >
              {loadState === "loading" || isSearchIndexing ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-3.5 animate-spin"
                />
              ) : loadState === "loaded" && !searchIndexError ? (
                <span className="size-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
              ) : (
                <AlertCircle aria-hidden="true" className="size-3.5" />
              )}
              {statusMessage}
            </span>
            <span className="text-muted-foreground sm:text-right">
              {loadState === "unconfigured" || loadState === "error"
                ? copy.noCatalogRecordsTitle
                : query.trim()
                  ? `${filteredEntries.length.toLocaleString()} matching ${filteredEntries.length === 1 ? copy.productSingular : copy.productPlural}`
                  : `${filteredEntries.length.toLocaleString()} ${copy.searchableProducts}`}
            </span>
          </div>

          {loadState === "error" && (
            <p
              className="m-0 px-5 pb-3 text-[0.68rem] text-rose-700 sm:px-7 dark:text-rose-300"
              role="status"
            >
              {loadError} {copy.loadErrorAdvice}
            </p>
          )}

          {pageEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-245 border-collapse text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/70">
                  <tr className="border-y border-border">
                    <th
                      className="w-[23%] px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.product}
                    </th>
                    <th
                      className="w-[32%] px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.ingredient}
                    </th>
                    <th
                      className="w-[20%] px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.manufacturer}
                    </th>
                    <th
                      className="w-30 px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.packaging}
                    </th>
                    <th
                      className="py-3 pr-5 text-right text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase sm:pr-7"
                      scope="col"
                    >
                      {copy.tableHeadings.rate}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageEntries.map(({ product, productIndex, matches }) => {
                    const shortContent = truncateIngredient(
                      product.content,
                      fieldTerms(matches, "content")
                    )

                    return (
                      <tr
                        className="border-b border-border/70 transition-colors last:border-0 hover:bg-blue-50/60 dark:hover:bg-blue-950/30"
                        key={`${productIndex.toString()}-${product.product}`}
                      >
                        <td className="px-4 py-3.5 text-xs font-bold text-blue-900 dark:text-blue-100">
                          {highlightForField(
                            product.product,
                            matches,
                            "product"
                          )}
                        </td>
                        <td
                          aria-label={product.content}
                          className="max-w-90 px-4 py-3.5 text-[0.68rem] leading-5 font-semibold tracking-wide text-slate-600 dark:text-slate-300"
                          title={product.content}
                        >
                          <span className="line-clamp-2">
                            {highlightForField(
                              shortContent,
                              matches,
                              "content"
                            )}
                          </span>
                        </td>
                        <td className="max-w-55 px-4 py-3.5 text-[0.68rem] leading-5 font-semibold text-slate-600 dark:text-slate-300">
                          {highlightForField(
                            product.manufacturer,
                            matches,
                            "manufacturer"
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex min-h-6 items-center rounded-md border border-blue-100 bg-blue-50 px-2 text-[0.62rem] font-bold whitespace-nowrap text-slate-600 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-200">
                            {highlightForField(
                              product.packSize,
                              matches,
                              "packSize"
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 pr-5 text-right text-xs font-extrabold whitespace-nowrap text-blue-700 tabular-nums sm:pr-7 dark:text-blue-300">
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
            <div
              className="flex min-h-70 flex-col items-center justify-center px-6 py-9 text-center"
              role="status"
            >
              <span className="mb-3 grid size-14 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                {loadState === "loading" || isSearchIndexing ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-6 animate-spin"
                  />
                ) : (
                  <Search aria-hidden="true" className="size-6" />
                )}
              </span>
              <h4 className="m-0 font-display text-base font-extrabold text-ink-soft dark:text-foreground">
                {emptyStateTitle}
              </h4>
              {emptyStateDescription && (
                <p className="mt-1 mb-4 max-w-sm text-xs leading-5 text-muted-foreground">
                  {emptyStateDescription}
                </p>
              )}
              {siteConfig.catalog.pdfUrl && (
                <ButtonLink
                  className="min-h-9 border-border text-xs"
                  href={siteConfig.catalog.pdfUrl}
                  rel="noreferrer"
                  size="sm"
                  target="_blank"
                  variant="outline"
                >
                  <Download aria-hidden="true" />
                  {copy.openCatalogAction}
                </ButtonLink>
              )}
            </div>
          )}

          <div className="flex min-h-16 flex-col items-start justify-center gap-2 border-t border-border bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:bg-slate-950/25">
            <p className="m-0 text-[0.68rem] text-muted-foreground">
              {filteredEntries.length > 0 ? (
                <>
                  {copy.summaryShowing}{" "}
                  <strong className="text-ink-soft dark:text-foreground">
                    {firstVisible}–{lastVisible}
                  </strong>{" "}
                  {copy.summaryOf}{" "}
                  <strong className="text-ink-soft dark:text-foreground">
                    {filteredEntries.length.toLocaleString()}
                  </strong>{" "}
                  {query.trim() || activeFilterCount > 0
                    ? `matching ${filteredEntries.length === 1 ? copy.productSingular : copy.productPlural}`
                    : filteredEntries.length === 1
                      ? copy.productSingular
                      : copy.productPlural}
                </>
              ) : (
                copy.noProducts
              )}
            </p>
            <div
              aria-label={copy.paginationLabel}
              className="flex items-center gap-2"
            >
              <Button
                aria-label={copy.previousPageAriaLabel}
                className="h-8 gap-1 rounded-lg border-border px-2.5 text-[0.68rem] text-ink-soft hover:bg-blue-50 dark:text-foreground dark:hover:bg-blue-950"
                disabled={currentPage === 1}
                onClick={() => {
                  setPage((current) => Math.max(current - 1, 1))
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" />
                <span>{copy.previousPage}</span>
              </Button>
              <span className="min-w-10 text-center text-[0.68rem] font-bold text-ink-soft tabular-nums dark:text-foreground">
                {currentPage}{" "}
                <span className="font-normal text-muted-foreground">/</span>{" "}
                {pageCount}
              </span>
              <Button
                aria-label={copy.nextPageAriaLabel}
                className="h-8 gap-1 rounded-lg border-border px-2.5 text-[0.68rem] text-ink-soft hover:bg-blue-50 dark:text-foreground dark:hover:bg-blue-950"
                disabled={currentPage === pageCount}
                onClick={() => {
                  setPage((current) => Math.min(current + 1, pageCount))
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <span>{copy.nextPage}</span>
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>

        <p className="mt-3 text-right text-[0.62rem] leading-5 text-muted-foreground sm:px-1 sm:text-xs">
          {copy.sourceNote}
        </p>
      </Container>
    </section>
  )
}
