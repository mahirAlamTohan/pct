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
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export function AboutContactSection() {
  return (
    <>
      <section className="about-section page-section" id="about">
        <div className="site-container about-grid">
          <Reveal className="about-copy">
            <span className="eyebrow">
              <Pill aria-hidden="true" size={15} />
              About {siteConfig.name}
            </span>
            <h2>Reliable healthcare supply, built on trust.</h2>
            <p>
              {siteConfig.name} has supplied generic medicines and ethical-brand
              medications from India since {siteConfig.founded}, with a focus on
              reliable service, competitive pricing and international shipping.
            </p>
            <div className="about-highlights">
              <div>
                <ShieldCheck aria-hidden="true" size={19} />
                <span>Quality focused</span>
              </div>
              <div>
                <Globe2 aria-hidden="true" size={19} />
                <span>International support</span>
              </div>
            </div>
          </Reveal>

          <Reveal
            aria-label={`${siteConfig.name} service details`}
            className="about-visual"
            delay={0.12}
          >
            <div className="about-stat-card">
              <span className="stat-icon">
                <Pill aria-hidden="true" size={20} />
              </span>
              <span className="stat-number">{siteConfig.founded}</span>
              <span className="stat-label">Serving customers since</span>
              <span className="stat-rule" />
              <p>Thoughtful service and dependable healthcare supply.</p>
            </div>
            <div className="about-note-card">
              <span className="note-icon">
                <Globe2 aria-hidden="true" size={19} />
              </span>
              <div>
                <strong>International shipping</strong>
                <span>USA · UK · New Zealand · Australia</span>
              </div>
            </div>
            <span aria-hidden="true" className="about-orbit orbit-one" />
            <span aria-hidden="true" className="about-orbit orbit-two" />
          </Reveal>
        </div>
      </section>

      <section className="contact-section page-section" id="contact">
        <div className="site-container">
          <Reveal className="contact-panel" delay={0.04}>
            <div className="contact-panel-copy">
              <span className="eyebrow eyebrow-inverse">
                <MessageCircle aria-hidden="true" size={15} />
                Contact our team
              </span>
              <h2>We’re here to help you find what you need.</h2>
              <p>
                For product availability and orders, reach out by WhatsApp or
                email. Our team is ready to assist.
              </p>
              <div className="contact-ctas">
                <Button
                  asChild
                  className="button-white"
                  size="sm"
                  variant="secondary"
                >
                  <a
                    href={siteConfig.contact.whatsappHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <MessageCircle aria-hidden="true" />
                    Message on WhatsApp
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
                <a
                  className="contact-email-link"
                  href={siteConfig.contact.emailHref}
                >
                  <Mail aria-hidden="true" size={16} />
                  {siteConfig.contact.email}
                </a>
              </div>
            </div>

            <div className="contact-details">
              <div className="contact-detail">
                <span className="contact-detail-icon">
                  <Phone aria-hidden="true" size={17} />
                </span>
                <div>
                  <span>Phone / WhatsApp</span>
                  <a href={siteConfig.contact.phoneHref}>
                    {siteConfig.contact.phone}
                  </a>
                </div>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-icon">
                  <Mail aria-hidden="true" size={17} />
                </span>
                <div>
                  <span>Email</span>
                  <a href={siteConfig.contact.emailHref}>
                    {siteConfig.contact.email}
                  </a>
                </div>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-icon">
                  <Clock3 aria-hidden="true" size={17} />
                </span>
                <div>
                  <span>Support hours</span>
                  <strong>{siteConfig.contact.supportHours}</strong>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-container footer-main">
          <div className="footer-brand-block">
            <Brand footer />
            <span className="footer-brand-kicker">
              Reliable Healthcare Supply
            </span>
            <p>
              {siteConfig.name} has supplied generic medicines and ethical-brand
              medications from India since {siteConfig.founded}, with a focus on
              reliable service, competitive pricing and international shipping.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="footer-links-block">
            <span className="footer-heading">Quick links</span>
            {siteConfig.navigation.map((item) => (
              <a href={item.href} key={item.href}>
                {item.footerLabel}
              </a>
            ))}
          </nav>

          <div className="footer-contact-block">
            <span className="footer-heading">Contact us</span>
            <div className="footer-contact-item">
              <span>Phone</span>
              <a href={siteConfig.contact.phoneHref}>
                <Phone aria-hidden="true" size={15} />
                {siteConfig.contact.phone}
              </a>
            </div>
            <div className="footer-contact-item">
              <span>Email</span>
              <a href={siteConfig.contact.emailHref}>
                <Mail aria-hidden="true" size={15} />
                {siteConfig.contact.email}
              </a>
            </div>
            <div className="footer-contact-item">
              <span>Support hours</span>
              <strong>{siteConfig.contact.supportHours}</strong>
            </div>
            <a
              className="footer-whatsapp-link"
              href={siteConfig.contact.whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" size={15} />
              Responsive support
              <ArrowUpRight aria-hidden="true" size={13} />
            </a>
          </div>
        </div>

        <div className="site-container footer-service-row">
          <div>
            <span className="footer-service-icon">
              <MessageCircle aria-hidden="true" size={17} />
            </span>
            <span>
              <strong>Responsive Support</strong>
              <small>Assistance for your queries</small>
            </span>
          </div>
          <div>
            <span className="footer-service-icon">
              <Globe2 aria-hidden="true" size={17} />
            </span>
            <span>
              <strong>International Shipping</strong>
              <small>USA · UK · New Zealand · Australia</small>
            </span>
          </div>
          <div>
            <span className="footer-service-icon">
              <ShieldCheck aria-hidden="true" size={17} />
            </span>
            <span>
              <strong>Quality Focused</strong>
              <small>Reliable pharmaceutical supply</small>
            </span>
          </div>
        </div>

        <div className="site-container footer-notice">
          <strong>Important notice</strong>
          <p>
            Information on this website is for general informational purposes
            only and should not replace professional medical advice.
            Prescription medicines should be used only under the guidance of a
            qualified healthcare professional.
          </p>
        </div>

        <div className="site-container footer-bottom">
          <span>
            © {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
          </span>
          <a href="#contact">Contact support</a>
        </div>
      </footer>
    </>
  )
}
