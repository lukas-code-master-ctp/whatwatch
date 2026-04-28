"use client"

import { Tv } from "lucide-react"
import { Platform } from "@/lib/types"

const PLATFORMS: { id: Platform; label: string; dot: string }[] = [
  { id: "netflix",  label: "Netflix",      dot: "bg-red-500" },
  { id: "disney",   label: "Disney+",      dot: "bg-blue-400" },
  { id: "prime",    label: "Prime Video",  dot: "bg-sky-400" },
  { id: "hbo",      label: "Max",          dot: "bg-purple-400" },
  { id: "apple",    label: "Apple TV+",    dot: "bg-white" },
]

interface Props {
  selected: Platform[]
  onChange: (platforms: Platform[]) => void
}

export default function PlatformSelector({ selected, onChange }: Props) {
  function toggle(id: Platform) {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tv className="w-4 h-4 text-[#475569]" strokeWidth={1.5} />
        <label className="text-sm font-medium text-[#F8FAFC]">Plataformas disponibles</label>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ id, label, dot }) => {
          const active = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border ${
                active
                  ? "bg-[#0F0F23] border-[#E11D48]/50 text-[#F8FAFC]"
                  : "bg-transparent border-white/8 text-[#475569] hover:border-white/15 hover:text-[#94A3B8]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${active ? dot : "bg-white/20"}`} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
