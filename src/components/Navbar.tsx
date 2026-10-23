import React from 'react'
import {
  Palette,
  ClipboardList,
  FolderHeart,
  Ruler,
  Sparkles,
  PhoneCall,
  Menu,
  X,
} from 'lucide-react'

export type ActiveTab = 'canvas' | 'order' | 'portfolio'

interface NavbarProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  onOpenSizeChart: () => void
  totalPcs: number
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSizeChart,
  totalPcs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const navItems = [
    {
      id: 'canvas' as ActiveTab,
      label: 'Studio Desain (Canvas)',
      icon: Palette,
      badge: 'Interaktif',
    },
    {
      id: 'order' as ActiveTab,
      label: 'Form Pemesanan',
      icon: ClipboardList,
      badge: totalPcs > 0 ? `${totalPcs} pcs` : undefined,
    },
    {
      id: 'portfolio' as ActiveTab,
      label: 'Portofolio & Inspirasi',
      icon: FolderHeart,
      badge: '500+ Project',
    },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onTabChange('canvas')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 bg-gradient-to-tr from-indigo-700 via-indigo-600 to-amber-400 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-slate-900">
                Seragam<span className="text-indigo-600">Ku</span>
              </span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Konveksi Kemeja, PDH, Rompi & Kaos Custom
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                {item.label}
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={onOpenSizeChart}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5 text-slate-500" />
            Size Chart
          </button>

          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20SeragamKu,%20saya%20mau%20konsultasi%20pembuatan%20seragam"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Chat CS Konveksi
          </a>
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-indigo-600" />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => {
                onOpenSizeChart()
                setMobileMenuOpen(false)
              }}
              className="flex-1 py-2.5 text-xs font-bold text-center bg-slate-100 rounded-xl text-slate-700"
            >
              Panduan Ukuran
            </button>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 text-xs font-bold text-center bg-emerald-600 text-white rounded-xl"
            >
              WhatsApp CS
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
