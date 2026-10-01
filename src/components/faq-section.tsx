import { ChevronDown, CircleHelp } from "lucide-react"

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
            Still have a question? Get in touch{" "}
            <span aria-hidden="true">→</span>
          </a>
        </Reveal>

        <Reveal className="faq-list" delay={0.1}>
          {FAQS.map((item, index) => (
            <details
              className="faq-item"
              key={item.question}
              open={index === 0}
            >
              <summary>
                <span>{item.question}</span>
                <ChevronDown aria-hidden="true" size={18} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
