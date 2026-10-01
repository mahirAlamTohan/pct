import type { Metadata } from "next"
import localFont from "next/font/local"

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

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    siteConfig.name,
    "pharmaceutical catalog",
    "generic medicines",
    "healthcare supply",
  ],
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
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
