import { createContext, useContext } from 'react'
import type { Profile } from '../engine'
import type { Product } from '../data/catalog'

export type View =
  | { k: 'result'; id: string }
  | { k: 'additive'; code: string }
  | { k: 'search'; pick?: 'a' | 'b' | 'fix'; fixId?: string }
  | { k: 'error'; kind: 'barcode' | 'unknown' | 'ocr' | 'perm'; ean?: string }
  | { k: 'photo' }
  | { k: 'privacy' }
  | { k: 'about' }
  | { k: 'profileEdit'; id: string }

export interface Ctx {
  profiles: Profile[]
  profile: Profile
  setActive: (id: string) => void
  saveProfile: (p: Profile) => void
  addProfile: (name: string, child: boolean) => string
  deleteProfile: (id: string) => void
  health: boolean
  grantHealth: () => void
  history: { id: string; t: number }[]
  addHistory: (id: string) => void
  clearHistory: () => void
  saved: string[]
  toggleSaved: (id: string) => void
  compare: [string | null, string | null]
  setCompare: (c: [string | null, string | null]) => void
  temp: Product | null
  setTemp: (p: Product | null) => void
  flagged: Record<string, boolean>
  report: (type: 'wrong' | 'request' | 'feedback', payload: Record<string, unknown>) => void
  push: (v: View) => void
  back: () => void
  goTab: (t: string) => void
  openAssistant: (code?: string) => void
  openProfiles: () => void
  online: boolean
  eraseAll: () => void
}
export const AppCtx = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(AppCtx)
