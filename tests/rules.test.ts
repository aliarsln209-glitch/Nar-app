import { evaluateProduct, validateConfig, type RuleProduct } from '../src/engine/rules'
let fail = 0, n = 0
const T = (name: string, p: RuleProduct, cats: string[], f: (r: ReturnType<typeof evaluateProduct>) => boolean | string) => {
  for (const v of variants(p)) {
    n++
    const r = evaluateProduct(v, cats)
    const ok = f(r)
    if (ok !== true) { fail++; console.log('FAIL', name, JSON.stringify(v), ok === false ? JSON.stringify(r.map(x => ({ s: x.status, m: x.matched_rules, sup: x.suppressed_matches, t: x.threshold }))) : ok) }
  }
}
// kılavuz: büyük/küçük harf + boşluk varyantları
const variants = (p: RuleProduct): RuleProduct[] => {
  const up = (s?: string | null) => (typeof s === 'string' ? s.toLocaleUpperCase('tr') : s)
  const sp = (s?: string | null) => (typeof s === 'string' ? '  ' + s.replace(/ /g, '   ') + ' \n' : s)
  const m = (fn: (s?: string | null) => any): RuleProduct => ({ product_name: fn(p.product_name), ingredients: fn(p.ingredients), allergen_statement: fn(p.allergen_statement), claims: fn(p.claims), nutrition_facts: fn(p.nutrition_facts) })
  const clean = (o: RuleProduct) => Object.fromEntries(Object.entries(o).filter(([k, v]) => (p as any)[k] !== undefined && v !== undefined)) as RuleProduct
  return [p, clean(m(up)), clean(m(sp))]
}
const S = (r: any, i = 0) => r[i].status
const errs = validateConfig(); if (errs.length) { console.log('VALIDATOR', errs); fail += errs.length }

T('1', { ingredients: 'süt tozu, kakao' }, ['sut_alerjisi'], r => S(r) === 'contains')
T('2', { ingredients: 'şeker', allergen_statement: 'Süt içerebilir.' }, ['sut_alerjisi'], r => S(r) === 'may_contain')
T('3', { ingredients: 'soya proteini', claims: 'soya içermez' }, ['soya_alerjisi'], r => S(r) === 'contains' && r[0].data_conflict)
T('4', { product_name: 'Fındık aromalı kahve', ingredients: 'kahve, aroma verici' }, ['sert_kabuklu_meyve_alerjisi'], r => S(r) === 'ambiguous')
T('5', { product_name: 'Hindistan cevizli bar', ingredients: 'hindistan cevizi, şeker' }, ['sert_kabuklu_meyve_alerjisi'], r => r[0].matched_rules.length === 0)
T('6', { ingredients: 'muskat cevizi' }, ['sert_kabuklu_meyve_alerjisi'], r => r[0].matched_rules.length === 0)
T('7', { ingredients: 'glutensiz buğday nişastası' }, ['gluten_tahil_alerjisi'], r => S(r) === 'contains')
T('8', { product_name: 'laktozsuz süt', ingredients: 'süt' }, ['sut_alerjisi'], r => S(r) === 'contains')
T('9', { ingredients: 'pirinç', allergen_statement: 'Susam aynı üretim hattında işlenmektedir.' }, ['susam_alerjisi'], r => S(r) === 'may_contain')
T('10', { ingredients: 'tam rafine soya yağı' }, ['soya_alerjisi'], r => S(r) !== 'contains' && r[0].suppressed_matches.length > 0)
T('11', { ingredients: 'tam rafine soya yağı, soya proteini' }, ['soya_alerjisi'], r => S(r) === 'contains')
T('12', { ingredients: 'balık jelatini' }, ['balik_alerjisi'], r => S(r) === 'contains')
T('13', { ingredients: 'vitamin preparatında taşıyıcı olarak balık jelatini' }, ['balik_alerjisi'], r => S(r) !== 'contains' && r[0].suppressed_matches.length > 0)
T('14', { ingredients: 'E223' }, ['kukurt_dioksit_sulfit_intoleransi'], r => S(r) === 'contains' && r[0].threshold?.threshold_status === 'unknown')
T('15', { ingredients: 'su', nutrition_facts: 'toplam SO2: 12 mg/L' }, ['kukurt_dioksit_sulfit_intoleransi'], r => r[0].threshold?.threshold_status === 'exceeded')
T('15b', { ingredients: 'şarap, toplam SO2: 12 mg/L' }, ['kukurt_dioksit_sulfit_intoleransi'], r => r[0].threshold?.threshold_status === 'exceeded' && S(r) === 'contains')
T('16', { ingredients: 'su, toplam SO2: 10 mg/L' }, ['kukurt_dioksit_sulfit_intoleransi'], r => r[0].threshold?.threshold_status === 'not_exceeded')
T('17', { ingredients: 'üzüm', claims: 'no added sulfites' }, ['kukurt_dioksit_sulfit_intoleransi'], r => r[0].negative_claims_found.length === 0)
T('18', { ingredients: null }, Object.keys(require('../src/engine/rules').CONFIG), r => r.every(x => x.status === 'insufficient_data'))
T('19', { allergen_statement: 'Yumurta içerir', ingredients: null }, ['yumurta_alerjisi'], r => S(r) === 'contains' && r[0].input_incomplete)
T('20', { product_name: 'Sesame-free kraker', ingredients: 'pirinç unu, tuz' }, ['susam_alerjisi'], r => S(r) === 'no_declared_allergen_detected' && r[0].negative_claims_found.length > 0)
T('21', { ingredients: 'susam, pirinç unu', claims: 'sesame-free' }, ['susam_alerjisi'], r => S(r) === 'contains' && r[0].data_conflict)
T('22', { ingredients: 'lupin unu' }, ['yerfistigi_alerjisi'], r => S(r) === 'no_declared_allergen_detected' && r[0].cross_reactivity_notes.length >= 0)
// ekstra
T('x1', { ingredients: 'su, tuz' }, ['sut_alerjisi'], r => S(r) === 'no_declared_allergen_detected')
T('x2', { ingredients: 'badem, hindistan cevizi' }, ['sert_kabuklu_meyve_alerjisi'], r => S(r) === 'contains')
T('x3', { ingredients: 'süt tozu', allergen_statement: 'Süt içerir. Fındık içerebilir.' }, ['sut_alerjisi', 'sert_kabuklu_meyve_alerjisi'], r => S(r, 0) === 'contains' && S(r, 1) === 'may_contain')
T('x4', { ingredients: 'şeker', allergen_statement: 'may contain milk, soy' }, ['sut_alerjisi', 'soya_alerjisi'], r => S(r, 0) === 'may_contain' && S(r, 1) === 'may_contain')
T('x5', { ingredients: 'yer fıstığı ezmesi' }, ['yerfistigi_alerjisi'], r => S(r) === 'contains')
T('x6', { ingredients: 'lupin unu' }, ['aci_bakla_alerjisi', 'yerfistigi_alerjisi'], r => S(r, 0) === 'contains' && S(r, 1) === 'no_declared_allergen_detected' && r[1].cross_reactivity_notes.length === 1)
console.log(`${n - fail}/${n} geçti`)
process.exit(fail ? 1 : 0)
