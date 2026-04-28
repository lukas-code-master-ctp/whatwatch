import { NextRequest, NextResponse } from "next/server"
import { ensureSession, addUserPrefs } from "@/lib/sessions"
import { UserPrefs, SessionMode } from "@/lib/types"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  // Body may be { prefs, mode } (new) or just UserPrefs (legacy)
  const prefs: UserPrefs = body.prefs ?? body
  const mode: SessionMode = body.mode === "couple" ? "couple" : "solo"

  // Recreate session if lost (serverless instance isolation on Vercel)
  ensureSession(id, mode)

  const session = addUserPrefs(id, prefs)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }
  const required = session.mode === "couple" ? 2 : 1
  return NextResponse.json({ submitted: session.users.length, required })
}
