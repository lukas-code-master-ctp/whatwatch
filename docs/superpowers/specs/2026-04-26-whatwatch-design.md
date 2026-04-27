# WhatWatch — Diseño de Aplicación

**Fecha:** 2026-04-26  
**Estado:** Aprobado  

---

## Resumen

Aplicación web para ayudar a elegir qué película ver. Resuelve el problema de la indecisión al sentarse a ver algo, especialmente en pareja con gustos distintos. El usuario ingresa películas de referencia (semillas) y la IA genera recomendaciones personalizadas filtradas por los servicios de streaming disponibles.

---

## Modos de uso

### Modo pareja
1. Usuario 1 crea una sesión y recibe un link único
2. Comparte el link con su pareja (por WhatsApp u otro medio)
3. Cada uno ingresa sus películas semilla y filtros de forma independiente (asíncrono)
4. Cuando ambos enviaron sus preferencias, la IA genera recomendaciones que satisfacen a ambos
5. Los dos ven los resultados automáticamente (polling cada 3 segundos)

### Modo solo
1. El usuario ingresa sus películas semilla y filtros
2. La IA genera recomendaciones inmediatamente
3. Sin espera ni link para compartir

---

## Arquitectura

### Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes (mismo proyecto) |
| Datos de películas | TMDB API (gratuita) |
| IA / matching | OpenRouter — modelo `google/gemini-flash-1.5` |
| Sesiones | Map en memoria del servidor (sin base de datos) |
| Deploy | Vercel (plan gratuito) |
| Slider de año | @radix-ui/slider |

### Componentes del sistema

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  Home → Preferencias → Esperando / Solo → Resultados│
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│                 API Routes (Next.js)                 │
│  POST /api/session                                   │
│  POST /api/session/[id]/prefs                        │
│  GET  /api/session/[id]/match                        │
└──────┬─────────────────────────┬───────────────────┘
       │                         │
┌──────▼──────┐         ┌────────▼────────┐
│  TMDB API   │         │  OpenRouter API  │
│  búsqueda   │         │  matching IA     │
│  pósters    │         │  JSON response   │
│  metadata   │         └─────────────────┘
└─────────────┘
```

### API Routes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/session` | Crea sesión, devuelve `{ id, url }` |
| `POST` | `/api/session/[id]/prefs` | Guarda preferencias de un usuario |
| `GET`  | `/api/session/[id]/match` | Devuelve resultados si ambos enviaron; 202 si aún espera |

---

## Pantallas

### 1. Home
- Botón **"Ver en pareja"** → crea sesión y redirige a Preferencias
- Botón **"Ver solo"** → redirige a Preferencias en modo solo
- Input para pegar un link de sesión existente

### 2. Preferencias (ambos modos)
- Buscador de películas semilla (integrado con TMDB) — mínimo 1, máximo 5
- Chips seleccionables con las películas elegidas (removibles)
- Selector de plataformas de streaming (Netflix, Disney+, Prime Video, Max, Apple TV+)
- **Filtros opcionales:**
  - Slider de período (año desde / año hasta) — rango 1950–2025
  - Géneros (Acción, Comedia, Drama, Terror, Animación, etc.) — multiselect
  - Duración (Corta <90 min / Normal 90–130 min / Larga >130 min)
- Botón "Listo →"

### 3. Esperando pareja (solo modo pareja)
- Link copiable con la URL de la sesión
- Indicador de estado: "Esperando que tu pareja envíe sus preferencias..."
- Polling automático al endpoint `/api/session/[id]/match` cada 3 segundos
- Al recibir resultados → redirige automáticamente a Resultados

### 4. Resultados (ambos modos)
- Título: "X películas perfectas para esta noche"
- Cards de películas con: póster (TMDB), título, año, género, duración, plataforma disponible, % de match
- Botón "Buscar más opciones" (llama de nuevo a la IA añadiendo al prompt: "Excluye estas películas: {títulos ya mostrados}" para obtener resultados frescos)

---

## Modelo de datos

### Sesión (en memoria — expira a las 24h)

```typescript
interface Session {
  id: string               // UUID v4
  mode: "couple" | "solo"
  createdAt: number        // timestamp ms
  expiresAt: number        // createdAt + 24h
  users: UserPrefs[]       // 1 en solo, hasta 2 en pareja
  results: Movie[] | null  // null hasta que la IA responda
}

interface UserPrefs {
  seeds: string[]          // nombres de películas semilla (1–5)
  platforms: Platform[]    // ["netflix", "disney", "prime", "hbo", "apple"]
  filters: {
    yearFrom: number | null  // v1: implementado con slider
    yearTo:   number | null  // v1: implementado con slider
    genres:   string[] | null   // v2: campo preparado, sin UI en v1
    duration: "short" | "normal" | "long" | null  // v2: campo preparado, sin UI en v1
  }
}

interface Movie {
  title:       string
  year:        number
  platform:    string
  posterUrl:   string      // desde TMDB
  rating:      number      // desde TMDB
  genre:       string
  duration:    number      // minutos, desde TMDB
  overview:    string
  matchScore:  number      // 0–100, devuelto por la IA
  reason:      string      // explicación del match, devuelta por la IA
}

type Platform = "netflix" | "disney" | "prime" | "hbo" | "apple"
```

---

## Lógica de IA

### Prompt — Modo pareja

```
Eres un experto en cine. Dos personas quieren ver una película juntas
pero tienen gustos diferentes.

Persona 1 disfruta películas como: {seeds1.join(", ")}
Persona 2 disfruta películas como: {seeds2.join(", ")}

Ambas tienen acceso a: {platforms.join(", ")}

{if yearFrom} Solo películas entre {yearFrom} y {yearTo}. {/if}
{if genres} Géneros preferidos: {genres.join(", ")}. {/if}
{if duration} Duración aproximada: {durationLabel}. {/if}

Recomienda 6 películas que satisfagan a AMBAS personas. Busca el punto
medio entre los dos perfiles de gusto.

Responde ÚNICAMENTE con un array JSON válido con este formato:
[{ "title": "", "year": 0, "platform": "", "matchScore": 0, "reason": "" }]
```

### Prompt — Modo solo

```
Eres un experto en cine. Basándote en que a esta persona le gustan
películas como: {seeds.join(", ")}

Tiene acceso a: {platforms.join(", ")}

{filtros opcionales igual que arriba}

Recomienda 6 películas similares.

Responde ÚNICAMENTE con un array JSON válido con este formato:
[{ "title": "", "year": 0, "platform": "", "matchScore": 0, "reason": "" }]
```

### Enriquecimiento con TMDB

Después de recibir la respuesta de la IA, para cada película:
1. Buscar en TMDB por título + año
2. Obtener: `poster_path`, `vote_average`, `genre_ids`, `runtime`, `overview`
3. Combinar datos de IA + TMDB en el objeto `Movie` final

### Modelo recomendado
- **Principal:** `google/gemini-flash-1.5` — rápido, barato (~$0.001/sesión), excelente para JSON estructurado
- **Alternativa:** `claude-haiku-4-5` — mejor razonamiento cultural si los resultados no son precisos

---

## Variables de entorno

```env
TMDB_API_KEY=...
OPENROUTER_API_KEY=...
```

---

## Fuera de alcance (v1)

- Autenticación / cuentas de usuario
- Historial de películas ya vistas
- Base de datos persistente
- Modo tiempo real (WebSockets / Tinder-style)
- Filtros de género y duración (marcados como "próximamente" en UI)
- App móvil nativa
