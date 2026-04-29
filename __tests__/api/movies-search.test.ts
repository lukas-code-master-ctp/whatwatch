/**
 * @jest-environment node
 */
// __tests__/api/movies-search.test.ts
import { GET } from "@/app/api/movies/search/route"
import { NextRequest } from "next/server"
import * as tmdb from "@/lib/tmdb"

jest.mock("@/lib/tmdb", () => ({
  ...jest.requireActual("@/lib/tmdb"),
  searchMovies: jest.fn(),
}))

describe("GET /api/movies/search", () => {
  test("returns TMDB results for query", async () => {
    jest.mocked(tmdb.searchMovies).mockResolvedValue([
      {
        id: 1,
        title: "Inception",
        original_title: "Inception",
        release_date: "2010-07-16",
        poster_path: "/img.jpg",
        vote_average: 8.4,
        genre_ids: [878],
        overview: "Dream heist",
      },
    ])

    const req = new NextRequest("http://localhost/api/movies/search?q=Inception")
    const res = await GET(req)
    const data = await res.json()

    expect(data).toHaveLength(1)
    expect(data[0].title).toBe("Inception")
    expect(data[0].posterUrl).toContain("/img.jpg")
  })

  test("returns empty array for short query", async () => {
    const req = new NextRequest("http://localhost/api/movies/search?q=a")
    const res = await GET(req)
    const data = await res.json()
    expect(data).toEqual([])
    expect(tmdb.searchMovies).not.toHaveBeenCalled()
  })
})
