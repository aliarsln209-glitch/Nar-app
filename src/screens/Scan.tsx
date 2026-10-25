import { useEffect, useRef, useState } from 'react'
import { eanValid, findByEan, normalizeEan } from '../data/catalog'
import { ICamera, IKeyboard, ISearch, ISpark, ITorch } from '../ui/Icons'
import { useApp } from '../ui/ctx'
import { useLocal } from '../lib/storage'
import { profileLine } from '../ui/ProfileSwitcher'
import { getProduct } from '../data/catalog'
import { analyze } from '../engine/analyze'
import { useECodes } from '../data/useECodes'
import { Pill } from '../ui/components'

type BD = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

export default function Scan({ onProfile, onAssistant }: { onProfile: () => void; onAssistant: () => void }) {
  const { push, profile, online, history } = useApp()
  const ec = useECodes()
  const [camOk, setCamOk] = useLocal<boolean>('nar.camOk', false)
  const vref = useRef<HTMLVideoElement>(null)
  const track = useRef<MediaStreamTrack | null>(null)
  const [run, setRun] = useState(camOk)
  const [live, setLive] = useState(false)
  const [denied, setDenied] = useState(false)
  const [torch, setTorch] = useState(false)
  const [torchOk, setTorchOk] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [manual, setManual] = useState(false)
  const [num, setNum] = useState('')
  const [said, setSaid] = useState('')

  const handle = (raw: string): boolean => {
    const code = normalizeEan(raw.trim())
    if (!eanValid(code)) return false
    setSaid('Barkod okundu')
    try { navigator.vibrate?.(60) } catch { /* destek yok */ }
    const p = findByEan(code)
    if (p) push({ k: 'result', id: p.id })
    else push({ k: 'error', kind: 'unknown', ean: code })
    return true
  }

  useEffect(() => {
    if (!run) return
    let stop = false
    let stream: MediaStream | null = null
    let ctrl: { stop: () => void } | null = null
    ;(async () => {
      try {
        const v = vref.current!
        const Det = (window as unknown as { BarcodeDetector?: new (o: object) => BD }).BarcodeDetector
        const cons = { video: { facingMode: { ideal: 'environment' } }, audio: false } as MediaStreamConstraints
        if (Det) {
          const det = new Det({ formats: ['ean_13', 'ean_8', 'upc_a'] })
          stream = await navigator.mediaDevices.getUserMedia(cons)
          if (stop) { stream.getTracks().forEach((t) => t.stop()); return }
          v.srcObject = stream
          await v.play()
          track.current = stream.getVideoTracks()[0]
          setTorchOk(!!(track.current.getCapabilities?.() as { torch?: boolean } | undefined)?.torch)
          setLive(true)
          const loop = async () => {
            if (stop) return
            try { const r = await det.detect(v); if (r[0] && handle(r[0].rawValue)) return } catch { /* kare okunamadı */ }
            setTimeout(loop, 250)
          }
          loop()
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          const reader = new BrowserMultiFormatReader()
          ctrl = await reader.decodeFromConstraints(cons, v, (res) => { if (res && !stop) handle(res.getText()) })
          const ms = v.srcObject as MediaStream | null
          track.current = ms?.getVideoTracks()[0] ?? null
          setTorchOk(!!(track.current?.getCapabilities?.() as { torch?: boolean } | undefined)?.torch)
          setLive(true)
        }
      } catch (e) {
        if ((e as Error).name === 'NotAllowedError') setDenied(true)
        setRun(false); setLive(false)
      }
    })()
    return () => { stop = true; ctrl?.stop(); stream?.getTracks().forEach((t) => t.stop()); track.current = null; setLive(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  useEffect(() => {
    if (!live) { setElapsed(0); return }
    const t = setInterval(() => setElapsed((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [live])

  const flip = async () => {
    const n = !torch
    try { await track.current?.applyConstraints({ advanced: [{ torch: n } as MediaTrackConstraintSet] }); setTorch(n) } catch { /* fener yok */ }
  }
  const hint = !live ? '' : elapsed >= 8 ? 'Hâlâ okunmadı: numarayı elle yazabilir ya da etiketi fotoğraflayabilirsin.' : elapsed >= 3 ? 'Okunmuyor mu? Fener aç, 15–20 cm uzaklaş.' : 'Barkodu çerçevenin içine getir'
  const hl = elapsed >= 8

  const lastP = history[0] ? getProduct(history[0].id) : undefined
  const lastA = lastP ? analyze(lastP, profile, ec) : null
  return (
    <div>
      <div className="dark">
        <div className="scanhead">
          <span className="logo" aria-label="NAR">NAR</span>
          <button className={'torch' + (torch ? ' on' : '')} onClick={flip} disabled={!torchOk} aria-pressed={torch} aria-label="Fener"><ITorch /> Fener</button>
        </div>
        <button className="pchip" onClick={onProfile} aria-label="Profili değiştir">
          <span><b>{profile.name}</b> için tara · {profileLine(profile)}</span>
        </button>

        {run || live ? (
          <div className="videobox"><video ref={vref} playsInline muted aria-label="Kamera görüntüsü" /><div className="frame" />{!live && <div className="ph">Kamera açılıyor…</div>}</div>
        ) : denied ? (
          <div className="card" style={{ margin: '12px 0' }}>
            <strong style={{ color: 'var(--text)' }}>Kamera kapalı</strong>
            <p className="small muted">Kamera izni verilmedi. Tarayıcı ya da telefon ayarlarından bu site için kamerayı açabilirsin; şimdilik numarayı elle yazabilirsin.</p>
            <button className="btn sec" onClick={() => { setDenied(false); setRun(true) }}>Tekrar dene</button>
          </div>
        ) : !camOk ? (
          <div className="card" style={{ margin: '12px 0' }}>
            <strong style={{ color: 'var(--text)' }}>Kamera neden gerekli?</strong>
            <p className="small muted">Yalnızca barkodu ve etiketi okumak için. Fotoğraflar kaydedilmez.</p>
            <button className="btn" onClick={() => { setCamOk(true); setRun(true) }}>Kamerayı aç</button>
          </div>
        ) : (
          <div className="card" style={{ margin: '12px 0' }}><button className="btn" onClick={() => setRun(true)}>Kamerayı aç</button></div>
        )}
        <p className="hint" aria-live="polite" style={{ textAlign: 'center', minHeight: 40 }}>{live ? <>{elapsed < 3 && <b>{hint}</b>}{elapsed >= 3 && hint}</> : ''}</p>
        <span className="sr" aria-live="assertive">{said}</span>
      </div>

      <div className="page" style={{ paddingTop: 14 }}>
        {manual ? (
          <form onSubmit={(e) => { e.preventDefault(); if (!handle(num.replace(/\s/g, ''))) push({ k: 'error', kind: 'barcode' }) }}>
            <input className="field" autoFocus inputMode="numeric" placeholder="Barkod numarası (örn. 8690624102277)" value={num} onChange={(e) => setNum(e.target.value)} aria-label="Barkod numarası" />
            <button className="btn" type="submit">Ara</button>
          </form>
        ) : (
          <div className="row2">
            <button className={'btn line' + (hl ? ' hl' : '')} style={{ background: 'var(--card)' }} onClick={() => setManual(true)}><IKeyboard /> Numarayı elle yaz</button>
            <button className={'btn line' + (hl ? ' hl' : '')} style={{ background: 'var(--card)' }} onClick={() => push({ k: 'photo' })}><ICamera /> Etiketi fotoğrafla</button>
          </div>
        )}
        <button className="btn line" style={{ marginTop: 10, background: 'var(--card)' }} onClick={() => push({ k: 'search' })}><ISearch /> Ürün ara</button>

        {lastP && lastA && (
          <button className="last" onClick={() => push({ k: 'result', id: lastP.id })} style={lastA.level === 'clear' ? undefined : undefined}>
            <i style={lastA.level === 'clear' ? { background: 'var(--gline)' } : lastA.level === 'unknown' ? { background: '#5A574E' } : undefined} />
            <span className="t"><small>Son tarama</small><strong>{lastP.name}</strong></span>
            <Pill level={lastA.level} alert={lastA.alert} />
          </button>
        )}

        <button className={'abar' + (online ? '' : ' off')} onClick={onAssistant} aria-label="NAR Asistan: katkı maddeleri hakkında sor">
          <span className="sp"><ISpark /></span>
          <span className="tx">{online ? 'Katkı maddeleri hakkında sor' : 'Çevrimdışı: asistan şu an kullanılamıyor.'}</span>
          <small>NAR veri tabanına dayanır</small>
        </button>
      </div>
    </div>
  )
}
