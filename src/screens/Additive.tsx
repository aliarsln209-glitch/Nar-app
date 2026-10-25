import { useECodes } from '../data/useECodes'
import { clip, firstSentence, sourceBadge } from '../data/sensitivity'
import { TopBar } from '../ui/components'
import { ISpark } from '../ui/Icons'
import { useApp } from '../ui/ctx'

export default function Additive({ code }: { code: string }) {
  const all = useECodes()
  const { openAssistant } = useApp()
  const e = all?.find((x) => x.code.toUpperCase() === code.toUpperCase())
  const badges = e ? [...new Map(e.sources.map(sourceBadge).filter(Boolean).map((b) => [b!.label, b!])).values()] : []
  const who = e?.notSuitable ? firstSentence(e.notSuitable) : ''
  const rest = e?.notSuitable ? e.notSuitable.slice(who.length).trim() : ''
  return (
    <div>
      <TopBar title="Katkı maddesi" />
      <div className="page" style={{ paddingTop: 4 }}>
        {!all && <p className="muted">Yükleniyor…</p>}
        {all && !e && <p className="empty">{code} için sözlükte kayıt yok.</p>}
        {e && (
          <>
            <h1 className="big"><span className="ebadge">{e.code}</span>{e.name}</h1>
            {e.tags[0] && <p className="tag" style={{ marginTop: 0 }}>{e.tags.join(' · ')}</p>}
            <p style={{ fontSize: 17 }}>{clip(firstSentence(e.compExp), 140)}</p>

            {e.riskValue && (<><h2>Güvenli alım değeri</h2><p style={{ marginBottom: 2 }}>{e.riskValue}</p><p className="small muted" style={{ marginTop: 0 }}>Bu değer bilimsel bir referanstır; üründeki miktarı göstermez.</p></>)}
            {who && (<><h2>Kimler dikkat etmeli?</h2><p>{who}</p>{rest && <details><summary>Devamı</summary><p>{rest}</p></details>}<p className="small muted">Sağlık durumun varsa hekimine danış.</p></>)}
            {e.riskHalk && <><h2>Riskler</h2><p>{e.riskHalk}</p></>}
            {(e.academicExp || e.riskBilimsel) && <details><summary>Bilimsel açıklama</summary>{e.academicExp && <p>{e.academicExp}</p>}{e.riskBilimsel && <p className="muted">{e.riskBilimsel}</p>}</details>}
            {badges.length > 0 && (<><h2>Kaynaklar</h2><div>{badges.slice(0, 12).map((b) => <a key={b.label} className="src" href={b.url} target="_blank" rel="noopener noreferrer">[{b.label}]</a>)}</div></>)}
            <button className="abar" onClick={() => openAssistant(e.code)}><span className="sp"><ISpark /></span><span className="tx">Bu madde hakkında sor</span><small>NAR veri tabanına dayanır</small></button>
            <p className="small muted" style={{ marginTop: 14 }}>NAR bilgilendirme amaçlıdır; tıbbi tavsiye değildir.</p>
          </>
        )}
      </div>
    </div>
  )
}
