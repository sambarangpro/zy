import React, { useState, useEffect } from 'react'
import {
  Palette,
  ClipboardList,
  FolderHeart,
  Ruler,
  PhoneCall,
  Menu,
  X,
  Download,
  Layers,
  Sparkles,
} from 'lucide-react'

export type ActiveTab = 'wardrobe' | 'canvas' | 'mockups' | 'order' | 'portfolio'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = () => {
    if (!installPrompt) {
      alert('Untuk meng-install aplikasi ini di HP/Laptop: Tekan menu titik tiga di browser Anda (Chrome/Edge/Safari) lalu pilih "Tambahkan ke Layar Utama" / "Install App".')
      return
    }
    installPrompt.prompt()
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null)
    })
  }

  const navItems = [
    {
      id: 'wardrobe' as ActiveTab,
      label: 'Koleksi Rak 3D',
      icon: Sparkles,
      badge: 'Baru',
    },
    {
      id: 'canvas' as ActiveTab,
      label: 'Studio Kanvas',
      icon: Palette,
    },
    {
      id: 'mockups' as ActiveTab,
      label: 'Editor Mockup',
      icon: Layers,
    },
    {
      id: 'order' as ActiveTab,
      label: 'Pemesanan',
      icon: ClipboardList,
      badge: totalPcs > 0 ? `${totalPcs} pcs` : undefined,
    },
    {
      id: 'portfolio' as ActiveTab,
      label: 'Portofolio',
      icon: FolderHeart,
    },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* ZY Clothes Brand Logo */}
        <div
          onClick={() => onTabChange('canvas')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 bg-black text-[#ff5e00] rounded-xl flex items-center justify-center font-black text-base shadow-sm border border-slate-900 group-hover:scale-105 transition-transform tracking-tighter">
            ZY
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-black">
              ZY <span className="text-[#ff5e00]">CLOTHES</span>
            </span>
            <span className="bg-black text-white text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">
              Studio
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'text-slate-600 hover:text-black hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ff5e00]' : 'text-slate-500'}`} />
                {item.label}
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-orange-500/20 text-[#ff5e00]'
                        : 'bg-slate-200 text-slate-700'
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
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onOpenSizeChart}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-black bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5 text-slate-500" />
            Size Chart
          </button>

          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20ZY%20Clothes,%20saya%20mau%20konsultasi%20pembuatan%20seragam"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-[#ff5e00] hover:bg-[#e05300] text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="p-2 rounded-xl bg-orange-50 text-[#ff5e00] border border-orange-200 text-xs font-bold flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Install
          </button>
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
                className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center justify-between ${
                  isActive ? 'bg-orange-50 text-[#ff5e00]' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#ff5e00]" />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-orange-100 text-[#ff5e00] px-2 py-0.5 rounded-full">
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
              className="flex-1 py-2.5 text-xs font-bold text-center bg-slate-100 rounded-xl text-slate-800"
            >
              Panduan Ukuran
            </button>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 text-xs font-bold text-center bg-[#ff5e00] text-white rounded-xl"
            >
              WhatsApp CS
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
