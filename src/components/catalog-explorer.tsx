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
  SlidersHorizontal,
  X,
} from "lucide-react"
import MiniSearch, { type SearchResult } from "minisearch"
import { useEffect, useMemo, useState } from "react"

import { Button, ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"
import { siteContent } from "@/config/content"
import { fetchCatalogData } from "@/data/fetch-catalog"
import { cn } from "@/lib/utils"
import type {
  CatalogExplorerProps,
  CatalogFilterMode,
  CatalogLoadState,
  CatalogProduct,
} from "@/types/catalog"

const PAGE_SIZE = 10
const SEARCH_FIELDS = ["content", "product", "packSize", "rate", "manufacturer"]

type CatalogMatch = SearchResult["match"]
type CatalogSearchDocument = CatalogProduct & { id: number }

interface CatalogEntry {
  product: CatalogProduct
  serial: number
  matches: CatalogMatch
}

interface FacetFilterProps {
  label: string
  options: string[]
  selectedValues: string[]
  mode: CatalogFilterMode
  onSelectedValuesChange: (values: string[]) => void
  onModeChange: (mode: CatalogFilterMode) => void
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

function FacetFilter({
  label,
  options,
  selectedValues,
  mode,
  onSelectedValuesChange,
  onModeChange,
}: FacetFilterProps) {
  const copy = siteContent.catalog
  const normalizedLabel = label.toLocaleLowerCase()
  const [search, setSearch] = useState("")
  const selected = useMemo(() => new Set(selectedValues), [selectedValues])
  const visibleOptions = options.filter((option) =>
    normalize(option).includes(normalize(search.trim()))
  )

  function toggleOption(option: string, checked: boolean) {
    onSelectedValuesChange(
      checked
        ? [...selectedValues, option]
        : selectedValues.filter((value) => value !== option)
    )
  }

  return (
    <fieldset className="min-w-0 space-y-2.5">
      <legend className="flex w-full items-center justify-between gap-2 text-xs font-extrabold text-ink-soft dark:text-foreground">
        {label}
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[0.62rem] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          {formatMessage(copy.selectedCount, {
            count: selectedValues.length.toLocaleString(),
          })}
        </span>
      </legend>

      <select
        aria-label={formatMessage(copy.facetModeAriaLabel, { label })}
        className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        onChange={(event) => {
          onModeChange(event.target.value as CatalogFilterMode)
        }}
        value={mode}
      >
        <option value="include">{copy.includeSelected}</option>
        <option value="exclude">{copy.excludeSelected}</option>
      </select>

      <Input
        aria-label={formatMessage(copy.facetSearchAriaLabel, {
          label: normalizedLabel,
        })}
        autoComplete="off"
        className="h-9 text-xs"
        onChange={(event) => {
          setSearch(event.target.value)
        }}
        placeholder={formatMessage(copy.facetSearchPlaceholder, {
          label: normalizedLabel,
        })}
        type="search"
        value={search}
      />

      <div className="max-h-44 scrollbar-thin space-y-0.5 overflow-y-auto rounded-xl border border-border bg-background/70 p-1.5">
        {visibleOptions.length > 0 ? (
          visibleOptions.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-accent dark:text-slate-200"
              key={option}
            >
              <input
                checked={selected.has(option)}
                className="size-3.5 shrink-0 accent-primary"
                onChange={(event) => {
                  toggleOption(option, event.target.checked)
                }}
                type="checkbox"
              />
              <span className="min-w-0 truncate" title={option}>
                {option}
              </span>
            </label>
          ))
        ) : (
          <p className="m-0 px-2 py-3 text-xs text-muted-foreground">
            {options.length === 0 ? copy.noFacetValues : copy.noFacetMatches}
          </p>
        )}
      </div>
    </fieldset>
  )
}

export function CatalogExplorer({
  products: initialProducts,
  catalogDataUrl,
}: CatalogExplorerProps) {
  const copy = siteContent.catalog
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState(initialProducts)
  const [manufacturerOptions, setManufacturerOptions] = useState(() =>
    distinctValues(initialProducts.map(({ manufacturer }) => manufacturer))
  )
  const [packagingOptions, setPackagingOptions] = useState(() =>
    distinctValues(initialProducts.map(({ packSize }) => packSize))
  )
  const [loadState, setLoadState] = useState<CatalogLoadState>(
    catalogDataUrl ? "loading" : "preview"
  )
  const [loadError, setLoadError] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [minimumPrice, setMinimumPrice] = useState("")
  const [maximumPrice, setMaximumPrice] = useState("")
  const [manufacturerMode, setManufacturerMode] =
    useState<CatalogFilterMode>("include")
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    []
  )
  const [packagingMode, setPackagingMode] =
    useState<CatalogFilterMode>("include")
  const [selectedPackaging, setSelectedPackaging] = useState<string[]>([])

  useEffect(() => {
    if (!catalogDataUrl) return

    const controller = new AbortController()

    fetchCatalogData(catalogDataUrl, controller.signal)
      .then((dataset) => {
        if (dataset.products.length === 0) {
          throw new Error(
            "The catalog file did not contain any valid products."
          )
        }

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

  const searchEntries = useMemo<CatalogEntry[]>(() => {
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
        if (
          !Number.isInteger(serial) ||
          serial < 1 ||
          serial > products.length
        ) {
          return []
        }

        const product = products[serial - 1]
        return [{ product, serial, matches: result.match }]
      })
  }, [products, query, searchIndex])

  const manufacturerSet = useMemo(
    () => new Set(selectedManufacturers),
    [selectedManufacturers]
  )
  const packagingSet = useMemo(
    () => new Set(selectedPackaging),
    [selectedPackaging]
  )
  const filteredEntries = useMemo(() => {
    const minimum = numericValue(minimumPrice)
    const maximum = numericValue(maximumPrice)

    return searchEntries.filter(({ product }) => {
      const price = numericValue(product.rate)
      if (minimum !== null && (price === null || price < minimum)) return false
      if (maximum !== null && (price === null || price > maximum)) return false

      if (manufacturerSet.size > 0) {
        const isSelected = manufacturerSet.has(product.manufacturer)
        if (manufacturerMode === "include" && !isSelected) return false
        if (manufacturerMode === "exclude" && isSelected) return false
      }

      if (packagingSet.size > 0) {
        const isSelected = packagingSet.has(product.packSize)
        if (packagingMode === "include" && !isSelected) return false
        if (packagingMode === "exclude" && isSelected) return false
      }

      return true
    })
  }, [
    searchEntries,
    minimumPrice,
    maximumPrice,
    manufacturerSet,
    manufacturerMode,
    packagingSet,
    packagingMode,
  ])

  const activeFilterCount =
    Number(minimumPrice.trim().length > 0) +
    Number(maximumPrice.trim().length > 0) +
    selectedManufacturers.length +
    selectedPackaging.length
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

  function clearFilters() {
    setPage(1)
    setMinimumPrice("")
    setMaximumPrice("")
    setSelectedManufacturers([])
    setSelectedPackaging([])
    setManufacturerMode("include")
    setPackagingMode("include")
  }

  const statusMessage = (() => {
    switch (loadState) {
      case "preview":
        return formatMessage(copy.status.preview, {
          count: products.length.toLocaleString(),
        })
      case "loading":
        return copy.status.loading
      case "loaded":
        return formatMessage(copy.status.loaded, {
          count: products.length.toLocaleString(),
        })
      case "error":
        return formatMessage(copy.status.error, {
          count: products.length.toLocaleString(),
        })
    }
  })()

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
              <span className="grid size-9 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm dark:bg-blue-950 dark:text-emerald-300">
                {loadState === "loading" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-[17px] animate-spin"
                  />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="size-[17px]" />
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
                    : copy.searchNowLabel}
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
                  className="h-9 border-border bg-background px-3 text-xs text-muted-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950"
                  disabled={!query}
                  onClick={() => {
                    updateQuery("")
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <X aria-hidden="true" />
                  {copy.clearSearchAction}
                </Button>
                <Button
                  aria-controls="catalog-filters"
                  aria-expanded={filtersOpen}
                  className="h-9 border-border bg-background px-3 text-xs text-ink-soft hover:bg-blue-50 dark:text-foreground dark:hover:bg-blue-950"
                  onClick={() => {
                    setFiltersOpen((open) => !open)
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <SlidersHorizontal aria-hidden="true" />
                  {copy.filtersAction}
                  {activeFilterCount > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.62rem] font-extrabold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>

              <ButtonLink
                className="min-h-9 gap-1.5 bg-blue-50 px-3 text-xs text-blue-800 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900"
                href={siteConfig.catalog.pdfUrl || "#catalog"}
                rel="noreferrer"
                size="sm"
                target="_blank"
                variant="secondary"
              >
                <Download aria-hidden="true" />
                {copy.downloadAction}
                <ArrowUpRight aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>

          {filtersOpen && (
            <div
              className="grid gap-5 border-y border-border bg-slate-50/80 p-5 sm:grid-cols-2 sm:px-7 lg:grid-cols-[minmax(190px,0.72fr)_minmax(0,1fr)_minmax(0,1fr)] dark:bg-slate-950/30"
              id="catalog-filters"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="m-0 text-xs font-extrabold text-ink-soft dark:text-foreground">
                    {copy.priceRangeTitle}
                  </h4>
                  <span className="text-[0.62rem] font-medium text-muted-foreground">
                    {copy.priceUnit}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="min-w-0 space-y-1.5">
                    <span className="text-[0.62rem] font-bold text-muted-foreground">
                      {copy.minimumPriceLabel}
                    </span>
                    <Input
                      aria-label={copy.minimumPriceAriaLabel}
                      className="h-9 text-xs tabular-nums"
                      min="0"
                      onChange={(event) => {
                        setMinimumPrice(event.target.value)
                        setPage(1)
                      }}
                      placeholder={copy.noMinimumPrice}
                      step="0.01"
                      type="number"
                      value={minimumPrice}
                    />
                  </label>
                  <label className="min-w-0 space-y-1.5">
                    <span className="text-[0.62rem] font-bold text-muted-foreground">
                      {copy.maximumPriceLabel}
                    </span>
                    <Input
                      aria-label={copy.maximumPriceAriaLabel}
                      className="h-9 text-xs tabular-nums"
                      min="0"
                      onChange={(event) => {
                        setMaximumPrice(event.target.value)
                        setPage(1)
                      }}
                      placeholder={copy.noMaximumPrice}
                      step="0.01"
                      type="number"
                      value={maximumPrice}
                    />
                  </label>
                </div>
                <p className="m-0 text-[0.65rem] leading-5 text-muted-foreground">
                  {copy.priceLimitHelp}
                </p>
              </div>

              <FacetFilter
                label={copy.manufacturerLabel}
                mode={manufacturerMode}
                onModeChange={(mode) => {
                  setManufacturerMode(mode)
                  setPage(1)
                }}
                onSelectedValuesChange={(values) => {
                  setSelectedManufacturers(values)
                  setPage(1)
                }}
                options={manufacturerOptions}
                selectedValues={selectedManufacturers}
              />
              <FacetFilter
                label={copy.packagingLabel}
                mode={packagingMode}
                onModeChange={(mode) => {
                  setPackagingMode(mode)
                  setPage(1)
                }}
                onSelectedValuesChange={(values) => {
                  setSelectedPackaging(values)
                  setPage(1)
                }}
                options={packagingOptions}
                selectedValues={selectedPackaging}
              />

              <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-3">
                <p
                  className="m-0 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  {filteredEntries.length.toLocaleString()} {"matching "}
                  {filteredEntries.length === 1
                    ? copy.productSingular
                    : copy.productPlural}
                </p>
                <Button
                  className="h-8 px-2.5 text-xs text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-950"
                  disabled={activeFilterCount === 0}
                  onClick={clearFilters}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" />
                  {copy.clearFiltersAction}
                </Button>
              </div>
            </div>
          )}

          <div
            aria-live="polite"
            className="flex min-h-10 flex-col justify-center gap-1 border-t border-border px-5 text-[0.68rem] sm:flex-row sm:items-center sm:justify-between sm:px-7"
          >
            <span
              className={cn(
                "inline-flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300",
                loadState === "loading" && "text-blue-700 dark:text-blue-300",
                loadState === "error" && "text-rose-700 dark:text-rose-300"
              )}
            >
              {loadState === "loading" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-3.5 animate-spin"
                />
              ) : loadState === "error" ? (
                <AlertCircle aria-hidden="true" className="size-3.5" />
              ) : (
                <span className="size-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
              )}
              {statusMessage}
            </span>
            <span className="text-muted-foreground sm:text-right">
              {query.trim()
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
                      className="w-[74px] py-3 pl-5 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase sm:pl-7"
                      scope="col"
                    >
                      {copy.tableHeadings.serial}
                    </th>
                    <th
                      className="w-[32%] px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.ingredient}
                    </th>
                    <th
                      className="w-[23%] px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.product}
                    </th>
                    <th
                      className="w-30 px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.packaging}
                    </th>
                    <th
                      className="w-[20%] px-4 py-3 text-[0.62rem] font-extrabold tracking-[0.075em] text-muted-foreground uppercase"
                      scope="col"
                    >
                      {copy.tableHeadings.manufacturer}
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
                  {pageEntries.map(({ product, serial, matches }) => {
                    const shortContent = truncateIngredient(
                      product.content,
                      fieldTerms(matches, "content")
                    )

                    return (
                      <tr
                        className="border-b border-border/70 transition-colors last:border-0 hover:bg-blue-50/60 dark:hover:bg-blue-950/30"
                        key={`${serial.toString()}-${product.product}`}
                      >
                        <td className="py-3.5 pl-5 text-[0.68rem] text-slate-400 tabular-nums sm:pl-7 dark:text-slate-500">
                          {serial}
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
                        <td className="px-4 py-3.5 text-xs font-bold text-blue-900 dark:text-blue-100">
                          {highlightForField(
                            product.product,
                            matches,
                            "product"
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
                        <td className="max-w-55 px-4 py-3.5 text-[0.68rem] leading-5 font-semibold text-slate-600 dark:text-slate-300">
                          {highlightForField(
                            product.manufacturer,
                            matches,
                            "manufacturer"
                          )}
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
                <Search aria-hidden="true" className="size-6" />
              </span>
              <h4 className="m-0 font-display text-base font-extrabold text-ink-soft dark:text-foreground">
                {copy.emptyTitle}
              </h4>
              <p className="mt-1 mb-4 max-w-sm text-xs leading-5 text-muted-foreground">
                {copy.emptyDescription}
              </p>
              <ButtonLink
                className="min-h-9 border-border text-xs"
                href={siteConfig.catalog.pdfUrl || "#catalog"}
                rel="noreferrer"
                size="sm"
                target="_blank"
                variant="outline"
              >
                <Download aria-hidden="true" />
                {copy.openCatalogAction}
              </ButtonLink>
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
