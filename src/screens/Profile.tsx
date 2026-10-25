import { ALLERGIES, PREFERENCES, type AllergyKey, type PreferenceKey } from '../engine'
import { useApp } from '../ui/ctx'
import { TopBar } from '../ui/components'

const toggle = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v])

export default function Profile() {
  const { profile, setProfile, push } = useApp()
  return (
    <div>
      <TopBar noBack title="Profilim" />
      <div className="page" style={{ paddingTop: 4 }}>
        <p className="muted" style={{ marginTop: 0 }}>Seçimlerin yalnızca bu cihazda saklanır; sunucuya gönderilmez.</p>
        <h2>Alerji / intolerans</h2>
        <div className="chips">
          {(Object.keys(ALLERGIES) as AllergyKey[]).map((k) => (
            <button key={k} className={'chip allergy' + (profile.allergies.includes(k) ? ' on' : '')} aria-pressed={profile.allergies.includes(k)} onClick={() => setProfile({ ...profile, allergies: toggle(profile.allergies, k) })}>{ALLERGIES[k]}</button>
          ))}
        </div>
        <h2>Tercihler</h2>
        <div className="chips">
          {(Object.keys(PREFERENCES) as PreferenceKey[]).map((k) => (
            <button key={k} className={'chip' + (profile.preferences.includes(k) ? ' on' : '')} aria-pressed={profile.preferences.includes(k)} onClick={() => setProfile({ ...profile, preferences: toggle(profile.preferences, k) })}>{PREFERENCES[k]}</button>
          ))}
        </div>
        <p className="note" style={{ marginTop: 10 }}>Tercih değerlendirmesi (şekersiz, helal vb.) henüz hazır değil; şimdilik yalnızca alerjiler hesaplanıyor.</p>
        <h2>Daha fazla</h2>
        <button className="btn line" onClick={() => push({ k: 'privacy' })}>Gizlilik ve veriler</button>
        <button className="btn line" onClick={() => push({ k: 'about' })}>Hakkında ve kaynaklar</button>
      </div>
    </div>
  )
}
