import { useEffect, useState } from 'react'
import { ALLERGIES, PREFERENCES, engine, type AnalysisResult, type Profile, type Status } from '../engine'
import type { DemoProduct } from '../engine/mock'
import { cleanText } from '../lib/storage'

const STATUS: Record<Status, { label: string; tone: 'bad' | 'warn' | 'ok' | 'gray'; hint: string }> = {
  contains: { label: 'İçeriyor', tone: 'bad', hint: 'Etikette bu alerjen var.' },
  may_contain: { label: 'İçerebilir', tone: 'warn', hint: 'Çapraz bulaşma uyarısı var.' },
  not_suitable: { label: 'Uygun değil', tone: 'bad', hint: 'Tercihine uymuyor.' },
  criterion_met: { label: 'Kriteri karşılıyor', tone: 'ok', hint: 'Etiket verisine göre uygun.' },
  insufficient_data: { label: 'Veri yetersiz', tone: 'gray', hint: 'Karar vermek için etiket bilgisi eksik.' },
  uncertain: { label: 'Belirsiz', tone: 'gray', hint: 'Kesin sonuç verilemiyor; ambalajı kontrol et.' },
  not_evaluated: { label: 'Demo’da yok', tone: 'gray', hint: 'Bu ürün/kriter demo test setinde yok.' }
}

function labelOf(key: string) {
  const [type, k] = key.split(':')
  const map = (type === 'allergy' ? ALLERGIES : PREFERENCES) as Record<string, string>
  return map[k] ?? k
}

interface Props {
  item: DemoProduct
  profile: Profile
  fav: boolean
  onToggleFav: () => void
  onBack: () => void
}

export default function ResultView({ item, profile, fav, onToggleFav, onBack }: Props) {
  const [res, setRes] = useState<AnalysisResult | null>(null)
  const [err, setErr] = useState('')
  const p = item.product

  useEffect(() => {
    setRes(null)
    setErr('')
    engine.analyze({ productId: item.id, product: p, profile }).then(setRes).catch(() => setErr('Analiz yapılamadı.'))
  }, [item.id, p, profile])

  const empty = profile.allergies.length + profile.preferences.length === 0

  return (
    <section className="page">
      <div className="row">
        <button className="link" onClick={onBack}>← Geri</button>
        <button className="link" onClick={onToggleFav} aria-label="Favori">{fav ? '★ Favori' : '☆ Favori'}</button>
      </div>
      <h1>{cleanText(p.product_name)}</h1>
      <p className="muted">{cleanText(item.category)}</p>

      <h2>Senin için sonuç</h2>
      {empty && <p className="muted">Profilinde seçili alerji/tercih yok. “Profilim” sekmesinden ekle.</p>}
      {err && <p className="note">{err}</p>}
      <ul className="results">
        {res?.results.map((r) => {
          const s = STATUS[r.status]
          return (
            <li key={r.key} className={'res ' + s.tone}>
              <div>
                <strong>{labelOf(r.key)}</strong>
                <small>{s.hint}</small>
              </div>
              <span className="badge">
                {s.label}
                {r.calculationValue != null ? ` · ${r.calculationValue} g` : ''}
              </span>
            </li>
          )
        })}
      </ul>
      {res?.source === 'demo' && (
        <p className="note">Demo: sonuçlar test setindeki elle hazırlanmış beklenen değerlerdir, gerçek analiz motoru çıktısı değildir.</p>
      )}

      <h2>Etiket bilgisi</h2>
      <dl className="facts">
        <dt>İçindekiler</dt>
        <dd>{cleanText(p.ingredients) || '—'}</dd>
        <dt>Alerjen beyanı</dt>
        <dd>{cleanText(p.allergen_statement) || '—'}</dd>
        <dt>İddialar (ambalaj üzerindeki)</dt>
        <dd>{cleanText(p.claims) || '—'} <small className="muted">(doğrulanmamış)</small></dd>
        <dt>Besin değerleri</dt>
        <dd>{cleanText(p.nutrition_facts) || '—'}</dd>
      </dl>
      {p.ingredients_complete === false && <p className="note">Bu ürünün içindekiler listesi eksik olabilir.</p>}
    </section>
  )
}
