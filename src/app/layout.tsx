/* eslint-disable @next/next/no-page-custom-font -- Hosted Google Fonts keep Cloudflare builds independent of Google Fonts availability. */
import type { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"
import "@/styles/main.css"

export const metadata: Metadata = {
  title: {
    default: "PCT24X7 | Pharmaceutical Healthcare",
    template: "%s | PCT24X7",
  },
  description:
    "PCT24X7 supplies generic medicines and ethical brand medications from India. Browse the pharmaceutical catalog or contact our team for ordering assistance.",
  keywords: [
    "PCT24X7",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}

/* eslint-enable @next/next/no-page-custom-font */
