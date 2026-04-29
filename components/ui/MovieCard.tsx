import { Star, Film } from "lucide-react"
import { Movie } from "@/lib/types"

interface Props {
  movie: Movie
}

function platformColor(platform: string): string {
  const p = platform.toLowerCase()
  if (p.includes("netflix")) return "text-red-400"
  if (p.includes("disney")) return "text-blue-400"
  if (p.includes("prime") || p.includes("amazon")) return "text-sky-400"
  if (p.includes("hbo") || p.includes("max")) return "text-purple-400"
  if (p.includes("apple")) return "text-white/70"
  return "text-[#94A3B8]"
}

export default function MovieCard({ movie }: Props) {
  const color = platformColor(movie.platform ?? "")

  return (
    <div className="group bg-[#0A0A1A] border border-white/6 rounded-xl overflow-hidden flex flex-col hover:border-[#E11D48]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(225,29,72,0.1)]">
      {/* Poster */}
      <div className="aspect-[2/3] bg-[#0F0F23] relative overflow-hidden">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-10 h-10 text-white/10" strokeWidth={1} />
          </div>
        )}

        {/* Match score badge */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/80 backdrop-blur-sm border border-[#E11D48]/40 text-[#E11D48] text-xs md:text-sm font-bold px-2 py-0.5 rounded-full font-mono">
          {movie.matchScore}%
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A0A1A] to-transparent" />
      </div>

      {/* Info */}
      <div className="p-3 md:p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-sm md:text-base leading-tight text-[#F8FAFC] line-clamp-2">{movie.title}</h3>

        <div className="flex items-center gap-1.5 text-xs md:text-sm text-[#475569] font-mono">
          <span>{movie.year}</span>
          {movie.genre && <><span>·</span><span className="truncate">{movie.genre}</span></>}
          {movie.duration && <><span>·</span><span className="shrink-0">{movie.duration}m</span></>}
        </div>

        {movie.rating && (
          <div className="flex items-center gap-1 text-xs md:text-sm text-yellow-400 font-mono">
            <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-yellow-400" />
            {movie.rating.toFixed(1)}
          </div>
        )}

        <div className={`text-xs md:text-sm font-medium ${color}`}>{movie.platform}</div>

        {movie.reason && (
          <p className="text-xs md:text-sm text-[#475569] mt-auto pt-1.5 leading-relaxed line-clamp-3 border-t border-white/4">
            {movie.reason}
          </p>
        )}
      </div>
    </div>
  )
}
