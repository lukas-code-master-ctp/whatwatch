import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/sessions"
import { SessionMode } from "@/lib/types"

export async function POST(req: NextRequest) {
  const { mode } = (await req.json()) as { mode: SessionMode }
  if (mode !== "couple" && mode !== "solo") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }
  const session = createSession(mode)
  const url = `${req.nextUrl.origin}/session/${session.id}`
  return NextResponse.json({ id: session.id, url })
}
