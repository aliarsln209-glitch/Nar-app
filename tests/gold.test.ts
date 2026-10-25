import cases from '../src/data/demoCases.json'
import { evaluateProduct } from '../src/engine/rules'
let n = 0, ok = 0; const bad: string[] = []; const byGroup: Record<string, [number, number]> = {}
for (const c of cases as any[]) {
  const cats: string[] = c.profile.allergies
  if (!cats.length) continue
  const p = c.product
  const res = evaluateProduct({ product_name: p.product_name, ingredients: p.ingredients_complete === false && !p.ingredients ? null : p.ingredients, allergen_statement: p.allergen_statement, claims: p.claims, nutrition_facts: p.nutrition_facts }, cats)
  for (const r of res) {
    const exp = c.expected['allergy:' + r.category_key]?.status
    if (!exp) continue
    n++; const g = (byGroup[c.group] ??= [0, 0]); g[1]++
    if (exp === r.status) { ok++; g[0]++ } else bad.push(`${c.id} ${c.group} ${r.category_key}: beklenen ${exp}, motor ${r.status} | ${JSON.stringify(r.matched_rules.map(m => m.matched_term))} | ${(p.ingredients ?? '').slice(0, 90)} | AS=${(p.allergen_statement ?? '').slice(0, 50)}`)
  }
}
console.log(`${ok}/${n}`, JSON.stringify(byGroup))
console.log(bad.slice(0, 40).join('\n'))
