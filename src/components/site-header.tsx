"use client"

import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react"
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react"
import { useSyncExternalStore } from "react"

import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

function subscribeToScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true })

  return () => {
    window.removeEventListener("scroll", callback)
  }
}

function getFloatingSnapshot() {
  return window.scrollY > 40
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
        className="scroll-progress"
        style={{
          scaleX: prefersReducedMotion ? scrollYProgress : scrollProgress,
        }}
      />
      <div className="utility-bar">
        <div className="site-container utility-inner">
          <p className="utility-note">
            <span aria-hidden="true" className="live-dot" />
            Your trusted healthcare partner since {siteConfig.founded}
          </p>
          <div className="utility-links">
            <a href={siteConfig.contact.phoneHref}>
              <Phone aria-hidden="true" size={14} />
              {siteConfig.contact.phone}
            </a>
            <a href={siteConfig.contact.emailHref}>
              <Mail aria-hidden="true" size={14} />
              {siteConfig.contact.email}
            </a>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="header-spacer" />
      <motion.header
        animate={{
          top: isFloating ? 10 : 37,
          borderRadius: isFloating ? 18 : 0,
          boxShadow: isFloating
            ? "0 14px 38px rgba(20, 48, 84, 0.16)"
            : "0 1px 0 rgba(30, 58, 93, 0.06)",
        }}
        className={cn("site-header", isFloating && "is-floating")}
        initial={false}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 330, damping: 34, mass: 0.8 }
        }
      >
        <div className="site-container header-inner">
          <Brand />

          <nav aria-label="Main navigation" className="primary-nav">
            {siteConfig.navigation.map((item, index) => (
              <a
                className={cn("nav-link", index === 0 && "nav-link-active")}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <Button asChild className="header-contact" size="sm">
              <a
                href={siteConfig.contact.whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle aria-hidden="true" />
                <span>Chat with us</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
            <ThemeToggle className="header-theme-toggle" />
          </div>

          <nav aria-label="Mobile navigation" className="mobile-nav">
            {siteConfig.navigation.map((item) => (
              <a href={item.href} key={item.href}>
                {item.mobileLabel}
              </a>
            ))}
          </nav>
        </div>
      </motion.header>
    </>
  )
}
