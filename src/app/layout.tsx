import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"

import { OfflineStatus } from "@/components/offline-status"
import { PwaRegistration } from "@/components/pwa-registration"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { siteConfig } from "@/config/site"
import "@/styles/main.css"

const bodyFont = localFont({
  display: "swap",
  src: "../fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "200 800",
})

const headingFont = localFont({
  display: "swap",
  src: "../fonts/dm-sans-latin-wght-normal.woff2",
  variable: "--font-heading",
  weight: "100 1000",
})

const pageTitle = `${siteConfig.name} | ${siteConfig.tagline}`
const openGraphDescription =
  "Quality medicines support better healthcare. Browse the pharmaceutical catalog or contact our team for ordering assistance."

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f5fb5",
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: pageTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    siteConfig.name,
    "pharmaceutical catalog",
    "generic medicines",
    "healthcare supply",
  ],
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: pageTitle,
    description: openGraphDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PCT24X7 — quality medicines for better healthcare",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: openGraphDescription,
    images: ["/opengraph-image"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${bodyFont.variable} ${headingFont.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <PwaRegistration />
          <OfflineStatus />
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
