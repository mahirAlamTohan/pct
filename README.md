# PCT24X7

A responsive pharmaceutical catalog site built with Next.js App Router, React, TypeScript, Tailwind CSS v4, Base UI/shadcn-style components, Motion and MiniSearch.

## Development

Copy the public configuration template, install dependencies and start the app:

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
- Accessible shared controls live in `src/components/ui`; links that look like buttons remain native anchors.
- Shared light/dark colors and global foundations live in `src/styles/main.css`. Fonts are self-hosted through `next/font/local`.
- Public site settings live in `src/config/site.ts`; FAQ and interface copy live in `src/config/content.ts`; shared types live in `src/types`.
- `NEXT_PUBLIC_*` values are embedded in the client bundle and are visible to visitors. Do not put secrets in them.

## Catalog behavior

- There is no bundled/demo catalog. If `NEXT_PUBLIC_CATALOG_DATA_URL` is empty, points to a missing file, or its companion files cannot be fetched, the UI shows a no-records state instead of sample products.
- Search uses MiniSearch with fuzzy/prefix matching and highlights. Filtering has independent manufacturer and packaging searches; selecting one facet never hides the values of the other.
- Manufacturers are rendered as a virtualized, one-per-row list. Packaging remains in a compact pill list. Include and Exclude summaries sit below both groups; clicking a summary pill removes that selection.
- Search and slider filtering are deferred while typing/dragging, product prices are parsed once per catalog load, and the table remains paginated.
- The dual-ended USD price slider reads catalog metadata and falls back to $0–$1,000 if metadata is missing or invalid.

## Build versioned catalog files

`scripts/build-catalog.mjs` normalizes the source list and writes three separate, same-version artifacts to the output folder:

```text
catalog.a1b2c3.dat
manufacturers.a1b2c3.dat
packaging.a1b2c3.dat
```

Only the catalog file contains product rows and price metadata. The manufacturer and packaging dictionaries are stored in their own files, and product rows refer to them by zero-based index. A decoded example:

```json
// catalog.<version>.dat
{
  "metadata": { "minPrice": 1.25, "maxPrice": 12.5 },
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

// manufacturers.<version>.dat
{ "kind": "manufacturers", "values": ["Example Laboratories"] }

// packaging.<version>.dat
{ "kind": "packaging", "values": ["1X10"] }
```

Each `.dat` file has the `PCTCAT2:` marker and contains gzip-compressed, XOR-obfuscated JSON. XOR is obfuscation, not encryption; the key is included in the public browser bundle and must not be treated as a secret.

Set a non-sensitive obfuscation key in `.env` before building the files:

```dotenv
NEXT_PUBLIC_CATALOG_XOR_KEY=your-obfuscation-key
```

The source JSON can stay in the git-ignored `extras/` folder. It is outside `public/`, so Next.js will not copy it into the static export. Example for the July 2026 list on Windows:

```powershell
node .\\scripts\\build-catalog.mjs `
  --input "F:\\pct\\extras\\Price List 1 July 2026 minified.json" `
  --output "F:\\pct\\public\\data"
```

The output prints all three filenames and the shared random version. It also explains skipped rows: non-object rows and rows without a recognized Product Name are skipped; records with a Product Name but a blank Active Ingredient are retained. The first few skipped row numbers, reasons and source field names are printed so source-format mismatches can be diagnosed rather than hidden in a single total. Common aliases for product, ingredient, manufacturer, packaging and rate headers are supported.

Set the catalog URL to the versioned **catalog** file only. The loader derives `manufacturers.<version>.dat` and `packaging.<version>.dat` from that URL and fetches all three files from the same folder:

```dotenv
NEXT_PUBLIC_CATALOG_DATA_URL=/data/catalog.a1b2c3.dat
NEXT_PUBLIC_CATALOG_XOR_KEY=your-obfuscation-key
```

Keep the three companion files together and version-matched when uploading to a CDN. Configure CORS to allow `GET` from the site origin. If serving from `public/data`, Next.js copies the files to `out/data` during the static build. The generated `.dat` files and `extras/` inputs are ignored by Git by default; if you intentionally keep the artifacts in the repository, force-add all three matching files.

```bash
bun run build
```

Serve each `.dat` as binary (`application/octet-stream`) and do not set `Content-Encoding: gzip` on the XOR-obfuscated payload. If you change `.env`, rebuild/redeploy because `NEXT_PUBLIC_*` values are embedded at build time. The loader also accepts the previous combined-dictionary catalog format for migration.

## Site content

Site, contact and PDF URL values are configured in `.env`; the `.env.example` includes the PCT24X7 defaults. The contact details and catalog URL are public. Keep business copy and FAQ data in `src/config/content.ts`.
