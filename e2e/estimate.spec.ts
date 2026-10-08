import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { installCatalogFixtures, openCatalog } from "./support/catalog-fixtures"

test.describe("client-side order estimate", () => {
  test("adds products, computes totals, persists quantities, and never sends an order", async ({
    page,
  }) => {
    const requests: { method: string; pathname: string }[] = []
    page.on("request", (request) => {
      const url = new URL(request.url())
      requests.push({ method: request.method(), pathname: url.pathname })
    })

    await installCatalogFixtures(page)
    await openCatalog(page)

    const alphaRow = page.locator("tbody tr").filter({ hasText: "ALPHA 10MG" })
    const betaRow = page.locator("tbody tr").filter({ hasText: "BETA 20MG" })
    const addAlpha = alphaRow.getByRole("button", {
      name: "Add ALPHA 10MG to your estimate",
    })
    await addAlpha.click()
    await addAlpha.click()
    await betaRow
      .getByRole("button", { name: "Add BETA 20MG to your estimate" })
      .click()

    const estimateLink = page.getByRole("link", {
      name: "Estimate, 3 items in your estimate",
    })
    await expect(estimateLink).toBeVisible()
    await estimateLink.click()
    await expect(page).toHaveURL(/\/estimate\/?$/)
    await expect(
      page.getByRole("heading", { name: "Your order estimate" })
    ).toBeVisible()

    const total = page.getByRole("complementary", { name: "Estimated total" })
    await expect(total).toContainText("$7.00")
    const alphaCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "ALPHA 10MG" }) })
    const betaCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "BETA 20MG" }) })
    await expect(alphaCard).toContainText("$2.00")
    await expect(betaCard).toContainText("$5.00")

    await betaCard
      .getByRole("button", { name: "Increase quantity for BETA 20MG" })
      .click()
    await expect(total).toContainText("$12.00")
    await page.reload()
    await expect(total).toContainText("$12.00")
    await expect(betaCard.locator("output")).toHaveText("2")

    await alphaCard
      .getByRole("button", { name: "Remove ALPHA 10MG from your estimate" })
      .click()
    await expect(total).toContainText("$10.00")
    await page.getByRole("button", { name: "Clear estimate" }).click()
    await expect(
      page.getByRole("heading", { name: "Your estimate is empty" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /pay|checkout|place order/i })
    ).toHaveCount(0)

    expect(
      requests.filter(
        ({ method, pathname }) =>
          method !== "GET" || pathname.startsWith("/api/")
      )
    ).toEqual([])
    expect(
      requests.some(({ pathname }) =>
        /ALPHA|BETA|estimate=.*product/i.test(pathname)
      )
    ).toBe(false)
  })

  test("keeps the estimate page accessible with locally stored products", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await installCatalogFixtures(page)
    await openCatalog(page)

    await page
      .locator("tbody tr")
      .filter({ hasText: "ALPHA 10MG" })
      .getByRole("button", { name: "Add ALPHA 10MG to your estimate" })
      .click()
    await page.goto("/estimate")
    await expect(page.getByText("$1.00")).toBeVisible()

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze()
    expect(accessibility.violations).toEqual([])
  })
})
