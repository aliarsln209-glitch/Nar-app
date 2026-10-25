import type { ECode } from './ecodes'
import { norm } from '../engine/rules'

// İçindekiler metninde E-kodlarını VE sözlükteki madde adlarını (ör. "sitrik asit") bulur.
const isW = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c)
interface V { code: string; stems: string[] }
let cache: { src: ECode[]; vars: V[] } | null = null

function variants(e: ECode): string[] {
  const out = new Set<string>()
  const full = norm(e.name)
  const main = full.replace(/\s*\([^)]*\)/g, '').trim()
  out.add(main)
  for (const m of full.matchAll(/\(([^)]+)\)/g)) { const x = m[1].trim(); if (x.length > 5 && !/^[a-z]-|cas|e\d/.test(x) && x.split(' ').length <= 4) out.add(x) }
  for (const v of [...out]) if (/(ler|lar)$/.test(v)) out.add(v.replace(/(ler|lar)$/, '')) // "lesitinler" → "lesitin"
  return [...out].filter((v) => v.length >= 5)
}
const GENERIC = new Set<string>()
function markGeneric(all: ECode[]) {
  GENERIC.clear()
  const words = new Map<string, number>()
  for (const e of all) for (const w of new Set(norm(e.name).split(/[\s(),/]+/))) words.set(w, (words.get(w) ?? 0) + 1)
  for (const [w, n] of words) if (n >= 2) GENERIC.add(w)
}

export interface Found { code: string; name: string }
export function detectAdditives(text: string, all: ECode[]): Found[] {
  if (!cache || cache.src !== all) markGeneric(all)
    cache = { src: all, vars: all.map((e) => ({ code: e.code, stems: variants(e).filter((v) => v.includes(' ') || !GENERIC.has(v)) })) }
  const t = norm(text)
  const found = new Map<string, Found>()
  const spans = new Map<string, [number, number]>()
  for (const m of t.matchAll(/(^|[^a-z0-9])e[\s-]?(\d{3,4}[a-z]?)(?![a-z0-9])/g)) {
    const code = 'E' + m[2].toUpperCase()
    const e = all.find((x) => x.code.toUpperCase() === code)
    if (e) found.set(e.code, { code: e.code, name: e.name })
  }
  for (const v of cache.vars) {
    if (found.has(v.code)) continue
    for (const s of v.stems) {
      let i = 0, hit = false
      while ((i = t.indexOf(s, i)) !== -1) {
        let j = i + s.length
        // yalnızca ≤3 harflik Türkçe ek ("-i", "-ler", "-in") tolere edilir
        let k = j; while (k < t.length && k - j < 4 && isW(t[k])) k++
        if (!isW(t[i - 1]) && k - j <= 3 && !isW(t[k])) { hit = true; spans.set(v.code, [i, k]); break }
        i++
      }
      if (hit) { const e = all.find((x) => x.code === v.code)!; found.set(e.code, { code: e.code, name: e.name }); break }
    }
  }
  // daha uzun bir madde adının içinde kalan kısa eşleşmeleri ele ("tartarik asit esterleri" ⊂ "diasetil tartarik asit esterleri")
  for (const [c, [a, b]] of spans) if ([...spans].some(([c2, [a2, b2]]) => c2 !== c && a2 <= a && b <= b2 && b2 - a2 > b - a)) found.delete(c)
  return [...found.values()]
}

export interface Ing { main: string; sub: string | null }
// "A, B (b1, b2), C %5,2 [c1, c2]" → üst düzey maddeler; parantez/köşeli içerik alt bilgi olur.
export function parseIngredients(text: string): Ing[] {
  const items: string[] = []
  let depth = 0, cur = ''
  const s = text.replace(/\s+/g, ' ').trim()
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1)
    if ((c === ',' || c === ';') && depth === 0 && !(/\d/.test(s[i - 1] ?? '') && /\d/.test(s[i + 1] ?? ''))) { items.push(cur); cur = '' } else cur += c
  }
  items.push(cur)
  return items.map((x) => x.trim().replace(/^[.\s]+|[.\s]+$/g, '')).filter(Boolean).map((x) => {
    const m = /^([^(\[]*)[(\[](.*)[)\]]\s*([^)\]]*)$/.exec(x)
    if (!m) return { main: x, sub: null }
    const main = (m[1] + ' ' + m[3]).replace(/\s+/g, ' ').trim()
    return { main: main || x, sub: m[2].trim() || null }
  })
}
