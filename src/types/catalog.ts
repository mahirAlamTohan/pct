export interface CatalogProduct {
  content: string
  product: string
  packSize: string
  rate: string
  manufacturer: string
}

export interface CatalogMetadata {
  minPrice: number
  maxPrice: number
}

export interface CatalogDataset {
  products: CatalogProduct[]
  manufacturers: string[]
  packaging: string[]
  metadata?: CatalogMetadata
}

export type CatalogLoadState = "preview" | "loading" | "loaded" | "error"
export type CatalogFilterMode = "include" | "exclude"
export type CatalogFacetKind = "manufacturer" | "packaging"

export interface CatalogExplorerProps {
  products: CatalogProduct[]
  catalogDataUrl?: string
}
