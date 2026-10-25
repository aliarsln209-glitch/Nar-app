import { useEffect, useRef, useState } from 'react'
import { eanValid, findByEan, normalizeEan } from '../data/catalog'
import { ISearch } from '../ui/Icons'
import { useApp } from '../ui/ctx'

type BD = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

export default function Scan() {
  const { push } = useApp()
  const vref = useRef<HTMLVideoElement>(null)
  const [on, setOn] = useState(false)
  const [err, setErr] = useState('')
  const [manual, setManual] = useState('')
  const [mErr, setMErr] = useState('')

  const handle = (raw: string): boolean => {
    const code = normalizeEan(raw.trim())
    if (!eanValid(code)) return false
    const p = findByEan(code)
    push(p ? { k: 'result', id: p.id } : { k: 'notfound', ean: code })
    return true
  }

  useEffect(() => {
    if (!on) return
    let stop = false
    let stream: MediaStream | null = null
    let ctrl: { stop: () => void } | null = null
    ;(async () => {
      try {
        const v = vref.current!
        const Det = (window as unknown as { BarcodeDetector?: new (o: object) => BD }).BarcodeDetector
        if (Det) {
          const det = new Det({ formats: ['ean_13', 'ean_8', 'upc_a'] })
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
          if (stop) { stream.getTracks().forEach((t) => t.stop()); return }
          v.srcObject = stream
          await v.play()
          const loop = async () => {
            if (stop) return
            try { const r = await det.detect(v); if (r[0] && handle(r[0].rawValue)) return } catch { /* kare okunamadı */ }
            setTimeout(loop, 250)
          }
          loop()
        } else {
          // iOS Safari vb.: BarcodeDetector yok → ZXing (gerektiğinde yüklenir)
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          const reader = new BrowserMultiFormatReader()
          ctrl = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, v, (res) => { if (res && !stop) handle(res.getText()) })
        }
      } catch (e) {
        setErr((e as Error).name === 'NotAllowedError' ? 'Kamera izni verilmedi. Barkodu aşağıdan elle girebilirsin.' : 'Kamera açılamadı. Barkodu aşağıdan elle girebilirsin.')
        setOn(false)
      }
    })()
    return () => { stop = true; ctrl?.stop(); stream?.getTracks().forEach((t) => t.stop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  return (
    <div className="page">
      <h1 className="big">Tara</h1>
      <p className="muted" style={{ marginTop: 0 }}>Ürünün barkodunu okut; etiketi profiline göre karşılaştıralım.</p>
      {on ? (
        <>
          <div className="videobox"><video ref={vref} playsInline muted /><div className="frame" /></div>
          <button className="btn sec" style={{ marginTop: 10 }} onClick={() => setOn(false)}>Kamerayı kapat</button>
        </>
      ) : (
        <div className="card">
          <p style={{ marginTop: 0 }}>Kamera yalnızca barkodu okumak için açılır. Görüntü cihazından çıkmaz ve kaydedilmez.</p>
          <button className="btn" onClick={() => { setErr(''); setOn(true) }}>Kamerayı aç</button>
          {err && <p className="small" style={{ color: 'var(--allergy)' }}>{err}</p>}
        </div>
      )}

      <h2>Barkodu elle gir</h2>
      <form onSubmit={(e) => { e.preventDefault(); setMErr(handle(manual.replace(/\s/g, '')) ? '' : 'Geçerli bir barkod değil (8, 12 veya 13 hane; kontrol hanesi tutmuyor).') }}>
        <input className="search" inputMode="numeric" placeholder="8690624102277" value={manual} onChange={(e) => setManual(e.target.value)} />
        {mErr && <p className="small" style={{ color: 'var(--allergy)', marginTop: 0 }}>{mErr}</p>}
        <button className="btn sec" type="submit">Ara</button>
      </form>
      <button className="btn line" style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }} onClick={() => push({ k: 'search' })}><ISearch /> Ürün ara</button>
    </div>
  )
}
