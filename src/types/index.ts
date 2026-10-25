// 4 Sudut Pandang (Depan, Belakang, Kiri, Kanan)
export type ViewSide = 'front' | 'back' | 'left' | 'right'

export type GarmentType = 'pdh' | 'kaos' | 'rompi' | 'kemeja' | 'polo' | 'jaket' | 'hoodie'

export interface GarmentColorParts {
  body: string
  collar: string
  sleeves: string
  pocket: string
  accent?: string
  [key: string]: string | undefined
}

export interface FabricOption {
  id: string
  name: string
  category: GarmentType
  basePrice: number
  description: string
  tag?: string
  recommendedFor?: string
  badge?: string
}

export type PrintSizeCategory =
  | 'Logo Kecil (≤10×10cm)'
  | 'Sablon A5 (15×21cm)'
  | 'Sablon A4 (21×30cm)'
  | 'Sablon A3 (30×42cm)'
  | 'Sablon A3+ (32×48cm)'

export interface CanvasGraphic {
  id: string
  type: 'image' | 'text'
  side: ViewSide
  content: string // image dataUrl or text string
  x: number // percentage 0-100
  y: number // percentage 0-100
  scale: number // 0.2 to 2.5
  scaleX?: number // for flip horizontal (-1 or 1)
  scaleY?: number // for flip vertical (-1 or 1)
  rotation: number // degrees -180 to 180
  textColor?: string
  fontFamily?: string
  fontSize?: number
  technique: 'sablon' | 'bordir'
  label?: string
  sizeCategory?: PrintSizeCategory
  calculatedPrice?: number
  zIndex?: number
}

export interface StudioLighting {
  brightness: number // -50 to 50
  contrast: number // -50 to 50
  saturation: number // -50 to 50
  shadowDepth: number // 0 to 100 (percentage)
}

// Model Mockup Seragam Custom yang dibuat oleh pengguna di Dashboard
export interface MockupTemplate {
  id: string
  name: string
  category: string // 'Kaos' | 'Kemeja' | 'PDH' | 'Rompi' | 'Polo' | 'Jaket' | dll
  basePrice: number
  description?: string
  frontImg?: string // DataURL or Image URL
  backImg?: string
  leftImg?: string
  rightImg?: string
  discount12?: number // default: 5000
  discount50?: number // default: 10000
  discount100?: number // default: 15000
  createdAt: number
}

export interface SizeBreakdown {
  S: number
  M: number
  L: number
  XL: number
  XXL: number
  '3XL': number
  Custom: number
}

export interface OrderData {
  mockupId: string
  mockupName: string
  sizes: SizeBreakdown
  technique: 'bordir' | 'sablon' | 'kombinasi'
  customerName: string
  customerPhone: string
  customerCompany: string
  customerAddress: string
  targetDate: string
  notes: string
  graphics: CanvasGraphic[]
}

export interface PortfolioItem {
  id: string
  title: string
  client: string
  category: GarmentType | string
  fabric: string
  technique: string
  quantity: number
  imageUrl: string
  rating: number
  description: string
  colors: GarmentColorParts
}
