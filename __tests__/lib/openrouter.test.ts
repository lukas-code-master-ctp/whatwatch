import { getRecommendations } from "@/lib/openrouter"

beforeEach(() => {
  global.fetch = jest.fn()
  process.env.OPENROUTER_API_KEY = "test-key"
})

afterEach(() => {
  jest.resetAllMocks()
  delete process.env.OPENROUTER_API_KEY
})

const validResponse = [
  { title: "Shrek", year: 2001, platform: "netflix", matchScore: 95, reason: "Hero with heart" },
]

describe("getRecommendations", () => {
  test("parses valid JSON array from response", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(validResponse) } }],
      }),
    })

    const results = await getRecommendations("test prompt")
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe("Shrek")
    expect(results[0].matchScore).toBe(95)
  })

  test("returns empty array when response is malformed JSON", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Sorry I cannot help with that." } }],
      }),
    })

    const results = await getRecommendations("test prompt")
    expect(results).toEqual([])
  })

  test("throws when API returns non-ok status", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429 })
    await expect(getRecommendations("test")).rejects.toThrow("OpenRouter error: 429")
  })

  test("parses JSON array wrapped in markdown code fence", async () => {
    const fencedContent = "Here are the results:\n```json\n" + JSON.stringify(validResponse) + "\n```"
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: fencedContent } }],
      }),
    })

    const results = await getRecommendations("test prompt")
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe("Shrek")
  })
})
