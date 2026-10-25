import { mockEngine } from './mock'
import type { Engine } from './types'

// AI ekibinin API'si hazır olunca burada HttpEngine'e geçilecek (VITE_ENGINE=api).
export const engine: Engine = mockEngine
export * from './types'
