import { useEffect, useState } from 'react'
import { loadECodes, type ECode } from './ecodes'
let cache: ECode[] | null = null
export function useECodes(): ECode[] | null {
  const [v, setV] = useState<ECode[] | null>(cache)
  useEffect(() => { if (!cache) loadECodes().then((x) => { cache = x; setV(x) }) }, [])
  return v
}
