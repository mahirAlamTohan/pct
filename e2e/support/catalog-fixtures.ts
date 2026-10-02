import { expect, type Page } from "@playwright/test"

export const E2E_CATALOG_URL = "/__fixtures__/catalog.a1b2c3.dat"

const manufacturerValues = ["Acme Labs", "Beta Pharmaceuticals Ltd"]
const packagingValues = ["1x10", "2x10", "1x20"]

const catalogProducts = [
  {
    "Product Name": "ALPHA 10MG",
    "Active Ingredient": "Example ingredient",
    Manufacturer: 0,
    Packaging: 0,
    "RATE (USD)": "1.00",
  },
  {
    "Product Name": "BETA 20MG",
    "Active Ingredient": "Other compound",
    Manufacturer: 1,
    Packaging: 1,
    "RATE (USD)": "5.00",
  },
  ...Array.from({ length: 10 }, (_, index) => ({
    "Product Name": `GAMMA ${String(index + 1).padStart(2, "0")}MG`,
    "Active Ingredient":
      index === 9
        ? "Example compound with a deliberately long ingredient description for verifying that the catalog preserves complete values for assistive technology while keeping the table readable on smaller screens."
        : `Example compound ${String(index + 1)}`,
    Manufacturer: 0,
    Packaging: index % 2 === 0 ? 2 : 0,
    "RATE (USD)": `${String(index < 3 ? index + 2 : index + 3)}.00`,
  })),
]

export const defaultCatalogArtifacts = new Map<string, unknown>([
  [
    "catalog.a1b2c3.dat",
    {
      metadata: { minPrice: 1, maxPrice: 12 },
      products: catalogProducts,
    },
  ],
  [
    "manufacturers.a1b2c3.dat",
    { kind: "manufacturers", values: manufacturerValues },
  ],
  ["packaging.a1b2c3.dat", { kind: "packaging", values: packagingValues }],
])

interface CatalogFixtureOptions {
  status?: number
  delayMs?: number
  artifacts?: ReadonlyMap<string, unknown>
  rawBodies?: ReadonlyMap<string, string>
}

export async function installCatalogFixtures(
  page: Page,
  {
    status = 200,
    delayMs = 0,
    artifacts = defaultCatalogArtifacts,
    rawBodies = new Map(),
  }: CatalogFixtureOptions = {}
): Promise<void> {
  await page.route("**/*.dat", async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    const fileName = new URL(route.request().url()).pathname.split("/").at(-1)
    if (status !== 200) {
      await route.fulfill({
        body: "Fixture catalog is intentionally unavailable.",
        contentType: "text/plain",
        status,
      })
      return
    }

    if (fileName && rawBodies.has(fileName)) {
      await route.fulfill({
        body: rawBodies.get(fileName),
        contentType: "application/json; charset=utf-8",
        status: 200,
      })
      return
    }

    if (!fileName || !artifacts.has(fileName)) {
      await route.fulfill({
        body: "Fixture artifact not found.",
        contentType: "text/plain",
        status: 404,
      })
      return
    }

    await route.fulfill({
      body: JSON.stringify(artifacts.get(fileName)),
      contentType: "application/json; charset=utf-8",
      status: 200,
    })
  })
}

export async function openCatalog(page: Page): Promise<void> {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()
  await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()
}

export function manufacturerOption(page: Page, value: string) {
  return page
    .locator("#catalog-filters fieldset")
    .nth(0)
    .locator("button[data-selection-state]")
    .filter({ hasText: value })
}

export function packagingOption(page: Page, value: string) {
  return page
    .locator("#catalog-filters fieldset")
    .nth(1)
    .locator("button[data-selection-state]")
    .filter({ hasText: value })
}

export function largeCatalogArtifacts(count = 500) {
  const manufacturers = Array.from(
    { length: count },
    (_, index) => `Manufacturer ${String(index).padStart(4, "0")}`
  )
  manufacturers[count - 1] = "Rare Manufacturer Cobalt"

  return new Map<string, unknown>([
    [
      "catalog.a1b2c3.dat",
      {
        metadata: { minPrice: 1, maxPrice: count },
        products: manufacturers.map((_, index) => ({
          "Product Name": `SCALE PRODUCT ${String(index + 1)}`,
          "Active Ingredient": `Scale compound ${String(index + 1)}`,
          Manufacturer: index,
          Packaging: index % 2,
          "RATE (USD)": `${String(index + 1)}.00`,
        })),
      },
    ],
    [
      "manufacturers.a1b2c3.dat",
      { kind: "manufacturers", values: manufacturers },
    ],
    [
      "packaging.a1b2c3.dat",
      { kind: "packaging", values: ["Box 20", "Bottle 10"] },
    ],
  ])
}
