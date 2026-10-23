import { useState } from 'react'
import type {
  GarmentColorParts,
  GarmentType,
  CanvasGraphic,
} from './types'
import { GARMENTS } from './data/garments'
import { Navbar } from './components/Navbar'
import type { ActiveTab } from './components/Navbar'
import { CanvasCustomizer } from './components/CanvasCustomizer'
import { OrderForm } from './components/OrderForm'
import { Portfolio } from './components/Portfolio'
import { SizeChartModal } from './components/SizeChartModal'
import { InvoiceModal } from './components/InvoiceModal'
import {
  ShieldCheck,
  Truck,
  Sparkles,
  Award,
  Clock,
  CheckCircle,
} from 'lucide-react'

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('canvas')
  const [selectedGarment, setSelectedGarment] = useState<GarmentType>('kaos')
  const [colors, setColors] = useState<GarmentColorParts>(GARMENTS[1].defaultColors)
  const [graphics, setGraphics] = useState<CanvasGraphic[]>([
    {
      id: 'default_flag',
      type: 'image',
      side: 'front',
      content: `data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60"><rect width="90" height="30" fill="#dc2626"/><rect y="30" width="90" height="30" fill="#ffffff"/><rect width="90" height="60" fill="none" stroke="#000000" stroke-width="1.5"/></svg>'
      )}`,
      x: 88,
      y: 36,
      scale: 0.45,
      rotation: 0,
      technique: 'bordir',
      label: 'Bendera Merah Putih (Lengan)',
      sizeCategory: 'Logo Kecil (≤10×10cm)',
      calculatedPrice: 10000,
    },
  ])

  // Modals state
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [invoiceSummary, setInvoiceSummary] = useState<any>(null)

  // When garment changes from selector
  const handleSelectGarment = (type: GarmentType) => {
    setSelectedGarment(type)
    const def = GARMENTS.find((g) => g.id === type)
    if (def) {
      setColors(def.defaultColors)
    }
  }

  // From portfolio: load template to canvas
  const handleLoadFromPortfolio = (type: GarmentType, itemColors: GarmentColorParts) => {
    setSelectedGarment(type)
    setColors(itemColors)
    setActiveTab('canvas')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // From canvas: apply to order form
  const handleApplyToOrder = () => {
    setActiveTab('order')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Open invoice / SPK modal
  const handleOpenInvoiceModal = (summary: any) => {
    setInvoiceSummary(summary)
    setIsInvoiceOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSizeChart={() => setIsSizeChartOpen(true)}
        totalPcs={37}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic View rendering based on activeTab */}
        {activeTab === 'canvas' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Studio intro banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-[#ff5e00] font-extrabold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-[#ff5e00]" />
                  ZY CLOTHES • 3D MOCKUP STUDIO & SMART PRICING
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-display">
                  Studio Desain & Customizer Seragam
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Pilih model baju, atur pencahayaan studio, kustomisasi kombinasi warna kain, dan pasang logo sablon atau bordir dengan tarif otomatis mengikuti ukuran logo.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setIsSizeChartOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Size Chart
                </button>
                <button
                  onClick={handleApplyToOrder}
                  className="px-5 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 cursor-pointer"
                >
                  Form Order Langsung
                </button>
              </div>
            </div>

            {/* Interactive Canvas Customizer */}
            <CanvasCustomizer
              selectedGarment={selectedGarment}
              onSelectGarment={handleSelectGarment}
              colors={colors}
              onColorsChange={setColors}
              graphics={graphics}
              onGraphicsChange={setGraphics}
              onApplyToOrder={handleApplyToOrder}
            />
          </div>
        )}

        {activeTab === 'order' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Order Form Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#ff5e00] uppercase tracking-wider">
                  Formulir Pemesanan & SPK
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-0.5 font-display">
                  Form Pemesanan & Kalkulator Biaya
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pilih bahan kain, distribusi ukuran (S-XXL), hitung diskon lusinan, dan checkout langsung via WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('canvas')}
                className="px-4 py-2.5 bg-orange-50 text-[#ff5e00] hover:bg-orange-100 font-bold rounded-2xl text-xs border border-orange-200 transition-colors cursor-pointer"
              >
                ← Kembali ke Studio Desain
              </button>
            </div>

            {/* Order Form Component */}
            <OrderForm
              selectedGarment={selectedGarment}
              onSelectGarment={handleSelectGarment}
              colors={colors}
              graphics={graphics}
              onOpenInvoiceModal={handleOpenInvoiceModal}
              onOpenSizeChart={() => setIsSizeChartOpen(true)}
            />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Portfolio onLoadToCanvas={handleLoadFromPortfolio} />
          </div>
        )}

        {/* Value Proposition Badges */}
        <section className="mt-16 pt-12 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-orange-50 text-[#ff5e00] rounded-2xl flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-black">Bahan Original</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kain bersertifikat pabrik resmi (Nagata Drill, Combed 24s/30s asli).
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-black">Garansi Kualitas</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbaikan gratis jika ada cacat jahitan atau sablon miring.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-black">Tepat Waktu</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kepastian tanggal selesai untuk event & pelantikan seragam.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-black">Kirim Kargo Seluruh RI</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tarif ongkir murah via JNE Trucking & Indah Cargo.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white mt-20 pt-14 pb-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black text-[#ff5e00] border border-slate-800 rounded-xl flex items-center justify-center font-black text-sm">
                  ZY
                </div>
                <span className="font-black text-lg tracking-tight font-display">
                  ZY <span className="text-[#ff5e00]">CLOTHES</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Studio kustomisasi mockup 3D dan platform pemesanan seragam konveksi modern terdepan. Melayani Kemeja PDH, PDL, Rompi Tactical, Kaos Heavyweight, dan Polo Shirt.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
                <CheckCircle className="w-4 h-4" />
                <span>Terdaftar & Bergaransi Resmi</span>
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-white mb-3 uppercase tracking-wider">
                Produk Seragam
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li>• Kemeja PDH / PDL Mahasiswa & Ormas</li>
                <li>• Kemeja Kantor Eksekutif & BUMN</li>
                <li>• Rompi Tactical & Safety K3 Scotlite</li>
                <li>• Kaos T-Shirt Heavyweight Combed 24s/30s</li>
                <li>• Polo Shirt Wangki Lacoste Pique</li>
                <li>• Jaket Bomber & Hoodie Jumper Streetwear</li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-white mb-3 uppercase tracking-wider">
                Layanan & Fitur
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li>• Studio Desain 3D Interaktif Online</li>
                <li>• Smart Pricing Engine Ukuran Sablon</li>
                <li>• Mesin Bordir Komputer Otomatis</li>
                <li>• Cetak Lembar SPK & Invoice PDF</li>
                <li>• Bisa di-install sebagai Aplikasi di HP (PWA)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-white mb-3 uppercase tracking-wider">
                Workshop & Pemesanan
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kawasan Sentra Konveksi Bandung, Jawa Barat (40287)
              </p>
              <p className="text-xs text-[#ff5e00] font-bold mt-2">
                WhatsApp: +62 812-3456-7890
              </p>
              <p className="text-xs text-slate-400">
                Jam Operasional: Senin - Sabtu (08.00 - 17.00 WIB)
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} ZY Clothes Studio. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="text-slate-400">
              Didesain khusus untuk efisiensi industri apparel & konveksi Indonesia.
            </p>
          </div>
        </div>
      </footer>

      {/* Helper Modals */}
      <SizeChartModal isOpen={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} />
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        summary={invoiceSummary}
      />
    </div>
  )
}

export default App
