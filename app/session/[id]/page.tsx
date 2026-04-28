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
  const [submitError, setSubmitError] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [userSeeds, setUserSeeds] = useState<string[][]>([])
  const [sessionMode, setSessionMode] = useState<"couple" | "solo">("solo")
  const [sessionUrl, setSessionUrl] = useState("")
  const [matchError, setMatchError] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSessionUrl(`${window.location.origin}/session/${id}`)
  }, [id])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  // Couple mode: poll until partner submits, then show results
  function startCouplePolling() {
    stopPolling()
    let failStreak = 0
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/session/${id}/match`)
        if (!res.ok) {
          failStreak++
          if (failStreak >= 5) {
            stopPolling()
            setMatchError("No pudimos obtener las recomendaciones. Intenta recargar la página.")
          }
          return
        }
        failStreak = 0
        const data: MatchResponse = await res.json()
        setSessionMode(data.mode)
        if (data.status === "ready" && data.results) {
          stopPolling()
          setMovies(data.results)
          if (data.userSeeds) setUserSeeds(data.userSeeds)
          setScreen("results")
        }
      } catch {
        failStreak++
        if (failStreak >= 5) {
          stopPolling()
          setMatchError("Error de conexión. Intenta recargar la página.")
        }
      }
    }, 3000)
  }

  useEffect(() => () => stopPolling(), [])

  async function handlePrefsSubmit(prefs: UserPrefs) {
    setSubmitting(true)
    setSubmitError("")

    // 1. Save prefs
    let submitted: number
    let required: number
    try {
      const res = await fetch(`/api/session/${id}/prefs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) {
        setSubmitting(false)
        setSubmitError("Error al guardar preferencias. Intenta de nuevo.")
        return
      }
      const body = await res.json()
      submitted = body.submitted
      required = body.required
    } catch {
      setSubmitting(false)
      setSubmitError("Error de conexión. Revisa tu internet e intenta de nuevo.")
      return
    }

    setSubmitting(false)
    setScreen("waiting")

    if (submitted >= required) {
      // All prefs in (solo, or last of couple) — call match directly, no polling race
      try {
        const res = await fetch(`/api/session/${id}/match`)
        if (res.ok) {
          const data: MatchResponse = await res.json()
          setSessionMode(data.mode)
          if (data.status === "ready" && data.results) {
            setMovies(data.results)
            if (data.userSeeds) setUserSeeds(data.userSeeds)
            setScreen("results")
            return
          }
        }
      } catch { /* fall through to polling as safety net */ }

      // Safety-net: if direct call failed, fall back to polling
      startCouplePolling()
    } else {
      // Couple mode, waiting for partner
      startCouplePolling()
    }
  }

  if (screen === "prefs") {
    return (
      <PreferencesForm
        onSubmit={handlePrefsSubmit}
        submitting={submitting}
        error={submitError}
      />
    )
  }

  if (screen === "waiting") {
    return (
      <WaitingScreen
        sessionUrl={sessionUrl}
        mode={sessionMode}
        error={matchError}
      />
    )
  }

  return (
    <ResultsScreen
      initialMovies={movies}
      sessionId={id}
      userSeeds={userSeeds}
      mode={sessionMode}
    />
  )
}
