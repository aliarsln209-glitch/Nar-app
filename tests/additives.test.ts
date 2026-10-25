import { detectAdditives, parseIngredients } from '../src/data/additives'
import ec from '../src/data/ecodes.json'
import prods from '../src/data/products.json'
let hit = 0, tot = 0, n = 0
for (const p of prods as any[]) { if (!p.label) continue; tot++; const f = detectAdditives(p.label.ingredients, ec as any); if (f.length) hit++; n += f.length }
console.log(`katkı bulunan ürün ${hit}/${tot}, toplam ${n}`)
const p: any = (prods as any[]).find((x) => x.id === '8690526643298')
console.log(detectAdditives(p.label.ingredients, ec as any).map((f) => f.code + ' ' + f.name).join(' | '))
console.log(JSON.stringify(parseIngredients(p.label.ingredients).slice(0, 12)))
