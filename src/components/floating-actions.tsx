"use client"

import { Button as BaseButton } from "@base-ui/react/button"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowUpRight,
  Headset,
  Mail,
  MessageCircle,
  Phone,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"

import { ButtonLink } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { siteContent } from "@/config/content"
import { cn } from "@/lib/utils"

export function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const contactCopy = siteContent.ui
  const phoneHasDestination = Boolean(siteConfig.contact.phone)
  const emailHasDestination = Boolean(siteConfig.contact.email)
  const whatsappHasDestination = Boolean(siteConfig.contact.whatsappNumber)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const panelTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 360, damping: 30, mass: 0.72 }

  return (
    <div className="fixed right-4 bottom-5 z-60 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-[min(19rem,calc(100vw-2rem))] origin-bottom-right rounded-[22px] border border-border bg-card/95 p-3 shadow-2xl shadow-slate-950/25 backdrop-blur-xl"
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            id="floating-contact-options"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, y: 16 }
            }
            role="region"
            aria-label={contactCopy.contactOptionsLabel}
            transition={panelTransition}
          >
            <div className="mb-2.5 flex items-center gap-2 px-1.5 py-1">
              <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary-text dark:bg-primary/20">
                <Headset aria-hidden="true" className="size-4" />
              </span>
              <span className="text-sm font-extrabold text-foreground">
                {contactCopy.contactOptionsLabel}
              </span>
            </div>

            <div className="grid gap-2">
              <ButtonLink
                className="min-h-11 justify-start rounded-xl bg-primary px-3.5 text-white shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
                href={siteConfig.contact.phoneHref}
                onClick={() => {
                  setIsOpen(false)
                }}
              >
                <span className="grid size-7 place-items-center rounded-full bg-white/15">
                  <Phone aria-hidden="true" className="size-3.5" />
                </span>
                {contactCopy.callUsAction}
                <ArrowUpRight
                  aria-hidden="true"
                  className="ml-auto size-4 opacity-75"
                />
              </ButtonLink>
              <ButtonLink
                className="min-h-11 justify-start rounded-xl bg-rose-600 px-3.5 text-white shadow-md shadow-rose-950/15 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg"
                href={siteConfig.contact.emailHref}
                onClick={() => {
                  setIsOpen(false)
                }}
              >
                <span className="grid size-7 place-items-center rounded-full bg-white/15">
                  <Mail aria-hidden="true" className="size-3.5" />
                </span>
                {contactCopy.emailUsAction}
                <ArrowUpRight
                  aria-hidden="true"
                  className="ml-auto size-4 opacity-75"
                />
              </ButtonLink>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <ButtonLink
                className="min-h-10 flex-1 justify-center rounded-xl border border-border bg-background text-xs text-foreground hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent"
                href="#contact"
                onClick={() => {
                  setIsOpen(false)
                }}
                variant="outline"
              >
                {contactCopy.contactUsAction}
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </ButtonLink>
              <BaseButton
                aria-label={contactCopy.closeContactOptionsLabel}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => {
                  setIsOpen(false)
                }}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </BaseButton>
            </div>

            {(!phoneHasDestination || !emailHasDestination) && (
              <p className="m-0 mt-2 px-1.5 text-[0.65rem] leading-5 text-muted-foreground">
                {siteContent.contact.description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <BaseButton
          aria-controls="floating-contact-options"
          aria-expanded={isOpen}
          aria-label={
            isOpen
              ? contactCopy.closeContactOptionsLabel
              : contactCopy.contactUsAction
          }
          className={cn(
            "grid size-12 place-items-center rounded-full border border-white/15 bg-slate-950 text-white shadow-xl shadow-slate-950/25 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-slate-900 focus-visible:ring-4 focus-visible:ring-primary/35 focus-visible:outline-none active:scale-95 sm:size-13",
            isOpen && "rotate-90"
          )}
          onClick={() => {
            setIsOpen((open) => !open)
          }}
          type="button"
        >
          {isOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Headset aria-hidden="true" className="size-5" />
          )}
        </BaseButton>

        <ButtonLink
          aria-label={contactCopy.chatAction}
          className="relative grid size-13 place-items-center rounded-full border border-white/20 bg-whatsapp text-white shadow-xl ring-4 shadow-emerald-700/30 ring-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-whatsapp-hover focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:outline-none active:scale-95 sm:size-14"
          href={siteConfig.contact.whatsappHref}
          rel={whatsappHasDestination ? "noreferrer" : undefined}
          target={whatsappHasDestination ? "_blank" : undefined}
          title={contactCopy.chatAction}
        >
          <MessageCircle aria-hidden="true" className="size-6" />
          <span className="sr-only">{contactCopy.chatAction}</span>
        </ButtonLink>
      </div>
    </div>
  )
}
