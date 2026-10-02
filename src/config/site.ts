import type { SiteConfig } from "@/types/site"

const DEFAULT_SITE_NAME = "PCT24X7"
const DEFAULT_SITE_URL = "https://pct.mahiralamtohan.workers.dev"

function publicValue(value: string | undefined, fallback = "") {
  const trimmed = value?.trim()
  if (!trimmed) return fallback
  return trimmed
}

function publicSiteUrl(value: string | undefined) {
  const url = new URL(publicValue(value, DEFAULT_SITE_URL))
  if (url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS.")
  }
  return url.origin
}

const contactPhone = publicValue(process.env.NEXT_PUBLIC_CONTACT_PHONE)
const whatsappNumber = publicValue(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
).replace(/\D/g, "")
const contactEmail = publicValue(process.env.NEXT_PUBLIC_CONTACT_EMAIL)

export const siteConfig = {
  name: publicValue(process.env.NEXT_PUBLIC_SITE_NAME, DEFAULT_SITE_NAME),
  url: publicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  tagline: "Pharmaceutical healthcare you can trust",
  description:
    "PCT24X7 supplies generic medicines and ethical brand medications from India. Browse the pharmaceutical catalog or contact our team for ordering assistance.",
  founded: 2012,
  copyrightYear: new Date().getFullYear(),
  navigation: [
    { label: "Home", mobileLabel: "Home", footerLabel: "Home", href: "#home" },
    {
      label: "About Us",
      mobileLabel: "About",
      footerLabel: "About Us",
      href: "#about",
    },
    {
      label: "Catalog",
      mobileLabel: "Catalog",
      footerLabel: "Pharmaceutical Catalog",
      href: "#catalog",
    },
    {
      label: "FAQs",
      mobileLabel: "FAQs",
      footerLabel: "FAQs & Shipping Information",
      href: "#faq",
    },
    {
      label: "Contact Us",
      mobileLabel: "Contact",
      footerLabel: "Contact Us",
      href: "#contact",
    },
  ],
  contact: {
    phone: contactPhone,
    phoneHref: contactPhone
      ? `tel:${contactPhone.replace(/[^\d+]/g, "")}`
      : "#contact",
    whatsappNumber,
    whatsappHref: whatsappNumber
      ? `https://wa.me/${whatsappNumber}`
      : "#contact",
    email: contactEmail,
    emailHref: contactEmail ? `mailto:${contactEmail}` : "#contact",
    supportHours: publicValue(process.env.NEXT_PUBLIC_SUPPORT_HOURS),
  },
  catalog: {
    dataUrl: publicValue(process.env.NEXT_PUBLIC_CATALOG_DATA_URL),
    xorKey: publicValue(process.env.NEXT_PUBLIC_CATALOG_XOR_KEY),
    pdfUrl: publicValue(process.env.NEXT_PUBLIC_CATALOG_PDF_URL),
  },
} satisfies SiteConfig
