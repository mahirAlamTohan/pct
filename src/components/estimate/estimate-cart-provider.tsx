"use client"

import {
  createContext,
  use,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import {
  calculateEstimateTotalCents,
  clampEstimateQuantity,
  createEstimateLineItem,
  ESTIMATE_STORAGE_KEY,
  parseStoredEstimate,
  serializeEstimateItems,
} from "@/data/estimate"
import type { CatalogProduct } from "@/types/catalog"
import type { EstimateLineItem } from "@/types/estimate"

interface EstimateStoreState {
  items: EstimateLineItem[]
  isReady: boolean
  isStorageAvailable: boolean
}

interface EstimateCartContextValue extends EstimateStoreState {
  itemCount: number
  totalCents: bigint
  addProduct: (product: CatalogProduct) => boolean
  setQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearEstimate: () => void
}

interface EstimateStore {
  getSnapshot: () => EstimateStoreState
  getServerSnapshot: () => EstimateStoreState
  subscribe: (listener: () => void) => () => void
  addProduct: (product: CatalogProduct) => boolean
  setQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearEstimate: () => void
}

const EMPTY_SERVER_STATE: EstimateStoreState = {
  items: [],
  isReady: false,
  isStorageAvailable: true,
}

const EstimateCartContext = createContext<EstimateCartContextValue | null>(null)

function createEstimateStore(): EstimateStore {
  let state = EMPTY_SERVER_STATE
  let initialized = false
  let storageListener: ((event: StorageEvent) => void) | undefined
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) listener()
  }

  function readStoredState(): EstimateStoreState {
    try {
      return {
        items: parseStoredEstimate(
          window.localStorage.getItem(ESTIMATE_STORAGE_KEY)
        ),
        isReady: true,
        isStorageAvailable: true,
      }
    } catch {
      return { items: [], isReady: true, isStorageAvailable: false }
    }
  }

  function persistItems(items: EstimateLineItem[]) {
    try {
      if (items.length === 0) {
        window.localStorage.removeItem(ESTIMATE_STORAGE_KEY)
      } else {
        window.localStorage.setItem(
          ESTIMATE_STORAGE_KEY,
          serializeEstimateItems(items)
        )
      }
      return true
    } catch {
      return false
    }
  }

  function commitItems(items: EstimateLineItem[]) {
    const isStorageAvailable = persistItems(items)
    state = { items, isReady: true, isStorageAvailable }
    notify()
  }

  function syncFromStorage(event: StorageEvent) {
    if (event.key !== ESTIMATE_STORAGE_KEY && event.key !== null) return
    state = {
      items: parseStoredEstimate(event.key === null ? null : event.newValue),
      isReady: true,
      isStorageAvailable: true,
    }
    notify()
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => EMPTY_SERVER_STATE,
    subscribe(listener) {
      listeners.add(listener)
      if (!storageListener) {
        storageListener = syncFromStorage
        window.addEventListener("storage", storageListener)
      }
      if (!initialized) {
        initialized = true
        state = readStoredState()
        listener()
      }

      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && storageListener) {
          window.removeEventListener("storage", storageListener)
          storageListener = undefined
        }
      }
    },
    addProduct(product) {
      if (!state.isReady) return false
      const newItem = createEstimateLineItem(product)
      if (!newItem) return false

      const existing = state.items.find((item) => item.id === newItem.id)
      if (existing) {
        const nextQuantity = clampEstimateQuantity(existing.quantity + 1)
        if (nextQuantity === existing.quantity) return false
        commitItems(
          state.items.map((item) =>
            item.id === newItem.id ? { ...item, quantity: nextQuantity } : item
          )
        )
      } else {
        commitItems([...state.items, newItem])
      }
      return true
    },
    setQuantity(id, quantity) {
      const nextQuantity = clampEstimateQuantity(quantity)
      commitItems(
        state.items.map((item) =>
          item.id === id ? { ...item, quantity: nextQuantity } : item
        )
      )
    },
    removeItem(id) {
      commitItems(state.items.filter((item) => item.id !== id))
    },
    clearEstimate() {
      commitItems([])
    },
  }
}

export function EstimateCartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createEstimateStore)
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  const value = useMemo(
    () => ({
      ...state,
      itemCount: state.items.reduce((count, item) => count + item.quantity, 0),
      totalCents: calculateEstimateTotalCents(state.items),
      addProduct: store.addProduct,
      setQuantity: store.setQuantity,
      removeItem: store.removeItem,
      clearEstimate: store.clearEstimate,
    }),
    [state, store]
  )

  return <EstimateCartContext value={value}>{children}</EstimateCartContext>
}

export function useEstimateCart() {
  const context = use(EstimateCartContext)
  if (!context) {
    throw new Error(
      "useEstimateCart must be used within an EstimateCartProvider."
    )
  }
  return context
}
