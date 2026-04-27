"use client"

import { useState } from "react"
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
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tus preferencias</h1>
        <p className="text-zinc-400 text-sm mt-1">Dinos qué tipo de películas te gustan hoy</p>
      </div>

      <MovieSearch selected={seeds} onChange={setSeeds} />

      <PlatformSelector selected={platforms} onChange={setPlatforms} />

      <YearSlider
        yearFrom={yearFrom}
        yearTo={yearTo}
        onChange={(from, to) => { setYearFrom(from); setYearTo(to) }}
      />

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white py-3 rounded-xl font-medium transition-colors"
      >
        {submitting ? "Guardando..." : "Listo →"}
      </button>
    </div>
  )
}
