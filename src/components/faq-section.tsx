import { ArrowRight, CircleHelp } from "lucide-react"

import { Reveal } from "@/components/reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Container } from "@/components/ui/container"
import { siteContent } from "@/config/content"

export function FAQSection() {
  const faq = siteContent.faq

  return (
    <section
      className="bg-linear-to-br from-faq-start via-faq-middle to-faq-end py-16 sm:py-20 lg:py-24"
      id="faq"
    >
      <Container className="grid items-start gap-8 md:grid-cols-[minmax(250px,0.82fr)_minmax(0,1.4fr)] md:gap-12 lg:gap-24">
        <Reveal className="md:sticky md:top-36">
          <span className="inline-flex items-center gap-2 text-[0.68rem] font-extrabold tracking-[0.12em] text-primary uppercase">
            <CircleHelp aria-hidden="true" className="size-4" />
            {faq.eyebrow}
          </span>
          <h2 className="mt-3 max-w-sm font-display text-[clamp(1.95rem,3.5vw,2.55rem)] leading-tight font-extrabold tracking-[-0.045em] text-ink dark:text-foreground">
            {faq.title}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
            {faq.description}
          </p>
          <a
            className="group mt-5 inline-flex items-center gap-2 text-xs font-bold text-blue-700 transition-colors hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
            href="#contact"
          >
            {faq.contactPrompt}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </a>
        </Reveal>

        <Reveal className="min-w-0" delay={0.1}>
          <Accordion
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            defaultValue={["faq-0"]}
          >
            {faq.items.map((item, index) => (
              <AccordionItem
                className="px-4 sm:px-5"
                key={item.question}
                value={`faq-${index.toString()}`}
              >
                <AccordionTrigger className="py-4 text-left hover:text-primary sm:py-[1.15rem]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pr-3 text-sm leading-7 text-muted-foreground">
                  <p className="m-0 max-w-3xl">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </section>
  )
}
