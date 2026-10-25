// YER TUTUCU: gerçek E-kod verisi (272 satırlık tablo) JSON'a çevrilince burası değişecek.
// Risk/açıklama alanları bilerek boş: doğrulanmamış bilgi göstermiyoruz.
export interface ECode {
  code: string
  name: string
  category?: string
  compExp?: string // bileşen açıklaması (halk dili)
  academicExp?: string
  riskWarn?: string
  riskValue?: string
}

export const ecodes: ECode[] = [
  { code: 'E300', name: 'Askorbik asit' },
  { code: 'E330', name: 'Sitrik asit' },
  { code: 'E322', name: 'Lesitin' },
  { code: 'E202', name: 'Potasyum sorbat' },
  { code: 'E211', name: 'Sodyum benzoat' }
]
