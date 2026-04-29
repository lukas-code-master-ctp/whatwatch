import { NextRequest, NextResponse } from "next/server"
import { searchMovies, searchTV, posterUrl } from "@/lib/tmdb"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  const type = req.nextUrl.searchParams.get("type") === "series" ? "series" : "movie"
  if (q.length < 2) return NextResponse.json([])

  const results = type === "series" ? await searchTV(q) : await searchMovies(q)
  const mapped = results.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    year: r.release_date ? new Date(r.release_date).getFullYear() : null,
    posterUrl: posterUrl(r.poster_path),
  }))

  return NextResponse.json(mapped)
}
