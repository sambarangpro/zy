import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Palette,
  ShieldCheck,
  Tag,
  Layers,
  Award,
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
  frontImg?: string
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
}

export const WardrobeShowcase: React.FC<WardrobeShowcaseProps> = ({
  mockups,
  activeMockupId,
  onSelectMockup,
  onSelectGarment,
  onOpenCanvas,
}) => {
  // Build unified wardrobe items combining user-configured mockups + curated apparel collection
  const wardrobeItems: WardrobeItem[] = React.useMemo(() => {
    const items: WardrobeItem[] = []

    // 1. User uploaded / custom mockups from database (e.g. PDH)
    mockups.forEach((m, idx) => {
      items.push({
        id: `mockup_${m.id}`,
        name: m.name,
        category: (m.category?.toLowerCase().includes('pdh') ? 'pdh' : 'pdh') as any,
        categoryLabel: m.category || 'PDH / PDL Workwear',
        subtitle: m.description || 'Pakaian Dinas Harian & Seragam Organisasi Resmi',
        description: 'Seragam kemeja berkerah dengan lidah pundak, saku fungsional flap, dan bahan drill berkualitas.',
        price: m.basePrice || 165000,
        garmentType: 'pdh',
        mockupId: m.id,
        frontImg: m.frontImg || undefined,
        defaultColors: {
          body: m.defaultBaseColor || '#1e3a8a',
          collar: '#1e3a8a',
          sleeves: '#1e3a8a',
          pocket: '#1e3a8a',
          accent: '#cbd5e1',
        },
        tagBadge: idx === 0 ? 'Model Utama' : 'Custom Model',
      })
    })

    // 2. Curated Apparel Collection (like Nike digital showroom)
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
          body: '#9a3412', // Terracotta warm brown (Nike style)
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
          body: '#93c5fd', // Light Blue (Nike style)
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
          accent: '#84cc16', // Neon Volt (Nike style)
        },
        tagBadge: 'Sport Tech',
      },
      {
        id: 'curated_kaos_heavyweight',
        name: 'Kaos T-Shirt Heavyweight Distro',
        category: 'kaos',
        categoryLabel: 'Kaos & T-Shirt',
        subtitle: 'Cotton Combed 24s Reaktif • Hitam Pekat ZY',
        description: 'Kaos katun bergramasi tebal dengan rib leher anti-melar, cocok untuk sablon DTF dan bordir patch.',
        price: 75000,
        garmentType: 'kaos',
        defaultColors: {
          body: '#0a0a0c',
          collar: '#0a0a0c',
          sleeves: '#0a0a0c',
          pocket: '#0a0a0c',
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

  // Filter category state
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredItems = React.useMemo(() => {
    if (activeCategory === 'all') return wardrobeItems
    return wardrobeItems.filter((item) => item.category === activeCategory)
  }, [wardrobeItems, activeCategory])

  // Active highlighted garment index on the rail (defaults to currently active mockup if present)
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (activeMockupId) {
      const foundIdx = wardrobeItems.findIndex((it) => it.mockupId === activeMockupId)
      if (foundIdx !== -1) return foundIdx
    }
    return 0
  })

  // Ensure index remains valid on filter change
  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(Math.max(0, filteredItems.length - 1))
    }
  }, [filteredItems.length])

  const activeItem = filteredItems[activeIndex] || filteredItems[0]

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
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0))
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

  return (
    <div className="w-full flex flex-col items-center select-none pb-12 animate-in fade-in duration-500">
      {/* 1. TOP HEADER & BRANDING */}
      <div className="text-center max-w-2xl mx-auto pt-2 pb-6 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ff5e00] text-[11px] font-black uppercase tracking-widest shadow-2xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive 3D Wardrobe Rail</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-display">
          Pilih Seragam di <span className="text-[#ff5e00]">Rak Gantungan 3D</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          Arahkan kursor atau geser pakaian ke kiri & kanan untuk memilah seragam seperti di lemari toko secara langsung. Klik seragam untuk mulai mendesain di Studio Kanvas!
        </p>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
          {[
            { id: 'all', label: 'Semua Koleksi' },
            { id: 'pdh', label: 'PDH & Kemeja' },
            { id: 'jaket', label: 'Jaket & Outerwear' },
            { id: 'hoodie', label: 'Hoodie & Sweater' },
            { id: 'kaos', label: 'Kaos & Polo' },
            { id: 'rompi', label: 'Rompi Safety' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id)
                setActiveIndex(0)
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MAIN 3D CLOTHES RAIL STAGE */}
      <div
        className="w-full max-w-[1550px] relative mt-4 px-2 sm:px-6"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Wall Shadow Plate */}
        <div className="relative w-full bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]/60 rounded-3xl border border-slate-200/80 shadow-inner overflow-hidden py-10 min-h-[580px] flex flex-col justify-between">
          
          {/* Studio Wall Ambient Grid Pattern */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Brand Watermark (Nike / ZY style) */}
          <div className="w-full flex justify-center pt-2 pb-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 tracking-tighter opacity-75">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
                ZY <span className="text-[#ff5e00]">CLOTHES</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#ff5e00] inline-block animate-pulse" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* THE METALLIC HANGER RAIL (BATANG GANTUNGAN BESI CHROME) */}
          {/* ======================================================== */}
          <div className="relative w-full my-6 flex items-center justify-center">
            {/* Left Wall Mounting Bracket */}
            <div className="absolute left-4 sm:left-12 top-1/2 -translate-y-1/2 w-4 sm:w-6 h-10 bg-gradient-to-r from-slate-700 to-slate-900 rounded-sm shadow-lg z-30 flex flex-col justify-between py-1 px-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-auto" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-auto" />
            </div>

            {/* The Horizontal Chrome Rod */}
            <div
              className="w-[94%] sm:w-[92%] h-3 sm:h-3.5 rounded-full relative z-20 shadow-md"
              style={{
                background:
                  'linear-gradient(180deg, #ffffff 0%, #cbd5e1 25%, #64748b 65%, #334155 100%)',
                boxShadow:
                  '0 2px 4px rgba(0,0,0,0.25), 0 12px 20px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.9)',
              }}
            >
              {/* Subtle metallic reflection highlight */}
              <div className="absolute inset-x-2 top-0.5 h-0.5 bg-white/70 rounded-full" />
            </div>

            {/* Right Wall Mounting Bracket */}
            <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 w-4 sm:w-6 h-10 bg-gradient-to-r from-slate-900 to-slate-700 rounded-sm shadow-lg z-30 flex flex-col justify-between py-1 px-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-auto" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-auto" />
            </div>

            {/* Shadow cast by rail on the wall */}
            <div className="absolute w-[94%] sm:w-[92%] h-4 top-6 bg-black/15 blur-md rounded-full pointer-events-none" />
          </div>

          {/* ======================================================== */}
          {/* THE HANGING GARMENTS (INTERACTIVE 3D CAROUSEL) */}
          {/* ======================================================== */}
          <div className="relative w-full flex items-center justify-center min-h-[380px] my-auto overflow-hidden">
            <div className="relative flex items-center justify-center w-full max-w-5xl h-[380px]">
              {filteredItems.map((item, idx) => {
                const isCurrent = idx === activeIndex
                const dist = idx - activeIndex
                const absDist = Math.abs(dist)

                // Dynamic lateral push effect: items part to the sides when one is active
                let translateX = 0
                let rotateY = 0
                let scale = 0.82
                let zIndex = 20 - absDist
                let opacity = 1

                if (isCurrent) {
                  translateX = 0
                  rotateY = 0
                  scale = 1.15
                  zIndex = 40
                } else if (dist < 0) {
                  // Items to the left: pushed left, rotated facing right
                  translateX = -(110 + absDist * 48)
                  rotateY = Math.min(80, 68 + absDist * 3)
                  scale = Math.max(0.72, 0.85 - absDist * 0.04)
                  opacity = Math.max(0.55, 1 - absDist * 0.12)
                } else {
                  // Items to the right: pushed right, rotated facing left
                  translateX = 110 + absDist * 48
                  rotateY = -Math.min(80, 68 + absDist * 3)
                  scale = Math.max(0.72, 0.85 - absDist * 0.04)
                  opacity = Math.max(0.55, 1 - absDist * 0.12)
                }

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
                      transform: `translateX(${translateX}px) perspective(1100px) rotateY(${rotateY}deg) scale(${scale})`,
                      zIndex,
                      opacity,
                      transformOrigin: 'top center',
                      transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                    }}
                    className={`absolute top-0 flex flex-col items-center cursor-pointer group transition-all ${
                      isCurrent ? 'filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.22)]' : 'filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.12)]'
                    }`}
                  >
                    {/* A. WOODEN HANGER & HOOK */}
                    <div className="relative flex flex-col items-center z-10 -mb-2">
                      {/* Chrome Swivel Hook */}
                      <div className="w-5 h-8 -mt-6 relative">
                        <svg viewBox="0 0 40 60" className="w-full h-full overflow-visible">
                          {/* Curved hook hooked over the rail */}
                          <path
                            d="M 20 55 L 20 28 Q 20 8 32 8 Q 44 8 44 22"
                            fill="none"
                            stroke="url(#hookGrad)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="hookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="50%" stopColor="#94a3b8" />
                              <stop offset="100%" stopColor="#475569" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                      {/* Natural Wooden Hanger Body */}
                      <div className="w-36 h-5 rounded-t-full bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 border border-amber-900 shadow-sm relative flex items-center justify-center">
                        <div className="w-2.5 h-1.5 rounded-full bg-slate-300 shadow-2xs -mt-0.5" />
                        <div className="absolute inset-x-2 top-0.5 h-0.5 bg-amber-400/30 rounded-full" />
                      </div>
                    </div>

                    {/* B. THE GARMENT BODY */}
                    <div
                      className={`relative w-48 sm:w-56 h-64 sm:h-72 transition-transform duration-300 ${
                        isCurrent ? 'group-hover:scale-102' : ''
                      }`}
                    >
                      {item.frontImg ? (
                        <div className="w-full h-full relative flex items-center justify-center">
                          <img
                            src={item.frontImg}
                            alt={item.name}
                            className="w-full h-full object-contain pointer-events-none select-none filter contrast(1.02) saturate(1.05)"
                          />
                        </div>
                      ) : (
                        <MockupSVG
                          type={item.garmentType}
                          side="front"
                          colors={item.defaultColors}
                          className="w-full h-full object-contain pointer-events-none select-none"
                        />
                      )}

                      {/* Badge Tag on garment if active */}
                      {isCurrent && item.tagBadge && (
                        <div className="absolute top-4 right-2 bg-black text-[#ff5e00] text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider border border-orange-500/30 animate-in fade-in zoom-in-95 duration-200">
                          {item.tagBadge}
                        </div>
                      )}
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
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer z-30"
              title="Seragam Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer z-30"
              title="Seragam Berikutnya"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* ======================================================== */}
          {/* 3. ACTIVE GARMENT SPOTLIGHT INFO & CTA (LIKE NIKE VIDEO) */}
          {/* ======================================================== */}
          {activeItem && (
            <div className="w-full max-w-xl mx-auto px-4 z-20 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Product Category & Title */}
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#ff5e00]">
                <Tag className="w-3.5 h-3.5" />
                <span>{activeItem.categoryLabel}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {activeItem.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md line-clamp-2">
                {activeItem.subtitle}
              </p>

              {/* Price & Direct Studio Action */}
              <div className="flex items-center gap-3 mt-4">
                <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs">
                  Mulai <span className="font-mono text-black font-extrabold">Rp {activeItem.price.toLocaleString('id-ID')}</span>
                </div>

                <button
                  onClick={() => handleSelectAndCustomize(activeItem)}
                  className="px-6 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#ff5e00]/25 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <Palette className="w-4 h-4" />
                  <span>Kustomisasi Desain Ini</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. VALUE BENEFITS SUMMARY ROW */}
      <div className="w-full max-w-[1550px] grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 px-2 sm:px-6">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff5e00] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-extrabold text-xs text-slate-900">Bahan Pabrik Bersertifikat</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">Nagata Drill, Japan Drill, Cotton Combed 24s/30s asli.</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-extrabold text-xs text-slate-900">Garansi Jahitan & Sablon</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">Bordir komputer presisi & sablon DTF anti-pecah.</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-extrabold text-xs text-slate-900">Kustomisasi 4 Sisi Bebas</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">Tampak depan, belakang, dan kedua lengan tersinkronisasi 3D.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
