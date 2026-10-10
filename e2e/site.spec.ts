import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { siteContent } from "../src/config/content"
import { installCatalogFixtures } from "./support/catalog-fixtures"

test.beforeEach(async ({ page }) => {
  await installCatalogFixtures(page)
})

test("renders the SEO, sharing, viewport, and accessible hero metadata", async ({
  page,
}) => {
  await page.goto("/")

  await expect(page).toHaveTitle(
    /PCT24X7 \| Pharmaceutical healthcare you can trust/
  )
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /generic medicines and ethical brand medications/
  )
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /width=device-width, initial-scale=1/
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://pct.mahiralamtohan.workers.dev/"
  )
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "website"
  )
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    "content",
    "PCT24X7"
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /opengraph-image/
  )
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image"
  )
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#1f5fb5"
  )
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest"
  )
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/apple-touch-icon.png"
  )
  await expect(
    page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]')
  ).toHaveCount(0)

  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()
  const heroImage = page.getByRole("img", {
    name: "Medicine bottles, vials and tablets against a global healthcare backdrop.",
  })
  await expect(heroImage).toBeVisible()
  await expect
    .poll(() =>
      heroImage.evaluate(
        (element) =>
          element instanceof HTMLImageElement &&
          element.complete &&
          element.naturalWidth > 0
      )
    )
    .toBe(true)
})

test("serves the static site with restrictive browser security headers", async ({
  page,
}) => {
  const response = await page.goto("/")
  if (!response) throw new Error("The app shell did not return a response.")
  const headers = await response.allHeaders()
  const policy = headers["content-security-policy"] ?? ""

  expect(headers["x-content-type-options"]).toBe("nosniff")
  expect(headers["x-frame-options"]).toBe("DENY")
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  expect(headers["strict-transport-security"]).toBe("max-age=31536000")
  expect(headers["permissions-policy"]).toContain("camera=()")
  expect(policy).toContain("default-src 'self'")
  expect(policy).toContain("object-src 'none'")
  expect(policy).toContain("frame-ancestors 'none'")
  expect(policy).toContain("form-action 'self'")
  expect(policy).toContain("connect-src 'self'")
  expect(policy).toContain("worker-src 'self'")
  const scriptSource = policy
    .split(";")
    .map((rule) => rule.trim())
    .find((rule) => rule.startsWith("script-src "))
  expect(scriptSource).toBeDefined()
  expect(scriptSource).not.toContain("'unsafe-inline'")
  expect(scriptSource).not.toContain("'unsafe-eval'")
})

test("keeps page requests same-origin without loading third-party resources", async ({
  page,
}) => {
  const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)
  const localOrigin = `http://127.0.0.1:${port.toString()}`
  const thirdPartyOrigins = new Set<string>()
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== localOrigin
    ) {
      thirdPartyOrigins.add(url.origin)
    }
  })

  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Quality medicines." })
  ).toBeVisible()
  await page.locator("#faq").scrollIntoViewIfNeeded()
  await page.locator("#about").scrollIntoViewIfNeeded()

  expect([...thirdPartyOrigins]).toEqual([])
})

test("navigates to each section with desktop and mobile menus", async ({
  page,
}) => {
  await page.goto("/")

  const desktopNavigation = page.getByRole("navigation", {
    name: "Main navigation",
  })
  for (const [label, section] of [
    ["Home", "home"],
    ["About Us", "about"],
    ["Catalog", "catalog"],
    ["FAQs", "faq"],
    ["Contact Us", "contact"],
  ]) {
    await desktopNavigation
      .getByRole("link", { name: label, exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe(`#${section}`)
    await expect(page.locator(`#${section}`)).toBeVisible()
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const mobileNavigation = page.getByRole("navigation", {
    name: "Mobile navigation",
  })
  await expect(mobileNavigation).toBeVisible()
  await mobileNavigation
    .getByRole("link", { name: "Catalog", exact: true })
    .click()
  await expect(page).toHaveURL(/#catalog$/)
  await expect(page.locator("#catalog")).toBeInViewport()
})

test("switches navigation at phone, tablet, and desktop breakpoints without page overflow", async ({
  page,
}) => {
  await page.goto("/")

  const desktopNavigation = page.getByRole("navigation", {
    name: "Main navigation",
  })
  const mobileNavigation = page.getByRole("navigation", {
    name: "Mobile navigation",
  })

  for (const width of [320, 360, 390, 767, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    if (width < 768) {
      await expect(mobileNavigation).toBeVisible()
      await expect(desktopNavigation).toBeHidden()
    } else {
      await expect(desktopNavigation).toBeVisible()
      await expect(mobileNavigation).toBeHidden()
    }
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true)
  }
})

test("keeps the header fixed and animates it into its floating state on scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  const header = page.getByRole("banner")
  await expect(header).toBeVisible()
  await expect
    .poll(() =>
      header.evaluate((element) => getComputedStyle(element).position)
    )
    .toBe("fixed")
  const initialBox = await header.boundingBox()
  expect(initialBox).not.toBeNull()
  expect(initialBox?.x).toBeLessThan(2)

  await page.evaluate(() => {
    window.scrollTo(0, 600)
  })
  await expect
    .poll(async () => (await header.boundingBox())?.x ?? 0)
    .toBeGreaterThan(10)
  const floatingBox = await header.boundingBox()
  expect(floatingBox).not.toBeNull()
  expect(floatingBox?.width).toBeLessThan(initialBox?.width ?? 0)
  await expect
    .poll(
      async () => (await header.boundingBox())?.y ?? Number.POSITIVE_INFINITY
    )
    .toBeLessThan(20)
})

test("follows system theme until the user selects a theme, then persists it", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")

  const root = page.locator("html")
  const themeToggle = page.getByRole("button", { name: "Toggle color theme" })
  await expect(root).toHaveClass(/dark/)

  await themeToggle.click()
  await expect(root).not.toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("light")

  await page.reload()
  await expect(root).not.toHaveClass(/dark/)
  await themeToggle.click()
  await expect(root).toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("dark")
})

test("renders the configured About story and service regions", async ({
  page,
}) => {
  await page.goto("/")

  const about = page.locator("#about")
  await expect(
    about.getByRole("heading", {
      name: "Reliable healthcare supply, built on trust.",
    })
  ).toBeVisible()
  await expect(
    about.getByText(/PCT24X7 has supplied generic medicines.*since 2012/)
  ).toBeVisible()
  await expect(about.getByText("Serving customers since")).toBeVisible()
  await expect(
    about.getByText("International shipping", { exact: true })
  ).toBeVisible()
  await expect(
    about.getByText("USA · UK · New Zealand · Australia")
  ).toBeVisible()
})

test("provides working payment and shipping FAQ accordion controls", async ({
  page,
}) => {
  await page.goto("/")

  const paymentQuestion = page.getByRole("button", {
    name: "How can I pay?",
    exact: true,
  })
  const shippingQuestion = page.getByRole("button", {
    name: "How do you ship, and where are orders shipped from?",
    exact: true,
  })
  await expect(paymentQuestion).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByText(/Bitcoin \(BTC\), USDT \(ERC-20\)/)).toBeVisible()

  await paymentQuestion.focus()
  await page.keyboard.press("Space")
  await expect(paymentQuestion).toHaveAttribute("aria-expanded", "false")
  await shippingQuestion.focus()
  await page.keyboard.press("Enter")
  await expect(shippingQuestion).toHaveAttribute("aria-expanded", "true")
  await expect(
    page.getByText(/Packages are dispatched from India/)
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: /Still have a question/ })
  ).toHaveAttribute("href", "#contact")
})

test("passes mobile WCAG 2.2 A/AA audits with contact actions expanded", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" })
  await page.addInitScript(() => {
    localStorage.setItem("theme", "light")
  })
  await page.goto("/")
  await page.locator('button[aria-controls="floating-contact-options"]').click()
  await expect(
    page.getByRole("region", { name: "Contact options" })
  ).toBeVisible()

  const themeToggle = page.getByRole("button", { name: "Toggle color theme" })
  for (const theme of ["light", "dark"] as const) {
    if (theme === "dark") await themeToggle.click()
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze()
    expect(results.violations, `${theme} mobile theme`).toEqual([])
  }
})

test("renders every configured FAQ answer and supports keyboard toggling", async ({
  page,
}) => {
  await page.goto("/")

  const faq = page.locator("#faq")
  const questions = faq.getByRole("button")
  await expect(questions).toHaveCount(siteContent.faq.items.length)
  await expect(questions.first()).toHaveAttribute("aria-expanded", "true")

  for (const item of siteContent.faq.items) {
    const question = faq.getByRole("button", {
      name: item.question,
      exact: true,
    })
    if ((await question.getAttribute("aria-expanded")) === "true") {
      await question.focus()
      await page.keyboard.press("Space")
      await expect(question).toHaveAttribute("aria-expanded", "false")
    }

    await question.focus()
    await page.keyboard.press("Enter")
    await expect(question).toHaveAttribute("aria-expanded", "true")
    await expect(faq.getByText(item.answer, { exact: true })).toBeVisible()

    await page.keyboard.press("Space")
    await expect(question).toHaveAttribute("aria-expanded", "false")
  }
})

test("opens, dismisses, and exposes configured floating contact actions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  const toggle = page.locator(
    'button[aria-controls="floating-contact-options"]'
  )
  await expect(toggle).toHaveAttribute("aria-label", "Contact Us")
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  await toggle.click()

  const panel = page.getByRole("region", { name: "Contact options" })
  await expect(toggle).toHaveAttribute("aria-label", "Close contact options")
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(panel).toBeVisible()
  await expect(panel.getByRole("link", { name: /Call Us/ })).toHaveAttribute(
    "href",
    "tel:+12025550100"
  )
  await expect(panel.getByRole("link", { name: /Email Us/ })).toHaveAttribute(
    "href",
    "mailto:support@example.test"
  )
  await expect(panel.getByRole("link", { name: "Contact Us" })).toHaveAttribute(
    "href",
    "#contact"
  )

  await page.keyboard.press("Escape")
  await expect(toggle).toHaveAttribute("aria-label", "Contact Us")
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  await expect(panel).toHaveCount(0)

  await toggle.click()
  await panel.getByRole("button", { name: "Close contact options" }).click()
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  await expect(panel).toHaveCount(0)
})

test("uses configured call, email, WhatsApp, and support-hours destinations", async ({
  page,
}) => {
  await page.goto("/")

  const phoneLinks = page.getByRole("link", {
    name: "+1-202-555-0100",
    exact: true,
  })
  const emailLinks = page.getByRole("link", {
    name: "support@example.test",
    exact: true,
  })
  await expect(phoneLinks.first()).toHaveAttribute("href", "tel:+12025550100")
  await expect(emailLinks.first()).toHaveAttribute(
    "href",
    "mailto:support@example.test"
  )

  const heroWhatsApp = page.getByRole("link", { name: /Talk to our team/ })
  await expect(heroWhatsApp).toHaveAttribute(
    "href",
    "https://wa.me/12025550100"
  )
  await expect(heroWhatsApp).toHaveAttribute("target", "_blank")
  await expect(heroWhatsApp).toHaveAttribute("rel", /noreferrer/)
  await expect(
    page.getByRole("link", { name: /Explore catalog/ })
  ).toHaveAttribute("href", "#catalog")

  const contact = page.locator("#contact")
  const contactWhatsApp = contact.getByRole("link", {
    name: "Message on WhatsApp",
  })
  await expect(contactWhatsApp).toHaveAttribute(
    "href",
    "https://wa.me/12025550100"
  )
  await expect(contactWhatsApp).toHaveAttribute("target", "_blank")
  await expect(contactWhatsApp).toHaveAttribute("rel", /noreferrer/)
  const contactEmailLinks = contact.getByRole("link", {
    name: "support@example.test",
    exact: true,
  })
  await expect(contactEmailLinks).toHaveCount(2)
  await expect(contactEmailLinks.nth(0)).toHaveAttribute(
    "href",
    "mailto:support@example.test"
  )
  await expect(contactEmailLinks.nth(1)).toHaveAttribute(
    "href",
    "mailto:support@example.test"
  )
  await expect(
    contact.getByRole("link", { name: "+1-202-555-0100", exact: true })
  ).toHaveAttribute("href", "tel:+12025550100")
  await expect(contact.getByText("Weekdays, 09:00–17:00 UTC")).toBeVisible()
})

test("renders the PWA manifest, icons, catalog shortcut, and rich footer", async ({
  page,
}) => {
  await page.goto("/")

  const manifestResponse = await page.request.get(
    new URL("/manifest.webmanifest", page.url()).toString()
  )
  expect(manifestResponse.ok()).toBe(true)
  const manifest = (await manifestResponse.json()) as {
    name: string
    short_name: string
    start_url: string
    scope: string
    display: string
    theme_color: string
    background_color: string
    shortcuts: { url: string }[]
    icons: { src: string; sizes: string; purpose?: string }[]
  }
  expect(manifest.name).toBe("PCT24X7")
  expect(manifest.short_name).toBe("PCT24X7")
  expect(manifest.start_url).toBe("/")
  expect(manifest.scope).toBe("/")
  expect(manifest.display).toBe("standalone")
  expect(manifest.theme_color).toBe("#1f5fb5")
  expect(manifest.background_color).toBe("#f2f7fd")
  expect(manifest.shortcuts).toContainEqual(
    expect.objectContaining({ url: "/#catalog" })
  )
  expect(manifest.icons.map(({ sizes }) => sizes)).toContain("192x192")
  expect(manifest.icons.map(({ sizes }) => sizes)).toContain("512x512")
  expect(manifest.icons).toContainEqual(
    expect.objectContaining({ sizes: "512x512", purpose: "maskable" })
  )
  for (const icon of manifest.icons) {
    const response = await page.request.get(
      new URL(icon.src, page.url()).toString()
    )
    expect(response.ok(), `${icon.src} should be available`).toBe(true)
  }

  const footer = page.locator("footer")
  const footerNavigation = footer.getByRole("navigation", {
    name: "Footer navigation",
  })
  await expect(footerNavigation).toBeVisible()
  await expect(footerNavigation.getByRole("link")).toHaveCount(5)
  for (const link of await footerNavigation.getByRole("link").all()) {
    const href = await link.getAttribute("href")
    if (!href?.startsWith("#"))
      throw new Error("Footer link is not an in-page anchor.")
    await expect(page.locator(href)).toHaveCount(1)
  }
  await expect(
    footer.getByRole("link", { name: "Contact support" })
  ).toHaveAttribute("href", "#contact")
  await expect(footer.getByText("Important notice")).toBeVisible()
  await expect(footer.getByText(/professional medical advice/)).toBeVisible()
  await expect(footer.getByText(/© \d{4} PCT24X7/)).toBeVisible()
  const footerStyles = await footer.evaluate((element) => {
    const styles = getComputedStyle(element)
    return {
      backgroundColor: styles.backgroundColor,
      backgroundImage: styles.backgroundImage,
    }
  })
  expect(footerStyles.backgroundImage).toContain("linear-gradient")
  expect(footerStyles.backgroundColor).not.toBe("rgb(255, 255, 255)")
})
