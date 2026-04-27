import { UserPrefs, Filters } from "./types"

function filtersClause(filters: Filters): string {
  if (filters.yearFrom !== null && filters.yearTo !== null) {
    return `Solo películas estrenadas entre ${filters.yearFrom} y ${filters.yearTo}.\n\n`
  }
  return ""
}

const JSON_INSTRUCTION = `Responde ÚNICAMENTE con un array JSON válido con este formato exacto, sin texto adicional:
[{"title":"","year":0,"platform":"","matchScore":0,"reason":""}]`

function coupleFiltersClause(f1: Filters, f2: Filters): string {
  const active = f1.yearFrom !== null ? f1 : f2.yearFrom !== null ? f2 : null
  if (!active || active.yearFrom === null || active.yearTo === null) return ""
  return `Solo películas estrenadas entre ${active.yearFrom} y ${active.yearTo}.\n\n`
}

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

  return `Eres un experto en cine. Dos personas quieren ver una película juntas pero tienen gustos diferentes.

Persona 1 disfruta películas como: ${prefs1.seeds.join(", ")}
Persona 2 disfruta películas como: ${prefs2.seeds.join(", ")}

Ambas tienen acceso a: ${platforms}

${filtersText}Recomienda 6 películas que satisfagan a AMBAS personas. Busca el punto medio entre los dos perfiles de gusto.${excludeClause}

${JSON_INSTRUCTION}`
}

export function buildSoloPrompt(prefs: UserPrefs, exclude: string[] = []): string {
  const platforms = prefs.platforms.join(", ")
  const filtersText = filtersClause(prefs.filters)
  const excludeClause = exclude.length > 0
    ? `\nNO incluyas estas películas que ya se mostraron: ${exclude.join(", ")}.\n`
    : ""

  return `Eres un experto en cine. Basándote en que a esta persona le gustan películas como: ${prefs.seeds.join(", ")}

Tiene acceso a: ${platforms}

${filtersText}Recomienda 6 películas similares que disfrutaría.${excludeClause}

${JSON_INSTRUCTION}`
}
