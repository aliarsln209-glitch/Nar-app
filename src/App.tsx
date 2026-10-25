import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocal } from './lib/storage'
import type { Profile as ProfileT } from './engine'
import { AppCtx, type Ctx, type View } from './ui/ctx'
import { ICompare, IHistory, ISaved, IScan, IUser } from './ui/Icons'
import Result from './screens/Result'
import Additive from './screens/Additive'
import Search from './screens/Search'
import Scan from './screens/Scan'
import Photo from './screens/Photo'
import ErrorView from './screens/Errors'
import { History, Saved } from './screens/Lists'
import Compare from './screens/Compare'
import Profile, { ProfileEdit } from './screens/Profile'
import { About, Privacy } from './screens/Info'
import AssistantSheet from './ui/Assistant'
import ProfileSwitcher from './ui/ProfileSwitcher'
import type { Product } from './data/catalog'

type Tab = 'history' | 'saved' | 'scan' | 'compare' | 'profile'
const TABS: { id: Tab; label: string; icon: (on: boolean) => JSX.Element }[] = [
  { id: 'history', label: 'Geçmiş', icon: () => <IHistory /> },
  { id: 'saved', label: 'Kaydedilenler', icon: (on) => <ISaved fill={on} /> },
  { id: 'scan', label: 'Tara', icon: () => <IScan /> },
  { id: 'compare', label: 'Karşılaştır', icon: () => <ICompare /> },
  { id: 'profile', label: 'Profilim', icon: () => <IUser /> }
]
const GENERIC: ProfileT = { id: 'genel', name: 'Genel kontrol', allergies: [], sensitivities: [], preferences: [] }
const hpush = () => { try { window.history.pushState({ nar: 1 }, '') } catch { /* yok say */ } }

export default function App() {
  const [profiles, setProfiles] = useLocal<ProfileT[]>('nar.profiles', [])
  const [activeId, setActiveId] = useLocal<string>('nar.active', '')
  const [health, setHealth] = useLocal<boolean>('nar.health', false)
  const [history, setHistory] = useLocal<{ id: string; t: number }[]>('nar.history', [])
  const [saved, setSaved] = useLocal<string[]>('nar.saved', [])
  const [compare, setCompare] = useLocal<[string | null, string | null]>('nar.compare', [null, null])
  const [reports, setReports] = useLocal<{ type: string; t: number; payload: Record<string, unknown> }[]>('nar.reports', [])
  const [tab, setTab] = useState<Tab>('scan')
  const [stack, setStack] = useState<View[]>([])
  const [temp, setTemp] = useState<Product | null>(null)
  const [assist, setAssist] = useState<{ code?: string } | null>(null)
  const [switcher, setSwitcher] = useState(false)
  const [toast, setToast] = useState('')
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  // eski tek profil kaydını taşı
  useEffect(() => {
    try {
      const old = localStorage.getItem('nar.profile')
      if (old && profiles.length === 0) {
        const o = JSON.parse(old) as { allergies?: ProfileT['allergies']; preferences?: ProfileT['preferences'] }
        if (o.allergies?.length || o.preferences?.length) { const id = 'p' + Date.now(); setProfiles([{ id, name: 'Ben', allergies: o.allergies ?? [], sensitivities: [], preferences: o.preferences ?? [] }]); setActiveId(id) }
      }
      localStorage.removeItem('nar.profile')
    } catch { /* yok say */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    const onPop = () => setStack((s) => s.slice(0, -1))
    window.addEventListener('popstate', onPop)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.removeEventListener('popstate', onPop) }
  }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t) }, [toast])

  const profile = profiles.find((p) => p.id === activeId) ?? profiles[0] ?? GENERIC
  const push = useCallback((v: View) => { hpush(); setStack((s) => [...s, v]) }, [])
  const back = useCallback(() => { if (window.history.state?.nar) window.history.back(); else setStack((s) => s.slice(0, -1)) }, [])

  const ctx: Ctx = useMemo(() => ({
    profiles, profile, health, online, temp, setTemp, compare, setCompare, history, saved, push, back,
    setActive: (id) => setActiveId(id),
    saveProfile: (p) => setProfiles((l) => l.map((x) => (x.id === p.id ? p : x))),
    addProfile: (name, child) => { const id = 'p' + Date.now(); setProfiles((l) => [...l, { id, name, child, allergies: [], sensitivities: [], preferences: [] }]); setActiveId(id); return id },
    deleteProfile: (id) => { setProfiles((l) => l.filter((x) => x.id !== id)); if (activeId === id) setActiveId('') },
    grantHealth: () => setHealth(true),
    addHistory: (id) => setHistory((h) => [{ id, t: Date.now() }, ...h.filter((x) => x.id !== id)].slice(0, 100)),
    clearHistory: () => setHistory([]),
    toggleSaved: (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [id, ...s])),
    flagged: Object.fromEntries(reports.filter((r) => r.type === 'wrong').map((r) => [String(r.payload.id), true])),
    report: (type, payload) => { setReports((r) => [...r, { type, t: Date.now(), payload }].slice(-200)); if (type !== 'feedback') setToast('Aldık, teşekkürler') },
    goTab: (t) => { setStack([]); setTab(t as Tab) },
    openAssistant: (code) => setAssist({ code }),
    openProfiles: () => setSwitcher(true),
    eraseAll: () => { setProfiles([]); setActiveId(''); setHealth(false); setHistory([]); setSaved([]); setCompare([null, null]); setReports([]); setTemp(null); setToast('Tüm verilerin silindi') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [profiles, profile, health, online, temp, compare, history, saved, reports, activeId, push, back])

  const top = stack[stack.length - 1]
  return (
    <AppCtx.Provider value={ctx}>
      <div className="shell">
        {top ? (
          <>
            {top.k === 'result' && <Result key={top.id + profile.id} id={top.id} />}
            {top.k === 'additive' && <Additive code={top.code} />}
            {top.k === 'search' && <Search pick={top.pick} fixId={top.fixId} />}
            {top.k === 'error' && <ErrorView kind={top.kind} ean={top.ean} />}
            {top.k === 'photo' && <Photo />}
            {top.k === 'privacy' && <Privacy />}
            {top.k === 'about' && <About />}
            {top.k === 'profileEdit' && <ProfileEdit id={top.id} />}
          </>
        ) : (
          <>
            {tab === 'history' && <History />}
            {tab === 'saved' && <Saved />}
            {tab === 'scan' && !assist && !switcher && <Scan onProfile={() => setSwitcher(true)} onAssistant={() => setAssist({})} />}
            {tab === 'compare' && <Compare />}
            {tab === 'profile' && <Profile />}
          </>
        )}
        {assist && <AssistantSheet code={assist.code} onClose={() => setAssist(null)} />}
        {switcher && <ProfileSwitcher onClose={() => setSwitcher(false)} />}
        {toast && <div className="toast" role="status">{toast}</div>}
        <nav className="tabs" aria-label="Ana gezinme">
          {TABS.map((t) => (
            <button key={t.id} className={(tab === t.id && !top ? 'on ' : '') + (t.id === 'scan' ? 'scan' : '')} aria-current={tab === t.id && !top ? 'page' : undefined} onClick={() => { setStack([]); setTab(t.id) }}>
              {t.id === 'scan' ? <><span className="fab">{t.icon(true)}</span><span className="lbl">{t.label}</span></> : <><span className="ic">{t.icon(tab === t.id && !top)}</span>{t.label}</>}
            </button>
          ))}
        </nav>
      </div>
    </AppCtx.Provider>
  )
}
