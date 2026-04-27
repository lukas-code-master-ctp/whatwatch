# WhatWatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app that recommends movies using AI, supporting a solo mode and a shared couple mode where two people's tastes are matched.

**Architecture:** Next.js 14 (App Router) with API Routes for the backend — no separate server. Sessions are stored in a server-side `Map` (in-memory, 24h TTL). TMDB provides movie metadata and posters; OpenRouter (`google/gemini-flash-1.5`) generates recommendations as JSON.

**Tech Stack:** Next.js 14, React, Tailwind CSS, shadcn/ui, @radix-ui/slider, TMDB API, OpenRouter API, Jest + React Testing Library.

---

## File Map

```
/
├── app/
│   ├── layout.tsx                        # Root layout, dark theme
│   ├── page.tsx                          # Home page (client component)
│   ├── globals.css
│   └── session/
│       └── [id]/
│           └── page.tsx                  # Session state machine (prefs → waiting → results)
├── app/api/
│   ├── session/
│   │   ├── route.ts                      # POST /api/session
│   │   └── [id]/
│   │       ├── prefs/
│   │       │   └── route.ts              # POST /api/session/[id]/prefs
│   │       └── match/
│   │           └── route.ts              # GET /api/session/[id]/match
│   └── movies/
│       └── search/
│           └── route.ts                  # GET /api/movies/search?q=
├── components/
│   ├── home/
│   │   └── ModeSelector.tsx
│   ├── preferences/
│   │   ├── MovieSearch.tsx               # Autocomplete + chips (1–5 seeds)
│   │   ├── PlatformSelector.tsx          # Streaming platform toggles
│   │   └── YearSlider.tsx               # Optional year range slider
│   ├── session/
│   │   ├── PreferencesForm.tsx           # Composes the 3 pref components
│   │   ├── WaitingScreen.tsx             # Shareable link + polling indicator
│   │   └── ResultsScreen.tsx             # Movie grid + "more options"
│   └── ui/
│       └── MovieCard.tsx
├── lib/
│   ├── types.ts                          # All shared TypeScript interfaces
│   ├── sessions.ts                       # In-memory Map store
│   ├── tmdb.ts                           # searchMovies(), enrichMovies()
│   ├── prompts.ts                        # buildCouplePrompt(), buildSoloPrompt()
│   └── openrouter.ts                     # getRecommendations()
└── __tests__/
    ├── lib/
    │   ├── sessions.test.ts
    │   ├── prompts.test.ts
    │   └── tmdb.test.ts
    └── api/
        ├── session-create.test.ts
        ├── movies-search.test.ts
        ├── session-prefs.test.ts
        └── session-match.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "C:/Users/lukas/Desktop/Claude_Code/Movies"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js project created with `app/`, `components/` (empty), `public/`, `package.json`.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @radix-ui/react-slider uuid
npm install -D @types/uuid jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
npx shadcn@latest init -d
npx shadcn@latest add button input badge card
```

When shadcn asks for style: Default. Base color: Zinc. CSS variables: Yes.

- [ ] **Step 3: Create jest.config.ts**

```typescript
import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
}

export default createJestConfig(config)
```

- [ ] **Step 4: Create jest.setup.ts**

```typescript
import "@testing-library/jest-dom"
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Create .env.local.example**

```bash
TMDB_API_KEY=your_tmdb_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

- [ ] **Step 7: Create .env.local from example**

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with real keys. Get TMDB key at https://www.themoviedb.org/settings/api (free). Get OpenRouter key at https://openrouter.ai/keys.

- [ ] **Step 8: Verify scaffold runs**

```bash
npm run dev
```

Expected: App starts at http://localhost:3000 with default Next.js page.

- [ ] **Step 9: Verify jest runs**

```bash
npm test -- --passWithNoTests
```

Expected: "Test Suites: 0 passed" — no tests yet, no errors.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with jest and shadcn"
```

---

## Task 2: Types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib/types.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Session Store

**Files:**
- Create: `lib/sessions.ts`
- Create: `__tests__/lib/sessions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/sessions.test.ts`:

```typescript
import {
  createSession,
  getSession,
  addUserPrefs,
  setResults,
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
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/lib/sessions.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/sessions'"

- [ ] **Step 3: Implement lib/sessions.ts**

```typescript
import { randomUUID } from "crypto"
import { Session, SessionMode, UserPrefs, Movie } from "./types"

const store = new Map<string, Session>()
const TTL = 24 * 60 * 60 * 1000

function cleanup(): void {
  const now = Date.now()
  for (const [id, session] of store) {
    if (session.expiresAt < now) store.delete(id)
  }
}

export function createSession(mode: SessionMode): Session {
  cleanup()
  const now = Date.now()
  const session: Session = {
    id: randomUUID(),
    mode,
    createdAt: now,
    expiresAt: now + TTL,
    users: [],
    results: null,
  }
  store.set(session.id, session)
  return session
}

export function getSession(id: string): Session | null {
  return store.get(id) ?? null
}

export function addUserPrefs(id: string, prefs: UserPrefs): Session | null {
  const session = store.get(id)
  if (!session) return null
  const maxUsers = session.mode === "couple" ? 2 : 1
  if (session.users.length >= maxUsers) return session
  const updated: Session = { ...session, users: [...session.users, prefs] }
  store.set(id, updated)
  return updated
}

export function setResults(id: string, results: Movie[]): void {
  const session = store.get(id)
  if (!session) return
  store.set(id, { ...session, results })
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/lib/sessions.test.ts
```

Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/sessions.ts __tests__/lib/sessions.test.ts
git commit -m "feat: add in-memory session store with TTL and user prefs"
```

---

## Task 4: Prompt Builders

**Files:**
- Create: `lib/prompts.ts`
- Create: `__tests__/lib/prompts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/prompts.test.ts`:

```typescript
import { buildCouplePrompt, buildSoloPrompt } from "@/lib/prompts"
import { UserPrefs } from "@/lib/types"

const prefs1: UserPrefs = {
  seeds: ["Avengers", "Iron Man"],
  platforms: ["netflix", "disney"],
  filters: { yearFrom: null, yearTo: null, genres: null, duration: null },
}

const prefs2: UserPrefs = {
  seeds: ["Cenicienta", "Encanto"],
  platforms: ["netflix", "disney"],
  filters: { yearFrom: 2010, yearTo: 2020, genres: null, duration: null },
}

describe("buildCouplePrompt", () => {
  test("includes both seed lists", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    expect(prompt).toContain("Avengers, Iron Man")
    expect(prompt).toContain("Cenicienta, Encanto")
  })

  test("includes merged platform list without duplicates", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    const netflixCount = (prompt.match(/netflix/gi) ?? []).length
    expect(netflixCount).toBe(1)
  })

  test("includes year filter from prefs2 when set", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    expect(prompt).toContain("2010")
    expect(prompt).toContain("2020")
  })

  test("omits year clause when both yearFrom and yearTo are null", () => {
    const prompt = buildCouplePrompt(prefs1, prefs1)
    expect(prompt).not.toContain("estrenadas entre")
  })

  test("appends exclude clause when exclude list provided", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2, ["Shrek", "Encanto"])
    expect(prompt).toContain("Shrek")
    expect(prompt).toContain("NO incluyas")
  })

  test("returns valid JSON array instruction", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    expect(prompt).toContain('["title"')
  })
})

describe("buildSoloPrompt", () => {
  test("includes seed list and platforms", () => {
    const prompt = buildSoloPrompt(prefs1)
    expect(prompt).toContain("Avengers, Iron Man")
    expect(prompt).toContain("netflix")
  })

  test("includes year filter when set", () => {
    const prompt = buildSoloPrompt(prefs2)
    expect(prompt).toContain("2010")
  })

  test("appends exclude clause", () => {
    const prompt = buildSoloPrompt(prefs1, ["Interstellar"])
    expect(prompt).toContain("Interstellar")
    expect(prompt).toContain("NO incluyas")
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/lib/prompts.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/prompts'"

- [ ] **Step 3: Implement lib/prompts.ts**

```typescript
import { UserPrefs, Filters } from "./types"

function filtersClause(filters: Filters): string {
  if (filters.yearFrom !== null && filters.yearTo !== null) {
    return `Solo películas estrenadas entre ${filters.yearFrom} y ${filters.yearTo}.\n\n`
  }
  return ""
}

const JSON_INSTRUCTION = `Responde ÚNICAMENTE con un array JSON válido con este formato exacto, sin texto adicional:
[{"title":"","year":0,"platform":"","matchScore":0,"reason":""}]`

export function buildCouplePrompt(
  prefs1: UserPrefs,
  prefs2: UserPrefs,
  exclude: string[] = []
): string {
  const platforms = [...new Set([...prefs1.platforms, ...prefs2.platforms])].join(", ")
  const filtersText = filtersClause(prefs2.filters.yearFrom !== null ? prefs2.filters : prefs1.filters)
  const excludeClause = exclude.length > 0
    ? `\nNO incluyas estas películas que ya se mostraron: ${exclude.join(", ")}.\n`
    : ""

  return `Eres un experto en cine. Dos personas quieren ver una película juntas pero tienen gustos diferentes.

Persona 1 disfruta películas como: ${prefs1.seeds.join(", ")}
Persona 2 disfruta películas como: ${prefs2.seeds.join(", ")}

Ambas tienen acceso a: ${platforms}

${filtersText}Recomienda 6 películas que satisfagan a AMBAS personas. Busca el punto medio entre los dos perfiles de gusto.${excludeClause}

${JSON_INSTRUCTION}`
}

export function buildSoloPrompt(prefs: UserPrefs, exclude: string[] = []): string {
  const platforms = prefs.platforms.join(", ")
  const filtersText = filtersClause(prefs.filters)
  const excludeClause = exclude.length > 0
    ? `\nNO incluyas estas películas que ya se mostraron: ${exclude.join(", ")}.\n`
    : ""

  return `Eres un experto en cine. Basándote en que a esta persona le gustan películas como: ${prefs.seeds.join(", ")}

Tiene acceso a: ${platforms}

${filtersText}Recomienda 6 películas similares que disfrutaría.${excludeClause}

${JSON_INSTRUCTION}`
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/lib/prompts.test.ts
```

Expected: PASS — 9 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/prompts.ts __tests__/lib/prompts.test.ts
git commit -m "feat: add couple and solo prompt builders with filter support"
```

---

## Task 5: TMDB Client

**Files:**
- Create: `lib/tmdb.ts`
- Create: `__tests__/lib/tmdb.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/tmdb.test.ts`:

```typescript
import { searchMovies, enrichMovies, posterUrl, genreName } from "@/lib/tmdb"
import { AIMovie } from "@/lib/types"

const mockTMDBResult = {
  id: 27205,
  title: "Inception",
  release_date: "2010-07-16",
  poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
  vote_average: 8.4,
  genre_ids: [28, 878, 53],
  overview: "Cobb steals information...",
}

const mockDetails = { runtime: 148 }

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe("searchMovies", () => {
  test("returns mapped results from TMDB", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [mockTMDBResult] }),
    })

    const results = await searchMovies("Inception")
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(27205)
    expect(results[0].title).toBe("Inception")
  })

  test("returns empty array when fetch fails", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const results = await searchMovies("anything")
    expect(results).toEqual([])
  })
})

describe("enrichMovies", () => {
  test("merges AI movie data with TMDB metadata", async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [mockTMDBResult] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDetails })

    const aiMovies: AIMovie[] = [{
      title: "Inception",
      year: 2010,
      platform: "netflix",
      matchScore: 92,
      reason: "Similar thriller tone",
    }]

    const movies = await enrichMovies(aiMovies)
    expect(movies[0].posterUrl).toContain("/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg")
    expect(movies[0].rating).toBe(8.4)
    expect(movies[0].duration).toBe(148)
    expect(movies[0].matchScore).toBe(92)
  })

  test("returns null fields when TMDB has no match", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })

    const aiMovies: AIMovie[] = [{
      title: "Unknown Movie",
      year: 2023,
      platform: "netflix",
      matchScore: 80,
      reason: "Good pick",
    }]

    const movies = await enrichMovies(aiMovies)
    expect(movies[0].posterUrl).toBeNull()
    expect(movies[0].rating).toBeNull()
    expect(movies[0].duration).toBeNull()
  })
})

describe("genreName", () => {
  test("returns genre name for known id", () => {
    expect(genreName([28])).toBe("Acción")
  })

  test("returns null for unknown ids", () => {
    expect(genreName([99999])).toBeNull()
  })
})

describe("posterUrl", () => {
  test("returns full URL for valid path", () => {
    expect(posterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg")
  })

  test("returns null for null path", () => {
    expect(posterUrl(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/lib/tmdb.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/tmdb'"

- [ ] **Step 3: Implement lib/tmdb.ts**

```typescript
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
  const params = new URLSearchParams({ api_key: process.env.TMDB_API_KEY!, query })
  const res = await fetch(`${BASE}/search/movie?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

async function getMovieRuntime(id: number): Promise<number | null> {
  const params = new URLSearchParams({ api_key: process.env.TMDB_API_KEY! })
  const res = await fetch(`${BASE}/movie/${id}?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.runtime ?? null
}

export async function enrichMovies(aiMovies: AIMovie[]): Promise<Movie[]> {
  return Promise.all(
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
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/lib/tmdb.test.ts
```

Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/tmdb.ts __tests__/lib/tmdb.test.ts
git commit -m "feat: add TMDB client with search and movie enrichment"
```

---

## Task 6: OpenRouter Client

**Files:**
- Create: `lib/openrouter.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/lib/openrouter.test.ts`:

```typescript
import { getRecommendations } from "@/lib/openrouter"

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

const validResponse = [
  { title: "Shrek", year: 2001, platform: "netflix", matchScore: 95, reason: "Hero with heart" },
]

describe("getRecommendations", () => {
  test("parses valid JSON array from response", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(validResponse) } }],
      }),
    })

    const results = await getRecommendations("test prompt")
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe("Shrek")
    expect(results[0].matchScore).toBe(95)
  })

  test("returns empty array when response is malformed JSON", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Sorry I cannot help with that." } }],
      }),
    })

    const results = await getRecommendations("test prompt")
    expect(results).toEqual([])
  })

  test("throws when API returns non-ok status", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429 })
    await expect(getRecommendations("test")).rejects.toThrow("OpenRouter error: 429")
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/lib/openrouter.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/openrouter'"

- [ ] **Step 3: Implement lib/openrouter.ts**

```typescript
import { AIMovie } from "./types"

export async function getRecommendations(prompt: string): Promise<AIMovie[]> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-flash-1.5",
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? "[]"

  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/lib/openrouter.test.ts
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/openrouter.ts __tests__/lib/openrouter.test.ts
git commit -m "feat: add OpenRouter client with JSON extraction and error handling"
```

---

## Task 7: API — POST /api/session

**Files:**
- Create: `app/api/session/route.ts`
- Create: `__tests__/api/session-create.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/api/session-create.test.ts`:

```typescript
import { POST } from "@/app/api/session/route"
import { NextRequest } from "next/server"
import * as sessions from "@/lib/sessions"

jest.mock("@/lib/sessions")

const mockSession = {
  id: "test-uuid-1234",
  mode: "couple" as const,
  createdAt: Date.now(),
  expiresAt: Date.now() + 86400000,
  users: [],
  results: null,
}

describe("POST /api/session", () => {
  test("creates couple session and returns id + url", async () => {
    jest.mocked(sessions.createSession).mockReturnValue(mockSession)

    const req = new NextRequest("http://localhost:3000/api/session", {
      method: "POST",
      body: JSON.stringify({ mode: "couple" }),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe("test-uuid-1234")
    expect(data.url).toContain("/session/test-uuid-1234")
    expect(sessions.createSession).toHaveBeenCalledWith("couple")
  })

  test("returns 400 for invalid mode", async () => {
    const req = new NextRequest("http://localhost:3000/api/session", {
      method: "POST",
      body: JSON.stringify({ mode: "invalid" }),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/api/session-create.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/session/route'"

- [ ] **Step 3: Create app/api/session/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/sessions"
import { SessionMode } from "@/lib/types"

export async function POST(req: NextRequest) {
  const { mode } = await req.json() as { mode: SessionMode }
  if (mode !== "couple" && mode !== "solo") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }
  const session = createSession(mode)
  const url = `${req.nextUrl.origin}/session/${session.id}`
  return NextResponse.json({ id: session.id, url })
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/api/session-create.test.ts
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/api/session/route.ts __tests__/api/session-create.test.ts
git commit -m "feat: add POST /api/session route"
```

---

## Task 8: API — GET /api/movies/search

**Files:**
- Create: `app/api/movies/search/route.ts`
- Create: `__tests__/api/movies-search.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/api/movies-search.test.ts`:

```typescript
import { GET } from "@/app/api/movies/search/route"
import { NextRequest } from "next/server"
import * as tmdb from "@/lib/tmdb"

jest.mock("@/lib/tmdb")

describe("GET /api/movies/search", () => {
  test("returns TMDB results for query", async () => {
    jest.mocked(tmdb.searchMovies).mockResolvedValue([
      {
        id: 1,
        title: "Inception",
        release_date: "2010-07-16",
        poster_path: "/img.jpg",
        vote_average: 8.4,
        genre_ids: [878],
        overview: "Dream heist",
      },
    ])

    const req = new NextRequest("http://localhost/api/movies/search?q=Inception")
    const res = await GET(req)
    const data = await res.json()

    expect(data).toHaveLength(1)
    expect(data[0].title).toBe("Inception")
    expect(data[0].posterUrl).toContain("/img.jpg")
  })

  test("returns empty array for short query", async () => {
    const req = new NextRequest("http://localhost/api/movies/search?q=a")
    const res = await GET(req)
    const data = await res.json()
    expect(data).toEqual([])
    expect(tmdb.searchMovies).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/api/movies-search.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/movies/search/route'"

- [ ] **Step 3: Create app/api/movies/search/route.ts**

```typescript
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/api/movies-search.test.ts
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/api/movies/search/route.ts __tests__/api/movies-search.test.ts
git commit -m "feat: add GET /api/movies/search proxy to TMDB"
```

---

## Task 9: API — POST /api/session/[id]/prefs

**Files:**
- Create: `app/api/session/[id]/prefs/route.ts`
- Create: `__tests__/api/session-prefs.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/api/session-prefs.test.ts`:

```typescript
import { POST } from "@/app/api/session/[id]/prefs/route"
import { NextRequest } from "next/server"
import * as sessions from "@/lib/sessions"
import { UserPrefs } from "@/lib/types"

jest.mock("@/lib/sessions")

const prefs: UserPrefs = {
  seeds: ["Inception"],
  platforms: ["netflix"],
  filters: { yearFrom: null, yearTo: null, genres: null, duration: null },
}

const mockSession = {
  id: "abc",
  mode: "couple" as const,
  createdAt: Date.now(),
  expiresAt: Date.now() + 86400000,
  users: [prefs],
  results: null,
}

describe("POST /api/session/[id]/prefs", () => {
  test("saves prefs and returns submitted count", async () => {
    jest.mocked(sessions.addUserPrefs).mockReturnValue(mockSession)

    const req = new NextRequest("http://localhost/api/session/abc/prefs", {
      method: "POST",
      body: JSON.stringify(prefs),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req, { params: { id: "abc" } })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.submitted).toBe(1)
    expect(data.required).toBe(2)
  })

  test("returns 404 for unknown session", async () => {
    jest.mocked(sessions.addUserPrefs).mockReturnValue(null)

    const req = new NextRequest("http://localhost/api/session/bad/prefs", {
      method: "POST",
      body: JSON.stringify(prefs),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req, { params: { id: "bad" } })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/api/session-prefs.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create app/api/session/[id]/prefs/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { addUserPrefs } from "@/lib/sessions"
import { UserPrefs } from "@/lib/types"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prefs = (await req.json()) as UserPrefs
  const session = addUserPrefs(params.id, prefs)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }
  const required = session.mode === "couple" ? 2 : 1
  return NextResponse.json({ submitted: session.users.length, required })
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/api/session-prefs.test.ts
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/api/session/[id]/prefs/route.ts __tests__/api/session-prefs.test.ts
git commit -m "feat: add POST /api/session/[id]/prefs route"
```

---

## Task 10: API — GET /api/session/[id]/match

**Files:**
- Create: `app/api/session/[id]/match/route.ts`
- Create: `__tests__/api/session-match.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/api/session-match.test.ts`:

```typescript
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
    const res = await GET(req, { params: { id: "bad" } })
    expect(res.status).toBe(404)
  })

  test("returns waiting status when not all users submitted", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(makeSession({ mode: "couple", users: [prefs] }))
    const req = new NextRequest("http://localhost/api/session/abc/match")
    const res = await GET(req, { params: { id: "abc" } })
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
    const res = await GET(req, { params: { id: "abc" } })
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
    const res = await GET(req, { params: { id: "abc" } })
    const data = await res.json()
    expect(data.status).toBe("ready")
    expect(openrouter.getRecommendations).toHaveBeenCalledWith("couple prompt")
    expect(sessions.setResults).toHaveBeenCalled()
  })

  test("does not cache results when exclude list is provided", async () => {
    jest.mocked(sessions.getSession).mockReturnValue(
      makeSession({ mode: "solo", users: [prefs] })
    )
    const req = new NextRequest("http://localhost/api/session/abc/match?exclude=Shrek")
    const res = await GET(req, { params: { id: "abc" } })
    const data = await res.json()
    expect(data.status).toBe("ready")
    expect(sessions.setResults).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/api/session-match.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create app/api/session/[id]/match/route.ts**

```typescript
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/api/session-match.test.ts
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests across all files passing.

- [ ] **Step 6: Commit**

```bash
git add app/api/session/[id]/match/route.ts __tests__/api/session-match.test.ts
git commit -m "feat: add GET /api/session/[id]/match with AI orchestration"
```

---

## Task 11: Root Layout + Home Page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/home/ModeSelector.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update app/layout.tsx for dark theme**

Replace the full content of `app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WhatWatch — ¿Qué vemos hoy?",
  description: "Elige la película perfecta con ayuda de IA",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create components/home/ModeSelector.tsx**

```tsx
"use client"

import { useState } from "react"

interface Props {
  onCouple: () => void
  onSolo: () => void
  onLink: (url: string) => void
  loading: boolean
}

export default function ModeSelector({ onCouple, onSolo, onLink, loading }: Props) {
  const [link, setLink] = useState("")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center space-y-2">
        <div className="text-6xl">🎬</div>
        <h1 className="text-3xl font-bold">¿Qué vemos hoy?</h1>
        <p className="text-zinc-400">Tu asistente para elegir la película perfecta</p>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={onCouple}
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
        >
          👫 Ver en pareja
        </button>
        <button
          onClick={onSolo}
          disabled={loading}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          🧍 Ver solo
        </button>
      </div>

      <div className="text-zinc-500 text-sm">— o tengo un link de sesión —</div>

      <div className="flex gap-2 w-full max-w-sm">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Pegar link aquí..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={() => onLink(link)}
          disabled={!link.includes("/session/")}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-4 rounded-xl text-sm transition-colors"
        >
          Ir →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace app/page.tsx**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ModeSelector from "@/components/home/ModeSelector"

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function createSession(mode: "couple" | "solo") {
    setLoading(true)
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    })
    const { id } = await res.json()
    router.push(`/session/${id}`)
  }

  function handleLink(url: string) {
    const id = url.split("/session/").pop()?.split("?")[0].trim()
    if (id) router.push(`/session/${id}`)
  }

  return (
    <ModeSelector
      onCouple={() => createSession("couple")}
      onSolo={() => createSession("solo")}
      onLink={handleLink}
      loading={loading}
    />
  )
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000. You should see:
- 🎬 header
- Two buttons: "Ver en pareja" and "Ver solo"
- Link input below

Clicking "Ver en pareja" should redirect to `/session/<uuid>` (404 for now — session page not built yet).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css app/page.tsx components/home/ModeSelector.tsx
git commit -m "feat: add home page with mode selector"
```

---

## Task 12: MovieSearch Component

**Files:**
- Create: `components/preferences/MovieSearch.tsx`

- [ ] **Step 1: Create components/preferences/MovieSearch.tsx**

```tsx
"use client"

import { useState, useRef, useEffect } from "react"

interface SearchResult {
  id: number
  title: string
  year: number | null
  posterUrl: string | null
}

interface Props {
  selected: string[]
  onChange: (seeds: string[]) => void
  maxSeeds?: number
}

export default function MovieSearch({ selected, onChange, maxSeeds = 5 }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
      setOpen(true)
      setLoading(false)
    }, 350)
  }, [query])

  function addSeed(title: string) {
    if (selected.includes(title) || selected.length >= maxSeeds) return
    onChange([...selected, title])
    setQuery("")
    setResults([])
    setOpen(false)
  }

  function removeSeed(title: string) {
    onChange(selected.filter((s) => s !== title))
  }

  return (
    <div className="space-y-3">
      <label className="text-sm text-zinc-400">
        ¿Qué tipo de película te provoca ver hoy? <span className="text-zinc-500">(elige 1–{maxSeeds})</span>
      </label>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar película... ej: Inception"
          disabled={selected.length >= maxSeeds}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />
        {loading && (
          <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">Buscando...</span>
        )}

        {open && results.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
            {results.map((r) => (
              <li
                key={r.id}
                onClick={() => addSeed(r.title)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 cursor-pointer text-sm"
              >
                {r.posterUrl && (
                  <img src={r.posterUrl} alt={r.title} className="w-8 h-12 object-cover rounded" />
                )}
                <span>
                  {r.title}
                  {r.year && <span className="text-zinc-500 ml-1">({r.year})</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((title) => (
            <span
              key={title}
              className="flex items-center gap-1.5 bg-violet-900/50 border border-violet-700 rounded-full px-3 py-1 text-sm text-violet-200"
            >
              {title}
              <button
                onClick={() => removeSeed(title)}
                className="text-violet-400 hover:text-white leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/preferences/MovieSearch.tsx
git commit -m "feat: add MovieSearch component with TMDB autocomplete"
```

---

## Task 13: PlatformSelector + YearSlider Components

**Files:**
- Create: `components/preferences/PlatformSelector.tsx`
- Create: `components/preferences/YearSlider.tsx`

- [ ] **Step 1: Create components/preferences/PlatformSelector.tsx**

```tsx
"use client"

import { Platform } from "@/lib/types"

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: "netflix", label: "Netflix", color: "bg-red-600" },
  { id: "disney", label: "Disney+", color: "bg-blue-600" },
  { id: "prime", label: "Prime Video", color: "bg-sky-500" },
  { id: "hbo", label: "Max (HBO)", color: "bg-purple-600" },
  { id: "apple", label: "Apple TV+", color: "bg-zinc-600" },
]

interface Props {
  selected: Platform[]
  onChange: (platforms: Platform[]) => void
}

export default function PlatformSelector({ selected, onChange }: Props) {
  function toggle(id: Platform) {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm text-zinc-400">Mis plataformas de streaming</label>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ id, label, color }) => {
          const active = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                active
                  ? `${color} border-transparent text-white`
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create components/preferences/YearSlider.tsx**

```tsx
"use client"

import * as SliderPrimitive from "@radix-ui/react-slider"
import { useState } from "react"

interface Props {
  yearFrom: number | null
  yearTo: number | null
  onChange: (from: number | null, to: number | null) => void
}

const MIN = 1950
const MAX = 2025

export default function YearSlider({ yearFrom, yearTo, onChange }: Props) {
  const [enabled, setEnabled] = useState(yearFrom !== null)
  const values = [yearFrom ?? MIN, yearTo ?? MAX]

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    onChange(next ? MIN : null, next ? MAX : null)
  }

  function handleChange(vals: number[]) {
    onChange(vals[0], vals[1])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-400">
          📅 Período de la película
          <span className="ml-2 text-zinc-600 text-xs">(opcional)</span>
        </label>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
            enabled ? "bg-violet-600" : "bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
              enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-2 px-1">
          <SliderPrimitive.Root
            min={MIN}
            max={MAX}
            step={1}
            value={values}
            onValueChange={handleChange}
            className="relative flex items-center w-full h-5"
          >
            <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-zinc-700 flex-1">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-violet-500" />
            </SliderPrimitive.Track>
            {values.map((_, i) => (
              <SliderPrimitive.Thumb
                key={i}
                className="block h-4 w-4 rounded-full bg-violet-500 border-2 border-white shadow focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
              />
            ))}
          </SliderPrimitive.Root>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{values[0]}</span>
            <span>{values[1]}</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/preferences/PlatformSelector.tsx components/preferences/YearSlider.tsx
git commit -m "feat: add PlatformSelector and YearSlider preference components"
```

---

## Task 14: PreferencesForm Component

**Files:**
- Create: `components/session/PreferencesForm.tsx`

- [ ] **Step 1: Create components/session/PreferencesForm.tsx**

```tsx
"use client"

import { useState } from "react"
import MovieSearch from "@/components/preferences/MovieSearch"
import PlatformSelector from "@/components/preferences/PlatformSelector"
import YearSlider from "@/components/preferences/YearSlider"
import { Platform, UserPrefs } from "@/lib/types"

interface Props {
  onSubmit: (prefs: UserPrefs) => Promise<void>
  submitting: boolean
}

export default function PreferencesForm({ onSubmit, submitting }: Props) {
  const [seeds, setSeeds] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>(["netflix", "disney", "prime", "hbo", "apple"])
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)

  const canSubmit = seeds.length >= 1 && platforms.length >= 1 && !submitting

  async function handleSubmit() {
    const prefs: UserPrefs = {
      seeds,
      platforms,
      filters: { yearFrom, yearTo, genres: null, duration: null },
    }
    await onSubmit(prefs)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tus preferencias</h1>
        <p className="text-zinc-400 text-sm mt-1">Dinos qué tipo de películas te gustan hoy</p>
      </div>

      <MovieSearch selected={seeds} onChange={setSeeds} />

      <PlatformSelector selected={platforms} onChange={setPlatforms} />

      <YearSlider
        yearFrom={yearFrom}
        yearTo={yearTo}
        onChange={(from, to) => { setYearFrom(from); setYearTo(to) }}
      />

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white py-3 rounded-xl font-medium transition-colors"
      >
        {submitting ? "Guardando..." : "Listo →"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/session/PreferencesForm.tsx
git commit -m "feat: add PreferencesForm composing all preference inputs"
```

---

## Task 15: WaitingScreen Component

**Files:**
- Create: `components/session/WaitingScreen.tsx`

- [ ] **Step 1: Create components/session/WaitingScreen.tsx**

```tsx
"use client"

import { useState } from "react"
import { SessionMode } from "@/lib/types"

interface Props {
  sessionUrl: string
  mode: SessionMode
}

export default function WaitingScreen({ sessionUrl, mode }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(sessionUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 text-center">
      <div className="text-5xl animate-pulse">
        {mode === "couple" ? "⏳" : "🔍"}
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold">
          {mode === "couple" ? "Preferencias guardadas" : "Buscando películas..."}
        </h2>
        <p className="text-zinc-400 text-sm">
          {mode === "couple"
            ? "Comparte este link con tu pareja"
            : "La IA está analizando tus preferencias"}
        </p>
      </div>

      {mode === "couple" && (
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-violet-700 rounded-xl px-4 py-3">
            <span className="text-violet-400 text-sm flex-1 truncate">{sessionUrl}</span>
            <button
              onClick={copy}
              className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-zinc-500 text-xs">
            Esperando que tu pareja envíe sus preferencias...
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/session/WaitingScreen.tsx
git commit -m "feat: add WaitingScreen with link sharing and pulse animation"
```

---

## Task 16: MovieCard + ResultsScreen

**Files:**
- Create: `components/ui/MovieCard.tsx`
- Create: `components/session/ResultsScreen.tsx`

- [ ] **Step 1: Create components/ui/MovieCard.tsx**

```tsx
import { Movie } from "@/lib/types"

interface Props {
  movie: Movie
}

export default function MovieCard({ movie }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-colors">
      <div className="aspect-[2/3] bg-zinc-800 relative">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">
            🎬
          </div>
        )}
        <div className="absolute top-2 right-2 bg-violet-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          {movie.matchScore}%
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-sm leading-tight">{movie.title}</h3>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{movie.year}</span>
          {movie.genre && <><span>·</span><span>{movie.genre}</span></>}
          {movie.duration && <><span>·</span><span>{movie.duration} min</span></>}
        </div>

        {movie.rating && (
          <div className="text-xs text-yellow-400">⭐ {movie.rating.toFixed(1)}</div>
        )}

        <div className="text-xs text-green-400 font-medium">{movie.platform} ✓</div>

        {movie.reason && (
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-3">
            {movie.reason}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create components/session/ResultsScreen.tsx**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/MovieCard.tsx components/session/ResultsScreen.tsx
git commit -m "feat: add MovieCard and ResultsScreen with more-options support"
```

---

## Task 17: Session Page — State Machine

**Files:**
- Create: `app/session/[id]/page.tsx`

This is the central page that orchestrates all screens: PreferencesForm → WaitingScreen → ResultsScreen.

- [ ] **Step 1: Create app/session/[id]/page.tsx**

```tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import PreferencesForm from "@/components/session/PreferencesForm"
import WaitingScreen from "@/components/session/WaitingScreen"
import ResultsScreen from "@/components/session/ResultsScreen"
import { UserPrefs, Movie, MatchResponse } from "@/lib/types"

type Screen = "prefs" | "waiting" | "results"

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const [screen, setScreen] = useState<Screen>("prefs")
  const [submitting, setSubmitting] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [sessionMode, setSessionMode] = useState<"couple" | "solo">("solo")
  const [sessionUrl, setSessionUrl] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSessionUrl(`${window.location.origin}/session/${id}`)
  }, [id])

  function startPolling() {
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/session/${id}/match`)
      if (!res.ok) return
      const data: MatchResponse = await res.json()
      setSessionMode(data.mode)
      if (data.status === "ready" && data.results) {
        clearInterval(pollRef.current!)
        setMovies(data.results)
        setScreen("results")
      }
    }, 3000)
  }

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function handlePrefsSubmit(prefs: UserPrefs) {
    setSubmitting(true)
    const res = await fetch(`/api/session/${id}/prefs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    })
    if (!res.ok) { setSubmitting(false); return }

    const { required, submitted } = await res.json()
    setSubmitting(false)
    setScreen("waiting")

    if (submitted >= required) {
      // All prefs in — poll immediately, results will come fast
    }
    startPolling()
  }

  if (screen === "prefs") {
    return <PreferencesForm onSubmit={handlePrefsSubmit} submitting={submitting} />
  }

  if (screen === "waiting") {
    return <WaitingScreen sessionUrl={sessionUrl} mode={sessionMode} />
  }

  return <ResultsScreen initialMovies={movies} sessionId={id} />
}
```

- [ ] **Step 2: Verify full flow in browser**

```bash
npm run dev
```

**Test solo flow:**
1. Go to http://localhost:3000
2. Click "Ver solo"
3. Search for 2–3 movies (e.g., "Inception", "Interstellar")
4. Keep all platforms selected
5. Click "Listo →"
6. See WaitingScreen with search animation
7. After ~5 seconds, see ResultsScreen with movie cards

**Test couple flow:**
1. Go to http://localhost:3000
2. Click "Ver en pareja"
3. Enter your seed movies → click "Listo →"
4. Copy the session link shown
5. Open the link in another tab/window
6. Enter different seed movies → click "Listo →"
7. Both tabs should show ResultsScreen with matching movies

- [ ] **Step 3: Commit**

```bash
git add app/session/[id]/page.tsx
git commit -m "feat: add session page state machine wiring all screens"
```

---

## Task 18: Final Config & Deployment

**Files:**
- Modify: `next.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Update next.config.ts to allow TMDB image domain**

Replace content of `next.config.ts`:

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Add .superpowers to .gitignore**

Append to `.gitignore`:
```
.superpowers/
.env.local
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests passing. Fix any regressions before continuing.

- [ ] **Step 4: Deploy to Vercel**

```bash
npm install -g vercel
vercel
```

When prompted:
- Link to existing project? No → create new
- Project name: `whatwatch`
- Framework: Next.js (auto-detected)

Then add environment variables in Vercel dashboard (Settings → Environment Variables):
- `TMDB_API_KEY` = your key from https://www.themoviedb.org/settings/api
- `OPENROUTER_API_KEY` = your key from https://openrouter.ai/keys

Redeploy after adding env vars:
```bash
vercel --prod
```

- [ ] **Step 5: Final commit**

```bash
git add next.config.ts .gitignore
git commit -m "feat: configure image domains and deployment"
```

---

## Known Limitations (v1)

- **In-memory sessions:** Sessions are stored in a `Map` on the Next.js server. On Vercel, serverless functions may restart between requests, causing sessions to be lost. For personal use with low traffic this is acceptable; for reliability, replace `lib/sessions.ts` with a Redis adapter (e.g., Upstash Redis via `@upstash/redis`).
- **Streaming availability:** TMDB does not always have accurate per-country streaming data. The platform field in results comes from the AI's knowledge (trained data), not a live availability check. Accept some inaccuracy.
- **Rate limits:** OpenRouter's Gemini Flash has generous free limits. TMDB allows 40 requests per 10 seconds on the free tier — the parallel `enrichMovies` calls are within this.
