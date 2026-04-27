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
