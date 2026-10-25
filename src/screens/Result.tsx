import { useEffect, useMemo, useRef, useState } from 'react'
import { getProduct, type Product } from '../data/catalog'
import { useECodes } from '../data/useECodes'
import { analyze } from '../engine/analyze'
import { parseIngredients } from '../data/additives'
import { norm } from '../engine/rules'
import { cleanText, useLocal } from '../lib/storage'
import { LEGAL, LEVEL, Thumb, TopBar } from '../ui/components'
import { IInfo, ISaved, ISpark, IShield, ITriangle } from '../ui/Icons'
import { useApp } from '../ui/ctx'
import { profileLine } from '../ui/ProfileSwitcher'

const NUT: [string, string, string][] = [['kcal', 'Enerji', 'kcal'], ['fat', 'Yağ', 'g'], ['satFat', 'Doymuş yağ', 'g'], ['carb', 'Karbonhidrat', 'g'], ['sugar', 'Şeker', 'g'], ['fiber', 'Lif', 'g'], ['protein', 'Protein', 'g'], ['salt', 'Tuz', 'g']]
const FIELD: Record<string, string> = { ingredients: 'içindekiler', allergen_statement: 'alerjen beyanı', product_name: 'ürün adı', claims: 'ürün üzerindeki beyan' }
const DATA_DATE = '25 Ekim 2026'

export default function Result({ id }: { id: string }) {
  const { profiles, profile, addHistory, saved, toggleSaved, push, goTab, temp, flagged, openAssistant, openProfiles, report } = useApp()
  const p: Product | undefined = id === 'photo' ? temp ?? undefined : getProduct(id)
  const ecodes = useECodes()
  const a = useMemo(() => (p ? analyze(p, profile, ecodes) : null), [p, profile, ecodes])
  const head = useRef<HTMLHeadingElement>(null)
  const [wrong, setWrong] = useState(false)
  const [dismissed, setDismissed] = useLocal<boolean>('nar.promptDismissed', false)
  useEffect(() => { if (p && id !== 'photo') addHistory(p.id) /* eslint-disable-next-line */ }, [id])
  useEffect(() => { head.current?.focus() }, [id, a?.level])
  if (!p || !a) return <div className="page"><TopBar title="Ürün" /><p className="empty">Ürün bulunamadı.</p></div>
  if (profile.sensitivities.length && !ecodes) return <div className="page"><TopBar title="Sonuç" /><p className="empty">Hesaplanıyor…</p></div>
  const L = LEVEL[a.level]
  const Icon = L.icon
  const isSaved = saved.includes(p.id)
  const hasAllergy = a.warnings.some((w) => w.kind === 'allergy')
  const clearRows = a.rows.filter((r) => r.result.status === 'no_declared_allergen_detected')
  const why = a.rows.flatMap((r) => r.result.matched_rules.map((m) => `${r.label}: “${m.matched_term}” (${FIELD[m.source_field] ?? m.source_field})`))
  const ings = a.labelUsable && p.label ? parseIngredients(p.label.ingredients) : []
  const terms = a.rows.flatMap((r) => r.result.matched_rules.map((m) => norm(m.matched_term)))
  const thresholds = a.rows.filter((r) => r.result.threshold?.measured_total_so2 != null)

  return (
    <div>
      <TopBar title="Sonuç" right={id !== 'photo' ? <button className="iconbtn" onClick={() => toggleSaved(p.id)} aria-label={isSaved ? 'Kaydedilenlerden çıkar' : 'Kaydet'} style={{ color: isSaved ? 'var(--green)' : undefined }}><ISaved fill={isSaved} /></button> : undefined} />
      <div className="page" style={{ paddingTop: 4, paddingBottom: 150 }}>
        <div className="hero">
          <Thumb p={p} />
          <div>
            <h1 className="big" style={{ fontSize: 20, margin: 0 }}>{p.name}</h1>
            <span className="muted small">{p.size ?? ''}{p.ean ? ` · ${p.ean}` : ''}</span>
            {flagged[p.id] && <div className="small" style={{ color: 'var(--aink)' }}>Doğrulanıyor</div>}
          </div>
        </div>

        {profiles.length === 0 && !dismissed && (
          <div className="card" style={{ marginTop: 12 }}>
            <strong>Sonuçları sana göre kişiselleştirmek ister misin? (30 sn)</strong>
            <div className="row2" style={{ marginTop: 8 }}><button className="btn" onClick={() => goTab('profile')}>Başla</button><button className="btn sec" onClick={() => setDismissed(true)}>Şimdi değil</button></div>
          </div>
        )}
        <button className="pchip" style={{ marginTop: 12 }} onClick={openProfiles} aria-label="Profili değiştir"><span><b>{profile.name}</b> için · {profileLine(profile)}</span></button>

        <div className={'band ' + a.level} role="status">
          <Icon />
          <div>
            <h2 tabIndex={-1} ref={head} style={{ outline: 'none' }}>{L.title}</h2>
            <p>{a.sub}</p>
            {a.level === 'clear' && <p className="small" style={{ marginTop: 6 }}>Ambalajdaki içindekiler listesini ve alerjen uyarısını yine de oku.</p>}
            {a.level === 'unknown' && a.labelNote && <p className="small">{a.labelNote} “Alerjen yok” denemez.</p>}
          </div>
        </div>
        {hasAllergy && <p className="small" style={{ margin: '0 0 6px' }}>Alerji durumunda hekimine danış.</p>}

        {(a.warnings.length > 0 || thresholds.length > 0) && (
          <>
            <h2>Uyarılar</h2>
            {a.warnings.filter((w) => w.kind === 'allergy').map((w) => (
              <div className="w allergy" key={'a' + w.title}><IShield /><div><strong>{w.title}</strong>{w.text}</div></div>
            ))}
            {a.warnings.filter((w) => w.kind === 'sens').map((w) => (
              <div className="w sens" key={'s' + w.code}><ITriangle /><div><strong>{w.title}</strong>{w.text}</div></div>
            ))}
            {thresholds.map((r) => <p className="small muted" key={r.key}>Toplam SO₂: {r.result.threshold!.measured_total_so2} {r.result.threshold!.unit ?? ''} · yasal eşik: {r.result.threshold!.threshold_status === 'exceeded' ? 'aşıldı' : r.result.threshold!.threshold_status === 'not_exceeded' ? 'aşılmadı' : 'değerlendirilemedi'}</p>)}
          </>
        )}
        {a.rows.flatMap((r) => r.result.cross_reactivity_notes).map((n) => <p className="small muted" key={n.rule_id}>{n.text}</p>)}
        {a.rows.some((r) => r.result.data_conflict) && <p className="note">Etikette birbiriyle çelişen beyanlar var; daha ihtiyatlı sonuç gösterildi.</p>}
        {clearRows.length > 0 && a.level !== 'unknown' && <p className="small muted">Etikette bulunmadı: {clearRows.map((r) => r.label).join(', ')}.</p>}
        {profile.preferences.length > 0 && <p className="small muted">Tercihler ({profile.preferences.length}) için değerlendirme henüz yok.</p>}

        <details>
          <summary>Neden bu sonucu gördün?</summary>
          <p className="small">Karar, etiket verisini profilindeki seçimlerle kural setine göre karşılaştırır; asistan karar vermez.</p>
          <p className="small"><b>Kontrol edilenler:</b> {a.checkedText || '—'}</p>
          {why.length > 0 ? <ul className="small">{why.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="small">Seçtiklerin için etikette eşleşme bulunamadı.</p>}
        </details>

        {a.additives.length > 0 && (
          <>
            <h2>Katkı maddeleri ({a.additives.length})</h2>
            <ul className="list">
              {a.additives.map((d) => (
                <li key={d.code}>
                  <button className={'prow add' + (d.sens.length ? ' sens' : '')} onClick={() => push({ k: 'additive', code: d.code })}>
                    <span className="ebadge">{d.code}</span>
                    <span className="t"><strong>{d.name}</strong><small>{d.tag}{d.tag && d.summary ? ' · ' : ''}{d.summary}</small>{d.sens.length > 0 && <small style={{ color: 'var(--aink)', fontWeight: 700 }}>{d.sens.join(', ')} hassasiyetinle ilgili</small>}</span>
                    <span aria-hidden>›</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="small muted">Dokunarak açıklamaya ve kaynaklara ulaşabilirsin.</p>
          </>
        )}

        <h2>NAR Asistan</h2>
        <button className="abar" onClick={() => openAssistant(a.codes[0])}>
          <span className="sp"><ISpark /></span><span className="tx">Katkı maddeleri hakkında sor</span><small>NAR veri tabanına dayanır</small>
        </button>

        {a.labelUsable && p.label && (
          <>
            <h2>İçindekiler ({ings.length})</h2>
            <div className="card ing">
              <ul>
                {ings.map((it, i) => {
                  const t = norm(it.main + ' ' + (it.sub ?? ''))
                  const hit = terms.some((x) => t.includes(x))
                  return (
                    <li key={i} className={hit ? 'hit' : ''}>
                      <span>{it.main}{hit && <em className="pill alert">alerjenle ilgili</em>}</span>
                      {it.sub && <small>{it.sub}</small>}
                    </li>
                  )
                })}
              </ul>
              {p.label.allergenStatement && <p className="small" style={{ marginBottom: 0 }}><b>Üreticinin alerjen beyanı:</b> {cleanText(p.label.allergenStatement)}</p>}
            </div>
            {NUT.some(([k]) => (p.label!.nutrition as unknown as Record<string, number | null>)[k] != null) && (
              <details><summary>Besin değerleri (100 g/ml)</summary>
                <table className="ntable"><tbody>{NUT.filter(([k]) => (p.label!.nutrition as unknown as Record<string, number | null>)[k] != null).map(([k, l, u]) => <tr key={k}><td>{l}</td><td>{(p.label!.nutrition as unknown as Record<string, number | null>)[k]} {u}</td></tr>)}</tbody></table>
              </details>
            )}
            <p className="small muted">Kaynak: {p.label.source}{id !== 'photo' ? ` · Veri tarihi: ${DATA_DATE}` : ''}.</p>
          </>
        )}
        {id !== 'photo' && <button className="chip" style={{ marginTop: 8 }} onClick={() => setWrong(true)}>Bu ürün yanlış mı?</button>}
        {wrong && (
          <div className="card" style={{ marginTop: 8 }}>
            <strong>Bu ürün yanlış mı?</strong>
            <div className="row2" style={{ marginTop: 8 }}>
              <button className="btn sec" onClick={() => push({ k: 'search', pick: 'fix', fixId: p.id })}>Doğru ürünü seç</button>
              <button className="btn sec" onClick={() => { report('wrong', { id: p.id }); setWrong(false) }}>Bildir</button>
            </div>
          </div>
        )}
        <p className="small muted" style={{ marginTop: 14 }}>{LEGAL}</p>
      </div>
      <div className="sticky"><button className="btn" onClick={() => goTab('scan')}>Yeni tara</button></div>
    </div>
  )
}
