import React, { useState, useRef, useEffect } from 'react'
import type {
  GarmentColorParts,
  GarmentType,
  ViewSide,
  CanvasGraphic,
  StudioLighting,
  CustomMockupImages,
} from '../types'
import {
  GARMENTS,
  COLOR_PALETTE,
  POSITION_PRESETS,
  PRINT_ZONES,
  calculateGraphicPrice,
} from '../data/garments'
import { MockupSVG } from './MockupSVG'
import {
  Upload,
  Type,
  Trash2,
  Download,
  ArrowRight,
  Check,
  Palette,
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
  Image as ImageIcon,
  Grid,
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
  // 4 View Angles (Depan, Belakang, Kiri, Kanan)
  const [currentSide, setCurrentSide] = useState<ViewSide>('front')
  const [activePart, setActivePart] = useState<keyof GarmentColorParts>('body')
  const [selectedGraphicId, setSelectedGraphicId] = useState<string | null>(null)
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  // Custom User Real Mockup Photos (Front, Back, Left, Right)
  const [customMockups, setCustomMockups] = useState<CustomMockupImages>(() => {
    try {
      const saved = localStorage.getItem('zy_custom_mockups')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [useCustomMockupPhoto, setUseCustomMockupPhoto] = useState<boolean>(false)
  const [isMockupUploadModalOpen, setIsMockupUploadModalOpen] = useState<boolean>(false)

  // Studio Lighting & 3D Shadow controls
  const [lighting, setLighting] = useState<StudioLighting>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    shadowDepth: 35,
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
  const mockupInputRef = useRef<HTMLInputElement>(null)
  const [targetMockupSide, setTargetMockupSide] = useState<ViewSide>('front')

  const garmentDef = GARMENTS.find((g) => g.id === selectedGarment) || GARMENTS[0]
  const currentSideGraphics = graphics.filter((g) => g.side === currentSide)
  const selectedGraphic = graphics.find((g) => g.id === selectedGraphicId)
  const currentPrintZones = PRINT_ZONES.filter((z) => z.side === currentSide)

  // Save custom mockups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zy_custom_mockups', JSON.stringify(customMockups))
    } catch {}
  }, [customMockups])

  // Keyboard navigation for selected graphic (Nudge & Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedGraphicId) return
      // Ignore if typing inside input / textarea
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

  // Color changing handler
  const handleColorChange = (hex: string) => {
    onColorsChange({
      ...colors,
      [activePart]: hex,
    })
  }

  // Handle Mockup Photo Upload (User's realistic mockup)
  const handleMockupPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setCustomMockups((prev) => ({
        ...prev,
        [targetMockupSide]: dataUrl,
      }))
      setUseCustomMockupPhoto(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
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

  // Layer Ordering (Bring to Front / Send to Back)
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
      // Calculate distance change
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
      let deg = Math.round((rad * 180) / Math.PI) + 90 // Adjust for top handle
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
    if (e.target === viewportRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setSelectedGraphicId(null)
    }
  }

  // Export Lossless HD Mockup
  const handleDownloadMockup = () => {
    if (!viewportRef.current) return
    const svgElement = viewportRef.current.querySelector('svg')

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
      link.download = `ZY_Clothes_${selectedGarment}_${currentSide}_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    if (useCustomMockupPhoto && customMockups[currentSide]) {
      const customImg = new Image()
      customImg.crossOrigin = 'anonymous'
      customImg.onload = () => {
        ctx.drawImage(customImg, 0, 0, canvas.width, canvas.height)
        drawGraphicsOnCanvas()
      }
      customImg.src = customMockups[currentSide]!
    } else if (svgElement) {
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        drawGraphicsOnCanvas()
        URL.revokeObjectURL(blobURL)
      }
      img.src = blobURL
    }
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
      {/* Hidden file input for uploading custom realistic mockup photo */}
      <input
        ref={mockupInputRef}
        type="file"
        accept="image/*"
        onChange={handleMockupPhotoUpload}
        className="hidden"
      />

      {/* ----------------- LEFT PANEL: CONTROLS & PALETTES (5 cols) ----------------- */}
      <div className="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
        {/* Tombol Spesial: Ganti / Upload Mockup Gambar Sendiri */}
        <div className="bg-gradient-to-r from-slate-900 to-black text-white rounded-3xl p-4 shadow-sm border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff5e00] flex items-center justify-center text-white">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white">Mockup Realistis Anda Sendiri</h4>
              <p className="text-[10px] text-slate-400">
                {customMockups[currentSide]
                  ? `Foto ${currentSide} aktif terpasang`
                  : 'Gunakan foto mockup nyata Anda (Depan, Belakang, Kiri, Kanan)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMockupUploadModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-black font-extrabold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Kelola Mockup
          </button>
        </div>

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

        {/* 2. Warna Kain & Pencahayaan Studio */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#ff5e00]" />
              Warna Kain & Pencahayaan
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

          {/* Kontrol Pencahayaan Studio */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#ff5e00]" />
                Pencahayaan Studio & Tekstur
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

        {/* 3. Upload Logo & Teks */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#ff5e00]" />
              Tambah Logo & Teks
            </h3>
            <span className="text-[10px] bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full font-bold">
              Tampak {currentSide}
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
                  Tambah Teks Nama / Komunitas
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
                  placeholder="Contoh: TEKNIK MESIN / PT TELKOM"
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
                  className="bg-black hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
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

        {/* 4. Daftar Elemen & Tarif Otomatis */}
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
                          <span>• {g.side.toUpperCase()} • Rp {calc.price.toLocaleString('id-ID')}</span>
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
        {/* Top Viewport Header Toolbar - 4 Sudut Pandang */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
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
                      : 'text-slate-600 hover:text-black'
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
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Garis Bantu / Print Zone */}
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              title="Tampilkan / Sembunyikan Garis Batas Sablon Aman"
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                showGuidelines
                  ? 'bg-orange-50 text-[#ff5e00] border-orange-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Garis Panduan</span>
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              title="Perkecil"
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 font-mono w-9 text-center font-bold">
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
              className="px-3.5 py-2 rounded-xl bg-black hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#ff5e00]" />
              Export HD
            </button>
          </div>
        </div>

        {/* The Interactive Mockup Viewport Canvas */}
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
            <span>
              {useCustomMockupPhoto && customMockups[currentSide]
                ? 'Mockup Foto Custom'
                : garmentDef.name}
            </span>
            <span className="text-slate-400 font-normal">•</span>
            <span className="text-slate-600 font-bold uppercase">{currentSide}</span>
          </div>

          {/* Print Zone Safe Guidelines (Dashed box overlay) */}
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

          {/* Base Mockup Layer (SVG or User's Custom Photo) */}
          <div className="w-full h-full max-w-[520px] max-h-[620px] relative pointer-events-none">
            <MockupSVG
              type={selectedGarment}
              side={currentSide}
              colors={colors}
              lighting={lighting}
              customImage={useCustomMockupPhoto ? customMockups[currentSide] : undefined}
            />
          </div>

          {/* Graphic & Text Elements Layer */}
          <div className="absolute inset-0 pointer-events-auto">
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
                        {/* Connecting stem line */}
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

        {/* Bottom CTA Banner */}
        <div className="bg-black rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#ff5e00] uppercase tracking-wider mb-1">
              <Tag className="w-4 h-4" />
              Auto Pricing Terhitung: Rp{' '}
              {(garmentDef.basePrice + totalPrintCost).toLocaleString('id-ID')} / pcs
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

      {/* MODAL KELOLA MOCKUP REALISTIS SENDIRI */}
      {isMockupUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ff5e00] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Kelola Mockup Foto Realistis Anda
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload gambar baju asli (Depan, Belakang, Sisi Kiri, Sisi Kanan)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMockupUploadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Toggle Mode Mockup */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Aktifkan Foto Mockup Sendiri</p>
                <p className="text-[11px] text-slate-500">
                  Gunakan foto realistis Anda sebagai pengganti mockup vektor bawaan
                </p>
              </div>
              <input
                type="checkbox"
                checked={useCustomMockupPhoto}
                onChange={(e) => setUseCustomMockupPhoto(e.target.checked)}
                className="w-5 h-5 accent-[#ff5e00] cursor-pointer"
              />
            </div>

            {/* 4 Angle Upload Slots */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'front' as ViewSide, label: 'Tampak Depan' },
                { id: 'back' as ViewSide, label: 'Tampak Belakang' },
                { id: 'left' as ViewSide, label: 'Tampak Sisi Kiri' },
                { id: 'right' as ViewSide, label: 'Tampak Sisi Kanan' },
              ].map((sideSlot) => {
                const img = customMockups[sideSlot.id]
                return (
                  <div
                    key={sideSlot.id}
                    className="p-3 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-slate-800">{sideSlot.label}</span>
                    <div className="w-full aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                      {img ? (
                        <img src={img} alt={sideSlot.label} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono text-center px-2">
                          Belum ada foto
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setTargetMockupSide(sideSlot.id)
                        mockupInputRef.current?.click()
                      }}
                      className="w-full py-1.5 px-2 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] transition-colors"
                    >
                      {img ? 'Ganti Foto' : '+ Upload Foto'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setIsMockupUploadModalOpen(false)}
                className="px-5 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Selesai & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
