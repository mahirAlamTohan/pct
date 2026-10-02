import {
  ArrowUpRight,
  Clock3,
  Globe2,
  Mail,
  MessageCircle,
  Pill,
  Phone,
  ShieldCheck,
} from "lucide-react"

import { Brand } from "@/components/brand"
import { Reveal } from "@/components/reveal"
import { ButtonLink } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { siteConfig } from "@/config/site"
import { siteContent } from "@/config/content"

const serviceIcons = [
  <MessageCircle aria-hidden="true" className="size-[17px]" key="message" />,
  <Globe2 aria-hidden="true" className="size-[17px]" key="globe" />,
  <ShieldCheck aria-hidden="true" className="size-[17px]" key="shield" />,
]

function replaceSiteTokens(value: string) {
  return value
    .replaceAll("{name}", siteConfig.name)
    .replaceAll("{founded}", siteConfig.founded.toString())
}

export function AboutContactSection() {
  const about = siteContent.about
  const contact = siteContent.contact
  const footer = siteContent.footer

  return (
    <>
      <section
        className="overflow-x-clip bg-linear-to-br from-about-start via-about-middle to-about-end py-16 sm:py-20 lg:py-24"
        id="about"
      >
        <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] md:gap-14 lg:gap-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[0.68rem] font-extrabold tracking-[0.12em] text-primary-text uppercase">
              <Pill aria-hidden="true" className="size-4" />
              {about.eyebrow.replace("{name}", siteConfig.name)}
            </span>
            <h2 className="mt-3 max-w-xl font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight font-extrabold tracking-[-0.045em] text-ink dark:text-foreground">
              {about.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-[0.94rem] sm:leading-8">
              {replaceSiteTokens(about.description)}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              {about.highlights.map((highlight, index) => {
                const Icon = index === 0 ? ShieldCheck : Globe2
                return (
                  <div
                    className="inline-flex items-center gap-2 text-xs font-bold text-ink-soft dark:text-slate-200"
                    key={highlight}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-5 text-blue-600 dark:text-blue-300"
                    />
                    {highlight}
                  </div>
                )
              })}
            </div>
          </Reveal>

          <Reveal
            aria-label={`${siteConfig.name} service details`}
            className="relative isolate flex min-h-[330px] items-center justify-center sm:min-h-90"
            delay={0.12}
          >
            <span
              aria-hidden="true"
              className="absolute -z-10 size-[min(78vw,315px)] rounded-full bg-[radial-gradient(circle_at_34%_32%,var(--about-disc-start),var(--about-disc-middle)_68%,var(--about-disc-end)_100%)]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-1 bottom-[8%] -z-10 size-[5.7rem] rotate-12 rounded-[28px] border border-blue-100 bg-white shadow-xl shadow-blue-950/10 dark:border-blue-900 dark:bg-slate-900"
            />
            <span
              aria-hidden="true"
              className="absolute -z-10 h-[225px] w-[min(92vw,380px)] rotate-[-26deg] rounded-[50%] border border-dashed border-blue-300/80 dark:border-blue-800"
            />
            <span
              aria-hidden="true"
              className="absolute -z-10 h-47 w-[min(76vw,300px)] rotate-34 rounded-[50%] border border-dashed border-blue-300/80 dark:border-blue-800"
            />

            <div className="relative z-10 flex min-h-[250px] w-[min(300px,76%)] -rotate-3 flex-col items-start justify-center rounded-[22px] border border-white/80 bg-linear-to-br from-blue-600 to-blue-900 px-7 py-6 text-white shadow-2xl shadow-blue-950/25">
              <span className="grid size-11 place-items-center rounded-[14px] border border-white/20 bg-white/10 text-blue-100">
                <Pill aria-hidden="true" className="size-5" />
              </span>
              <span className="mt-5 font-display text-[2.7rem] leading-none font-extrabold tracking-[-0.07em]">
                {siteConfig.founded}
              </span>
              <span className="mt-1.5 text-xs font-semibold text-blue-100">
                {about.sinceLabel}
              </span>
              <span className="mt-4 h-0.5 w-9 bg-blue-300" />
              <p className="mt-2.5 max-w-55 text-[0.7rem] leading-5 text-blue-50">
                {about.serviceDescription}
              </p>
            </div>

            <div className="absolute right-0 bottom-5 z-20 flex max-w-[min(285px,82%)] items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-xl shadow-blue-950/10 sm:bottom-7">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                <Globe2 aria-hidden="true" className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col leading-snug">
                <strong className="text-[0.7rem] font-extrabold text-ink-soft dark:text-foreground">
                  {about.serviceTitle}
                </strong>
                <span className="mt-1 text-[0.58rem] text-muted-foreground">
                  {about.serviceRegions}
                </span>
              </span>
            </div>
          </Reveal>
        </Container>
      </section>

      <section
        className="bg-linear-to-b from-contact-section-start to-contact-section-end pt-2 pb-16 sm:pb-20"
        id="contact"
      >
        <Container>
          <Reveal
            className="relative isolate grid overflow-hidden rounded-[24px] bg-linear-to-br from-contact-start via-contact-middle to-contact-end p-6 text-white shadow-2xl shadow-blue-950/20 sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.68fr)] lg:gap-12 lg:p-12"
            delay={0.04}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 right-[20%] -z-10 size-[300px] rounded-full border border-white/10"
            />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-[0.68rem] font-extrabold tracking-[0.12em] text-blue-200 uppercase">
                <MessageCircle aria-hidden="true" className="size-4" />
                {contact.eyebrow}
              </span>
              <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-tight font-extrabold tracking-[-0.045em] text-white">
                {contact.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
                {contact.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <ButtonLink
                  className="min-h-11 bg-white px-4 text-blue-800 shadow-lg shadow-blue-950/20 hover:-translate-y-0.5 hover:bg-blue-50"
                  href={siteConfig.contact.whatsappHref}
                  rel="noreferrer"
                  size="sm"
                  target="_blank"
                  variant="secondary"
                >
                  <MessageCircle aria-hidden="true" />
                  {contact.whatsappLabel}
                  <ArrowUpRight aria-hidden="true" />
                </ButtonLink>
                <a
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-100 transition-colors hover:text-white"
                  href={siteConfig.contact.emailHref}
                >
                  <Mail aria-hidden="true" className="size-4" />
                  {siteConfig.contact.email || contact.emailFallback}
                </a>
              </div>
            </div>

            <div className="relative z-10 mt-3 flex flex-col justify-center gap-4 border-t border-white/20 pt-5 lg:mt-0 lg:border-t-0 lg:border-l lg:py-4 lg:pl-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-blue-200">
                  <Phone aria-hidden="true" className="size-[17px]" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[0.62rem] font-bold tracking-wide text-blue-200 uppercase">
                    {contact.phoneLabel}
                  </span>
                  <a
                    className="text-xs font-semibold wrap-break-word text-white"
                    href={siteConfig.contact.phoneHref}
                  >
                    {siteConfig.contact.phone || contact.phoneFallback}
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-blue-200">
                  <Mail aria-hidden="true" className="size-[17px]" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[0.62rem] font-bold tracking-wide text-blue-200 uppercase">
                    {contact.emailLabel}
                  </span>
                  <a
                    className="text-xs font-semibold wrap-break-word text-white"
                    href={siteConfig.contact.emailHref}
                  >
                    {siteConfig.contact.email || contact.emailFallback}
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-blue-200">
                  <Clock3 aria-hidden="true" className="size-[17px]" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[0.62rem] font-bold tracking-wide text-blue-200 uppercase">
                    {contact.supportHoursLabel}
                  </span>
                  <strong className="text-xs font-semibold wrap-break-word text-white">
                    {siteConfig.contact.supportHours ||
                      contact.supportHoursFallback}
                  </strong>
                </span>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <footer className="relative border-t border-footer-border bg-linear-to-br from-footer-start via-footer-middle to-footer-end text-footer-foreground before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-linear-to-r before:from-footer-accent before:via-footer-accent/70 before:to-footer-border before:content-['']">
        <Container className="grid gap-9 py-10 sm:grid-cols-2 sm:gap-8 sm:py-12 lg:grid-cols-[minmax(250px,1.2fr)_minmax(170px,0.7fr)_minmax(260px,1fr)] lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Brand footer />
            <span className="mt-5 block text-xs font-extrabold text-footer-accent">
              {footer.kicker}
            </span>
            <p className="mt-2 max-w-90 text-xs leading-6 text-footer-muted">
              {replaceSiteTokens(footer.description)}
            </p>
          </div>

          <nav
            aria-label={siteContent.ui.footerNavigationLabel}
            className="flex flex-col items-start gap-2.5"
          >
            <span className="mb-1 text-[0.68rem] font-extrabold tracking-[0.075em] text-footer-foreground uppercase">
              {footer.navigationHeading}
            </span>
            {siteConfig.navigation.map((item) => (
              <a
                className="text-xs font-semibold text-footer-muted transition-colors hover:text-footer-accent"
                href={item.href}
                key={item.href}
              >
                {item.footerLabel}
              </a>
            ))}
          </nav>

          <div className="flex flex-col items-start gap-3">
            <span className="mb-1 text-[0.68rem] font-extrabold tracking-[0.075em] text-footer-foreground uppercase">
              {footer.contactHeading}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[0.58rem] font-extrabold tracking-[0.09em] text-footer-muted/70 uppercase">
                {contact.phoneLabel}
              </span>
              <a
                className="inline-flex items-center gap-2 text-xs font-bold text-footer-foreground transition-colors hover:text-footer-accent"
                href={siteConfig.contact.phoneHref}
              >
                <Phone
                  aria-hidden="true"
                  className="size-4 text-footer-accent"
                />
                {siteConfig.contact.phone || contact.phoneFallback}
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[0.58rem] font-extrabold tracking-[0.09em] text-footer-muted/70 uppercase">
                {contact.emailLabel}
              </span>
              <a
                className="inline-flex items-center gap-2 text-xs font-bold text-footer-foreground transition-colors hover:text-footer-accent"
                href={siteConfig.contact.emailHref}
              >
                <Mail
                  aria-hidden="true"
                  className="size-4 text-footer-accent"
                />
                {siteConfig.contact.email || contact.emailFallback}
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[0.58rem] font-extrabold tracking-[0.09em] text-footer-muted/70 uppercase">
                {contact.supportHoursLabel}
              </span>
              <strong className="text-[0.7rem] font-semibold text-footer-foreground">
                {siteConfig.contact.supportHours ||
                  contact.supportHoursFallback}
              </strong>
            </div>
            <a
              className="inline-flex items-center gap-2 text-[0.7rem] font-extrabold text-footer-accent transition-colors hover:text-footer-foreground"
              href={siteConfig.contact.whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              {contact.supportCallout}
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </Container>

        <Container className="grid gap-5 border-y border-footer-border py-5 sm:grid-cols-3 sm:gap-4">
          {footer.serviceItems.map((item, index) => (
            <div className="flex items-center gap-3" key={item.title}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-footer-border bg-footer-card text-footer-accent">
                {serviceIcons.at(index) ?? (
                  <ShieldCheck aria-hidden="true" className="size-[17px]" />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong className="text-[0.7rem] font-extrabold text-footer-foreground">
                  {item.title}
                </strong>
                <small className="text-[0.62rem] leading-5 text-footer-muted">
                  {item.description}
                </small>
              </span>
            </div>
          ))}
        </Container>

        <Container className="mt-5 grid gap-2 rounded-xl border border-l-[3px] border-footer-border border-l-footer-accent bg-footer-card/70 px-4 py-3 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4">
          <strong className="text-[0.62rem] font-extrabold tracking-[0.07em] text-footer-accent uppercase">
            {footer.noticeHeading}
          </strong>
          <p className="m-0 text-[0.62rem] leading-5 text-footer-muted">
            {footer.notice}
          </p>
        </Container>

        <Container className="mt-5 flex min-h-[54px] flex-col items-start justify-center gap-1.5 border-t border-footer-border text-[0.62rem] text-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
          </span>
          <a
            className="font-bold text-footer-foreground transition-colors hover:text-footer-accent"
            href="#contact"
          >
            {footer.supportLink}
          </a>
        </Container>
      </footer>
    </>
  )
}
