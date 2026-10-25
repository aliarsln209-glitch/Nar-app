import { getProduct, type Product } from '../data/catalog'
import { analyze, type Analysis } from '../engine/analyze'
import { LEVEL_TEXT, Thumb, TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'

export default function Compare() {
  const { compare, setCompare, push, profile } = useApp()
  const ps = compare.map((id) => (id ? getProduct(id) : undefined)) as (Product | undefined)[]
  const an: (Analysis | null)[] = ps.map((p) => (p ? analyze(p, profile) : null))
  const slot = (i: 0 | 1) => {
    const p = ps[i]
    return (
      <div className="card" style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        {p ? <><Thumb p={p} /><p style={{ fontSize: 13, fontWeight: 600, margin: '6px 0' }}>{p.name}</p><button className="chip" onClick={() => { const c: [string | null, string | null] = [...compare]; c[i] = null; setCompare(c) }}>Kaldır</button></>
          : <><p className="muted small">Ürün {i + 1}</p><button className="chip on" onClick={() => push({ k: 'search', pick: i === 0 ? 'a' : 'b' })}>Ürün seç</button></>}
      </div>
    )
  }
  const both = an[0] && an[1]
  const nut = (p: Product | undefined, k: 'kcal' | 'sugar' | 'salt' | 'protein') => (p?.matchStatus === 'verified' && p.label?.nutrition[k] != null ? `${p.label.nutrition[k]}` : '—')
  return (
    <div>
      <TopBar noBack title="Karşılaştır" />
      <div className="page" style={{ paddingTop: 4 }}>
        <div style={{ display: 'flex', gap: 10 }}>{slot(0)}{slot(1)}</div>
        {!both && <p className="empty">İki ürün seç; seçtiğin alerjenlere göre yan yana göstereyim.</p>}
        {both && (
          <>
            <h2>Senin için sonuç</h2>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ display: 'flex' }}>
                {an.map((a, i) => <div key={i} style={{ flex: 1, padding: 12 }} className={'verdict ' + a!.level + ' '} ><strong>{LEVEL_TEXT[a!.level].title}</strong></div>)}
              </div>
            </div>
            {profile.allergies.length > 0 && (
              <table className="ntable" style={{ marginTop: 10 }}><tbody>
                {an[0]!.rows.map((r, i) => <tr key={r.key}><td>{r.label}</td><td style={{ textAlign: 'center' }}>{short(r.result.status)}</td><td>{short(an[1]!.rows[i].result.status)}</td></tr>)}
              </tbody></table>
            )}
            <h2>Besin (100 g)</h2>
            <table className="ntable"><tbody>
              {([['kcal', 'Enerji (kcal)'], ['sugar', 'Şeker (g)'], ['salt', 'Tuz (g)'], ['protein', 'Protein (g)']] as const).map(([k, l]) => <tr key={k}><td>{l}</td><td style={{ textAlign: 'center' }}>{nut(ps[0], k)}</td><td>{nut(ps[1], k)}</td></tr>)}
            </tbody></table>
            <p className="small muted">“—” = doğrulanmış etiket verisi yok. “Çakışma yok” bir güvenlik garantisi değildir.</p>
          </>
        )}
      </div>
    </div>
  )
}
const short = (s: string) => ({ contains: 'İçeriyor', may_contain: 'İçerebilir', ambiguous: 'Belirsiz', insufficient_data: 'Bilgi yetersiz', no_declared_allergen_detected: 'Yok' } as Record<string, string>)[s] ?? s
