import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-300 px-4 sm:px-5 lg:px-6", className)}
      {...props}
    />
  )
}
