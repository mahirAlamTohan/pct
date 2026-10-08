"use client"

import { ArrowLeft, Calculator, Copy, Minus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { useEstimateCart } from "@/components/estimate/estimate-cart-provider"
import { Button, ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { siteContent } from "@/config/content"
import { siteConfig } from "@/config/site"
import {
  calculateLineTotalCents,
  createEstimateSummary,
  formatUsdCents,
  MAX_ESTIMATE_QUANTITY,
} from "@/data/estimate"
import type { EstimateLineItem } from "@/types/estimate"

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template
  )
}

function QuantityStepper({
  item,
  onChange,
}: {
  item: EstimateLineItem
  onChange: (quantity: number) => void
}) {
  const copy = siteContent.estimate

  return (
    <div>
      <span className="mb-1.5 block text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
        {copy.quantityLabel}
      </span>
      <div
        aria-label={formatMessage(copy.setQuantityAriaLabel, {
          product: item.product,
        })}
        className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-input bg-background p-1 shadow-sm"
        role="group"
      >
        <Button
          aria-label={formatMessage(copy.decreaseQuantityAriaLabel, {
            product: item.product,
          })}
          className="size-8 rounded-lg text-primary-text"
          disabled={item.quantity <= 1}
          onClick={() => {
            onChange(item.quantity - 1)
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Minus aria-hidden="true" />
        </Button>
        <output
          aria-live="polite"
          className="min-w-9 text-center text-sm font-extrabold tabular-nums"
        >
          {item.quantity.toLocaleString()}
        </output>
        <Button
          aria-label={formatMessage(copy.increaseQuantityAriaLabel, {
            product: item.product,
          })}
          className="size-8 rounded-lg text-primary-text"
          disabled={item.quantity >= MAX_ESTIMATE_QUANTITY}
          onClick={() => {
            onChange(item.quantity + 1)
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

function EstimateProductCard({ item }: { item: EstimateLineItem }) {
  const copy = siteContent.estimate
  const { removeItem, setQuantity } = useEstimateCart()

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-extrabold wrap-break-word text-ink dark:text-foreground">
            {item.product}
          </h2>
          <p className="mt-1 mb-0 text-xs leading-5 text-muted-foreground">
            {[item.manufacturer, item.packSize].filter(Boolean).join(" · ") ||
              item.content}
          </p>
          {item.content && item.manufacturer && (
            <p className="mt-1 mb-0 text-xs leading-5 text-muted-foreground">
              {item.content}
            </p>
          )}
        </div>
        <Button
          aria-label={formatMessage(copy.removeItemAriaLabel, {
            product: item.product,
          })}
          className="size-9 rounded-lg text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
          onClick={() => {
            removeItem(item.id)
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 items-end gap-4 border-t border-border/70 pt-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div>
          <span className="mb-1.5 block text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
            {copy.unitPriceLabel}
          </span>
          <span className="text-sm font-bold text-ink-soft tabular-nums dark:text-foreground">
            {formatUsdCents(item.unitPriceCents)}
          </span>
        </div>
        <QuantityStepper
          item={item}
          onChange={(quantity) => {
            setQuantity(item.id, quantity)
          }}
        />
        <div className="col-span-2 text-right sm:col-span-1">
          <span className="mb-1.5 block text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
            {copy.lineTotalLabel}
          </span>
          <span className="text-lg font-extrabold text-primary-text tabular-nums">
            {formatUsdCents(calculateLineTotalCents(item))}
          </span>
        </div>
      </div>
    </article>
  )
}

export function EstimatePage() {
  const copy = siteContent.estimate
  const {
    clearEstimate,
    isReady,
    isStorageAvailable,
    itemCount,
    items,
    totalCents,
  } = useEstimateCart()
  const [copyFeedback, setCopyFeedback] = useState("")

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(
        createEstimateSummary(items, siteConfig.name)
      )
      setCopyFeedback(copy.copiedMessage)
    } catch {
      setCopyFeedback(copy.copyFailureMessage)
    }
  }

  return (
    <main className="min-h-[70vh] bg-linear-to-br from-catalog-surface via-background to-catalog-end pt-7 pb-16 sm:pt-10 sm:pb-20">
      <Container>
        <header className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[0.68rem] font-extrabold tracking-[0.12em] text-primary-text uppercase">
              <Calculator aria-hidden="true" className="size-4" />
              {copy.eyebrow}
            </span>
            <h1 className="mt-2 mb-0 font-display text-[clamp(1.9rem,4vw,2.7rem)] leading-tight font-extrabold tracking-[-0.045em] text-ink dark:text-foreground">
              {copy.title}
            </h1>
            <p className="mt-2 mb-0 text-sm leading-6 text-muted-foreground">
              {copy.description}
            </p>
          </div>
          <ButtonLink
            className="self-start border-border text-ink-soft sm:self-auto"
            href="/#catalog"
            variant="outline"
          >
            <ArrowLeft aria-hidden="true" />
            {copy.browseCatalogAction}
          </ButtonLink>
        </header>

        <Card className="mb-6 border-blue-200/80 bg-blue-50/80 p-4 text-sm leading-6 text-blue-950 dark:border-blue-900/80 dark:bg-blue-950/40 dark:text-blue-100">
          <p className="m-0">{copy.localOnlyNotice}</p>
          <p className="mt-1 mb-0 text-xs text-blue-800 dark:text-blue-200">
            {copy.packPriceNote}
          </p>
        </Card>

        {!isStorageAvailable && (
          <p
            className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
            role="status"
          >
            {copy.storageUnavailableNotice}
          </p>
        )}

        {!isReady ? (
          <Card
            aria-busy="true"
            className="flex min-h-48 items-center justify-center p-6 text-sm font-semibold text-muted-foreground"
            role="status"
          >
            {copy.loadingMessage}
          </Card>
        ) : items.length === 0 ? (
          <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-primary-text dark:border-blue-900 dark:bg-blue-950">
              <Calculator aria-hidden="true" className="size-6" />
            </span>
            <h2 className="m-0 font-display text-xl font-extrabold text-ink dark:text-foreground">
              {copy.emptyTitle}
            </h2>
            <p className="mt-2 mb-5 max-w-md text-sm leading-6 text-muted-foreground">
              {copy.emptyDescription}
            </p>
            <ButtonLink href="/#catalog">{copy.browseCatalogAction}</ButtonLink>
          </Card>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.38fr)] lg:gap-7">
            <section
              aria-labelledby="estimate-products-heading"
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  className="m-0 font-display text-lg font-extrabold text-ink dark:text-foreground"
                  id="estimate-products-heading"
                >
                  {copy.productsHeading}
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  {itemCount.toLocaleString()}{" "}
                  {itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              {items.map((item) => (
                <EstimateProductCard item={item} key={item.id} />
              ))}
            </section>

            <aside
              aria-labelledby="estimate-total-heading"
              className="lg:sticky lg:top-28"
            >
              <Card className="p-5 sm:p-6">
                <h2
                  className="m-0 text-sm font-extrabold tracking-wide text-muted-foreground uppercase"
                  id="estimate-total-heading"
                >
                  {copy.totalLabel}
                </h2>
                <p className="mt-2 mb-0 text-3xl font-extrabold tracking-tight wrap-break-word text-primary-text tabular-nums sm:text-4xl">
                  {formatUsdCents(totalCents)}
                </p>
                <p className="mt-2 mb-0 text-xs leading-5 text-muted-foreground">
                  {copy.localOnlyNotice}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button onClick={() => void copySummary()} variant="outline">
                    <Copy aria-hidden="true" />
                    {copy.copyAction}
                  </Button>
                  <Button
                    className="text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
                    onClick={() => {
                      clearEstimate()
                      setCopyFeedback("")
                    }}
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" />
                    {copy.clearAction}
                  </Button>
                </div>
                <p
                  aria-live="polite"
                  className="mt-3 mb-0 min-h-5 text-xs text-muted-foreground"
                  role="status"
                >
                  {copyFeedback}
                </p>
              </Card>
            </aside>
          </div>
        )}
      </Container>
    </main>
  )
}
