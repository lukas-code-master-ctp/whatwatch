import { NextRequest, NextResponse } from "next/server"
import { getSession, setResults } from "@/lib/sessions"
import { buildCouplePrompt, buildSoloPrompt } from "@/lib/prompts"
import { getRecommendations } from "@/lib/openrouter"
import { enrichMovies } from "@/lib/tmdb"
import { MatchResponse } from "@/lib/types"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = getSession(id)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  // Parse exclude before the cache check — "load more" must bypass the cache
  const exclude = (req.nextUrl.searchParams.get("exclude")
    ?.split(",")
    .filter(Boolean) ?? []).slice(0, 20)

  const required = session.mode === "couple" ? 2 : 1
  const userSeeds = session.users.map((u) => u.seeds)
  const base: Omit<MatchResponse, "results"> = {
    status: "waiting",
    mode: session.mode,
    submitted: session.users.length,
    required,
    userSeeds,
  }

  // Return cached results only for the initial request (no exclude list)
  if (exclude.length === 0 && session.results) {
    return NextResponse.json({ ...base, status: "ready", results: session.results })
  }

  if (session.users.length < required) {
    return NextResponse.json(base)
  }

  const prompt =
    session.mode === "couple"
      ? buildCouplePrompt(session.users[0], session.users[1], exclude)
      : buildSoloPrompt(session.users[0], exclude)

  try {
    const aiMovies = await getRecommendations(prompt)
    const movies = await enrichMovies(aiMovies)
    if (exclude.length === 0) {
      setResults(id, movies)
    }
    return NextResponse.json({ ...base, status: "ready", results: movies, userSeeds })
  } catch {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 502 })
  }
}
