// Analiz motoru sözleşmesi. AI ekibinin API'siyle aynı şekle oturması hedeflenir (food_ai_300_soru.json'dan türetildi).
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

export type Status =
  | 'contains'
  | 'may_contain'
  | 'insufficient_data'
  | 'criterion_met'
  | 'not_suitable'
  | 'uncertain'
  | 'not_evaluated' // yalnızca demo motor: test setinde bu ürün/kriter için kayıt yok

export interface Product {
  product_name: string
  ingredients?: string
  allergen_statement?: string
  claims?: string
  nutrition?: Record<string, unknown>
  ingredients_complete?: boolean
  nutrition_facts?: string
}

export interface CriterionResult {
  key: string // "allergy:sut_alerjisi" | "preference:glutensiz"
  status: Status
  calculationValue?: number | null
}

export interface AnalysisResult {
  results: CriterionResult[]
  source: 'demo' | 'api'
}

export interface Engine {
  analyze(input: { productId: string; product: Product; profile: Profile }): Promise<AnalysisResult>
}
