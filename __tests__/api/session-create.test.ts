/**
 * @jest-environment node
 */
// __tests__/api/session-create.test.ts
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
