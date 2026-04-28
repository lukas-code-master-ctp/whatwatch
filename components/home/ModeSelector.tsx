"use client"

import { useState } from "react"
import { Film, Users, User, ArrowRight, Link } from "lucide-react"

interface Props {
  onCouple: () => void
  onSolo: () => void
  onLink: (url: string) => void
  loading: boolean
}

export default function ModeSelector({ onCouple, onSolo, onLink, loading }: Props) {
  const [link, setLink] = useState("")

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen gap-8 p-6 cinema-grid overflow-hidden">
      {/* Red radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(225,29,72,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E11D48]/10 border border-[#E11D48]/30 glow-red-box">
          <Film className="w-8 h-8 text-[#E11D48]" strokeWidth={1.5} />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight cinema-text">
            WhatWatch
          </h1>
          <p className="text-[#64748B] text-sm tracking-widest uppercase font-mono">
            ¿Qué vemos hoy?
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#E11D48]/25 bg-[#E11D48]/8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
          <span className="text-[#E11D48] text-xs font-mono tracking-wider">AI-POWERED</span>
        </div>
      </div>

      {/* Mode buttons */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          onClick={onCouple}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-3 bg-[#E11D48] hover:bg-[#BE1942] disabled:opacity-50 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 cursor-pointer glow-red-box hover:scale-[1.02] active:scale-[0.98]"
        >
          <Users className="w-5 h-5" strokeWidth={2} />
          Ver en pareja
        </button>
        <button
          onClick={onSolo}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-3 bg-[#0A0A1A] hover:bg-[#0F0F23] disabled:opacity-50 border border-white/10 hover:border-white/20 text-[#F8FAFC] py-4 px-6 rounded-xl font-semibold transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <User className="w-5 h-5" strokeWidth={2} />
          Ver solo
        </button>
      </div>

      {/* Divider */}
      <div className="relative z-10 flex items-center gap-3 w-full max-w-md">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[#475569] text-xs font-mono tracking-wider">o tengo un link</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* Link input */}
      <div className="relative z-10 flex gap-2 w-full max-w-md">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" strokeWidth={1.5} />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Pegar link de sesión..."
            className="w-full bg-[#0A0A1A] border border-white/8 hover:border-white/15 focus:border-[#E11D48]/60 rounded-xl pl-9 pr-4 py-3 text-sm transition-colors outline-none placeholder:text-[#475569] font-mono"
          />
        </div>
        <button
          onClick={() => onLink(link)}
          disabled={!link.includes("/session/")}
          className="flex items-center gap-1.5 bg-[#0A0A1A] hover:bg-[#0F0F23] disabled:opacity-30 border border-white/8 hover:border-white/20 disabled:cursor-not-allowed text-[#F8FAFC] px-4 rounded-xl text-sm font-medium transition-all cursor-pointer"
        >
          Ir
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom tagline */}
      <p className="relative z-10 text-[#2A2A4A] text-xs font-mono text-center">
        Recomendaciones personalizadas mediante inteligencia artificial
      </p>
    </div>
  )
}
