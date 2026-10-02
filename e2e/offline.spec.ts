import { expect, test } from "@playwright/test"

test.use({ serviceWorkers: "allow" })

test("reopens the saved app shell without a network connection", async ({
  context,
  page,
}) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller))
    )
    .toBe(true)

  await context.setOffline(true)
  await page.reload()

  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()
  await expect(page.locator("#catalog")).toBeVisible()
})
