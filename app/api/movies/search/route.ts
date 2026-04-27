import { NextRequest, NextResponse } from "next/server"
import { searchMovies, posterUrl } from "@/lib/tmdb"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (q.length < 2) return NextResponse.json([])

  const results = await searchMovies(q)
  const mapped = results.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    year: r.release_date ? new Date(r.release_date).getFullYear() : null,
    posterUrl: posterUrl(r.poster_path),
  }))

  return NextResponse.json(mapped)
}
