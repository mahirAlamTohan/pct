import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { installCatalogFixtures, openCatalog } from "./support/catalog-fixtures"

test.describe("client-side estimate drawer", () => {
  test("adds products, computes packet totals, persists changes, and never sends an order", async ({
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

    const estimateButton = page.getByRole("button", {
      name: "Estimate, 3 packets in your estimate",
    })
    await expect(estimateButton).toBeVisible()
    await estimateButton.click()
    const drawer = page.getByRole("dialog", { name: "Your estimate" })
    await expect(drawer).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
    await expect(drawer).toContainText("Total packets of 1x10")
    await expect(drawer).toContainText("Single packet price")
    await expect(drawer).toContainText("3 packets")

    const total = drawer.getByRole("complementary", { name: "Estimated total" })
    await expect(total).toContainText("$7.00")
    const alphaCard = drawer
      .locator("article")
      .filter({ has: drawer.getByRole("heading", { name: "ALPHA 10MG" }) })
    const betaCard = drawer
      .locator("article")
      .filter({ has: drawer.getByRole("heading", { name: "BETA 20MG" }) })
    await expect(alphaCard).toContainText("$2.00")
    await expect(betaCard).toContainText("$5.00")

    await betaCard
      .getByRole("button", { name: "Add one packet of BETA 20MG" })
      .click()
    await expect(total).toContainText("$12.00")
    await page.reload()
    await page
      .getByRole("button", { name: "Estimate, 4 packets in your estimate" })
      .click()
    await expect(total).toContainText("$12.00")
    await expect(betaCard.locator("output")).toHaveText("2")

    await alphaCard
      .getByRole("button", { name: "Remove ALPHA 10MG from your estimate" })
      .click()
    await expect(total).toContainText("$10.00")
    await drawer.getByRole("button", { name: "Clear estimate" }).click()
    await expect(
      drawer.getByRole("heading", { name: "Your estimate is empty" })
    ).toBeVisible()
    await expect(
      drawer.getByRole("button", { name: /pay|checkout|place order/i })
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

  test("keeps the estimate sidebar accessible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await installCatalogFixtures(page)
    await openCatalog(page)

    await page
      .locator("tbody tr")
      .filter({ hasText: "ALPHA 10MG" })
      .getByRole("button", { name: "Add ALPHA 10MG to your estimate" })
      .click()
    await page
      .getByRole("button", { name: "Estimate, 1 packet in your estimate" })
      .click()
    const drawer = page.getByRole("dialog", { name: "Your estimate" })
    await expect(drawer).toBeVisible()
    await expect(
      drawer.getByRole("complementary", { name: "Estimated total" })
    ).toContainText("$1.00")

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze()
    expect(accessibility.violations).toEqual([])
  })
})
