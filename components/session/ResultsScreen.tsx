"use client"

import { useState } from "react"
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🎯 {movies.length} películas para esta noche</h1>
        <p className="text-zinc-400 text-sm mt-1">Basadas en tus preferencias y disponibles en tus plataformas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.title} movie={movie} />
        ))}
      </div>

      <button
        onClick={loadMore}
        disabled={loading}
        className="mt-8 w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 text-zinc-300 py-3 rounded-xl text-sm font-medium transition-colors"
      >
        {loading ? "Buscando más..." : "🔄 Buscar más opciones"}
      </button>
    </div>
  )
}
