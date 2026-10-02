import { Pill } from "lucide-react"

import { siteContent } from "@/config/content"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

interface BrandProps {
  className?: string
  footer?: boolean
}

export function Brand({ className, footer = false }: BrandProps) {
  return (
    <a
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "group inline-flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        footer && "min-w-0",
        className
      )}
      href="#home"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-[14px] border shadow-sm transition-transform duration-300 group-hover:-rotate-3",
          footer
            ? "border-footer-border bg-footer-card text-footer-accent"
            : "border-blue-200/80 bg-linear-to-br from-blue-50 to-blue-100 text-primary-text shadow-blue-950/5 dark:border-blue-900 dark:from-blue-950 dark:to-slate-900 dark:text-blue-300"
        )}
      >
        <Pill size={21} strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-display text-xl font-extrabold tracking-[-0.055em]",
            footer ? "text-footer-foreground" : "text-ink dark:text-foreground"
          )}
        >
          {siteConfig.name}
        </span>
        <span
          className={cn(
            "mt-1.5 text-[0.48rem] font-bold tracking-[0.11em] whitespace-nowrap sm:text-[0.52rem]",
            footer ? "text-footer-muted" : "text-muted-foreground"
          )}
        >
          {siteContent.ui.brandCaption}
        </span>
      </span>
    </a>
  )
}
