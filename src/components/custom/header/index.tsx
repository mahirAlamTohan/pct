"use client"

import { HEADER_MENU } from "@/mock/header-menu"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "../Logo"

const Header = () => {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-evenly gap-4 px-8 py-3">
      <div>buttons-left</div>

      <div className="flex w-5/8 items-center justify-between rounded-full border border-border/30 bg-card p-3 px-8 shadow">
        <Logo />

        <ul className="flex items-center gap-2 text-sm font-medium">
          {HEADER_MENU.map((item) => {
            const isActive = pathname === item.href

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`relative z-10 block rounded-full px-5 py-3 transition-colors duration-200 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-foreground hover:text-foreground"
                  }`}
                >
                  {/* This is the moving primary pill */}
                  {isActive && (
                    <motion.span
                      layoutId="header-active-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  <motion.span
                    whileHover={{ y: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="relative"
                  >
                    {item.title}
                  </motion.span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div>contact-right</div>
    </div>
  )
}

export default Header
