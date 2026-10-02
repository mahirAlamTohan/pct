import { AxeBuilder } from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

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
    "Active Ingredient": `Example compound ${String(index + 1)}`,
    Manufacturer: 0,
    Packaging: index % 2 === 0 ? 2 : 0,
    "RATE (USD)": (index + 2).toFixed(2),
  })),
]

const artifacts = new Map<string, unknown>([
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

async function installCatalogFixtures(page: Page, status = 200): Promise<void> {
  await page.route("**/*.dat", async (route) => {
    const fileName = new URL(route.request().url()).pathname.split("/").at(-1)
    const artifact = fileName ? artifacts.get(fileName) : undefined

    if (status !== 200) {
      await route.fulfill({
        body: "Fixture catalog is intentionally unavailable.",
        contentType: "text/plain",
        status,
      })
      return
    }

    if (artifact === undefined) {
      await route.fulfill({
        body: "Fixture artifact not found.",
        contentType: "text/plain",
        status: 404,
      })
      return
    }

    await route.fulfill({
      body: JSON.stringify(artifact),
      contentType: "application/json; charset=utf-8",
      status: 200,
    })
  })
}

async function openCatalog(page: Page): Promise<void> {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()
  await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()
}

test.describe("static catalog experience", () => {
  test("searches manufacturer typos and combines removable include/exclude facets", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)

    const table = page.getByRole("table")
    await expect(table.getByRole("columnheader")).toHaveText([
      "Product Name",
      "Active Ingredient",
      "Manufacturer",
      "Packaging",
      "RATE (USD)",
    ])

    const search = page.getByRole("searchbox", {
      name: "Search the medicine catalog",
    })
    await search.fill("Beta Pharmacuticals")

    const betaRow = page.getByRole("row").filter({ hasText: "BETA 20MG" })
    await expect(betaRow).toBeVisible()
    await expect(betaRow).toContainText("Beta Pharmaceuticals Ltd")
    await expect(betaRow.locator("mark")).toContainText("BETA")
    await expect(
      page.getByRole("row").filter({ hasText: "ALPHA 10MG" })
    ).toHaveCount(0)

    await search.fill("")
    await page.getByRole("button", { name: "Filters" }).click()

    const manufacturerSearch = page.getByRole("searchbox", {
      name: "Search Manufacturer filters",
    })
    const packagingSearch = page.getByRole("searchbox", {
      name: "Search Packaging filters",
    })
    await manufacturerSearch.fill("Beta")
    await packagingSearch.fill("2x10")

    const betaManufacturer = page.getByRole("button", {
      name: /Manufacturer: Beta Pharmaceuticals Ltd/,
    })
    const betaPackaging = page.getByRole("button", { name: /^Packaging: 2x10/ })
    await expect(betaManufacturer).toBeVisible()
    await expect(betaPackaging).toBeVisible()
    await expect(
      page.getByRole("button", { name: /^Packaging: 1x10/ })
    ).toHaveCount(0)

    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(
      page.getByRole("button", {
        name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the included filters",
      })
    ).toBeVisible()

    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "exclude"
    )
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(
      page.getByRole("button", {
        name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the excluded filters",
      })
    ).toBeVisible()

    await page
      .getByRole("button", {
        name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the excluded filters",
      })
      .click()
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "none"
    )
  })

  test("keeps the mobile header fixed and preserves filter/footer themes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" })
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light")
    })
    await installCatalogFixtures(page)
    await openCatalog(page)

    const header = page.getByRole("banner")
    const documentElement = page.locator("html")
    await expect(header).toBeVisible()
    await expect(documentElement).not.toHaveClass(/dark/)
    await page.evaluate(() => {
      window.scrollTo(0, 500)
    })
    await expect
      .poll(
        async () => (await header.boundingBox())?.y ?? Number.POSITIVE_INFINITY
      )
      .toBeLessThan(20)

    const footer = page.locator("footer")
    await footer.scrollIntoViewIfNeeded()
    const lightFooterBackground = await footer.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    )

    const themeToggle = page.getByRole("button", { name: "Toggle color theme" })
    await themeToggle.click()
    await expect(documentElement).toHaveClass(/dark/)
    const darkFooterBackground = await footer.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    )
    expect(darkFooterBackground).not.toBe(lightFooterBackground)

    await page.locator("#catalog").scrollIntoViewIfNeeded()
    await page.getByRole("button", { name: "Filters" }).click()
    const betaManufacturer = page.getByRole("button", {
      name: /Manufacturer: Beta Pharmaceuticals Ltd/,
    })
    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    const darkIncludeColor = await betaManufacturer.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    )
    expect(darkIncludeColor).not.toBe("rgba(0, 0, 0, 0)")

    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "exclude"
    )
    await expect(betaManufacturer).toHaveClass(/bg-violet-600/)

    await themeToggle.click()
    await expect(documentElement).not.toHaveClass(/dark/)
    await betaManufacturer.click()
    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    const lightIncludeColor = await betaManufacturer.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    )
    expect(lightIncludeColor).not.toBe(darkIncludeColor)

    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "exclude"
    )
    await expect(betaManufacturer).toHaveClass(/bg-violet-600/)
  })

  test("shows a clear error and no product rows when the catalog endpoint fails", async ({
    page,
  }) => {
    await installCatalogFixtures(page, 503)
    await page.goto("/")

    await expect(
      page.getByText("Catalog unavailable. No records are displayed.")
    ).toBeVisible()
    await expect(page.getByText(/status 503/i)).toBeVisible()
    await expect(page.getByRole("columnheader")).toHaveCount(0)
    await expect(
      page.getByRole("row").filter({ hasText: "BETA 20MG" })
    ).toHaveCount(0)
  })

  test("has no axe-detected WCAG 2.2 A/AA violations with filters open", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)
    await page.getByRole("button", { name: "Filters" }).click()

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
