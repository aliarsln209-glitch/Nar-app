import { getProduct, type Product } from '../data/catalog'
import { useECodes } from '../data/useECodes'
import { analyze, type Analysis } from '../engine/analyze'
import { LEVEL, Thumb, TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'

const RANK = { clear: 0, noprofile: 1, caution: 2, unknown: 3 } as const

export default function Compare() {
  const { compare, setCompare, push, profile, history } = useApp()
  const ecodes = useECodes()
  const ps = compare.map((id) => (id ? getProduct(id) : undefined)) as (Product | undefined)[]
  const an: (Analysis | null)[] = ps.map((p) => (p ? analyze(p, profile, ecodes) : null))
  const slot = (i: 0 | 1) => {
    const p = ps[i]
    const set = (v: string | null) => { const c: [string | null, string | null] = [...compare]; c[i] = v; setCompare(c) }
    return (
      <div className="card" style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        {p ? <><Thumb p={p} /><p style={{ fontSize: 13, fontWeight: 600, margin: '6px 0' }}>{p.name}</p><button className="chip" onClick={() => set(null)}>Kaldır</button></>
          : <><p className="muted small">{i + 1}. ürün</p>
            <button className="chip on" onClick={() => push({ k: 'search', pick: i === 0 ? 'a' : 'b' })}>{i + 1}. ürünü seç</button>
            {history.length > 0 && <p className="small muted" style={{ marginTop: 6 }}>ya da <button className="chip" onClick={() => set(history.find((h) => h.id !== compare[1 - i])?.id ?? null)}>Geçmiş’ten seç</button></p>}</>}
      </div>
    )
  }
  const both = an[0] && an[1]
  let summary = ''
  if (both) {
    const [a, b] = [an[0]!, an[1]!]
    if (a.level === 'unknown' || b.level === 'unknown') summary = 'Ürünlerden birinin bilgisi yetersiz; karşılaştırma kesin değil.'
    else if (a.counts.allergy + a.counts.sens === b.counts.allergy + b.counts.sens) summary = 'İki ürün, profilin için eşit sayıda uyarı içeriyor.'
    else summary = `${a.counts.allergy + a.counts.sens < b.counts.allergy + b.counts.sens ? '1.' : '2.'} ürün, profilin için daha az uyarı içeriyor.`
  }
  const col = (a: Analysis) => { const L = LEVEL[a.level]; const I = L.icon; return (
    <td style={{ verticalAlign: 'top', width: '50%' }}>
      <div className={'band ' + a.level} style={{ margin: '0 0 8px', padding: 10, display: 'block' }}><I /><strong style={{ display: 'block', fontSize: 14 }}>{L.title}</strong></div>
      <p className="small" style={{ margin: 2 }}>Alerji eşleşmesi: <b>{a.counts.allergy}</b></p>
      <p className="small" style={{ margin: 2 }}>Hassasiyet notu: <b>{a.counts.sens}</b></p>
      <p className="small" style={{ margin: 2 }}>İçindekiler: <b>{a.labelUsable ? a.counts.ingredients : '—'}</b></p>
      {a.level === 'unknown' && <p className="small" style={{ color: 'var(--aink)' }}>Karşılaştırma kesin değil</p>}
    </td>) }
  void RANK
  return (
    <div>
      <TopBar noBack title="Karşılaştır" />
      <div className="page" style={{ paddingTop: 4 }}>
        <p className="small muted" style={{ marginTop: 0 }}>{profile.name} için · yan yana değerlendirme</p>
        <div style={{ display: 'flex', gap: 10 }}>{slot(0)}{slot(1)}</div>
        {!both && <p className="empty">İki ürün seç; profiline göre yan yana göstereyim.</p>}
        {both && (
          <>
            <table style={{ width: '100%', borderSpacing: 8, marginTop: 6 }}><tbody><tr>{col(an[0]!)}{col(an[1]!)}</tr></tbody></table>
            <div className="card"><strong>Özet</strong><p style={{ marginBottom: 0 }}>{summary}</p></div>
            <p className="small muted">Sıralama ölçütü: önce alerji eşleşmesi, sonra hassasiyet notu sayısı. Sponsorlu sıralama yoktur.</p>
          </>
        )}
      </div>
    </div>
  )
}
