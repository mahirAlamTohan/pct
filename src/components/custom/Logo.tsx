"use client"
import { Pill } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"

const Logo = () => {
  return (
    <Link href="/" className="inline-block">
      <motion.div
        whileHover="hover"
        initial="initial"
        className="flex items-center gap-2 text-center"
      >
        <motion.span
          variants={{ hover: { scale: 1.1 } }}
          transition={{ duration: 0.1 }}
          className="rounded bg-radial-[at_25%_25%] from-cyan-700 from-50% to-green-500 p-2 text-gray-50"
        >
          <Pill className="size-7 stroke-3" />
        </motion.span>

        <motion.h1
          variants={{
            initial: { color: "var(--foreground)" },
            hover: { color: "var(--primary)" },
          }}
          transition={{ duration: 0.1 }}
          className="text-xl font-bold"
        >
          PCT
        </motion.h1>
      </motion.div>
    </Link>
  )
}

export default Logo
