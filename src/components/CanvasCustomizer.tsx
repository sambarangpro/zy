import React, { useState, useRef, useEffect } from 'react'
import type {
  ViewSide,
  CanvasGraphic,
  StudioLighting,
  MockupTemplate,
} from '../types'
import {
  POSITION_PRESETS,
  PRINT_ZONES,
  calculateGraphicPrice,
} from '../data/garments'
import {
  Upload,
  Type,
  Trash2,
  Download,
  ArrowRight,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Flag,
  Sun,
  Waves,
  Tag,
  Copy,
  FlipHorizontal,
  FlipVertical,
  AlignCenter,
  Grid,
  PlusCircle,
} from 'lucide-react'

interface CanvasCustomizerProps {
  activeMockup: MockupTemplate | null
  graphics: CanvasGraphic[]
  onGraphicsChange: (graphics: CanvasGraphic[]) => void
  onOpenDashboard: () => void
  onApplyToOrder: () => void
}

export const CanvasCustomizer: React.FC<CanvasCustomizerProps> = ({
  activeMockup,
  graphics,
  onGraphicsChange,
  onOpenDashboard,
  onApplyToOrder,
}) => {
  // 4 Sudut Pandang
  const [currentSide, setCurrentSide] = useState<ViewSide>('front')
  const [selectedGraphicId, setSelectedGraphicId] = useState<string | null>(null)
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [activeControlTab, setActiveControlTab] = useState<'design' | 'lighting' | 'layers'>('design')

  // Studio Lighting & 3D Shadow controls
  const [lighting, setLighting] = useState<StudioLighting>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    shadowDepth: 30,
  })

  // Dragging & Resizing State
  const [dragState, setDragState] = useState<{
    mode: 'move' | 'resize' | 'rotate' | null
    handle?: string
    startX: number
    startY: number
    initialGraphicX: number
    initialGraphicY: number
    initialScale: number
    initialRotation: number
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    initialGraphicX: 0,
    initialGraphicY: 0,
    initialScale: 1,
    initialRotation: 0,
  })

  // Text tool state
  const [inputText, setInputText] = useState('')
  const [textFont, setTextFont] = useState('Montserrat, sans-serif')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textTechnique, setTextTechnique] = useState<'bordir' | 'sablon'>('bordir')

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentSideGraphics = graphics.filter((g) => g.side === currentSide)
  const selectedGraphic = graphics.find((g) => g.id === selectedGraphicId)
  const currentPrintZones = PRINT_ZONES.filter((z) => z.side === currentSide)

  // Get current active angle image from active mockup
  const currentMockupImage = activeMockup
    ? currentSide === 'front'
      ? activeMockup.frontImg
      : currentSide === 'back'
      ? activeMockup.backImg
      : currentSide === 'left'
      ? activeMockup.leftImg
      : activeMockup.rightImg
    : undefined

  // Keyboard navigation for selected graphic (Nudge & Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedGraphicId) return
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDeleteGraphic(selectedGraphicId)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        nudgeGraphic(0, e.shiftKey ? -5 : -1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        nudgeGraphic(0, e.shiftKey ? 5 : 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nudgeGraphic(e.shiftKey ? -5 : -1, 0)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nudgeGraphic(e.shiftKey ? 5 : 1, 0)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        handleDuplicateGraphic(selectedGraphicId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedGraphicId, graphics])

  const nudgeGraphic = (dx: number, dy: number) => {
    if (!selectedGraphicId) return
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === selectedGraphicId) {
          return {
            ...g,
            x: Math.max(5, Math.min(95, g.x + dx)),
            y: Math.max(5, Math.min(95, g.y + dy)),
          }
        }
        return g
      })
    )
  }

  // Calculate live total print cost
  const totalPrintCost = graphics.reduce((sum, g) => {
    const calc = calculateGraphicPrice(g.scale)
    return sum + calc.price
  }, 0)

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
      x: currentSide === 'front' ? 68 : 50,
      y: currentSide === 'front' ? 32 : 40,
      scale: 0.55,
      scaleX: 1,
      scaleY: 1,
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
        scaleX: 1,
        scaleY: 1,
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
      scaleX: 1,
      scaleY: 1,
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

  // Duplicate selected graphic
  const handleDuplicateGraphic = (id: string) => {
    const item = graphics.find((g) => g.id === id)
    if (!item) return

    const duplicated: CanvasGraphic = {
      ...item,
      id: 'copy_' + Date.now(),
      x: Math.min(85, item.x + 4),
      y: Math.min(85, item.y + 4),
      label: (item.label || 'Elemen') + ' (Copy)',
    }
    onGraphicsChange([...graphics, duplicated])
    setSelectedGraphicId(duplicated.id)
  }

  // Flip Horizontal
  const handleFlipHorizontal = (id: string) => {
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === id) {
          const currentScaleX = g.scaleX || 1
          return { ...g, scaleX: currentScaleX * -1 }
        }
        return g
      })
    )
  }

  // Flip Vertical
  const handleFlipVertical = (id: string) => {
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === id) {
          const currentScaleY = g.scaleY || 1
          return { ...g, scaleY: currentScaleY * -1 }
        }
        return g
      })
    )
  }

  // Align Center (Horizontal)
  const handleAlignCenter = (id: string) => {
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === id) return { ...g, x: 50 }
        return g
      })
    )
  }

  // Layer Ordering
  const handleBringToFront = (id: string) => {
    const item = graphics.find((g) => g.id === id)
    if (!item) return
    const rest = graphics.filter((g) => g.id !== id)
    onGraphicsChange([...rest, item])
  }

  const handleSendToBack = (id: string) => {
    const item = graphics.find((g) => g.id === id)
    if (!item) return
    const rest = graphics.filter((g) => g.id !== id)
    onGraphicsChange([item, ...rest])
  }

  // ----------------------------------------------------
  // MOUSE DRAG / RESIZE / ROTATE ENGINE
  // ----------------------------------------------------
  const handleStartMove = (e: React.MouseEvent, gId: string) => {
    e.stopPropagation()
    setSelectedGraphicId(gId)
    const g = graphics.find((item) => item.id === gId)
    if (!g) return

    setDragState({
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      initialGraphicX: g.x,
      initialGraphicY: g.y,
      initialScale: g.scale,
      initialRotation: g.rotation,
    })
  }

  const handleStartResize = (e: React.MouseEvent, gId: string, handleName: string) => {
    e.stopPropagation()
    const g = graphics.find((item) => item.id === gId)
    if (!g) return

    setDragState({
      mode: 'resize',
      handle: handleName,
      startX: e.clientX,
      startY: e.clientY,
      initialGraphicX: g.x,
      initialGraphicY: g.y,
      initialScale: g.scale,
      initialRotation: g.rotation,
    })
  }

  const handleStartRotate = (e: React.MouseEvent, gId: string) => {
    e.stopPropagation()
    const g = graphics.find((item) => item.id === gId)
    if (!g || !viewportRef.current) return

    setDragState({
      mode: 'rotate',
      startX: e.clientX,
      startY: e.clientY,
      initialGraphicX: g.x,
      initialGraphicY: g.y,
      initialScale: g.scale,
      initialRotation: g.rotation,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.mode || !selectedGraphicId || !viewportRef.current) return

    const rect = viewportRef.current.getBoundingClientRect()
    const deltaPixelX = e.clientX - dragState.startX
    const deltaPixelY = e.clientY - dragState.startY

    if (dragState.mode === 'move') {
      const deltaPercentX = (deltaPixelX / rect.width) * 100
      const deltaPercentY = (deltaPixelY / rect.height) * 100

      const newX = Math.max(5, Math.min(95, dragState.initialGraphicX + deltaPercentX))
      const newY = Math.max(8, Math.min(92, dragState.initialGraphicY + deltaPercentY))

      onGraphicsChange(
        graphics.map((g) => {
          if (g.id === selectedGraphicId) {
            return { ...g, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }
          }
          return g
        })
      )
    } else if (dragState.mode === 'resize') {
      const scaleDelta = (deltaPixelX + deltaPixelY) / 200
      const newScale = Math.max(0.3, Math.min(2.5, dragState.initialScale + scaleDelta))
      const roundedScale = parseFloat(newScale.toFixed(2))
      const calc = calculateGraphicPrice(roundedScale)

      onGraphicsChange(
        graphics.map((g) => {
          if (g.id === selectedGraphicId) {
            return {
              ...g,
              scale: roundedScale,
              sizeCategory: calc.sizeCategory,
              calculatedPrice: calc.price,
            }
          }
          return g
        })
      )
    } else if (dragState.mode === 'rotate') {
      const g = graphics.find((item) => item.id === selectedGraphicId)
      if (!g) return

      const graphicPixelCenterX = rect.left + (g.x / 100) * rect.width
      const graphicPixelCenterY = rect.top + (g.y / 100) * rect.height

      const rad = Math.atan2(e.clientY - graphicPixelCenterY, e.clientX - graphicPixelCenterX)
      let deg = Math.round((rad * 180) / Math.PI) + 90
      if (deg < 0) deg += 360

      onGraphicsChange(
        graphics.map((item) => {
          if (item.id === selectedGraphicId) {
            return { ...item, rotation: deg % 360 }
          }
          return item
        })
      )
    }
  }

  const handleMouseUp = () => {
    setDragState({
      mode: null,
      startX: 0,
      startY: 0,
      initialGraphicX: 0,
      initialGraphicY: 0,
      initialScale: 1,
      initialRotation: 0,
    })
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === viewportRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      setSelectedGraphicId(null)
    }
  }

  // Export Lossless HD Mockup
  const handleDownloadMockup = () => {
    if (!viewportRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = 1600
    canvas.height = 1900
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const drawGraphicsOnCanvas = () => {
      currentSideGraphics.forEach((g) => {
        const posX = (g.x / 100) * canvas.width
        const posY = (g.y / 100) * canvas.height
        const scaleX = (g.scaleX || 1) * g.scale
        const scaleY = (g.scaleY || 1) * g.scale

        ctx.save()
        ctx.translate(posX, posY)
        ctx.rotate((g.rotation * Math.PI) / 180)
        ctx.scale(scaleX, scaleY)

        if (g.type === 'text') {
          ctx.font = `bold ${(g.fontSize || 22) * 2.6}px ${g.fontFamily || 'Montserrat'}`
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
      link.download = `ZY_Studio_${activeMockup?.name || 'Mockup'}_${currentSide}_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    if (currentMockupImage) {
      const customImg = new Image()
      customImg.crossOrigin = 'anonymous'
      customImg.onload = () => {
        ctx.drawImage(customImg, 0, 0, canvas.width, canvas.height)
        drawGraphicsOnCanvas()
      }
      customImg.src = currentMockupImage
    } else {
      drawGraphicsOnCanvas()
    }
  }

  // Lighting filter style
  const filterStyle = {
    filter: `brightness(${1 + lighting.brightness / 100}) contrast(${1 + lighting.contrast / 100}) saturate(${1 + lighting.saturation / 100})`,
  }

  // JIKA BELUM ADA MOCKUP SAMA SEKALI (Empty State)
  if (!activeMockup) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#ff5e00] flex items-center justify-center shadow-xs">
          <PlusCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">
            Belum Ada Mockup Seragam yang Dipilih
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Sesuai permintaan Anda, seluruh mockup default bawaan telah dinonaktifkan. Silakan buka <b>Dashboard Editor Mockup</b> untuk membuat dan meng-upload foto realistis seragam Anda sendiri (Depan, Belakang, Kiri, Kanan).
          </p>
        </div>
        <button
          onClick={onOpenDashboard}
          className="px-6 py-3.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 flex items-center gap-2 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          Buka Dashboard & Upload Mockup Anda
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* ----------------- LEFT PANEL: CONTROLS & TOOLS (4 cols) ----------------- */}
      <div className="xl:col-span-4 flex flex-col gap-4 order-2 xl:order-1">
        {/* Mockup Card (Sleek & Ringkas) */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-2xl bg-black text-[#ff5e00] flex items-center justify-center font-black text-sm shrink-0">
              ZY
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff5e00] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  {activeMockup.category}
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  Rp {activeMockup.basePrice.toLocaleString('id-ID')}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 truncate mt-0.5">
                {activeMockup.name}
              </h4>
            </div>
          </div>

          <button
            onClick={onOpenDashboard}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
          >
            Ganti Mockup
          </button>
        </div>

        {/* Tabbed Tools Panel */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 flex flex-col gap-4">
          {/* Tabs Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveControlTab('design')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeControlTab === 'design'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#ff5e00]" />
              + Desain
            </button>
            <button
              onClick={() => setActiveControlTab('lighting')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeControlTab === 'lighting'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-[#ff5e00]" />
              Studio
            </button>
            <button
              onClick={() => setActiveControlTab('layers')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeControlTab === 'layers'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#ff5e00]" />
              Lapisan {graphics.length > 0 && `(${graphics.length})`}
            </button>
          </div>

          {/* TAB 1: DESIGN (Logo, Presets, Teks) */}
          {activeControlTab === 'design' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Upload image button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 bg-orange-50/70 hover:bg-orange-100/80 text-[#ff5e00] font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 transition-all border-2 border-dashed border-orange-200 hover:border-[#ff5e00] cursor-pointer group"
                >
                  <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Upload File Logo / Gambar Anda</span>
                  <span className="text-[10px] text-slate-400 font-normal">PNG transparan / JPG</span>
                </button>
              </div>

              {/* Quick Preset Badges */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddPresetLogo('flag')}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-red-500" />
                  + Bendera RI
                </button>
                <button
                  onClick={() => handleAddPresetLogo('k3')}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block" />
                  + Logo K3
                </button>
              </div>

              {/* Teks Kustom */}
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-[#ff5e00]" />
                    Tambah Tulisan / Teks
                  </span>
                  <div className="flex bg-slate-200 p-0.5 rounded-lg text-[10px]">
                    <button
                      onClick={() => setTextTechnique('bordir')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                        textTechnique === 'bordir' ? 'bg-white text-black shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Bordir
                    </button>
                    <button
                      onClick={() => setTextTechnique('sablon')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
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
                    placeholder="Contoh: NAMA / INSTANSI"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
                  />
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    title="Pilih warna teks"
                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <button
                    onClick={handleAddText}
                    className="px-3.5 py-2 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Pasang
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 text-[11px]">Jenis Font:</span>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium"
                  >
                    <option value="Montserrat, sans-serif">Montserrat (Modern)</option>
                    <option value="'Oswald', sans-serif">Oswald (Bold)</option>
                    <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech)</option>
                    <option value="'Impact', sans-serif">Impact (Solid)</option>
                  </select>
                </div>
              </div>

              {/* Preset Posisi Cepat (jika ada elemen yang dipilih) */}
              {selectedGraphic && (
                <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl animate-in fade-in">
                  <p className="text-[11px] font-bold text-orange-950 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#ff5e00]" />
                      Posisi Cepat "{selectedGraphic.label || 'Elemen'}":
                    </span>
                    <span className="text-[10px] text-[#ff5e00] font-mono font-bold">
                      {selectedGraphic.sizeCategory?.split(' ')[0]}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {POSITION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPresetPosition(preset)}
                        className="px-2.5 py-1 bg-white hover:bg-orange-100 text-orange-950 border border-orange-300/80 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STUDIO LIGHTING */}
          {activeControlTab === 'lighting' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Efek & Pencahayaan Mockup</span>
                <button
                  onClick={() =>
                    setLighting({ brightness: 0, contrast: 0, saturation: 0, shadowDepth: 30 })
                  }
                  className="text-[11px] text-[#ff5e00] font-bold hover:underline cursor-pointer"
                >
                  Reset Default
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Kecerahan (Brightness)</span>
                    <span className="font-mono text-black font-bold">{lighting.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={lighting.brightness}
                    onChange={(e) => setLighting({ ...lighting, brightness: parseInt(e.target.value) })}
                    className="w-full accent-[#ff5e00] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Kontras (Contrast)</span>
                    <span className="font-mono text-black font-bold">{lighting.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={lighting.contrast}
                    onChange={(e) => setLighting({ ...lighting, contrast: parseInt(e.target.value) })}
                    className="w-full accent-[#ff5e00] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Saturasi Warna Kain</span>
                    <span className="font-mono text-black font-bold">{lighting.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={lighting.saturation}
                    onChange={(e) => setLighting({ ...lighting, saturation: parseInt(e.target.value) })}
                    className="w-full accent-[#ff5e00] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Waves className="w-3 h-3 text-[#ff5e00]" />
                      Efek Bayangan Lipatan Kain
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
                    className="w-full accent-[#ff5e00] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYERS (Lapisan Terpasang) */}
          {activeControlTab === 'layers' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  Titik Terpasang ({graphics.length})
                </span>
                <span className="text-xs font-black text-[#ff5e00]">
                  +Rp {totalPrintCost.toLocaleString('id-ID')}
                </span>
              </div>

              {graphics.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada logo atau teks yang dipasang di seragam.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
                        className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#ff5e00] bg-orange-50/50 text-orange-950 font-bold shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {g.type === 'image' ? (
                            <img
                              src={g.content}
                              alt="preview"
                              className="w-7 h-7 object-contain bg-slate-100 rounded-lg border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 bg-black text-[#ff5e00] font-black flex items-center justify-center rounded-lg text-xs">
                              T
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-extrabold truncate text-black text-[11px]">
                              {idx + 1}. {g.label || g.content}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-mono text-[#ff5e00] font-bold">
                                {calc.sizeCategory.split(' ')[0]}
                              </span>
                              <span>• {g.side.toUpperCase()}</span>
                              <span>• Rp {calc.price.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBringToFront(g.id)
                            }}
                            title="Naikkan Lapisan"
                            className="p-1 text-slate-400 hover:text-black rounded"
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteGraphic(g.id)
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ----------------- RIGHT PANEL: MOCKUP CANVAS VIEWPORT (8 cols) ----------------- */}
      <div className="xl:col-span-8 flex flex-col gap-3 order-1 xl:order-2">
        {/* Top Viewport Header Toolbar - 4 Sudut Pandang & Tools */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* 4 View Angles Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
            {[
              { id: 'front' as ViewSide, label: 'Depan' },
              { id: 'back' as ViewSide, label: 'Belakang' },
              { id: 'left' as ViewSide, label: 'Sisi Kiri' },
              { id: 'right' as ViewSide, label: 'Sisi Kanan' },
            ].map((side) => {
              const isActive = currentSide === side.id
              const count = graphics.filter((g) => g.side === side.id).length
              return (
                <button
                  key={side.id}
                  onClick={() => setCurrentSide(side.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'text-slate-600 hover:text-black hover:bg-slate-200/50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-[#ff5e00]' : 'bg-slate-300'
                    }`}
                  />
                  {side.label}
                  {count > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-orange-500/20 text-[#ff5e00]' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              title="Garis Batas Sablon Aman"
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showGuidelines
                  ? 'bg-orange-50 text-[#ff5e00] border-orange-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Garis Sablon</span>
            </button>

            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="Perkecil Kanvas"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-700 font-mono w-10 text-center font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="Perbesar Kanvas"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleDownloadMockup}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
              title="Download gambar mockup HD"
            >
              <Download className="w-3.5 h-3.5 text-[#ff5e00]" />
              <span className="hidden sm:inline">Export HD</span>
            </button>

            <button
              onClick={onApplyToOrder}
              className="px-3.5 py-2 rounded-xl bg-[#ff5e00] hover:bg-[#e05300] text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ml-1"
            >
              Form Order
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* The Expansive Interactive Mockup Viewport Canvas */}
        <div
          ref={viewportRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative w-full h-[620px] sm:h-[720px] md:h-[780px] xl:h-[840px] bg-gradient-to-b from-slate-100 via-slate-200/60 to-slate-300/50 rounded-3xl border border-slate-300/80 shadow-inner overflow-hidden select-none flex items-center justify-center p-4 sm:p-8"
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
            <span>{activeMockup.name}</span>
            <span className="text-slate-400 font-normal">•</span>
            <span className="text-slate-600 font-bold uppercase">{currentSide}</span>
          </div>

          {/* Print Zone Safe Guidelines */}
          {showGuidelines && (
            <div className="absolute inset-0 pointer-events-none">
              {currentPrintZones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.width}%`,
                    height: `${zone.height}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute border border-dashed border-[#ff5e00]/50 rounded-xl bg-[#ff5e00]/5 flex items-start justify-center p-1"
                >
                  <span className="text-[9px] font-mono font-bold text-[#ff5e00] bg-white/90 px-1 rounded shadow-2xs">
                    {zone.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* User's Realistic Mockup Photo for Current Side (EXPANSIVE) */}
          <div
            className="w-full h-full max-w-[700px] max-h-[780px] relative pointer-events-none flex items-center justify-center transition-transform"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {currentMockupImage ? (
              <img
                src={currentMockupImage}
                alt={`${activeMockup.name} - ${currentSide}`}
                style={filterStyle}
                className="w-full h-full object-contain select-none drop-shadow-md"
              />
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-3xl max-w-sm pointer-events-auto bg-white/80 backdrop-blur-xs">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-extrabold text-slate-800">
                  Foto {currentSide.toUpperCase()} Belum Di-upload
                </p>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">
                  Anda belum meng-upload foto sisi ini untuk "{activeMockup.name}".
                </p>
                <button
                  onClick={onOpenDashboard}
                  className="px-4 py-2 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Upload Foto di Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Graphic & Text Elements Layer */}
          <div
            className="absolute inset-0 pointer-events-auto"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {currentSideGraphics.map((g) => {
              const isSelected = g.id === selectedGraphicId
              const calc = calculateGraphicPrice(g.scale)
              const scaleX = (g.scaleX || 1) * g.scale
              const scaleY = (g.scaleY || 1) * g.scale

              return (
                <div
                  key={g.id}
                  style={{
                    left: `${g.x}%`,
                    top: `${g.y}%`,
                    transform: `translate(-50%, -50%) rotate(${g.rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                  className={`absolute select-none cursor-move ${
                    isSelected ? 'z-30' : 'z-10'
                  }`}
                >
                  {/* Floating Action Toolbar on Top of Selected Object */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black text-white px-2.5 py-1 rounded-2xl text-[10px] shadow-2xl backdrop-blur-xs whitespace-nowrap z-50 border border-slate-700"
                    >
                      <button
                        onClick={() => handleDuplicateGraphic(g.id)}
                        title="Duplikat (Ctrl+D)"
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFlipHorizontal(g.id)}
                        title="Balik Horizontal (Mirror)"
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFlipVertical(g.id)}
                        title="Balik Vertikal"
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAlignCenter(g.id)}
                        title="Rata Tengah Horizontal"
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3 bg-slate-700 mx-0.5" />
                      <button
                        onClick={() => handleBringToFront(g.id)}
                        title="Bawa ke Paling Depan"
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSendToBack(g.id)}
                        title="Kirim ke Paling Belakang"
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white text-[9px] font-bold"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => handleDeleteGraphic(g.id)}
                        title="Hapus (Delete)"
                        className="p-1 bg-red-600/80 hover:bg-red-600 rounded text-white ml-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Main Bounding Box */}
                  <div
                    onMouseDown={(e) => handleStartMove(e, g.id)}
                    className={`relative p-1 transition-all ${
                      isSelected
                        ? 'border-2 border-[#ff5e00] rounded-lg shadow-sm'
                        : 'hover:border hover:border-[#ff5e00]/60 rounded-lg'
                    }`}
                  >
                    {/* Content Image / Text */}
                    <div
                      style={{
                        transform: `scale(${scaleX}, ${scaleY})`,
                        transformOrigin: 'center center',
                      }}
                      className="pointer-events-none"
                    >
                      {g.type === 'image' ? (
                        <div className="relative">
                          <img
                            src={g.content}
                            alt="graphic"
                            className={`max-w-[140px] max-h-[140px] object-contain drop-shadow-md select-none ${
                              g.technique === 'bordir'
                                ? 'filter drop-shadow-[1px_2px_1px_rgba(0,0,0,0.5)]'
                                : ''
                            }`}
                          />
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
                    </div>

                    {/* Pro Bounding Box Handles when Selected */}
                    {isSelected && (
                      <>
                        {/* Top Rotation Handle */}
                        <div
                          onMouseDown={(e) => handleStartRotate(e, g.id)}
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#ff5e00] border-2 border-white rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-125 transition-transform"
                          title="Putar Objek Bebas"
                        >
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#ff5e00]" />

                        {/* 4 Corner Resize Handles */}
                        <div
                          onMouseDown={(e) => handleStartResize(e, g.id, 'nw')}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-sm cursor-nwse-resize shadow-xs hover:scale-125"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, g.id, 'ne')}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-sm cursor-nesw-resize shadow-xs hover:scale-125"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, g.id, 'sw')}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-sm cursor-nesw-resize shadow-xs hover:scale-125"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, g.id, 'se')}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-sm cursor-nwse-resize shadow-xs hover:scale-125"
                        />

                        {/* Bottom Tag indicator */}
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black text-[#ff5e00] text-[9px] font-mono font-bold px-1.5 rounded-full shadow-xs whitespace-nowrap">
                          {calc.sizeCategory.split(' ')[0]} • Rp {calc.price.toLocaleString('id-ID')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA Banner (Sleek & Compact) */}
        <div className="bg-black rounded-3xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#ff5e00] flex items-center justify-center shrink-0 border border-slate-800">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Harga / Pcs:</span>
                <span className="text-base font-black text-[#ff5e00]">
                  Rp {(activeMockup.basePrice + totalPrintCost).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Dasar Rp {activeMockup.basePrice.toLocaleString('id-ID')} + Sablon/Bordir Rp {totalPrintCost.toLocaleString('id-ID')})
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Model: <b>{activeMockup.name}</b> • {graphics.length} titik desain terpasang
              </p>
            </div>
          </div>

          <button
            onClick={onApplyToOrder}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            Lanjut ke Form Pemesanan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
