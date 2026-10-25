import type { Product } from '../data/catalog'
import { ALLERGIES, type AllergyKey, type Profile } from './types'
import { evaluateProduct, type RuleResult, type RuleStatus } from './rules'

export type Level = 'danger' | 'caution' | 'clear' | 'unknown' | 'noprofile'
export interface Analysis {
  level: Level
  rows: { key: AllergyKey; label: string; result: RuleResult }[]
  labelUsable: boolean
  labelNote: string | null
}

// Etiket verisi yalnız eşleşmesi doğrulanmış ürünlerde karar kaynağıdır; diğerlerinde yalnız ürün adı taranır
// ve olumsuz sonuç yerine "Bilgi yetersiz" verilir (motor: ingredients yoksa insufficient_data).
export function analyze(p: Product, profile: Profile): Analysis {
  const usable = p.matchStatus === 'verified' && !!p.label?.ingredients
  const results = evaluateProduct(
    {
      product_name: p.name,
      ingredients: usable ? p.label!.ingredients : null,
      allergen_statement: usable ? p.label!.allergenStatement : null
    },
    profile.allergies
  )
  const rows = results.map((r) => ({ key: r.category_key as AllergyKey, label: ALLERGIES[r.category_key as AllergyKey] ?? r.category_name, result: r }))
  const st = (s: RuleStatus) => rows.some((r) => r.result.status === s)
  let level: Level
  if (!profile.allergies.length) level = 'noprofile'
  else if (st('contains')) level = 'danger'
  else if (st('may_contain') || st('ambiguous')) level = 'caution'
  else if (st('insufficient_data')) level = 'unknown'
  else level = 'clear'
  const labelNote = usable ? null : p.matchStatus === 'needs_review' ? 'Bu ürünün etiket verisi henüz doğrulanmadı; karar için kullanılmadı.' : 'Bu ürün için etiket verisi bulunmuyor.'
  return { level, rows, labelUsable: usable, labelNote }
}
