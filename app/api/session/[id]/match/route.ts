import { NextRequest, NextResponse } from "next/server"
import { getSession, setResults } from "@/lib/sessions"
import { buildCouplePrompt, buildSoloPrompt } from "@/lib/prompts"
import { getRecommendations } from "@/lib/openrouter"
import { enrichMovies } from "@/lib/tmdb"
import { MatchResponse } from "@/lib/types"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(params.id)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const required = session.mode === "couple" ? 2 : 1
  const base: Omit<MatchResponse, "results"> = {
    status: "waiting",
    mode: session.mode,
    submitted: session.users.length,
    required,
  }

  if (session.results) {
    return NextResponse.json({ ...base, status: "ready", results: session.results })
  }

  if (session.users.length < required) {
    return NextResponse.json(base)
  }

  const exclude = req.nextUrl.searchParams.get("exclude")
    ?.split(",")
    .filter(Boolean) ?? []

  const prompt =
    session.mode === "couple"
      ? buildCouplePrompt(session.users[0], session.users[1], exclude)
      : buildSoloPrompt(session.users[0], exclude)

  const aiMovies = await getRecommendations(prompt)
  const movies = await enrichMovies(aiMovies)

  if (exclude.length === 0) {
    setResults(params.id, movies)
  }

  return NextResponse.json({ ...base, status: "ready", results: movies })
}
