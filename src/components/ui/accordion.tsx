import { Accordion as BaseAccordion } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const Accordion = BaseAccordion.Root

type AccordionItemProps = Omit<
  ComponentProps<typeof BaseAccordion.Item>,
  "className"
> & { className?: string }

type AccordionTriggerProps = Omit<
  ComponentProps<typeof BaseAccordion.Trigger>,
  "className"
> & { className?: string }

type AccordionContentProps = Omit<
  ComponentProps<typeof BaseAccordion.Panel>,
  "className"
> & { className?: string }

export function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <BaseAccordion.Item
      data-slot="accordion-item"
      className={cn("border-b border-border last:border-b-0", className)}
      {...props}
    />
  )
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header className="m-0 flex">
      <BaseAccordion.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex min-h-16 flex-1 items-center justify-between gap-4 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary-text focus-visible:relative focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out group-data-panel-open:rotate-180 group-data-panel-open:text-primary-text"
        />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  )
}

export function AccordionContent({
  children,
  className,
  ...props
}: AccordionContentProps) {
  return (
    <BaseAccordion.Panel
      data-slot="accordion-panel"
      className={cn(
        "h-(--accordion-panel-height) overflow-hidden text-sm text-muted-foreground transition-[height] duration-300 ease-out data-ending-style:h-0 data-starting-style:h-0",
        className
      )}
      {...props}
    >
      <div className="pb-5 leading-7">{children}</div>
    </BaseAccordion.Panel>
  )
}
