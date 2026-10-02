# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: catalog.spec.ts >> static catalog experience >> keeps the mobile header fixed and preserves filter/footer themes
- Location: e2e\catalog.spec.ts:172:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Filters' }) resolved to 2 elements:
    1) <button tabindex="0" type="button" data-slot="button" aria-expanded="false" aria-controls="catalog-filters" class="motion-safe:active:scale-0.98 inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-eve…>…</button> aka getByRole('button', { name: 'Filters', exact: true })
    2) <button disabled tabindex="0" type="button" data-disabled="" data-slot="button" class="motion-safe:active:scale-0.98 inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50…>…</button> aka getByRole('button', { name: 'Clear filters' })

Call log:
  - waiting for getByRole('button', { name: 'Filters' })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e5]:
    - link "+91 8766267499" [ref=e6] [cursor=pointer]:
      - /url: tel:+918766267499
    - link "shop@pct24x7.store" [ref=e9] [cursor=pointer]:
      - /url: mailto:shop@pct24x7.store
  - banner [ref=e14]:
    - generic [ref=e15]:
      - link "PCT24X7 home" [ref=e16] [cursor=pointer]:
        - /url: "#home"
        - generic [ref=e21]:
          - generic [ref=e22]: PCT24X7
          - generic [ref=e23]: PHARMACEUTICAL HEALTHCARE
      - generic [ref=e24]:
        - link "Chat with us" [ref=e25] [cursor=pointer]:
          - /url: https://wa.me/918766267499
        - button "Toggle color theme" [active] [ref=e27]
      - navigation "Mobile navigation" [ref=e29]:
        - link "Home" [ref=e30] [cursor=pointer]:
          - /url: "#home"
        - link "About" [ref=e31] [cursor=pointer]:
          - /url: "#about"
        - link "Catalog" [ref=e32] [cursor=pointer]:
          - /url: "#catalog"
        - link "FAQs" [ref=e33] [cursor=pointer]:
          - /url: "#faq"
        - link "Contact" [ref=e34] [cursor=pointer]:
          - /url: "#contact"
  - main [ref=e35]:
    - region "PCT24X7 healthcare" [ref=e36]:
      - generic [ref=e37]:
        - img "Medicine bottles, vials and tablets against a global healthcare backdrop." [ref=e38]
        - generic [ref=e41]:
          - generic [ref=e42]: Trusted healthcare partner since 2012
          - heading "Quality medicines. Better healthcare." [level=1] [ref=e46]: Quality medicines.Better healthcare.
          - paragraph [ref=e47]: Quality medicines support better healthcare. We provide reliable access to generic and ethical-brand products, backed by thoughtful service and international shipping from India.
          - generic [ref=e48]:
            - link "Talk to our team" [ref=e49] [cursor=pointer]:
              - /url: https://wa.me/918766267499
            - link "Explore catalog" [ref=e50] [cursor=pointer]:
              - /url: "#catalog"
          - generic "PCT24X7 service highlights" [ref=e51]:
            - generic [ref=e52]: Quality focused
            - generic [aria-hidden] [ref=e56]: ·
            - generic [ref=e57]: Worldwide shipping
        - generic [ref=e58]: Carefully sourced healthcare
      - generic [ref=e63]:
        - generic [ref=e64]:
          - generic [ref=e65]: Here for your healthcare needs
          - paragraph [ref=e66]: For product availability and orders, contact our team directly.
        - generic [ref=e67]:
          - link "WhatsApp us" [ref=e68] [cursor=pointer]:
            - /url: https://wa.me/918766267499
          - link "Email us" [ref=e69] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
    - generic [ref=e71]:
      - generic [ref=e72]:
        - generic [ref=e73]: Pharmaceutical Catalog
        - heading "Search the medicine catalog" [level=2] [ref=e75]
        - paragraph [ref=e76]: Find products by active ingredient, brand, manufacturer or pack size. Search supports partial matches and common typos.
      - generic [ref=e77]:
        - generic [ref=e78]:
          - generic [ref=e79]:
            - text: PCT24X7 product directory
            - heading "Find the right product" [level=3] [ref=e80]
            - paragraph [ref=e81]: Search across full ingredient names, product names, packaging, pricing and manufacturer details.
          - generic [ref=e87]:
            - strong [ref=e88]: 12 products
            - generic [ref=e89]: full catalog
        - generic [ref=e90]:
          - generic [ref=e91]:
            - generic [ref=e95]: Search the medicine catalog
            - searchbox "Search the medicine catalog" [ref=e96]
          - paragraph [ref=e97]: Fuzzy search checks active ingredient, product, pack size, rate and manufacturer.
          - generic [ref=e98]:
            - generic [ref=e99]:
              - button "Filters" [ref=e100]
              - button "Clear filters" [disabled]
            - link "Download full catalog" [ref=e101] [cursor=pointer]:
              - /url: https://pct247.ru/products.pdf
        - generic [ref=e102]:
          - generic [ref=e103]: "Catalog loaded: 12 products."
          - generic [ref=e105]: 12 searchable products
        - table [ref=e107]:
          - rowgroup [ref=e108]:
            - row [ref=e109]:
              - columnheader "Product Name" [ref=e110]
              - columnheader "Active Ingredient" [ref=e111]
              - columnheader "Manufacturer" [ref=e112]
              - columnheader "Packaging" [ref=e113]
              - columnheader "RATE (USD)" [ref=e114]
          - rowgroup [ref=e115]:
            - row [ref=e116]:
              - cell "ALPHA 10MG" [ref=e117]
              - cell "Example ingredient" [ref=e118]
              - cell "Acme Labs" [ref=e120]
              - cell "1x10" [ref=e121]
              - cell "$ 1.00" [ref=e123]
            - row [ref=e124]:
              - cell "BETA 20MG" [ref=e125]
              - cell "Other compound" [ref=e126]
              - cell "Beta Pharmaceuticals Ltd" [ref=e128]
              - cell "2x10" [ref=e129]
              - cell "$ 5.00" [ref=e131]
            - row [ref=e132]:
              - cell "GAMMA 01MG" [ref=e133]
              - cell "Example compound 1" [ref=e134]
              - cell "Acme Labs" [ref=e136]
              - cell "1x20" [ref=e137]
              - cell "$ 2.00" [ref=e139]
            - row [ref=e140]:
              - cell "GAMMA 02MG" [ref=e141]
              - cell "Example compound 2" [ref=e142]
              - cell "Acme Labs" [ref=e144]
              - cell "1x10" [ref=e145]
              - cell "$ 3.00" [ref=e147]
            - row [ref=e148]:
              - cell "GAMMA 03MG" [ref=e149]
              - cell "Example compound 3" [ref=e150]
              - cell "Acme Labs" [ref=e152]
              - cell "1x20" [ref=e153]
              - cell "$ 4.00" [ref=e155]
            - row [ref=e156]:
              - cell "GAMMA 04MG" [ref=e157]
              - cell "Example compound 4" [ref=e158]
              - cell "Acme Labs" [ref=e160]
              - cell "1x10" [ref=e161]
              - cell "$ 5.00" [ref=e163]
            - row [ref=e164]:
              - cell "GAMMA 05MG" [ref=e165]
              - cell "Example compound 5" [ref=e166]
              - cell "Acme Labs" [ref=e168]
              - cell "1x20" [ref=e169]
              - cell "$ 6.00" [ref=e171]
            - row [ref=e172]:
              - cell "GAMMA 06MG" [ref=e173]
              - cell "Example compound 6" [ref=e174]
              - cell "Acme Labs" [ref=e176]
              - cell "1x10" [ref=e177]
              - cell "$ 7.00" [ref=e179]
            - row [ref=e180]:
              - cell "GAMMA 07MG" [ref=e181]
              - cell "Example compound 7" [ref=e182]
              - cell "Acme Labs" [ref=e184]
              - cell "1x20" [ref=e185]
              - cell "$ 8.00" [ref=e187]
            - row [ref=e188]:
              - cell "GAMMA 08MG" [ref=e189]
              - cell "Example compound 8" [ref=e190]
              - cell "Acme Labs" [ref=e192]
              - cell "1x10" [ref=e193]
              - cell "$ 9.00" [ref=e195]
        - generic [ref=e196]:
          - paragraph [ref=e197]:
            - text: Showing
            - strong [ref=e198]: 1–10
            - text: of
            - strong [ref=e199]: "12"
            - text: products
          - generic "Catalog pagination" [ref=e200]:
            - button "Previous page" [disabled]:
              - generic: Prev
            - generic [ref=e201]: 1 / 2
            - button "Next page" [ref=e202]:
              - generic [ref=e203]: Next
      - paragraph
    - generic [ref=e205]:
      - generic [ref=e206]:
        - generic [ref=e207]: Good to know
        - heading "Frequently asked questions" [level=2] [ref=e211]
        - paragraph [ref=e212]: Find answers to common questions about our pharmaceutical catalog, products, downloads and supply.
        - link "Still have a question? Get in touch" [ref=e213] [cursor=pointer]:
          - /url: "#contact"
      - generic [ref=e217]:
        - generic [ref=e218]:
          - heading [level=3] [ref=e219]:
            - button "How can I pay?" [expanded] [ref=e220]
          - region "How can I pay?" [ref=e223]:
            - paragraph [ref=e225]: Our preferred payment methods are Bitcoin (BTC), USDT (ERC-20), USDT (TRC-20), Ethereum (ETH), and USDC (ERC-20).
        - heading [level=3] [ref=e227]:
          - button "How do you ship, and where are orders shipped from?" [ref=e228]
        - heading [level=3] [ref=e232]:
          - button "What should I do if my order is missing an item or I receive a different brand?" [ref=e233]
        - heading [level=3] [ref=e237]:
          - button "Why hasn't my tracking information been updated?" [ref=e238]
        - heading [level=3] [ref=e242]:
          - button "What is your reshipment policy?" [ref=e243]
        - heading [level=3] [ref=e247]:
          - button "What happens if a reshipment is also seized?" [ref=e248]
        - heading [level=3] [ref=e252]:
          - button "Which countries are you currently shipping to?" [ref=e253]
        - heading [level=3] [ref=e257]:
          - button "How long does processing and delivery take?" [ref=e258]
        - heading [level=3] [ref=e262]:
          - button "Is there a minimum order quantity?" [ref=e263]
        - heading [level=3] [ref=e267]:
          - button "Do I need to sign for my package?" [ref=e268]
        - heading [level=3] [ref=e272]:
          - button "Do I need to use my real name on the shipping address?" [ref=e273]
    - generic [ref=e277]:
      - generic [ref=e278]:
        - generic [ref=e279]: About PCT24X7
        - heading "Reliable healthcare supply, built on trust." [level=2] [ref=e283]
        - paragraph [ref=e284]: PCT24X7 has supplied generic medicines and ethical-brand medications from India since 2012, with a focus on reliable service, competitive pricing and international shipping.
        - generic [ref=e285]:
          - generic [ref=e286]: Quality focused
          - generic [ref=e290]: International support
      - generic "PCT24X7 service details" [ref=e296]:
        - generic [ref=e301]:
          - generic [ref=e306]: "2012"
          - generic [ref=e307]: Serving customers since
          - paragraph [ref=e309]: Thoughtful service and dependable healthcare supply.
        - generic [ref=e317]:
          - strong [ref=e318]: International shipping
          - generic [ref=e319]: USA · UK · New Zealand · Australia
    - generic [ref=e322]:
      - generic [ref=e323]:
        - generic [ref=e324]: Contact our team
        - heading "We’re here to help you find what you need." [level=2] [ref=e327]
        - paragraph [ref=e328]: For product availability and orders, reach out by WhatsApp or email. Our team is ready to assist.
        - generic [ref=e329]:
          - link "Message on WhatsApp" [ref=e330] [cursor=pointer]:
            - /url: https://wa.me/918766267499
          - link "shop@pct24x7.store" [ref=e331] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
      - generic [ref=e335]:
        - generic [ref=e340]:
          - generic [ref=e341]: Phone / WhatsApp
          - link "+91 8766267499" [ref=e342] [cursor=pointer]:
            - /url: tel:+918766267499
        - generic [ref=e348]:
          - generic [ref=e349]: Email
          - link "shop@pct24x7.store" [ref=e350] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
        - generic [ref=e356]:
          - generic [ref=e357]: Support hours
          - strong [ref=e358]: Monday – Saturday · 9:00 AM – 8:00 PM IST
    - generic [ref=e359]:
      - generic [ref=e360]:
        - generic [ref=e361]:
          - link "PCT24X7 home" [ref=e362] [cursor=pointer]:
            - /url: "#home"
            - generic [ref=e367]:
              - generic [ref=e368]: PCT24X7
              - generic [ref=e369]: PHARMACEUTICAL HEALTHCARE
          - generic [ref=e370]: Reliable Healthcare Supply
          - paragraph [ref=e371]: PCT24X7 has supplied generic medicines and ethical-brand medications from India since 2012, with a focus on reliable service, competitive pricing and international shipping.
        - navigation "Footer navigation" [ref=e372]:
          - generic [ref=e373]: Quick links
          - link "Home" [ref=e374] [cursor=pointer]:
            - /url: "#home"
          - link "About Us" [ref=e375] [cursor=pointer]:
            - /url: "#about"
          - link "Pharmaceutical Catalog" [ref=e376] [cursor=pointer]:
            - /url: "#catalog"
          - link "FAQs & Shipping Information" [ref=e377] [cursor=pointer]:
            - /url: "#faq"
          - link "Contact Us" [ref=e378] [cursor=pointer]:
            - /url: "#contact"
        - generic [ref=e379]:
          - generic [ref=e380]: Contact us
          - generic [ref=e381]:
            - generic [ref=e382]: Phone / WhatsApp
            - link "+91 8766267499" [ref=e383] [cursor=pointer]:
              - /url: tel:+918766267499
          - generic [ref=e386]:
            - generic [ref=e387]: Email
            - link "shop@pct24x7.store" [ref=e388] [cursor=pointer]:
              - /url: mailto:shop@pct24x7.store
          - generic [ref=e392]:
            - generic [ref=e393]: Support hours
            - strong [ref=e394]: Monday – Saturday · 9:00 AM – 8:00 PM IST
          - link "Responsive support" [ref=e395] [cursor=pointer]:
            - /url: https://wa.me/918766267499
      - generic [ref=e401]:
        - generic [ref=e406]:
          - strong [ref=e407]: Responsive Support
          - generic [ref=e408]: Assistance for your queries
        - generic [ref=e416]:
          - strong [ref=e417]: International Shipping
          - generic [ref=e418]: USA · UK · New Zealand · Australia
        - generic [ref=e424]:
          - strong [ref=e425]: Quality Focused
          - generic [ref=e426]: Reliable pharmaceutical supply
      - generic [ref=e427]:
        - strong [ref=e428]: Important notice
        - paragraph [ref=e429]: Information on this website is for general informational purposes only and should not replace professional medical advice. Prescription medicines should be used only under the guidance of a qualified healthcare professional.
      - generic [ref=e430]:
        - generic [ref=e431]: © 2026 PCT24X7. All rights reserved.
        - link "Contact support" [ref=e432] [cursor=pointer]:
          - /url: "#contact"
    - generic [ref=e434]:
      - button "Contact Us" [ref=e435]
      - link "Chat with us" [ref=e439] [cursor=pointer]:
        - /url: https://wa.me/918766267499
  - alert [ref=e441]
```

# Test source

```ts
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
  210 |     await page.locator("#catalog").scrollIntoViewIfNeeded()
> 211 |     await page.getByRole("button", { name: "Filters" }).click()
      |                                                         ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Filters' }) resolved to 2 elements:
  212 |     const betaManufacturer = page.getByRole("button", {
  213 |       name: /Manufacturer: Beta Pharmaceuticals Ltd/,
  214 |     })
  215 |     await betaManufacturer.click()
  216 |     await expect(betaManufacturer).toHaveAttribute(
  217 |       "data-selection-state",
  218 |       "include"
  219 |     )
  220 |     const darkIncludeColor = await betaManufacturer.evaluate(
  221 |       (element) => getComputedStyle(element).backgroundColor
  222 |     )
  223 |     expect(darkIncludeColor).not.toBe("rgba(0, 0, 0, 0)")
  224 | 
  225 |     await betaManufacturer.click()
  226 |     await expect(betaManufacturer).toHaveAttribute(
  227 |       "data-selection-state",
  228 |       "exclude"
  229 |     )
  230 |     await expect(betaManufacturer).toHaveClass(/bg-violet-600/)
  231 | 
  232 |     await themeToggle.click()
  233 |     await expect(documentElement).not.toHaveClass(/dark/)
  234 |     await betaManufacturer.click()
  235 |     await betaManufacturer.click()
  236 |     await expect(betaManufacturer).toHaveAttribute(
  237 |       "data-selection-state",
  238 |       "include"
  239 |     )
  240 |     const lightIncludeColor = await betaManufacturer.evaluate(
  241 |       (element) => getComputedStyle(element).backgroundColor
  242 |     )
  243 |     expect(lightIncludeColor).not.toBe(darkIncludeColor)
  244 | 
  245 |     await betaManufacturer.click()
  246 |     await expect(betaManufacturer).toHaveAttribute(
  247 |       "data-selection-state",
  248 |       "exclude"
  249 |     )
  250 |     await expect(betaManufacturer).toHaveClass(/bg-violet-600/)
  251 |   })
  252 | 
  253 |   test("shows a clear error and no product rows when the catalog endpoint fails", async ({
  254 |     page,
  255 |   }) => {
  256 |     await installCatalogFixtures(page, 503)
  257 |     await page.goto("/")
  258 | 
  259 |     await expect(
  260 |       page.getByText("Catalog unavailable. No records are displayed.")
  261 |     ).toBeVisible()
  262 |     await expect(page.getByText(/status 503/i)).toBeVisible()
  263 |     await expect(page.getByRole("columnheader")).toHaveCount(0)
  264 |     await expect(
  265 |       page.getByRole("row").filter({ hasText: "BETA 20MG" })
  266 |     ).toHaveCount(0)
  267 |   })
  268 | 
  269 |   test("has no axe-detected WCAG 2.2 A/AA violations with filters open", async ({
  270 |     page,
  271 |   }) => {
  272 |     await installCatalogFixtures(page)
  273 |     await openCatalog(page)
  274 |     await page.getByRole("button", { name: "Filters" }).click()
  275 | 
  276 |     const results = await new AxeBuilder({ page })
  277 |       .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
  278 |       .analyze()
  279 | 
  280 |     expect(results.violations).toEqual([])
  281 |   })
  282 | })
  283 | 
```