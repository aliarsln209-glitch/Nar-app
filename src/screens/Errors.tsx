import { IQuestion } from '../ui/Icons'
import { TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'

const COPY = {
  barcode: { t: 'Barkod okunamadı', d: 'Numara geçerli bir barkod gibi görünmüyor (kontrol hanesi tutmuyor).' },
  unknown: { t: 'Bu ürünü henüz tanımıyoruz', d: 'Katalogda şimdilik yalnızca atıştırmalıklar var.' },
  ocr: { t: 'Etiketi tam okuyamadık', d: 'Metni elle düzeltebilir ya da fotoğrafı yeniden çekebilirsin.' },
  perm: { t: 'Kamera kapalı', d: 'Kamera izni verilmedi.' }
} as const

export default function ErrorView({ kind, ean }: { kind: keyof typeof COPY; ean?: string }) {
  const { push, back, goTab, report } = useApp()
  const c = COPY[kind]
  return (
    <div>
      <TopBar title="" />
      <div className="page err">
        <IQuestion />
        <h1>{c.t}</h1>
        <p className="muted">{c.d}{ean ? ` (${ean})` : ''}</p>
        {kind === 'barcode' && <><button className="btn" onClick={back}>Tekrar tara</button><button className="btn sec" onClick={back}>Numarayı yaz</button></>}
        {kind === 'unknown' && (
          <>
            <button className="btn" onClick={() => push({ k: 'photo' })}>Etiketi fotoğrafla</button>
            <button className="btn sec" onClick={() => { report('request', { ean }); goTab('scan') }}>Ürün eklenmesini iste</button>
          </>
        )}
        {kind === 'ocr' && <><button className="btn" onClick={back}>Maddeleri düzenle</button><button className="btn sec" onClick={() => push({ k: 'photo' })}>Yeniden çek</button></>}
        {kind === 'perm' && <><button className="btn" onClick={back}>Elle yaz</button></>}
      </div>
    </div>
  )
}
