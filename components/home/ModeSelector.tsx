"use client"

import { useState } from "react"

interface Props {
  onCouple: () => void
  onSolo: () => void
  onLink: (url: string) => void
  loading: boolean
}

export default function ModeSelector({ onCouple, onSolo, onLink, loading }: Props) {
  const [link, setLink] = useState("")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center space-y-2">
        <div className="text-6xl">🎬</div>
        <h1 className="text-3xl font-bold">¿Qué vemos hoy?</h1>
        <p className="text-zinc-400">Tu asistente para elegir la película perfecta</p>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={onCouple}
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
        >
          👫 Ver en pareja
        </button>
        <button
          onClick={onSolo}
          disabled={loading}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-600 text-white py-3 rounded-xl font-medium transition-colors"
        >
          🧍 Ver solo
        </button>
      </div>

      <div className="text-zinc-500 text-sm">— o tengo un link de sesión —</div>

      <div className="flex gap-2 w-full max-w-sm">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Pegar link aquí..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={() => onLink(link)}
          disabled={!link.includes("/session/")}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-4 rounded-xl text-sm transition-colors"
        >
          Ir →
        </button>
      </div>
    </div>
  )
}
