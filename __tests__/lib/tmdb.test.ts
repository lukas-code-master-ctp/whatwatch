import { searchMovies, enrichMovies, posterUrl, genreName } from "@/lib/tmdb"
import { AIMovie } from "@/lib/types"

const mockTMDBResult = {
  id: 27205,
  title: "Inception",
  release_date: "2010-07-16",
  poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
  vote_average: 8.4,
  genre_ids: [28, 878, 53],
  overview: "Cobb steals information...",
}

const mockDetails = { runtime: 148 }

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe("searchMovies", () => {
  test("returns mapped results from TMDB", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [mockTMDBResult] }),
    })

    const results = await searchMovies("Inception")
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(27205)
    expect(results[0].title).toBe("Inception")
  })

  test("returns empty array when fetch fails", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const results = await searchMovies("anything")
    expect(results).toEqual([])
  })
})

describe("enrichMovies", () => {
  test("merges AI movie data with TMDB metadata", async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [mockTMDBResult] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDetails })

    const aiMovies: AIMovie[] = [{
      title: "Inception",
      year: 2010,
      platform: "netflix",
      matchScore: 92,
      reason: "Similar thriller tone",
    }]

    const movies = await enrichMovies(aiMovies)
    expect(movies[0].posterUrl).toContain("/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg")
    expect(movies[0].rating).toBe(8.4)
    expect(movies[0].duration).toBe(148)
    expect(movies[0].matchScore).toBe(92)
  })

  test("returns null fields when TMDB has no match", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })

    const aiMovies: AIMovie[] = [{
      title: "Unknown Movie",
      year: 2023,
      platform: "netflix",
      matchScore: 80,
      reason: "Good pick",
    }]

    const movies = await enrichMovies(aiMovies)
    expect(movies[0].posterUrl).toBeNull()
    expect(movies[0].rating).toBeNull()
    expect(movies[0].duration).toBeNull()
  })
})

describe("genreName", () => {
  test("returns genre name for known id", () => {
    expect(genreName([28])).toBe("Acción")
  })

  test("returns null for unknown ids", () => {
    expect(genreName([99999])).toBeNull()
  })
})

describe("posterUrl", () => {
  test("returns full URL for valid path", () => {
    expect(posterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg")
  })

  test("returns null for null path", () => {
    expect(posterUrl(null)).toBeNull()
  })
})
