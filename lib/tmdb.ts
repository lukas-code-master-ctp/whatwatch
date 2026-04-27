import { AIMovie, Movie } from "./types"

const BASE = "https://api.themoviedb.org/3"
const IMG = "https://image.tmdb.org/t/p/w500"

const GENRE_MAP: Record<number, string> = {
  28: "Acción", 12: "Aventura", 16: "Animación", 35: "Comedia",
  80: "Crimen", 18: "Drama", 14: "Fantasía", 27: "Terror",
  10749: "Romance", 878: "Ciencia ficción", 53: "Thriller",
}

export interface TMDBSearchResult {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  vote_average: number
  genre_ids: number[]
  overview: string
}

export function posterUrl(path: string | null): string | null {
  return path ? `${IMG}${path}` : null
}

export function genreName(ids: number[]): string | null {
  for (const id of ids) {
    if (GENRE_MAP[id]) return GENRE_MAP[id]
  }
  return null
}

export async function searchMovies(query: string): Promise<TMDBSearchResult[]> {
  try {
    const params = new URLSearchParams({ api_key: process.env.TMDB_API_KEY!, query })
    const res = await fetch(`${BASE}/search/movie?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.results) ? data.results : []
  } catch {
    return []
  }
}

async function getMovieRuntime(id: number): Promise<number | null> {
  try {
    const params = new URLSearchParams({ api_key: process.env.TMDB_API_KEY! })
    const res = await fetch(`${BASE}/movie/${id}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.runtime === 'number' ? data.runtime : null
  } catch {
    return null
  }
}

export async function enrichMovies(aiMovies: AIMovie[]): Promise<Movie[]> {
  const settled = await Promise.allSettled(
    aiMovies.map(async (ai) => {
      const results = await searchMovies(ai.title)
      const tmdb = results.find(r => r.title.toLowerCase() === ai.title.toLowerCase())
        ?? results[0]
        ?? null

      const runtime = tmdb ? await getMovieRuntime(tmdb.id) : null

      return {
        ...ai,
        posterUrl: tmdb ? posterUrl(tmdb.poster_path) : null,
        rating: tmdb?.vote_average ?? null,
        genre: tmdb ? genreName(tmdb.genre_ids) : null,
        duration: runtime,
        overview: tmdb?.overview ?? null,
      }
    })
  )

  return settled
    .filter((r): r is PromiseFulfilledResult<Movie> => r.status === "fulfilled")
    .map(r => r.value)
}
