/**
 * @jest-environment node
 */
// __tests__/api/session-prefs.test.ts
import { POST } from "@/app/api/session/[id]/prefs/route"
import { NextRequest } from "next/server"
import * as sessions from "@/lib/sessions"
import { UserPrefs } from "@/lib/types"

jest.mock("@/lib/sessions")

const prefs: UserPrefs = {
  contentType: "movie",
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

    const res = await POST(req, { params: Promise.resolve({ id: "abc" }) })
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

    const res = await POST(req, { params: Promise.resolve({ id: "bad" }) })
    expect(res.status).toBe(404)
  })
})
