import cases from '../data/demoCases.json'
import type { Engine, Product, Status, CriterionResult } from './types'

interface DemoCase {
  id: string
  product_index: number
  product_code: string
  category: string
  variant: string
  product: Product
  profile: { allergies: string[]; preferences: string[] }
  expected_http: number
  expected: Record<string, { status: Status; calculation?: { value?: number | null } | null }>
}

const all = cases as unknown as DemoCase[]

export interface DemoProduct {
  id: string // product_index
  code: string
  category: string
  product: Product
}

// Aynı ürün_index'e ait ilk "scraped" kaydı ürün olarak kullan (benzersiz ürün listesi)
export const demoProducts: DemoProduct[] = (() => {
  const seen = new Map<number, DemoProduct>()
  for (const c of all) {
    if (c.variant !== 'scraped' || seen.has(c.product_index)) continue
    seen.set(c.product_index, { id: String(c.product_index), code: c.product_code, category: c.category, product: c.product })
  }
  return [...seen.values()]
})()

// DEMO MOTOR: gerçek analiz yapmaz. Test setindeki yazarlanmış (gold) beklenen sonuçları döndürür.
// Setteki ürün/kriter çifti yoksa 'not_evaluated' döner.
export const mockEngine: Engine = {
  async analyze({ productId, profile }) {
    const keys = [
      ...profile.allergies.map((k) => `allergy:${k}`),
      ...profile.preferences.map((k) => `preference:${k}`)
    ]
    const forProduct = all.filter((c) => String(c.product_index) === productId && c.variant === 'scraped')
    const results: CriterionResult[] = keys.map((key) => {
      for (const c of forProduct) {
        const e = c.expected[key]
        if (e) return { key, status: e.status, calculationValue: e.calculation?.value ?? null }
      }
      return { key, status: 'not_evaluated' as Status }
    })
    return { results, source: 'demo' as const }
  }
}
