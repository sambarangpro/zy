import React, { useState } from 'react'
import { PORTFOLIO_ITEMS } from '../data/portfolio'
import type { GarmentColorParts, GarmentType, PortfolioItem } from '../types'
import {
  Sparkles,
  Star,
  CheckCircle,
  Palette,
  ExternalLink,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react'

interface PortfolioProps {
  onLoadToCanvas: (type: GarmentType, colors: GarmentColorParts) => void
}

export const Portfolio: React.FC<PortfolioProps> = ({ onLoadToCanvas }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeModalItem, setActiveModalItem] = useState<PortfolioItem | null>(null)

  const categories = [
    { id: 'all', label: 'Semua Portofolio' },
    { id: 'pdh', label: 'PDH / PDL Kampus & Dinas' },
    { id: 'kaos', label: 'Kaos Sablon & Event' },
    { id: 'rompi', label: 'Rompi Lapangan & Safety' },
    { id: 'kemeja', label: 'Kemeja Kerja / Kantor' },
    { id: 'polo', label: 'Polo Shirt Wangki' },
  ]

  const filteredItems =
    selectedCategory === 'all'
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter((item) => item.category === selectedCategory)

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-300 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Galeri Produksi Asli & Inspirasi
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Portofolio Seragam Unggulan
          </h2>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Lebih dari 500+ instansi BUMN, universitas, perusahaan swasta, dan komunitas telah mempercayakan produksi seragam mereka kepada konveksi kami.
            Klik <b>"Buka Desain Ini di Canvas"</b> untuk langsung mengedit warna & logonya sesuai kebutuhan Anda!
          </p>
        </div>
      </div>

      {/* Filter Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-2" />
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
          >
            {/* Image Preview Container */}
            <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />

              {/* Quantity badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                Produksi: {item.quantity} pcs
              </div>

              {/* Rating stars */}
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-amber-400 text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>5.0</span>
              </div>

              {/* Client Name at bottom of image */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-[11px] font-medium text-indigo-200 uppercase tracking-wider">
                  {item.client}
                </p>
                <h3 className="font-bold text-sm leading-tight text-white line-clamp-1">
                  {item.title}
                </h3>
              </div>
            </div>

            {/* Card Content & Specs */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">Bahan:</span>
                  <span className="text-slate-800 font-semibold truncate">{item.fabric}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium">Aplikasi:</span>
                  <span className="text-slate-800 truncate">{item.technique}</span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
                  {item.description}
                </p>
              </div>

              {/* Color Swatches Used */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Warna:</span>
                  <div className="flex -space-x-1">
                    {Object.entries(item.colors).map(([part, hex]) => (
                      <span
                        key={part}
                        title={part}
                        className="w-4 h-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalItem(item)}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  Detail
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Action Button: Load to Canvas Customizer */}
              <button
                onClick={() => onLoadToCanvas(item.category, item.colors)}
                className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200 hover:border-indigo-600 shadow-xs"
              >
                <Palette className="w-3.5 h-3.5" />
                Buka Desain Ini di Canvas
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail Item */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative aspect-video">
              <img
                src={activeModalItem.imageUrl}
                alt={activeModalItem.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveModalItem(null)}
                className="absolute top-4 right-4 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/90 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {activeModalItem.client}
                </span>
                <span className="text-xs text-slate-400">• Produksi {activeModalItem.quantity} pcs</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {activeModalItem.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {activeModalItem.description}
              </p>

              <div className="bg-slate-50 rounded-xl p-3.5 mb-6 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Spesifikasi Bahan:</span>
                  <span className="font-bold text-slate-800">{activeModalItem.fabric}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teknik Logo:</span>
                  <span className="font-bold text-slate-800">{activeModalItem.technique}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Warna Terpasang:</span>
                  <div className="flex gap-1.5 items-center">
                    {Object.entries(activeModalItem.colors).map(([part, hex]) => (
                      <span
                        key={part}
                        className="w-3.5 h-3.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    const item = activeModalItem
                    setActiveModalItem(null)
                    onLoadToCanvas(item.category, item.colors)
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                  Buka di Canvas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
