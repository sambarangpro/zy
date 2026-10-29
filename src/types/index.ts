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
  viewPositions?: Partial<Record<ViewSide, { x: number; y: number }>> // independen koordinat per tampak (depan, belakang, samping) agar pergeseran di satu sisi tidak menggeser sisi lain
  scale: number // 0.2 to 2.5
  scaleX?: number // for flip horizontal (-1 or 1)
  scaleY?: number // for flip vertical (-1 or 1)
  rotation: number // degrees -180 to 180 (rotasi 2D / Z-axis)
  rotationX?: number // degrees -85 to 85 (perspektif 3D vertikal / pitch)
  rotationY?: number // degrees -85 to 85 (perspektif Y menyamping 3D / yaw)
  rotationZ?: number // degrees -180 to 180 (alias eksplisit untuk Z-axis)
  enableAutoClipping?: boolean // auto clipping mask mengikuti siluet kain blangko
  textColor?: string
  fontFamily?: string
  fontSize?: number
  technique: 'sablon' | 'bordir'
  label?: string
  sizeCategory?: PrintSizeCategory
  calculatedPrice?: number
  zIndex?: number
  opacity?: number // 0 to 100
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay'
  isLocked?: boolean
}

export interface StudioLighting {
  brightness: number // -50 to 50
  contrast: number // -50 to 50
  saturation: number // -50 to 50
  shadowDepth: number // 0 to 100 (percentage)
}

export interface ColorablePart {
  id: string
  name: string // e.g. "Kerah", "Saku Dada", "Kancing", "Garis Kancing", "Badan Utama", "Lengan"
  side: ViewSide // 'front' | 'back' | 'left' | 'right'
  defaultColor: string // Hex code e.g. '#1e293b'
  maskImg?: string // DataURL or image URL of isolated transparent PNG / SVG mask
  groupId?: string // Link across 4 sides (e.g. 'part_group_1', 'kerah', etc.)
  icon?: string // ID icon bagian pakaian (e.g. 'collar', 'pocket', 'buttons', dll.)
}

// Definisi Titik Garis Panduan Area Sablon Aman (Print Safe Zones)
export interface PrintZone {
  id: string
  name: string
  x: number // percentage (0 - 100) center x
  y: number // percentage (0 - 100) center y
  width: number // percentage (0 - 100)
  height: number // percentage (0 - 100)
  side: ViewSide // 'front' | 'back' | 'left' | 'right'
  price: number // Harga sablon / cetak pada titik ini (Rp)
  maxSizeCm?: string // Ukuran fisik misal "10×10 cm", "A4 (21×30 cm)", "A3 (30×42 cm)"
  description?: string
  rotationX?: number // degrees -85 to 85 (kemiringan sudut pandang X vertikal / pitch)
  rotationY?: number // degrees -85 to 85 (kemiringan sudut pandang Y menyamping 3D / yaw)
  rotationZ?: number // degrees -180 to 180 (sudut putar 2D bidang kain / roll)
  enableAutoClipping?: boolean // aktifkan clipping mask otomatis mengikuti siluet kain baju
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
  enableClippingMask?: boolean // metode clipping mask otomatis
  defaultBaseColor?: string // Warna dasar keseluruhan seragam (di bawah semua layer)
  colorParts?: ColorablePart[] // Area / bagian baju yang bisa diganti warnanya secara instan
  printZones?: PrintZone[] // Garis panduan sablon (posisi, ukuran, dan harga tiap titik diatur owner)
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
