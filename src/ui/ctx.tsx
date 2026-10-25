import { createContext, useContext } from 'react'
import type { Profile } from '../engine'

export type View =
  | { k: 'result'; id: string }
  | { k: 'additive'; code: string }
  | { k: 'search'; pick?: 'a' | 'b' }
  | { k: 'notfound'; ean: string }
  | { k: 'privacy' }
  | { k: 'about' }

export interface Ctx {
  profile: Profile
  setProfile: (p: Profile) => void
  history: { id: string; t: number }[]
  addHistory: (id: string) => void
  clearHistory: () => void
  saved: string[]
  toggleSaved: (id: string) => void
  compare: [string | null, string | null]
  setCompare: (c: [string | null, string | null]) => void
  push: (v: View) => void
  back: () => void
  goTab: (t: string) => void
  eraseAll: () => void
}
export const AppCtx = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(AppCtx)
