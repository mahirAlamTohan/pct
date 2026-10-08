import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EstimateCartProvider } from "@/components/estimate/estimate-cart-provider"
import { EstimatePage } from "@/components/estimate/estimate-page"
import {
  createEstimateLineItem,
  ESTIMATE_STORAGE_KEY,
  serializeEstimateItems,
} from "@/data/estimate"
import type { CatalogProduct } from "@/types/catalog"

const alpha: CatalogProduct = {
  product: "ALPHA 10MG",
  content: "Example ingredient",
  manufacturer: "Acme Labs",
  packSize: "1x10",
  rate: "1.00",
}
const beta: CatalogProduct = {
  product: "BETA 20MG",
  content: "Other compound",
  manufacturer: "Beta Pharmaceuticals Ltd",
  packSize: "2x10",
  rate: "5.00",
}

function estimateItem(product: CatalogProduct, quantity = 1) {
  const item = createEstimateLineItem(product)
  if (!item)
    throw new Error(`Unable to create test item for ${product.product}`)
  return { ...item, quantity }
}

function renderEstimate() {
  render(
    <EstimateCartProvider>
      <EstimatePage />
    </EstimateCartProvider>
  )
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  window.localStorage.clear()
})

describe("EstimatePage", () => {
  it("loads the device-local estimate, computes totals, and persists quantity changes", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      ESTIMATE_STORAGE_KEY,
      serializeEstimateItems([estimateItem(alpha, 2), estimateItem(beta)])
    )
    renderEstimate()

    expect(
      await screen.findByRole("heading", { name: "Your order estimate" })
    ).toBeInTheDocument()
    expect(screen.getByText("$7.00")).toBeInTheDocument()
    expect(screen.getByText("3 items", { exact: true })).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Increase quantity for BETA 20MG" })
    )
    expect(screen.getByText("$12.00")).toBeInTheDocument()
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(ESTIMATE_STORAGE_KEY) ?? "{}"
      ) as { items?: { product: string; quantity: number }[] }
      expect(
        stored.items?.find((item) => item.product === "BETA 20MG")?.quantity
      ).toBe(2)
    })
  })

  it("synchronizes local estimate changes from another browser tab", async () => {
    window.localStorage.setItem(
      ESTIMATE_STORAGE_KEY,
      serializeEstimateItems([estimateItem(beta)])
    )
    renderEstimate()
    expect(await screen.findAllByText("$5.00")).toHaveLength(3)

    const newDocument = serializeEstimateItems([estimateItem(alpha)])
    window.localStorage.setItem(ESTIMATE_STORAGE_KEY, newDocument)
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: ESTIMATE_STORAGE_KEY,
          newValue: newDocument,
          storageArea: window.localStorage,
        })
      )
    })

    expect(screen.queryByRole("heading", { name: "BETA 20MG" })).toBeNull()
    expect(
      within(
        screen.getByRole("complementary", { name: "Estimated total" })
      ).getByText("$1.00")
    ).toBeInTheDocument()
  })

  it("removes products and clears the estimate without creating an order", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      ESTIMATE_STORAGE_KEY,
      serializeEstimateItems([estimateItem(alpha), estimateItem(beta)])
    )
    renderEstimate()

    await screen.findByText("$6.00")
    await user.click(
      screen.getByRole("button", {
        name: "Remove ALPHA 10MG from your estimate",
      })
    )
    expect(
      within(
        screen.getByRole("complementary", { name: "Estimated total" })
      ).getByText("$5.00")
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Clear estimate" }))
    expect(
      await screen.findByRole("heading", { name: "Your estimate is empty" })
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem(ESTIMATE_STORAGE_KEY)).toBeNull()
    })
    expect(
      screen.queryByRole("button", { name: /checkout|payment/i })
    ).toBeNull()
  })

  it("copies a local estimate summary without submitting it", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    window.localStorage.setItem(
      ESTIMATE_STORAGE_KEY,
      serializeEstimateItems([estimateItem(alpha)])
    )
    renderEstimate()

    await user.click(
      await screen.findByRole("button", { name: "Copy estimate summary" })
    )

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("Estimated total: $1.00")
      )
    })
    expect(
      screen.getByText("Estimate summary copied on this device.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /place order|checkout|pay/i })
    ).toBeNull()
  })
})
