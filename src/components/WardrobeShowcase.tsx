import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Palette,
  CheckCircle2,
  Settings2,
} from 'lucide-react'
import type { MockupTemplate, GarmentType } from '../types'
import { MockupSVG } from './MockupSVG'

export interface WardrobeItem {
  id: string
  name: string
  category: 'pdh' | 'kaos' | 'jaket' | 'polo' | 'rompi' | 'hoodie'
  categoryLabel: string
  subtitle: string
  description: string
  price: number
  garmentType: GarmentType
  mockupId?: string
  frontImg?: string       // Tampak Depan Realistis (PNG Transparan beserta hanger)
  sideImg?: string        // Tampak Samping Realistis (PNG Transparan beserta hanger)
  backImg?: string        // Tampak Belakang (Opsional)
  hasHangerInImage?: boolean // Jika true (default), PNG sudah memiliki hanger sehingga tidak merender hanger kayu terpisah
  defaultColors: {
    body: string
    collar: string
    sleeves: string
    pocket: string
    accent: string
  }
  tagBadge?: string
}

interface WardrobeShowcaseProps {
  mockups: MockupTemplate[]
  activeMockupId: string | null
  onSelectMockup: (mockupId: string) => void
  onSelectGarment: (garmentType: GarmentType) => void
  onOpenCanvas: () => void
  onOpenDashboard?: () => void
}

/**
 * Realistic Wooden Hanger fallback for mockups that do not yet have a hanger in their PNG
 */
const FallbackWoodenHanger: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center z-30 pointer-events-none select-none">
      {/* 1. Chrome Hook */}
      <div className="w-7 h-10 -mt-7 relative flex items-center justify-center">
        <svg viewBox="0 0 50 65" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="fallbackHookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#e2e8f0" />
              <stop offset="60%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="fallbackHookShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.4" />
            </filter>
          </defs>
          <path
            d="M 25 60 L 25 30 C 25 10, 41 6, 43 16 C 44 24, 38 31, 33 31"
            fill="none"
            stroke="url(#fallbackHookGrad)"
            strokeWidth="3.8"
            strokeLinecap="round"
            filter="url(#fallbackHookShadow)"
          />
          <rect x="22" y="55" width="6" height="5.5" rx="1" fill="url(#fallbackHookGrad)" stroke="#334155" strokeWidth="0.8" />
        </svg>
      </div>

      {/* 2. Wooden Hanger Bar */}
      <div className="relative w-40 sm:w-48 h-6 -mt-1 flex items-center justify-center">
        <svg viewBox="0 0 200 32" className="w-full h-full overflow-visible drop-shadow-md">
          <defs>
            <linearGradient id="fallbackWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d99351" />
              <stop offset="35%" stopColor="#b46d2f" />
              <stop offset="80%" stopColor="#7c3e14" />
              <stop offset="100%" stopColor="#451e06" />
            </linearGradient>
          </defs>
          <path
            d="M 100 4 C 118 4, 145 9, 188 18 C 195 20, 196 26, 192 29 C 188 32, 182 31, 176 27 C 142 16, 120 13, 100 13 C 80 13, 58 16, 24 27 C 18 31, 12 32, 8 29 C 4 26, 5 20, 12 18 C 55 9, 82 4, 100 4 Z"
            fill="url(#fallbackWoodGrad)"
            stroke="#451e06"
            strokeWidth="0.8"
          />
        </svg>
      </div>
    </div>
  )
}

export const WardrobeShowcase: React.FC<WardrobeShowcaseProps> = ({
  mockups,
  activeMockupId,
  onSelectMockup,
  onSelectGarment,
  onOpenCanvas,
  onOpenDashboard,
}) => {
  // Build wardrobe items: user uploaded/custom mockups + curated items
  const wardrobeItems: WardrobeItem[] = React.useMemo(() => {
    const items: WardrobeItem[] = []

    // 1. User uploaded / custom mockups from database (e.g. PDH)
    mockups.forEach((m, idx) => {
      items.push({
        id: `mockup_${m.id}`,
        name: m.name,
        category: (m.category?.toLowerCase().includes('pdh') ? 'pdh' : 'pdh') as any,
        categoryLabel: m.category || 'PDH Workwear',
        subtitle: m.description || 'Pakaian Dinas Harian & Seragam Organisasi Resmi',
        description: 'Seragam kemeja berkerah dengan lidah pundak, saku fungsional flap, dan bahan drill berkualitas.',
        price: m.basePrice || 165000,
        garmentType: 'pdh',
        mockupId: m.id,
        frontImg: m.frontImg || undefined,
        sideImg: m.leftImg || m.rightImg || undefined,
        backImg: m.backImg || undefined,
        hasHangerInImage: true, // User's PNGs will already include the hanger
        defaultColors: {
          body: (m.defaultBaseColor && m.defaultBaseColor !== '#1e3a8a') ? m.defaultBaseColor : '#ffffff',
          collar: '#ffffff',
          sleeves: '#ffffff',
          pocket: '#ffffff',
          accent: '#cbd5e1',
        },
        tagBadge: idx === 0 ? 'Model Utama' : 'Custom Model',
      })
    })

    // 2. Curated Collection (inspired by Nike digital showroom)
    const curated: WardrobeItem[] = [
      {
        id: 'curated_pdh_navy',
        name: 'Kemeja PDH / PDL Workwear',
        category: 'pdh',
        categoryLabel: 'PDH / PDL',
        subtitle: 'American Drill 1919 • Epaulet & Double Flap Pocket',
        description: 'Standar seragam instansi, kampus, dan ormas dengan jahitan rantai kokoh dan saku bordir siap pakai.',
        price: 165000,
        garmentType: 'pdh',
        defaultColors: {
          body: '#1e293b',
          collar: '#1e293b',
          sleeves: '#1e293b',
          pocket: '#1e293b',
          accent: '#cbd5e1',
        },
        tagBadge: 'Terlaris',
      },
      {
        id: 'curated_jaket_corduroy',
        name: 'Jaket Coach Corduroy Edition',
        category: 'jaket',
        categoryLabel: 'Jaket & Outerwear',
        subtitle: 'Heavyweight Corduroy • Terracotta Warm Tone',
        description: 'Jaket coach casual dengan kancing snap metalik, tali serut bawah, dan kerah formal-santai elegan.',
        price: 195000,
        garmentType: 'jaket',
        defaultColors: {
          body: '#9a3412', // Terracotta warm brown (Nike showroom reference)
          collar: '#7c2d12',
          sleeves: '#9a3412',
          pocket: '#9a3412',
          accent: '#ffedd5',
        },
        tagBadge: 'Trending',
      },
      {
        id: 'curated_hoodie_babyblue',
        name: 'Hoodie Club Fleece Pullover',
        category: 'hoodie',
        categoryLabel: 'Hoodie & Sweater',
        subtitle: 'Baby Blue Cotton Fleece 330gsm • Kangaroo Pocket',
        description: 'Sweater bertudung tebal dengan furing lembut kapas, saku kangguru luas, dan tali serut premium.',
        price: 175000,
        garmentType: 'hoodie',
        defaultColors: {
          body: '#93c5fd', // Light Baby Blue (Nike showroom reference)
          collar: '#60a5fa',
          sleeves: '#93c5fd',
          pocket: '#93c5fd',
          accent: '#ffffff',
        },
        tagBadge: 'Populer',
      },
      {
        id: 'curated_windrunner_neon',
        name: 'Jaket Windrunner Tactical Sport',
        category: 'jaket',
        categoryLabel: 'Jaket & Windbreaker',
        subtitle: 'Two-Tone Black & Neon Volt • Water-Repellent Ripstop',
        description: 'Outerwear parasut anti-angin dengan potongan chevron V ikonik, ritsleting kedap air, dan furing jaring.',
        price: 185000,
        garmentType: 'jaket',
        defaultColors: {
          body: '#0f172a',
          collar: '#0f172a',
          sleeves: '#0f172a',
          pocket: '#0f172a',
          accent: '#84cc16', // Neon Volt (Nike showroom reference)
        },
        tagBadge: 'Sport Tech',
      },
      {
        id: 'curated_kaos_heavyweight',
        name: 'Kaos T-Shirt Heavyweight Distro',
        category: 'kaos',
        categoryLabel: 'Kaos & T-Shirt',
        subtitle: 'Cotton Combed 24s Reaktif • Pure White & Solid Cotton',
        description: 'Kaos katun bergramasi tebal dengan rib leher anti-melar, cocok untuk sablon DTF dan bordir patch.',
        price: 75000,
        garmentType: 'kaos',
        defaultColors: {
          body: '#f8fafc',
          collar: '#f8fafc',
          sleeves: '#f8fafc',
          pocket: '#f8fafc',
          accent: '#ff5e00',
        },
      },
      {
        id: 'curated_polo_maroon',
        name: 'Polo Shirt Wangki Formal',
        category: 'polo',
        categoryLabel: 'Polo Shirt',
        subtitle: 'Lacoste Pique Cotton • Maroon & Black Rib Collar',
        description: 'Polo shirt dengan tekstur rajut pori bernapas, plaket kancing rapi, dan manset elastis di pergelangan lengan.',
        price: 95000,
        garmentType: 'polo',
        defaultColors: {
          body: '#831843',
          collar: '#0f172a',
          sleeves: '#831843',
          pocket: '#831843',
          accent: '#fdf2f8',
        },
      },
      {
        id: 'curated_rompi_tactical',
        name: 'Rompi Safety & Tactical Multi-Pocket',
        category: 'rompi',
        categoryLabel: 'Rompi Tactical',
        subtitle: 'Ripstop Tornado • Pita Reflektif Scotlite 3M',
        description: 'Rompi lapangan dengan 4 saku ritsleting, cantolan D-ring serbaguna, dan pita scotlite yang menyala di kegelapan.',
        price: 145000,
        garmentType: 'rompi',
        defaultColors: {
          body: '#14532d',
          collar: '#14532d',
          sleeves: '#14532d',
          pocket: '#14532d',
          accent: '#eab308',
        },
      },
    ]

    // Avoid duplicates if mockups already cover some items
    curated.forEach((c) => {
      if (!items.some((it) => it.name.toLowerCase() === c.name.toLowerCase())) {
        items.push(c)
      }
    })

    return items
  }, [mockups])

  // Active highlighted garment index on the rail
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (activeMockupId) {
      const foundIdx = wardrobeItems.findIndex((it) => it.mockupId === activeMockupId)
      if (foundIdx !== -1) return foundIdx
    }
    return 0
  })

  // Preview angle for active garment ('front' | 'side')
  const [previewAngle, setPreviewAngle] = useState<'front' | 'side'>('front')

  // Reset angle to front when activeIndex changes
  useEffect(() => {
    setPreviewAngle('front')
  }, [activeIndex])

  const activeItem = wardrobeItems[activeIndex] || wardrobeItems[0]

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'Enter' && activeItem) handleSelectAndCustomize(activeItem)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [wardrobeItems.length, activeItem])

  // Dragging / swiping tracking
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef<number>(0)
  const dragThreshold = 40

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartX.current = e.clientX
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const diff = e.clientX - dragStartX.current
    if (diff > dragThreshold) {
      handlePrev()
      dragStartX.current = e.clientX
    } else if (diff < -dragThreshold) {
      handleNext()
      dragStartX.current = e.clientX
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : wardrobeItems.length - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < wardrobeItems.length - 1 ? prev + 1 : 0))
  }

  // Choose garment and open in Canvas Studio
  const handleSelectAndCustomize = (item: WardrobeItem) => {
    if (item.mockupId) {
      onSelectMockup(item.mockupId)
    } else {
      onSelectGarment(item.garmentType)
    }
    onOpenCanvas()
  }

  // Calculate rail positions (Nike digital showroom shuffle geometry)
  const totalItems = wardrobeItems.length
  const slotWidth = 74 // base width per sideways hanger on rail (px)
  const gapSpread = 96 // lateral space opened up when active item faces front (px)

  return (
    <div className="w-full min-h-[90vh] flex flex-col justify-between items-center select-none animate-in fade-in duration-500">
      {/* CSS KEYFRAMES FOR REALISTIC AIR-DRAFT FLOATING & SUSPENSION */}
      <style>{`
        @keyframes hangerFloatA {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(0.35deg);
          }
        }
        @keyframes hangerFloatB {
          0%, 100% {
            transform: translateY(-4px) rotate(-0.3deg);
          }
          50% {
            transform: translateY(3px) rotate(0.3deg);
          }
        }
        @keyframes activeGarmentFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes wallShadowPulse {
          0%, 100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 0.88;
            transform: scale(1.03);
          }
        }
      `}</style>

      {/* 1. SLEEK MINIMALIST TOP HEADER */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between z-20">
        {/* Subtle Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black text-[#ff5e00] rounded-xl flex items-center justify-center font-black text-sm shadow-xs border border-slate-900 tracking-tighter">
            ZY
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 font-display">
                ZY <span className="text-[#ff5e00]">STUDIO</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#ff5e00] inline-block shadow-[0_0_6px_#ff5e00] animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-0.5">
              Apparel Showroom
            </p>
          </div>
        </div>

        {/* Discreet Action Shortcuts */}
        <div className="flex items-center gap-2">
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              title="Kelola & Tambah Foto Mockup Baru"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Kelola Mockup</span>
            </button>
          )}

          <button
            onClick={() => handleSelectAndCustomize(activeItem)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-black text-white shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-[#ff5e00]" />
            <span>Buka Kanvas</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 3D SHOWROOM STAGE (NIKE DIGITAL SHOWROOM ENVIRONMENT) */}
      <div
        className="w-full max-w-[1580px] relative px-2 sm:px-6 my-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative w-full rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden py-10 min-h-[560px] sm:min-h-[600px] flex flex-col justify-between"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, #ffffff 0%, #f8fafc 40%, #f1f5f9 70%, #e2e8f0 100%)',
          }}
        >
          {/* Subtle Studio Pegboard Dot Grid Pattern */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 1.2px, transparent 1.2px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Soft Overhead Spotlight Cone Glow */}
          <div
            className="absolute -top-24 inset-x-0 h-96 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.3) 45%, transparent 75%)',
            }}
          />

          {/* Ambient Floor Contact Gradient */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-300/35 via-slate-200/15 to-transparent pointer-events-none" />

          {/* ======================================================== */}
          {/* THE METALLIC CLOTHES RAIL (BATANG GANTUNGAN BESI CHROME) */}
          {/* ======================================================== */}
          <div className="relative w-full my-3 flex items-center justify-center z-20">
            {/* Left Wall Mounting Bracket with Industrial Flange & Screws */}
            <div className="absolute left-3 sm:left-10 top-1/2 -translate-y-1/2 flex items-center z-30 pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 via-slate-700 to-slate-900 border border-slate-600 shadow-md flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shadow-inner absolute top-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shadow-inner absolute bottom-1" />
                <div className="w-4 h-3 bg-gradient-to-r from-slate-800 to-slate-600 rounded-r-sm shadow" />
              </div>
            </div>

            {/* The Horizontal Chrome Cylindrical Rod */}
            <div
              className="w-[94%] sm:w-[92%] h-3.5 sm:h-4 rounded-full relative z-20"
              style={{
                background:
                  'linear-gradient(180deg, #ffffff 0%, #e2e8f0 20%, #94a3b8 50%, #475569 80%, #1e293b 100%)',
                boxShadow:
                  '0 2px 4px rgba(0,0,0,0.28), 0 14px 24px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.95)',
              }}
            >
              {/* High-gloss specular highlight line */}
              <div className="absolute inset-x-2 top-0.5 h-0.5 bg-white/80 rounded-full" />
              <div className="absolute inset-x-4 bottom-0.5 h-0.5 bg-black/25 rounded-full" />
            </div>

            {/* Right Wall Mounting Bracket with Industrial Flange & Screws */}
            <div className="absolute right-3 sm:right-10 top-1/2 -translate-y-1/2 flex items-center z-30 pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-bl from-slate-500 via-slate-700 to-slate-900 border border-slate-600 shadow-md flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shadow-inner absolute top-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shadow-inner absolute bottom-1" />
                <div className="w-4 h-3 bg-gradient-to-l from-slate-800 to-slate-600 rounded-l-sm shadow" />
              </div>
            </div>

            {/* Soft linear shadow cast by the rail across the rear wall */}
            <div className="absolute w-[94%] sm:w-[92%] h-5 top-7 bg-slate-900/18 blur-md rounded-full pointer-events-none" />
          </div>

          {/* ======================================================== */}
          {/* THE HANGING GARMENTS & REALISTIC REAR WALL SHADOWS LAYER */}
          {/* ======================================================== */}
          <div className="relative w-full flex items-center justify-center min-h-[390px] my-auto overflow-hidden">
            <div className="relative flex items-center justify-center w-full max-w-6xl h-[390px]">
              
              {/* LAYER A: DYNAMIC REAR WALL CAST SHADOWS */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {wardrobeItems.map((item, idx) => {
                  const isCurrent = idx === activeIndex
                  const dist = idx - activeIndex

                  const centerIdx = (totalItems - 1) / 2
                  const baseX = (idx - centerIdx) * slotWidth
                  let shiftX = 0

                  if (isCurrent) {
                    shiftX = 0
                  } else if (dist < 0) {
                    shiftX = -gapSpread
                  } else {
                    shiftX = gapSpread
                  }

                  const shadowX = baseX + shiftX

                  return (
                    <div
                      key={`wall-shadow-${item.id}`}
                      className="absolute transition-all duration-500 ease-out pointer-events-none"
                      style={{
                        left: `calc(50% + ${shadowX}px)`,
                        top: isCurrent ? '44px' : '40px',
                        transform: 'translateX(-50%)',
                        width: isCurrent ? '240px' : '34px',
                        height: isCurrent ? '310px' : '290px',
                        borderRadius: isCurrent ? '42px 42px 64px 64px' : '18px',
                        background: isCurrent
                          ? 'radial-gradient(ellipse at 50% 35%, rgba(15, 23, 42, 0.44) 0%, rgba(30, 41, 59, 0.28) 45%, rgba(51, 65, 85, 0.12) 75%, transparent 100%)'
                          : 'radial-gradient(ellipse at 50% 25%, rgba(15, 23, 42, 0.32) 0%, rgba(30, 41, 59, 0.18) 50%, transparent 100%)',
                        filter: isCurrent ? 'blur(28px)' : 'blur(16px)',
                        opacity: isCurrent ? 0.95 : 0.72,
                        animation: isCurrent ? 'wallShadowPulse 4.2s ease-in-out infinite' : undefined,
                      }}
                    />
                  )
                })}
              </div>

              {/* LAYER B: THE PHYSICAL HANGING GARMENTS (CAROUSEL & SHUFFLE) */}
              {wardrobeItems.map((item, idx) => {
                const isCurrent = idx === activeIndex
                const dist = idx - activeIndex
                const absDist = Math.abs(dist)

                const centerIdx = (totalItems - 1) / 2
                const baseX = (idx - centerIdx) * slotWidth
                let shiftX = 0
                let rotateY = 0
                let scale = 0.85
                let zIndex = 20 - absDist
                let opacity = 1

                if (isCurrent) {
                  shiftX = 0
                  rotateY = 0
                  scale = 1.16
                  zIndex = 40
                  opacity = 1
                } else if (dist < 0) {
                  shiftX = -gapSpread
                  rotateY = Math.min(78, 68 + absDist * 2)
                  scale = Math.max(0.74, 0.86 - absDist * 0.03)
                  opacity = Math.max(0.6, 1 - absDist * 0.09)
                  zIndex = 20 + idx
                } else {
                  shiftX = gapSpread
                  rotateY = -Math.min(78, 68 + absDist * 2)
                  scale = Math.max(0.74, 0.86 - absDist * 0.03)
                  opacity = Math.max(0.6, 1 - absDist * 0.09)
                  zIndex = 20 + (totalItems - idx)
                }

                const currentX = baseX + shiftX

                // Floating keyframe animation assignment
                const floatAnimation = isCurrent
                  ? 'activeGarmentFloat 4.2s ease-in-out infinite'
                  : idx % 2 === 0
                  ? 'hangerFloatA 4.4s ease-in-out infinite'
                  : 'hangerFloatB 4.8s ease-in-out infinite'

                const floatDelay = `${(idx * 0.45) % 3.6}s`

                // If user's image is provided, it already includes the hanger
                const hasHangerInImage = Boolean(item.frontImg || item.sideImg)

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (isCurrent) {
                        handleSelectAndCustomize(item)
                      } else {
                        setActiveIndex(idx)
                      }
                    }}
                    style={{
                      transform: `translateX(${currentX}px) perspective(1100px) rotateY(${rotateY}deg) scale(${scale})`,
                      zIndex,
                      opacity,
                      transformOrigin: 'top center',
                      transition: 'all 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className="absolute top-0 flex flex-col items-center cursor-pointer group"
                  >
                    {/* FLOATING SUSPENSION WRAPPER */}
                    <div
                      style={{
                        animation: floatAnimation,
                        animationDelay: floatDelay,
                        transformOrigin: 'top center',
                      }}
                      className="flex flex-col items-center"
                    >
                      {/* Realistic contact shadow on top of the chrome rod */}
                      <div className="w-3.5 h-1.5 -mt-1 bg-black/45 blur-[1px] rounded-full pointer-events-none" />

                      {/* FALLBACK HANGER: Only rendered if the garment image doesn't already have a hanger */}
                      {!hasHangerInImage && <FallbackWoodenHanger />}

                      {/* THE GARMENT BODY */}
                      <div
                        className={`relative w-48 sm:w-56 h-68 sm:h-76 transition-transform duration-300 ${
                          hasHangerInImage ? '-mt-2.5' : ''
                        } ${isCurrent ? 'group-hover:scale-102' : ''}`}
                      >
                        {isCurrent ? (
                          // ==========================================
                          // FRONT VIEW (ACTIVE SPOTLIGHT)
                          // ==========================================
                          previewAngle === 'side' && item.sideImg ? (
                            <div className="w-full h-full relative flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                              <img
                                src={item.sideImg}
                                alt={`${item.name} Samping`}
                                className="w-full h-full object-contain pointer-events-none select-none filter contrast-[1.03] saturate-[1.05] drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]"
                              />
                            </div>
                          ) : item.frontImg ? (
                            <div className="w-full h-full relative flex items-center justify-center animate-in fade-in duration-300">
                              <img
                                src={item.frontImg}
                                alt={item.name}
                                className="w-full h-full object-contain pointer-events-none select-none filter contrast-[1.03] saturate-[1.05] drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]"
                              />
                            </div>
                          ) : (
                            <MockupSVG
                              type={item.garmentType}
                              side="front"
                              colors={item.defaultColors}
                              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]"
                            />
                          )
                        ) : (
                          // ==========================================
                          // SIDEWAYS VIEW (HANGING ON THE RAIL)
                          // ==========================================
                          item.sideImg ? (
                            <div className="w-full h-full relative flex items-center justify-center">
                              <img
                                src={item.sideImg}
                                alt={`${item.name} Samping`}
                                style={{
                                  transform: dist < 0 ? 'scaleX(1)' : 'scaleX(-1)',
                                }}
                                className="w-full h-full object-contain pointer-events-none select-none filter contrast-[1.02] brightness-[0.98]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/20 pointer-events-none rounded-xl" />
                            </div>
                          ) : item.frontImg ? (
                            <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                              <img
                                src={item.frontImg}
                                alt={item.name}
                                style={{
                                  transform:
                                    dist < 0
                                      ? 'scaleX(0.44) skewY(-2.5deg)'
                                      : 'scaleX(0.44) skewY(2.5deg)',
                                }}
                                className="w-full h-full object-contain pointer-events-none select-none filter brightness-[0.92] contrast-[1.05]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/35 pointer-events-none" />
                            </div>
                          ) : (
                            <MockupSVG
                              type={item.garmentType}
                              side={dist < 0 ? 'left' : 'right'}
                              colors={item.defaultColors}
                              className="w-full h-full object-contain pointer-events-none select-none"
                            />
                          )
                        )}

                        {/* Badge Tag on garment if active */}
                        {isCurrent && item.tagBadge && (
                          <div className="absolute top-4 right-1 bg-black/90 backdrop-blur-xs text-[#ff5e00] text-[9.5px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider border border-orange-500/40 animate-in fade-in zoom-in-95 duration-200">
                            {item.tagBadge}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Left & Right Rail Navigation Arrow Buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer z-40"
              title="Seragam Sebelumnya (Arrow Left)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer z-40"
              title="Seragam Berikutnya (Arrow Right)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* ======================================================== */}
          {/* 3. ACTIVE GARMENT SPOTLIGHT INFO (MINIMALIST & CLEAN) */}
          {/* ======================================================== */}
          {activeItem && (
            <div className="w-full max-w-xl mx-auto px-4 z-20 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Product Category & Dual-Angle Status */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#ff5e00]">
                  {activeItem.categoryLabel}
                </span>

                {activeItem.sideImg && activeItem.frontImg && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>2 Sudut Realistis</span>
                  </span>
                )}
              </div>

              {/* Garment Title */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {activeItem.name}
              </h3>

              {/* Garment Subtitle */}
              <p className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-2">
                {activeItem.subtitle}
              </p>

              {/* Quick Angle Inspector Toggle (If sideImg exists) */}
              {activeItem.sideImg && (
                <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/80 mt-2 text-[11px] font-bold text-slate-600">
                  <button
                    onClick={() => setPreviewAngle('front')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      previewAngle === 'front'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Tampak Depan
                  </button>
                  <button
                    onClick={() => setPreviewAngle('side')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      previewAngle === 'side'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Tampak Samping
                  </button>
                </div>
              )}

              {/* Price & Direct Studio Action */}
              <div className="flex items-center gap-3 mt-3">
                <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm">
                  Mulai <span className="font-mono text-black font-extrabold">Rp {activeItem.price.toLocaleString('id-ID')}</span>
                </div>

                <button
                  onClick={() => handleSelectAndCustomize(activeItem)}
                  className="px-6 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#ff5e00]/25 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <Palette className="w-4 h-4" />
                  <span>Desain Seragam Ini</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <span className="text-[10px] text-slate-400 mt-2">
                Geser seragam ke kiri & kanan untuk memilih • Klik untuk membuka Studio Kanvas
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Bottom Copyright Notice */}
      <div className="py-2 text-center text-[11px] text-slate-400">
        ZY Clothes Digital Apparel • Interactive Showroom
      </div>
    </div>
  )
}
