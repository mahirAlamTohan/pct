import { AboutContactSection } from "@/components/about-contact-section"
import { CatalogExplorer } from "@/components/catalog-explorer"
import { FAQSection } from "@/components/faq-section"
import { FloatingActions } from "@/components/floating-actions"
import { HeroSection } from "@/components/hero-section"
import { siteConfig } from "@/config/site"

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <CatalogExplorer catalogDataUrl={siteConfig.catalog.dataUrl} />
      <FAQSection />
      <AboutContactSection />
      <FloatingActions />
    </main>
  )
}
