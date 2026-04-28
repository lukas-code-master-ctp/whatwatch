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
  const [userSeeds, setUserSeeds] = useState<string[][]>([])
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
        if (data.userSeeds) setUserSeeds(data.userSeeds)
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

  return <ResultsScreen initialMovies={movies} sessionId={id} userSeeds={userSeeds} mode={sessionMode} />
}
