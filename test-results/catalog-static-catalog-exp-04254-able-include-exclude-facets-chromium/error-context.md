# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: catalog.spec.ts >> static catalog experience >> searches manufacturer typos and combines removable include/exclude facets
- Location: e2e\catalog.spec.ts:86:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('row').filter({ hasText: 'BETA 20MG' }).locator('mark')
Expected substring: "BETA"
Error: strict mode violation: getByRole('row').filter({ hasText: 'BETA 20MG' }).locator('mark') resolved to 3 elements:
    1) <mark class="rounded-[3px] bg-amber-200 px-0.5 font-extrabold text-amber-950 dark:bg-amber-700/70 dark:text-amber-50">BETA</mark> aka getByText('BETA', { exact: true })
    2) <mark class="rounded-[3px] bg-amber-200 px-0.5 font-extrabold text-amber-950 dark:bg-amber-700/70 dark:text-amber-50">Beta</mark> aka getByText('Beta', { exact: true })
    3) <mark class="rounded-[3px] bg-amber-200 px-0.5 font-extrabold text-amber-950 dark:bg-amber-700/70 dark:text-amber-50">Pharmaceuticals</mark> aka getByText('Pharmaceuticals')

Call log:
  - Expect "toContainText" getByRole('row').filter({ hasText: 'BETA 20MG' }).locator('mark') with timeout 7500ms
  - waiting for getByRole('row').filter({ hasText: 'BETA 20MG' }).locator('mark')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - paragraph [ref=e5]: Your trusted healthcare partner since 2012
    - generic [ref=e7]:
      - link "+91 8766267499" [ref=e8] [cursor=pointer]:
        - /url: tel:+918766267499
      - link "shop@pct24x7.store" [ref=e11] [cursor=pointer]:
        - /url: mailto:shop@pct24x7.store
  - banner [ref=e16]:
    - generic [ref=e17]:
      - link "PCT24X7 home" [ref=e18] [cursor=pointer]:
        - /url: "#home"
        - generic [ref=e23]:
          - generic [ref=e24]: PCT24X7
          - generic [ref=e25]: PHARMACEUTICAL HEALTHCARE
      - navigation "Main navigation" [ref=e26]:
        - link "Home" [ref=e27] [cursor=pointer]:
          - /url: "#home"
        - link "About Us" [ref=e28] [cursor=pointer]:
          - /url: "#about"
        - link "Catalog" [ref=e29] [cursor=pointer]:
          - /url: "#catalog"
        - link "FAQs" [ref=e30] [cursor=pointer]:
          - /url: "#faq"
        - link "Contact Us" [ref=e31] [cursor=pointer]:
          - /url: "#contact"
      - generic [ref=e32]:
        - link "Chat with us" [ref=e33] [cursor=pointer]:
          - /url: https://wa.me/918766267499
        - button "Toggle color theme" [ref=e35]
  - main [ref=e37]:
    - region "PCT24X7 healthcare" [ref=e38]:
      - generic [ref=e39]:
        - img "Medicine bottles, vials and tablets against a global healthcare backdrop." [ref=e40]
        - generic [ref=e43]:
          - generic [ref=e44]: Trusted healthcare partner since 2012
          - heading "Quality medicines. Better healthcare." [level=1] [ref=e48]: Quality medicines.Better healthcare.
          - paragraph [ref=e49]: Quality medicines support better healthcare. We provide reliable access to generic and ethical-brand products, backed by thoughtful service and international shipping from India.
          - generic [ref=e50]:
            - link "Talk to our team" [ref=e51] [cursor=pointer]:
              - /url: https://wa.me/918766267499
            - link "Explore catalog" [ref=e52] [cursor=pointer]:
              - /url: "#catalog"
          - generic "PCT24X7 service highlights" [ref=e53]:
            - generic [ref=e54]: Quality focused
            - generic [aria-hidden] [ref=e58]: ·
            - generic [ref=e59]: Worldwide shipping
        - generic [ref=e60]: Carefully sourced healthcare
      - generic [ref=e65]:
        - generic [ref=e66]:
          - generic [ref=e67]: Here for your healthcare needs
          - paragraph [ref=e68]: For product availability and orders, contact our team directly.
        - generic [ref=e69]:
          - link "WhatsApp us" [ref=e70] [cursor=pointer]:
            - /url: https://wa.me/918766267499
          - link "Email us" [ref=e71] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
    - generic [ref=e73]:
      - generic [ref=e74]:
        - generic [ref=e75]: Pharmaceutical Catalog
        - heading "Search the medicine catalog" [level=2] [ref=e77]
        - paragraph [ref=e78]: Find products by active ingredient, brand, manufacturer or pack size. Search supports partial matches and common typos.
      - generic [ref=e79]:
        - generic [ref=e80]:
          - generic [ref=e81]:
            - text: PCT24X7 product directory
            - heading "Find the right product" [level=3] [ref=e82]
            - paragraph [ref=e83]: Search across full ingredient names, product names, packaging, pricing and manufacturer details.
          - generic [ref=e89]:
            - strong [ref=e90]: 12 products
            - generic [ref=e91]: full catalog
        - generic [ref=e92]:
          - generic [ref=e93]:
            - generic [ref=e97]: Search the medicine catalog
            - searchbox "Search the medicine catalog" [active] [ref=e98]: Beta Pharmacuticals
          - paragraph [ref=e99]: Fuzzy search checks active ingredient, product, pack size, rate and manufacturer.
          - generic [ref=e100]:
            - generic [ref=e101]:
              - button "Filters" [ref=e102]
              - button "Clear filters" [disabled]
            - link "Download full catalog" [ref=e103] [cursor=pointer]:
              - /url: https://pct247.ru/products.pdf
        - generic [ref=e104]:
          - generic [ref=e105]: "Catalog loaded: 12 products."
          - generic [ref=e107]: 1 matching product
        - table [ref=e109]:
          - rowgroup [ref=e110]:
            - row [ref=e111]:
              - columnheader "Product Name" [ref=e112]
              - columnheader "Active Ingredient" [ref=e113]
              - columnheader "Manufacturer" [ref=e114]
              - columnheader "Packaging" [ref=e115]
              - columnheader "RATE (USD)" [ref=e116]
          - rowgroup [ref=e117]:
            - row [ref=e118]:
              - cell [ref=e119]:
                - mark [ref=e120]: BETA
                - text: 20MG
              - cell "Other compound" [ref=e121]
              - cell [ref=e123]:
                - mark [ref=e124]: Beta
                - mark [ref=e125]: Pharmaceuticals
                - text: Ltd
              - cell "2x10" [ref=e126]
              - cell "$ 5.00" [ref=e128]
        - generic [ref=e129]:
          - paragraph [ref=e130]:
            - text: Showing
            - strong [ref=e131]: 1–1
            - text: of
            - strong [ref=e132]: "1"
            - text: matching product
          - generic "Catalog pagination" [ref=e133]:
            - button "Previous page" [disabled]:
              - generic: Prev
            - generic [ref=e134]: 1 / 1
            - button "Next page" [disabled]:
              - generic: Next
      - paragraph
    - generic [ref=e136]:
      - generic [ref=e137]:
        - generic [ref=e138]: Good to know
        - heading "Frequently asked questions" [level=2] [ref=e142]
        - paragraph [ref=e143]: Find answers to common questions about our pharmaceutical catalog, products, downloads and supply.
        - link "Still have a question? Get in touch" [ref=e144] [cursor=pointer]:
          - /url: "#contact"
      - generic [ref=e148]:
        - generic [ref=e149]:
          - heading [level=3] [ref=e150]:
            - button "How can I pay?" [expanded] [ref=e151]
          - region "How can I pay?" [ref=e154]:
            - paragraph [ref=e156]: Our preferred payment methods are Bitcoin (BTC), USDT (ERC-20), USDT (TRC-20), Ethereum (ETH), and USDC (ERC-20).
        - heading [level=3] [ref=e158]:
          - button "How do you ship, and where are orders shipped from?" [ref=e159]
        - heading [level=3] [ref=e163]:
          - button "What should I do if my order is missing an item or I receive a different brand?" [ref=e164]
        - heading [level=3] [ref=e168]:
          - button "Why hasn't my tracking information been updated?" [ref=e169]
        - heading [level=3] [ref=e173]:
          - button "What is your reshipment policy?" [ref=e174]
        - heading [level=3] [ref=e178]:
          - button "What happens if a reshipment is also seized?" [ref=e179]
        - heading [level=3] [ref=e183]:
          - button "Which countries are you currently shipping to?" [ref=e184]
        - heading [level=3] [ref=e188]:
          - button "How long does processing and delivery take?" [ref=e189]
        - heading [level=3] [ref=e193]:
          - button "Is there a minimum order quantity?" [ref=e194]
        - heading [level=3] [ref=e198]:
          - button "Do I need to sign for my package?" [ref=e199]
        - heading [level=3] [ref=e203]:
          - button "Do I need to use my real name on the shipping address?" [ref=e204]
    - generic [ref=e208]:
      - generic [ref=e209]:
        - generic [ref=e210]: About PCT24X7
        - heading "Reliable healthcare supply, built on trust." [level=2] [ref=e214]
        - paragraph [ref=e215]: PCT24X7 has supplied generic medicines and ethical-brand medications from India since 2012, with a focus on reliable service, competitive pricing and international shipping.
        - generic [ref=e216]:
          - generic [ref=e217]: Quality focused
          - generic [ref=e221]: International support
      - generic "PCT24X7 service details" [ref=e227]:
        - generic [ref=e232]:
          - generic [ref=e237]: "2012"
          - generic [ref=e238]: Serving customers since
          - paragraph [ref=e240]: Thoughtful service and dependable healthcare supply.
        - generic [ref=e248]:
          - strong [ref=e249]: International shipping
          - generic [ref=e250]: USA · UK · New Zealand · Australia
    - generic [ref=e253]:
      - generic [ref=e254]:
        - generic [ref=e255]: Contact our team
        - heading "We’re here to help you find what you need." [level=2] [ref=e258]
        - paragraph [ref=e259]: For product availability and orders, reach out by WhatsApp or email. Our team is ready to assist.
        - generic [ref=e260]:
          - link "Message on WhatsApp" [ref=e261] [cursor=pointer]:
            - /url: https://wa.me/918766267499
          - link "shop@pct24x7.store" [ref=e262] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
      - generic [ref=e266]:
        - generic [ref=e271]:
          - generic [ref=e272]: Phone / WhatsApp
          - link "+91 8766267499" [ref=e273] [cursor=pointer]:
            - /url: tel:+918766267499
        - generic [ref=e279]:
          - generic [ref=e280]: Email
          - link "shop@pct24x7.store" [ref=e281] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
        - generic [ref=e287]:
          - generic [ref=e288]: Support hours
          - strong [ref=e289]: Monday – Saturday · 9:00 AM – 8:00 PM IST
    - generic [ref=e290]:
      - generic [ref=e291]:
        - generic [ref=e292]:
          - link "PCT24X7 home" [ref=e293] [cursor=pointer]:
            - /url: "#home"
            - generic [ref=e298]:
              - generic [ref=e299]: PCT24X7
              - generic [ref=e300]: PHARMACEUTICAL HEALTHCARE
          - generic [ref=e301]: Reliable Healthcare Supply
          - paragraph [ref=e302]: PCT24X7 has supplied generic medicines and ethical-brand medications from India since 2012, with a focus on reliable service, competitive pricing and international shipping.
        - navigation "Footer navigation" [ref=e303]:
          - generic [ref=e304]: Quick links
          - link "Home" [ref=e305] [cursor=pointer]:
            - /url: "#home"
          - link "About Us" [ref=e306] [cursor=pointer]:
            - /url: "#about"
          - link "Pharmaceutical Catalog" [ref=e307] [cursor=pointer]:
            - /url: "#catalog"
          - link "FAQs & Shipping Information" [ref=e308] [cursor=pointer]:
            - /url: "#faq"
          - link "Contact Us" [ref=e309] [cursor=pointer]:
            - /url: "#contact"
        - generic [ref=e310]:
          - generic [ref=e311]: Contact us
          - generic [ref=e312]:
            - generic [ref=e313]: Phone / WhatsApp
            - link "+91 8766267499" [ref=e314] [cursor=pointer]:
              - /url: tel:+918766267499
          - generic [ref=e317]:
            - generic [ref=e318]: Email
            - link "shop@pct24x7.store" [ref=e319] [cursor=pointer]:
              - /url: mailto:shop@pct24x7.store
          - generic [ref=e323]:
            - generic [ref=e324]: Support hours
            - strong [ref=e325]: Monday – Saturday · 9:00 AM – 8:00 PM IST
          - link "Responsive support" [ref=e326] [cursor=pointer]:
            - /url: https://wa.me/918766267499
      - generic [ref=e332]:
        - generic [ref=e337]:
          - strong [ref=e338]: Responsive Support
          - generic [ref=e339]: Assistance for your queries
        - generic [ref=e347]:
          - strong [ref=e348]: International Shipping
          - generic [ref=e349]: USA · UK · New Zealand · Australia
        - generic [ref=e355]:
          - strong [ref=e356]: Quality Focused
          - generic [ref=e357]: Reliable pharmaceutical supply
      - generic [ref=e358]:
        - strong [ref=e359]: Important notice
        - paragraph [ref=e360]: Information on this website is for general informational purposes only and should not replace professional medical advice. Prescription medicines should be used only under the guidance of a qualified healthcare professional.
      - generic [ref=e361]:
        - generic [ref=e362]: © 2026 PCT24X7. All rights reserved.
        - link "Contact support" [ref=e363] [cursor=pointer]:
          - /url: "#contact"
    - generic [ref=e365]:
      - button "Contact Us" [ref=e366]
      - link "Chat with us" [ref=e370] [cursor=pointer]:
        - /url: https://wa.me/918766267499
  - alert [ref=e372]
```

# Test source

```ts
  9   |     "Product Name": "ALPHA 10MG",
  10  |     "Active Ingredient": "Example ingredient",
  11  |     Manufacturer: 0,
  12  |     Packaging: 0,
  13  |     "RATE (USD)": "1.00",
  14  |   },
  15  |   {
  16  |     "Product Name": "BETA 20MG",
  17  |     "Active Ingredient": "Other compound",
  18  |     Manufacturer: 1,
  19  |     Packaging: 1,
  20  |     "RATE (USD)": "5.00",
  21  |   },
  22  |   ...Array.from({ length: 10 }, (_, index) => ({
  23  |     "Product Name": `GAMMA ${String(index + 1).padStart(2, "0")}MG`,
  24  |     "Active Ingredient": `Example compound ${String(index + 1)}`,
  25  |     Manufacturer: 0,
  26  |     Packaging: index % 2 === 0 ? 2 : 0,
  27  |     "RATE (USD)": (index + 2).toFixed(2),
  28  |   })),
  29  | ]
  30  | 
  31  | const artifacts = new Map<string, unknown>([
  32  |   [
  33  |     "catalog.a1b2c3.dat",
  34  |     {
  35  |       metadata: { minPrice: 1, maxPrice: 12 },
  36  |       products: catalogProducts,
  37  |     },
  38  |   ],
  39  |   [
  40  |     "manufacturers.a1b2c3.dat",
  41  |     { kind: "manufacturers", values: manufacturerValues },
  42  |   ],
  43  |   ["packaging.a1b2c3.dat", { kind: "packaging", values: packagingValues }],
  44  | ])
  45  | 
  46  | async function installCatalogFixtures(page: Page, status = 200): Promise<void> {
  47  |   await page.route("**/*.dat", async (route) => {
  48  |     const fileName = new URL(route.request().url()).pathname.split("/").at(-1)
  49  |     const artifact = fileName ? artifacts.get(fileName) : undefined
  50  | 
  51  |     if (status !== 200) {
  52  |       await route.fulfill({
  53  |         body: "Fixture catalog is intentionally unavailable.",
  54  |         contentType: "text/plain",
  55  |         status,
  56  |       })
  57  |       return
  58  |     }
  59  | 
  60  |     if (artifact === undefined) {
  61  |       await route.fulfill({
  62  |         body: "Fixture artifact not found.",
  63  |         contentType: "text/plain",
  64  |         status: 404,
  65  |       })
  66  |       return
  67  |     }
  68  | 
  69  |     await route.fulfill({
  70  |       body: JSON.stringify(artifact),
  71  |       contentType: "application/json; charset=utf-8",
  72  |       status: 200,
  73  |     })
  74  |   })
  75  | }
  76  | 
  77  | async function openCatalog(page: Page): Promise<void> {
  78  |   await page.goto("/")
  79  |   await expect(
  80  |     page.getByRole("heading", { name: "Quality medicines." })
  81  |   ).toBeVisible()
  82  |   await expect(page.getByText("Catalog loaded: 12 products.")).toBeVisible()
  83  | }
  84  | 
  85  | test.describe("static catalog experience", () => {
  86  |   test("searches manufacturer typos and combines removable include/exclude facets", async ({
  87  |     page,
  88  |   }) => {
  89  |     await installCatalogFixtures(page)
  90  |     await openCatalog(page)
  91  | 
  92  |     const table = page.getByRole("table")
  93  |     await expect(table.getByRole("columnheader")).toHaveText([
  94  |       "Product Name",
  95  |       "Active Ingredient",
  96  |       "Manufacturer",
  97  |       "Packaging",
  98  |       "RATE (USD)",
  99  |     ])
  100 | 
  101 |     const search = page.getByRole("searchbox", {
  102 |       name: "Search the medicine catalog",
  103 |     })
  104 |     await search.fill("Beta Pharmacuticals")
  105 | 
  106 |     const betaRow = page.getByRole("row").filter({ hasText: "BETA 20MG" })
  107 |     await expect(betaRow).toBeVisible()
  108 |     await expect(betaRow).toContainText("Beta Pharmaceuticals Ltd")
> 109 |     await expect(betaRow.locator("mark")).toContainText("BETA")
      |                                           ^ Error: expect(locator).toContainText(expected) failed
  110 |     await expect(
  111 |       page.getByRole("row").filter({ hasText: "ALPHA 10MG" })
  112 |     ).toHaveCount(0)
  113 | 
  114 |     await search.fill("")
  115 |     await page.getByRole("button", { name: "Filters" }).click()
  116 | 
  117 |     const manufacturerSearch = page.getByRole("searchbox", {
  118 |       name: "Search Manufacturer filters",
  119 |     })
  120 |     const packagingSearch = page.getByRole("searchbox", {
  121 |       name: "Search Packaging filters",
  122 |     })
  123 |     await manufacturerSearch.fill("Beta")
  124 |     await packagingSearch.fill("2x10")
  125 | 
  126 |     const betaManufacturer = page.getByRole("button", {
  127 |       name: /Manufacturer: Beta Pharmaceuticals Ltd/,
  128 |     })
  129 |     const betaPackaging = page.getByRole("button", { name: /^Packaging: 2x10/ })
  130 |     await expect(betaManufacturer).toBeVisible()
  131 |     await expect(betaPackaging).toBeVisible()
  132 |     await expect(
  133 |       page.getByRole("button", { name: /^Packaging: 1x10/ })
  134 |     ).toHaveCount(0)
  135 | 
  136 |     await betaManufacturer.click()
  137 |     await expect(betaManufacturer).toHaveAttribute(
  138 |       "data-selection-state",
  139 |       "include"
  140 |     )
  141 |     await expect(page.locator("tbody tr")).toHaveCount(1)
  142 |     await expect(
  143 |       page.getByRole("button", {
  144 |         name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the included filters",
  145 |       })
  146 |     ).toBeVisible()
  147 | 
  148 |     await betaManufacturer.click()
  149 |     await expect(betaManufacturer).toHaveAttribute(
  150 |       "data-selection-state",
  151 |       "exclude"
  152 |     )
  153 |     await expect(page.locator("tbody tr")).toHaveCount(10)
  154 |     await expect(
  155 |       page.getByRole("button", {
  156 |         name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the excluded filters",
  157 |       })
  158 |     ).toBeVisible()
  159 | 
  160 |     await page
  161 |       .getByRole("button", {
  162 |         name: "Remove Manufacturer: Beta Pharmaceuticals Ltd from the excluded filters",
  163 |       })
  164 |       .click()
  165 |     await expect(page.locator("tbody tr")).toHaveCount(10)
  166 |     await expect(betaManufacturer).toHaveAttribute(
  167 |       "data-selection-state",
  168 |       "none"
  169 |     )
  170 |   })
  171 | 
  172 |   test("keeps the mobile header fixed and preserves filter/footer themes", async ({
  173 |     page,
  174 |   }) => {
  175 |     await page.setViewportSize({ width: 390, height: 844 })
  176 |     await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" })
  177 |     await page.addInitScript(() => {
  178 |       localStorage.setItem("theme", "light")
  179 |     })
  180 |     await installCatalogFixtures(page)
  181 |     await openCatalog(page)
  182 | 
  183 |     const header = page.getByRole("banner")
  184 |     const documentElement = page.locator("html")
  185 |     await expect(header).toBeVisible()
  186 |     await expect(documentElement).not.toHaveClass(/dark/)
  187 |     await page.evaluate(() => {
  188 |       window.scrollTo(0, 500)
  189 |     })
  190 |     await expect
  191 |       .poll(
  192 |         async () => (await header.boundingBox())?.y ?? Number.POSITIVE_INFINITY
  193 |       )
  194 |       .toBeLessThan(20)
  195 | 
  196 |     const footer = page.locator("footer")
  197 |     await footer.scrollIntoViewIfNeeded()
  198 |     const lightFooterBackground = await footer.evaluate(
  199 |       (element) => getComputedStyle(element).backgroundImage
  200 |     )
  201 | 
  202 |     const themeToggle = page.getByRole("button", { name: "Toggle color theme" })
  203 |     await themeToggle.click()
  204 |     await expect(documentElement).toHaveClass(/dark/)
  205 |     const darkFooterBackground = await footer.evaluate(
  206 |       (element) => getComputedStyle(element).backgroundImage
  207 |     )
  208 |     expect(darkFooterBackground).not.toBe(lightFooterBackground)
  209 | 
```