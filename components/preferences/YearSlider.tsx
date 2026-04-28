"use client"

import * as SliderPrimitive from "@radix-ui/react-slider"
import { useState } from "react"
import { Calendar } from "lucide-react"

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
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#475569]" strokeWidth={1.5} />
          <label className="text-sm font-medium text-[#F8FAFC]">
            Período
            <span className="ml-2 text-[#475569] text-xs font-normal">(opcional)</span>
          </label>
        </div>
        <button
          onClick={handleToggle}
          aria-label={enabled ? "Desactivar filtro de año" : "Activar filtro de año"}
          className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
            enabled ? "bg-[#E11D48]" : "bg-white/10"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
              enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3 px-1">
          <SliderPrimitive.Root
            min={MIN}
            max={MAX}
            step={1}
            value={values}
            onValueChange={handleChange}
            className="relative flex items-center w-full h-5"
          >
            <SliderPrimitive.Track className="relative h-px w-full bg-white/10 flex-1">
              <SliderPrimitive.Range className="absolute h-full bg-[#E11D48]" />
            </SliderPrimitive.Track>
            {values.map((_, i) => (
              <SliderPrimitive.Thumb
                key={i}
                className="block h-4 w-4 rounded-full bg-white border border-[#E11D48]/50 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E11D48] cursor-pointer transition-transform hover:scale-110"
              />
            ))}
          </SliderPrimitive.Root>
          <div className="flex justify-between text-xs text-[#475569] font-mono">
            <span>{values[0]}</span>
            <span>{values[1]}</span>
          </div>
        </div>
      )}
    </div>
  )
}
