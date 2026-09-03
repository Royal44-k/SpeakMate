import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'

afterEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})
