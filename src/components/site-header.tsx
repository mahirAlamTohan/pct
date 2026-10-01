"use client"

import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react"
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react"
import { useSyncExternalStore } from "react"

import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { ButtonLink } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { siteContent } from "@/config/content"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

function subscribeToScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true })
  return () => {
    window.removeEventListener("scroll", callback)
  }
}

function getFloatingSnapshot() {
  return window.scrollY > 48
}

function getServerSnapshot() {
  return false
}

export function SiteHeader() {
  const isFloating = useSyncExternalStore(
    subscribeToScroll,
    getFloatingSnapshot,
    getServerSnapshot
  )
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scrollProgress = useSpring(scrollYProgress, {
    damping: 30,
    restDelta: 0.001,
    stiffness: 120,
  })

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-60 h-[3px] origin-left bg-linear-to-r from-primary via-sky-500 to-cyan-300"
        style={{
          scaleX: prefersReducedMotion ? scrollYProgress : scrollProgress,
        }}
      />

      <div className="h-9 bg-header-strip text-[10px] tracking-[0.015em] text-header-strip-foreground sm:text-[11px]">
        <Container className="flex h-full items-center justify-center gap-4 md:justify-between">
          <p className="hidden items-center gap-2 text-blue-100 md:flex">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15"
            />
            {siteContent.ui.headerIntro} {siteConfig.founded}
          </p>
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end md:gap-6">
            <a
              className="inline-flex items-center gap-1.5 transition-colors hover:text-sky-300"
              href={siteConfig.contact.phoneHref}
            >
              <Phone aria-hidden="true" className="size-3.5 text-blue-300" />
              {siteConfig.contact.phone || siteContent.ui.phoneFallback}
            </a>
            <a
              className="inline-flex items-center gap-1.5 transition-colors hover:text-sky-300"
              href={siteConfig.contact.emailHref}
            >
              <Mail aria-hidden="true" className="size-3.5 text-blue-300" />
              {siteConfig.contact.email || siteContent.ui.emailFallback}
            </a>
          </div>
        </Container>
      </div>

      <div className="h-25 md:h-[83px]" aria-hidden="true" />

      <header
        className={cn(
          "fixed top-[37px] left-0 z-50 w-full max-w-[100vw] border border-transparent bg-white/95 shadow-header-rest backdrop-blur-2xl transition-[left,width,max-width,top,translate,border-radius,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-background/95",
          isFloating &&
            "top-[10px] left-1/2 w-[calc(100vw-2rem)] max-w-300 -translate-x-1/2 rounded-2xl border-blue-200/80 bg-white/90 shadow-header-floating dark:border-blue-900/80 dark:bg-slate-950/90"
        )}
      >
        <Container
          className={cn(
            "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 transition-[min-height,padding] duration-300 md:flex md:gap-4 lg:gap-6",
            isFloating
              ? "min-h-16 py-1 md:min-h-17"
              : "min-h-[75px] py-2 md:min-h-[82px]"
          )}
        >
          <Brand className="max-w-full" />

          <nav
            aria-label={siteContent.ui.mainNavigationLabel}
            className="hidden flex-1 items-center justify-center gap-1 md:flex"
          >
            {siteConfig.navigation.map((item, index) => (
              <a
                aria-current={index === 0 ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full px-3 text-[0.76rem] font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:text-slate-300 dark:hover:bg-blue-950/60 dark:hover:text-blue-200",
                  index === 0 &&
                    "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="col-start-2 row-start-1 flex items-center gap-1.5 md:ml-auto md:gap-2">
            <ButtonLink
              className="min-h-9 gap-2 bg-primary px-3 text-white shadow-md shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg sm:px-3.5 [&_svg]:size-3.5"
              href={siteConfig.contact.whatsappHref}
              rel="noreferrer"
              size="sm"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" />
              <span>{siteContent.ui.chatAction}</span>
              <ArrowUpRight aria-hidden="true" className="hidden sm:block" />
            </ButtonLink>
            <ThemeToggle className="size-9 border border-border text-ink-soft hover:text-primary md:size-10 dark:text-foreground" />
          </div>

          <nav
            aria-label={siteContent.ui.mobileNavigationLabel}
            className="col-span-2 row-start-2 -mx-1 mt-2 flex scrollbar-none gap-1.5 overflow-x-auto border-t border-slate-100 py-2 md:hidden dark:border-slate-800"
          >
            {siteConfig.navigation.map((item) => (
              <a
                className="shrink-0 rounded-full px-3 py-1.5 text-[0.68rem] font-bold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-ring dark:text-slate-300 dark:hover:bg-blue-950/60 dark:hover:text-blue-200"
                href={item.href}
                key={item.href}
              >
                {item.mobileLabel}
              </a>
            ))}
          </nav>
        </Container>
      </header>
    </>
  )
}
