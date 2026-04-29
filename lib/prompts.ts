import { UserPrefs, Filters, ContentType } from "./types"

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

function jsonInstruction(contentType: ContentType): string {
  const restriction = contentType === "series"
    ? "IMPORTANTE: Recomienda SOLO series de televisión (temporadas completas). NO incluyas películas, largometrajes ni cortometrajes de ningún tipo."
    : "IMPORTANTE: Recomienda SOLO largometrajes (películas). NO incluyas series de TV, mini-series, documentales de TV ni programas de televisión de ningún tipo."
  return `${restriction}

Responde ÚNICAMENTE con un array JSON válido con este formato exacto, sin texto adicional:
[{"title":"","year":0,"platform":"","matchScore":0,"reason":""}]`
}

export function buildCouplePrompt(
  prefs1: UserPrefs,
  prefs2: UserPrefs,
  exclude: string[] = []
): string {
  const contentType = prefs1.contentType ?? "movie"
  const isSeries = contentType === "series"
  const label = isSeries ? "series" : "películas"

  const platforms = [...new Set([...prefs1.platforms, ...prefs2.platforms])].join(", ")
  const filtersText = coupleFiltersClause(prefs1.filters, prefs2.filters)
  const excludeClause = exclude.length > 0
    ? `\nNO incluyas estas ${label} que ya se mostraron: ${exclude.join(", ")}.\n`
    : ""

  const seeds1 = prefs1.seeds.length > 0
    ? `Persona 1 disfruta ${label} como: ${prefs1.seeds.join(", ")}`
    : `Persona 1 no indicó referencias de ${label}.`
  const seeds2 = prefs2.seeds.length > 0
    ? `Persona 2 disfruta ${label} como: ${prefs2.seeds.join(", ")}`
    : `Persona 2 no indicó referencias de ${label}.`

  const prompt1 = promptClause(prefs1.prompt)
  const prompt2 = prefs2.prompt?.trim() && prefs2.prompt !== prefs1.prompt
    ? `Persona 2 también pide: "${prefs2.prompt.trim()}"\n\n`
    : ""

  const expert = isSeries ? "Eres un experto en series de televisión" : "Eres un experto en cine"

  return `${expert}. Dos personas quieren ver una ${isSeries ? "serie" : "película"} juntas pero tienen gustos diferentes.

${seeds1}
${seeds2}

Ambas tienen acceso a: ${platforms}

${filtersText}${prompt1}${prompt2}Recomienda 6 ${label} que satisfagan a AMBAS personas. Busca el punto medio entre los dos perfiles de gusto.${excludeClause}

${jsonInstruction(contentType)}`
}

export function buildSoloPrompt(prefs: UserPrefs, exclude: string[] = []): string {
  const contentType = prefs.contentType ?? "movie"
  const isSeries = contentType === "series"
  const label = isSeries ? "series" : "películas"

  const platforms = prefs.platforms.join(", ")
  const filtersText = filtersClause(prefs.filters)
  const excludeClause = exclude.length > 0
    ? `\nNO incluyas estas ${label} que ya se mostraron: ${exclude.join(", ")}.\n`
    : ""

  const seedsLine = prefs.seeds.length > 0
    ? `Basándote en que a esta persona le gustan ${label} como: ${prefs.seeds.join(", ")}`
    : `El usuario no indicó referencias de ${label}.`

  const promptLine = promptClause(prefs.prompt)
  const expert = isSeries ? "Eres un experto en series de televisión" : "Eres un experto en cine"

  return `${expert}. ${seedsLine}

Tiene acceso a: ${platforms}

${filtersText}${promptLine}Recomienda 6 ${label} que disfrutaría.${excludeClause}

${jsonInstruction(contentType)}`
}
