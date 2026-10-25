import { useState } from 'react'
import { useLocal } from './lib/storage'
import type { Profile } from './engine'
import ProfileScreen from './screens/ProfileScreen'
import ProductsScreen from './screens/ProductsScreen'
import ECodesScreen from './screens/ECodesScreen'
import FavoritesScreen from './screens/FavoritesScreen'
import logo from './assets/logo.png'

type Tab = 'products' | 'ecodes' | 'favorites' | 'profile'
const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Ürünler' },
  { id: 'ecodes', label: 'E-kodlar' },
  { id: 'favorites', label: 'Favoriler' },
  { id: 'profile', label: 'Profilim' }
]

export default function App() {
  const [profile, setProfile] = useLocal<Profile>('nar.profile', { allergies: [], preferences: [] })
  const [onboarded, setOnboarded] = useLocal<boolean>('nar.onboarded', false)
  const [favorites, setFavorites] = useLocal<string[]>('nar.favorites', [])
  const [tab, setTab] = useState<Tab>('products')

  const toggleFav = (id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  if (!onboarded) {
    return (
      <div className="shell">
        <ProfileScreen profile={profile} onChange={setProfile} onboarding onDone={() => { setOnboarded(true); setTab('products') }} />
      </div>
    )
  }

  return (
    <div className="shell">
      <header className="top">
        <img src={logo} alt="NAR" />
        <span>NAR</span>
        <span className="demo-pill">DEMO VERİ</span>
      </header>
      <main>
        {tab === 'products' && <ProductsScreen profile={profile} favorites={favorites} onToggleFav={toggleFav} />}
        {tab === 'ecodes' && <ECodesScreen />}
        {tab === 'favorites' && <FavoritesScreen profile={profile} favorites={favorites} onToggleFav={toggleFav} />}
        {tab === 'profile' && <ProfileScreen profile={profile} onChange={setProfile} />}
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
