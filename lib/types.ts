export type Platform = "netflix" | "disney" | "prime" | "hbo" | "apple"

export interface Filters {
  yearFrom: number | null
  yearTo: number | null
  genres: string[] | null       // v2 — no UI in v1
  duration: "short" | "normal" | "long" | null  // v2 — no UI in v1
}

export interface UserPrefs {
  seeds: string[]               // movie titles, 1–5
  platforms: Platform[]
  filters: Filters
}

export interface AIMovie {
  title: string
  year: number
  platform: string
  matchScore: number
  reason: string
}

export interface Movie extends AIMovie {
  posterUrl: string | null
  rating: number | null
  genre: string | null
  duration: number | null       // minutes
  overview: string | null
}

export type SessionMode = "couple" | "solo"

export interface Session {
  id: string
  mode: SessionMode
  createdAt: number             // ms timestamp
  expiresAt: number             // createdAt + 24h
  users: UserPrefs[]
  results: Movie[] | null
}

export interface MatchResponse {
  status: "waiting" | "ready"
  mode: SessionMode
  submitted: number
  required: number
  results?: Movie[]
}
