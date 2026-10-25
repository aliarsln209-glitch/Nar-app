import { useCallback, useEffect, useState } from 'react'
import { useLocal } from './lib/storage'
import type { Profile as ProfileT } from './engine'
import { AppCtx, type View } from './ui/ctx'
import { ICompare, IHistory, ISaved, IScan, IUser } from './ui/Icons'
import Result from './screens/Result'
import Additive from './screens/Additive'
import Search from './screens/Search'
import Scan from './screens/Scan'
import { History, Saved } from './screens/Lists'
import Compare from './screens/Compare'
import Profile from './screens/Profile'
import { About, Consent, NotFound, Privacy } from './screens/Info'

type Tab = 'history' | 'saved' | 'scan' | 'compare' | 'profile'
const TABS: { id: Tab; label: string; icon: (on: boolean) => JSX.Element }[] = [
  { id: 'history', label: 'Geçmiş', icon: () => <IHistory /> },
  { id: 'saved', label: 'Kaydedilenler', icon: (on) => <ISaved fill={on} /> },
  { id: 'scan', label: 'Tara', icon: () => <IScan /> },
  { id: 'compare', label: 'Karşılaştır', icon: () => <ICompare /> },
  { id: 'profile', label: 'Profilim', icon: () => <IUser /> }
]
const EMPTY: ProfileT = { allergies: [], preferences: [] }

export default function App() {
  const [profile, setProfile] = useLocal<ProfileT>('nar.profile', EMPTY)
  const [consent, setConsent] = useLocal<boolean>('nar.consent', false)
  const [history, setHistory] = useLocal<{ id: string; t: number }[]>('nar.history', [])
  const [saved, setSaved] = useLocal<string[]>('nar.saved', [])
  const [compare, setCompare] = useLocal<[string | null, string | null]>('nar.compare', [null, null])
  const [tab, setTab] = useState<Tab>('scan')
  const [stack, setStack] = useState<View[]>([])

  // Android geri tuşu / tarayıcı geri: yığını tek adım geri al
  useEffect(() => {
    const onPop = () => setStack((s) => s.slice(0, -1))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const push = useCallback((v: View) => { history_push(); setStack((s) => [...s, v]) }, [])
  const back = useCallback(() => { if (window.history.state?.nar) window.history.back(); else setStack((s) => s.slice(0, -1)) }, [])
  const addHistory = useCallback((id: string) => setHistory((h) => [{ id, t: Date.now() }, ...h.filter((x) => x.id !== id)].slice(0, 100)), [setHistory])
  const toggleSaved = useCallback((id: string) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [id, ...s])), [setSaved])
  const eraseAll = useCallback(() => { setProfile(EMPTY); setHistory([]); setSaved([]); setCompare([null, null]) }, [setProfile, setHistory, setSaved, setCompare])

  const ctx = { profile, setProfile, history, addHistory, clearHistory: () => setHistory([]), saved, toggleSaved, compare, setCompare, push, back, goTab: (t: string) => { setStack([]); setTab(t as Tab) }, eraseAll }

  if (!consent) return <div className="shell"><Consent onAccept={() => { setConsent(true); setTab('profile') }} /></div>

  const top = stack[stack.length - 1]
  return (
    <AppCtx.Provider value={ctx}>
      <div className="shell">
        {top ? (
          <>
            {top.k === 'result' && <Result key={top.id} id={top.id} />}
            {top.k === 'additive' && <Additive code={top.code} />}
            {top.k === 'search' && <Search pick={top.pick} />}
            {top.k === 'notfound' && <NotFound ean={top.ean} />}
            {top.k === 'privacy' && <Privacy />}
            {top.k === 'about' && <About />}
          </>
        ) : (
          <>
            {tab === 'history' && <History />}
            {tab === 'saved' && <Saved />}
            {tab === 'scan' && <Scan />}
            {tab === 'compare' && <Compare />}
            {tab === 'profile' && <Profile />}
          </>
        )}
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
function history_push() { try { window.history.pushState({ nar: 1 }, '') } catch { /* yok say */ } }
