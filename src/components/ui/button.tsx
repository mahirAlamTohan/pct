import { Button as BaseButton } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "motion-safe:active:scale-0.98 inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0",
        destructive:
          "bg-destructive text-white shadow-md shadow-destructive/15 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-lg active:translate-y-0",
        outline:
          "border border-input bg-background text-foreground shadow-sm hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/80 hover:shadow-md active:translate-y-0",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type BaseButtonProps = Omit<ComponentProps<typeof BaseButton>, "className">

export interface ButtonProps
  extends BaseButtonProps, VariantProps<typeof buttonVariants> {
  className?: string
}

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      className={cn(buttonVariants({ size, variant }), className)}
      type={type}
      {...props}
    />
  )
}

export interface ButtonLinkProps
  extends ComponentProps<"a">, VariantProps<typeof buttonVariants> {}

export function ButtonLink({
  className,
  size,
  variant,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      data-slot="button-link"
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  )
}
