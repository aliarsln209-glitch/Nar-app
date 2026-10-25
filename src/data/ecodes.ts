export interface ECode {
  code: string
  name: string
  tags: string[]
  compExp: string // halk dili açıklama
  academicExp: string
  riskHalk: string
  riskBilimsel: string
  riskValue: string
  notSuitable: string // serbest metin; yapılandırılmış durum etiketi YOK
  sources: string[]
}

// 800 KB'lık veri ana pakete girmesin diye ihtiyaç olunca yüklenir.
export const loadECodes = async (): Promise<ECode[]> => (await import('./ecodes.json')).default as ECode[]
