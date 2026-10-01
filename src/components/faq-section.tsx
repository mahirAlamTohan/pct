import { ArrowRight, CircleHelp } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FAQS } from "@/data/faq"
import { Reveal } from "@/components/reveal"

export function FAQSection() {
  return (
    <section className="faq-section page-section" id="faq">
      <div className="site-container faq-layout">
        <Reveal className="faq-intro">
          <span className="eyebrow">
            <CircleHelp aria-hidden="true" size={15} />
            Good to know
          </span>
          <h2>Frequently asked questions</h2>
          <p>
            Find answers to common questions about our pharmaceutical catalog,
            products, downloads and supply.
          </p>
          <a className="text-link" href="#contact">
            Still have a question? Get in touch
            <ArrowRight aria-hidden="true" size={16} />
          </a>
        </Reveal>

        <Reveal className="faq-reveal" delay={0.1}>
          <Accordion
            className="faq-list overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            collapsible
            defaultValue="faq-0"
            type="single"
          >
            {FAQS.map((item, index) => (
              <AccordionItem
                className="faq-item"
                key={item.question}
                value={`faq-${index.toString()}`}
              >
                <AccordionTrigger className="faq-trigger min-h-16 px-5 py-4 text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="faq-content px-5">
                  <p className="m-0 max-w-184 text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
