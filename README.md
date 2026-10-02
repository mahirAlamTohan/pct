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
- Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin when changing the production hostname; it is used for canonical and social metadata.

## Offline and security model

- In production, the service worker precaches the static app shell, fonts, icons and versioned catalog files after a successful online visit. The catalog loader also saves valid catalog responses in Cache Storage and can use them when the network fails.
- Offline use requires one online visit while the service worker finishes installing. Browser storage can be cleared or evicted, so a locally saved copy is best-effort, not a permanent backup. `npm run build` generates the content-versioned precache list and CSP hashes; deploy the `out/` created by that command.
- Security headers are applied through `public/_headers`. See [SECURITY.md](./SECURITY.md) for the threat model and hosting-account checklist. Offline caching reduces repeat downloads; it does not block DDoS or make the site unhackable.

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

When regenerating the catalog, temporarily copy the source JSON to `public/data/source.json` so the builder and output use the deployment data folder. This raw source is ignored by Git. After generating the `.dat` files, remove `public/data/source.json` **before** running the site build; never publish or commit the raw source.

```bash
mkdir -p public/data
cp "/path/to/Price List.json" public/data/source.json
node scripts/build-catalog.mjs --input public/data/source.json --output public/data
rm public/data/source.json
bun run build
```

PowerShell equivalent:

```powershell
New-Item -ItemType Directory -Force public\\data | Out-Null
Copy-Item "F:\\pct\\Price List.json" public\\data\\source.json
node .\\scripts\\build-catalog.mjs --input public\\data\\source.json --output public\\data
Remove-Item public\\data\\source.json
bun run build
```

The output prints all three filenames and the shared random version. It also explains skipped rows: non-object rows and rows without a recognized Product Name are skipped; records with a Product Name but a blank Active Ingredient are retained. The first few skipped row numbers, reasons and source field names are printed so source-format mismatches can be diagnosed rather than hidden in a single total. Common aliases for product, ingredient, manufacturer, packaging and rate headers are supported.

Set the catalog URL to the versioned **catalog** file only. The loader derives `manufacturers.<version>.dat` and `packaging.<version>.dat` from that URL and fetches all three files from the same folder:

```dotenv
NEXT_PUBLIC_CATALOG_DATA_URL=/data/catalog.a1b2c3.dat
NEXT_PUBLIC_CATALOG_XOR_KEY=your-obfuscation-key
```

Keep the three companion files together and version-matched when deploying. If serving from `public/data`, Next.js copies the files to `out/data` during the static build. Same-origin Worker hosting needs no CORS configuration; if the catalog is hosted on a different origin, allow `GET` from the site origin. The versioned `.dat` triplet is the deployable catalog and is tracked here; raw source JSON is ignored and must be removed before building.

```bash
bun run build
```

Serve each `.dat` as binary (`application/octet-stream`) and do not set `Content-Encoding: gzip` on the XOR-obfuscated payload. The `build` script refuses to run if any JSON file remains directly under `public/data`, protecting the temporary source from being copied into the static export. If you change `.env`, rebuild/redeploy because `NEXT_PUBLIC_*` values are embedded at build time. The loader also accepts the previous combined-dictionary catalog format for migration.

## Site content

Site, contact and PDF URL values are configured in `.env`; the `.env.example` includes the PCT24X7 defaults. The contact details and catalog URL are public. Keep business copy and FAQ data in `src/config/content.ts`.
