import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import {
  defaultCatalogArtifacts,
  installCatalogFixtures,
  largeCatalogArtifacts,
  manufacturerOption,
  openCatalog,
  packagingOption,
} from "./support/catalog-fixtures"

const columns = [
  "Product Name",
  "Active Ingredient",
  "Manufacturer",
  "Packaging",
  "RATE (USD)",
]

test.describe("static catalog experience", () => {
  test("loads the catalog, exposes only the required columns, and links to the configured PDF", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)

    await expect(page.getByRole("table").getByRole("columnheader")).toHaveText(
      columns
    )
    await expect(
      page.getByRole("row").filter({ hasText: "BETA 20MG" })
    ).toContainText("Beta Pharmaceuticals Ltd")
    await expect(
      page.getByRole("link", { name: "Download full catalog" })
    ).toHaveAttribute("href", "https://example.test/catalog.pdf")
    await expect(
      page.getByRole("button", { name: "Clear filters" })
    ).toBeDisabled()
  })

  test("keeps catalog rows out of HTML and omits cookies from artifact requests", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await page.addInitScript(() => {
      document.cookie = "pct-e2e-session=must-not-be-sent; path=/; SameSite=Lax"
    })

    const artifactRequests: Promise<{
      fileName: string
      hasCookie: boolean
    }>[] = []
    page.on("request", (request) => {
      const url = new URL(request.url())
      if (!url.pathname.endsWith(".dat")) return

      artifactRequests.push(
        request.allHeaders().then((headers) => ({
          fileName: url.pathname.split("/").at(-1) ?? "",
          hasCookie: Object.keys(headers).some(
            (header) => header.toLowerCase() === "cookie"
          ),
        }))
      )
    })

    const response = await page.goto("/")
    if (!response) throw new Error("The app shell did not return a response.")
    const html = await response.text()
    expect(html).not.toContain("ALPHA 10MG")
    expect(html).not.toContain("BETA 20MG")
    await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()

    const observedRequests = await Promise.all(artifactRequests)
    expect(observedRequests.map(({ fileName }) => fileName).sort()).toEqual([
      "catalog.a1b2c3.dat",
      "manufacturers.a1b2c3.dat",
      "packaging.a1b2c3.dat",
    ])
    expect(observedRequests.every(({ hasCookie }) => !hasCookie)).toBe(true)
  })

  test("announces the loading state before the catalog and dictionaries arrive", async ({
    page,
  }) => {
    await installCatalogFixtures(page, { delayMs: 800 })
    await page.goto("/")

    await expect(
      page
        .getByRole("status")
        .getByRole("heading", { name: "Loading the product catalog…" })
    ).toBeVisible()
    await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()
  })

  test("searches every catalog field, tolerates manufacturer typos, and highlights matches", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)

    const search = page.getByRole("searchbox", {
      name: "Search the medicine catalog",
    })
    const cases = [
      { query: "alpha 10mg", product: "ALPHA 10MG", cell: 0, match: "ALPHA" },
      {
        query: "other compound",
        product: "BETA 20MG",
        cell: 1,
        match: "Other",
      },
      {
        query: "Beta Pharmacuticals",
        product: "BETA 20MG",
        cell: 2,
        match: "Beta",
      },
      { query: "2x10", product: "BETA 20MG", cell: 3, match: "2x10" },
      { query: "5.00", product: "BETA 20MG", cell: 4, match: "5" },
    ]

    for (const searchCase of cases) {
      await search.fill(searchCase.query)
      const row = page
        .locator("tbody tr")
        .filter({ hasText: searchCase.product })
      await expect(row).toHaveCount(1)
      await expect(
        row.getByRole("cell").nth(searchCase.cell).locator("mark").first()
      ).toContainText(searchCase.match)
    }
  })

  test("shows a useful no-match state and restores results when search is cleared", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)

    const search = page.getByRole("searchbox", {
      name: "Search the medicine catalog",
    })
    await search.fill("not-a-real-medicine-9472")
    await expect(
      page.getByRole("heading", { name: "No matches" })
    ).toBeVisible()
    await expect(page.locator("tbody tr")).toHaveCount(0)
    await expect(page.getByText("No products to display")).toBeVisible()

    await search.clear()
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()
  })

  test("paginates, disables boundary controls, and resets to page one after search", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)

    const previous = page.getByRole("button", { name: "Previous page" })
    const next = page.getByRole("button", { name: "Next page" })
    await expect(previous).toBeDisabled()
    await expect(next).toBeEnabled()
    await expect(page.locator("tbody tr")).toHaveCount(10)

    await next.click()
    await expect(page.getByText("2 / 2", { exact: true })).toBeVisible()
    await expect(page.locator("tbody tr")).toHaveCount(2)
    await expect(page.getByText(/Showing 11–12 of 12/)).toBeVisible()
    await expect(next).toBeDisabled()
    await expect(previous).toBeEnabled()

    await previous.click()
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible()
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await next.click()

    await page
      .getByRole("searchbox", { name: "Search the medicine catalog" })
      .fill("GAMMA 10MG")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(page.getByText("1 / 1", { exact: true })).toBeVisible()

    await page
      .getByRole("searchbox", { name: "Search the medicine catalog" })
      .clear()
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible()
    await expect(page.locator("tbody tr")).toHaveCount(10)
  })

  test("searches the two facet lists independently and cycles Manufacturer include/exclude/remove", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)
    await page.getByRole("button", { name: "Filters", exact: true }).click()

    const manufacturerSearch = page.getByRole("searchbox", {
      name: "Search Manufacturer filters",
    })
    const packagingSearch = page.getByRole("searchbox", {
      name: "Search Packaging filters",
    })
    await manufacturerSearch.fill("Beta")
    await packagingSearch.fill("2x10")

    const betaManufacturer = manufacturerOption(
      page,
      "Beta Pharmaceuticals Ltd"
    )
    const betaPackaging = packagingOption(page, "2x10")
    await expect(betaManufacturer).toBeVisible()
    await expect(betaPackaging).toBeVisible()
    await expect(manufacturerOption(page, "Acme Labs")).toHaveCount(0)
    await expect(packagingOption(page, "1x10")).toHaveCount(0)

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
      page.getByText(/Showing 1–10 of 11 matching products/)
    ).toBeVisible()
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
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "none"
    )
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(page.getByText(/Showing 1–10 of 12 products/)).toBeVisible()
  })

  test("combines independent Manufacturer and Packaging states and removes either summary", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)
    await page.getByRole("button", { name: "Filters", exact: true }).click()

    const betaManufacturer = manufacturerOption(
      page,
      "Beta Pharmaceuticals Ltd"
    )
    const betaPackaging = packagingOption(page, "2x10")
    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    await expect(page.locator("tbody tr")).toHaveCount(1)

    await betaPackaging.click()
    await expect(betaPackaging).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    await expect(page.locator("tbody tr")).toHaveCount(1)

    await betaPackaging.click()
    await expect(betaPackaging).toHaveAttribute(
      "data-selection-state",
      "exclude"
    )
    await expect(page.locator("tbody tr")).toHaveCount(0)
    await expect(page.getByText("No products to display")).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Remove Packaging: 2x10 from the excluded filters",
      })
    ).toBeVisible()

    await page
      .getByRole("button", {
        name: "Remove Packaging: 2x10 from the excluded filters",
      })
      .click()
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(betaPackaging).toHaveAttribute("data-selection-state", "none")

    await page
      .getByRole("button", {
        name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the included filters",
      })
      .click()
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(page.getByText(/Showing 1–10 of 12 products/)).toBeVisible()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "none"
    )
  })

  test("cycles Manufacturer filters by keyboard and preserves state when filters close", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)

    const filtersToggle = page.locator(
      'button[aria-controls="catalog-filters"]'
    )
    await expect(filtersToggle).toHaveAttribute("aria-expanded", "false")
    await filtersToggle.click()
    await expect(filtersToggle).toHaveAttribute("aria-expanded", "true")

    const manufacturerSearch = page.getByRole("searchbox", {
      name: "Search Manufacturer filters",
    })
    await manufacturerSearch.fill("Beta")
    const betaManufacturer = manufacturerOption(
      page,
      "Beta Pharmaceuticals Ltd"
    )
    await expect(betaManufacturer).toBeVisible()

    await betaManufacturer.focus()
    await page.keyboard.press("Enter")
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    await expect(betaManufacturer).toHaveAttribute("aria-pressed", "true")
    await expect(betaManufacturer).toHaveAttribute(
      "aria-label",
      /Current state: Include/
    )
    await expect(page.locator("tbody tr")).toHaveCount(1)

    await filtersToggle.click()
    await expect(filtersToggle).toHaveAttribute("aria-expanded", "false")
    await expect(page.locator("#catalog-filters")).toHaveCount(0)

    await filtersToggle.click()
    await expect(filtersToggle).toHaveAttribute("aria-expanded", "true")
    await expect(manufacturerSearch).toHaveValue("Beta")
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )

    await betaManufacturer.focus()
    await page.keyboard.press("Space")
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "exclude"
    )
    await expect(betaManufacturer).toHaveAttribute("aria-pressed", "true")
    await expect(betaManufacturer).toHaveAttribute(
      "aria-label",
      /Current state: Exclude/
    )
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(
      page.getByText(/Showing 1–10 of 11 matching products/)
    ).toBeVisible()

    await page.keyboard.press("Space")
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "none"
    )
    await expect(betaManufacturer).toHaveAttribute("aria-pressed", "false")
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(page.getByText(/Showing 1–10 of 12 products/)).toBeVisible()
  })

  test("virtualizes large Manufacturer facets while making distant values searchable", async ({
    page,
  }) => {
    const artifacts = largeCatalogArtifacts(500)
    await installCatalogFixtures(page, { artifacts })
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: "Quality medicines." })
    ).toBeVisible()
    await expect(page.getByText("Catalog loaded: 500 products.")).toBeVisible()
    await page.getByRole("button", { name: "Filters", exact: true }).click()

    const manufacturerGroup = page.locator("#catalog-filters fieldset").first()
    const visibleButtons = manufacturerGroup.getByRole("button")
    await expect(visibleButtons).not.toHaveCount(0)
    expect(await visibleButtons.count()).toBeLessThan(500)

    await manufacturerGroup
      .getByRole("searchbox", { name: "Search Manufacturer filters" })
      .fill("Rare Manufacturer Cobalt")
    const rareManufacturer = manufacturerOption(
      page,
      "Rare Manufacturer Cobalt"
    )
    await expect(rareManufacturer).toBeVisible()
    await rareManufacturer.click()
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(page.locator("tbody tr").first()).toContainText(
      "SCALE PRODUCT 500"
    )

    await manufacturerGroup
      .getByRole("searchbox", { name: "Search Manufacturer filters" })
      .fill("no manufacturer like this")
    await expect(
      manufacturerGroup.getByText("No matching values.")
    ).toBeVisible()
  })

  test("filters by the accessible USD range slider using keyboard controls", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)
    await page.getByRole("button", { name: "Filters", exact: true }).click()

    const minimum = page.getByRole("slider", {
      name: "Minimum price in US dollars",
    })
    const maximum = page.getByRole("slider", {
      name: "Maximum price in US dollars",
    })
    await expect(minimum).toHaveAttribute("aria-valuenow", "1")
    await expect(maximum).toHaveAttribute("aria-valuenow", "12")

    await minimum.focus()
    await minimum.press("End")
    await expect(minimum).toHaveAttribute("aria-valuenow", "12")
    await expect(page.getByText("$12.00 – $12.00")).toBeVisible()
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(page.locator("tbody tr").first()).toContainText("GAMMA 10MG")

    await page.getByRole("button", { name: "Clear filters" }).click()
    await expect(minimum).toHaveAttribute("aria-valuenow", "1")
    await expect(maximum).toHaveAttribute("aria-valuenow", "12")
    await expect(page.locator("tbody tr")).toHaveCount(10)

    await maximum.focus()
    await maximum.press("Home")
    await expect(maximum).toHaveAttribute("aria-valuenow", "1")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(page.locator("tbody tr").first()).toContainText("ALPHA 10MG")
  })

  test("Clear filters resets facets and price bounds while preserving the search query", async ({
    page,
  }) => {
    await installCatalogFixtures(page)
    await openCatalog(page)

    const search = page.getByRole("searchbox", {
      name: "Search the medicine catalog",
    })
    await search.fill("Beta Pharmacuticals")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await page.getByRole("button", { name: "Filters", exact: true }).click()

    const manufacturerSearch = page.getByRole("searchbox", {
      name: "Search Manufacturer filters",
    })
    const packagingSearch = page.getByRole("searchbox", {
      name: "Search Packaging filters",
    })
    await manufacturerSearch.fill("Beta")
    await packagingSearch.fill("1x20")
    await manufacturerOption(page, "Beta Pharmaceuticals Ltd").click()
    await packagingOption(page, "1x20").click()
    const minimum = page.getByRole("slider", {
      name: "Minimum price in US dollars",
    })
    await minimum.focus()
    await minimum.press("End")
    await expect(page.locator("tbody tr")).toHaveCount(0)

    await page.getByRole("button", { name: "Clear filters" }).click()
    await expect(search).toHaveValue("Beta Pharmacuticals")
    await expect(manufacturerSearch).toHaveValue("")
    await expect(packagingSearch).toHaveValue("")
    await expect(minimum).toHaveAttribute("aria-valuenow", "1")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(
      page.getByRole("button", {
        name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the included filters",
      })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Clear filters" })
    ).toBeDisabled()
  })

  test("shows no records when valid catalog files contain an empty products array", async ({
    page,
  }) => {
    const emptyArtifacts = new Map(defaultCatalogArtifacts)
    emptyArtifacts.set("catalog.a1b2c3.dat", {
      metadata: { minPrice: 0, maxPrice: 1 },
      products: [],
    })
    emptyArtifacts.set("manufacturers.a1b2c3.dat", {
      kind: "manufacturers",
      values: [],
    })
    emptyArtifacts.set("packaging.a1b2c3.dat", {
      kind: "packaging",
      values: [],
    })
    await installCatalogFixtures(page, { artifacts: emptyArtifacts })
    await page.goto("/")

    await expect(page.getByText("Catalog loaded: 0 products.")).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "No catalog records available" })
    ).toBeVisible()
    await expect(
      page.getByText(
        "The catalog files loaded, but they contain no product records."
      )
    ).toBeVisible()
    await expect(page.getByRole("columnheader")).toHaveCount(0)
    await expect(page.locator("tbody tr")).toHaveCount(0)
  })

  test("shows a clear load error and no rows when the catalog endpoint fails", async ({
    page,
  }) => {
    await installCatalogFixtures(page, { status: 503 })
    await page.goto("/")

    await expect(
      page.getByText("Catalog unavailable. No records are displayed.")
    ).toBeVisible()
    await expect(page.getByText(/status 503/i)).toBeVisible()
    await expect(page.getByRole("columnheader")).toHaveCount(0)
    await expect(page.locator("tbody tr")).toHaveCount(0)
  })

  test("rejects malformed dictionary data without showing preview or stale records", async ({
    page,
  }) => {
    const malformedArtifacts = new Map(defaultCatalogArtifacts)
    malformedArtifacts.set("manufacturers.a1b2c3.dat", {
      kind: "packaging",
      values: ["Acme Labs"],
    })
    await installCatalogFixtures(page, { artifacts: malformedArtifacts })
    await page.goto("/")

    await expect(
      page.getByText("Catalog unavailable. No records are displayed.")
    ).toBeVisible()
    await expect(
      page.getByText(/manufacturers catalog dictionary file is invalid/i)
    ).toBeVisible()
    await expect(page.getByRole("columnheader")).toHaveCount(0)
    await expect(page.getByText("ALPHA 10MG")).toHaveCount(0)
  })

  test("reports invalid JSON instead of rendering invented products", async ({
    page,
  }) => {
    await installCatalogFixtures(page, {
      rawBodies: new Map([["catalog.a1b2c3.dat", "{"]]),
    })
    await page.goto("/")

    await expect(
      page.getByText("Catalog unavailable. No records are displayed.")
    ).toBeVisible()
    await expect(
      page.getByText(/catalog file is not valid JSON/i)
    ).toBeVisible()
    await expect(page.getByRole("columnheader")).toHaveCount(0)
    await expect(page.getByText("ALPHA 10MG")).toHaveCount(0)
  })

  test("keeps all catalog columns reachable inside the mobile table scroller", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await installCatalogFixtures(page)
    await openCatalog(page)

    const table = page.getByRole("table")
    const scroller = table.locator("xpath=..").first()
    await expect(scroller).toHaveCSS("overflow-x", "auto")
    const dimensions = await scroller.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth)

    await scroller.evaluate((element) => {
      element.scrollLeft = element.scrollWidth
    })
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0)
    const rateHeader = page.getByRole("columnheader", { name: "RATE (USD)" })
    await rateHeader.scrollIntoViewIfNeeded()
    await expect(rateHeader).toBeInViewport()
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true)
  })

  test("has no axe-detected WCAG 2.2 A/AA violations with filters open in either theme", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light")
    })
    await installCatalogFixtures(page)
    await openCatalog(page)
    await page.getByRole("button", { name: "Filters", exact: true }).click()

    const themeToggle = page.getByRole("button", { name: "Toggle color theme" })
    for (const theme of ["light", "dark"] as const) {
      if (theme === "dark") await themeToggle.click()
      if (theme === "dark") {
        await expect(page.locator("html")).toHaveClass(/dark/)
      } else {
        await expect(page.locator("html")).not.toHaveClass(/dark/)
      }

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()

      expect(results.violations, `${theme} theme`).toEqual([])
    }
  })

  test("keeps the mobile header fixed and filter/footer colors usable in light and dark mode", async ({
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
    await expect(header).toBeVisible()
    await page.evaluate(() => {
      window.scrollTo(0, 500)
    })
    await expect
      .poll(
        async () => (await header.boundingBox())?.y ?? Number.POSITIVE_INFINITY
      )
      .toBeLessThan(20)
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true)

    const footer = page.locator("footer")
    await footer.scrollIntoViewIfNeeded()
    const lightFooterBackground = await footer.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    )
    expect(lightFooterBackground).toContain("linear-gradient")

    const themeToggle = page.getByRole("button", { name: "Toggle color theme" })
    await themeToggle.click()
    await expect(page.locator("html")).toHaveClass(/dark/)
    const darkFooterBackground = await footer.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    )
    expect(darkFooterBackground).not.toBe(lightFooterBackground)

    await page.locator("#catalog").scrollIntoViewIfNeeded()
    await page.getByRole("button", { name: "Filters", exact: true }).click()
    const betaManufacturer = manufacturerOption(
      page,
      "Beta Pharmaceuticals Ltd"
    )
    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    const darkIncludeColor = await betaManufacturer.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    )
    expect(darkIncludeColor).not.toBe("rgba(0, 0, 0, 0)")
    expect(darkIncludeColor).not.toBe("rgb(16, 35, 58)")

    await betaManufacturer.click()
    await expect(betaManufacturer).toHaveAttribute(
      "data-selection-state",
      "exclude"
    )
    await expect(betaManufacturer).toHaveClass(/bg-violet-600/)

    await themeToggle.click()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
    const lightInclude = manufacturerOption(page, "Beta Pharmaceuticals Ltd")
    await lightInclude.click()
    await expect(lightInclude).toHaveAttribute("data-selection-state", "none")
    await lightInclude.click()
    await expect(lightInclude).toHaveAttribute(
      "data-selection-state",
      "include"
    )
    const lightIncludeColor = await lightInclude.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    )
    expect(lightIncludeColor).not.toBe("rgba(0, 0, 0, 0)")
    expect(lightIncludeColor).not.toBe("rgb(255, 255, 255)")

    await lightInclude.click()
    await expect(lightInclude).toHaveAttribute(
      "data-selection-state",
      "exclude"
    )
    await expect(lightInclude).toHaveClass(/bg-violet-600/)
  })
})
