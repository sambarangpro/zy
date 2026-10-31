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
  KeyRound,
  Lock,
} from 'lucide-react'

export type ActiveTab = 'wardrobe' | 'canvas' | 'mockups' | 'order' | 'portfolio'

interface NavbarProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  onOpenSizeChart: () => void
  totalPcs: number
  isAdminMode?: boolean
  onToggleAdminMode?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSizeChart,
  totalPcs,
  isAdminMode = false,
  onToggleAdminMode,
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

  // LAMAN PENGUNJUNG: Showroom → Canvas → Order → Portfolio
  const visitorNavItems = [
    {
      id: 'wardrobe' as ActiveTab,
      label: 'Showroom 3D',
      icon: Sparkles,
    },
    {
      id: 'canvas' as ActiveTab,
      label: 'Studio Kanvas',
      icon: Palette,
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

  // LAMAN ADMIN: Semua tab + Editor Mockup
  const adminNavItems = [
    {
      id: 'wardrobe' as ActiveTab,
      label: 'Showroom 3D',
      icon: Sparkles,
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
      badge: 'Admin',
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

  const navItems = isAdminMode ? adminNavItems : visitorNavItems

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-2xs ${
      isAdminMode
        ? 'bg-slate-950/95 border-slate-800/90'
        : 'bg-white/95 border-slate-200/90'
    }`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* ZY Clothes Brand Logo */}
        <div
          onClick={() => onTabChange('wardrobe')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-sm border group-hover:scale-105 transition-transform tracking-tighter ${
            isAdminMode
              ? 'bg-[#ff5e00] text-white border-orange-600'
              : 'bg-black text-[#ff5e00] border-slate-900'
          }`}>
            ZY
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-black text-lg tracking-tight ${
              isAdminMode ? 'text-white' : 'text-black'
            }`}>
              ZY <span className="text-[#ff5e00]">CLOTHES</span>
            </span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block ${
              isAdminMode
                ? 'bg-[#ff5e00] text-white'
                : 'bg-black text-white'
            }`}>
              {isAdminMode ? 'Admin' : 'Studio'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className={`hidden md:flex items-center gap-1 p-1 rounded-2xl border ${
          isAdminMode
            ? 'bg-slate-800/60 border-slate-700'
            : 'bg-slate-100 border-slate-200'
        }`}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? isAdminMode
                      ? 'bg-[#ff5e00] text-white shadow-xs'
                      : 'bg-black text-white shadow-xs'
                    : isAdminMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    : 'text-slate-600 hover:text-black hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${
                  isActive
                    ? isAdminMode ? 'text-white' : 'text-[#ff5e00]'
                    : isAdminMode ? 'text-slate-500' : 'text-slate-500'
                }`} />
                {item.label}
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.badge === 'Admin'
                        ? 'bg-orange-500/20 text-[#ff5e00]'
                        : isActive
                        ? isAdminMode ? 'bg-white/20 text-white' : 'bg-orange-500/20 text-[#ff5e00]'
                        : isAdminMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-700'
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
          {/* Admin Mode Toggle */}
          {onToggleAdminMode && (
            <button
              onClick={onToggleAdminMode}
              title={isAdminMode ? 'Mode Admin Aktif — Klik untuk kembali ke Pengunjung' : 'Masuk ke Mode Admin'}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${
                isAdminMode
                  ? 'bg-[#ff5e00] text-white border-orange-600 hover:bg-[#e05300]'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {isAdminMode ? <KeyRound className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {isAdminMode ? 'Mode Admin' : 'Admin'}
            </button>
          )}

          <button
            onClick={onOpenSizeChart}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isAdminMode
                ? 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
                : 'text-slate-700 hover:text-black bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
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
            className={`p-2 rounded-xl ${
              isAdminMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-b px-4 pt-2 pb-4 space-y-2 ${
          isAdminMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}>
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
                  isActive
                    ? isAdminMode ? 'bg-[#ff5e00]/10 text-[#ff5e00]' : 'bg-orange-50 text-[#ff5e00]'
                    : isAdminMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-50'
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

          {/* Admin Toggle in Mobile */}
          {onToggleAdminMode && (
            <button
              onClick={() => {
                onToggleAdminMode()
                setMobileMenuOpen(false)
              }}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-2.5 ${
                isAdminMode
                  ? 'bg-[#ff5e00] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAdminMode ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isAdminMode ? 'Keluar Mode Admin' : 'Masuk Mode Admin'}
            </button>
          )}

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => {
                onOpenSizeChart()
                setMobileMenuOpen(false)
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center rounded-xl ${
                isAdminMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-800'
              }`}
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
