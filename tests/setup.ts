import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, vi } from "vitest"

process.env.NEXT_PUBLIC_CATALOG_XOR_KEY ??= "pct-vitest-fixture-key"

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  })
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserverMock {
      observe() {
        return undefined
      }

      unobserve() {
        return undefined
      }

      disconnect() {
        return undefined
      }
    }
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
