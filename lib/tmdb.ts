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
  original_title: string
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

export async function searchMovies(query: string, language = "es-MX"): Promise<TMDBSearchResult[]> {
  try {
    const params = new URLSearchParams({ api_key: process.env.TMDB_API_KEY!, query, language })
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

function bestTmdbMatch(results: TMDBSearchResult[], aiTitle: string): TMDBSearchResult | null {
  if (results.length === 0) return null
  const q = aiTitle.toLowerCase()
  // Exact match on localized title or original title
  const exact = results.find(
    r => r.title.toLowerCase() === q || r.original_title.toLowerCase() === q
  )
  if (exact) return exact
  // Partial: AI title starts with TMDB title (handles "Foo: The Movie" vs "Foo")
  const partial = results.find(
    r => q.startsWith(r.title.toLowerCase()) || q.startsWith(r.original_title.toLowerCase())
  )
  return partial ?? results[0]
}

export async function enrichMovies(aiMovies: AIMovie[]): Promise<Movie[]> {
  const settled = await Promise.allSettled(
    aiMovies.map(async (ai): Promise<Movie> => {
      // Search in Spanish first (matches AI-returned Spanish titles)
      let results = await searchMovies(ai.title, "es-MX")
      let tmdb = bestTmdbMatch(results, ai.title)

      // If no poster from Spanish search, retry in English (broader index)
      if (!tmdb?.poster_path) {
        const enResults = await searchMovies(ai.title, "en-US")
        const enMatch = bestTmdbMatch(enResults, ai.title)
        if (enMatch?.poster_path) {
          tmdb = enMatch
          results = enResults
        }
      }

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
