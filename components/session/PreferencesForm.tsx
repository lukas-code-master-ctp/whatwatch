"use client"

import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import MovieSearch from "@/components/preferences/MovieSearch"
import PlatformSelector from "@/components/preferences/PlatformSelector"
import YearSlider from "@/components/preferences/YearSlider"
import { Platform, UserPrefs } from "@/lib/types"

interface Props {
  onSubmit: (prefs: UserPrefs) => Promise<void>
  submitting: boolean
}

export default function PreferencesForm({ onSubmit, submitting }: Props) {
  const [seeds, setSeeds] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>(["netflix", "disney", "prime", "hbo", "apple"])
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)

  const canSubmit = seeds.length >= 1 && platforms.length >= 1 && !submitting

  async function handleSubmit() {
    const prefs: UserPrefs = {
      seeds,
      platforms,
      filters: { yearFrom, yearTo, genres: null, duration: null },
    }
    await onSubmit(prefs)
  }

  return (
    <div className="min-h-screen cinema-grid">
      {/* Top gradient */}
      <div
        className="fixed inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(225,29,72,0.06), transparent)" }}
      />

      <div className="max-w-lg mx-auto px-5 py-10 space-y-8 relative z-10">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs text-[#E11D48] font-mono tracking-widest uppercase">Paso 1 de 1</p>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Tus preferencias</h1>
          <p className="text-[#475569] text-sm">Cuéntanos qué te apetece ver esta noche</p>
        </div>

        {/* Form sections */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0A0A1A] border border-white/6">
            <MovieSearch selected={seeds} onChange={setSeeds} />
          </div>

          <div className="p-5 rounded-2xl bg-[#0A0A1A] border border-white/6">
            <PlatformSelector selected={platforms} onChange={setPlatforms} />
          </div>

          <div className="p-5 rounded-2xl bg-[#0A0A1A] border border-white/6">
            <YearSlider
              yearFrom={yearFrom}
              yearTo={yearTo}
              onChange={(from, to) => { setYearFrom(from); setYearTo(to) }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 bg-[#E11D48] hover:bg-[#BE1942] disabled:opacity-30 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all duration-200 cursor-pointer glow-red-box hover:scale-[1.01] active:scale-[0.99]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Listo, buscar películas
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
