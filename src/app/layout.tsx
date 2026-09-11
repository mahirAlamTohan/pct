import { Geist, Geist_Mono, Noto_Sans } from "next/font/google"

import Header from "@/components/custom/header"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import "@/styles/main.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "PCT",
    template: "%s | PCT",
  },
  description: "Welcome to PCT.",
}

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" })

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        notoSans.variable,
        geistHeading.variable
      )}
    >
      <body>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
