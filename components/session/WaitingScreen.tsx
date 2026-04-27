"use client"

import { useState } from "react"
import { SessionMode } from "@/lib/types"

interface Props {
  sessionUrl: string
  mode: SessionMode
}

export default function WaitingScreen({ sessionUrl, mode }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(sessionUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 text-center">
      <div className="text-5xl animate-pulse">
        {mode === "couple" ? "⏳" : "🔍"}
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold">
          {mode === "couple" ? "Preferencias guardadas" : "Buscando películas..."}
        </h2>
        <p className="text-zinc-400 text-sm">
          {mode === "couple"
            ? "Comparte este link con tu pareja"
            : "La IA está analizando tus preferencias"}
        </p>
      </div>

      {mode === "couple" && (
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-violet-700 rounded-xl px-4 py-3">
            <span className="text-violet-400 text-sm flex-1 truncate">{sessionUrl}</span>
            <button
              onClick={copy}
              className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-zinc-500 text-xs">
            Esperando que tu pareja envíe sus preferencias...
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  )
}
