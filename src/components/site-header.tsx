"use client"

import { ArrowUpRight, Mail, MessageCircle, Pill, Phone } from "lucide-react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react"
import { useState } from "react"

const WHATSAPP_URL = "https://wa.me/918766267499"
const EMAIL_ADDRESS = "shop@pct24x7.store"
const PHONE_NUMBER = "+91 8766267499"

export function SiteHeader() {
  const [isFloating, setIsFloating] = useState(false)
  const { scrollY } = useScroll()
  const prefersReducedMotion = useReducedMotion()

  useMotionValueEvent(scrollY, "change", (latest) => {
    const shouldFloat = latest > 36
    setIsFloating((current) =>
      current === shouldFloat ? current : shouldFloat
    )
  })

  return (
    <>
      <div className="utility-bar">
        <div className="site-container utility-inner">
          <p className="utility-note">
            <span className="live-dot" aria-hidden="true" />
            Your trusted healthcare partner since 2012
          </p>
          <div className="utility-links">
            <a href={`tel:${PHONE_NUMBER.replaceAll(" ", "")}`}>
              <Phone aria-hidden="true" size={14} />
              {PHONE_NUMBER}
            </a>
            <a href={`mailto:${EMAIL_ADDRESS}`}>
              <Mail aria-hidden="true" size={14} />
              {EMAIL_ADDRESS}
            </a>
          </div>
        </div>
      </div>

      <div className="header-spacer" aria-hidden="true" />
      <motion.header
        className={`site-header${isFloating ? "is-floating" : ""}`}
        initial={false}
        animate={{
          top: isFloating ? 12 : 37,
          borderRadius: isFloating ? 18 : 0,
          boxShadow: isFloating
            ? "0 14px 38px rgba(20, 48, 84, 0.16)"
            : "0 1px 0 rgba(30, 58, 93, 0.06)",
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 330, damping: 34, mass: 0.8 }
        }
      >
        <div className="site-container header-inner">
          <a className="brand" href="#home" aria-label="PCT24X7 home">
            <span className="brand-mark" aria-hidden="true">
              <Pill size={22} strokeWidth={2.2} />
            </span>
            <span className="brand-type">
              <span className="brand-name">
                PCT<span>24X7</span>
              </span>
              <span className="brand-caption">PHARMACEUTICAL HEALTHCARE</span>
            </span>
          </a>

          <nav className="primary-nav" aria-label="Main navigation">
            <a href="#home" className="nav-link nav-link-active">
              Home
            </a>
            <a href="#about" className="nav-link">
              About Us
            </a>
            <a href="#catalog" className="nav-link">
              Catalog
            </a>
            <a href="#faq" className="nav-link">
              FAQs
            </a>
            <a href="#contact" className="nav-link">
              Contact Us
            </a>
          </nav>

          <a
            className="header-contact"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle aria-hidden="true" size={17} />
            <span>Chat with us</span>
            <ArrowUpRight aria-hidden="true" size={15} />
          </a>

          <nav className="mobile-nav" aria-label="Mobile navigation">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#catalog">Catalog</a>
            <a href="#faq">FAQs</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </motion.header>
    </>
  )
}
