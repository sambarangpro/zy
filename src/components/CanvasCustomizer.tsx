import React, { useState, useRef } from 'react'
import type {
  GarmentColorParts,
  GarmentType,
  ViewSide,
  CanvasGraphic,
  StudioLighting,
} from '../types'
import {
  GARMENTS,
  COLOR_PALETTE,
  POSITION_PRESETS,
  calculateGraphicPrice,
} from '../data/garments'
import { MockupSVG } from './MockupSVG'
import {
  Upload,
  Type,
  RotateCw,
  Trash2,
  Download,
  ArrowRight,
  Check,
  Palette,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Flag,
  Sun,
  Waves,
  Tag,
} from 'lucide-react'

interface CanvasCustomizerProps {
  selectedGarment: GarmentType
  onSelectGarment: (type: GarmentType) => void
  colors: GarmentColorParts
  onColorsChange: (colors: GarmentColorParts) => void
  graphics: CanvasGraphic[]
  onGraphicsChange: (graphics: CanvasGraphic[]) => void
  onApplyToOrder: () => void
}

export const CanvasCustomizer: React.FC<CanvasCustomizerProps> = ({
  selectedGarment,
  onSelectGarment,
  colors,
  onColorsChange,
  graphics,
  onGraphicsChange,
  onApplyToOrder,
}) => {
  const [currentSide, setCurrentSide] = useState<ViewSide>('front')
  const [activePart, setActivePart] = useState<keyof GarmentColorParts>('body')
  const [selectedGraphicId, setSelectedGraphicId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  // Studio Lighting & 3D Shadow state (from ZY Clothes engine)
  const [lighting, setLighting] = useState<StudioLighting>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    shadowDepth: 35,
  })

  // Text tool state
  const [inputText, setInputText] = useState('')
  const [textFont, setTextFont] = useState('Montserrat, sans-serif')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textTechnique, setTextTechnique] = useState<'bordir' | 'sablon'>('bordir')

  // Canvas viewport ref
  const viewportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const garmentDef = GARMENTS.find((g) => g.id === selectedGarment) || GARMENTS[0]
  const currentSideGraphics = graphics.filter((g) => g.side === currentSide)
  const selectedGraphic = graphics.find((g) => g.id === selectedGraphicId)

  // Calculate live total print cost from all graphics
  const totalPrintCost = graphics.reduce((sum, g) => {
    const calc = calculateGraphicPrice(g.scale)
    return sum + calc.price
  }, 0)

  // Color changing handler
  const handleColorChange = (hex: string) => {
    onColorsChange({
      ...colors,
      [activePart]: hex,
    })
  }

  // Add preset badges
  const handleAddPresetLogo = (type: 'flag' | 'k3') => {
    let url = ''
    let label = ''

    if (type === 'flag') {
      const flagSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60"><rect width="90" height="30" fill="#dc2626"/><rect y="30" width="90" height="30" fill="#ffffff"/><rect width="90" height="60" fill="none" stroke="#000000" stroke-width="1.5"/></svg>`
      url = `data:image/svg+xml;utf8,${encodeURIComponent(flagSvg)}`
      label = 'Bendera Merah Putih'
    } else {
      const k3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#15803d" stroke="#ffffff" stroke-width="2"/><path d="M 33 18 H 47 V 33 H 62 V 47 H 47 V 62 H 33 V 47 H 18 V 33 H 33 Z" fill="#ffffff"/></svg>`
      url = `data:image/svg+xml;utf8,${encodeURIComponent(k3Svg)}`
      label = 'Emblem K3 Keselamatan'
    }

    const calc = calculateGraphicPrice(0.55)
    const newGraphic: CanvasGraphic = {
      id: 'g_' + Date.now(),
      type: 'image',
      side: currentSide,
      content: url,
      x: 68,
      y: 32,
      scale: 0.55,
      rotation: 0,
      technique: 'bordir',
      label,
      sizeCategory: calc.sizeCategory,
      calculatedPrice: calc.price,
    }

    onGraphicsChange([...graphics, newGraphic])
    setSelectedGraphicId(newGraphic.id)
  }

  // Handle image upload from user device
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const calc = calculateGraphicPrice(0.8)
      const newGraphic: CanvasGraphic = {
        id: 'g_' + Date.now(),
        type: 'image',
        side: currentSide,
        content: dataUrl,
        x: 50,
        y: 40,
        scale: 0.8,
        rotation: 0,
        technique: 'sablon',
        label: file.name.slice(0, 18),
        sizeCategory: calc.sizeCategory,
        calculatedPrice: calc.price,
      }
      onGraphicsChange([...graphics, newGraphic])
      setSelectedGraphicId(newGraphic.id)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Add text element
  const handleAddText = () => {
    if (!inputText.trim()) return

    const calc = calculateGraphicPrice(0.9)
    const newGraphic: CanvasGraphic = {
      id: 't_' + Date.now(),
      type: 'text',
      side: currentSide,
      content: inputText,
      x: 50,
      y: 45,
      scale: 0.9,
      rotation: 0,
      textColor,
      fontFamily: textFont,
      fontSize: 22,
      technique: textTechnique,
      label: inputText,
      sizeCategory: calc.sizeCategory,
      calculatedPrice: calc.price,
    }

    onGraphicsChange([...graphics, newGraphic])
    setSelectedGraphicId(newGraphic.id)
    setInputText('')
  }

  // Apply preset position
  const handleApplyPresetPosition = (preset: (typeof POSITION_PRESETS)[0]) => {
    if (!selectedGraphicId) return

    setCurrentSide(preset.side)
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === selectedGraphicId) {
          const calc = calculateGraphicPrice(preset.scale)
          return {
            ...g,
            side: preset.side,
            x: preset.x,
            y: preset.y,
            scale: preset.scale,
            sizeCategory: calc.sizeCategory,
            calculatedPrice: calc.price,
          }
        }
        return g
      })
    )
  }

  // Delete selected graphic
  const handleDeleteGraphic = (id: string) => {
    onGraphicsChange(graphics.filter((g) => g.id !== id))
    if (selectedGraphicId === id) setSelectedGraphicId(null)
  }

  // Rotate selected graphic
  const handleRotateGraphic = (delta: number) => {
    if (!selectedGraphicId) return
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === selectedGraphicId) {
          const newRot = (g.rotation + delta) % 360
          return { ...g, rotation: newRot }
        }
        return g
      })
    )
  }

  // Scale selected graphic with smart pricing update
  const handleScaleGraphic = (delta: number) => {
    if (!selectedGraphicId) return
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === selectedGraphicId) {
          const newScale = Math.max(0.3, Math.min(2.5, g.scale + delta))
          const formattedScale = parseFloat(newScale.toFixed(2))
          const calc = calculateGraphicPrice(formattedScale)
          return {
            ...g,
            scale: formattedScale,
            sizeCategory: calc.sizeCategory,
            calculatedPrice: calc.price,
          }
        }
        return g
      })
    )
  }

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent, gId: string) => {
    e.stopPropagation()
    setSelectedGraphicId(gId)
    setIsDragging(true)

    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect()
      const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100
      const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100
      const g = graphics.find((item) => item.id === gId)
      if (g) {
        setDragOffset({
          x: clickXPercent - g.x,
          y: clickYPercent - g.y,
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedGraphicId || !viewportRef.current) return

    const rect = viewportRef.current.getBoundingClientRect()
    let xPercent = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x
    let yPercent = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y

    xPercent = Math.max(10, Math.min(90, xPercent))
    yPercent = Math.max(12, Math.min(88, yPercent))

    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === selectedGraphicId) {
          return {
            ...g,
            x: Math.round(xPercent),
            y: Math.round(yPercent),
          }
        }
        return g
      })
    )
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === viewportRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setSelectedGraphicId(null)
    }
  }

  // Export Lossless HD Mockup
  const handleDownloadMockup = () => {
    if (!viewportRef.current) return
    const svgElement = viewportRef.current.querySelector('svg')
    if (!svgElement) return

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgElement)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const URL = window.URL || window.webkitURL || window
    const blobURL = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1900
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      currentSideGraphics.forEach((g) => {
        const posX = (g.x / 100) * canvas.width
        const posY = (g.y / 100) * canvas.height

        ctx.save()
        ctx.translate(posX, posY)
        ctx.rotate((g.rotation * Math.PI) / 180)

        if (g.type === 'text') {
          ctx.font = `bold ${(g.fontSize || 22) * 2.6 * g.scale}px ${g.fontFamily || 'Montserrat'}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = g.textColor || '#ffffff'
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.strokeText(g.content, 0, 0)
          ctx.fillText(g.content, 0, 0)
        }
        ctx.restore()
      })

      const link = document.createElement('a')
      link.download = `ZY_Clothes_${selectedGarment}_${currentSide}_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      URL.revokeObjectURL(blobURL)
    }
    img.src = blobURL
  }

  const partNamesMap: Record<keyof GarmentColorParts, string> = {
    body: 'Badan Utama',
    collar: 'Kerah / Leher',
    sleeves: 'Lengan',
    pocket: 'Saku Depan',
    accent: 'Variasi / List / Scotlite',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ----------------- LEFT PANEL: CONTROLS & PALETTES (5 cols) ----------------- */}
      <div className="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
        {/* 1. Pilih Jenis Seragam */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-orange-50 text-[#ff5e00] flex items-center justify-center font-bold text-xs">
                1
              </span>
              Pilih Model Seragam
            </h3>
            <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded-full font-bold">
              ZY Studio
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GARMENTS.map((g) => {
              const isSelected = g.id === selectedGarment
              return (
                <button
                  key={g.id}
                  onClick={() => onSelectGarment(g.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#ff5e00] bg-orange-50/50 shadow-xs ring-2 ring-[#ff5e00]/20 font-bold'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-xs ${isSelected ? 'text-black font-extrabold' : 'text-slate-800'}`}>
                    {g.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{g.subtitle}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Warna Kain & Pencahayaan Studio (ZY Engine) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#ff5e00]" />
              Warna Kain & Cahaya Studio
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-mono">Custom:</span>
              <input
                type="color"
                value={colors[activePart]}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 overflow-hidden"
              />
            </div>
          </div>

          {/* Part selector pills */}
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {garmentDef.supportedParts.map((part) => {
              const isActive = activePart === part
              return (
                <button
                  key={part}
                  onClick={() => setActivePart(part)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/50 shrink-0"
                    style={{ backgroundColor: colors[part] }}
                  />
                  {partNamesMap[part]}
                </button>
              )
            })}
          </div>

          {/* Color swatches */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            {COLOR_PALETTE.map((c) => {
              const isCurrent = colors[activePart].toLowerCase() === c.hex.toLowerCase()
              return (
                <button
                  key={c.hex}
                  onClick={() => handleColorChange(c.hex)}
                  title={c.name}
                  className={`group relative aspect-square rounded-xl transition-transform hover:scale-110 flex items-center justify-center border ${
                    isCurrent ? 'ring-2 ring-[#ff5e00] ring-offset-2 scale-105' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isCurrent && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        c.hex === '#f8fafc' || c.hex === '#e2d4c0' ? 'text-black' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Kontrol Pencahayaan Studio & Tekstur Lipatan 3D (From ZY Clothes) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#ff5e00]" />
                Pencahayaan & Tekstur Studio
              </span>
              <button
                onClick={() =>
                  setLighting({ brightness: 0, contrast: 0, saturation: 0, shadowDepth: 35 })
                }
                className="text-[10px] text-[#ff5e00] font-bold hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                <span>Kecerahan (Brightness)</span>
                <span className="font-mono text-black font-bold">{lighting.brightness}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={lighting.brightness}
                onChange={(e) => setLighting({ ...lighting, brightness: parseInt(e.target.value) })}
                className="w-full accent-[#ff5e00] h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                <span>Kontras (Contrast)</span>
                <span className="font-mono text-black font-bold">{lighting.contrast}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={lighting.contrast}
                onChange={(e) => setLighting({ ...lighting, contrast: parseInt(e.target.value) })}
                className="w-full accent-[#ff5e00] h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* 3D Wrinkle Shadow Depth */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                <span className="flex items-center gap-1">
                  <Waves className="w-3 h-3 text-[#ff5e00]" />
                  Kedalaman Bayangan Lipatan 3D
                </span>
                <span className="font-mono text-[#ff5e00] font-bold">{lighting.shadowDepth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={lighting.shadowDepth}
                onChange={(e) =>
                  setLighting({ ...lighting, shadowDepth: parseInt(e.target.value) })
                }
                className="w-full accent-[#ff5e00] h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 3. Upload Logo & Teks (Smart Auto-Pricing) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#ff5e00]" />
              Upload Logo & Desain Sablon
            </h3>
            <span className="text-[10px] bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full font-bold">
              Auto-Pricing Ukuran
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-orange-50 hover:bg-orange-100/70 text-[#ff5e00] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors border border-orange-200"
              >
                <Upload className="w-4 h-4" />
                Upload Logo Anda
              </button>

              <button
                onClick={() => handleAddPresetLogo('flag')}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5 text-red-500" />
                + Bendera
              </button>

              <button
                onClick={() => handleAddPresetLogo('k3')}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center gap-1.5"
              >
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block" />
                + K3
              </button>
            </div>

            {/* Custom Text Tool */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-slate-500" />
                  Tambah Teks / Nama
                </span>
                <div className="flex bg-slate-200 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setTextTechnique('bordir')}
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      textTechnique === 'bordir' ? 'bg-white text-black shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Bordir
                  </button>
                  <button
                    onClick={() => setTextTechnique('sablon')}
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      textTechnique === 'sablon' ? 'bg-white text-black shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Sablon
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: ZY CLOTHES / TEKNIK MESIN"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
                />
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded-xl border border-slate-300 cursor-pointer p-0"
                />
                <button
                  onClick={handleAddText}
                  className="bg-black hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shrink-0"
                >
                  Pasang
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Font:</span>
                <select
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
                >
                  <option value="Montserrat, sans-serif">Montserrat (Modern Clean)</option>
                  <option value="'Oswald', sans-serif">Oswald (Bold Sporty)</option>
                  <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech)</option>
                  <option value="'Impact', sans-serif">Impact (Solid Tegas)</option>
                </select>
              </div>
            </div>

            {/* Presets Posisi Cepat */}
            {selectedGraphic && (
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl">
                <p className="text-xs font-bold text-orange-950 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff5e00]" />
                  Posisikan Cepat "{selectedGraphic.label || 'Elemen'}":
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POSITION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPresetPosition(preset)}
                      className="px-2.5 py-1 bg-white hover:bg-orange-100 text-orange-950 border border-orange-300/80 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Daftar Titik Sablon & Rincian Tarif Otomatis */}
        {graphics.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff5e00]" />
                Titik Desain Terpasang ({graphics.length})
              </h3>
              <span className="text-xs font-bold text-[#ff5e00]">
                +Rp {totalPrintCost.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {graphics.map((g, idx) => {
                const isSelected = g.id === selectedGraphicId
                const calc = calculateGraphicPrice(g.scale)
                return (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedGraphicId(g.id)
                      setCurrentSide(g.side)
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#ff5e00] bg-orange-50/50 text-orange-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {g.type === 'image' ? (
                        <img
                          src={g.content}
                          alt="preview"
                          className="w-8 h-8 object-contain bg-slate-100 rounded-lg border"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-black text-[#ff5e00] font-black flex items-center justify-center rounded-lg text-xs">
                          T
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-extrabold truncate text-black">
                          Titik {idx + 1}: {g.label || g.content}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-bold text-[#ff5e00]">
                            {calc.sizeCategory}
                          </span>
                          <span>• Rp {calc.price.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGraphic(g.id)
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ----------------- RIGHT PANEL: MOCKUP CANVAS VIEWPORT (7 cols) ----------------- */}
      <div className="lg:col-span-7 flex flex-col gap-4 order-1 lg:order-2">
        {/* Top Viewport Header Toolbar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Side Toggle (Depan / Belakang) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setCurrentSide('front')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                currentSide === 'front'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${currentSide === 'front' ? 'bg-[#ff5e00]' : 'bg-slate-300'}`} />
              Tampak Depan
            </button>
            <button
              onClick={() => setCurrentSide('back')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                currentSide === 'back'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${currentSide === 'back' ? 'bg-[#ff5e00]' : 'bg-slate-300'}`} />
              Tampak Belakang
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              title="Perkecil"
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 font-mono w-10 text-center font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              title="Perbesar"
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadMockup}
              className="px-4 py-2 rounded-xl bg-black hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#ff5e00]" />
              Export HD Lossless
            </button>
          </div>
        </div>

        {/* The Interactive Mockup Viewport */}
        <div
          ref={viewportRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative aspect-4/5 w-full bg-radial from-slate-100 via-slate-200/90 to-slate-300/80 rounded-3xl border border-slate-300/80 shadow-inner overflow-hidden select-none flex items-center justify-center p-6"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          {/* Subtle Grid backdrop */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#475569 1px, transparent 1px), radial-gradient(#475569 1px, #f8fafc 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Garment Title Tag */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl text-xs font-extrabold text-slate-900 shadow-sm border border-slate-200 flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#ff5e00] animate-pulse" />
            <span>{garmentDef.name}</span>
            <span className="text-slate-400 font-normal">•</span>
            <span className="text-slate-500 font-semibold">{currentSide === 'front' ? 'Depan' : 'Belakang'}</span>
          </div>

          {/* Hint Overlay */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl text-[10px] text-slate-500 flex items-center gap-1 pointer-events-none">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Geser logo untuk estimasi harga otomatis
          </div>

          {/* SVG Garment Mockup Layer */}
          <div className="w-full h-full max-w-[520px] max-h-[620px] relative pointer-events-none">
            <MockupSVG
              type={selectedGarment}
              side={currentSide}
              colors={colors}
              lighting={lighting}
            />
          </div>

          {/* Graphic & Text Elements Layer */}
          <div className="absolute inset-0 pointer-events-auto">
            {currentSideGraphics.map((g) => {
              const isSelected = g.id === selectedGraphicId
              const calc = calculateGraphicPrice(g.scale)
              return (
                <div
                  key={g.id}
                  onMouseDown={(e) => handleMouseDown(e, g.id)}
                  style={{
                    left: `${g.x}%`,
                    top: `${g.y}%`,
                    transform: `translate(-50%, -50%) rotate(${g.rotation}deg) scale(${g.scale})`,
                    transformOrigin: 'center center',
                  }}
                  className={`absolute cursor-move select-none transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-[#ff5e00] ring-offset-2 ring-offset-transparent'
                      : 'hover:ring-1 hover:ring-[#ff5e00]/60'
                  }`}
                >
                  {/* Element Content */}
                  {g.type === 'image' ? (
                    <div className="relative group">
                      <img
                        src={g.content}
                        alt="graphic"
                        className={`max-w-[140px] max-h-[140px] object-contain drop-shadow-md pointer-events-none ${
                          g.technique === 'bordir'
                            ? 'filter drop-shadow-[1px_2px_1px_rgba(0,0,0,0.5)]'
                            : ''
                        }`}
                      />
                      {/* Price badge indicator */}
                      <span className="absolute -top-3 -right-2 bg-black text-[#ff5e00] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                        {calc.sizeCategory.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: g.textColor || '#ffffff',
                        fontFamily: g.fontFamily || 'Montserrat',
                        fontSize: `${g.fontSize || 22}px`,
                      }}
                      className="font-black whitespace-nowrap text-center drop-shadow-md px-2 py-0.5"
                    >
                      {g.content}
                    </div>
                  )}

                  {/* Active controls UI */}
                  {isSelected && (
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black text-white px-2.5 py-1 rounded-xl text-[10px] shadow-xl backdrop-blur-xs whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScaleGraphic(-0.1)
                        }}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold"
                      >
                        -
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScaleGraphic(0.1)
                        }}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRotateGraphic(15)
                        }}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
                      >
                        <RotateCw className="w-3 h-3 inline" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGraphic(g.id)
                        }}
                        className="px-1.5 py-0.5 bg-red-600 rounded text-white"
                      >
                        <Trash2 className="w-3 h-3 inline" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Call-To-Action Banner */}
        <div className="bg-black rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#ff5e00] uppercase tracking-wider mb-1">
              <Tag className="w-4 h-4" />
              Auto Pricing Terhitung: Rp {(garmentDef.basePrice + totalPrintCost).toLocaleString('id-ID')} / pcs
            </div>
            <h4 className="font-extrabold text-base">
              Siap Memesan Seragam {garmentDef.name}?
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Lanjut ke form untuk memilih ukuran (S-XXL), hitung diskon grosir, dan kirim ke WhatsApp.
            </p>
          </div>

          <button
            onClick={onApplyToOrder}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all transform hover:scale-105 shadow-md shadow-[#ff5e00]/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            Lanjut ke Form Pemesanan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
