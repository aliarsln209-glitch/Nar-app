import { useMemo, useState } from 'react'
import type { ECode } from '../data/ecodes'
import { useECodes } from '../data/useECodes'
import { clip, firstSentence, sourceBadge } from '../data/sensitivity'
import { Sheet } from './components'
import { useApp } from './ctx'

type Ans = { kind: 'info'; q: string; text: string } | { kind: 'medical' } | { kind: 'product' } | { kind: 'none' } | null
const MED = /(yersem|ne olur|zarar|hasta|tedavi|ilaç|belirti|doz|hamile|emzir|öl[üu]r|tehlikeli mi)/i
const PROD = /(bu (ürün|bisküvi|çikolata|cips|gofret)|uygun mu|yiyebilir miyim|alayım mı)/i
const BUILD = typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : ''

export default function AssistantSheet({ code, onClose }: { code?: string; onClose: () => void }) {
  const { online, goTab, report } = useApp()
  const all = useECodes()
  const [sel, setSel] = useState<ECode | null>(null)
  const [q, setQ] = useState('')
  const [ans, setAns] = useState<Ans>(null)
  const [rated, setRated] = useState(false)
  const start = useMemo(() => (code && all ? all.find((e) => e.code.toUpperCase() === code.toUpperCase()) ?? null : null), [code, all])
  const cur = sel ?? start

  const chips: { q: string; text: string }[] = []
  if (cur) {
    if (cur.compExp) chips.push({ q: `${cur.code} ne işe yarar?`, text: cur.compExp })
    if (cur.riskValue) chips.push({ q: 'Güvenli alım değeri nedir?', text: `${cur.riskValue}\n\nBu değer bilimsel bir referanstır; üründeki miktarı göstermez.` })
    if (cur.notSuitable) chips.push({ q: 'Kimler kaçınmalı?', text: cur.notSuitable })
    if (cur.riskHalk) chips.push({ q: 'Riskleri neler?', text: cur.riskHalk })
  }
  const find = (s: string): ECode | null => {
    if (!all) return null
    const m = /e[\s-]?(\d{3,4}[a-z]?)/i.exec(s)
    if (m) return all.find((e) => e.code.toUpperCase() === 'E' + m[1].toUpperCase()) ?? null
    const t = s.toLocaleLowerCase('tr')
    return all.find((e) => t.includes(e.name.toLocaleLowerCase('tr'))) ?? null
  }
  const ask = (text: string) => {
    setRated(false)
    if (MED.test(text)) return setAns({ kind: 'medical' })
    if (PROD.test(text)) return setAns({ kind: 'product' })
    const e = find(text)
    if (e) { setSel(e); return setAns(null) }
    setAns({ kind: 'none' })
  }
  const badges = cur ? [...new Map(cur.sources.map(sourceBadge).filter(Boolean).map((b) => [b!.label, b!])).values()].slice(0, 8) : []

  return (
    <Sheet title="NAR Asistan · NAR veri tabanına dayanır" onClose={onClose}>
      {!online ? <p className="note">Çevrimdışı: asistan şu an kullanılamıyor.</p> : (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>Yalnızca uygulamanın kendi veri tabanından cevap verir; internete bakmaz. Hiçbir ürüne “uygun” ya da “dikkat” demez.</p>
          {cur ? (
            <div className="chips">
              <span className="pill clear">{cur.code} · {cur.name}</span>
              <button className="chip" onClick={() => { setSel(null); setAns(null); }}>Başka madde</button>
            </div>
          ) : <p className="small">Bir E-kodu ya da madde adı yaz (örn. “E471”).</p>}
          {cur && <div className="chips" style={{ marginTop: 10 }}>{chips.map((c) => <button key={c.q} className="chip" onClick={() => { setRated(false); setAns({ kind: 'info', q: c.q, text: c.text }) }}>{c.q}</button>)}</div>}
          <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { ask(q); setQ('') } }}>
            <input className="search" placeholder={cur ? 'Başka bir soru…' : 'E-kod veya madde adı…'} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="send" />
          </form>

          {ans?.kind === 'info' && cur && (
            <div className="ans" aria-live="polite">
              <strong>{ans.q}</strong>
              <p style={{ whiteSpace: 'pre-line' }}>{clip(ans.text, 900)}</p>
              <div>{badges.map((b) => <a key={b.label} className="src" href={b.url} target="_blank" rel="noopener noreferrer">[{b.label}]</a>)}</div>
              <p className="small muted">Veri: NAR E-kod sözlüğü{BUILD ? ` · ${BUILD}` : ''}</p>
              {!rated ? (
                <p className="small">Faydalı mı? <button className="chip" onClick={() => { report('feedback', { q: ans.q, code: cur.code, v: 1 }); setRated(true) }}>Evet</button> <button className="chip" onClick={() => { report('feedback', { q: ans.q, code: cur.code, v: 0 }); setRated(true) }}>Hayır</button> <button className="chip" onClick={() => { report('feedback', { q: ans.q, code: cur.code, v: 'wrong' }); setRated(true) }}>Hatalı bilgi bildir</button></p>
              ) : <p className="small muted">Teşekkürler, geri bildirimin kaydedildi.</p>}
            </div>
          )}
          {ans?.kind === 'medical' && <div className="ans"><p style={{ margin: 0 }}>Bu bir sağlık sorusu. NAR tıbbi yorum yapmaz; belirtilerin ya da kullandığın ilaçların için hekimine ya da eczacına danış.</p></div>}
          {ans?.kind === 'product' && <div className="ans"><p>Ürünlerle ilgili kararı asistan vermez; karar kural motorundan gelir.</p><button className="btn" onClick={() => { onClose(); goTab('scan') }}>Ürünü tara</button></div>}
          {ans?.kind === 'none' && <div className="ans"><p style={{ margin: 0 }}>Bu bilgi NAR veri tabanında yok. Başka bir madde ya da E-kodu sorabilirsin.</p></div>}
        </>
      )}
    </Sheet>
  )
}
