"use client"

import { useEffect } from "react"

export function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return
    }

    void (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        await navigator.serviceWorker.ready
        const storageManager = Reflect.get(navigator, "storage") as
          { persist?: () => Promise<boolean> } | undefined
        if (typeof storageManager?.persist === "function") {
          await storageManager.persist()
        }
      } catch {
        // Offline caching is an enhancement; the online site remains usable.
      }
    })()
  }, [])

  return null
}
