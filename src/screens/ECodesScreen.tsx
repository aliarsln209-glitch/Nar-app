import { useState } from 'react'
import { ecodes, type ECode } from '../data/ecodes'

export default function ECodesScreen() {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<ECode | null>(null)
  const s = q.trim().toLocaleLowerCase('tr')
  const list = ecodes.filter((e) => !s || e.code.toLowerCase().includes(s) || e.name.toLocaleLowerCase('tr').includes(s))

  if (sel) {
    return (
      <section className="page">
        <button className="link" onClick={() => setSel(null)}>← Geri</button>
        <h1>{sel.code} · {sel.name}</h1>
        {sel.compExp || sel.riskWarn ? (
          <>
            {sel.compExp && <p>{sel.compExp}</p>}
            {sel.riskWarn && <p className="note">{sel.riskWarn}</p>}
          </>
        ) : (
          <p className="muted">Bu E-kod için doğrulanmış açıklama henüz eklenmedi (veri tablosu bekleniyor).</p>
        )}
      </section>
    )
  }
  return (
    <section className="page">
      <h1>E-kodlar</h1>
      <input className="search" placeholder="E-kod veya ad ara… (örn. E330)" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="list">
        {list.map((e) => (
          <li key={e.code}>
            <button onClick={() => setSel(e)}>
              <strong>{e.code}</strong>
              <small>{e.name}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
