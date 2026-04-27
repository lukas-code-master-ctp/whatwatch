import { buildCouplePrompt, buildSoloPrompt } from "@/lib/prompts"
import { UserPrefs } from "@/lib/types"

const prefs1: UserPrefs = {
  seeds: ["Avengers", "Iron Man"],
  platforms: ["netflix", "disney"],
  filters: { yearFrom: null, yearTo: null, genres: null, duration: null },
}

const prefs2: UserPrefs = {
  seeds: ["Cenicienta", "Encanto"],
  platforms: ["netflix", "disney"],
  filters: { yearFrom: 2010, yearTo: 2020, genres: null, duration: null },
}

describe("buildCouplePrompt", () => {
  test("includes both seed lists", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    expect(prompt).toContain("Avengers, Iron Man")
    expect(prompt).toContain("Cenicienta, Encanto")
  })

  test("includes merged platform list without duplicates", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    const netflixCount = (prompt.match(/netflix/gi) ?? []).length
    expect(netflixCount).toBe(1)
  })

  test("includes year filter from prefs2 when set", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    expect(prompt).toContain("2010")
    expect(prompt).toContain("2020")
  })

  test("omits year clause when both yearFrom and yearTo are null", () => {
    const prompt = buildCouplePrompt(prefs1, prefs1)
    expect(prompt).not.toContain("estrenadas entre")
  })

  test("appends exclude clause when exclude list provided", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2, ["Shrek", "Encanto"])
    expect(prompt).toContain("Shrek")
    expect(prompt).toContain("NO incluyas")
  })

  test("returns valid JSON array instruction", () => {
    const prompt = buildCouplePrompt(prefs1, prefs2)
    expect(prompt).toContain('"title"')
  })
})

describe("buildSoloPrompt", () => {
  test("includes seed list and platforms", () => {
    const prompt = buildSoloPrompt(prefs1)
    expect(prompt).toContain("Avengers, Iron Man")
    expect(prompt).toContain("netflix")
  })

  test("includes year filter when set", () => {
    const prompt = buildSoloPrompt(prefs2)
    expect(prompt).toContain("2010")
  })

  test("appends exclude clause", () => {
    const prompt = buildSoloPrompt(prefs1, ["Interstellar"])
    expect(prompt).toContain("Interstellar")
    expect(prompt).toContain("NO incluyas")
  })
})
