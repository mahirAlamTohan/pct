import { Pill } from "lucide-react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

interface BrandProps {
  className?: string
  footer?: boolean
}

export function Brand({ className, footer = false }: BrandProps) {
  return (
    <a
      aria-label={`${siteConfig.name} home`}
      className={cn("brand", footer && "brand-footer", className)}
      href="#home"
    >
      <span aria-hidden="true" className="brand-mark">
        <Pill size={21} strokeWidth={2.2} />
      </span>
      <span className="brand-type">
        <span className="brand-name">{siteConfig.name}</span>
        <span className="brand-caption">PHARMACEUTICAL HEALTHCARE</span>
      </span>
    </a>
  )
}
