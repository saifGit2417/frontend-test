import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { clearApiCache } from '../api/client'

afterEach(() => {
  clearApiCache()
})