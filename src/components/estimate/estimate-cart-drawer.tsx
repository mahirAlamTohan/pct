"use client"

import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { Calculator, Copy, Minus, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

import { useEstimateCart } from "@/components/estimate/estimate-cart-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  const ariaValues = {
    packSize: item.packSize || "listed pack",
    product: item.product,
  }

  return (
    <div>
      <span className="mb-1.5 block text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
        {copy.packetCountLabel}
        {item.packSize ? ` of ${item.packSize}` : ""}
      </span>
      <div
        aria-label={formatMessage(copy.setQuantityAriaLabel, ariaValues)}
        className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-input bg-background p-1 shadow-sm"
        role="group"
      >
        <Button
          aria-label={formatMessage(copy.decreaseQuantityAriaLabel, ariaValues)}
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
          aria-label={formatMessage(copy.setQuantityAriaLabel, ariaValues)}
          aria-live="polite"
          className="min-w-9 text-center text-sm font-extrabold tabular-nums"
        >
          {item.quantity.toLocaleString()}
        </output>
        <Button
          aria-label={formatMessage(copy.increaseQuantityAriaLabel, ariaValues)}
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
          <h3 className="m-0 text-base font-extrabold wrap-break-word text-ink dark:text-foreground">
            {item.product}
          </h3>
          <p className="mt-1 mb-0 text-xs leading-5 text-muted-foreground">
            {[
              item.manufacturer,
              item.packSize ? `${copy.packLabel}: ${item.packSize}` : "",
            ]
              .filter(Boolean)
              .join(" · ") || item.content}
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
          className="size-9 shrink-0 rounded-lg text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
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
            {copy.singlePacketPriceLabel}
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

export function EstimateCartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copy = siteContent.estimate
  const {
    clearEstimate,
    isReady,
    isStorageAvailable,
    items,
    packetCount,
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
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-80 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <BaseDialog.Popup className="fixed inset-y-0 right-0 z-81 flex h-dvh w-full max-w-xl flex-col overflow-hidden border-l border-border bg-background text-foreground shadow-2xl transition-transform duration-300 ease-out outline-none data-ending-style:translate-x-full data-starting-style:translate-x-full motion-reduce:transition-none">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 text-[0.68rem] font-extrabold tracking-[0.12em] text-primary-text uppercase">
                <Calculator aria-hidden="true" className="size-4" />
                {copy.eyebrow}
              </span>
              <BaseDialog.Title className="mt-1 mb-0 font-display text-2xl font-extrabold tracking-tight text-ink dark:text-foreground">
                {copy.title}
              </BaseDialog.Title>
              <BaseDialog.Description className="mt-1 mb-0 text-sm leading-5 text-muted-foreground">
                {copy.description}
              </BaseDialog.Description>
            </div>
            <Button
              aria-label={copy.closeAction}
              className="size-9 shrink-0 rounded-lg text-ink-soft"
              onClick={() => {
                onOpenChange(false)
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </header>

          <div className="shrink-0 border-b border-border px-5 py-3 sm:px-6">
            <Card className="border-blue-200/80 bg-blue-50/80 p-3 text-xs leading-5 text-blue-950 dark:border-blue-900/80 dark:bg-blue-950/40 dark:text-blue-100">
              <p className="m-0">{copy.localOnlyNotice}</p>
              <p className="mt-1 mb-0 text-blue-800 dark:text-blue-200">
                {copy.packPriceNote}
              </p>
            </Card>
            {!isStorageAvailable && (
              <p
                className="mt-3 mb-0 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
                role="status"
              >
                {copy.storageUnavailableNotice}
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            {!isReady ? (
              <div
                aria-busy="true"
                className="flex min-h-48 items-center justify-center text-sm font-semibold text-muted-foreground"
                role="status"
              >
                {copy.loadingMessage}
              </div>
            ) : items.length === 0 ? (
              <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <span className="mb-4 grid size-14 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-primary-text dark:border-blue-900 dark:bg-blue-950">
                  <Calculator aria-hidden="true" className="size-6" />
                </span>
                <h2 className="m-0 font-display text-xl font-extrabold text-ink dark:text-foreground">
                  {copy.emptyTitle}
                </h2>
                <p className="mt-2 mb-5 max-w-sm text-sm leading-6 text-muted-foreground">
                  {copy.emptyDescription}
                </p>
                <Button
                  onClick={() => {
                    onOpenChange(false)
                  }}
                  type="button"
                  variant="outline"
                >
                  {copy.continueBrowsingAction}
                </Button>
              </Card>
            ) : (
              <section aria-labelledby="estimate-products-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2
                    className="m-0 font-display text-base font-extrabold text-ink dark:text-foreground"
                    id="estimate-products-heading"
                  >
                    {copy.productsHeading}
                  </h2>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {items.length.toLocaleString()}{" "}
                    {items.length === 1 ? "product" : "products"}
                    {" · "}
                    {packetCount.toLocaleString()}{" "}
                    {packetCount === 1 ? "packet" : "packets"}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <EstimateProductCard item={item} key={item.id} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {isReady && items.length > 0 && (
            <aside
              aria-labelledby="estimate-total-heading"
              className="shrink-0 border-t border-border bg-card px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-6"
            >
              <div className="flex items-end justify-between gap-3">
                <h2
                  className="m-0 text-sm font-extrabold tracking-wide text-muted-foreground uppercase"
                  id="estimate-total-heading"
                >
                  {copy.totalLabel}
                </h2>
                <p className="m-0 text-2xl font-extrabold tracking-tight text-primary-text tabular-nums">
                  {formatUsdCents(totalCents)}
                </p>
              </div>
              <p className="mt-1 mb-0 text-xs text-muted-foreground">
                {packetCount.toLocaleString()}{" "}
                {packetCount === 1 ? "packet" : "packets"} total
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
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
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" />
                  {copy.clearAction}
                </Button>
              </div>
              <p
                aria-live="polite"
                className="mt-2 mb-0 min-h-5 text-xs text-muted-foreground"
                role="status"
              >
                {copyFeedback}
              </p>
            </aside>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
