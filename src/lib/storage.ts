import { useEffect, useState } from 'react'

// Profil ve favoriler yalnızca cihazda (localStorage) tutulur — KVKK: sağlık verisi sunucuya gitmez.
export function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* depolama kapalı olabilir */
    }
  }, [key, v])
  return [v, setV] as const
}

// Kazınmış metinlerde HTML/script kalıntıları olabiliyor; React zaten kaçışlıyor, burada ek olarak etiketleri atıyoruz.
export function cleanText(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
