// Profil anahtarları — AI ekibinin sözleşmesiyle (food_ai_300_soru.json) aynı.
export const ALLERGIES = {
  sut_alerjisi: 'Süt',
  gluten_tahil_alerjisi: 'Gluten / tahıl',
  soya_alerjisi: 'Soya',
  yumurta_alerjisi: 'Yumurta',
  yerfistigi_alerjisi: 'Yerfıstığı',
  sert_kabuklu_meyve_alerjisi: 'Sert kabuklu meyve',
  susam_alerjisi: 'Susam',
  hardal_alerjisi: 'Hardal',
  kereviz_alerjisi: 'Kereviz',
  balik_alerjisi: 'Balık',
  kabuklu_deniz_urunu_alerjisi: 'Kabuklu deniz ürünü',
  yumusakca_alerjisi: 'Yumuşakça',
  aci_bakla_alerjisi: 'Acı bakla',
  kukurt_dioksit_sulfit_intoleransi: 'Kükürt dioksit / sülfit'
} as const

export const PREFERENCES = {
  sekersiz: 'Şekersiz',
  glutensiz: 'Glutensiz',
  organik: 'Organik',
  helal: 'Helal',
  ketojenik: 'Ketojenik'
} as const

export type AllergyKey = keyof typeof ALLERGIES
export type PreferenceKey = keyof typeof PREFERENCES

export interface Profile {
  allergies: AllergyKey[]
  preferences: PreferenceKey[]
}
