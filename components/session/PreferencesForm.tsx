"use client"

import { useState } from "react"
import { ArrowRight, Loader2, MessageSquare, Film, Tv } from "lucide-react"
import MovieSearch from "@/components/preferences/MovieSearch"
import PlatformSelector from "@/components/preferences/PlatformSelector"
import YearSlider from "@/components/preferences/YearSlider"
import { Platform, UserPrefs, ContentType } from "@/lib/types"

interface Props {
  onSubmit: (prefs: UserPrefs) => Promise<void>
  submitting: boolean
  error?: string
}

export default function PreferencesForm({ onSubmit, submitting, error }: Props) {
  const [contentType, setContentType] = useState<ContentType>("movie")
  const [seeds, setSeeds] = useState<string[]>([])
  const [prompt, setPrompt] = useState("")
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)

  const hasInput = seeds.length >= 1 || prompt.trim().length > 0
  const canSubmit = hasInput && platforms.length >= 1 && !submitting
  const isSeries = contentType === "series"

  function handleContentTypeChange(type: ContentType) {
    setContentType(type)
    setSeeds([])
  }

  async function handleSubmit() {
    const prefs: UserPrefs = {
      contentType,
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
        className="fixed inset-x-0 top-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(225,29,72,0.06), transparent)" }}
      />

      <div className="max-w-5xl mx-auto px-5 md:px-10 py-10 relative z-10">

        {/* Content type toggle */}
        <div className="flex gap-1 p-1 rounded-2xl bg-[#0A0A1A] border border-white/6 mb-8 max-w-xs">
          <button
            onClick={() => handleContentTypeChange("movie")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              !isSeries
                ? "bg-[#E11D48] text-white shadow-[0_0_16px_rgba(225,29,72,0.35)]"
                : "text-[#475569] hover:text-[#94A3B8]"
            }`}
          >
            <Film className="w-4 h-4" strokeWidth={1.5} />
            Películas
          </button>
          <button
            onClick={() => handleContentTypeChange("series")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isSeries
                ? "bg-[#E11D48] text-white shadow-[0_0_16px_rgba(225,29,72,0.35)]"
                : "text-[#475569] hover:text-[#94A3B8]"
            }`}
          >
            <Tv className="w-4 h-4" strokeWidth={1.5} />
            Series
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-[#E11D48] font-mono tracking-widest uppercase mb-1">Paso 1 de 1</p>
          <h1 className="text-3xl font-bold text-[#F8FAFC]">Tus preferencias</h1>
          <p className="text-[#475569] mt-1">
            {isSeries ? "Cuéntanos qué serie te apetece ver esta noche" : "Cuéntanos qué te apetece ver esta noche"}
          </p>
        </div>

        {/* Two-column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Left column: References + Prompt */}
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-[#0A0A1A] border border-white/6 h-full space-y-5">
              <MovieSearch selected={seeds} onChange={setSeeds} contentType={contentType} />

              <div className="border-t border-white/6 pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#475569]" strokeWidth={1.5} />
                  <label className="text-sm font-medium text-[#F8FAFC]">
                    O describe lo que buscas
                    <span className="ml-2 text-[#475569] text-xs font-normal">(opcional)</span>
                  </label>
                </div>
                <p className="text-xs text-[#475569]">
                  Un texto libre que refina la búsqueda — se combina con tus referencias
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    isSeries
                      ? 'ej: "algo para ver en familia" o "drama político con muchos giros"'
                      : 'ej: "algo para reír en familia" o "thriller psicológico con giro final"'
                  }
                  rows={4}
                  className="w-full bg-[#0F0F23] border border-white/8 hover:border-white/15 focus:border-[#E11D48]/50 rounded-xl px-4 py-3 text-sm transition-colors outline-none placeholder:text-[#2A2A4A] resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Right column: Platforms + Year */}
          <div className="space-y-5">
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
        </div>

        {/* Bottom: error + hint + submit */}
        <div className="mt-6 space-y-4">
          {error && (
            <p className="text-[#E11D48] text-sm text-center bg-[#E11D48]/8 border border-[#E11D48]/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {!hasInput && (
            <p className="text-xs text-[#475569] text-center">
              {isSeries
                ? "Agrega al menos una serie de referencia o escribe un texto libre"
                : "Agrega al menos una película de referencia o escribe un texto libre"}
            </p>
          )}

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
                {isSeries ? "Listo, buscar series" : "Listo, buscar películas"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
