import {
  createSession,
  getSession,
  addUserPrefs,
  setResults,
  clearStore,
} from "@/lib/sessions"
import { UserPrefs, Movie } from "@/lib/types"

const samplePrefs: UserPrefs = {
  seeds: ["Inception"],
  platforms: ["netflix"],
  filters: { yearFrom: null, yearTo: null, genres: null, duration: null },
}

const sampleMovie: Movie = {
  title: "Interstellar",
  year: 2014,
  platform: "netflix",
  matchScore: 95,
  reason: "Similar sci-fi tone",
  posterUrl: null,
  rating: 8.6,
  genre: "Ciencia ficción",
  duration: 169,
  overview: "A team of explorers...",
}

beforeEach(() => {
  clearStore()
})

describe("sessions", () => {
  test("createSession returns session with correct mode and id", () => {
    const s = createSession("solo")
    expect(s.id).toHaveLength(36)     // UUID format
    expect(s.mode).toBe("solo")
    expect(s.users).toEqual([])
    expect(s.results).toBeNull()
    expect(s.expiresAt).toBeGreaterThan(s.createdAt)
  })

  test("getSession returns created session", () => {
    const s = createSession("couple")
    expect(getSession(s.id)).toEqual(s)
  })

  test("getSession returns null for unknown id", () => {
    expect(getSession("nonexistent")).toBeNull()
  })

  test("addUserPrefs appends prefs to session", () => {
    const s = createSession("solo")
    const updated = addUserPrefs(s.id, samplePrefs)
    expect(updated?.users).toHaveLength(1)
    expect(updated?.users[0]).toEqual(samplePrefs)
  })

  test("addUserPrefs does not exceed maxUsers for solo mode", () => {
    const s = createSession("solo")
    addUserPrefs(s.id, samplePrefs)
    const second = addUserPrefs(s.id, samplePrefs)
    expect(second?.users).toHaveLength(1)   // still 1, not 2
  })

  test("addUserPrefs allows 2 users in couple mode", () => {
    const s = createSession("couple")
    addUserPrefs(s.id, samplePrefs)
    const updated = addUserPrefs(s.id, samplePrefs)
    expect(updated?.users).toHaveLength(2)
  })

  test("addUserPrefs returns null for unknown session", () => {
    expect(addUserPrefs("nonexistent", samplePrefs)).toBeNull()
  })

  test("setResults stores results on session", () => {
    const s = createSession("solo")
    setResults(s.id, [sampleMovie])
    expect(getSession(s.id)?.results).toEqual([sampleMovie])
  })
})
