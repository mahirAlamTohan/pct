# PCT24X7

A responsive pharmaceutical catalog site built with Next.js App Router, React, TypeScript, Tailwind CSS v4, Base UI/shadcn-style components, Motion and MiniSearch.

## Development

Copy the public configuration template, then install and run the app:

```powershell
Copy-Item .env.example .env
bun install
bun run dev
```

Useful checks:

```bash
bun run typecheck
bun run lint
bun run build
```

## UI, theme and configuration

- Tailwind CSS v4 is the styling foundation. `components.json` is configured for shadcn's Base UI primitives; the project does not use Radix UI.
- Accessible Button and Accordion primitives live in `src/components/ui`. Links that look like buttons remain native anchors for correct link semantics.
- Shared light/dark colors, radii and elevation tokens live in the `:root` and `.dark` blocks in `src/styles/main.css`. Components use Tailwind utilities; the stylesheet is limited to tokens, global foundations and reduced-motion behavior.
- Manrope and DM Sans are self-hosted through `next/font/local` in `src/app/layout.tsx`; there are no external Google Fonts links or build-time font network requests. Their OFL licenses are included alongside the WOFF2 files in `src/fonts`.
- Environment-backed site/business settings live in `src/config/site.ts`; FAQ and page copy live in `src/config/content.ts`. Shared data and content types live in `src/types`.
- Set public site values in `.env` and in the deployment environment. `NEXT_PUBLIC_*` values are embedded in the static JavaScript bundle, so they are visible to visitors and require a rebuild after changes.

Example public contact settings:

```dotenv
NEXT_PUBLIC_SITE_NAME=PCT24X7
NEXT_PUBLIC_CONTACT_PHONE=+91 8766267499
NEXT_PUBLIC_WHATSAPP_NUMBER=918766267499
NEXT_PUBLIC_CONTACT_EMAIL=shop@pct24x7.store
NEXT_PUBLIC_SUPPORT_HOURS=Monday – Saturday · 9:00 AM – 8:00 PM IST
NEXT_PUBLIC_CATALOG_PDF_URL=https://pct247.ru/products.pdf
```

`NEXT_PUBLIC_WHATSAPP_NUMBER` should contain digits only, including the country code. The contact details are intentionally public; do not put secrets in `NEXT_PUBLIC_*` variables.

## Site features

- Full-bleed, responsive healthcare hero with an optimized WebP visual and live HTML headline text
- Floating header that stays visible while scrolling with spring-driven width and position transitions, smooth anchor navigation and reduced-motion support
- Floating WhatsApp chat and animated Contact Us panel with call, email and contact-section actions
- Persistent light/dark mode and an accessible Base UI FAQ accordion
- Fuzzy, prefix-enabled browser search with highlighting, manufacturer display, pagination and derived serial numbers
- Metadata-driven USD price-range slider with a safe $0–$1,000 fallback when catalog price metadata is missing or invalid
- Manufacturer and Packaging filter pills cycle through Include → Exclude → clear, with one shared summary for included and excluded values
- Compact catalog artifact with deduplicated manufacturer and packaging dictionaries
- Catalog product rows contain only `Product Name`, `Active Ingredient`, `Manufacturer`, `Packaging` and `RATE (USD)`; blank dictionary references are `null` and populated references are zero-based indexes
- Optional CDN catalog loading with preview, loading and error states

The checked-in catalog remains a **195-row preview** until the full sheet is processed and its generated artifact is deployed. The raw source JSON should be temporary; generated `.dat` artifacts are ignored by default.

## Build a versioned catalog artifact

`scripts/build-catalog.mjs` accepts the JSON source and an output directory as absolute paths. It normalizes each valid record to the five requested fields, removes S. No. and all other columns, deduplicates Manufacturer and Packaging into separate arrays, compresses the compact JSON with gzip, XOR-obfuscates the compressed bytes, and writes a randomly versioned artifact such as `catalog.a1b2c3.dat` with the `PCTCAT2:` format marker.

The decoded JSON has this structure:

```json
{
  "metadata": {
    "minPrice": 1.25,
    "maxPrice": 12.5
  },
  "manufacturers": ["Example Laboratories"],
  "packaging": ["1X10"],
  "products": [
    {
      "Product Name": "EXAMPLE 10MG",
      "Active Ingredient": "Example ingredient",
      "Manufacturer": 0,
      "Packaging": 0,
      "RATE (USD)": "1.25"
    }
  ]
}
```

The indexes start at zero. Rows with no manufacturer or packaging use `null` for that field. RATE values have a leading `$` removed; the full active-ingredient string is retained in the file and truncated only in the table display. At runtime, the client resolves dictionary indexes before it builds MiniSearch or applies filters.

Set `NEXT_PUBLIC_CATALOG_XOR_KEY` in `.env` before running the script:

```dotenv
NEXT_PUBLIC_CATALOG_XOR_KEY=your-obfuscation-key
```

PowerShell example (temporarily keep the source under `public/catalog-input`; write the artifact to `public/data`):

```powershell
node .\scripts\build-catalog.mjs `
  --input "C:\path\to\pct\public\catalog-input\Price List 1 July 2026 minified.json" `
  --output "C:\path\to\pct\public\data"
```

`public/catalog-input` is a convenient temporary builder input. Next.js copies every file in `public` into the static export, so remove the raw JSON from `public` after generating the `.dat` and before every `next build`; leave the versioned artifact in `public/data`. The app's `src/data/catalog.ts` is only the checked-in preview.

The script prints the random version, filename, output path, normalized row count, skipped-row count, dictionary sizes and artifact size. It supports arrays of records, common object wrappers (`products`, `data`, `rows`, `values`), and Google Sheets' header-row/values format. Rows without `Product Name` and `Active Ingredient` (or recognized aliases) are skipped and counted. Manufacturer, Packaging and RATE can be blank. The client loader also accepts legacy `PCTCAT1:` artifacts and older flat JSON catalogs during migration.

The git ignore rule prevents accidental commits of generated `.dat` files. For a Git-backed Pages deployment where the artifact lives under `public/data`, add the specific output intentionally with `git add -f public/data/catalog.<version>.dat`. Or keep it outside the repo and upload it to a separate CDN/R2 bucket.

## Cloudflare Pages

The site is configured for a static export. Set these in `.env` locally and in Cloudflare Pages' build environment:

```dotenv
NEXT_PUBLIC_CATALOG_DATA_URL=/data/catalog.a1b2c3.dat
NEXT_PUBLIC_CATALOG_XOR_KEY=your-obfuscation-key
```

For a separate CDN, use its full HTTPS asset URL instead of `/data/...`; configure CORS to allow `GET` from the Pages origin. Then build and publish `out/`:

```bash
bun run build
```

If the artifact is under `public/data`, Next.js copies it to `out/data`. Cloudflare Pages reads `public/_headers` from the static export. Versioned filenames can safely use long-lived immutable caching because each update has a new URL. If you change `.env`, rebuild/redeploy Pages: `NEXT_PUBLIC_*` values are embedded in the static client bundle at build time. A stable manifest URL is an alternative if you want to switch versions without rebuilding the site.

The browser loader fetches the configured URL, removes the format marker, XOR-decodes with the build-time key, decompresses gzip using `DecompressionStream`, expands the compact dictionaries, and builds the MiniSearch index locally. Serve the `.dat` object as binary (`application/octet-stream`) and do not manually set `Content-Encoding: gzip` on the XOR-obfuscated file. A CDN may transparently compress the response, but the browser must return the original marker-plus-payload bytes to the loader.

A WAF rate limit can reduce abusive request volume, but it cannot make a public static file private. Bot challenges may also interfere with browser fetches, so test them against the catalog URL. **XOR is obfuscation, not encryption:** the browser must receive the same key and visitors can recover it from the client bundle. Do not use a sensitive secret or rely on XOR for access control. Use an authenticated server-side endpoint if the data needs to be private.

The `.env.example` sets `NEXT_PUBLIC_CATALOG_PDF_URL` to the PCT24X7 source PDF: <https://pct247.ru/products.pdf>. Override that value in `.env` or the Pages environment if the PDF location changes.
