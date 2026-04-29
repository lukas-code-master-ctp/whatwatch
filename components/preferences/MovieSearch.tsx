"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X, Loader2 } from "lucide-react"

interface SearchResult {
  id: number
  title: string
  year: number | null
  posterUrl: string | null
}

interface Props {
  selected: string[]
  onChange: (seeds: string[]) => void
  contentType?: "movie" | "series"
  maxSeeds?: number
}

export default function MovieSearch({ selected, onChange, contentType = "movie", maxSeeds = 5 }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&type=${contentType}`)
      const data = await res.json()
      setResults(data)
      setOpen(true)
      setLoading(false)
    }, 350)
  }, [query])

  function addSeed(title: string) {
    if (selected.includes(title) || selected.length >= maxSeeds) return
    onChange([...selected, title])
    setQuery("")
    setResults([])
    setOpen(false)
  }

  function removeSeed(title: string) {
    onChange(selected.filter((s) => s !== title))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="text-sm md:text-base font-medium text-[#F8FAFC]">
          {contentType === "series" ? "Series de referencia" : "Referencias cinematográficas"}
        </label>
        <span className="text-xs md:text-sm text-[#475569] font-mono">{selected.length}/{maxSeeds}</span>
      </div>
      <p className="text-xs md:text-sm text-[#475569]">
        {contentType === "series"
          ? "Series que te gustaron — la IA buscará algo similar"
          : "Películas que te gustaron — la IA buscará algo similar"}
      </p>

      <div className="relative">
        <div className="relative flex items-center">
          {loading
            ? <Loader2 className="absolute left-3 w-4 h-4 text-[#E11D48] animate-spin" strokeWidth={2} />
            : <Search className="absolute left-3 w-4 h-4 text-[#475569]" strokeWidth={1.5} />
          }
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selected.length >= maxSeeds
                ? "Límite alcanzado"
                : contentType === "series"
                  ? "Buscar serie... ej: Breaking Bad"
                  : "Buscar película... ej: Inception"
            }
            disabled={selected.length >= maxSeeds}
            className="w-full bg-[#0A0A1A] border border-white/8 hover:border-white/15 focus:border-[#E11D48]/50 rounded-xl pl-9 pr-4 py-2.5 md:py-3 text-sm md:text-base transition-colors outline-none placeholder:text-[#475569] disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        {open && results.length > 0 && (
          <ul className="absolute z-20 w-full mt-1.5 bg-[#0F0F23] border border-white/8 rounded-xl overflow-hidden shadow-2xl">
            {results.map((r) => (
              <li
                key={r.id}
                onClick={() => addSeed(r.title)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1A1A35] cursor-pointer text-sm transition-colors"
              >
                {r.posterUrl ? (
                  <img src={r.posterUrl} alt={r.title} className="w-8 h-12 object-cover rounded-md flex-shrink-0" />
                ) : (
                  <div className="w-8 h-12 rounded-md bg-white/5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium text-[#F8FAFC]">{r.title}</p>
                  {r.year && <p className="text-[#475569] text-xs font-mono">{r.year}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((title) => (
            <span
              key={title}
              className="flex items-center gap-1.5 bg-[#E11D48]/10 border border-[#E11D48]/30 rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] font-medium"
            >
              {title}
              <button
                onClick={() => removeSeed(title)}
                className="text-[#E11D48]/60 hover:text-[#E11D48] transition-colors cursor-pointer leading-none"
                aria-label={`Quitar ${title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
