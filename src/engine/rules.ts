// NAR alerjen kural motoru — CS ekibi kılavuzu v3.1'e göre GENEL interpreter.
// Gıdaya özgü hiçbir kelime/if-else burada yok; tüm bilgi src/data/rules/*.json içinden okunur.
// Çıktı hiçbir zaman "güvenli" demez: negatif sonuç = "no_declared_allergen_detected".

import type { AllergyKey } from './types'
import aci_bakla from '../data/rules/aci_bakla_alerjisi.json'
import balik from '../data/rules/balik_alerjisi.json'
import gluten from '../data/rules/gluten_tahil_alerjisi.json'
import hardal from '../data/rules/hardal_alerjisi.json'
import kabuklu from '../data/rules/kabuklu_deniz_urunu_alerjisi.json'
import kereviz from '../data/rules/kereviz_alerjisi.json'
import sulfit from '../data/rules/kukurt_dioksit_sulfit_intoleransi.json'
import sert from '../data/rules/sert_kabuklu_meyve_alerjisi.json'
import soya from '../data/rules/soya_alerjisi.json'
import susam from '../data/rules/susam_alerjisi.json'
import sut from '../data/rules/sut_alerjisi.json'
import yerfistigi from '../data/rules/yerfistigi_alerjisi.json'
import yumurta from '../data/rules/yumurta_alerjisi.json'
import yumusakca from '../data/rules/yumusakca_alerjisi.json'

export type RuleStatus = 'contains' | 'may_contain' | 'ambiguous' | 'no_declared_allergen_detected' | 'insufficient_data'
type Decision = 'contains' | 'may_contain' | 'ambiguous'
type Field = 'product_name' | 'ingredients' | 'allergen_statement' | 'claims'
const FIELDS: Field[] = ['product_name', 'ingredients', 'allergen_statement', 'claims']

export interface RuleProduct {
  product_name?: string | null
  ingredients?: string | null
  allergen_statement?: string | null
  claims?: string | null
  nutrition_facts?: string | null
}

export interface MatchTrace {
  rule_id: string
  matched_term: string
  source_field: string
  decision: Decision
}
export interface SuppressedTrace extends MatchTrace {
  by: string // exemption_id | exclusion_id | negative_claim | pal | aroma
}
export interface ThresholdResult {
  presence_status: 'contains' | 'none'
  threshold_status: 'exceeded' | 'not_exceeded' | 'unknown' | 'not_evaluable'
  measured_total_so2: number | null
  unit: string | null
}
export interface CrossNote { rule_id: string; trigger_category: string; trigger: string; text: string }

export interface RuleResult {
  category_key: string
  category_name: string
  status: RuleStatus
  matched_rules: MatchTrace[]
  suppressed_matches: SuppressedTrace[]
  negative_claims_found: string[]
  data_conflict: boolean
  input_incomplete: boolean
  threshold: ThresholdResult | null
  cross_reactivity_notes: CrossNote[]
  warning_key: string
  warning_text: string
  conflict_note: string | null
  trigger: string | null
}

/* ---------- config ---------- */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Cfg = any
const RAW: Cfg[] = [aci_bakla, balik, gluten, hardal, kabuklu, kereviz, sulfit, sert, soya, susam, sut, yerfistigi, yumurta, yumusakca]
export const CONFIG: Record<string, Cfg> = {}
for (const c of RAW) CONFIG[c.category_key] = c
export const SUPPORTED_SCHEMA = '3.1'

/* ---------- normalizasyon ---------- */
export function norm(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/ı/g, 'i') // yalnız ı↔i katlaması: "MILK" ve "KIRMIZI" eşleşebilsin; ş/ç/ğ/ö/ü korunur
    .replace(/[’‘`´ʼ]/g, "'")
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/ *\n+ */g, '\n')
    .trim()
}
const isWordCh = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch)

interface Occ { start: number; end: number }
function findAll(text: string, term: string, type: string): Occ[] {
  const out: Occ[] = []
  if (!term) return out
  if (type === 'e_code') {
    const m = /^e[\s-]?(\d{3,4}[a-z]?(?:\([ivx]+\))?)$/.exec(term)
    if (m) {
      const re = new RegExp(`e[\\s-]?${m[1].replace(/[()]/g, '\\$&')}`, 'g')
      let x: RegExpExecArray | null
      while ((x = re.exec(text))) {
        const s = x.index, e = s + x[0].length
        if (!isWordCh(text[s - 1]) && !isWordCh(text[e])) out.push({ start: s, end: e })
      }
      return out
    }
  }
  let i = 0
  while ((i = text.indexOf(term, i)) !== -1) {
    const s = i, e = i + term.length
    if (!isWordCh(text[s - 1]) && !isWordCh(text[e])) out.push({ start: s, end: e })
    i = s + 1
  }
  return out
}

interface Seg { start: number; end: number }
function segments(text: string): Seg[] {
  const segs: Seg[] = []
  let st = 0
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i]
    let cut = false
    if (i === text.length) cut = true
    else if (ch === '\n' || ch === ';' || ch === '|') cut = true
    else if (ch === '.' && !(/\d/.test(text[i - 1] ?? '') && /\d/.test(text[i + 1] ?? ''))) cut = true // ondalık sayıda bölme
    if (cut) { if (i > st) segs.push({ start: st, end: i }); st = i + 1 }
  }
  return segs
}
const segOf = (segs: Seg[], pos: number) => segs.find((s) => pos >= s.start && pos < s.end || pos === s.end) ?? { start: 0, end: 0 }
const overlap = (a: Occ, b: Occ) => a.start < b.end && b.start < a.end

/* ---------- girdi ---------- */
interface FieldData { text: string; segs: Seg[] }
type Input = Partial<Record<Field, FieldData>> & { nutrition_facts?: string }
function canonicalize(p: RuleProduct): Input {
  const inp: Input = {}
  for (const f of FIELDS) {
    const v = p[f]
    if (typeof v === 'string' && v.trim()) { const t = norm(v); inp[f] = { text: t, segs: segments(t) } }
  }
  if (typeof p.nutrition_facts === 'string' && p.nutrition_facts.trim()) inp.nutrition_facts = norm(p.nutrition_facts)
  return inp
}

/* ---------- eşleştirme ---------- */
interface Cand {
  rule: any
  decision: Decision
  field: Field
  term: string
  occ: Occ
  seg: Seg
  suppressedBy?: string
}

function contextOk(cfg: Cfg, ctx: any, fd: FieldData, seg: Seg): boolean {
  if (!ctx) return true
  const segText = fd.text.slice(seg.start, seg.end)
  const has = (p: string) => findAllLoose(segText, norm(p)).length > 0
  const req: string[] = ctx.required ?? []
  if (req.length) {
    const ok = ctx.required_match === 'all' ? req.every(has) : req.some(has)
    if (!ok) return false
  }
  if ((ctx.forbidden ?? []).some(has)) return false
  return true
}
// bağlam ifadeleri: başlangıçta kelime sınırı, sonda ek serbest ("içerebilir." / "içerebilir")
function findAllLoose(text: string, term: string): Occ[] {
  const out: Occ[] = []
  let i = 0
  while (term && (i = text.indexOf(term, i)) !== -1) {
    if (!isWordCh(text[i - 1])) out.push({ start: i, end: i + term.length })
    i++
  }
  return out
}

// norm(term) → JSON'daki özgün yazım (kullanıcıya "alti" yerine "altı" gösterebilmek için)
const ORIG = new Map<string, string>()
const shown = (t: string) => ORIG.get(t) ?? t
function termsOf(rule: any): string[] {
  return [rule.keyword, ...(rule.aliases ?? [])].filter((x) => typeof x === 'string').map((x: string) => { const n = norm(x); ORIG.set(n, x); return n })
}

function evaluateSearchRules(cfg: Cfg, inp: Input): Cand[] {
  const cands: Cand[] = []
  const sr = cfg.search_rules ?? {}
  for (const decision of ['contains', 'may_contain', 'ambiguous'] as Decision[]) {
    for (const rule of sr[decision] ?? []) {
      const seenFieldTerm = new Set<string>()
      for (const f of rule.source_fields ?? []) {
        const fd = inp[f as Field]
        if (!fd) continue
        for (const term of termsOf(rule)) {
          for (const occ of findAll(fd.text, term, rule.match_type ?? 'whole_word')) {
            const seg = segOf(fd.segs, occ.start)
            const key = `${f}:${occ.start}:${term}`
            if (seenFieldTerm.has(key)) continue
            seenFieldTerm.add(key)
            if (!contextOk(cfg, rule.context, fd, seg)) continue
            cands.push({ rule, decision, field: f, term, occ, seg })
          }
        }
      }
    }
  }
  // en spesifik eşleşme: aynı alanda üst üste binen daha kısa terim elenir (eşit uzunluk korunur)
  if (cfg.decision_rules?.prefer_most_specific_match !== false) {
    return cands.filter((c) => !cands.some((o) => o !== c && o.field === c.field && overlap(o.occ, c.occ) && (o.occ.end - o.occ.start) > (c.occ.end - c.occ.start) && o.decision === c.decision))
  }
  return cands
}

function negativeSpans(cfg: Cfg, inp: Input): { field: Field; occ: Occ; claim: string }[] {
  const out: { field: Field; occ: Occ; claim: string }[] = []
  for (const claim of cfg.negative_claims ?? []) {
    const t = norm(typeof claim === 'string' ? claim : claim.phrase ?? '')
    if (!t) continue
    for (const f of FIELDS) {
      const fd = inp[f]
      if (!fd) continue
      for (const occ of findAllLoose(fd.text, t)) out.push({ field: f, occ, claim: t })
    }
  }
  return out
}

/* ---------- ana değerlendirme ---------- */
const trace = (c: Cand): MatchTrace => ({ rule_id: c.rule.rule_id, matched_term: shown(c.term), source_field: c.field, decision: c.decision })

function evalCategory(cfg: Cfg, inp: Input, rawProduct: RuleProduct): RuleResult {
  const dr = cfg.decision_rules ?? {}
  const suppressed: SuppressedTrace[] = []
  const negs = negativeSpans(cfg, inp)
  let cands = evaluateSearchRules(cfg, inp)

  const drop = (c: Cand, by: string) => { suppressed.push({ ...trace(c), by }); }

  // 1. negatif claim span'i içindeki keyword occurrence'ı aday üretmez (yalnız o occurrence)
  cands = cands.filter((c) => {
    const n = negs.find((s) => s.field === c.field && c.occ.start >= s.occ.start && c.occ.end <= s.occ.end)
    if (n) { drop(c, 'negative_claim'); return false }
    return true
  })

  // 2. lexical exclusion — yalnız çakışan parent eşleşmesi
  for (const ex of cfg.search_rules?.lexical_exclusions ?? []) {
    const parent = norm(ex.parent_keyword ?? '')
    for (const f of ex.source_fields ?? []) {
      const fd = inp[f as Field]
      if (!fd) continue
      const spans: Occ[] = (ex.phrases ?? []).flatMap((p: string) => findAll(fd.text, norm(p), 'exact_phrase'))
      if (!spans.length) continue
      cands = cands.filter((c) => {
        if (c.field !== f || !termsOf(c.rule).includes(parent) || !spans.some((s) => overlap(s, c.occ))) return true
        drop(c, ex.exclusion_id); return false
      })
    }
  }

  // 3. PAL: PAL bağlamı içeren segmentteki "contains" → may_contain
  if (dr.pal_segment_reclassifies_contains_as_may_contain) {
    const palPhrases: string[] = (cfg.search_rules?.may_contain ?? []).flatMap((r: any) => r.context?.required ?? []).map(norm)
    cands = cands.map((c) => {
      if (c.decision !== 'contains') return c
      const fd = inp[c.field]!
      const segText = fd.text.slice(c.seg.start, c.seg.end)
      const isPal = palPhrases.some((p) => findAllLoose(segText, p).length > 0)
      // güvenlik ihtiyatı: aynı segmentte açık "içerir/contains" ifadesi de varsa contains korunur
      const explicit = /(^|[^\p{L}])(içerir|içermektedir|contains)([^\p{L}]|$)/u.test(segText)
      return isPal && !explicit ? { ...c, decision: 'may_contain' as Decision } : c
    })
  }

  // 4. regulatory exemption — yalnız örtüşen match
  for (const ex of cfg.search_rules?.regulatory_exemptions ?? []) {
    for (const f of ex.source_fields ?? []) {
      const fd = inp[f as Field]
      if (!fd) continue
      const spans: Occ[] = []
      for (const term of termsOf(ex)) {
        for (const occ of findAll(fd.text, term, ex.match_type ?? 'exact_phrase')) {
          if (contextOk(cfg, ex.context, fd, segOf(fd.segs, occ.start))) spans.push(occ)
        }
      }
      if (!spans.length) continue
      cands = cands.filter((c) => {
        if (c.field !== f || !spans.some((s) => overlap(s, c.occ))) return true
        drop(c, ex.exemption_id); return false
      })
    }
  }

  // 5. ürün adındaki aroma/lezzet bağlamı: ingredients/allergen_statement doğrulamıyorsa contains → ambiguous
  if (dr.product_name_flavor_context_requires_ingredient_confirmation) {
    const flavor = /(^|[^\p{L}])(aroma|aromali|aromalı|aromasi|aromalar|aromatik|flavou?r(ed|ing)?|flavou?rs?|tat|tatli)([^\p{L}]|$)/u
    cands = cands.map((c) => {
      if (c.field !== 'product_name' || c.decision !== 'contains') return c
      const fd = inp.product_name!
      // aroma sözcüğü anahtar sözcüğe bitişik (aynı segmentte, en fazla 2 sözcük içinde) mi?
      const around = fd.text.slice(Math.max(c.seg.start, c.occ.start - 24), Math.min(c.seg.end, c.occ.end + 24))
      if (!/(aroma|flavo)/.test(around) && !flavor.test(around.replace(/tat|tatli/g, ''))) return c
      const confirmed = cands.some((o) => o !== c && o.rule.rule_id === c.rule.rule_id && o.field !== 'product_name') ||
        cands.some((o) => o !== c && o.field !== 'product_name' && o.decision !== 'ambiguous' && o.rule.keyword === c.rule.keyword)
      return confirmed ? c : { ...c, decision: 'ambiguous' as Decision }
    })
  }

  // dedupe: aynı rule_id + alan + terim tek kayıt; aynı kural farklı alandan gelirse korunur
  const seen = new Set<string>()
  cands = cands.filter((c) => {
    const k = `${c.rule.rule_id}|${c.field}|${c.term}|${c.decision}`
    if (seen.has(k)) return false
    seen.add(k); return true
  })

  // 6. eşik (yalnız sülfit)
  let threshold: ThresholdResult | null = null
  const thrRules: any[] = cfg.threshold_rules ?? []
  if (thrRules.length) {
    threshold = evaluateThreshold(thrRules[0], inp, cands.some((c) => c.decision === 'contains'))
    if (threshold.measured_total_so2 !== null && threshold.measured_total_so2 > 0 && !cands.some((c) => c.decision === 'contains')) {
      cands.push({ rule: { rule_id: thrRules[0].rule_id, warning_key: 'contains_sulfite_threshold_unknown' }, decision: 'contains', field: 'ingredients', term: 'toplam so2', occ: { start: 0, end: 0 }, seg: { start: 0, end: 0 } })
    }
    if (cands.some((c) => c.decision === 'contains')) threshold.presence_status = 'contains'
  }

  // 7. durum çöz
  const priority: string[] = dr.status_priority ?? ['contains', 'may_contain', 'ambiguous', 'no_declared_allergen_detected']
  let status: RuleStatus = 'no_declared_allergen_detected'
  for (const p of priority) if (p !== 'no_declared_allergen_detected' && cands.some((c) => c.decision === p)) { status = p as RuleStatus; break }
  const ingredientsOk = !!inp.ingredients
  const input_incomplete = !ingredientsOk
  if (status === 'no_declared_allergen_detected' && dr.ingredients_required_for_negative_result !== false && !ingredientsOk) status = 'insufficient_data'

  const positives = cands.filter((c) => c.decision === 'contains' || c.decision === 'may_contain')
  const usedNegs = negs.filter((n) => true)
  const data_conflict = !!dr.conflict_detection && usedNegs.length > 0 && positives.length > 0

  // 8. uyarı metni
  const win = cands.filter((c) => c.decision === status).sort((a, b) => b.term.length - a.term.length)[0]
  let wkey: string = status
  if (win?.rule.warning_key && cfg.warning_texts?.[win.rule.warning_key]) wkey = win.rule.warning_key
  const trigger = win ? shown(win.term) : null
  const tpl: string = cfg.warning_texts?.[wkey] ?? cfg.warning_texts?.[status] ?? ''
  const text = tpl.replace(/\{trigger\}/g, trigger ?? cfg.category_name)
  return {
    category_key: cfg.category_key,
    category_name: cfg.category_name,
    status,
    matched_rules: cands.map(trace),
    suppressed_matches: suppressed,
    negative_claims_found: [...new Set(usedNegs.map((n) => n.claim))],
    data_conflict,
    input_incomplete,
    threshold,
    cross_reactivity_notes: [],
    warning_key: wkey,
    warning_text: text,
    conflict_note: data_conflict ? (cfg.warning_texts?.data_conflict ?? null) : null,
    trigger
  }
}

/* ---------- sülfit eşiği ---------- */
function evaluateThreshold(rule: any, inp: Input, presence: boolean): ThresholdResult {
  const res: ThresholdResult = { presence_status: presence ? 'contains' : 'none', threshold_status: presence ? 'unknown' : 'unknown', measured_total_so2: null, unit: null }
  const texts: string[] = []
  for (const f of rule.source_fields ?? []) {
    const t = f === 'nutrition_facts' ? inp.nutrition_facts : inp[f as Field]?.text
    if (t) texts.push(t)
  }
  // nitel beyanlar ("10 mg/kg'dan az sülfit içerir")
  for (const q of rule.recognized_qualitative_threshold_statements ?? []) {
    for (const ph of q.phrases ?? []) {
      if (texts.some((t) => t.includes(norm(ph)))) { res.presence_status = q.presence_status ?? 'contains'; res.threshold_status = q.threshold_status ?? 'not_exceeded'; return res }
    }
  }
  const limit: number = rule.threshold ?? 10
  const units: string[] = (rule.units ?? []).map((u: string) => u.toLowerCase())
  const aliases: string[] = (rule.analyte_aliases ?? []).map(norm).sort((a: string, b: string) => b.length - a.length)
  const num = '(\\d+(?:[.,]\\d+)?)'
  const re = new RegExp(`^\\s*[:=]?\\s*(<=|>=|<|>|≤|≥)?\\s*${num}(?:\\s*-\\s*${num})?\\s*(mg\\s*/\\s*kg|mg\\s*/\\s*l|ppm)?`)
  for (const t of texts) {
    for (const a of aliases) {
      let from = 0, idx: number
      while ((idx = t.indexOf(a, from)) !== -1) {
        from = idx + a.length
        const m = re.exec(t.slice(from))
        if (!m) continue
        const op = m[1] ?? ''
        const v1 = parseFloat(m[2].replace(',', '.'))
        const v2 = m[3] ? parseFloat(m[3].replace(',', '.')) : null
        const unit = m[4] ? m[4].replace(/\s+/g, '').replace('l', 'L').replace('kg', 'kg') : null
        res.measured_total_so2 = v1
        res.unit = unit
        const unitOk = !!unit && units.includes(unit.toLowerCase())
        if (!unitOk) { res.threshold_status = 'not_evaluable'; return res }
        const lo = v1, hi = v2 ?? v1
        if (op === '<' || op === '<=' || op === '≤') res.threshold_status = (op === '<' ? v1 <= limit : v1 <= limit) ? 'not_exceeded' : 'not_evaluable'
        else if (op === '>' || op === '>=' || op === '≥') res.threshold_status = v1 >= limit ? 'exceeded' : 'not_evaluable'
        else if (v2 !== null) res.threshold_status = lo > limit ? 'exceeded' : hi <= limit ? 'not_exceeded' : 'not_evaluable'
        else res.threshold_status = v1 > limit ? 'exceeded' : 'not_exceeded'
        return res
      }
    }
  }
  return res
}

/* ---------- çapraz reaktivite (bilgi amaçlı) ---------- */
function crossNotes(selected: string[], results: RuleResult[], inp: Input, rawProduct: RuleProduct) {
  for (const r of results) {
    const cfg = CONFIG[r.category_key]
    for (const cr of cfg.cross_reactivity_rules ?? []) {
      const trig = cr.trigger_category as string
      if (!CONFIG[trig] || cr.show_to_user === false) continue
      const tr = results.find((x) => x.category_key === trig) ?? evalCategory(CONFIG[trig], inp, rawProduct)
      const hit = tr.matched_rules.find((m) => m.decision === 'contains' || m.decision === 'may_contain')
      if (hit) r.cross_reactivity_notes.push({ rule_id: cr.rule_id, trigger_category: trig, trigger: hit.matched_term, text: (cfg.warning_texts?.cross_reactivity ?? '').replace(/\{trigger\}/g, hit.matched_term) })
    }
  }
}

export function evaluateProduct(product: RuleProduct, selectedCategoryKeys: string[]): RuleResult[] {
  const inp = canonicalize(product)
  const keys = selectedCategoryKeys.filter((k) => CONFIG[k])
  const results = keys.map((k) => evalCategory(CONFIG[k], inp, product))
  crossNotes(keys, results, inp, product)
  return results
}

export function evaluateCategory(product: RuleProduct, key: AllergyKey | string): RuleResult {
  return evaluateProduct(product, [key])[0]
}

/* ---------- build/test zamanı doğrulayıcı (kılavuz §10.1) ---------- */
export function validateConfig(): string[] {
  const errs: string[] = []
  const ids = new Set<string>(), keys = new Set<string>(), rids = new Set<string>()
  const MT = ['whole_word', 'exact_phrase', 'e_code'], SF = ['product_name', 'ingredients', 'allergen_statement', 'claims', 'nutrition_facts']
  const WT = ['contains', 'may_contain', 'ambiguous', 'no_declared_allergen_detected', 'insufficient_data', 'data_conflict']
  for (const c of RAW) {
    const n = c.category_key
    if (c.schema_version !== SUPPORTED_SCHEMA) errs.push(`${n}: schema_version ${c.schema_version}`)
    if (ids.has(c.category_id)) errs.push(`${n}: category_id tekrar`); ids.add(c.category_id)
    if (keys.has(n)) errs.push(`${n}: category_key tekrar`); keys.add(n)
    const srcIds = new Set((c.sources ?? []).map((s: any) => s.source_id))
    const chk = (id: string, refs: string[] | undefined) => {
      if (rids.has(id)) errs.push(`${n}: ${id} tekrar`); rids.add(id)
      for (const r of refs ?? []) if (!srcIds.has(r)) errs.push(`${n}/${id}: source_ref ${r} tanımsız`)
    }
    for (const sec of ['contains', 'may_contain', 'ambiguous', 'regulatory_exemptions', 'lexical_exclusions']) {
      if (!Array.isArray(c.search_rules?.[sec]) && sec !== 'lexical_exclusions') errs.push(`${n}: search_rules.${sec} yok`)
    }
    for (const dec of ['contains', 'may_contain', 'ambiguous']) {
      for (const r of c.search_rules?.[dec] ?? []) {
        chk(r.rule_id, r.source_refs)
        if (typeof r.keyword !== 'string' || !Array.isArray(r.aliases)) errs.push(`${n}/${r.rule_id}: keyword/aliases`)
        if (!MT.includes(r.match_type)) errs.push(`${n}/${r.rule_id}: match_type ${r.match_type}`)
        for (const f of r.source_fields ?? []) if (!SF.includes(f)) errs.push(`${n}/${r.rule_id}: source_field ${f}`)
      }
    }
    for (const r of c.search_rules?.regulatory_exemptions ?? []) chk(r.exemption_id, r.source_refs)
    for (const r of c.search_rules?.lexical_exclusions ?? []) chk(r.exclusion_id, r.source_refs)
    for (const k of WT) if (!(k in (c.warning_texts ?? {}))) errs.push(`${n}: warning_texts.${k} yok`)
    if (!c.decision_rules?.status_priority) errs.push(`${n}: decision_rules.status_priority yok`)
    if (n !== 'kukurt_dioksit_sulfit_intoleransi' && (c.threshold_rules ?? []).length) errs.push(`${n}: beklenmeyen threshold_rules`)
    for (const cr of c.cross_reactivity_rules ?? []) if (cr.affects_primary_status) errs.push(`${n}/${cr.rule_id}: cross_reactivity primary status'u etkileyemez`)
  }
  return errs
}
