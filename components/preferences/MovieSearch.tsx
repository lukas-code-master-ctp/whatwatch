"use client"

import { useState, useRef, useEffect } from "react"

interface SearchResult {
  id: number
  title: string
  year: number | null
  posterUrl: string | null
}

interface Props {
  selected: string[]
  onChange: (seeds: string[]) => void
  maxSeeds?: number
}

export default function MovieSearch({ selected, onChange, maxSeeds = 5 }: Props) {
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
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`)
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
      <label className="text-sm text-zinc-400">
        ¿Qué tipo de película te provoca ver hoy? <span className="text-zinc-500">(elige 1–{maxSeeds})</span>
      </label>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar película... ej: Inception"
          disabled={selected.length >= maxSeeds}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />
        {loading && (
          <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">Buscando...</span>
        )}

        {open && results.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
            {results.map((r) => (
              <li
                key={r.id}
                onClick={() => addSeed(r.title)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 cursor-pointer text-sm"
              >
                {r.posterUrl && (
                  <img src={r.posterUrl} alt={r.title} className="w-8 h-12 object-cover rounded" />
                )}
                <span>
                  {r.title}
                  {r.year && <span className="text-zinc-500 ml-1">({r.year})</span>}
                </span>
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
              className="flex items-center gap-1.5 bg-violet-900/50 border border-violet-700 rounded-full px-3 py-1 text-sm text-violet-200"
            >
              {title}
              <button
                onClick={() => removeSeed(title)}
                className="text-violet-400 hover:text-white leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
