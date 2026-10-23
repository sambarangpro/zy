import type { PortfolioItem } from '../types'

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'port-1',
    title: 'Kemeja PDH Badan Eksekutif Mahasiswa (BEM)',
    client: 'BEM Universitas Indonesia',
    category: 'pdh',
    fabric: 'American Drill 1919 Original',
    technique: 'Bordir Komputer Presisi 4 Titik',
    quantity: 85,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#1e293b',    // Navy Blue
      collar: '#bfa07a',  // Variasi Kerah Khaki
      sleeves: '#1e293b',
      pocket: '#1e293b',
      accent: '#bfa07a',  // Lidah pundak khaki
    },
    rating: 5,
    description: 'PDH formal dengan kombinasi warna Navy & Khaki. Bordir logo universitas di dada kiri, bendera merah putih di lengan kanan, dan bordir nama di dada kanan.',
  },
  {
    id: 'port-2',
    title: 'Kemeja Tactical Field Engineer',
    client: 'PT Telkom Akses Regional',
    category: 'pdh',
    fabric: 'Japan Drill Nagata (Super Soft & Adem)',
    technique: 'Bordir Timbul 3D & Emblem Velcro',
    quantity: 210,
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#7f1d1d',    // Merah Maroon Telkom
      collar: '#0f172a',  // Kerah Hitam
      sleeves: '#7f1d1d',
      pocket: '#0f172a',  // Saku kombinasi hitam
      accent: '#cbd5e1',
    },
    rating: 5,
    description: 'Seragam lapangan teknisi dengan jahitan bartack penguat di setiap sudut kantong. Tahan cuaca panas dan keringat saat instalasi fiber optik.',
  },
  {
    id: 'port-3',
    title: 'Rompi Safety Lapangan Supervisor Tambang',
    client: 'PT Kaltim Mining Resources',
    category: 'rompi',
    fabric: 'Taslan Waterproof + Double Scotlite 3M',
    technique: 'Bordir Logo Dada & Sablon Reflektif Punggung',
    quantity: 150,
    imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#ea580c',    // Oranye Safety K3
      collar: '#0f172a',
      sleeves: '#ea580c',
      pocket: '#0f172a',
      accent: '#facc15',  // Pita Scotlite Kuning Terang
    },
    rating: 5,
    description: 'Rompi K3 dengan scotchlite reflektif yang berpendar kuat di kegelapan malam. Dilengkapi 6 kompartemen saku radio HT dan dokumen.',
  },
  {
    id: 'port-4',
    title: 'Kaos Family Gathering & Outbound Perusahaan',
    client: 'PT Astra International Tbk',
    category: 'kaos',
    fabric: 'Cotton Combed 24s Pure White',
    technique: 'Sablon DTF High Density Full Color',
    quantity: 320,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#f8fafc',    // Putih
      collar: '#1d4ed8',  // Kerah Rib Biru Astra
      sleeves: '#f8fafc',
      pocket: '#f8fafc',
      accent: '#1d4ed8',
    },
    rating: 5,
    description: 'Kaos outbound lembut sejuk anti-gerah. Cetak sablon full-color di punggung dan dada menggunakan teknologi DTF awet cuci mesin.',
  },
  {
    id: 'port-5',
    title: 'Kemeja Kantor Eksekutif Modern',
    client: 'Bank Syariah Mandiri Prioritas',
    category: 'kemeja',
    fabric: 'Taipan Tropical Silk Cotton',
    technique: 'Bordir Halus Benang Emas Metalik',
    quantity: 60,
    imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#0f766e',    // Hijau Emerald / Tosca Tua
      collar: '#0f766e',
      sleeves: '#0f766e',
      pocket: '#0f766e',
      accent: '#ca8a04',  // Kancing Emas
    },
    rating: 5,
    description: 'Kemeja kantor berpotongan slim-fit dengan kerah kaku tegak. Jahitan stik ganda rapi halus standar butik tailor.',
  },
  {
    id: 'port-6',
    title: 'Polo Shirt Wangki Komunitas Vespa & Otomotif',
    client: 'Indonesian Vespa Club Chapter Jakarta',
    category: 'polo',
    fabric: 'Lacoste Pique CVC 24s Premium',
    technique: 'Bordir Handuk (Chenille) & Bordir Komputer',
    quantity: 90,
    imageUrl: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#365314',    // Hijau Army
      collar: '#0f172a',  // Kerah Hitam Garis Putih
      sleeves: '#365314',
      pocket: '#365314',
      accent: '#f8fafc',
    },
    rating: 5,
    description: 'Polo shirt dengan manset lengan rib dua warna. Nyaman dipakai saat rolling thunder maupun acara santai kopi darat.',
  },
  {
    id: 'port-7',
    title: 'Rompi Relawan & Tanggap Bencana',
    client: 'Palang Merah & Relawan Indonesia',
    category: 'rompi',
    fabric: 'Ripstop Drill Kotak Tahan Air',
    technique: 'Bordir Lambang Palang Merah & Sablon Reflektif',
    quantity: 120,
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#334155',    // Charcoal Abu Tua
      collar: '#dc2626',  // Kerah Merah Kontras
      sleeves: '#334155',
      pocket: '#334155',
      accent: '#dc2626',  // List Scotlite Merah Putih
    },
    rating: 5,
    description: 'Rompi taktis dengan 8 kantong fungsional untuk pertolongan pertama, obat-obatan, dan komunikasi darurat.',
  },
  {
    id: 'port-8',
    title: 'Kaos Komunitas Motor Custom',
    client: 'Black Highway Motorcycle Club',
    category: 'kaos',
    fabric: 'Cotton Combed 20s Heavyweight',
    technique: 'Sablon Manual Discharge & Plastisol Tebal',
    quantity: 180,
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    colors: {
      body: '#0f172a',    // All Black
      collar: '#0f172a',
      sleeves: '#0f172a',
      pocket: '#0f172a',
      accent: '#ca8a04',
    },
    rating: 5,
    description: 'Kaos hitam vintage bergramasi berat (heavyweight 20s) dengan sablon tinta plastisol emas vintage berkarakter kuat.',
  },
]
