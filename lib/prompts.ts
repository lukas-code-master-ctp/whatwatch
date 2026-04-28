import { UserPrefs, Filters } from "./types"

function filtersClause(filters: Filters): string {
  if (filters.yearFrom !== null && filters.yearTo !== null) {
    return `Solo películas estrenadas entre ${filters.yearFrom} y ${filters.yearTo}.\n\n`
  }
  return ""
}

function coupleFiltersClause(f1: Filters, f2: Filters): string {
  const active = f1.yearFrom !== null ? f1 : f2.yearFrom !== null ? f2 : null
  if (!active || active.yearFrom === null || active.yearTo === null) return ""
  return `Solo películas estrenadas entre ${active.yearFrom} y ${active.yearTo}.\n\n`
}

function promptClause(prompt: string | undefined): string {
  if (!prompt?.trim()) return ""
  return `Además, el usuario pide específicamente: "${prompt.trim()}"\nTen esto en cuenta como criterio de refinamiento.\n\n`
}

const JSON_INSTRUCTION = `Responde ÚNICAMENTE con un array JSON válido con este formato exacto, sin texto adicional:
[{"title":"","year":0,"platform":"","matchScore":0,"reason":""}]`

export function buildCouplePrompt(
  prefs1: UserPrefs,
  prefs2: UserPrefs,
  exclude: string[] = []
): string {
  const platforms = [...new Set([...prefs1.platforms, ...prefs2.platforms])].join(", ")
  const filtersText = coupleFiltersClause(prefs1.filters, prefs2.filters)
  const excludeClause = exclude.length > 0
    ? `\nNO incluyas estas películas que ya se mostraron: ${exclude.join(", ")}.\n`
    : ""

  const seeds1 = prefs1.seeds.length > 0
    ? `Persona 1 disfruta películas como: ${prefs1.seeds.join(", ")}`
    : "Persona 1 no indicó referencias de películas."
  const seeds2 = prefs2.seeds.length > 0
    ? `Persona 2 disfruta películas como: ${prefs2.seeds.join(", ")}`
    : "Persona 2 no indicó referencias de películas."

  const prompt1 = promptClause(prefs1.prompt)
  const prompt2 = prefs2.prompt?.trim() && prefs2.prompt !== prefs1.prompt
    ? `Persona 2 también pide: "${prefs2.prompt.trim()}"\n\n`
    : ""

  return `Eres un experto en cine. Dos personas quieren ver una película juntas pero tienen gustos diferentes.

${seeds1}
${seeds2}

Ambas tienen acceso a: ${platforms}

${filtersText}${prompt1}${prompt2}Recomienda 6 películas que satisfagan a AMBAS personas. Busca el punto medio entre los dos perfiles de gusto.${excludeClause}

${JSON_INSTRUCTION}`
}

export function buildSoloPrompt(prefs: UserPrefs, exclude: string[] = []): string {
  const platforms = prefs.platforms.join(", ")
  const filtersText = filtersClause(prefs.filters)
  const excludeClause = exclude.length > 0
    ? `\nNO incluyas estas películas que ya se mostraron: ${exclude.join(", ")}.\n`
    : ""

  const seedsLine = prefs.seeds.length > 0
    ? `Basándote en que a esta persona le gustan películas como: ${prefs.seeds.join(", ")}`
    : "El usuario no indicó películas de referencia."

  const promptLine = promptClause(prefs.prompt)

  return `Eres un experto en cine. ${seedsLine}

Tiene acceso a: ${platforms}

${filtersText}${promptLine}Recomienda 6 películas que disfrutaría.${excludeClause}

${JSON_INSTRUCTION}`
}
