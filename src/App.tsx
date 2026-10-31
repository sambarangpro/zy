import { useState, useEffect } from 'react'
import type {
  GarmentColorParts,
  GarmentType,
  CanvasGraphic,
  MockupTemplate,
  ViewSide,
} from './types'
import { GARMENTS } from './data/garments'
import { Navbar } from './components/Navbar'
import type { ActiveTab } from './components/Navbar'
import { CanvasCustomizer } from './components/CanvasCustomizer'
import { WardrobeShowcase } from './components/WardrobeShowcase'
import { MockupDashboard } from './components/MockupDashboard'
import { OrderForm } from './components/OrderForm'
import { Portfolio } from './components/Portfolio'
import { SizeChartModal } from './components/SizeChartModal'
import { InvoiceModal } from './components/InvoiceModal'
import {
  getMockupList,
  getActiveMockupId,
  setActiveMockupId,
  syncMockupsWithDisk,
  saveMockup,
} from './services/mockupStorage'
import {
  ShieldCheck,
  Truck,
  Award,
  Clock,
  CheckCircle,
  Layers,
  KeyRound,
  Lock,
} from 'lucide-react'

// ==========================================
// MODE CONSTANTS
// ==========================================
// Laman Pengunjung: wardrobe → canvas → order → portfolio
// Laman Admin:      mockups (dashboard editor)
// ==========================================

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('wardrobe')
  const [mockups, setMockups] = useState<MockupTemplate[]>(() => getMockupList())
  const [activeMockupId, setActiveMockupIdState] = useState<string | null>(() => getActiveMockupId())

  const activeMockup = mockups.find((m) => m.id === activeMockupId) || mockups[0] || null

  const [selectedGarment, setSelectedGarment] = useState<GarmentType>('kaos')
  const [colors, setColors] = useState<GarmentColorParts>(GARMENTS[1].defaultColors)
  const [graphics, setGraphics] = useState<CanvasGraphic[]>([])

  // Target spesifik bagian yang ingin diedit di dashboard masker (Kerah, Saku, dll)
  const [mockupEditTarget, setMockupEditTarget] = useState<{ partId?: string; side?: ViewSide } | null>(null)

  // Admin Mode toggle (pisahkan laman pengunjung dengan laman editor admin)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zy_admin_mode') === 'true'
    } catch { return false }
  })

  const toggleAdminMode = () => {
    const next = !isAdminMode
    setIsAdminMode(next)
    try { localStorage.setItem('zy_admin_mode', String(next)) } catch {}
    // Jika masuk admin mode, langsung ke dashboard mockup
    if (next) {
      setActiveTab('mockups')
    } else {
      // Kembali ke pengunjung, arahkan ke wardrobe
      setActiveTab('wardrobe')
    }
  }

  // Modals state
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [invoiceSummary, setInvoiceSummary] = useState<any>(null)

  // Auto-sync mockups with permanent local disk storage
  useEffect(() => {
    syncMockupsWithDisk().then((synced) => {
      if (synced && synced.length > 0) {
        setMockups(synced)
        const currentActive = getActiveMockupId()
        const targetId = currentActive && synced.some((m) => m.id === currentActive)
          ? currentActive
          : synced[0].id
        setActiveMockupId(targetId)
        setActiveMockupIdState(targetId)
      }
    })
  }, [])

  // Handlers for Mockups
  const handleSelectAndOpenCanvas = (id: string) => {
    setActiveMockupId(id)
    setActiveMockupIdState(id)
    setActiveTab('canvas')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleMockupsChange = (updatedList: MockupTemplate[]) => {
    setMockups(updatedList)
    const currentActive = getActiveMockupId()
    if (currentActive && updatedList.some((m) => m.id === currentActive)) {
      setActiveMockupIdState(currentActive)
    } else if (!updatedList.some((m) => m.id === activeMockupId)) {
      const nextId = updatedList[0]?.id || null
      if (nextId) setActiveMockupId(nextId)
      setActiveMockupIdState(nextId)
    }
  }

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

  const isVisitorTab = activeTab === 'wardrobe' || activeTab === 'canvas' || activeTab === 'order' || activeTab === 'portfolio'

  // Navbar is hidden on the clean wardrobe landing for visitors,
  // but always shown in admin mode and on other visitor pages
  const showNavbar = isAdminMode || (activeTab !== 'wardrobe')

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      {/* Top Navbar (hidden on clean wardrobe landing for visitor mode) */}
      {showNavbar && (
        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => {
            // Jika pengunjung mencoba masuk ke tab admin, aktifkan admin mode
            if (tab === 'mockups' && !isAdminMode) {
              setIsAdminMode(true)
              try { localStorage.setItem('zy_admin_mode', 'true') } catch {}
            }
            setActiveTab(tab)
          }}
          onOpenSizeChart={() => setIsSizeChartOpen(true)}
          totalPcs={37}
          isAdminMode={isAdminMode}
          onToggleAdminMode={toggleAdminMode}
        />
      )}

      {/* Main Container */}
      <main
        className={`flex-1 w-full mx-auto transition-all ${
          activeTab === 'wardrobe'
            ? 'max-w-full px-2 sm:px-4 py-2'
            : activeTab === 'canvas'
            ? 'max-w-[1650px] px-3 sm:px-6 py-4'
            : 'max-w-7xl px-3 sm:px-6 py-8'
        }`}
      >

        {/* ============================================================= */}
        {/* LAMAN PENGUNJUNG: Wardrobe → Canvas → Order → Portfolio        */}
        {/* ============================================================= */}

        {/* 0. 3D Wardrobe Rail Showcase (Landing Page) */}
        {activeTab === 'wardrobe' && (
          <div className="animate-in fade-in duration-300">
            <WardrobeShowcase
              mockups={mockups}
              activeMockupId={activeMockupId}
              onSelectMockup={(id) => {
                handleSelectAndOpenCanvas(id)
              }}
              onSelectGarment={(garmentId) => {
                handleSelectGarment(garmentId)
                setActiveTab('canvas')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onOpenCanvas={() => {
                setActiveTab('canvas')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onOpenDashboard={isAdminMode ? () => {
                setActiveTab('mockups')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } : undefined}
            />

            {/* Floating Admin Toggle (pojok kiri bawah — kunci kecil) */}
            <button
              onClick={toggleAdminMode}
              title={isAdminMode ? 'Sedang Mode Admin — Klik untuk kembali ke Mode Pengunjung' : 'Masuk ke Mode Admin / Editor'}
              className={`fixed bottom-4 left-4 z-50 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border ${
                isAdminMode
                  ? 'bg-[#ff5e00] text-white border-orange-600 shadow-orange-500/30'
                  : 'bg-white/90 text-slate-400 hover:text-slate-600 border-slate-200'
              }`}
            >
              {isAdminMode ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* 1. Canvas Studio (Pengunjung & Admin) */}
        {activeTab === 'canvas' && (
          <div className="animate-in fade-in duration-300">
            <CanvasCustomizer
              activeMockup={activeMockup}
              graphics={graphics}
              onGraphicsChange={setGraphics}
              onOpenDashboard={(targetPartId?: string, targetSide?: ViewSide) => {
                if (targetPartId) {
                  setMockupEditTarget({ partId: targetPartId, side: targetSide })
                } else {
                  setMockupEditTarget(null)
                }
                setActiveTab('mockups')
              }}
              onOpenWardrobe={() => {
                setActiveTab('wardrobe')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onApplyToOrder={handleApplyToOrder}
              onMockupUpdate={(updated) => {
                const updatedList = saveMockup(updated)
                setMockups(updatedList)
              }}
            />
          </div>
        )}

        {/* 2. Order Form (Pengunjung) */}
        {activeTab === 'order' && (
          <div className="space-y-6 animate-in fade-in duration-300">
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

            <OrderForm
              activeMockup={activeMockup}
              selectedGarment={selectedGarment}
              onSelectGarment={handleSelectGarment}
              colors={colors}
              graphics={graphics}
              onOpenInvoiceModal={handleOpenInvoiceModal}
              onOpenSizeChart={() => setIsSizeChartOpen(true)}
            />
          </div>
        )}

        {/* 3. Portfolio (Pengunjung) */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Portfolio onLoadToCanvas={handleLoadFromPortfolio} />
          </div>
        )}

        {/* ============================================================= */}
        {/* LAMAN ADMIN: Mockup Editor Dashboard                           */}
        {/* ============================================================= */}

        {activeTab === 'mockups' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Admin Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-[#ff5e00] font-extrabold text-xs uppercase tracking-wider mb-1">
                  <Layers className="w-4 h-4 text-[#ff5e00]" />
                  DASHBOARD ADMIN — EDITOR MOCKUP
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-display">
                  Kelola Mockup Foto Seragam
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Upload foto seragam untuk <strong>Canvas Studio</strong> (4 sisi: Depan, Belakang, Kiri, Kanan — tanpa hanger) dan untuk <strong>Showroom Hanger</strong> (Depan & Samping — dengan hanger). Atur harga dasar dan diskon grosir per model.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => {
                    setActiveTab('wardrobe')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-2 border border-slate-200"
                >
                  ← Lihat Showroom
                </button>
                <button
                  onClick={() => setActiveTab('canvas')}
                  className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  Buka Kanvas Desain →
                </button>
              </div>
            </div>

            <MockupDashboard
              mockups={mockups}
              activeMockupId={activeMockupId}
              onMockupsChange={handleMockupsChange}
              onSelectAndOpenCanvas={handleSelectAndOpenCanvas}
              initialEditTarget={mockupEditTarget}
              onClearInitialEditTarget={() => setMockupEditTarget(null)}
            />
          </div>
        )}

        {/* Value Proposition Badges (hidden on wardrobe landing and admin pages) */}
        {isVisitorTab && activeTab !== 'wardrobe' && (
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
        )}
      </main>

      {/* Footer (hidden on wardrobe landing and admin pages) */}
      {isVisitorTab && activeTab !== 'wardrobe' && (
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
      )}

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
