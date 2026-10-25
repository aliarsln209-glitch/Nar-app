import { useEffect, useRef, type ReactNode } from 'react'
import { imgUrl, type Product } from '../data/catalog'
import type { Level } from '../engine/analyze'
import { IBack, IBox, ICheckCircle, IQuestion, ITriangle } from './Icons'
import { useApp } from './ctx'

export const Thumb = ({ p }: { p: Product }) => {
  const u = imgUrl(p)
  return u ? <img className="thumb" src={u} alt="" loading="lazy" /> : <span className="thumb"><IBox /></span>
}

export const LEVEL: Record<Level, { title: string; pill: string; icon: () => JSX.Element }> = {
  clear: { title: 'Profilinle çakışma bulunmadı', pill: 'Çakışma yok', icon: ICheckCircle },
  caution: { title: 'Dikkat gerektirir', pill: 'Dikkat', icon: ITriangle },
  unknown: { title: 'Bilgi yetersiz', pill: 'Bilgi yetersiz', icon: IQuestion },
  noprofile: { title: 'Profilsiz genel kontrol', pill: 'Profil yok', icon: IQuestion }
}

export function Pill({ level, alert }: { level: Level; alert?: boolean }) {
  return <span className={'pill ' + (alert ? 'alert' : level)}>{LEVEL[level].pill}</span>
}

export function TopBar({ title, right, noBack }: { title: string; right?: ReactNode; noBack?: boolean }) {
  const { back } = useApp()
  return (
    <div className="topbar">
      {!noBack && <button className="iconbtn" onClick={back} aria-label="Geri"><IBack /></button>}
      <h1 style={noBack ? { paddingLeft: 8 } : undefined}>{title}</h1>
      {right}
    </div>
  )
}

export function ProductRow({ p, onClick, right }: { p: Product; onClick: () => void; right?: ReactNode }) {
  return (
    <button className="prow" onClick={onClick}>
      <Thumb p={p} />
      <span className="t"><strong>{p.name}</strong><small>{p.size ?? ''}</small></span>
      {right}
    </button>
  )
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); prev?.focus?.() }
  }, [onClose])
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sheethead"><h2>{title}</h2><button className="iconbtn" onClick={onClose} aria-label="Kapat">✕</button></div>
        {children}
      </div>
    </div>
  )
}

export const LEGAL = 'NAR bilgilendirme amaçlıdır; tıbbi tavsiye değildir. Alerjin varsa etiketi ve hekimini esas al.'
