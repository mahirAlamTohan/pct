"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"
import { ArrowDown, Mail, MessageCircle, ShieldCheck } from "lucide-react"

import heroImage from "@/images/hero.png"

const WHATSAPP_URL = "https://wa.me/918766267499"
const EMAIL_ADDRESS = "shop@pct24x7.store"

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.section
      className="hero-section"
      id="home"
      aria-label="PCT24X7 healthcare"
      initial={false}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <h1 className="sr-only">
        PCT24X7 — Quality medicines. Better healthcare.
      </h1>
      <motion.div
        className="hero-image-frame"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.012 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={heroImage}
          alt="Quality medicines and pharmaceutical care from PCT24X7, your trusted healthcare partner since 2012."
          className="hero-image"
          fill
          priority
          sizes="100vw"
        />
        <span className="hero-image-tag">
          <ShieldCheck aria-hidden="true" size={15} />
          Quality you can trust
        </span>
      </motion.div>

      <motion.div
        className="hero-contact-card site-container"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
      >
        <div className="hero-contact-copy">
          <span className="eyebrow eyebrow-small">
            Here for your healthcare needs
          </span>
          <p>You can contact us to order medicines via WhatsApp and Email.</p>
        </div>
        <div className="hero-contact-actions">
          <a
            className="button button-primary"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle aria-hidden="true" size={17} />
            WhatsApp us
          </a>
          <a className="button button-light" href={`mailto:${EMAIL_ADDRESS}`}>
            <Mail aria-hidden="true" size={17} />
            Email us
          </a>
          <a
            className="scroll-cue"
            href="#catalog"
            aria-label="Explore the pharmaceutical catalog"
          >
            <ArrowDown aria-hidden="true" size={17} />
          </a>
        </div>
      </motion.div>
    </motion.section>
  )
}
