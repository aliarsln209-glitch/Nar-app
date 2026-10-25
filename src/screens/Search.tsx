import { useEffect, useMemo, useState } from 'react'
import { searchProducts } from '../data/catalog'
import { loadECodes, type ECode } from '../data/ecodes'
import { analyze } from '../engine/analyze'
import { Pill, ProductRow, TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'

export default function Search({ pick }: { pick?: 'a' | 'b' }) {
  const { push, back, profile, compare, setCompare } = useApp()
  const [mode, setMode] = useState<'p' | 'e'>('p')
  const [q, setQ] = useState('')
  const [codes, setCodes] = useState<ECode[]>([])
  useEffect(() => { loadECodes().then(setCodes) }, [])
  const prods = useMemo(() => searchProducts(q), [q])
  const ecs = useMemo(() => {
    const s = q.trim().toLocaleLowerCase('tr')
    return codes.filter((e) => !s || e.code.toLowerCase().includes(s.replace(/\s/g, '')) || e.name.toLocaleLowerCase('tr').includes(s)).slice(0, 60)
  }, [codes, q])
  return (
    <div>
      <TopBar title={pick ? 'Karşılaştırmak için ürün seç' : 'Ürün ara'} />
      <div className="page" style={{ paddingTop: 4 }}>
        {!pick && <div className="seg"><button className={mode === 'p' ? 'on' : ''} onClick={() => setMode('p')}>Ürünler</button><button className={mode === 'e' ? 'on' : ''} onClick={() => setMode('e')}>E-kodlar</button></div>}
        <input className="search" autoFocus placeholder={mode === 'p' ? 'Ürün adı veya barkod…' : 'E-kod veya ad… (örn. E330)'} value={q} onChange={(e) => setQ(e.target.value)} inputMode="search" />
        {mode === 'p' || pick ? (
          <ul className="list">
            {prods.map((p) => (
              <li key={p.id}>
                <ProductRow p={p} right={profile.allergies.length ? <Pill level={analyze(p, profile).level} /> : undefined}
                  onClick={() => {
                    if (pick) { const c: [string | null, string | null] = [...compare]; c[pick === 'a' ? 0 : 1] = p.id; setCompare(c); back() } else push({ k: 'result', id: p.id })
                  }} />
              </li>
            ))}
            {!prods.length && <li className="empty">Eşleşen ürün yok. Katalogda şu an yalnızca atıştırmalıklar var.</li>}
          </ul>
        ) : (
          <ul className="list">
            {ecs.map((e) => <li key={e.code}><button className="prow" onClick={() => push({ k: 'additive', code: e.code })}><span className="t"><strong>{e.code} · {e.name}</strong><small>{e.tags.join(', ')}</small></span></button></li>)}
          </ul>
        )}
      </div>
    </div>
  )
}
