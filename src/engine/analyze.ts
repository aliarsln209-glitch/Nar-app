import type { Product } from '../data/catalog'
import type { ECode } from '../data/ecodes'
import { SENSITIVITIES, sensMatches, type SensKey } from '../data/sensitivity'
import { ALLERGIES, type AllergyKey, type Profile } from './types'
import { evaluateProduct, type RuleResult } from './rules'

export type Level = 'clear' | 'caution' | 'unknown' | 'noprofile'
export interface Warn { kind: 'allergy' | 'sens' | 'info'; title: string; text: string; code?: string }
export interface Analysis {
  level: Level
  alert: boolean // alerji eşleşmesi var (listelerde kırmızı rozet)
  sub: string
  rows: { key: AllergyKey; label: string; result: RuleResult }[]
  warnings: Warn[]
  checkedText: string
  labelUsable: boolean
  labelNote: string | null
  codes: string[]
  counts: { allergy: number; sens: number; ingredients: number }
}

export function eCodesIn(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(/(^|[^A-Za-z0-9])E[\s-]?(\d{3,4}[a-z]?)(?![A-Za-z0-9])/gi)) out.add('E' + m[2].toUpperCase())
  return [...out]
}
const list = (a: string[]) => (a.length <= 2 ? a.join(' ve ') : `${a.slice(0, 2).join(', ')} ve ${a.length - 2} diğer`)

export function analyze(p: Product, profile: Profile, ecodes: ECode[] | null): Analysis {
  const usable = p.matchStatus === 'verified' && !!p.label?.ingredients
  const ing = usable ? p.label!.ingredients : ''
  const results = evaluateProduct(
    { product_name: p.name, ingredients: usable ? ing : null, allergen_statement: usable ? p.label!.allergenStatement : null },
    profile.allergies
  )
  const rows = results.map((r) => ({ key: r.category_key as AllergyKey, label: ALLERGIES[r.category_key as AllergyKey] ?? r.category_name, result: r }))
  const codes = usable ? eCodesIn(ing) : []
  const warnings: Warn[] = []
  for (const r of rows) {
    const s = r.result.status
    if (s === 'contains' || s === 'may_contain' || s === 'ambiguous') warnings.push({ kind: 'allergy', title: r.label, text: r.result.warning_text })
  }
  let sensCount = 0
  if (ecodes) {
    for (const c of codes) {
      const e = ecodes.find((x) => x.code.toUpperCase() === c)
      if (!e) continue
      const hits = sensMatches(e, profile.sensitivities)
      if (hits.length) { sensCount++; warnings.push({ kind: 'sens', code: c, title: `${c} · ${e.name}`, text: `${hits.map((k) => SENSITIVITIES[k].label).join(', ')} hassasiyetinle ilgili.` }) }
      else warnings.push({ kind: 'info', code: c, title: `${c} · ${e.name}`, text: e.tags[0] ?? '' })
    }
  }
  const alertN = warnings.filter((w) => w.kind === 'allergy').length
  const hasAny = profile.allergies.length + profile.sensitivities.length > 0
  const st = (s: string) => rows.some((r) => r.result.status === s)
  let level: Level
  let sub = ''
  const names = [...rows.filter((r) => ['contains', 'may_contain', 'ambiguous'].includes(r.result.status)).map((r) => r.label), ...warnings.filter((w) => w.kind === 'sens').map((w) => w.code!)]
  if (!hasAny) { level = 'noprofile'; sub = 'Profil seçilmedi; yalnızca genel bilgi gösteriliyor' }
  else if (alertN > 0 || sensCount > 0) { level = 'caution'; sub = `${list(names)}, profilinle ilgili` }
  else if (!usable || st('insufficient_data')) { level = 'unknown'; sub = p.matchStatus === 'no_label' ? 'Bu ürünün etiket bilgisi henüz yok' : 'Bu ürünün etiketi inceleniyor' }
  else { level = 'clear'; sub = `${list([...profile.allergies.map((k) => ALLERGIES[k].toLocaleLowerCase('tr') + (k.endsWith('intoleransi') ? '' : '')), ...(profile.sensitivities.length ? [`${profile.sensitivities.length} hassasiyet`] : [])])} için kontrol edildi` }
  const labelNote = usable ? null : p.matchStatus === 'needs_review' ? 'Bu ürünün etiketi inceleniyor; karar için kullanılmadı.' : 'Bu ürün için etiket bilgisi bulunmuyor.'
  const checkedText = [...profile.allergies.map((k) => ALLERGIES[k]), ...profile.sensitivities.map((k) => SENSITIVITIES[k].label)].join(', ')
  return { level, alert: alertN > 0, sub, rows, warnings, checkedText, labelUsable: usable, labelNote, codes, counts: { allergy: alertN, sens: sensCount, ingredients: ing ? ing.split(/,(?![^()]*\))/).filter((x) => x.trim()).length : 0 } }
}
