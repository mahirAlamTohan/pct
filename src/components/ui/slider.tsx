"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  minimumLabel: string
  maximumLabel: string
  onValueChange: (value: [number, number]) => void
}

export function RangeSlider({
  min,
  max,
  step = 0.01,
  value,
  minimumLabel,
  maximumLabel,
  onValueChange,
}: RangeSliderProps) {
  return (
    <SliderPrimitive.Root<number[]>
      max={max}
      min={min}
      step={step}
      value={value}
      onValueChange={(nextValue) => {
        onValueChange([nextValue[0], nextValue[1]])
      }}
    >
      <SliderPrimitive.Control className="relative flex h-8 w-full touch-none items-center px-2 select-none">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-muted">
          <SliderPrimitive.Indicator className="absolute h-full rounded-full bg-linear-to-r from-primary to-sky-400" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="relative block size-5 rounded-full border-2 border-primary bg-background shadow-md shadow-primary/25 ring-offset-background transition-shadow hover:shadow-lg focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none"
          getAriaLabel={() => minimumLabel}
          getAriaValueText={(_formattedValue, currentValue) =>
            `${minimumLabel}: $${currentValue.toFixed(2)}`
          }
          index={0}
        />
        <SliderPrimitive.Thumb
          className="relative block size-5 rounded-full border-2 border-primary bg-background shadow-md shadow-primary/25 ring-offset-background transition-shadow hover:shadow-lg focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none"
          getAriaLabel={() => maximumLabel}
          getAriaValueText={(_formattedValue, currentValue) =>
            `${maximumLabel}: $${currentValue.toFixed(2)}`
          }
          index={1}
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
