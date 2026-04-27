import { Movie } from "@/lib/types"

interface Props {
  movie: Movie
}

export default function MovieCard({ movie }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-colors">
      <div className="aspect-[2/3] bg-zinc-800 relative">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">
            🎬
          </div>
        )}
        <div className="absolute top-2 right-2 bg-violet-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          {movie.matchScore}%
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-sm leading-tight">{movie.title}</h3>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{movie.year}</span>
          {movie.genre && <><span>·</span><span>{movie.genre}</span></>}
          {movie.duration && <><span>·</span><span>{movie.duration} min</span></>}
        </div>

        {movie.rating && (
          <div className="text-xs text-yellow-400">⭐ {movie.rating.toFixed(1)}</div>
        )}

        <div className="text-xs text-green-400 font-medium">{movie.platform} ✓</div>

        {movie.reason && (
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-3">
            {movie.reason}
          </p>
        )}
      </div>
    </div>
  )
}
