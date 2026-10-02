import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CatalogExplorer } from "@/components/catalog-explorer"
import { fetchCatalogData } from "@/data/fetch-catalog"
import type { CatalogDataset } from "@/types/catalog"

vi.mock("@/data/fetch-catalog", () => ({
  fetchCatalogData: vi.fn(),
}))

const dataset: CatalogDataset = {
  products: [
    {
      product: "ALPHA 10MG",
      content: "Example ingredient",
      manufacturer: "Acme Labs",
      packSize: "1x10",
      rate: "1.00",
    },
    {
      product: "BETA 20MG",
      content: "Other compound",
      manufacturer: "Beta Pharmaceuticals Ltd",
      packSize: "2x10",
      rate: "5.00",
    },
    {
      product: "GAMMA 30MG",
      content: "Another ingredient",
      manufacturer: "Acme Labs",
      packSize: "1x20",
      rate: "9.00",
    },
  ],
  manufacturers: ["Acme Labs", "Beta Pharmaceuticals Ltd"],
  packaging: ["1x10", "2x10", "1x20"],
  metadata: { minPrice: 1, maxPrice: 9 },
}

function largeManufacturerName(index: number) {
  return index === 1_073
    ? "Rare Manufacturer Cobalt"
    : `Manufacturer ${index.toString()} MFG${index.toString().padStart(4, "0")}`
}

const largeDataset: CatalogDataset = {
  products: Array.from({ length: 9_239 }, (_, index) => {
    const manufacturerIndex = index % 1_074
    const packagingIndex = index % 39

    return {
      product: "SCALE TEST PRODUCT",
      content: "Scale test ingredient",
      manufacturer: largeManufacturerName(manufacturerIndex),
      packSize: `Packaging ${packagingIndex.toString().padStart(2, "0")}`,
      rate: "1.00",
    }
  }),
  manufacturers: Array.from({ length: 1_074 }, (_, index) =>
    largeManufacturerName(index)
  ),
  packaging: Array.from(
    { length: 39 },
    (_, index) => `Packaging ${index.toString().padStart(2, "0")}`
  ),
  metadata: { minPrice: 1, maxPrice: 2 },
}

const loadCatalogMock = vi.mocked(fetchCatalogData)
const catalogUrl = "/data/catalog.a1b2c3.dat"

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  loadCatalogMock.mockResolvedValue(dataset)
})

async function renderLoadedCatalog() {
  const user = userEvent.setup()
  render(<CatalogExplorer catalogDataUrl={catalogUrl} />)
  await screen.findByText("Catalog loaded: 3 products.")
  return user
}

function manufacturerOption(name: string) {
  return screen.getByRole("button", {
    name: (accessibleName) =>
      accessibleName.startsWith(`Manufacturer: ${name}`) &&
      accessibleName.includes(". Current state:"),
  })
}

describe("CatalogExplorer", () => {
  it("loads records and renders only the required catalog columns", async () => {
    await renderLoadedCatalog()

    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent.trim())
    ).toEqual([
      "Product Name",
      "Active Ingredient",
      "Manufacturer",
      "Packaging",
      "RATE (USD)",
    ])
    expect(screen.queryByText("S. No.")).not.toBeInTheDocument()
    expect(screen.getAllByText("Acme Labs").length).toBeGreaterThan(0)
  })

  it("searches manufacturer names and highlights matched text", async () => {
    const user = await renderLoadedCatalog()
    const search = screen.getByRole("searchbox", {
      name: "Search the medicine catalog",
    })

    await user.type(search, "Beta Pharmacuticals")

    await waitFor(() => {
      expect(
        screen
          .getAllByRole("row")
          .some((row) => row.textContent.includes("BETA 20MG"))
      ).toBe(true)
    })
    expect(screen.getByText("Beta", { exact: true })).toBeInTheDocument()
    expect(
      screen
        .getAllByRole("row")
        .some((row) => row.textContent.includes("ALPHA 10MG"))
    ).toBe(false)
  })

  it("searches and combines independent facets across a full-size catalog", async () => {
    loadCatalogMock.mockResolvedValueOnce(largeDataset)
    const user = userEvent.setup()
    render(<CatalogExplorer catalogDataUrl={catalogUrl} />)
    await screen.findByText("Catalog loaded: 9,239 products.")
    expect(screen.getAllByRole("row")).toHaveLength(11)

    await user.type(
      screen.getByRole("searchbox", { name: "Search the medicine catalog" }),
      "Cobalt"
    )
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(9)
    })

    await user.click(screen.getByRole("button", { name: "Filters" }))
    await user.type(
      screen.getByRole("searchbox", { name: "Search Manufacturer filters" }),
      "Cobalt"
    )
    await user.type(
      screen.getByRole("searchbox", { name: "Search Packaging filters" }),
      "Packaging 20"
    )

    const manufacturer = manufacturerOption("Rare Manufacturer Cobalt")
    const packaging = screen.getByRole("button", {
      name: /^Packaging: Packaging 20/,
    })
    await user.click(manufacturer)
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(9)
    })
    await user.click(packaging)
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(2)
    })
  })

  it("cycles Include → Exclude → none and lets users remove each summary", async () => {
    const user = await renderLoadedCatalog()
    await user.click(screen.getByRole("button", { name: "Filters" }))

    const option = manufacturerOption("Acme Labs")
    await user.click(option)
    expect(option).toHaveAttribute("data-selection-state", "include")
    expect(
      screen.getByRole("button", {
        name: "Remove Manufacturer: Acme Labs from the included filters",
      })
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(3)
    })

    await user.click(option)
    expect(option).toHaveAttribute("data-selection-state", "exclude")
    const removeExcluded = screen.getByRole("button", {
      name: "Remove Manufacturer: Acme Labs from the excluded filters",
    })
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(2)
    })
    await user.click(removeExcluded)
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(4)
    })
  })

  it("keeps Manufacturer and Packaging facet searches independent", async () => {
    const user = await renderLoadedCatalog()
    await user.click(screen.getByRole("button", { name: "Filters" }))

    await user.type(screen.getByPlaceholderText("Search Manufacturer…"), "Beta")
    await user.type(screen.getByPlaceholderText("Search Packaging…"), "1x10")

    expect(manufacturerOption("Beta Pharma")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^Manufacturer: Acme Labs/ })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^Packaging: 1x10/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^Packaging: 2x10/ })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^Packaging: 1x10/ }))
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(2)
    })
    expect(screen.getByText("ALPHA 10MG")).toBeInTheDocument()
  })

  it("combines a USD price range with manufacturer and packaging filters", async () => {
    const user = await renderLoadedCatalog()
    await user.click(screen.getByRole("button", { name: "Filters" }))

    const minimum = screen.getByRole("slider", {
      name: "Minimum price in US dollars",
    })
    const maximum = screen.getByRole("slider", {
      name: "Maximum price in US dollars",
    })
    fireEvent.change(minimum, { target: { value: "5" } })
    await waitFor(() => {
      expect(minimum).toHaveAttribute("aria-valuenow", "5")
      expect(screen.getAllByRole("row")).toHaveLength(3)
    })

    await user.click(manufacturerOption("Acme Labs"))
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(2)
    })
    await user.click(screen.getByRole("button", { name: /^Packaging: 1x20/ }))
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(2)
    })

    fireEvent.change(maximum, { target: { value: "8" } })
    await waitFor(() => {
      expect(maximum).toHaveAttribute("aria-valuenow", "8")
      expect(screen.getByText("No products to display")).toBeInTheDocument()
    })
  })

  it("shows a real no-records state when no catalog URL is configured", () => {
    render(<CatalogExplorer />)

    expect(
      screen.getByText("Catalog URL not configured. No records are available.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "No catalog records available" })
    ).toBeInTheDocument()
    expect(loadCatalogMock).not.toHaveBeenCalled()
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument()
  })

  it("shows a clear load error and never renders fallback products", async () => {
    loadCatalogMock.mockRejectedValueOnce(new Error("fixture network failure"))
    render(<CatalogExplorer catalogDataUrl={catalogUrl} />)

    expect(
      await screen.findByText("Catalog unavailable. No records are displayed.")
    ).toBeInTheDocument()
    expect(screen.getByText(/fixture network failure/)).toBeInTheDocument()
    expect(screen.queryByText("ALPHA 10MG")).not.toBeInTheDocument()
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument()
  })

  it("exposes both accessible USD range-slider thumbs", async () => {
    const user = await renderLoadedCatalog()
    await user.click(screen.getByRole("button", { name: "Filters" }))
    const minimum = screen.getByRole("slider", {
      name: "Minimum price in US dollars",
    })
    const maximum = screen.getByRole("slider", {
      name: "Maximum price in US dollars",
    })

    expect(minimum).toHaveAttribute("min", "1")
    expect(minimum).toHaveAttribute("aria-valuenow", "1")
    expect(maximum).toHaveAttribute("max", "9")
    expect(maximum).toHaveAttribute("aria-valuenow", "9")
  })
})
