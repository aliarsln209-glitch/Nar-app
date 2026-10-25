import { useEffect, useState } from 'react'
import { loadECodes, type ECode } from '../data/ecodes'
import { TopBar } from '../ui/components'

const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : '')

export default function Additive({ code }: { code: string }) {
  const [all, setAll] = useState<ECode[] | null>(null)
  useEffect(() => { loadECodes().then(setAll) }, [])
  const e = all?.find((x) => x.code.toUpperCase() === code.toUpperCase())
  return (
    <div>
      <TopBar title="Katkı maddesi" />
      <div className="page" style={{ paddingTop: 4 }}>
        {!all && <p className="muted">Yükleniyor…</p>}
        {all && !e && <p className="empty">{code} için sözlükte kayıt yok.</p>}
        {e && (
          <>
            <h1 className="big">{e.code} · {e.name}</h1>
            <div className="chips">{e.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            <h2>Nedir?</h2><p>{e.compExp}</p>
            <h2>Riskler</h2><p>{e.riskHalk}</p>
            <h2>Kimler dikkat etmeli?</h2><p>{e.notSuitable || 'Bu E-kod için belirtilmiş bir kısıt yok.'}</p>
            <h2>Kabul edilebilir günlük alım</h2><p>{e.riskValue}</p>
            <details><summary>Bilimsel ayrıntı</summary><p>{e.academicExp}</p><p className="muted">{e.riskBilimsel}</p></details>
            {e.sources.length > 0 && (
              <details><summary>Kaynaklar ({e.sources.length})</summary>
                <ul className="src">{e.sources.map((u) => safeUrl(u) && <li key={u}><a href={safeUrl(u)} target="_blank" rel="noopener noreferrer">{u}</a></li>)}</ul>
              </details>
            )}
            <p className="note">Bilgilendirme amaçlıdır; tıbbi tavsiye değildir.</p>
          </>
        )}
      </div>
    </div>
  )
}
