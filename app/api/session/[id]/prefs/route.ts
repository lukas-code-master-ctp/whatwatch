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
