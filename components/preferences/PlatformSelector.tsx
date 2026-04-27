"use client"

import { Platform } from "@/lib/types"

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: "netflix", label: "Netflix", color: "bg-red-600" },
  { id: "disney", label: "Disney+", color: "bg-blue-600" },
  { id: "prime", label: "Prime Video", color: "bg-sky-500" },
  { id: "hbo", label: "Max (HBO)", color: "bg-purple-600" },
  { id: "apple", label: "Apple TV+", color: "bg-zinc-600" },
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
      <label className="text-sm text-zinc-400">Mis plataformas de streaming</label>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ id, label, color }) => {
          const active = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                active
                  ? `${color} border-transparent text-white`
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
