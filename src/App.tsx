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
  const [selectedGarment, setSelectedGarment] = useState<GarmentType>('pdh')
  const [colors, setColors] = useState<GarmentColorParts>(GARMENTS[0].defaultColors)
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Studio Desain & Customizer 2D Interaktif
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Kustomisasi Seragam Anda Sendiri
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Pilih mockup baju (Kaos, Kemeja PDH, Rompi, Polo, Jaket), ganti kombinasi warna tiap bagian, lalu tambahkan gambar sablon atau logo bordir dengan mudah!
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsSizeChartOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Panduan Ukuran (Size Chart)
                </button>
                <button
                  onClick={handleApplyToOrder}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Langsung Pesan
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
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Formulir Pemesanan Resmi
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  Form Pemesanan & Kalkulator Biaya
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Rincian ukuran baju, pilihan kain konveksi, dan pengiriman langsung terhubung ke WhatsApp CS kami.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('canvas')}
                className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl text-xs border border-indigo-200 transition-colors cursor-pointer"
              >
                ← Edit Desain di Canvas
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">Bahan Original</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kain resmi bersertifikat pabrik (Nagata Drill, Combed 30s asli).
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">Garansi 100%</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbaikan gratis jika ada cacat jahitan atau bordir miring.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">Tepat Waktu</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kepastian tanggal selesai untuk event & pelantikan organisasi.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">Kirim Seluruh RI</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bekerja sama dengan kargo murah (Indah Cargo, JNE Trucking).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20 pt-14 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-lg tracking-tight">
                  Seragam<span className="text-indigo-400">Ku</span> Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform pemesanan dan kustomisasi seragam konveksi modern terdepan di Indonesia. Melayani pembuatan Kemeja PDH, PDL, Rompi Safety, Kaos Sablon, dan Polo Shirt.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
                <CheckCircle className="w-4 h-4" />
                <span>Terdaftar & Berlegalitas Resmi</span>
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-extrabold text-sm text-white mb-3 uppercase tracking-wider">
                Produk Seragam
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• Kemeja PDH / PDL Mahasiswa & Ormas</li>
                <li>• Kemeja Kantor Eksekutif & BUMN</li>
                <li>• Rompi Lapangan & Safety K3 Scotlite</li>
                <li>• Kaos Sablon Komunitas & Gathering</li>
                <li>• Polo Shirt Wangki Pique & Lacoste</li>
                <li>• Jaket Bomber & Parka Angkatan</li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-extrabold text-sm text-white mb-3 uppercase tracking-wider">
                Layanan & Fitur
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• Studio Desain Mockup 2D Online</li>
                <li>• Mesin Bordir Komputer 12 Kepala</li>
                <li>• Sablon DTF High-Density & Plastisol</li>
                <li>• Gratis Pembuatan Sample (Order &gt; 100 pcs)</li>
                <li>• Panduan Ukuran & Konsultasi Bahan</li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-extrabold text-sm text-white mb-3 uppercase tracking-wider">
                Workshop & Kontak
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Jl. Terusan Buah Batu No. 120, Kota Bandung, Jawa Barat (40287)
              </p>
              <p className="text-xs text-indigo-400 font-semibold mt-2">
                WhatsApp: +62 812-3456-7890
              </p>
              <p className="text-xs text-slate-400">
                Jam Kerja: Senin - Sabtu (08.00 - 17.00 WIB)
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} SeragamKu Studio. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="text-slate-400">
              Dibuat dengan ❤️ untuk kemudahan industri konveksi & garmen Indonesia.
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
