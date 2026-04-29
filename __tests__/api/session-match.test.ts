/**
 * @jest-environment node
 */
import { GET } from "@/app/api/session/[id]/match/route"
import { NextRequest } from "next/server"
import * as sessions from "@/lib/sessions"
import * as prompts from "@/lib/prompts"
import * as openrouter from "@/lib/openrouter"
import * as tmdb from "@/lib/tmdb"
import { Session, UserPrefs, Movie } from "@/lib/types"

jest.mock("@/lib/sessions")
jest.mock("@/lib/prompts")
jest.mock("@/lib/openrouter")
jest.mock("@/lib/tmdb")

const prefs: UserPrefs = {
  contentType: "movie",
  seeds: ["Inception"],
  platforms: ["netflix"],
  filters: { yearFrom: null, yearTo: null, genres: null, duration: null },
}

const movie: Movie = {
  title: "Shrek",
  year: 2001,
  platform: "netflix",
  matchScore: 90,
  reason: "Fun for all",
  posterUrl: null,
  rating: 7.8,
  genre: "Animación",
  duration: 90,
  overview: "An ogre...",
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "abc",
    mode: "couple",
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
    users: [],
    results: null,
    ...overrides,
  }
}

describe("GET /api/session/[id]/match", () => {
  beforeEach(() => {
    jest.mocked(prompts.buildCouplePrompt).mockReturnValue("couple prompt")
    jest.mocked(prompts.buildSoloPrompt).mockReturnValue("solo prompt")
    jest.mocked(openrouter.getRecommendations).mockResolvedValue([
      { title: "Shrek", year: 2001, platform: "netflix", matchScore: 90, reason: "Fun" },
    ])
    jest.mocked(tmdb.enrichMovies).mockResolvedValue([movie])
  })

  test("returns 404 for unknown session", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(null)
    const req = new NextRequest("http://localhost/api/session/bad/match")
    const res = await GET(req, { params: Promise.resolve({ id: "bad" }) })
    expect(res.status).toBe(404)
  })

  test("returns waiting status when not all users submitted", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(makeSession({ mode: "couple", users: [prefs] }))
    const req = new NextRequest("http://localhost/api/session/abc/match")
    const res = await GET(req, { params: Promise.resolve({ id: "abc" }) })
    const data = await res.json()
    expect(data.status).toBe("waiting")
    expect(data.submitted).toBe(1)
    expect(data.required).toBe(2)
  })

  test("returns cached results without calling AI again", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(
      makeSession({ results: [movie] })
    )
    const req = new NextRequest("http://localhost/api/session/abc/match")
    const res = await GET(req, { params: Promise.resolve({ id: "abc" }) })
    const data = await res.json()
    expect(data.status).toBe("ready")
    expect(data.results).toHaveLength(1)
    expect(openrouter.getRecommendations).not.toHaveBeenCalled()
  })

  test("calls AI and enriches when both users submitted (couple)", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(
      makeSession({ mode: "couple", users: [prefs, prefs] })
    )
    const req = new NextRequest("http://localhost/api/session/abc/match")
    const res = await GET(req, { params: Promise.resolve({ id: "abc" }) })
    const data = await res.json()
    expect(data.status).toBe("ready")
    expect(openrouter.getRecommendations).toHaveBeenCalledWith("couple prompt")
    expect(sessions.setResults).toHaveBeenCalledWith("abc", [movie])
  })

  test("does not cache results when exclude list is provided", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(
      makeSession({ mode: "solo", users: [prefs] })
    )
    const req = new NextRequest("http://localhost/api/session/abc/match?exclude=Shrek")
    const res = await GET(req, { params: Promise.resolve({ id: "abc" }) })
    const data = await res.json()
    expect(data.status).toBe("ready")
    expect(sessions.setResults).not.toHaveBeenCalled()
  })

  test("returns 502 when AI service throws", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(
      makeSession({ mode: "solo", users: [prefs] })
    )
    jest.mocked(openrouter.getRecommendations).mockRejectedValue(new Error("quota exceeded"))
    const req = new NextRequest("http://localhost/api/session/abc/match")
    const res = await GET(req, { params: Promise.resolve({ id: "abc" }) })
    expect(res.status).toBe(502)
  })
})
