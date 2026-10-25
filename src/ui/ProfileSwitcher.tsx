import { ALLERGIES } from '../engine'
import { Sheet } from './components'
import { useApp } from './ctx'

export function profileLine(p: { name: string; allergies: string[]; sensitivities: string[] }) {
  const al = p.allergies.map((k) => ((ALLERGIES as Record<string, string>)[k] ?? k).toLocaleLowerCase('tr') + ' alerjisi')
  const parts = [al.length ? (al.length > 2 ? `${al.slice(0, 2).join(', ')} +${al.length - 2}` : al.join(', ')) : 'alerji yok', p.sensitivities.length ? `${p.sensitivities.length} hassasiyet` : null].filter(Boolean)
  return parts.join(', ')
}

export default function ProfileSwitcher({ onClose }: { onClose: () => void }) {
  const { profiles, profile, setActive, goTab } = useApp()
  return (
    <Sheet title="Kimin için bakıyoruz?" onClose={onClose}>
      <ul className="list">
        {profiles.map((p) => (
          <li key={p.id}>
            <button className="prow" aria-pressed={p.id === profile.id} onClick={() => { setActive(p.id); onClose() }} style={p.id === profile.id ? { borderColor: 'var(--green)', borderWidth: 2 } : undefined}>
              <span className="t"><strong>{p.name}{p.child ? ' (çocuk)' : ''}</strong><small>{profileLine(p)}</small></span>
              {p.id === profile.id && <span className="pill clear">Seçili</span>}
            </button>
          </li>
        ))}
      </ul>
      <button className="btn line" style={{ marginTop: 12 }} onClick={() => { onClose(); goTab('profile') }}>Profilleri düzenle / yeni ekle</button>
    </Sheet>
  )
}
