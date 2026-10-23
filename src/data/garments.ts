import type { FabricOption, GarmentColorParts, GarmentType } from '../types'

export interface GarmentDef {
  id: GarmentType
  name: string
  subtitle: string
  description: string
  iconName: string
  defaultColors: GarmentColorParts
  supportedParts: Array<keyof GarmentColorParts>
  minOrder: number
}

export const GARMENTS: GarmentDef[] = [
  {
    id: 'pdh',
    name: 'Kemeja PDH / PDL',
    subtitle: 'Pakaian Dinas Harian, Tactical & Organisasi',
    description: 'Kemeja seragam resmi berkerah dengan lidah pundak (epaulet), 2 saku dada bertutup flap, dan tempat pulpen.',
    iconName: 'Shirt',
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
    name: 'Kaos Sablon / Oblong',
    subtitle: 'T-Shirt Combed, Raglan & Event',
    description: 'Kaos katun adem, lembut, cocok untuk kaos event, komunitas, merchandise kampus, atau seragam kasual.',
    iconName: 'Sparkles',
    defaultColors: {
      body: '#0f172a',    // Hitam pekat
      collar: '#0f172a',
      sleeves: '#0f172a',
      pocket: '#0f172a',
      accent: '#ef4444',
    },
    supportedParts: ['body', 'collar', 'sleeves'],
    minOrder: 12,
  },
  {
    id: 'rompi',
    name: 'Rompi Lapangan / Safety',
    subtitle: 'Vest Proyek, Komunitas & Lapangan',
    description: 'Rompi serbaguna dengan saku ritsleting ganda, furing dalam, serta pita reflective hi-vis (scotlite) menyala.',
    iconName: 'Shield',
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
    name: 'Kemeja Kantor / Kasual',
    subtitle: 'Work Shirt, Formal & Executive',
    description: 'Kemeja kerja modern potong rapi berkerah tegak dengan satu saku dada tersembunyi, cocok untuk seragam kantor harian.',
    iconName: 'Briefcase',
    defaultColors: {
      body: '#3b82f6',    // Biru Muda / Royal
      collar: '#1e293b',  // Kerah kontras
      sleeves: '#3b82f6',
      pocket: '#3b82f6',
      accent: '#ffffff',
    },
    supportedParts: ['body', 'collar', 'sleeves', 'pocket', 'accent'],
    minOrder: 12,
  },
  {
    id: 'polo',
    name: 'Polo Shirt (Wangki)',
    subtitle: 'Kaos Berkerah Formal-Kasual',
    description: 'Polo shirt dengan kerah rajut rib, plaket kancing depan, dan manset lengan. Memberikan kesan rapi dan sporty.',
    iconName: 'Award',
    defaultColors: {
      body: '#7f1d1d',    // Maroon
      collar: '#1e293b',  // Kerah kontras Navy
      sleeves: '#7f1d1d',
      pocket: '#7f1d1d',
      accent: '#f8fafc',  // Garis rib putih
    },
    supportedParts: ['body', 'collar', 'sleeves', 'accent'],
    minOrder: 12,
  },
  {
    id: 'jaket',
    name: 'Jaket Bomber / Parka',
    subtitle: 'Outerwear Komunitas & Angkatan',
    description: 'Jaket tahan angin dengan furing tebal lembut, ritsleting metal kokoh, dan rib elastis di pergelangan tangan.',
    iconName: 'Layers',
    defaultColors: {
      body: '#334155',    // Charcoal
      collar: '#0f172a',
      sleeves: '#334155',
      pocket: '#334155',
      accent: '#f59e0b',
    },
    supportedParts: ['body', 'collar', 'sleeves', 'accent'],
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
    basePrice: 95000,
    recommendedFor: 'PDH Kampus, Kemeja Ormas, Karyawan',
    badge: 'Paling Populer',
  },
  {
    id: 'japan-drill',
    name: 'Japan Drill (Nagata / Verlando)',
    description: 'Kandungan katun lebih banyak, lebih lembut di kulit, adem maksimal saat siang hari, dan tidak berbulu.',
    category: 'pdh',
    basePrice: 115000,
    recommendedFor: 'Seragam Instansi BUMN, PDH Premium',
    badge: 'Kualitas Tinggi',
  },
  {
    id: 'taipan-tropical',
    name: 'Taipan Tropical Original',
    description: 'Serat halus berkelas, sangat dingin dan jatuh di badan. Pilihan utama untuk kemeja kantor direksi.',
    category: 'kemeja',
    basePrice: 125000,
    recommendedFor: 'Kemeja Kantor Eksekutif, Hotel & RS',
    badge: 'Premium Soft',
  },
  {
    id: 'ripstop-drill',
    name: 'Ripstop Drill Kotak Tactical',
    description: 'Bahan anyaman kotak nilon tahan sobekan ranting/gesekan ekstrem. Standar PDL militer & pecinta alam.',
    category: 'pdh',
    basePrice: 105000,
    recommendedFor: 'PDL Lapangan, Relawan, Tim SAR',
    badge: 'Heavy Duty',
  },

  // Kaos
  {
    id: 'combed-30s',
    name: 'Cotton Combed 30s Reaktif',
    description: '100% serat katun alami, gramasi ringan adem menyerap keringat. Standar kaos distro internasional.',
    category: 'kaos',
    basePrice: 55000,
    recommendedFor: 'Kaos Event, Komunitas, Merchandise',
    badge: 'Best Seller',
  },
  {
    id: 'combed-24s',
    name: 'Cotton Combed 24s Tebal',
    description: 'Sedikit lebih tebal dan kokoh dari 30s. Tidak menerawang sama sekali, awet dicuci berulang kali.',
    category: 'kaos',
    basePrice: 62000,
    recommendedFor: 'Kaos Seragam Kerja Kasual, Kelas',
    badge: 'Favorit Tebal',
  },
  {
    id: 'cotton-bamboo',
    name: 'Cotton Bamboo (Katun Bambu) 30s',
    description: 'Serat bambu alami anti-bakteri, super lembut sejuk luar biasa di cuaca panas. Sangat higienis.',
    category: 'kaos',
    basePrice: 75000,
    recommendedFor: 'Brand Premium, Kaos Olahraga Halus',
    badge: 'Eco Premium',
  },

  // Rompi
  {
    id: 'taslan-waterproof',
    name: 'Taslan Milky Waterproof + Furing Jala',
    description: 'Bahan tahan percikan air (water repellent) dilapisi furing jala breatheable. Tahan angin dan ringan.',
    category: 'rompi',
    basePrice: 110000,
    recommendedFor: 'Rompi Touring, Lapangan, Event Outdoor',
    badge: 'Water Repellent',
  },
  {
    id: 'drill-rompi',
    name: 'American Drill + Furing Katun Kotak',
    description: 'Kain drill kokoh berstruktur rapi, banyak saku fungsional untuk perkakas teknisi & supervisor proyek.',
    category: 'rompi',
    basePrice: 100000,
    recommendedFor: 'Rompi K3 Tambang, Teknisi, Proyek',
    badge: 'Tangguh',
  },

  // Polo
  {
    id: 'lacoste-cvc',
    name: 'Lacoste CVC 24s Pique',
    description: 'Rajutan pori sarang lebah (pique) kombinasi katun & poliester. Tidak mudah susut dan adem di badan.',
    category: 'polo',
    basePrice: 78000,
    recommendedFor: 'Seragam Toko, Sales, Event Semi-Formal',
    badge: 'Paling Laris',
  },
  {
    id: 'lacoste-cotton',
    name: 'Lacoste 100% Pique Cotton',
    description: 'Pique katun murni super lembut, berbobot, dan sangat menyerap keringat. Standar polo brand terkenal.',
    category: 'polo',
    basePrice: 92000,
    recommendedFor: 'Executive Polo, Gathering Eksklusif',
    badge: 'Luxury',
  },

  // Jaket
  {
    id: 'taslan-jaket',
    name: 'Taslan JN + Furing Quilting Dacron',
    description: 'Jaket bomber dengan lapisan dakron hangat dan furing parasut. Nyaman dipakai berkendara malam.',
    category: 'jaket',
    basePrice: 145000,
    recommendedFor: 'Jaket Bomber Komunitas, Touring',
    badge: 'Hangat & Tebal',
  },
]

export const COLOR_PALETTE = [
  { name: 'Hitam Pekat', hex: '#0f172a' },
  { name: 'Putih Bersih', hex: '#f8fafc' },
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
  { name: 'Merah Cabe', hex: '#dc2626' },
]

export const POSITION_PRESETS = [
  { id: 'left_chest', label: 'Dada Kiri (Logo)', side: 'front' as const, x: 68, y: 32, scale: 0.6 },
  { id: 'right_chest', label: 'Dada Kanan (Nama)', side: 'front' as const, x: 32, y: 32, scale: 0.6 },
  { id: 'center_chest', label: 'Dada Tengah (Besar)', side: 'front' as const, x: 50, y: 40, scale: 1.0 },
  { id: 'left_sleeve', label: 'Lengan Kiri (Bendera/Patch)', side: 'front' as const, x: 88, y: 36, scale: 0.5 },
  { id: 'right_sleeve', label: 'Lengan Kanan', side: 'front' as const, x: 12, y: 36, scale: 0.5 },
  { id: 'center_back', label: 'Punggung Tengah (Besar)', side: 'back' as const, x: 50, y: 40, scale: 1.2 },
  { id: 'upper_back', label: 'Punggung Atas (Tulisan)', side: 'back' as const, x: 50, y: 26, scale: 0.8 },
  { id: 'neck_back', label: 'Tengkuk Belakang', side: 'back' as const, x: 50, y: 16, scale: 0.45 },
]

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
