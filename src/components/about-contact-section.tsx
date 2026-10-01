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

import { Reveal } from "@/components/reveal"

const PHONE_NUMBER = "+91 8766267499"
const EMAIL_ADDRESS = "shop@pct24x7.store"
const WHATSAPP_URL = "https://wa.me/918766267499"

export function AboutContactSection() {
  return (
    <>
      <section className="about-section page-section" id="about">
        <div className="site-container about-grid">
          <Reveal className="about-copy">
            <span className="eyebrow">
              <Pill aria-hidden="true" size={15} />
              About PCT24X7
            </span>
            <h2>Reliable healthcare supply, built on trust.</h2>
            <p>
              PCT24X7 has been supplying generic medicines and ethical brand
              medications from India since 2012, with a focus on reliable
              service, competitive pricing and international shipping.
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
            className="about-visual"
            delay={0.12}
            aria-label="PCT24X7 service details"
          >
            <div className="about-stat-card">
              <span className="stat-icon">
                <Pill aria-hidden="true" size={20} />
              </span>
              <span className="stat-number">2012</span>
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
            <span className="about-orbit orbit-one" aria-hidden="true" />
            <span className="about-orbit orbit-two" aria-hidden="true" />
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
                <a
                  className="button button-white"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle aria-hidden="true" size={17} />
                  Message on WhatsApp
                  <ArrowUpRight aria-hidden="true" size={15} />
                </a>
                <a
                  className="contact-email-link"
                  href={`mailto:${EMAIL_ADDRESS}`}
                >
                  <Mail aria-hidden="true" size={16} />
                  {EMAIL_ADDRESS}
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
                  <a href={`tel:${PHONE_NUMBER.replaceAll(" ", "")}`}>
                    {PHONE_NUMBER}
                  </a>
                </div>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-icon">
                  <Mail aria-hidden="true" size={17} />
                </span>
                <div>
                  <span>Email</span>
                  <a href={`mailto:${EMAIL_ADDRESS}`}>{EMAIL_ADDRESS}</a>
                </div>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-icon">
                  <Clock3 aria-hidden="true" size={17} />
                </span>
                <div>
                  <span>Support hours</span>
                  <strong>Mon – Sat · 9:00 AM – 8:00 PM IST</strong>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-container footer-main">
          <div className="footer-brand-block">
            <a
              className="brand brand-footer"
              href="#home"
              aria-label="PCT24X7 home"
            >
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
            <span className="footer-brand-kicker">
              Reliable Healthcare Supply
            </span>
            <p>
              PCT24X7 has supplied generic medicines and ethical brand
              medications from India since 2012, with a focus on reliable
              service, competitive pricing and international shipping.
            </p>
          </div>

          <nav className="footer-links-block" aria-label="Footer navigation">
            <span className="footer-heading">Quick links</span>
            <a href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#catalog">Pharmaceutical Catalog</a>
            <a href="#faq">FAQs &amp; Shipping Information</a>
            <a href="#contact">Contact Us</a>
          </nav>

          <div className="footer-contact-block">
            <span className="footer-heading">Contact us</span>
            <div className="footer-contact-item">
              <span>Phone</span>
              <a href={`tel:${PHONE_NUMBER.replaceAll(" ", "")}`}>
                <Phone aria-hidden="true" size={15} />
                {PHONE_NUMBER}
              </a>
            </div>
            <div className="footer-contact-item">
              <span>Email</span>
              <a href={`mailto:${EMAIL_ADDRESS}`}>
                <Mail aria-hidden="true" size={15} />
                {EMAIL_ADDRESS}
              </a>
            </div>
            <div className="footer-contact-item">
              <span>Support hours</span>
              <strong>Monday – Saturday · 9:00 AM – 8:00 PM IST</strong>
            </div>
            <a
              className="footer-whatsapp-link"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
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
          <span>© 2026 PCT24X7. All rights reserved.</span>
          <a href="#contact">Contact support</a>
        </div>
      </footer>
    </>
  )
}
