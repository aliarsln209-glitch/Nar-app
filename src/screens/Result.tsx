import { useEffect, useMemo, useState } from 'react'
import { getProduct, type Product } from '../data/catalog'
import { analyze } from '../engine/analyze'
import type { RuleStatus } from '../engine'
import { cleanText } from '../lib/storage'
import { LEVEL_TEXT, Thumb, TopBar } from '../ui/components'
import { ISaved } from '../ui/Icons'
import { useApp } from '../ui/ctx'

const ROW: Record<RuleStatus, { t: string; cls: string }> = {
  contains: { t: 'İçeriyor', cls: 'danger' },
  may_contain: { t: 'İçerebilir', cls: 'caution' },
  ambiguous: { t: 'Belirsiz', cls: 'caution' },
  insufficient_data: { t: 'Bilgi yetersiz', cls: 'unknown' },
  no_declared_allergen_detected: { t: 'Etikette yok', cls: 'clear' }
}
const NLAB: [keyof NonNullable<Product['label']>['nutrition'], string, string][] = [
  ['kcal', 'Enerji', 'kcal'], ['fat', 'Yağ', 'g'], ['satFat', 'Doymuş yağ', 'g'], ['carb', 'Karbonhidrat', 'g'],
  ['sugar', 'Şeker', 'g'], ['fiber', 'Lif', 'g'], ['protein', 'Protein', 'g'], ['salt', 'Tuz', 'g']
]

export function eCodesIn(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(/(^|[^A-Za-z0-9])E[\s-]?(\d{3,4}[a-z]?)(?![A-Za-z0-9])/gi)) out.add('E' + m[2].toUpperCase())
  return [...out]
}

export default function Result({ id }: { id: string }) {
  const { profile, addHistory, saved, toggleSaved, push, goTab } = useApp()
  const p = getProduct(id)
  const a = useMemo(() => (p ? analyze(p, profile) : null), [p, profile])
  const [ask, setAsk] = useState(false)
  useEffect(() => { if (p) addHistory(p.id) /* eslint-disable-next-line */ }, [id])
  if (!p || !a) return <div className="page"><TopBar title="Ürün" /><p className="empty">Ürün bulunamadı.</p></div>
  const L = LEVEL_TEXT[a.level]
  const isSaved = saved.includes(p.id)
  const ecodes = a.labelUsable ? eCodesIn(p.label!.ingredients) : []
  const conflicts = a.rows.filter((r) => r.result.data_conflict)

  return (
    <div>
      <TopBar title="Sonuç" right={<button className="iconbtn" onClick={() => toggleSaved(p.id)} aria-label={isSaved ? 'Kaydedilenlerden çıkar' : 'Kaydet'} style={{ color: isSaved ? 'var(--green)' : undefined }}><ISaved fill={isSaved} /></button>} />
      <div className="page" style={{ paddingTop: 4 }}>
        <div className="hero">
          <Thumb p={p} big />
          <div><h1 className="big" style={{ fontSize: 20, margin: 0 }}>{p.name}</h1><span className="muted small">{p.size ?? ''}{p.ean ? ` · ${p.ean}` : ''}</span></div>
        </div>

        <div className={'verdict ' + a.level} role="status">
          <h2>{L.title}</h2>
          <p style={{ margin: 0, fontSize: 14 }}>{L.sub}</p>
        </div>
        {a.labelNote && <p className="note">{a.labelNote}</p>}

        {a.rows.length > 0 && (
          <div className="card" style={{ marginTop: 10 }}>
            {a.rows.map((r) => {
              const s = ROW[r.result.status]
              return (
                <div className="arow" key={r.key}>
                  <div>
                    <strong>{r.label}</strong>
                    <div className="why">{r.result.warning_text}</div>
                    {r.result.conflict_note && <div className="why" style={{ color: 'var(--aink)' }}>{r.result.conflict_note}</div>}
                    {r.result.threshold && r.result.threshold.measured_total_so2 != null && <div className="why">Toplam SO₂: {r.result.threshold.measured_total_so2} {r.result.threshold.unit ?? ''} · eşik: {r.result.threshold.threshold_status === 'exceeded' ? 'aşıldı' : r.result.threshold.threshold_status === 'not_exceeded' ? 'aşılmadı' : 'değerlendirilemedi'}</div>}
                    {r.result.cross_reactivity_notes.map((n) => <div className="why" key={n.rule_id}>{n.text}</div>)}
                  </div>
                  <span className={'pill ' + s.cls}>{s.t}</span>
                </div>
              )
            })}
          </div>
        )}
        {profile.preferences.length > 0 && <p className="note" style={{ marginTop: 10 }}>Tercihlerin ({profile.preferences.length}) için değerlendirme henüz yok; yalnızca alerjiler hesaplanıyor.</p>}
        {conflicts.length > 0 && <p className="note">Etikette birbiriyle çelişen beyanlar var; daha ihtiyatlı sonuç gösterildi.</p>}

        {ecodes.length > 0 && (
          <>
            <h2>Katkı maddeleri</h2>
            <div className="chips">{ecodes.map((c) => <button key={c} className="ecode" onClick={() => push({ k: 'additive', code: c })}>{c}</button>)}</div>
          </>
        )}

        <h2>NAR Asistan</h2>
        <div className="card">
          <p className="small muted" style={{ marginTop: 0 }}>Bu sonucu açıklamak için hazırlanan yardımcı. Henüz devrede değil; yanıtlar etiket verisine ve kaynaklara dayanacak. Tıbbi sorular için doktoruna danış.</p>
          <div className="chips">
            {['Neden bu sonuç?', 'Hangi içerik sorun?', 'Alternatif öner'].map((c) => <button key={c} className="chip" disabled onClick={() => setAsk(!ask)}>{c}</button>)}
          </div>
        </div>

        {a.labelUsable && p.label && (
          <>
            <h2>Etiket bilgisi</h2>
            <dl className="facts card" style={{ margin: 0 }}>
              <dt style={{ marginTop: 0 }}>İçindekiler</dt><dd>{cleanText(p.label.ingredients)}</dd>
              <dt>Alerjen beyanı</dt><dd>{cleanText(p.label.allergenStatement) || '—'}</dd>
            </dl>
            <details>
              <summary>Besin değerleri (100 g/ml)</summary>
              <table className="ntable"><tbody>
                {NLAB.filter(([k]) => p.label!.nutrition[k] != null).map(([k, l, u]) => <tr key={k}><td>{l}</td><td>{p.label!.nutrition[k]} {u}</td></tr>)}
              </tbody></table>
            </details>
            <p className="small muted">Kaynak: {p.label.source}. Bu veri üretici etiketinden derlenmiştir; satın almadan önce ambalajı kontrol et.</p>
          </>
        )}
        <button className="btn line" style={{ marginTop: 14 }} onClick={() => goTab('compare')}>Karşılaştır sekmesine git</button>
        <p className="small muted" style={{ marginTop: 14 }}>NAR bilgilendirme amaçlıdır; tıbbi tavsiye değildir. “Çakışma yok” sonucu alerjenin kesin olmadığı anlamına gelmez.</p>
      </div>
    </div>
  )
}
