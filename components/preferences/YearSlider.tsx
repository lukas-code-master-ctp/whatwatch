"use client"

import * as SliderPrimitive from "@radix-ui/react-slider"
import { useState } from "react"

interface Props {
  yearFrom: number | null
  yearTo: number | null
  onChange: (from: number | null, to: number | null) => void
}

const MIN = 1950
const MAX = 2025

export default function YearSlider({ yearFrom, yearTo, onChange }: Props) {
  const [enabled, setEnabled] = useState(yearFrom !== null)
  const values = [yearFrom ?? MIN, yearTo ?? MAX]

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    onChange(next ? MIN : null, next ? MAX : null)
  }

  function handleChange(vals: number[]) {
    onChange(vals[0], vals[1])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-400">
          📅 Período de la película
          <span className="ml-2 text-zinc-600 text-xs">(opcional)</span>
        </label>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
            enabled ? "bg-violet-600" : "bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
              enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-2 px-1">
          <SliderPrimitive.Root
            min={MIN}
            max={MAX}
            step={1}
            value={values}
            onValueChange={handleChange}
            className="relative flex items-center w-full h-5"
          >
            <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-zinc-700 flex-1">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-violet-500" />
            </SliderPrimitive.Track>
            {values.map((_, i) => (
              <SliderPrimitive.Thumb
                key={i}
                className="block h-4 w-4 rounded-full bg-violet-500 border-2 border-white shadow focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
              />
            ))}
          </SliderPrimitive.Root>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{values[0]}</span>
            <span>{values[1]}</span>
          </div>
        </div>
      )}
    </div>
  )
}
