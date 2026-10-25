import type { ReactNode } from 'react'
import { imgUrl, type Product } from '../data/catalog'
import type { Level } from '../engine/analyze'
import { IBack, IBox } from './Icons'
import { useApp } from './ctx'

export const Thumb = ({ p, big }: { p: Product; big?: boolean }) => {
  const u = imgUrl(p)
  return u ? <img className="thumb" src={u} alt="" loading="lazy" /> : <span className="thumb" style={big ? undefined : undefined}><IBox /></span>
}

export const LEVEL_TEXT: Record<Level, { title: string; pill: string; sub: string }> = {
  danger: { title: 'Dikkat gerektirir', pill: 'Alerjen var', sub: 'Seçtiğin alerjenlerden en az biri bu ürünün etiketinde yer alıyor.' },
  caution: { title: 'Dikkat gerektirir', pill: 'Dikkat', sub: 'Etikette ihtiyati (çapraz bulaşma) ya da kesin sınıflandırılamayan bir ifade var.' },
  clear: { title: 'Çakışma yok', pill: 'Çakışma yok', sub: 'Seçtiğin alerjenler için etikette bildirilmiş bir çakışma bulunamadı. Bu bir güvenlik garantisi değildir; ambalajı yine de kontrol et.' },
  unknown: { title: 'Bilgi yetersiz', pill: 'Bilgi yetersiz', sub: 'Bu ürün için güvenilir etiket bilgisi yok; “çakışma yok” denemez. Ambalajdaki içindekiler listesine bak.' },
  noprofile: { title: 'Profil seçilmedi', pill: 'Profil yok', sub: 'Alerjilerini Profilim sekmesinden seçersen sonuç sana göre hesaplanır.' }
}

export function Pill({ level }: { level: Level }) {
  const cls = level === 'noprofile' ? 'unknown' : level
  return <span className={'pill ' + cls}>{LEVEL_TEXT[level].pill}</span>
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
