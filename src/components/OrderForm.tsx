import React, { useState } from 'react'
import type {
  CanvasGraphic,
  GarmentColorParts,
  GarmentType,
  SizeBreakdown,
} from '../types'
import { FABRICS, GARMENTS, calculateGraphicPrice } from '../data/garments'
import { MockupSVG } from './MockupSVG'
import confetti from 'canvas-confetti'
import {
  MessageCircle,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Phone,
  MapPin,
  Sparkles,
  Layers,
  Clock,
  Printer,
  Tag,
} from 'lucide-react'

interface OrderFormProps {
  selectedGarment: GarmentType
  onSelectGarment: (type: GarmentType) => void
  colors: GarmentColorParts
  graphics: CanvasGraphic[]
  onOpenInvoiceModal: (orderSummary: any) => void
  onOpenSizeChart: () => void
}

export const OrderForm: React.FC<OrderFormProps> = ({
  selectedGarment,
  onSelectGarment,
  colors,
  graphics,
  onOpenInvoiceModal,
  onOpenSizeChart,
}) => {
  const availableFabrics = FABRICS.filter((f) => f.category === selectedGarment)
  const defaultFabric = availableFabrics[0] || FABRICS[0]

  const [selectedFabricId, setSelectedFabricId] = useState<string>(defaultFabric.id)
  const [technique, setTechnique] = useState<'bordir' | 'sablon' | 'kombinasi'>('sablon')

  // Size distribution
  const [sizes, setSizes] = useState<SizeBreakdown>({
    S: 5,
    M: 10,
    L: 12,
    XL: 8,
    XXL: 2,
    '3XL': 0,
    Custom: 0,
  })

  // Customer information
  const [customerName, setCustomerName] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [logoPositions, setLogoPositions] = useState<string[]>([
    'Dada Kiri (Logo)',
    'Punggung (Sablon Utama)',
  ])

  const adminWhatsApp = '6281234567890'
  const selectedFabric = FABRICS.find((f) => f.id === selectedFabricId) || defaultFabric

  // Calculations
  const totalQuantity =
    sizes.S + sizes.M + sizes.L + sizes.XL + sizes.XXL + sizes['3XL'] + sizes.Custom
  const basePrice = selectedFabric.basePrice

  // Size surcharges (XXL +5k, 3XL +10k, Custom +15k)
  const sizeSurcharge = sizes.XXL * 5000 + sizes['3XL'] * 10000 + sizes.Custom * 15000

  // Smart Print Cost from ZY Clothes engine
  const printCostPerPcs = graphics.length > 0
    ? graphics.reduce((sum, g) => sum + calculateGraphicPrice(g.scale).price, 0)
    : logoPositions.length * 10000
  const totalLogoCost = totalQuantity * printCostPerPcs

  const subtotalBeforeDiscount = totalQuantity * basePrice + sizeSurcharge + totalLogoCost

  // ZY Clothes Tiered Wholesale Discount (Lusinan / Partai)
  let discountPerPcs = 0
  let tierName = 'Satuan (1-11 pcs)'

  if (totalQuantity >= 100) {
    discountPerPcs = 15000
    tierName = 'Grosir Besar (≥100 pcs)'
  } else if (totalQuantity >= 50) {
    discountPerPcs = 10000
    tierName = 'Partai (50-99 pcs)'
  } else if (totalQuantity >= 12) {
    discountPerPcs = 5000
    tierName = 'Lusinan (12-49 pcs)'
  }

  const discountAmount = totalQuantity * discountPerPcs
  const finalTotal = Math.max(0, subtotalBeforeDiscount - discountAmount)
  const pricePerPcsAverage = totalQuantity > 0 ? Math.round(finalTotal / totalQuantity) : 0

  const handleSizeChange = (sizeKey: keyof SizeBreakdown, val: number) => {
    setSizes((prev) => ({
      ...prev,
      [sizeKey]: Math.max(0, val),
    }))
  }

  const handleTogglePosition = (pos: string) => {
    if (logoPositions.includes(pos)) {
      setLogoPositions(logoPositions.filter((p) => p !== pos))
    } else {
      setLogoPositions([...logoPositions, pos])
    }
  }

  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID')
  }

  const getOrderSummary = () => {
    const garmentDef = GARMENTS.find((g) => g.id === selectedGarment)
    return {
      id: 'ZY-' + Date.now().toString().slice(-6),
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      customerName: customerName || 'Pelanggan',
      customerCompany: customerCompany || '-',
      customerPhone: customerPhone || '-',
      customerAddress: customerAddress || '-',
      targetDate: targetDate || '2-3 Minggu Standar',
      garmentName: garmentDef?.name || selectedGarment,
      garmentType: selectedGarment,
      fabricName: selectedFabric.name,
      colors,
      technique:
        technique === 'bordir'
          ? 'Bordir Komputer'
          : technique === 'sablon'
          ? 'Sablon DTF High Quality'
          : 'Kombinasi Bordir & Sablon',
      sizes,
      totalQuantity,
      graphicsCount: graphics.length,
      graphics,
      basePrice,
      subtotalBeforeDiscount,
      discountPerPcs,
      discountAmount,
      finalTotal,
      pricePerPcsAverage,
      specialNotes: specialNotes || '-',
    }
  }

  const handleCheckoutWhatsApp = () => {
    if (totalQuantity < 12) {
      alert('Minimal pemesanan konveksi adalah 12 pcs!')
      return
    }

    if (!customerName || !customerPhone) {
      alert('Mohon lengkapi Nama Pemesan dan Nomor WhatsApp terlebih dahulu.')
      return
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    })

    const summary = getOrderSummary()
    const message = `*PEMESANAN SERAGAM - ZY CLOTHES STUDIO*
-------------------------------------------
*No. SPK:* ${summary.id}
*Tanggal:* ${summary.date}

*DATA PEMESAN:*
• *Nama:* ${summary.customerName}
• *Instansi/Perusahaan:* ${summary.customerCompany}
• *WhatsApp:* ${summary.customerPhone}
• *Alamat Pengiriman:* ${summary.customerAddress}
• *Target Deadline:* ${summary.targetDate}

*SPESIFIKASI PRODUK:*
• *Model Seragam:* ${summary.garmentName}
• *Bahan Kain:* ${summary.fabricName}
• *Teknik Logo:* ${summary.technique}
• *Warna Terpilih:* 
  - Badan: ${summary.colors.body}
  - Kerah: ${summary.colors.collar}
  - Lengan: ${summary.colors.sleeves}
  - Saku: ${summary.colors.pocket}

*DISTRIBUSI UKURAN (${summary.totalQuantity} pcs):*
${sizes.S > 0 ? `• S: ${sizes.S} pcs\n` : ''}${sizes.M > 0 ? `• M: ${sizes.M} pcs\n` : ''}${
      sizes.L > 0 ? `• L: ${sizes.L} pcs\n` : ''
    }${sizes.XL > 0 ? `• XL: ${sizes.XL} pcs\n` : ''}${
      sizes.XXL > 0 ? `• XXL: ${sizes.XXL} pcs\n` : ''
    }${sizes['3XL'] > 0 ? `• 3XL: ${sizes['3XL']} pcs\n` : ''}${
      sizes.Custom > 0 ? `• Custom: ${sizes.Custom} pcs\n` : ''
    }
*CATATAN KHUSUS:*
${summary.specialNotes}

*RINGKASAN BIAYA:*
• Subtotal: ${formatRupiah(summary.subtotalBeforeDiscount)}
${summary.discountAmount > 0 ? `• Potongan Grosir (${tierName}): -${formatRupiah(summary.discountAmount)}\n` : ''}• *TOTAL ESTIMASI:* *${formatRupiah(summary.finalTotal)}* (Rata-rata ~${formatRupiah(summary.pricePerPcsAverage)}/pcs)

_Pesanan dibuat via Aplikasi ZY Clothes Studio. Mohon diproses jadwal produksinya, terima kasih!_`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${adminWhatsApp}?text=${encoded}`, '_blank')
  }

  const handleOpenPrintableSPK = () => {
    const summary = getOrderSummary()
    onOpenInvoiceModal(summary)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ---------------- LEFT: ORDER INPUT FORM (8 cols) ---------------- */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Step 1: Model & Kain */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-black text-[#ff5e00] rounded-xl flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              Spesifikasi Produk & Pilihan Kain
            </h3>
            <span className="text-xs text-[#ff5e00] font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              Kain Grade A Original
            </span>
          </div>

          {/* Garment Selector */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Model Seragam:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GARMENTS.map((g) => {
                const isSelected = g.id === selectedGarment
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onSelectGarment(g.id)
                      const newFabrics = FABRICS.filter((f) => f.category === g.id)
                      if (newFabrics[0]) setSelectedFabricId(newFabrics[0].id)
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#ff5e00] bg-orange-50/50 ring-2 ring-[#ff5e00]/20 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{g.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{g.subtitle}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fabric Radio Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilihan Jenis Kain ({availableFabrics.length} Pilihan):
            </label>
            <div className="space-y-2.5">
              {availableFabrics.map((fabric) => {
                const isSelected = fabric.id === selectedFabricId
                return (
                  <div
                    key={fabric.id}
                    onClick={() => setSelectedFabricId(fabric.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'border-[#ff5e00] bg-orange-50/40 ring-2 ring-[#ff5e00]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#ff5e00] bg-[#ff5e00]' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-black">{fabric.name}</h4>
                          {fabric.badge && (
                            <span className="text-[10px] font-bold bg-black text-[#ff5e00] px-2 py-0.5 rounded-full">
                              {fabric.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {fabric.description}
                        </p>
                        <p className="text-[11px] text-slate-700 font-semibold mt-1">
                          Cocok untuk: {fabric.recommendedFor}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block font-medium">Mulai</span>
                      <span className="font-black text-sm text-black">
                        {formatRupiah(fabric.basePrice)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-medium">/ pcs</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Rincian Ukuran & Diskon Lusinan ZY */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-black text-[#ff5e00] rounded-xl flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              Distribusi Ukuran & Total Jumlah
            </h3>
            <button
              onClick={onOpenSizeChart}
              className="text-xs text-[#ff5e00] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Lihat Size Chart
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-4">
            {(['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Custom'] as const).map((sizeKey) => {
              const extraNote =
                sizeKey === 'XXL'
                  ? '+5rb'
                  : sizeKey === '3XL'
                  ? '+10rb'
                  : sizeKey === 'Custom'
                  ? '+15rb'
                  : 'Std'
              return (
                <div
                  key={sizeKey}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center flex flex-col justify-between"
                >
                  <div className="mb-2">
                    <span className="font-black text-black text-sm block">{sizeKey}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{extraNote}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSizeChange(sizeKey, sizes[sizeKey] - 1)}
                      className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 font-bold text-slate-800 text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={sizes[sizeKey]}
                      onChange={(e) => handleSizeChange(sizeKey, parseInt(e.target.value) || 0)}
                      className="w-10 text-center font-black text-sm bg-transparent border-none focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSizeChange(sizeKey, sizes[sizeKey] + 1)}
                      className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 font-bold text-slate-800 text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ZY Tiered Wholesale Discount Banner */}
          <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff5e00] shrink-0" />
              <span className="text-orange-950 font-medium">
                Total Order: <b className="font-black text-black text-sm">{totalQuantity} pcs</b>
                {' — '}{tierName}
              </span>
            </div>
            {discountPerPcs > 0 && (
              <span className="bg-[#ff5e00] text-white font-black px-2.5 py-1 rounded-full text-[11px] shadow-xs">
                Diskon -Rp {discountPerPcs.toLocaleString('id-ID')}/pcs
              </span>
            )}
          </div>
        </div>

        {/* Step 3: Teknik Sablon / Bordir & Titik Penempatan */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-black text-[#ff5e00] rounded-xl flex items-center justify-center text-xs font-bold font-mono">
                3
              </span>
              Teknik Sablon & Bordir
            </h3>
            <span className="text-xs text-slate-400">Teknologi DTF Digital & Bordir Komputer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              {
                id: 'sablon',
                title: 'Sablon DTF / Plastisol',
                desc: 'Full-color gradasi tajam, lentur tidak pecah, standar brand streetwear.',
              },
              {
                id: 'bordir',
                title: 'Bordir Komputer',
                desc: 'Presisi tinggi, benang kuat mengkilap, tahan cuci ratusan kali untuk PDH.',
              },
              {
                id: 'kombinasi',
                title: 'Kombinasi Keduanya',
                desc: 'Logo kecil dibordir di dada/lengan, dan gambar besar di punggung disablon.',
              },
            ].map((tech) => {
              const isSelected = technique === tech.id
              return (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => setTechnique(tech.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#ff5e00] bg-orange-50/50 ring-2 ring-[#ff5e00]/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-extrabold text-sm text-slate-900">{tech.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tech.desc}</p>
                </button>
              )
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Titik Penempatan Logo / Tulisan:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Dada Kiri (Logo Utama)',
                'Dada Kanan (Nama Anggota)',
                'Dada Tengah (Sablon Besar)',
                'Punggung (Sablon Utama)',
                'Lengan Kiri (Bendera Merah Putih)',
                'Lengan Kanan (Patch Komunitas)',
                'Tengkuk Leher Belakang',
              ].map((pos) => {
                const isChecked = logoPositions.includes(pos)
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleTogglePosition(pos)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isChecked
                        ? 'border-black bg-black text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? <CheckCircle2 className="w-3.5 h-3.5 text-[#ff5e00]" /> : '+'}
                    {pos}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step 4: Data Pemesan & Pengiriman */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-black text-[#ff5e00] rounded-xl flex items-center justify-center text-xs font-bold font-mono">
                4
              </span>
              Informasi Pemesan & Alamat Kirim
            </h3>
            <span className="text-xs text-slate-400">Pengiriman Kargo ke Seluruh Indonesia</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nama Pemesan *
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Instansi / Komunitas / Brand
              </label>
              <input
                type="text"
                placeholder="Contoh: PT Telkom Akses / BEM UI"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target Selesai (Deadline Acara)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Alamat Lengkap Pengiriman
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Jl. Dipati Ukur No. 45, Coblong, Kota Bandung, Jawa Barat (40132)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Khusus Penjahit & Sablon:
            </label>
            <input
              type="text"
              placeholder="Contoh: Jahitan stik ganda, saku dalam tersembunyi, bordir benang perak"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
            />
          </div>
        </div>
      </div>

      {/* ---------------- RIGHT: LIVE PRICE & DESIGN PREVIEW SUMMARY (4 cols) ---------------- */}
      <div className="lg:col-span-4 flex flex-col gap-5 sticky top-6">
        {/* Mockup Preview Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <h4 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ff5e00]" />
            Pratinjau Seragam Dipesan
          </h4>

          <div className="aspect-4/3 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 p-2 flex items-center justify-center relative">
            <div className="w-48 h-48 relative pointer-events-none">
              <MockupSVG type={selectedGarment} side="front" colors={colors} />
            </div>
            <span className="absolute bottom-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              Tampak Depan
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span>Warna Badan:</span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300"
                style={{ backgroundColor: colors.body }}
              />
              <span className="font-mono text-[11px] font-bold text-black">{colors.body}</span>
            </div>
          </div>
          {graphics.length > 0 && (
            <p className="text-[11px] text-[#ff5e00] font-bold mt-1">
              ✓ Termasuk {graphics.length} titik sablon/bordir dari Studio Desain
            </p>
          )}
        </div>

        {/* Realtime Pricing Summary Box */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#ff5e00]" />
              Smart Pricing Engine
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded font-mono">
              ZY Live
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 mb-5">
            <div className="flex justify-between">
              <span>Bahan: {selectedFabric.name}</span>
              <span className="font-bold text-slate-900">{formatRupiah(basePrice)}/pcs</span>
            </div>

            <div className="flex justify-between">
              <span>Jumlah Pesanan</span>
              <span className="font-black text-black">{totalQuantity} pcs</span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal Bahan</span>
              <span className="font-bold text-slate-900">
                {formatRupiah(totalQuantity * basePrice)}
              </span>
            </div>

            {sizeSurcharge > 0 && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Tambahan Ukuran Besar (XXL/3XL/Custom)</span>
                <span>+{formatRupiah(sizeSurcharge)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Aplikasi Logo/Sablon ({graphics.length || logoPositions.length} titik)</span>
              <span className="font-bold text-slate-900">+{formatRupiah(totalLogoCost)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-extrabold pt-1 border-t border-slate-100">
                <span>Diskon Grosir ({tierName})</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Grand Total Box */}
          <div className="p-4 bg-black text-white rounded-2xl mb-5">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              TOTAL ESTIMASI AKHIR
            </span>
            <div className="text-2xl font-black text-[#ff5e00] tracking-tight mt-0.5 font-display">
              {formatRupiah(finalTotal)}
            </div>
            <span className="text-[11px] text-slate-300 block mt-1">
              Rata-rata: ~{formatRupiah(pricePerPcsAverage)} / pcs
            </span>
          </div>

          {/* Checkout CTA Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full py-3.5 px-4 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-[#ff5e00]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Kirim Pesanan ke WhatsApp Admin
            </button>

            <button
              onClick={handleOpenPrintableSPK}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              Pratinjau Lembar SPK / Invoice PDF
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Estimasi pengerjaan: 10 - 18 hari kerja
          </div>
        </div>
      </div>
    </div>
  )
}
