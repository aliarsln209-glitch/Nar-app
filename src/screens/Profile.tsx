import { useState } from 'react'
import { ALLERGIES, PREFERENCES, type AllergyKey, type PreferenceKey } from '../engine'
import { SENSITIVITIES, type SensKey } from '../data/sensitivity'
import { TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'
import { profileLine } from '../ui/ProfileSwitcher'
import { IPlus } from '../ui/Icons'

const toggle = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v])

export default function Profile() {
  const { profiles, profile, setActive, addProfile, push, health, grantHealth } = useApp()
  const [name, setName] = useState('')
  const [child, setChild] = useState(false)
  return (
    <div>
      <TopBar noBack title="Profilim" />
      <div className="page" style={{ paddingTop: 4 }}>
        <p className="muted" style={{ marginTop: 0 }}>Profiller yalnızca bu cihazda saklanır; sunucuya gönderilmez.</p>
        <h2>Profiller</h2>
        <ul className="list">
          {profiles.map((p) => (
            <li key={p.id}>
              <div className="prow" style={p.id === profile.id ? { borderColor: 'var(--green)', borderWidth: 2 } : undefined}>
                <button className="t" style={{ all: 'unset', flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={() => setActive(p.id)} aria-pressed={p.id === profile.id}>
                  <strong style={{ display: 'block' }}>{p.name}{p.child ? ' · çocuk profili' : ''}</strong><small className="muted">{profileLine(p)}</small>
                </button>
                <button className="chip" onClick={() => push({ k: 'profileEdit', id: p.id })}>Düzenle</button>
              </div>
            </li>
          ))}
        </ul>
        {profiles.length === 0 && <p className="note">Henüz profil yok; aşağıdan ekle. Profilsiz kullanırsan yalnızca genel kontrol yapılır.</p>}
        <div className="card" style={{ marginTop: 10 }}>
          <strong>Yeni profil</strong>
          <input className="field" placeholder="Ad (örn. Elif)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Profil adı" />
          <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} /> Çocuk profili (veli hesabı altında, yalnızca cihazda)</label>
          <button className="btn" disabled={!name.trim()} onClick={() => { const id = addProfile(name.trim(), child); setName(''); setChild(false); push({ k: 'profileEdit', id }) }}><IPlus /> Profil ekle</button>
        </div>
        <h2>Gizlilik ve bilgi</h2>
        <button className="btn line" onClick={() => push({ k: 'privacy' })}>Gizlilik ve veriler{health ? '' : ' (sağlık bilgisi rızası)'}</button>
        <button className="btn line" onClick={() => push({ k: 'about' })}>Hakkında ve kaynaklar</button>
        <p className="buildid">Sürüm: {__BUILD_ID__} UTC</p>
        {!health && <button hidden onClick={grantHealth} />}
      </div>
    </div>
  )
}

export function ProfileEdit({ id }: { id: string }) {
  const { profiles, saveProfile, deleteProfile, back, health, grantHealth } = useApp()
  const p = profiles.find((x) => x.id === id)
  if (!p) return <div className="page"><TopBar title="Profil" /></div>
  const up = (patch: Partial<typeof p>) => saveProfile({ ...p, ...patch })
  return (
    <div>
      <TopBar title={p.name} />
      <div className="page" style={{ paddingTop: 4 }}>
        {!health && (
          <div className="card">
            <strong>Sağlık bilgisi için açık rıza</strong>
            <p className="small muted">Alerji ve hassasiyet seçimlerin sağlık verisi sayılabilir. Bunlar yalnızca bu cihazda saklanır, sunucuya gönderilmez; istediğin zaman silebilirsin. Sonuçları kişiselleştirmek için bu bilgiyi kullanmamıza izin veriyor musun?</p>
            <button className="btn" onClick={grantHealth}>Onaylıyorum</button>
          </div>
        )}
        <div style={health ? undefined : { opacity: 0.45, pointerEvents: 'none' }} aria-disabled={!health}>
          <h2>Alerji</h2>
          <p className="small muted" style={{ marginTop: -4 }}>Etiketteki alerjen eşleşmelerini kesin uyarı olarak gösterebilmek için sorulur.</p>
          <div className="chips">{(Object.keys(ALLERGIES) as AllergyKey[]).map((k) => <button key={k} className={'chip allergy' + (p.allergies.includes(k) ? ' on' : '')} aria-pressed={p.allergies.includes(k)} onClick={() => up({ allergies: toggle(p.allergies, k) })}>{ALLERGIES[k]}</button>)}</div>
          <h2>Hassasiyet</h2>
          <p className="small muted" style={{ marginTop: -4 }}>Alerjiden ayrı: bazı katkı maddeleri bu durumlarda dikkat gerektirir. Eşleşme, E-kod sözlüğündeki “kimler dikkat etmeli” bilgisine dayanır.</p>
          <div className="chips">{(Object.keys(SENSITIVITIES) as SensKey[]).map((k) => <button key={k} className={'chip' + (p.sensitivities.includes(k) ? ' on' : '')} aria-pressed={p.sensitivities.includes(k)} onClick={() => up({ sensitivities: toggle(p.sensitivities, k) })}>{SENSITIVITIES[k].label}</button>)}</div>
          <h2>Tercihler</h2>
          <div className="chips">{(Object.keys(PREFERENCES) as PreferenceKey[]).map((k) => <button key={k} className={'chip' + (p.preferences.includes(k) ? ' on' : '')} aria-pressed={p.preferences.includes(k)} onClick={() => up({ preferences: toggle(p.preferences, k) })}>{PREFERENCES[k]}</button>)}</div>
          <p className="note" style={{ marginTop: 10 }}>Tercih değerlendirmesi henüz hazır değil; şimdilik alerji ve hassasiyetler hesaplanıyor.</p>
        </div>
        <button className="btn danger" style={{ marginTop: 20 }} onClick={() => { deleteProfile(p.id); back() }}>Bu profili sil</button>
      </div>
    </div>
  )
}
