import raw from './products.json'

export interface Nutrition { kcal: number | null; kj: number | null; fat: number | null; satFat: number | null; transFat: number | null; carb: number | null; sugar: number | null; fiber: number | null; protein: number | null; salt: number | null }
export interface Label { ingredients: string; allergenStatement: string | null; nutrition: Nutrition; source: string; sourceName: string }
export interface Product {
  id: string; ean: string | null; eanValid: boolean; name: string; size: string | null
  matchStatus: 'verified' | 'needs_review' | 'no_label'
  image: string | null
  label: Label | null
}

export const PRODUCTS = raw as unknown as Product[]
const byId = new Map(PRODUCTS.map((p) => [p.id, p]))
const byEan = new Map(PRODUCTS.filter((p) => p.ean).map((p) => [p.ean as string, p]))

export const getProduct = (id: string) => byId.get(id)
export const findByEan = (ean: string) => byEan.get(ean)

// EAN-13 / EAN-8 / UPC-A (12) kontrol hanesi
export function eanValid(code: string): boolean {
  if (!/^\d{8}$|^\d{12,13}$/.test(code)) return false
  const d = code.split('').map(Number)
  const chk = d.pop()!
  let sum = 0
  d.reverse().forEach((x, i) => (sum += x * (i % 2 === 0 ? 3 : 1)))
  return (10 - (sum % 10)) % 10 === chk
}
export const normalizeEan = (c: string) => (c.length === 12 ? '0' + c : c)

const fold = (s: string) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFKC')
export function searchProducts(q: string, limit = 40): Product[] {
  const s = fold(q).trim()
  if (!s) return PRODUCTS.slice(0, limit)
  const toks = s.split(/\s+/)
  return PRODUCTS.filter((p) => { const n = fold(p.name) + ' ' + (p.ean ?? ''); return toks.every((t) => n.includes(t)) }).slice(0, limit)
}

export const imgUrl = (p: Product) => (p.image ? `${import.meta.env.BASE_URL}${p.image}` : null)
