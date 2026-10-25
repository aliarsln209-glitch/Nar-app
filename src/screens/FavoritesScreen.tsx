import { useState } from 'react'
import { demoProducts, type DemoProduct } from '../engine/mock'
import { cleanText } from '../lib/storage'
import type { Profile } from '../engine'
import ResultView from './ResultView'

interface Props {
  profile: Profile
  favorites: string[]
  onToggleFav: (id: string) => void
}

export default function FavoritesScreen({ profile, favorites, onToggleFav }: Props) {
  const [sel, setSel] = useState<DemoProduct | null>(null)
  const items = demoProducts.filter((p) => favorites.includes(p.id))

  if (sel) {
    return <ResultView item={sel} profile={profile} fav={favorites.includes(sel.id)} onToggleFav={() => onToggleFav(sel.id)} onBack={() => setSel(null)} />
  }
  return (
    <section className="page">
      <h1>Favoriler</h1>
      {items.length === 0 && <p className="muted">Henüz favori yok. Bir ürünün sonuç ekranında ☆ ile ekleyebilirsin.</p>}
      <ul className="list">
        {items.map((p) => (
          <li key={p.id}>
            <button onClick={() => setSel(p)}>
              <strong>{cleanText(p.product.product_name)}</strong>
              <small>{cleanText(p.category)}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
