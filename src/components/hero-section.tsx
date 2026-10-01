"use client"

import Image from "next/image"
import {
  ArrowDown,
  ArrowRight,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { siteConfig } from "@/config/site"
import heroImage from "@/images/hero-visual.webp"

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      aria-label={`${siteConfig.name} healthcare`}
      className="hero-section"
      id="home"
    >
      <div className="hero-image-frame">
        <Image
          alt=""
          aria-hidden="true"
          className="hero-image"
          fill
          priority
          sizes="100vw"
          src={heroImage}
        />
        <div aria-hidden="true" className="hero-image-scrim" />

        <div className="site-container hero-content">
          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="hero-copy"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="hero-kicker inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/75 px-4 py-2 text-[0.68rem] font-extrabold tracking-[0.13em] text-primary shadow-sm backdrop-blur-xl">
              <ShieldCheck aria-hidden="true" size={16} />
              Trusted healthcare partner since {siteConfig.founded}
            </span>
            <h1 className="leading-1.02 font-sans text-5xl font-extrabold tracking-[-0.07em] text-balance text-foreground sm:text-6xl lg:text-7xl">
              Quality medicines.
              <br />
              <span>Better healthcare.</span>
            </h1>
            <p className="hero-description max-w-xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg sm:leading-8">
              Reliable access to generic and ethical-brand medicines, backed by
              thoughtful service and international shipping from India.
            </p>
            <div className="hero-actions flex flex-wrap items-center gap-3">
              <Button asChild className="hero-primary-button" size="lg">
                <a
                  href={siteConfig.contact.whatsappHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle aria-hidden="true" />
                  Talk to our team
                  <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <Button
                asChild
                className="hero-secondary-button"
                size="lg"
                variant="outline"
              >
                <a href="#catalog">
                  Explore catalog
                  <ArrowDown aria-hidden="true" />
                </a>
              </Button>
            </div>
            <div
              aria-label={`${siteConfig.name} service highlights`}
              className="hero-proof-row flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground"
            >
              <span>
                <ShieldCheck aria-hidden="true" size={15} />
                Quality focused
              </span>
              <span>·</span>
              <span>Worldwide shipping</span>
            </div>
          </motion.div>
        </div>

        <div
          aria-hidden="true"
          className="hero-image-tag inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 text-xs font-semibold text-primary shadow-lg backdrop-blur-xl"
        >
          <ShieldCheck size={15} />
          Carefully sourced healthcare
        </div>
      </div>

      <Card className="site-container hero-contact-card">
        <div className="hero-contact-copy">
          <span className="eyebrow eyebrow-small">
            Here for your healthcare needs
          </span>
          <p>For product availability and orders, contact our team directly.</p>
        </div>
        <div className="hero-contact-actions">
          <Button asChild className="button-primary" size="sm">
            <a
              href={siteConfig.contact.whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" />
              WhatsApp us
            </a>
          </Button>
          <Button asChild className="button-light" size="sm" variant="outline">
            <a href={siteConfig.contact.emailHref}>
              <Mail aria-hidden="true" />
              Email us
            </a>
          </Button>
        </div>
      </Card>
    </section>
  )
}
