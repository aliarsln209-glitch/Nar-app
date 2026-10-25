import { PRODUCTS } from '../data/catalog'
import { TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'

export function Privacy() {
  const { eraseAll, back, health, grantHealth } = useApp()
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
        {!health && <div className="card" style={{ marginBottom: 12 }}><strong>Sağlık bilgisi rızası</strong><p className="small muted">Alerji ve hassasiyet seçimleri için açık rızan gerekir (profil düzenlerken de sorulur).</p><button className="btn" onClick={grantHealth}>Onaylıyorum</button></div>}
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
          <li>Ürün etiketleri: üreticilerin etiket bilgisi, Migros web sitesinden derlenmiştir (veri tarihi: 25 Ekim 2026). Katalogda {PRODUCTS.length} ürün var; {v} tanesinin etiketi doğrulandı.</li>
          <li>Alerjen kuralları: v3.1.0 kural seti (14 kategori), TGK etiketleme mevzuatı ve kılavuzlarına dayanır.</li>
          <li>E-kod sözlüğü: 272 katkı maddesi; kaynaklar her kaydın altında.</li>
        </ul>
        <p className="note">Doğrulanmamış etiketler karar için kullanılmaz; bu durumda “Bilgi yetersiz” gösterilir.</p>
      </div>
    </div>
  )
}

