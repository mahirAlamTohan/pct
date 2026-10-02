# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: catalog.spec.ts >> static catalog experience >> has no axe-detected WCAG 2.2 A/AA violations with filters open
- Location: e2e\catalog.spec.ts:269:3

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
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - paragraph [ref=e4]: Your trusted healthcare partner since 2012
    - generic [ref=e6]:
      - link "+91 8766267499" [ref=e7] [cursor=pointer]:
        - /url: tel:+918766267499
      - link "shop@pct24x7.store" [ref=e10] [cursor=pointer]:
        - /url: mailto:shop@pct24x7.store
  - banner [ref=e15]:
    - generic [ref=e16]:
      - link "PCT24X7 home" [ref=e17] [cursor=pointer]:
        - /url: "#home"
        - generic [ref=e22]:
          - generic [ref=e23]: PCT24X7
          - generic [ref=e24]: PHARMACEUTICAL HEALTHCARE
      - navigation "Main navigation" [ref=e25]:
        - link "Home" [ref=e26] [cursor=pointer]:
          - /url: "#home"
        - link "About Us" [ref=e27] [cursor=pointer]:
          - /url: "#about"
        - link "Catalog" [ref=e28] [cursor=pointer]:
          - /url: "#catalog"
        - link "FAQs" [ref=e29] [cursor=pointer]:
          - /url: "#faq"
        - link "Contact Us" [ref=e30] [cursor=pointer]:
          - /url: "#contact"
      - generic [ref=e31]:
        - link "Chat with us" [ref=e32] [cursor=pointer]:
          - /url: https://wa.me/918766267499
        - button "Toggle color theme" [ref=e34]
  - main [ref=e36]:
    - region "PCT24X7 healthcare" [ref=e37]:
      - generic [ref=e38]:
        - img "Medicine bottles, vials and tablets against a global healthcare backdrop." [ref=e39]
        - generic [ref=e42]:
          - generic [ref=e43]: Trusted healthcare partner since 2012
          - heading "Quality medicines. Better healthcare." [level=1] [ref=e47]: Quality medicines.Better healthcare.
          - paragraph [ref=e48]: Quality medicines support better healthcare. We provide reliable access to generic and ethical-brand products, backed by thoughtful service and international shipping from India.
          - generic [ref=e49]:
            - link "Talk to our team" [ref=e50] [cursor=pointer]:
              - /url: https://wa.me/918766267499
            - link "Explore catalog" [ref=e51] [cursor=pointer]:
              - /url: "#catalog"
          - generic "PCT24X7 service highlights" [ref=e52]:
            - generic [ref=e53]: Quality focused
            - generic [aria-hidden] [ref=e57]: ·
            - generic [ref=e58]: Worldwide shipping
        - generic [ref=e59]: Carefully sourced healthcare
      - generic [ref=e64]:
        - generic [ref=e65]:
          - generic [ref=e66]: Here for your healthcare needs
          - paragraph [ref=e67]: For product availability and orders, contact our team directly.
        - generic [ref=e68]:
          - link "WhatsApp us" [ref=e69] [cursor=pointer]:
            - /url: https://wa.me/918766267499
          - link "Email us" [ref=e70] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
    - generic [ref=e72]:
      - generic [ref=e73]:
        - generic [ref=e74]: Pharmaceutical Catalog
        - heading "Search the medicine catalog" [level=2] [ref=e76]
        - paragraph [ref=e77]: Find products by active ingredient, brand, manufacturer or pack size. Search supports partial matches and common typos.
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - text: PCT24X7 product directory
            - heading "Find the right product" [level=3] [ref=e81]
            - paragraph [ref=e82]: Search across full ingredient names, product names, packaging, pricing and manufacturer details.
          - generic [ref=e88]:
            - strong [ref=e89]: 12 products
            - generic [ref=e90]: full catalog
        - generic [ref=e91]:
          - generic [ref=e92]:
            - generic [ref=e96]: Search the medicine catalog
            - searchbox "Search the medicine catalog" [ref=e97]
          - paragraph [ref=e98]: Fuzzy search checks active ingredient, product, pack size, rate and manufacturer.
          - generic [ref=e99]:
            - generic [ref=e100]:
              - button "Filters" [ref=e101]
              - button "Clear filters" [disabled]
            - link "Download full catalog" [ref=e102] [cursor=pointer]:
              - /url: https://pct247.ru/products.pdf
        - generic [ref=e103]:
          - generic [ref=e104]: "Catalog loaded: 12 products."
          - generic [ref=e106]: 12 searchable products
        - table [ref=e108]:
          - rowgroup [ref=e109]:
            - row [ref=e110]:
              - columnheader "Product Name" [ref=e111]
              - columnheader "Active Ingredient" [ref=e112]
              - columnheader "Manufacturer" [ref=e113]
              - columnheader "Packaging" [ref=e114]
              - columnheader "RATE (USD)" [ref=e115]
          - rowgroup [ref=e116]:
            - row [ref=e117]:
              - cell "ALPHA 10MG" [ref=e118]
              - cell "Example ingredient" [ref=e119]
              - cell "Acme Labs" [ref=e121]
              - cell "1x10" [ref=e122]
              - cell "$ 1.00" [ref=e124]
            - row [ref=e125]:
              - cell "BETA 20MG" [ref=e126]
              - cell "Other compound" [ref=e127]
              - cell "Beta Pharmaceuticals Ltd" [ref=e129]
              - cell "2x10" [ref=e130]
              - cell "$ 5.00" [ref=e132]
            - row [ref=e133]:
              - cell "GAMMA 01MG" [ref=e134]
              - cell "Example compound 1" [ref=e135]
              - cell "Acme Labs" [ref=e137]
              - cell "1x20" [ref=e138]
              - cell "$ 2.00" [ref=e140]
            - row [ref=e141]:
              - cell "GAMMA 02MG" [ref=e142]
              - cell "Example compound 2" [ref=e143]
              - cell "Acme Labs" [ref=e145]
              - cell "1x10" [ref=e146]
              - cell "$ 3.00" [ref=e148]
            - row [ref=e149]:
              - cell "GAMMA 03MG" [ref=e150]
              - cell "Example compound 3" [ref=e151]
              - cell "Acme Labs" [ref=e153]
              - cell "1x20" [ref=e154]
              - cell "$ 4.00" [ref=e156]
            - row [ref=e157]:
              - cell "GAMMA 04MG" [ref=e158]
              - cell "Example compound 4" [ref=e159]
              - cell "Acme Labs" [ref=e161]
              - cell "1x10" [ref=e162]
              - cell "$ 5.00" [ref=e164]
            - row [ref=e165]:
              - cell "GAMMA 05MG" [ref=e166]
              - cell "Example compound 5" [ref=e167]
              - cell "Acme Labs" [ref=e169]
              - cell "1x20" [ref=e170]
              - cell "$ 6.00" [ref=e172]
            - row [ref=e173]:
              - cell "GAMMA 06MG" [ref=e174]
              - cell "Example compound 6" [ref=e175]
              - cell "Acme Labs" [ref=e177]
              - cell "1x10" [ref=e178]
              - cell "$ 7.00" [ref=e180]
            - row [ref=e181]:
              - cell "GAMMA 07MG" [ref=e182]
              - cell "Example compound 7" [ref=e183]
              - cell "Acme Labs" [ref=e185]
              - cell "1x20" [ref=e186]
              - cell "$ 8.00" [ref=e188]
            - row [ref=e189]:
              - cell "GAMMA 08MG" [ref=e190]
              - cell "Example compound 8" [ref=e191]
              - cell "Acme Labs" [ref=e193]
              - cell "1x10" [ref=e194]
              - cell "$ 9.00" [ref=e196]
        - generic [ref=e197]:
          - paragraph [ref=e198]:
            - text: Showing
            - strong [ref=e199]: 1–10
            - text: of
            - strong [ref=e200]: "12"
            - text: products
          - generic "Catalog pagination" [ref=e201]:
            - button "Previous page" [disabled]:
              - generic: Prev
            - generic [ref=e202]: 1 / 2
            - button "Next page" [ref=e203]:
              - generic [ref=e204]: Next
      - paragraph
    - generic [ref=e206]:
      - generic [ref=e207]:
        - generic [ref=e208]: Good to know
        - heading "Frequently asked questions" [level=2] [ref=e212]
        - paragraph [ref=e213]: Find answers to common questions about our pharmaceutical catalog, products, downloads and supply.
        - link "Still have a question? Get in touch" [ref=e214] [cursor=pointer]:
          - /url: "#contact"
      - generic [ref=e218]:
        - generic [ref=e219]:
          - heading [level=3] [ref=e220]:
            - button "How can I pay?" [expanded] [ref=e221]
          - region "How can I pay?" [ref=e224]:
            - paragraph [ref=e226]: Our preferred payment methods are Bitcoin (BTC), USDT (ERC-20), USDT (TRC-20), Ethereum (ETH), and USDC (ERC-20).
        - heading [level=3] [ref=e228]:
          - button "How do you ship, and where are orders shipped from?" [ref=e229]
        - heading [level=3] [ref=e233]:
          - button "What should I do if my order is missing an item or I receive a different brand?" [ref=e234]
        - heading [level=3] [ref=e238]:
          - button "Why hasn't my tracking information been updated?" [ref=e239]
        - heading [level=3] [ref=e243]:
          - button "What is your reshipment policy?" [ref=e244]
        - heading [level=3] [ref=e248]:
          - button "What happens if a reshipment is also seized?" [ref=e249]
        - heading [level=3] [ref=e253]:
          - button "Which countries are you currently shipping to?" [ref=e254]
        - heading [level=3] [ref=e258]:
          - button "How long does processing and delivery take?" [ref=e259]
        - heading [level=3] [ref=e263]:
          - button "Is there a minimum order quantity?" [ref=e264]
        - heading [level=3] [ref=e268]:
          - button "Do I need to sign for my package?" [ref=e269]
        - heading [level=3] [ref=e273]:
          - button "Do I need to use my real name on the shipping address?" [ref=e274]
    - generic [ref=e278]:
      - generic [ref=e279]:
        - generic [ref=e280]: About PCT24X7
        - heading "Reliable healthcare supply, built on trust." [level=2] [ref=e284]
        - paragraph [ref=e285]: PCT24X7 has supplied generic medicines and ethical-brand medications from India since 2012, with a focus on reliable service, competitive pricing and international shipping.
        - generic [ref=e286]:
          - generic [ref=e287]: Quality focused
          - generic [ref=e291]: International support
      - generic "PCT24X7 service details" [ref=e297]:
        - generic [ref=e302]:
          - generic [ref=e307]: "2012"
          - generic [ref=e308]: Serving customers since
          - paragraph [ref=e310]: Thoughtful service and dependable healthcare supply.
        - generic [ref=e318]:
          - strong [ref=e319]: International shipping
          - generic [ref=e320]: USA · UK · New Zealand · Australia
    - generic [ref=e323]:
      - generic [ref=e324]:
        - generic [ref=e325]: Contact our team
        - heading "We’re here to help you find what you need." [level=2] [ref=e328]
        - paragraph [ref=e329]: For product availability and orders, reach out by WhatsApp or email. Our team is ready to assist.
        - generic [ref=e330]:
          - link "Message on WhatsApp" [ref=e331] [cursor=pointer]:
            - /url: https://wa.me/918766267499
          - link "shop@pct24x7.store" [ref=e332] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
      - generic [ref=e336]:
        - generic [ref=e341]:
          - generic [ref=e342]: Phone / WhatsApp
          - link "+91 8766267499" [ref=e343] [cursor=pointer]:
            - /url: tel:+918766267499
        - generic [ref=e349]:
          - generic [ref=e350]: Email
          - link "shop@pct24x7.store" [ref=e351] [cursor=pointer]:
            - /url: mailto:shop@pct24x7.store
        - generic [ref=e357]:
          - generic [ref=e358]: Support hours
          - strong [ref=e359]: Monday – Saturday · 9:00 AM – 8:00 PM IST
    - generic [ref=e360]:
      - generic [ref=e361]:
        - generic [ref=e362]:
          - link "PCT24X7 home" [ref=e363] [cursor=pointer]:
            - /url: "#home"
            - generic [ref=e368]:
              - generic [ref=e369]: PCT24X7
              - generic [ref=e370]: PHARMACEUTICAL HEALTHCARE
          - generic [ref=e371]: Reliable Healthcare Supply
          - paragraph [ref=e372]: PCT24X7 has supplied generic medicines and ethical-brand medications from India since 2012, with a focus on reliable service, competitive pricing and international shipping.
        - navigation "Footer navigation" [ref=e373]:
          - generic [ref=e374]: Quick links
          - link "Home" [ref=e375] [cursor=pointer]:
            - /url: "#home"
          - link "About Us" [ref=e376] [cursor=pointer]:
            - /url: "#about"
          - link "Pharmaceutical Catalog" [ref=e377] [cursor=pointer]:
            - /url: "#catalog"
          - link "FAQs & Shipping Information" [ref=e378] [cursor=pointer]:
            - /url: "#faq"
          - link "Contact Us" [ref=e379] [cursor=pointer]:
            - /url: "#contact"
        - generic [ref=e380]:
          - generic [ref=e381]: Contact us
          - generic [ref=e382]:
            - generic [ref=e383]: Phone / WhatsApp
            - link "+91 8766267499" [ref=e384] [cursor=pointer]:
              - /url: tel:+918766267499
          - generic [ref=e387]:
            - generic [ref=e388]: Email
            - link "shop@pct24x7.store" [ref=e389] [cursor=pointer]:
              - /url: mailto:shop@pct24x7.store
          - generic [ref=e393]:
            - generic [ref=e394]: Support hours
            - strong [ref=e395]: Monday – Saturday · 9:00 AM – 8:00 PM IST
          - link "Responsive support" [ref=e396] [cursor=pointer]:
            - /url: https://wa.me/918766267499
      - generic [ref=e402]:
        - generic [ref=e407]:
          - strong [ref=e408]: Responsive Support
          - generic [ref=e409]: Assistance for your queries
        - generic [ref=e417]:
          - strong [ref=e418]: International Shipping
          - generic [ref=e419]: USA · UK · New Zealand · Australia
        - generic [ref=e425]:
          - strong [ref=e426]: Quality Focused
          - generic [ref=e427]: Reliable pharmaceutical supply
      - generic [ref=e428]:
        - strong [ref=e429]: Important notice
        - paragraph [ref=e430]: Information on this website is for general informational purposes only and should not replace professional medical advice. Prescription medicines should be used only under the guidance of a qualified healthcare professional.
      - generic [ref=e431]:
        - generic [ref=e432]: © 2026 PCT24X7. All rights reserved.
        - link "Contact support" [ref=e433] [cursor=pointer]:
          - /url: "#contact"
    - generic [ref=e435]:
      - button "Contact Us" [ref=e436]
      - link "Chat with us" [ref=e440] [cursor=pointer]:
        - /url: https://wa.me/918766267499
  - alert [ref=e442]
```

# Test source

```ts
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
  211 |     await page.getByRole("button", { name: "Filters" }).click()
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
> 274 |     await page.getByRole("button", { name: "Filters" }).click()
      |                                                         ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Filters' }) resolved to 2 elements:
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