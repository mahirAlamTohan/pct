# PCT24X7

A responsive PCT24X7 pharmaceutical catalog site built with Next.js App Router, React, TypeScript, Tailwind CSS, Motion and MiniSearch.

## Development

Install dependencies with Bun (the repository lockfile is `bun.lock`) and start the dev server:

```bash
bun install
bun run dev
```

Useful checks:

```bash
bun run typecheck
bun run lint
bun run build
```

## Site features

- Full-bleed healthcare hero, responsive navigation, company information, contact details and a PCT24X7-specific footer
- Compact floating header and reduced-motion-aware Framer Motion animations
- Fuzzy, prefix-enabled browser search with highlighting and pagination
- Catalog fields: `Product Name`, `Active Ingredient`, `Manufacturer`, `Packaging` and `RATE (USD)`
- Expandable payment, shipping and ordering FAQs
- Optional CDN catalog loading with preview, loading and error states

The checked-in catalog remains a **195-row preview** until the supplied sheet is processed and its generated artifact is deployed. The source JSON is only a temporary build input; generated `.dat` artifacts are ignored by default.

## Build a versioned catalog artifact

`scripts/build-catalog.mjs` accepts the JSON source and an output directory as absolute paths. It normalizes each valid record to only the five requested fields, removes S. No. and all other columns, compresses the compact JSON with gzip, XOR-obfuscates the compressed bytes, and writes a randomly versioned artifact such as `catalog.a1b2c3.dat`. The artifact starts with a short format marker so the browser can identify this format before decoding it.

Set the same key in the repository's ignored `.env` file before running the script:

```dotenv
NEXT_PUBLIC_CATALOG_XOR_KEY=your-obfuscation-key
```

PowerShell example (temporarily keep the source under `public/catalog-input`; write the artifact to `public/data`):

```powershell
node .\scripts\build-catalog.mjs `
  --input "C:\path\to\pct\public\catalog-input\Price List 1 July 2026 minified.json" `
  --output "C:\path\to\pct\public\data"
```

Do not put the full source in `src/data`. `public/catalog-input` is just a convenient temporary location for the builder's input. Next.js copies every file in `public` into the static export, so remove the raw JSON from `public` after generating the `.dat` and before every `next build`; leave the versioned artifact in `public/data`. The app's `src/data/catalog.ts` is only the checked-in preview.

The script prints the version, filename, output path, normalized row count and skipped-row count. It supports arrays of records, common object wrappers (`products`, `data`, `rows`, `values`), and Google Sheets' header-row/values format. Rows without `Product Name` and `Active Ingredient` (or their recognized aliases) are skipped and counted. `Manufacturer`, `Packaging` and `RATE (USD)` can be blank. RATE values have a leading `$` removed; the original full ingredient string is retained.

The git ignore rule prevents accidental commits of generated `.dat` files. For a Git-backed Pages deployment where the artifact lives under `public/data`, add the specific output intentionally with `git add -f public/data/catalog.<version>.dat`. Or keep the artifact outside the repo and upload it to a separate CDN/R2 bucket.

## Cloudflare Pages

The site is configured for a static export. Set these variables in `.env` locally and in Cloudflare Pages' build environment:

```dotenv
NEXT_PUBLIC_CATALOG_DATA_URL=/data/catalog.a1b2c3.dat
NEXT_PUBLIC_CATALOG_XOR_KEY=your-obfuscation-key
```

For a separate CDN, use its full HTTPS asset URL instead of `/data/...`; configure CORS to allow `GET` from the Pages origin. Then build and publish `out/`:

```bash
bun run build
```

If the artifact is under `public/data`, Next.js copies it to `out/data`. Cloudflare Pages reads `public/_headers` from the static export. Versioned filenames can safely use long-lived immutable caching because each data update has a new URL. If you update `.env`, rebuild/redeploy Pages: `NEXT_PUBLIC_*` values are embedded into the static client bundle at build time. A stable manifest URL is an alternative if you want to switch versions without rebuilding the site.

The browser loader fetches the configured URL, removes the format marker, XOR-decodes with the build-time key, decompresses gzip using `DecompressionStream`, normalizes the five fields and builds the MiniSearch index locally. Serve the `.dat` object as binary (`application/octet-stream`) and do not manually set `Content-Encoding: gzip` on the XOR-obfuscated file. A CDN may transparently compress the response, but the browser must return the original marker-plus-payload bytes to the loader.

A WAF rate limit can reduce abusive request volume, but it cannot make a public static file private. Bot challenges may also interfere with browser fetches, so test them against the catalog URL. **XOR is obfuscation, not encryption:** the browser must receive the same key and visitors can recover it from the client bundle. Do not use a sensitive secret or rely on XOR for access control. Use an authenticated server-side endpoint if the data needs to be private.

The full-catalog PDF link points to the PCT24X7 source PDF: <https://pct247.ru/products.pdf>.
