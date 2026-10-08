"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { siteContent } from "@/config/content"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme } = useTheme()

  return (
    <Button
      aria-label={siteContent.ui.themeToggleLabel}
      className={cn("shrink-0", className)}
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark")
        setTheme(isDark ? "light" : "dark")
      }}
      size="icon"
      title={siteContent.ui.themeToggleLabel}
      type="button"
      variant="ghost"
    >
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
      <span className="sr-only">{siteContent.ui.themeToggleLabel}</span>
    </Button>
  )
}
