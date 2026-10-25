import { useEffect, useMemo, useState } from 'react'
import { loadECodes, type ECode } from '../data/ecodes'

const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : '')

export default function ECodesScreen() {
  const [all, setAll] = useState<ECode[] | null>(null)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [sel, setSel] = useState<ECode | null>(null)

  useEffect(() => { loadECodes().then(setAll) }, [])

  const tags = useMemo(() => [...new Set((all ?? []).flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b, 'tr')), [all])
  const list = useMemo(() => {
    const s = q.trim().toLocaleLowerCase('tr')
    return (all ?? []).filter(
      (e) => (!tag || e.tags.includes(tag)) && (!s || e.code.toLowerCase().includes(s.replace(/\s/g, '')) || e.name.toLocaleLowerCase('tr').includes(s))
    )
  }, [all, q, tag])

  if (!all) return <section className="page"><p className="muted">Yükleniyor…</p></section>

  if (sel) {
    return (
      <section className="page">
        <button className="link" onClick={() => setSel(null)}>← Geri</button>
        <h1>{sel.code} · {sel.name}</h1>
        <div className="chips">{sel.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>

        <h2>Nedir?</h2>
        <p>{sel.compExp}</p>

        <h2>Riskler</h2>
        <p>{sel.riskHalk}</p>

        <h2>Kimler dikkat etmeli?</h2>
        <p>{sel.notSuitable || 'Bu E-kod için belirtilmiş bir kısıt yok.'}</p>

        <h2>Kabul edilebilir günlük alım</h2>
        <p>{sel.riskValue}</p>

        <details>
          <summary>Bilimsel ayrıntı</summary>
          <p>{sel.academicExp}</p>
          <p className="muted">{sel.riskBilimsel}</p>
        </details>
        {sel.sources.length > 0 && (
          <details>
            <summary>Kaynaklar ({sel.sources.length})</summary>
            <ul className="src">
              {sel.sources.map((u) => safeUrl(u) && (
                <li key={u}><a href={safeUrl(u)} target="_blank" rel="noopener noreferrer">{u}</a></li>
              ))}
            </ul>
          </details>
        )}
        <p className="note">Bilgilendirme amaçlıdır; tıbbi tavsiye değildir.</p>
      </section>
    )
  }

  return (
    <section className="page">
      <h1>E-kodlar</h1>
      <input className="search" placeholder="E-kod veya ad ara… (örn. E330)" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="search" value={tag} onChange={(e) => setTag(e.target.value)}>
        <option value="">Tüm kategoriler</option>
        {tags.map((t) => <option key={t}>{t}</option>)}
      </select>
      <p className="muted">{list.length} kayıt</p>
      <ul className="list">
        {list.map((e) => (
          <li key={e.code}>
            <button onClick={() => setSel(e)}>
              <strong>{e.code} · {e.name}</strong>
              <small>{e.tags.join(', ')}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
