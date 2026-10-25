import { ALLERGIES, PREFERENCES, type AllergyKey, type PreferenceKey, type Profile } from '../engine'

interface Props {
  profile: Profile
  onChange: (p: Profile) => void
  onboarding?: boolean
  onDone?: () => void
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

export default function ProfileScreen({ profile, onChange, onboarding, onDone }: Props) {
  return (
    <section className="page">
      <h1>{onboarding ? 'NAR’a hoş geldin' : 'Profilim'}</h1>
      <p className="muted">
        Alerjilerini ve tercihlerini seç; sonuçlar buna göre gösterilir. Bu bilgiler yalnızca bu cihazda saklanır, sunucuya gönderilmez.
      </p>

      <h2>Alerji / intolerans</h2>
      <div className="chips">
        {(Object.keys(ALLERGIES) as AllergyKey[]).map((k) => (
          <button
            key={k}
            className={'chip' + (profile.allergies.includes(k) ? ' on' : '')}
            onClick={() => onChange({ ...profile, allergies: toggle(profile.allergies, k) })}
          >
            {ALLERGIES[k]}
          </button>
        ))}
      </div>

      <h2>Tercihler</h2>
      <div className="chips">
        {(Object.keys(PREFERENCES) as PreferenceKey[]).map((k) => (
          <button
            key={k}
            className={'chip' + (profile.preferences.includes(k) ? ' on' : '')}
            onClick={() => onChange({ ...profile, preferences: toggle(profile.preferences, k) })}
          >
            {PREFERENCES[k]}
          </button>
        ))}
      </div>

      <p className="note">
        NAR bilgilendirme amaçlıdır; tıbbi tavsiye değildir. Ciddi alerjilerde ürün ambalajını ve doktorunu esas al.
      </p>

      {onboarding && (
        <button className="primary" onClick={onDone}>
          Devam et
        </button>
      )}
    </section>
  )
}
