import type { ECode } from './ecodes'

// Hassasiyet = E-kod sözlüğündeki "kimler dikkat etmeli" (notSuitable) metniyle kaba eşleşme.
// Veri ekibinin yapılandırılmış E-kod × durum tablosu gelene kadar geçici sezgiseldir.
export const SENSITIVITIES = {
  astim: { label: 'Astım', terms: ['astım'] },
  atopik: { label: 'Atopik dermatit / ürtiker', terms: ['atopik', 'ürtiker'] },
  migren: { label: 'Migren', terms: ['migren'] },
  dehb: { label: 'Hiperaktivite (DEHB)', terms: ['hiperaktivite', 'dikkat eksikliği'] },
  bobrek: { label: 'Böbrek hastalığı', terms: ['böbrek'] },
  gut: { label: 'Gut', terms: ['gut', 'ürik'] },
  tansiyon: { label: 'Hipertansiyon', terms: ['hipertansiyon', 'tansiyon'] },
  diyabet: { label: 'Diyabet', terms: ['diyabet'] },
  pku: { label: 'Fenilketonüri (PKU)', terms: ['pku', 'fenilketonüri'] },
  g6pd: { label: 'G6PD eksikliği', terms: ['g6pd'] },
  ibs: { label: 'Hassas bağırsak (IBS)', terms: ['ibs', 'irritabl'] },
  tiroid: { label: 'Tiroid', terms: ['tiroid'] }
} as const
export type SensKey = keyof typeof SENSITIVITIES

const low = (s: string) => s.toLocaleLowerCase('tr')
export function sensMatches(e: ECode, keys: SensKey[]): SensKey[] {
  const t = low(e.notSuitable || '')
  return keys.filter((k) => SENSITIVITIES[k].terms.some((x) => new RegExp(`(^|[^\\p{L}])${x}`, 'u').test(t)))
}

const ORG: [RegExp, string][] = [
  [/resmigazete/, 'Resmî Gazete'], [/mevzuat\.gov/, 'Mevzuat'], [/efsa/, 'EFSA'], [/who\.int/, 'WHO/JECFA'], [/inchem/, 'INCHEM'],
  [/legislation\.gov\.uk/, 'UK mevzuatı'], [/fda\.gov/, 'FDA'], [/europa\.eu/, 'AB'], [/fao\.org/, 'FAO'], [/ncbi\.nlm\.nih/, 'PubMed'], [/nature\.com/, 'Nature']
]
export function sourceBadge(u: string): { label: string; url: string } | null {
  if (!/^https?:\/\//i.test(u)) return null
  let host = ''
  try { host = new URL(u).hostname } catch { return null }
  const org = ORG.find(([r]) => r.test(host))?.[1] ?? host.replace(/^www\./, '')
  const y = /(?:^|[^\d])((?:19|20)\d\d)(?!\d)/.exec(u)?.[1]
  return { label: y ? `${org} · ${y}` : org, url: u }
}

export const firstSentence = (s: string) => { const m = /^.*?[.!?](\s|$)/s.exec(s.trim()); return (m ? m[0] : s).trim() }
export const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…')
