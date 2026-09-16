import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, clearApiCache } from './client'

describe('apiGet cache', () => {
  beforeEach(() => {
    clearApiCache()
  })

  afterEach(() => {
    clearApiCache()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('serves repeat calls from cache without refetching', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'pikachu' }) }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const first = await apiGet('/pokemon/pikachu')
    const second = await apiGet('/pokemon/pikachu')

    expect(first).toEqual({ name: 'pikachu' })
    expect(second).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('dedupes concurrent calls for the same URL', async () => {
    let resolve!: (value: unknown) => void
    const fetchMock = vi.fn(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const first = apiGet('/pokemon/bulbasaur')
    const second = apiGet('/pokemon/bulbasaur')
    resolve({ ok: true, json: () => Promise.resolve({ name: 'bulbasaur' }) })

    await expect(first).resolves.toEqual({ name: 'bulbasaur' })
    await expect(second).resolves.toEqual({ name: 'bulbasaur' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('evicts failed requests so they can be retried', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ name: 'squirtle' }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiGet('/pokemon/squirtle')).rejects.toThrow(/Request failed/)
    const retry = await apiGet('/pokemon/squirtle')
    expect(retry).toEqual({ name: 'squirtle' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('refetches after the TTL expires', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'charmander' }) }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiGet('/pokemon/charmander')
    vi.advanceTimersByTime(16 * 60 * 1000)
    await apiGet('/pokemon/charmander')

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})