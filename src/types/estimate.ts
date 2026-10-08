export interface EstimateLineItem {
  id: string
  product: string
  content: string
  manufacturer: string
  packSize: string
  unitPriceCents: number
  quantity: number
}

export interface EstimateStorageDocument {
  version: 1
  items: EstimateLineItem[]
}
