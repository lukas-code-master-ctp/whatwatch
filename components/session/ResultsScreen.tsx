"use client"

import { useState } from "react"
import { RefreshCw, Loader2, Sparkles, Info } from "lucide-react"
import { Movie, UserPrefs } from "@/lib/types"
import MovieCard from "@/components/ui/MovieCard"

interface Props {
  initialMovies: Movie[]
  sessionId: string
  userSeeds: string[][]
  mode: "couple" | "solo"
  allPrefs: UserPrefs[]
}

export default function ResultsScreen({ initialMovies, sessionId, userSeeds, mode, allPrefs }: Props) {
  const isSeries = allPrefs[0]?.contentType === "series"
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [shown, setShown] = useState<string[]>(initialMovies.map((m) => m.title))
  const [loading, setLoading] = useState(false)

  async function loadMore() {
    setLoading(true)
    try {
      const res = await fetch(`/api/session/${sessionId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: allPrefs, mode, exclude: shown }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      if (data.results) {
        const newMovies: Movie[] = data.results
        setMovies(newMovies)
        setShown((prev) => [...prev, ...newMovies.map((m) => m.title)])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen cinema-grid">
      {/* Top gradient */}
      <div
        className="fixed inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(225,29,72,0.06), transparent)" }}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-10 py-10 relative z-10">
        {/* Header */}
        <div className="mb-7 space-y-2">
          <div className="flex items-center gap-2 text-[#E11D48] text-xs md:text-sm font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Selección IA
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-[#F8FAFC]">
            {movies.length} {isSeries ? "series" : "películas"} para esta noche
          </h1>

          {/* Seeds attribution */}
          {userSeeds.length > 0 && (
            <div className="space-y-1 pt-1">
              {mode === "solo" && userSeeds[0]?.length > 0 && (
                <p className="text-sm md:text-base text-[#64748B]">
                  Basado en:{" "}
                  <span className="text-[#94A3B8]">{userSeeds[0].join(", ")}</span>
                </p>
              )}
              {mode === "couple" && (
                <div className="space-y-0.5">
                  {userSeeds[0]?.length > 0 && (
                    <p className="text-sm text-[#64748B]">
                      <span className="text-[#E11D48] font-medium">Tú:</span>{" "}
                      <span className="text-[#94A3B8]">{userSeeds[0].join(", ")}</span>
                    </p>
                  )}
                  {userSeeds[1]?.length > 0 && (
                    <p className="text-sm text-[#64748B]">
                      <span className="text-[#E11D48] font-medium">Tu pareja:</span>{" "}
                      <span className="text-[#94A3B8]">{userSeeds[1].join(", ")}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score legend */}
        <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6">
          <Info className="w-3.5 h-3.5 text-[#475569] mt-0.5 shrink-0" />
          <p className="text-xs md:text-sm text-[#475569] leading-relaxed">
            El <span className="text-[#E11D48] font-mono font-medium">%</span> es el puntaje de afinidad que la IA asigna a cada {isSeries ? "serie" : "película"} según qué tan bien encaja con tus preferencias. A mayor porcentaje, mayor compatibilidad con lo que buscas.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.title} movie={movie} />
          ))}
        </div>

        {/* Load more */}
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-[#0A0A1A] hover:bg-[#0F0F23] disabled:opacity-40 disabled:cursor-not-allowed border border-white/8 hover:border-white/15 text-[#94A3B8] hover:text-[#F8FAFC] py-3.5 md:py-4 rounded-xl text-sm md:text-base font-medium transition-all duration-200 cursor-pointer"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Buscando más...</>
            : <><RefreshCw className="w-4 h-4" /> Buscar más opciones</>
          }
        </button>
      </div>
    </div>
  )
}
