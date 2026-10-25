export type GarmentType = 'kaos' | 'pdh' | 'kemeja' | 'rompi' | 'polo' | 'jaket' | 'hoodie'

// 4 Sudut Pandang (Depan, Belakang, Kiri, Kanan)
export type ViewSide = 'front' | 'back' | 'left' | 'right'

export interface GarmentColorParts {
  body: string
  collar: string
  sleeves: string
  pocket: string
  accent: string // buttons, scotlite, list, ribs
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

// Data gambar mockup custom milik pengguna untuk 4 sisi
export interface CustomMockupImages {
  front?: string // dataURL or URL
  back?: string
  left?: string
  right?: string
  blendMode?: 'multiply' | 'source-over' | 'overlay'
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
