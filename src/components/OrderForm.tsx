import React, { useState } from 'react'
import type {
  CanvasGraphic,
  GarmentColorParts,
  GarmentType,
  SizeBreakdown,
} from '../types'
import { FABRICS, GARMENTS } from '../data/garments'
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
  // Available fabrics for current garment
  const availableFabrics = FABRICS.filter((f) => f.category === selectedGarment)
  const defaultFabric = availableFabrics[0] || FABRICS[0]

  const [selectedFabricId, setSelectedFabricId] = useState<string>(defaultFabric.id)
  const [technique, setTechnique] = useState<'bordir' | 'sablon' | 'kombinasi'>('bordir')

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
  const [logoPositions, setLogoPositions] = useState<string[]>(['Dada Kiri (Logo)', 'Punggung (Tulisan)'])

  // Admin WhatsApp number for ordering (configurable)
  const adminWhatsApp = '6281234567890'

  const selectedFabric = FABRICS.find((f) => f.id === selectedFabricId) || defaultFabric

  // Calculations
  const totalQuantity =
    sizes.S + sizes.M + sizes.L + sizes.XL + sizes.XXL + sizes['3XL'] + sizes.Custom

  const basePrice = selectedFabric.basePrice

  // Size surcharges (XXL +5k, 3XL +10k, Custom +15k)
  const sizeSurcharge = sizes.XXL * 5000 + sizes['3XL'] * 10000 + sizes.Custom * 15000

  // Technique / Logo spot cost (estimate: each spot around Rp 5.000 - 10.000)
  const spotCount = Math.max(1, graphics.length || logoPositions.length)
  const embroideryOrPrintCostPerPcs = spotCount * 6000
  const totalLogoCost = totalQuantity * embroideryOrPrintCostPerPcs

  const subtotalBeforeDiscount = totalQuantity * basePrice + sizeSurcharge + totalLogoCost

  // Tiered discount calculation
  let discountPercent = 0
  if (totalQuantity >= 100) {
    discountPercent = 12
  } else if (totalQuantity >= 50) {
    discountPercent = 8
  } else if (totalQuantity >= 24) {
    discountPercent = 5
  }

  const discountAmount = Math.round((subtotalBeforeDiscount * discountPercent) / 100)
  const finalTotal = subtotalBeforeDiscount - discountAmount
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
    return 'Rp ' + num.toLocaleString('id-ID')
  }

  // Construct structured order summary object
  const getOrderSummary = () => {
    const garmentDef = GARMENTS.find((g) => g.id === selectedGarment)
    return {
      id: 'SPK-' + Date.now().toString().slice(-6),
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
      discountPercent,
      discountAmount,
      finalTotal,
      pricePerPcsAverage,
      specialNotes: specialNotes || '-',
    }
  }

  // Submit to WhatsApp
  const handleCheckoutWhatsApp = () => {
    if (totalQuantity < 12) {
      alert('Minimal pemesanan seragam konveksi adalah 12 pcs!')
      return
    }

    if (!customerName || !customerPhone) {
      alert('Mohon lengkapi Nama Pemesan dan Nomor WhatsApp terlebih dahulu.')
      return
    }

    // Trigger celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    const summary = getOrderSummary()

    // Format neat WhatsApp text
    const message = `*PEMESANAN SERAGAM KONVEKSI - SERAGAMKU STUDIO*
-------------------------------------------
*No. Referensi:* ${summary.id}
*Tanggal:* ${summary.date}

*DATA PEMESAN:*
• *Nama:* ${summary.customerName}
• *Instansi/Perusahaan:* ${summary.customerCompany}
• *WhatsApp:* ${summary.customerPhone}
• *Alamat Pengiriman:* ${summary.customerAddress}
• *Target Deadline:* ${summary.targetDate}

*SPESIFIKASI SERAGAM:*
• *Jenis Seragam:* ${summary.garmentName}
• *Pilihan Bahan:* ${summary.fabricName}
• *Aplikasi Logo:* ${summary.technique}
• *Detail Warna:* 
  - Badan Utama: ${summary.colors.body}
  - Kerah: ${summary.colors.collar}
  - Lengan: ${summary.colors.sleeves}
  - Saku: ${summary.colors.pocket}

*RINCIAN UKURAN (Total: ${summary.totalQuantity} pcs):*
${sizes.S > 0 ? `• S: ${sizes.S} pcs\n` : ''}${sizes.M > 0 ? `• M: ${sizes.M} pcs\n` : ''}${
      sizes.L > 0 ? `• L: ${sizes.L} pcs\n` : ''
    }${sizes.XL > 0 ? `• XL: ${sizes.XL} pcs\n` : ''}${
      sizes.XXL > 0 ? `• XXL: ${sizes.XXL} pcs\n` : ''
    }${sizes['3XL'] > 0 ? `• 3XL: ${sizes['3XL']} pcs\n` : ''}${
      sizes.Custom > 0 ? `• Custom: ${sizes.Custom} pcs\n` : ''
    }
*CATATAN KHUSUS:*
${summary.specialNotes}

*ESTIMASI BIAYA:*
• Subtotal: ${formatRupiah(summary.subtotalBeforeDiscount)}
${summary.discountPercent > 0 ? `• Diskon Kuantiti (${summary.discountPercent}%): -${formatRupiah(summary.discountAmount)}\n` : ''}• *TOTAL ESTIMASI:* *${formatRupiah(summary.finalTotal)}* (Rata-rata ~${formatRupiah(summary.pricePerPcsAverage)}/pcs)

_Desain seragam dibuat melalui Studio Desain SeragamKu. Mohon diproses invoice & jadwal produksinya, terima kasih!_`

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
        {/* Step 1: Spesifikasi Seragam & Bahan */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              Spesifikasi Produk & Pilihan Kain
            </h3>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full">
              Kualitas Standar Ekspor
            </span>
          </div>

          {/* Garment Selector */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Jenis Seragam:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{g.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{g.subtitle}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fabric Radio Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilihan Jenis Bahan Kain ({availableFabrics.length} Rekomendasi):
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
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{fabric.name}</h4>
                          {fabric.badge && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              {fabric.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {fabric.description}
                        </p>
                        <p className="text-[11px] text-indigo-700 font-medium mt-1">
                          Cocok untuk: {fabric.recommendedFor}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block">Mulai dari</span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {formatRupiah(fabric.basePrice)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/ pcs</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Rincian Ukuran & Jumlah */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              Distribusi Ukuran & Total Jumlah
            </h3>
            <button
              onClick={onOpenSizeChart}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              Lihat Panduan Ukuran (Size Chart)
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
                    <span className="font-extrabold text-slate-800 text-sm block">{sizeKey}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{extraNote}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSizeChange(sizeKey, sizes[sizeKey] - 1)}
                      className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 font-bold text-slate-700 text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={sizes[sizeKey]}
                      onChange={(e) => handleSizeChange(sizeKey, parseInt(e.target.value) || 0)}
                      className="w-10 text-center font-bold text-sm bg-transparent border-none focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSizeChange(sizeKey, sizes[sizeKey] + 1)}
                      className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 font-bold text-slate-700 text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tiered Discount Notification */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-emerald-900 font-medium">
                Total Saat Ini: <b className="text-emerald-950 font-bold text-sm">{totalQuantity} pcs</b>
                {totalQuantity >= 100 && ' — Diskon Grosir Terbesar 12% Aktif!'}
                {totalQuantity >= 50 && totalQuantity < 100 && ' — Diskon Grosir 8% Aktif!'}
                {totalQuantity >= 24 && totalQuantity < 50 && ' — Diskon Grosir 5% Aktif!'}
                {totalQuantity < 24 && ' — Tambah hingga 24 pcs untuk dapat diskon grosir 5%'}
              </span>
            </div>
            {discountPercent > 0 && (
              <span className="bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-full text-[11px] shadow-xs">
                Diskon {discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Step 3: Teknik Aplikasi Sablon & Bordir */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              Teknik Aplikasi Logo & Desain
            </h3>
            <span className="text-xs text-slate-400">Mesin Bordir Komputer Otomatis & Sablon DTF</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              {
                id: 'bordir',
                title: 'Bordir Komputer',
                desc: 'Presisi tinggi, benang kuat mengkilap, tahan cuci ratusan kali. Standar seragam dinas.',
              },
              {
                id: 'sablon',
                title: 'Sablon DTF / Plastisol',
                desc: 'Full-color gradasi halus tanpa batas warna, detail tajam, lentur dan tidak pecah.',
              },
              {
                id: 'kombinasi',
                title: 'Kombinasi Keduanya',
                desc: 'Logo kecil dibordir (dada/lengan), dan gambar besar di punggung disablon.',
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
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-900">{tech.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tech.desc}</p>
                </button>
              )
            })}
          </div>

          {/* Posisi Penempatan Logo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Rencana Titik Penempatan Logo / Sablon:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Dada Kiri (Logo Utama)',
                'Dada Kanan (Nama Anggota)',
                'Dada Tengah (Sablon Besar)',
                'Punggung (Tulisan Besar)',
                'Lengan Kiri (Bendera Merah Putih)',
                'Lengan Kanan (Emblem Komunitas)',
                'Tengkuk Leher Belakang',
              ].map((pos) => {
                const isChecked = logoPositions.includes(pos)
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleTogglePosition(pos)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isChecked
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? <CheckCircle2 className="w-3.5 h-3.5" /> : '+'}
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
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              Informasi Pemesan & Alamat Kirim
            </h3>
            <span className="text-xs text-slate-400">Pengiriman ke seluruh Indonesia</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nama Lengkap Pemesan *
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                No. WhatsApp Aktif *
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Nama Instansi / Komunitas / Kampus
              </label>
              <input
                type="text"
                placeholder="Contoh: BEM Fakultas Teknik / PT Maju Sejahtera"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target Tanggal Selesai (Deadline Acara)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Alamat Lengkap Pengiriman (Kota / Kab / Provinsi)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Jl. Margonda Raya No. 123, Beji, Depok, Jawa Barat (16424)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Khusus Produksi (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Tambah saku tersembunyi di dalam, furing jala tebal, jahitan stik ganda"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ---------------- RIGHT: LIVE PRICE & DESIGN PREVIEW SUMMARY (4 cols) ---------------- */}
      <div className="lg:col-span-4 flex flex-col gap-5 sticky top-6">
        {/* Mockup Preview Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Pratinjau Seragam Dipesan
          </h4>

          <div className="aspect-4/3 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 p-2 flex items-center justify-center relative">
            <div className="w-48 h-48 relative pointer-events-none">
              <MockupSVG type={selectedGarment} side="front" colors={colors} />
            </div>
            <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
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
              <span className="font-mono text-[11px] font-semibold">{colors.body}</span>
            </div>
          </div>
          {graphics.length > 0 && (
            <p className="text-[11px] text-indigo-700 font-medium mt-1">
              ✓ Termasuk {graphics.length} elemen sablon/bordir dari Studio Desain
            </p>
          )}
        </div>

        {/* Realtime Pricing Summary Box */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200">
          <h4 className="font-extrabold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            Ringkasan Estimasi Biaya
          </h4>

          <div className="space-y-2.5 text-xs text-slate-600 mb-5">
            <div className="flex justify-between">
              <span>Bahan: {selectedFabric.name}</span>
              <span className="font-semibold text-slate-800">{formatRupiah(basePrice)}/pcs</span>
            </div>

            <div className="flex justify-between">
              <span>Jumlah Pesanan</span>
              <span className="font-bold text-slate-900">{totalQuantity} pcs</span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal Bahan</span>
              <span className="font-semibold text-slate-800">
                {formatRupiah(totalQuantity * basePrice)}
              </span>
            </div>

            {sizeSurcharge > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Tambahan Ukuran Besar (XXL/3XL/Custom)</span>
                <span>+{formatRupiah(sizeSurcharge)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Aplikasi {technique.toUpperCase()} ({spotCount} titik)</span>
              <span className="font-semibold text-slate-800">+{formatRupiah(totalLogoCost)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                <span>Diskon Grosir ({discountPercent}%)</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl mb-5">
            <span className="text-[11px] text-slate-400 block font-medium">TOTAL ESTIMASI AKHIR</span>
            <div className="text-2xl font-black text-amber-400 tracking-tight mt-0.5">
              {formatRupiah(finalTotal)}
            </div>
            <span className="text-[11px] text-slate-300 block mt-1">
              Rata-rata: ~{formatRupiah(pricePerPcsAverage)} per pcs
            </span>
          </div>

          {/* Checkout CTA Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Kirim Pesanan ke WhatsApp Admin
            </button>

            <button
              onClick={handleOpenPrintableSPK}
              className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 border border-indigo-200 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Pratinjau Surat Perintah Kerja (SPK / Invoice)
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Estimasi pengerjaan: 10 - 18 hari kerja (tergantung antrean)
          </div>
        </div>
      </div>
    </div>
  )
}
