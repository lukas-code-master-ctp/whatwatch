"use client"

import { useState } from "react"
import { ArrowRight, Loader2, MessageSquare } from "lucide-react"
import MovieSearch from "@/components/preferences/MovieSearch"
import PlatformSelector from "@/components/preferences/PlatformSelector"
import YearSlider from "@/components/preferences/YearSlider"
import { Platform, UserPrefs } from "@/lib/types"

interface Props {
  onSubmit: (prefs: UserPrefs) => Promise<void>
  submitting: boolean
  error?: string
}

export default function PreferencesForm({ onSubmit, submitting, error }: Props) {
  const [seeds, setSeeds] = useState<string[]>([])
  const [prompt, setPrompt] = useState("")
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)

  const hasInput = seeds.length >= 1 || prompt.trim().length > 0
  const canSubmit = hasInput && platforms.length >= 1 && !submitting

  async function handleSubmit() {
    const prefs: UserPrefs = {
      seeds,
      prompt: prompt.trim() || undefined,
      platforms,
      filters: { yearFrom, yearTo, genres: null, duration: null },
    }
    await onSubmit(prefs)
  }

  return (
    <div className="min-h-screen cinema-grid">
      <div
        className="fixed inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(225,29,72,0.06), transparent)" }}
      />

      <div className="max-w-lg mx-auto px-5 py-10 space-y-6 relative z-10">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs text-[#E11D48] font-mono tracking-widest uppercase">Paso 1 de 1</p>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Tus preferencias</h1>
          <p className="text-[#475569] text-sm">Cuéntanos qué te apetece ver esta noche</p>
        </div>

        {/* References + Prompt */}
        <div className="p-5 rounded-2xl bg-[#0A0A1A] border border-white/6 space-y-5">
          <MovieSearch selected={seeds} onChange={setSeeds} />

          <div className="border-t border-white/6 pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#475569]" strokeWidth={1.5} />
              <label className="text-sm font-medium text-[#F8FAFC]">
                O describe lo que buscas
                <span className="ml-2 text-[#475569] text-xs font-normal">(opcional)</span>
              </label>
            </div>
            <p className="text-xs text-[#475569]">Un texto libre que refina la búsqueda — se combina con tus referencias</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='ej: "algo para reír en familia" o "thriller psicológico con giro final"'
              rows={3}
              className="w-full bg-[#0F0F23] border border-white/8 hover:border-white/15 focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-sm transition-colors outline-none placeholder:text-[#2A2A4A] resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Platforms */}
        <div className="p-5 rounded-2xl bg-[#0A0A1A] border border-white/6">
          <PlatformSelector selected={platforms} onChange={setPlatforms} />
        </div>

        {/* Year filter */}
        <div className="p-5 rounded-2xl bg-[#0A0A1A] border border-white/6">
          <YearSlider
            yearFrom={yearFrom}
            yearTo={yearTo}
            onChange={(from, to) => { setYearFrom(from); setYearTo(to) }}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-[#E11D48] text-sm text-center bg-[#E11D48]/8 border border-[#E11D48]/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Hint if nothing filled yet */}
        {!hasInput && (
          <p className="text-xs text-[#475569] text-center">
            Agrega al menos una película de referencia o escribe un texto libre
          </p>
        )}

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
