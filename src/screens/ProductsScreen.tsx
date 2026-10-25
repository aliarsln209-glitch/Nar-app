import { useMemo, useState } from 'react'
import { demoProducts, type DemoProduct } from '../engine/mock'
import { cleanText } from '../lib/storage'
import type { Profile } from '../engine'
import ResultView from './ResultView'
import barcodes from '../data/barcodes.json'

interface Props {
  profile: Profile
  favorites: string[]
  onToggleFav: (id: string) => void
}

export default function ProductsScreen({ profile, favorites, onToggleFav }: Props) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<DemoProduct | null>(null)

  const list = useMemo(() => {
    const s = q.trim().toLocaleLowerCase('tr')
    const base = s ? demoProducts.filter((p) => cleanText(p.product.product_name).toLocaleLowerCase('tr').includes(s)) : demoProducts
    return base.slice(0, 60)
  }, [q])

  if (sel) {
    return <ResultView item={sel} profile={profile} fav={favorites.includes(sel.id)} onToggleFav={() => onToggleFav(sel.id)} onBack={() => setSel(null)} />
  }

  return (
    <section className="page">
      <h1>Ürünler</h1>
      <input className="search" placeholder="Ürün adı veya barkod ara…" value={q} onChange={(e) => setQ(e.target.value)} />
      {/^\d{8,14}$/.test(q.trim()) && (
        <div className="note">
          {(() => {
            const b = barcodes.find((x) => x.ean === q.trim())
            return b
              ? `Barkod kayıtlı: ${b.name}${b.size ? ' (' + b.size + ')' : ''}. Bu barkod için etiket (içindekiler) verisi henüz bağlı değil.${b.eanValid ? '' : ' Dikkat: barkodun kontrol hanesi tutmuyor, doğrulanmalı.'}`
              : 'Bu barkod kayıtlı değil.'
          })()}
        </div>
      )}
      <ul className="list">
        {list.map((p) => (
          <li key={p.id}>
            <button onClick={() => setSel(p)}>
              <strong>{cleanText(p.product.product_name)}</strong>
              <small>{cleanText(p.category)}</small>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="muted">Sonuç yok.</li>}
      </ul>
    </section>
  )
}
