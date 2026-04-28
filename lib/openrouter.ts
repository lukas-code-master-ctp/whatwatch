import { AIMovie } from "./types"

export async function getRecommendations(prompt: string): Promise<AIMovie[]> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured")

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-lite-001",
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? "[]"

  const stripped = content
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")

  const jsonMatch = stripped.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
