"use client"

import { useState } from "react"
import { Copy, Check, Brain, Share2 } from "lucide-react"
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

  const isCouple = mode === "couple"

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 cinema-grid text-center">
      {/* Top gradient */}
      <div
        className="fixed inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(225,29,72,0.06), transparent)" }}
      />

      {/* Icon with scan animation */}
      <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#0A0A1A] border border-[#E11D48]/20 overflow-hidden">
        <div className="scan-line" />
        {isCouple
          ? <Share2 className="w-10 h-10 text-[#E11D48]" strokeWidth={1.5} />
          : <Brain className="w-10 h-10 text-[#E11D48]" strokeWidth={1.5} />
        }
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-[#F8FAFC]">
          {isCouple ? "Preferencias guardadas" : "Analizando preferencias..."}
        </h2>
        <p className="text-[#475569] text-sm leading-relaxed">
          {isCouple
            ? "Comparte el link con tu pareja para que ella también elija sus preferencias"
            : "La IA está procesando tus preferencias y buscando películas perfectas para ti"}
        </p>
      </div>

      {isCouple && (
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2 bg-[#0A0A1A] border border-[#E11D48]/20 rounded-xl px-4 py-3">
            <span className="text-[#E11D48] text-xs font-mono flex-1 truncate">{sessionUrl}</span>
            <button
              onClick={copy}
              className="shrink-0 flex items-center gap-1.5 bg-[#E11D48]/10 hover:bg-[#E11D48]/20 border border-[#E11D48]/30 text-[#E11D48] text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {copied
                ? <><Check className="w-3 h-3" /> Copiado</>
                : <><Copy className="w-3 h-3" /> Copiar</>
              }
            </button>
          </div>
          <p className="text-[#2A2A4A] text-xs font-mono">
            Esperando a que tu pareja envíe sus preferencias...
          </p>
        </div>
      )}

      {/* Pulse dots */}
      <div className="flex gap-2 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"
            style={{
              animation: "dot-pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
