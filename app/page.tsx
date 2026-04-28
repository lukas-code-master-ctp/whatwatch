"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ModeSelector from "@/components/home/ModeSelector"

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function createSession(mode: "couple" | "solo") {
    setLoading(true)
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    })
    const { id } = await res.json()
    router.push(`/session/${id}?mode=${mode}`)
  }

  function handleLink(url: string) {
    const id = url.split("/session/").pop()?.split("?")[0].trim()
    if (id) router.push(`/session/${id}`)
  }

  return (
    <ModeSelector
      onCouple={() => createSession("couple")}
      onSolo={() => createSession("solo")}
      onLink={handleLink}
      loading={loading}
    />
  )
}
