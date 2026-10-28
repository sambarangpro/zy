import type { FabricOption, GarmentColorParts, GarmentType, PrintSizeCategory, ViewSide, PrintZone } from '../types'
export type { PrintZone }

export interface GarmentDef {
  id: GarmentType
  name: string
  subtitle: string
  description: string
  iconName: string
  defaultColors: GarmentColorParts
  supportedParts: Array<keyof GarmentColorParts>
  minOrder: number
  basePrice: number
}

export const GARMENTS: GarmentDef[] = [
  {
    id: 'pdh',
    name: 'PDH / PDL Workwear',
    subtitle: 'Pakaian Dinas Harian, Tactical & Organisasi',
    description: 'Kemeja seragam resmi berkerah dengan lidah pundak (epaulet), 2 saku dada bertutup flap, dan tempat pulpen.',
    iconName: 'badge',
    basePrice: 165000,
    defaultColors: {
      body: '#1e293b',    // Navy
      collar: '#1e293b',
      sleeves: '#1e293b',
      pocket: '#1e293b',
      accent: '#cbd5e1',  // Silver buttons / list
    },
    supportedParts: ['body', 'collar', 'sleeves', 'pocket', 'accent'],
    minOrder: 12,
  },
  {
    id: 'kaos',
    name: 'Kaos T-Shirt (Heavyweight)',
    subtitle: 'Combed 24s/30s, Raglan & Event',
    description: 'Kaos katun adem, lembut bergramasi tebal, cocok untuk kaos event, komunitas, merchandise distro.',
    iconName: 'checkroom',
    basePrice: 75000,
    defaultColors: {
      body: '#0a0a0c',    // Hitam pekat ZY
      collar: '#0a0a0c',
      sleeves: '#0a0a0c',
      pocket: '#0a0a0c',
      accent: '#ff5e00',  // ZY Orange
    },
    supportedParts: ['body', 'collar', 'sleeves'],
    minOrder: 12,
  },
  {
    id: 'rompi',
    name: 'Rompi Tactical & Safety',
    subtitle: 'Vest Proyek, Komunitas & Lapangan',
    description: 'Rompi serbaguna dengan saku ritsleting ganda, furing dalam, serta pita reflective hi-vis (scotlite) menyala.',
    iconName: 'layers',
    basePrice: 145000,
    defaultColors: {
      body: '#14532d',    // Hijau Army / Botol
      collar: '#14532d',
      sleeves: '#14532d',
      pocket: '#14532d',
      accent: '#eab308',  // Scotlite strip kuning neon
    },
    supportedParts: ['body', 'collar', 'pocket', 'accent'],
    minOrder: 12,
  },
  {
    id: 'kemeja',
    name: 'Kemeja Workwear Formal',
    subtitle: 'Work Shirt, Formal & Executive',
    description: 'Kemeja kerja modern potong rapi berkerah tegak dengan satu saku dada tersembunyi, cocok untuk seragam kantor harian.',
    iconName: 'dry_cleaning',
    basePrice: 135000,
    defaultColors: {
      body: '#1e3a8a',    // Biru Formal
      collar: '#0f172a',  // Kerah kontras
      sleeves: '#1e3a8a',
      pocket: '#1e3a8a',
      accent: '#ffffff',
    },
    supportedParts: ['body', 'collar', 'sleeves', 'pocket', 'accent'],
    minOrder: 12,
  },
  {
    id: 'polo',
    name: 'Polo Shirt Wangki',
    subtitle: 'Kaos Berkerah Formal-Kasual',
    description: 'Polo shirt dengan kerah rajut rib, plaket kancing depan, dan manset lengan. Memberikan kesan rapi dan sporty.',
    iconName: 'apparel',
    basePrice: 95000,
    defaultColors: {
      body: '#7f1d1d',    // Maroon
      collar: '#0f172a',  // Kerah kontras
      sleeves: '#7f1d1d',
      pocket: '#7f1d1d',
      accent: '#f8fafc',  // Garis rib putih
    },
    supportedParts: ['body', 'collar', 'sleeves', 'accent'],
    minOrder: 12,
  },
  {
    id: 'jaket',
    name: 'Jaket Bomber / Tactical',
    subtitle: 'Outerwear Komunitas & Angkatan',
    description: 'Jaket tahan angin dengan furing tebal lembut, ritsleting metal kokoh, dan rib elastis di pergelangan tangan.',
    iconName: 'outerwear',
    basePrice: 185000,
    defaultColors: {
      body: '#334155',    // Charcoal
      collar: '#0f172a',
      sleeves: '#334155',
      pocket: '#334155',
      accent: '#ff5e00',
    },
    supportedParts: ['body', 'collar', 'sleeves', 'accent'],
    minOrder: 12,
  },
  {
    id: 'hoodie',
    name: 'Hoodie Jumper / Zipper',
    subtitle: 'Streetwear & Sweater Hangat',
    description: 'Sweater bertudung hangat dengan saku kangguru ikonik dan tali serut tebal, nyaman untuk cuaca dingin.',
    iconName: 'hoodie',
    basePrice: 175000,
    defaultColors: {
      body: '#0f172a',
      collar: '#0f172a',
      sleeves: '#0f172a',
      pocket: '#0f172a',
      accent: '#ff5e00',
    },
    supportedParts: ['body', 'collar', 'sleeves', 'pocket', 'accent'],
    minOrder: 12,
  },
]

export const FABRICS: FabricOption[] = [
  // PDH & Kemeja
  {
    id: 'american-drill',
    name: 'American Drill 1919 (Original)',
    description: 'Bahan drill terpopuler untuk PDH/PDL. Tekstur diagonal rapat, tebal, tidak mudah kusut, dan warna tahan lama.',
    category: 'pdh',
    basePrice: 165000,
    recommendedFor: 'PDH Kampus, Kemeja Ormas, Karyawan',
    badge: 'Paling Populer',
  },
  {
    id: 'japan-drill',
    name: 'Japan Drill (Nagata / Verlando)',
    description: 'Kandungan katun lebih banyak, lebih lembut di kulit, adem maksimal saat siang hari, dan tidak berbulu.',
    category: 'pdh',
    basePrice: 185000,
    recommendedFor: 'Seragam Instansi BUMN, PDH Premium',
    badge: 'Kualitas Tinggi',
  },
  {
    id: 'taipan-tropical',
    name: 'Taipan Tropical Original',
    description: 'Serat halus berkelas, sangat dingin dan jatuh di badan. Pilihan utama untuk kemeja kantor direksi.',
    category: 'kemeja',
    basePrice: 175000,
    recommendedFor: 'Kemeja Kantor Eksekutif, Hotel & RS',
    badge: 'Premium Soft',
  },
  {
    id: 'ripstop-drill',
    name: 'Ripstop Drill Kotak Tactical',
    description: 'Bahan anyaman kotak nilon tahan sobekan ranting/gesekan ekstrem. Standar PDL militer & pecinta alam.',
    category: 'pdh',
    basePrice: 170000,
    recommendedFor: 'PDL Lapangan, Relawan, Tim SAR',
    badge: 'Heavy Duty',
  },

  // Kaos
  {
    id: 'combed-30s',
    name: 'Cotton Combed 30s Reaktif',
    description: '100% serat katun alami, gramasi ringan adem menyerap keringat. Standar kaos distro internasional.',
    category: 'kaos',
    basePrice: 75000,
    recommendedFor: 'Kaos Event, Komunitas, Merchandise',
    badge: 'Best Seller',
  },
  {
    id: 'combed-24s',
    name: 'Cotton Combed 24s Heavyweight',
    description: 'Sedikit lebih tebal dan kokoh dari 30s. Tidak menerawang sama sekali, awet dicuci berulang kali.',
    category: 'kaos',
    basePrice: 85000,
    recommendedFor: 'Kaos Seragam Kerja Kasual, Distro Tebal',
    badge: 'Heavyweight',
  },
  {
    id: 'cotton-bamboo',
    name: 'Cotton Bamboo (Katun Bambu) 30s',
    description: 'Serat bambu alami anti-bakteri, super lembut sejuk luar biasa di cuaca panas. Sangat higienis.',
    category: 'kaos',
    basePrice: 95000,
    recommendedFor: 'Brand Premium, Kaos Olahraga Halus',
    badge: 'Eco Premium',
  },

  // Rompi
  {
    id: 'taslan-waterproof',
    name: 'Taslan Milky Waterproof + Furing Jala',
    description: 'Bahan tahan percikan air (water repellent) dilapisi furing jala breatheable. Tahan angin dan ringan.',
    category: 'rompi',
    basePrice: 145000,
    recommendedFor: 'Rompi Touring, Lapangan, Event Outdoor',
    badge: 'Water Repellent',
  },
  {
    id: 'drill-rompi',
    name: 'American Drill + Furing Katun Kotak',
    description: 'Kain drill kokoh berstruktur rapi, banyak saku fungsional untuk perkakas teknisi & supervisor proyek.',
    category: 'rompi',
    basePrice: 140000,
    recommendedFor: 'Rompi K3 Tambang, Teknisi, Proyek',
    badge: 'Tangguh',
  },

  // Polo
  {
    id: 'lacoste-cvc',
    name: 'Lacoste CVC 24s Pique',
    description: 'Rajutan pori sarang lebah (pique) kombinasi katun & poliester. Tidak mudah susut dan adem di badan.',
    category: 'polo',
    basePrice: 95000,
    recommendedFor: 'Seragam Toko, Sales, Event Semi-Formal',
    badge: 'Paling Laris',
  },
  {
    id: 'lacoste-cotton',
    name: 'Lacoste 100% Pique Cotton',
    description: 'Pique katun murni super lembut, berbobot, dan sangat menyerap keringat. Standar polo brand terkenal.',
    category: 'polo',
    basePrice: 115000,
    recommendedFor: 'Executive Polo, Gathering Eksklusif',
    badge: 'Luxury',
  },

  // Jaket & Hoodie
  {
    id: 'taslan-jaket',
    name: 'Taslan JN + Furing Quilting Dacron',
    description: 'Jaket bomber dengan lapisan dakron hangat dan furing parasut. Nyaman dipakai berkendara malam.',
    category: 'jaket',
    basePrice: 185000,
    recommendedFor: 'Jaket Bomber Komunitas, Touring',
    badge: 'Hangat & Tebal',
  },
  {
    id: 'fleece-cotton',
    name: 'Fleece Cotton 280 GSM',
    description: 'Kain rajut berbulu lembut di bagian dalam, sangat hangat, tebal, dan nyaman dipakai harian.',
    category: 'hoodie',
    basePrice: 175000,
    recommendedFor: 'Hoodie Komunitas, Jaket Kelas, Streetwear',
    badge: 'Super Cozy',
  },
]

export const COLOR_PALETTE = [
  { name: 'Hitam Pekat ZY', hex: '#0a0a0c' },
  { name: 'Putih Bersih', hex: '#f8fafc' },
  { name: 'ZY Orange Icon', hex: '#ff5e00' },
  { name: 'Biru Dongker / Navy', hex: '#1e293b' },
  { name: 'Merah Maroon', hex: '#7f1d1d' },
  { name: 'Hijau Army / Lumut', hex: '#365314' },
  { name: 'Khaki / Pemda / Gurun', hex: '#bfa07a' },
  { name: 'Krem Muda', hex: '#e2d4c0' },
  { name: 'Abu-abu Tua (Charcoal)', hex: '#334155' },
  { name: 'Abu-abu Muda (Silver)', hex: '#94a3b8' },
  { name: 'Biru Benhur (BCA)', hex: '#1d4ed8' },
  { name: 'Biru Turkish', hex: '#0284c7' },
  { name: 'Hijau Botol Tua', hex: '#14532d' },
  { name: 'Hijau Tosca', hex: '#0f766e' },
  { name: 'Kuning Kunyit / Mustard', hex: '#ca8a04' },
  { name: 'Oranye K3 / Safety', hex: '#ea580c' },
]

// Preset Posisi Cepat untuk 4 Sudut Pandang
export const POSITION_PRESETS: Array<{
  id: string
  label: string
  side: ViewSide
  x: number
  y: number
  scale: number
}> = [
  // Tampak Depan
  { id: 'left_chest', label: 'Dada Kiri (Logo)', side: 'front', x: 68, y: 32, scale: 0.55 },
  { id: 'right_chest', label: 'Dada Kanan (Nama)', side: 'front', x: 32, y: 32, scale: 0.55 },
  { id: 'center_chest', label: 'Dada Tengah (A4/A3)', side: 'front', x: 50, y: 40, scale: 1.1 },
  { id: 'lower_belly', label: 'Perut / Bawah', side: 'front', x: 50, y: 65, scale: 0.8 },

  // Tampak Belakang
  { id: 'center_back', label: 'Punggung Tengah (Besar A3)', side: 'back', x: 50, y: 42, scale: 1.3 },
  { id: 'upper_back', label: 'Punggung Atas (Tulisan)', side: 'back', x: 50, y: 26, scale: 0.8 },
  { id: 'neck_back', label: 'Tengkuk Leher Belakang', side: 'back', x: 50, y: 16, scale: 0.4 },

  // Tampak Sisi Kiri
  { id: 'left_sleeve_center', label: 'Lengan Kiri Tengah', side: 'left', x: 50, y: 40, scale: 0.6 },
  { id: 'left_sleeve_patch', label: 'Patch Bendera Lengan Kiri', side: 'left', x: 50, y: 28, scale: 0.5 },

  // Tampak Sisi Kanan
  { id: 'right_sleeve_center', label: 'Lengan Kanan Tengah', side: 'right', x: 50, y: 40, scale: 0.6 },
  { id: 'right_sleeve_patch', label: 'Patch Lambang Lengan Kanan', side: 'right', x: 50, y: 28, scale: 0.5 },
]

// Definisi Garis Panduan Area Sablon Aman (Print Safe Zones Standar)
export const PRINT_ZONES: PrintZone[] = [
  // Tampak Depan
  { id: 'z_left_chest', name: 'Dada Kiri (10×10cm)', x: 68, y: 32, width: 20, height: 18, side: 'front', price: 15000, maxSizeCm: '10×10 cm', rotationX: 0, rotationY: 0, rotationZ: 0, enableAutoClipping: true },
  { id: 'z_right_chest', name: 'Dada Kanan (10×10cm)', x: 32, y: 32, width: 20, height: 18, side: 'front', price: 15000, maxSizeCm: '10×10 cm', rotationX: 0, rotationY: 0, rotationZ: 0, enableAutoClipping: true },
  { id: 'z_front_a3', name: 'Area Cetak Depan Maks (A3)', x: 50, y: 45, width: 52, height: 58, side: 'front', price: 35000, maxSizeCm: 'A3 (30×42 cm)', rotationX: 0, rotationY: 0, rotationZ: 0, enableAutoClipping: true },
  { id: 'z_front_sleeve_right', name: 'Bahu / Lengan Kanan (Menyamping)', x: 23, y: 34, width: 14, height: 20, side: 'front', price: 15000, maxSizeCm: '8×8 cm', rotationX: 0, rotationY: 35, rotationZ: 0, enableAutoClipping: true, description: 'Sinkron otomatis ke Tampak Kanan & Belakang' },
  { id: 'z_front_sleeve_left', name: 'Bahu / Lengan Kiri (Menyamping)', x: 77, y: 34, width: 14, height: 20, side: 'front', price: 15000, maxSizeCm: '8×8 cm', rotationX: 0, rotationY: -35, rotationZ: 0, enableAutoClipping: true, description: 'Sinkron otomatis ke Tampak Kiri & Belakang' },

  // Tampak Belakang
  { id: 'z_back_a3', name: 'Area Cetak Punggung Maks (A3+)', x: 50, y: 45, width: 54, height: 62, side: 'back', price: 45000, maxSizeCm: 'A3+ (32×48 cm)', rotationX: 0, rotationY: 0, rotationZ: 0, enableAutoClipping: true },
  { id: 'z_neck_back', name: 'Tengkuk Belakang (8×8cm)', x: 50, y: 16, width: 16, height: 12, side: 'back', price: 10000, maxSizeCm: '8×8 cm', rotationX: 0, rotationY: 0, rotationZ: 0, enableAutoClipping: true },
  { id: 'z_back_sleeve_left', name: 'Bahu / Lengan Kiri (Belakang)', x: 23, y: 34, width: 14, height: 20, side: 'back', price: 15000, maxSizeCm: '8×8 cm', rotationX: 0, rotationY: 35, rotationZ: 0, enableAutoClipping: true, description: 'Sinkron otomatis ke Tampak Kiri & Depan' },
  { id: 'z_back_sleeve_right', name: 'Bahu / Lengan Kanan (Belakang)', x: 77, y: 34, width: 14, height: 20, side: 'back', price: 15000, maxSizeCm: '8×8 cm', rotationX: 0, rotationY: -35, rotationZ: 0, enableAutoClipping: true, description: 'Sinkron otomatis ke Tampak Kanan & Depan' },

  // Tampak Lengan Kiri & Kanan
  { id: 'z_left_sleeve', name: 'Area Patch Lengan Kiri', x: 50, y: 35, width: 40, height: 40, side: 'left', price: 15000, maxSizeCm: '8×8 cm', rotationX: 0, rotationY: 0, rotationZ: 0, enableAutoClipping: true },
  { id: 'z_right_sleeve', name: 'Area Patch Lengan Kanan', x: 50, y: 35, width: 40, height: 40, side: 'right', price: 15000, maxSizeCm: '8×8 cm', rotationX: 0, rotationY: 0, rotationZ: 0, enableAutoClipping: true },
]

// ZY Clothes Smart Pricing Engine by Graphic Size
export function calculateGraphicPrice(scale: number): {
  sizeCategory: PrintSizeCategory
  price: number
} {
  if (scale <= 0.6) {
    return { sizeCategory: 'Logo Kecil (≤10×10cm)', price: 10000 }
  } else if (scale <= 0.9) {
    return { sizeCategory: 'Sablon A5 (15×21cm)', price: 15000 }
  } else if (scale <= 1.25) {
    return { sizeCategory: 'Sablon A4 (21×30cm)', price: 20000 }
  } else if (scale <= 1.6) {
    return { sizeCategory: 'Sablon A3 (30×42cm)', price: 35000 }
  } else {
    return { sizeCategory: 'Sablon A3+ (32×48cm)', price: 45000 }
  }
}

// Menghitung harga sablon berdasarkan titik panduan yang diatur Owner (atau skala ukuran fisik)
export function getGraphicPriceForZoneOrScale(
  g: { x: number; y: number; side: ViewSide; scale: number },
  printZones?: PrintZone[]
): {
  sizeCategory: string
  price: number
  zoneName?: string
} {
  if (printZones && printZones.length > 0) {
    const matchingZone = printZones.find((z) => {
      if (z.side !== g.side) return false
      const halfW = z.width / 2
      const halfH = z.height / 2
      return (
        g.x >= z.x - halfW &&
        g.x <= z.x + halfW &&
        g.y >= z.y - halfH &&
        g.y <= z.y + halfH
      )
    })
    if (matchingZone && matchingZone.price > 0) {
      return {
        sizeCategory: matchingZone.maxSizeCm
          ? `${matchingZone.name} (${matchingZone.maxSizeCm})`
          : matchingZone.name,
        price: matchingZone.price,
        zoneName: matchingZone.name,
      }
    }
  }
  return calculateGraphicPrice(g.scale)
}

export const SIZE_CHART = {
  kaos: [
    { size: 'S', chest: 48, length: 68, sleeve: 21 },
    { size: 'M', chest: 50, length: 70, sleeve: 22 },
    { size: 'L', chest: 52, length: 72, sleeve: 23 },
    { size: 'XL', chest: 54, length: 74, sleeve: 24 },
    { size: 'XXL', chest: 56, length: 76, sleeve: 25 },
    { size: '3XL', chest: 60, length: 78, sleeve: 26 },
  ],
  pdh: [
    { size: 'S', chest: 50, length: 69, sleeve: 57, shoulder: 44 },
    { size: 'M', chest: 52, length: 71, sleeve: 59, shoulder: 46 },
    { size: 'L', chest: 54, length: 73, sleeve: 61, shoulder: 48 },
    { size: 'XL', chest: 56, length: 75, sleeve: 62, shoulder: 50 },
    { size: 'XXL', chest: 58, length: 77, sleeve: 63, shoulder: 52 },
    { size: '3XL', chest: 62, length: 80, sleeve: 64, shoulder: 54 },
  ],
  rompi: [
    { size: 'S', chest: 50, length: 64 },
    { size: 'M', chest: 53, length: 66 },
    { size: 'L', chest: 56, length: 68 },
    { size: 'XL', chest: 59, length: 70 },
    { size: 'XXL', chest: 62, length: 72 },
    { size: '3XL', chest: 65, length: 74 },
  ],
}
