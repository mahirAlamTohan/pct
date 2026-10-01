export interface CatalogProduct {
  content: string
  product: string
  packSize: string
  rate: string
  manufacturer: string
}

export interface CatalogDataset {
  products: CatalogProduct[]
  manufacturers: string[]
  packaging: string[]
}

export type CatalogLoadState = "preview" | "loading" | "loaded" | "error"
export type CatalogFilterMode = "include" | "exclude"

export interface CatalogExplorerProps {
  products: CatalogProduct[]
  catalogDataUrl?: string
}
