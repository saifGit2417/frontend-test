export const API_BASE = 'https://pokeapi.co/api/v2'

const API_CACHE_TTL_MS = 15 * 60 * 1000

type CacheEntry = {
  promise: Promise<unknown>
  expiresAt: number
}

const apiCache = new Map<string, CacheEntry>()

export function clearApiCache() {
  apiCache.clear()
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const entry = apiCache.get(url)
  if (entry && entry.expiresAt > Date.now()) {
    return entry.promise as Promise<T>
  }

  const promise = fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${url}`)
    }
    return response.json()
  })

  apiCache.set(url, { promise, expiresAt: Date.now() + API_CACHE_TTL_MS })

  promise.catch(() => {
    if (apiCache.get(url)?.promise === promise) {
      apiCache.delete(url)
    }
  })

  return promise
}