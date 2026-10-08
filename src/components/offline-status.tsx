"use client"

import { useSyncExternalStore } from "react"
import { WifiOff } from "lucide-react"

import { siteContent } from "@/config/content"

function subscribeToConnectionStatus(listener: () => void) {
  const update = () => {
    listener()
  }
  window.addEventListener("online", update)
  window.addEventListener("offline", update)

  return () => {
    window.removeEventListener("online", update)
    window.removeEventListener("offline", update)
  }
}

function getConnectionStatus() {
  return !navigator.onLine
}

function getServerConnectionStatus() {
  return false
}

export function OfflineStatus() {
  const isOffline = useSyncExternalStore(
    subscribeToConnectionStatus,
    getConnectionStatus,
    getServerConnectionStatus
  )

  if (!isOffline) return null

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 top-20 z-70 mx-auto flex max-w-md items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
      role="status"
    >
      <WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{siteContent.ui.offlineNotice}</span>
    </div>
  )
}
