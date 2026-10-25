import { useState } from 'react'
import type { Product } from '../data/catalog'
import { TopBar } from '../ui/components'
import { ICamera } from '../ui/Icons'
import { useApp } from '../ui/ctx'

// Etiket fotoğrafı: cihazda OCR (Tesseract, gerektiğinde yüklenir). Görüntü hiçbir yere gönderilmez ve kaydedilmez.
export default function Photo() {
  const { push, setTemp, online } = useApp()
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [warn, setWarn] = useState('')

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setBusy(true); setWarn('')
    try {
      const { createWorker } = await import('tesseract.js')
      const w = await createWorker('tur')
      const r = await w.recognize(f)
      await w.terminate()
      const t = r.data.text
      const m = /i[çc]indekiler\s*[:：]?\s*([\s\S]+)/i.exec(t)
      setText((m ? m[1] : t).replace(/\n+/g, ' ').trim())
      if (r.data.confidence < 70) setWarn('Etiketi tam okuyamadık. Metni kontrol edip düzeltebilirsin.')
    } catch {
      setWarn(online ? 'Etiketi okuyamadık. İçindekiler metnini aşağıya elle yazabilirsin.' : 'İnternet yok: fotoğraftan okuma şu an çalışmıyor. İçindekileri elle yazabilirsin.')
    }
    setBusy(false)
  }
  const go = () => {
    const p: Product = { id: 'photo', ean: null, eanValid: false, name: 'Fotoğraflanan etiket', size: null, matchStatus: 'verified', image: null,
      label: { ingredients: text.trim(), allergenStatement: null, nutrition: { kcal: null, kj: null, fat: null, satFat: null, transFat: null, carb: null, sugar: null, fiber: null, protein: null, salt: null }, source: 'Etiket fotoğrafı (bu cihazda okundu, düzenlenebilir)', sourceName: '' } }
    setTemp(p); push({ k: 'result', id: 'photo' })
  }
  return (
    <div>
      <TopBar title="Etiketi fotoğrafla" />
      <div className="page" style={{ paddingTop: 4 }}>
        <p className="muted" style={{ marginTop: 0 }}>İçindekiler listesinin net bir fotoğrafını çek. Okuma bu cihazda yapılır; fotoğraf kaydedilmez.</p>
        <label className="btn" style={{ cursor: 'pointer' }}>
          <ICamera /> {busy ? 'Okunuyor…' : 'Fotoğraf çek / seç'}
          <input type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {warn && <p className="note" role="status" style={{ marginTop: 10 }}>{warn}</p>}
        <h2>İçindekiler</h2>
        <textarea className="field" placeholder="Okunan metin burada görünür; elle de yazabilirsin." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn" disabled={text.trim().length < 5} onClick={go}>Maddeleri kontrol et</button>
        <p className="small muted">Yalnızca “içindekiler” kullanılır; alerjen beyanı okunmadığı için sonuç eksik olabilir.</p>
      </div>
    </div>
  )
}
