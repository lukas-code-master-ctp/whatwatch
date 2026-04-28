import { NextRequest, NextResponse } from "next/server"
import { addUserPrefs } from "@/lib/sessions"
import { UserPrefs } from "@/lib/types"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const prefs = (await req.json()) as UserPrefs
  const session = addUserPrefs(id, prefs)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }
  const required = session.mode === "couple" ? 2 : 1
  return NextResponse.json({ submitted: session.users.length, required })
}
