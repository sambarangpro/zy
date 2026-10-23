export type GarmentType = 'kaos' | 'pdh' | 'kemeja' | 'rompi' | 'polo' | 'jaket'

export type ViewSide = 'front' | 'back'

export interface GarmentColorParts {
  body: string
  collar: string
  sleeves: string
  pocket: string
  accent: string // buttons, scotlite, list, ribs
}

export interface CanvasGraphic {
  id: string
  type: 'image' | 'text'
  side: ViewSide
  content: string // image dataUrl or text string
  x: number // percentage 0-100
  y: number // percentage 0-100
  scale: number // 0.2 to 2.5
  rotation: number // degrees -180 to 180
  textColor?: string
  fontFamily?: string
  fontSize?: number
  technique: 'sablon' | 'bordir'
  label?: string
}

export interface FabricOption {
  id: string
  name: string
  description: string
  category: GarmentType
  basePrice: number
  recommendedFor: string
  badge?: string
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
  garmentType: GarmentType
  fabricId: string
  colors: GarmentColorParts
  sizes: SizeBreakdown
  technique: 'bordir' | 'sablon' | 'kombinasi'
  customerName: string
  customerPhone: string
  customerCompany: string
  customerAddress: string
  targetDate: string
  notes: string
  frontPreviewUrl?: string
  backPreviewUrl?: string
  graphics: CanvasGraphic[]
}

export interface PortfolioItem {
  id: string
  title: string
  client: string
  category: GarmentType
  fabric: string
  technique: string
  quantity: number
  imageUrl: string
  colors: GarmentColorParts
  rating: number
  description: string
}
