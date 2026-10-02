import { expect, test } from "@playwright/test"

import { installCatalogFixtures } from "./support/catalog-fixtures"

test.use({ serviceWorkers: "allow" })

test("pre-caches the app shell and reopens it with a clear offline notice", async ({
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

  const precache = await page.evaluate(async () => {
    const manifestResponse = await fetch("/precache-manifest.json")
    const manifest = (await manifestResponse.json()) as {
      version: string
      assets: string[]
    }
    const cacheNames = await caches.keys()
    return { manifest, cacheNames }
  })
  expect(precache.manifest.assets).toContain("/")
  expect(precache.manifest.assets).toContain("/offline.html")
  expect(precache.cacheNames).toContain(
    `pct-precache-${precache.manifest.version}`
  )

  await context.setOffline(true)
  await expect(
    page.getByText(
      "You're offline. Pages and catalog data already saved on this device may still be available."
    )
  ).toBeVisible()
  await page.reload()

  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()
  await expect(page.locator("#catalog")).toBeVisible()
  await expect(
    page.getByText(
      "You're offline. Pages and catalog data already saved on this device may still be available."
    )
  ).toBeVisible()
})

test("caches successful catalog responses on-device and reloads them offline", async ({
  context,
  page,
}) => {
  await installCatalogFixtures(page)
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()
  await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller))
    )
    .toBe(true)

  const cachedArtifacts = await page.evaluate(async () => {
    const cache = await caches.open("pct-catalog-data-v1")
    const files = [
      "catalog.a1b2c3.dat",
      "manufacturers.a1b2c3.dat",
      "packaging.a1b2c3.dat",
    ]
    return Promise.all(
      files.map(async (fileName) => ({
        fileName,
        cached: Boolean(
          await cache.match(
            new URL(`/__fixtures__/${fileName}`, window.location.origin)
          )
        ),
      }))
    )
  })
  expect(cachedArtifacts.every(({ cached }) => cached)).toBe(true)

  await page.unroute("**/*.dat")
  await context.setOffline(true)
  await page.reload()

  await expect(
    page.getByText(
      "You're offline. Pages and catalog data already saved on this device may still be available."
    )
  ).toBeVisible()
  await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()
  await expect(page.locator("tbody tr")).toHaveCount(10)
  await expect(page.locator("tbody tr").first()).toContainText("ALPHA 10MG")
})

test("shows and clears the offline notice as connectivity changes", async ({
  context,
  page,
}) => {
  await page.goto("/")
  const offlineNotice = page.getByText(
    "You're offline. Pages and catalog data already saved on this device may still be available."
  )
  await expect(offlineNotice).toHaveCount(0)

  await context.setOffline(true)
  await expect(offlineNotice).toBeVisible()

  await context.setOffline(false)
  await expect(offlineNotice).toHaveCount(0)
})
