"use client"

import { useState } from "react"
import { RefreshCw, Loader2, Sparkles } from "lucide-react"
import { Movie } from "@/lib/types"
import MovieCard from "@/components/ui/MovieCard"

interface Props {
  initialMovies: Movie[]
  sessionId: string
}

export default function ResultsScreen({ initialMovies, sessionId }: Props) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [shown, setShown] = useState<string[]>(initialMovies.map((m) => m.title))
  const [loading, setLoading] = useState(false)

  async function loadMore() {
    setLoading(true)
    const exclude = shown.join(",")
    const res = await fetch(`/api/session/${sessionId}/match?exclude=${encodeURIComponent(exclude)}`)
    const data = await res.json()
    if (data.results) {
      const newMovies: Movie[] = data.results
      setMovies(newMovies)
      setShown((prev) => [...prev, ...newMovies.map((m) => m.title)])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen cinema-grid">
      {/* Top gradient */}
      <div
        className="fixed inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(225,29,72,0.06), transparent)" }}
      />

      <div className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="mb-7 space-y-1">
          <div className="flex items-center gap-2 text-[#E11D48] text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Selección IA
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">
            {movies.length} películas para esta noche
          </h1>
          <p className="text-[#475569] text-sm">Personalizadas según tus preferencias y plataformas</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.title} movie={movie} />
          ))}
        </div>

        {/* Load more */}
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-[#0A0A1A] hover:bg-[#0F0F23] disabled:opacity-40 disabled:cursor-not-allowed border border-white/8 hover:border-white/15 text-[#94A3B8] hover:text-[#F8FAFC] py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
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
