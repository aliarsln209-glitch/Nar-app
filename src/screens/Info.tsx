import { PRODUCTS } from '../data/catalog'
import { TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'

export function Privacy() {
  const { eraseAll, back } = useApp()
  return (
    <div>
      <TopBar title="Gizlilik ve veriler" />
      <div className="page" style={{ paddingTop: 4 }}>
        <p>Alerji ve tercih seçimlerin sağlık bilgisi niteliğinde olabilir. NAR bu bilgileri <strong>yalnızca bu cihazın tarayıcı deposunda</strong> tutar; sunucuya göndermez, hesap gerektirmez.</p>
        <ul>
          <li>Geçmiş, kaydedilenler ve profil: yalnızca bu cihazda.</li>
          <li>Kamera: yalnızca barkod okumak için, sen açınca çalışır; görüntü saklanmaz.</li>
          <li>Tarayıcı verisini silersen ya da aşağıdan silersen her şey kaybolur.</li>
        </ul>
        <button className="btn danger" onClick={() => { if (confirm('Profil, geçmiş ve kaydedilenlerin silinsin mi?')) { eraseAll(); back() } }}>Tüm verilerimi sil</button>
      </div>
    </div>
  )
}

export function About() {
  const v = PRODUCTS.filter((p) => p.matchStatus === 'verified').length
  return (
    <div>
      <TopBar title="Hakkında ve kaynaklar" />
      <div className="page" style={{ paddingTop: 4 }}>
        <p>NAR, paketli gıda etiketlerini alerji profiline göre okumana yardım eder. Bilgilendirme amaçlıdır; tıbbi tavsiye değildir. “Çakışma yok” sonucu hiçbir zaman güvenlik garantisi değildir.</p>
        <h2>Veri</h2>
        <ul>
          <li>Ürün etiketleri: üreticilerin etiket bilgisi, Migros web sitesinden derlenmiştir. Katalogda {PRODUCTS.length} ürün var; {v} tanesinin etiketi doğrulandı.</li>
          <li>Alerjen kuralları: v3.1.0 kural seti (14 kategori), TGK etiketleme mevzuatı ve kılavuzlarına dayanır.</li>
          <li>E-kod sözlüğü: 272 katkı maddesi; kaynaklar her kaydın altında.</li>
        </ul>
        <p className="note">Doğrulanmamış etiketler karar için kullanılmaz; bu durumda “Bilgi yetersiz” gösterilir.</p>
      </div>
    </div>
  )
}

export function NotFound({ ean }: { ean: string }) {
  const { push } = useApp()
  return (
    <div>
      <TopBar title="Ürün bulunamadı" />
      <div className="page" style={{ paddingTop: 4 }}>
        <p className="empty" style={{ paddingBottom: 8 }}>{ean} barkodlu ürün katalogda yok.</p>
        <p className="muted small">Katalog şimdilik yalnızca atıştırmalıkları kapsıyor. Ambalajdaki içindekiler listesini kendin kontrol et.</p>
        <button className="btn" onClick={() => push({ k: 'search' })}>Ürün ara</button>
      </div>
    </div>
  )
}

export function Consent({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="page">
      <h1 className="big">NAR’a hoş geldin</h1>
      <p>NAR, paketli gıda etiketlerini alerji profiline göre okur.</p>
      <div className="card">
        <strong>Verilerin sende kalır</strong>
        <p className="small muted">Alerji ve tercih seçimlerin sağlık bilgisi sayılabilir. Bunları yalnızca bu cihazda saklıyoruz; sunucuya göndermiyoruz. İstediğin zaman Profilim › Gizlilik’ten silebilirsin.</p>
      </div>
      <p className="note" style={{ marginTop: 12 }}>NAR bilgilendirme amaçlıdır; tıbbi tavsiye değildir. Ciddi alerjilerde ambalajı ve doktorunu esas al.</p>
      <button className="btn" style={{ marginTop: 14 }} onClick={onAccept}>Anladım, devam et</button>
    </div>
  )
}
