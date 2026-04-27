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
  const session = store.get(id) ?? null
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    store.delete(id)
    return null
  }
  return { ...session, users: [...session.users] }
}

export function addUserPrefs(id: string, prefs: UserPrefs): Session | null {
  const session = store.get(id)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    store.delete(id)
    return null
  }
  const maxUsers = session.mode === "couple" ? 2 : 1
  if (session.users.length >= maxUsers) return { ...session, users: [...session.users] }
  const updated: Session = { ...session, users: [...session.users, prefs] }
  store.set(id, updated)
  return { ...updated, users: [...updated.users] }
}

export function setResults(id: string, results: Movie[]): void {
  const session = store.get(id)
  if (!session) return
  if (session.expiresAt < Date.now()) {
    store.delete(id)
    return
  }
  store.set(id, { ...session, results })
}

export function clearStore(): void {
  store.clear()
}
