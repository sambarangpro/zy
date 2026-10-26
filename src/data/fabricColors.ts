export interface FabricColorSwatch {
  id: string
  code: string // Nomor / Kode Katalog Pabrik (contoh: "ND-114", "AD-010")
  name: string // Nama resmi kain (contoh: "Navy Dongker Standar BUMN")
  hex: string
  catalog: 'drill' | 'tropical' | 'combed' | 'safety'
  catalogName: string
  badge?: string // "Terlaris", "Standar Pemda", "Resmi Dinas", dll.
  description?: string
}

export interface FabricCatalogOption {
  id: string
  name: string
  description: string
  sampleFabrics: string
}

export const FABRIC_CATALOGS: FabricCatalogOption[] = [
  {
    id: 'all',
    name: 'Semua Katalog Kain',
    description: 'Seluruh koleksi warna standar pabrik tekstil resmi',
    sampleFabrics: 'Drill, Tropical, Combed, Safety',
  },
  {
    id: 'drill',
    name: 'Katalog Drill (Nagata & American)',
    description: 'Paling umum untuk Kemeja PDH, PDL, Seragam Kantor, Celana Kargo, Rompi',
    sampleFabrics: 'Nagata Drill, American Drill 1919, Unione, Japan Drill',
  },
  {
    id: 'tropical',
    name: 'Katalog Tropical (Kemeja Formal)',
    description: 'Tekstur halus mewah berpori dingin untuk seragam indoor & instansi',
    sampleFabrics: 'Taipan Tropical, Marygold, Ventura',
  },
  {
    id: 'combed',
    name: 'Katalog Kaos & Polo (Cotton)',
    description: 'Kain rajut katun lembut untuk T-Shirt, Kaos Polo, Hoodie',
    sampleFabrics: 'Cotton Combed 24s/30s, Lacoste CVC Pique',
  },
  {
    id: 'safety',
    name: 'Katalog Safety & Lapangan',
    description: 'Warna mencolok & kontras tinggi untuk tambang, proyek, dan rompi safety',
    sampleFabrics: 'Twill Heavyweight, Drill Hi-Vis',
  },
]

export const FABRIC_COLOR_DATABASE: FabricColorSwatch[] = [
  // --- HITAM & PUTIH DASAR ---
  {
    id: 'fc_010',
    code: '010',
    name: 'Hitam Jet Black',
    hex: '#0a0a0c',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Terlaris',
    description: 'Hitam pekat solid, favorit kemeja tactical & kaos event',
  },
  {
    id: 'fc_001',
    code: '001',
    name: 'Putih Bersih (Pure White)',
    hex: '#ffffff',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Resmi',
    description: 'Putih cerah standar medis, kemeja dinas nakes & sekolah',
  },
  {
    id: 'fc_002',
    code: '002',
    name: 'Putih Tulang / BW (Broken White)',
    hex: '#f5f5ee',
    catalog: 'tropical',
    catalogName: 'Tropical Formal',
    badge: 'Elegan',
    description: 'Putih gading lembut bernuansa mewah',
  },

  // --- BIRU & NAVY DINAS ---
  {
    id: 'fc_114',
    code: '114',
    name: 'Navy Dongker (BUMN & Dinas)',
    hex: '#162238',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Paling Populer',
    description: 'Standar seragam BUMN, Bank, Kemeja PDH korporat & organisasi',
  },
  {
    id: 'fc_118',
    code: '118',
    name: 'Navy Blue Black (Gelap)',
    hex: '#0f1724',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Biru dongker sangat gelap mendekati hitam',
  },
  {
    id: 'fc_208',
    code: '208',
    name: 'Biru Benhur (Royal Blue)',
    hex: '#1d4ed8',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Warna Tegas',
    description: 'Biru royal terang cerah, sering untuk teknisi & pabrik',
  },
  {
    id: 'fc_212',
    code: '212',
    name: 'Biru BCA / Elektrik',
    hex: '#0047bb',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Biru khas seragam perbankan & ekspedisi',
  },
  {
    id: 'fc_202',
    code: '202',
    name: 'Biru Langit (Sky Blue)',
    hex: '#60a5fa',
    catalog: 'tropical',
    catalogName: 'Tropical Formal',
    description: 'Biru muda cerah ramah pandang',
  },
  {
    id: 'fc_216',
    code: '216',
    name: 'Biru Turkis (Cyan)',
    hex: '#0284c7',
    catalog: 'combed',
    catalogName: 'Kaos & Polo',
    description: 'Biru cerah segar untuk kaos olahraga & komunitas',
  },

  // --- ABU-ABU MODERN ---
  {
    id: 'fc_012',
    code: '012',
    name: 'Abu Semen / Mist Muda',
    hex: '#cbd5e1',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Abu-abu terang bersih, netral dan fleksibel untuk kombinasi',
  },
  {
    id: 'fc_014',
    code: '014',
    name: 'Abu Sedang (Medium Grey)',
    hex: '#64748b',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Abu-abu netral elegan untuk kemeja kantor',
  },
  {
    id: 'fc_018',
    code: '018',
    name: 'Abu Tua Charcoal (Dark Grey)',
    hex: '#334155',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Favorit',
    description: 'Abu arang maskulin modern untuk PDL & Rompi lapangan',
  },

  // --- MERAH & MAROON ---
  {
    id: 'fc_308',
    code: '308',
    name: 'Merah Maroon Gelap',
    hex: '#7f1d1d',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Terlaris',
    description: 'Maroon mewah berwibawa, favorit kampus & organisasi mahasiswa',
  },
  {
    id: 'fc_301',
    code: '301',
    name: 'Merah Cabe (Bright Red)',
    hex: '#dc2626',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Merah menyala tegas standar SPBU Pertamina & logistik',
  },
  {
    id: 'fc_312',
    code: '312',
    name: 'Merah Bata (Terracotta)',
    hex: '#b45309',
    catalog: 'tropical',
    catalogName: 'Tropical Formal',
    description: 'Warna tembikar estetik hangat',
  },

  // --- HIJAU ARMY & BOTOL ---
  {
    id: 'fc_401',
    code: '401',
    name: 'Hijau Army / TNI',
    hex: '#3f4f2c',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Tactical',
    description: 'Hijau militer khas seragam lapangan, outdoor, pecinta alam',
  },
  {
    id: 'fc_405',
    code: '405',
    name: 'Hijau Botol (Dark Emerald)',
    hex: '#14532d',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Institusi',
    description: 'Hijau tua wibawa institusi keagamaan & organisasi kemasyarakatan',
  },
  {
    id: 'fc_410',
    code: '410',
    name: 'Hijau Fuji / Daun',
    hex: '#15803d',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Hijau segar cerah standar dinas lingkungan & pertanian',
  },
  {
    id: 'fc_414',
    code: '414',
    name: 'Hijau Tosca Standar',
    hex: '#0f766e',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Hijau tosca elegan khas tenaga kesehatan & puskesmas',
  },

  // --- KHAKI & COKELAT DINAS / PEMDA ---
  {
    id: 'fc_508',
    code: '508',
    name: 'Khaki Pemda / PNS (Cokelat Susu)',
    hex: '#bfa07a',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Standar Pemda',
    description: 'Warna resmi ASN / Pegawai Negeri Sipil hari Senin-Selasa',
  },
  {
    id: 'fc_502',
    code: '502',
    name: 'Krem Khaki Muda (Beige)',
    hex: '#d6c7b2',
    catalog: 'tropical',
    catalogName: 'Tropical Formal',
    description: 'Krem muda cerah bersih untuk PDH instansi',
  },
  {
    id: 'fc_512',
    code: '512',
    name: 'Cokelat Polisi / Safari',
    hex: '#785338',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Cokelat matang tegas untuk security & dinas safari',
  },
  {
    id: 'fc_518',
    code: '518',
    name: 'Cokelat Tua Pramuka',
    hex: '#452b1e',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Resmi',
    description: 'Cokelat pekat standar resmi bawahan & atribut pembina',
  },

  // --- KUNING & GOLD ---
  {
    id: 'fc_605',
    code: '605',
    name: 'Kuning Kenari (Bright Yellow)',
    hex: '#facc15',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    badge: 'Kuning Cerah',
    description: 'Kuning cerah ceria standar kerah variasi & seragam proyek',
  },
  {
    id: 'fc_601',
    code: '601',
    name: 'Kuning Kunyit / Mustard',
    hex: '#ca8a04',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Kuning tua hangat bernuansa retro estetik',
  },
  {
    id: 'fc_608',
    code: '608',
    name: 'Kuning Emas (Gold Accents)',
    hex: '#eab308',
    catalog: 'safety',
    catalogName: 'Safety Lapangan',
    description: 'Kuning emas kontras tinggi untuk variasi list seragam',
  },

  // --- ORANGE & SAFETY ---
  {
    id: 'fc_701',
    code: '701',
    name: 'Orange ZY / Safety Lapangan',
    hex: '#ff5e00',
    catalog: 'safety',
    catalogName: 'Safety Lapangan',
    badge: 'Hi-Vis Safety',
    description: 'Orange menyala standar safety proyek tambang, bengkel, & lapangan',
  },
  {
    id: 'fc_705',
    code: '705',
    name: 'Orange Bata / Rust',
    hex: '#c2410c',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Orange hangat matang cocok untuk restoran & hospitality',
  },

  // --- UNGU & LAINNYA ---
  {
    id: 'fc_801',
    code: '801',
    name: 'Ungu Terong (Deep Purple)',
    hex: '#581c87',
    catalog: 'drill',
    catalogName: 'Drill Standar',
    description: 'Ungu tua eksklusif untuk seragam perhotelan & salon',
  },
  {
    id: 'fc_901',
    code: '901',
    name: 'Pink Magenta (Fanta)',
    hex: '#be185d',
    catalog: 'combed',
    catalogName: 'Kaos & Polo',
    description: 'Merah muda cerah untuk komunitas wanita & event',
  },
]

// Helper untuk mencari swatch terdekat berdasarkan kode HEX
export function findClosestFabricSwatch(hex: string): FabricColorSwatch | undefined {
  if (!hex) return undefined
  const clean = hex.trim().toLowerCase()
  return FABRIC_COLOR_DATABASE.find((s) => s.hex.toLowerCase() === clean)
}
