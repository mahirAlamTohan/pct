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

import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { siteConfig } from "@/config/site"
import { siteContent } from "@/config/content"
import heroImage from "@/images/hero-visual.webp"

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()
  const content = siteContent.hero

  return (
    <section
      aria-label={`${siteConfig.name} healthcare`}
      className="bg-linear-to-b from-hero-surface to-background pb-7 sm:pb-10"
      id="home"
    >
      <div className="relative isolate h-[clamp(510px,72svh,610px)] min-h-125 w-full overflow-hidden bg-hero-image-surface md:h-[clamp(500px,68svh,650px)]">
        <Image
          alt=""
          aria-hidden="true"
          className="dark:saturate-0.82 object-cover object-[68%_center] md:object-[center_52%] dark:brightness-[0.64]"
          fill
          priority
          sizes="100vw"
          src={heroImage}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-r from-hero-scrim/98 via-hero-scrim/88 via-45% to-transparent"
        />

        <Container className="relative z-10 flex h-full items-center">
          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="max-w-[690px] py-8 md:py-11"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/20 bg-background/75 px-3.5 py-2 text-[0.62rem] font-extrabold tracking-widest text-primary shadow-sm backdrop-blur-xl sm:text-[0.68rem]">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
              {content.eyebrow} {siteConfig.founded}
            </span>
            <h1 className="leading-1.02 mt-6 max-w-[650px] font-display text-[clamp(2.7rem,6.5vw,4.85rem)] font-extrabold tracking-[-0.07em] text-balance text-ink dark:text-foreground">
              {content.title}
              <br />
              <span className="bg-linear-to-r from-blue-700 via-sky-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-300 dark:via-sky-300 dark:to-cyan-200">
                {content.titleAccent}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-pretty text-slate-600 sm:text-base sm:leading-8 dark:text-slate-200">
              {content.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink
                className="min-h-12 bg-linear-to-r from-primary to-primary/80 px-5 text-white shadow-lg shadow-blue-700/25 hover:-translate-y-0.5 hover:shadow-xl [&_svg]:size-4"
                href={siteConfig.contact.whatsappHref}
                rel="noreferrer"
                size="lg"
                target="_blank"
              >
                <MessageCircle aria-hidden="true" />
                {content.primaryAction}
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                className="min-h-12 border border-slate-300/80 bg-white/65 px-5 text-blue-950 shadow-sm backdrop-blur-lg hover:bg-white dark:border-slate-600 dark:bg-slate-950/45 dark:text-blue-100 dark:hover:bg-slate-900/80"
                href="#catalog"
                size="lg"
                variant="outline"
              >
                {content.secondaryAction}
                <ArrowDown aria-hidden="true" />
              </ButtonLink>
            </div>
            <div
              aria-label={`${siteConfig.name} service highlights`}
              className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-200"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4 text-emerald-600 dark:text-emerald-300"
                />
                {content.proofPrimary}
              </span>
              <span aria-hidden="true" className="text-slate-400">
                ·
              </span>
              <span>{content.proofSecondary}</span>
            </div>
          </motion.div>
        </Container>

        <div className="absolute right-4 bottom-4 z-10 inline-flex min-h-9 items-center gap-2 rounded-full border border-blue-100/90 bg-white/80 px-3 text-[0.62rem] font-semibold text-blue-800 shadow-lg shadow-blue-950/10 backdrop-blur-xl sm:right-6 dark:border-blue-900 dark:bg-slate-950/80 dark:text-blue-200">
          <ShieldCheck
            aria-hidden="true"
            className="size-4 text-emerald-600 dark:text-emerald-300"
          />
          {content.imageBadge}
        </div>
      </div>

      <Container className="relative z-10 -mt-8">
        <Card className="flex flex-col items-start justify-between gap-4 border-blue-100/80 bg-white/90 p-4 shadow-xl shadow-blue-950/10 backdrop-blur-xl sm:flex-row sm:items-center sm:p-5 dark:border-blue-900/70 dark:bg-card/90">
          <div className="flex flex-col gap-1">
            <span className="text-[0.58rem] font-extrabold tracking-widest text-primary uppercase">
              {content.contactEyebrow}
            </span>
            <p className="m-0 text-xs font-semibold text-ink-soft sm:text-sm dark:text-foreground">
              {content.contactDescription}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <ButtonLink
              className="min-h-9 bg-primary px-3 text-white shadow-md shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-primary/90"
              href={siteConfig.contact.whatsappHref}
              rel="noreferrer"
              size="sm"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" />
              {content.whatsappAction}
            </ButtonLink>
            <ButtonLink
              className="min-h-9 border border-border bg-background px-3 text-ink-soft hover:border-blue-200 hover:bg-blue-50 hover:text-primary dark:bg-slate-900 dark:text-foreground dark:hover:bg-blue-950"
              href={siteConfig.contact.emailHref}
              size="sm"
              variant="outline"
            >
              <Mail aria-hidden="true" />
              {content.emailAction}
            </ButtonLink>
          </div>
        </Card>
      </Container>
    </section>
  )
}
