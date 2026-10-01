import { AboutContactSection } from "@/components/about-contact-section"
import { CatalogExplorer } from "@/components/catalog-explorer"
import { FAQSection } from "@/components/faq-section"
import { HeroSection } from "@/components/hero-section"
import { siteConfig } from "@/config/site"
import { CATALOG_PRODUCTS } from "@/data/catalog"

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <CatalogExplorer
        products={CATALOG_PRODUCTS}
        catalogDataUrl={siteConfig.catalog.dataUrl}
      />
      <FAQSection />
      <AboutContactSection />
    </main>
  )
}
