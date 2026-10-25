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
  Layers,
  ZoomIn,
  ZoomOut,
  Flag,
  Sun,
  Copy,
  FlipHorizontal,
  FlipVertical,
  AlignCenter,
  Grid,
  PlusCircle,
  MousePointer,
  X,
  ChevronUp,
  ChevronDown,
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
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(true)
  const [activeFlyout, setActiveFlyout] = useState<'text' | 'lighting' | 'presets' | null>(null)

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

  // Keyboard navigation & Photoshop shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return

      if (selectedGraphicId) {
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

      if (e.key === 'Escape') {
        setSelectedGraphicId(null)
        setActiveFlyout(null)
      } else if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        setActiveFlyout(null)
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        setActiveFlyout('text')
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
      <div className="bg-[#18181b] text-white rounded-3xl p-12 text-center border border-slate-800 shadow-2xl flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-3xl bg-orange-500/10 text-[#ff5e00] flex items-center justify-center shadow-xs border border-orange-500/20">
          <PlusCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-white">
            Belum Ada Mockup Seragam yang Dipilih
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Silakan buka <b>Editor Mockup</b> untuk membuat dan meng-upload foto realistis seragam Anda sendiri (Depan, Belakang, Kiri, Kanan) atau gunakan template demo.
          </p>
        </div>
        <button
          onClick={onOpenDashboard}
          className="px-6 py-3.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 flex items-center gap-2 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          Buka Editor Mockup
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#121214] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none flex flex-col min-h-[820px] text-slate-100">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* ---------------------------------------------------- */}
      {/* 1. TOP OPTIONS & CONTEXTUAL INSPECTOR BAR (Photoshop Style) */}
      {/* ---------------------------------------------------- */}
      <div className="h-14 bg-[#18181b] border-b border-slate-800 px-4 flex items-center justify-between gap-3 text-xs z-30 shrink-0">
        {/* Left: View Angles Switcher & Mockup Pill */}
        <div className="flex items-center gap-2">
          {/* Angles Switcher */}
          <div className="flex items-center bg-[#0d0d0f] p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'front', label: 'Depan' },
                { id: 'back', label: 'Belakang' },
                { id: 'left', label: 'Kiri' },
                { id: 'right', label: 'Kanan' },
              ] as const
            ).map((side) => {
              const count = graphics.filter((g) => g.side === side.id).length
              const isActive = currentSide === side.id
              return (
                <button
                  key={side.id}
                  onClick={() => {
                    setCurrentSide(side.id)
                    setSelectedGraphicId(null)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#ff5e00] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {side.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-black text-[#ff5e00]' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Active Mockup Indicator & Switcher */}
          <button
            onClick={onOpenDashboard}
            title="Klik untuk ganti mockup seragam"
            className="hidden sm:flex items-center gap-2 bg-[#0d0d0f] hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500/10 text-[#ff5e00] border border-orange-500/20">
              {activeMockup.category}
            </span>
            <span className="font-bold text-xs truncate max-w-[130px] text-white">
              {activeMockup.name}
            </span>
            <span className="text-[10px] text-slate-400 hover:text-orange-400 underline underline-offset-2 ml-1">
              Ganti
            </span>
          </button>
        </div>

        {/* Center: Dynamic Contextual Inspector */}
        <div className="hidden lg:flex items-center gap-2.5 bg-[#0d0d0f] px-3.5 py-1.5 rounded-xl border border-slate-800/80">
          {selectedGraphic ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5e00] bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  {selectedGraphic.type === 'text' ? 'Teks' : 'Logo/Gambar'}
                </span>
                <span className="font-bold text-slate-200 text-xs truncate max-w-[100px]">
                  {selectedGraphic.label || 'Elemen'}
                </span>
              </div>

              <div className="h-4 w-px bg-slate-800" />

              {/* Technique Switcher */}
              <div className="flex items-center bg-[#18181b] p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => {
                    onGraphicsChange(
                      graphics.map((g) =>
                        g.id === selectedGraphic.id ? { ...g, technique: 'bordir' } : g
                      )
                    )
                  }}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                    selectedGraphic.technique === 'bordir'
                      ? 'bg-[#ff5e00] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bordir
                </button>
                <button
                  onClick={() => {
                    onGraphicsChange(
                      graphics.map((g) =>
                        g.id === selectedGraphic.id ? { ...g, technique: 'sablon' } : g
                      )
                    )
                  }}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                    selectedGraphic.technique === 'sablon'
                      ? 'bg-[#ff5e00] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sablon
                </button>
              </div>

              {/* Text specific controls */}
              {selectedGraphic.type === 'text' && (
                <>
                  <div className="h-4 w-px bg-slate-800" />
                  <select
                    value={selectedGraphic.fontFamily || 'Montserrat, sans-serif'}
                    onChange={(e) => {
                      onGraphicsChange(
                        graphics.map((g) =>
                          g.id === selectedGraphic.id ? { ...g, fontFamily: e.target.value } : g
                        )
                      )
                    }}
                    className="bg-[#18181b] border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 outline-hidden"
                  >
                    <option value="Montserrat, sans-serif">Montserrat</option>
                    <option value="Oswald, sans-serif">Oswald</option>
                    <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="serif">Playfair</option>
                  </select>

                  {/* Text Color Picker */}
                  <label
                    title="Ganti Warna Teks"
                    className="w-6 h-6 rounded-lg border border-slate-700 cursor-pointer flex items-center justify-center overflow-hidden shrink-0 shadow-xs"
                    style={{ backgroundColor: selectedGraphic.textColor || '#ffffff' }}
                  >
                    <input
                      type="color"
                      value={selectedGraphic.textColor || '#ffffff'}
                      onChange={(e) => {
                        onGraphicsChange(
                          graphics.map((g) =>
                            g.id === selectedGraphic.id ? { ...g, textColor: e.target.value } : g
                          )
                        )
                      }}
                      className="opacity-0 w-0 h-0 cursor-pointer"
                    />
                  </label>
                </>
              )}

              <div className="h-4 w-px bg-slate-800" />

              {/* Transform Quick Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAlignCenter(selectedGraphic.id)}
                  title="Rata Tengah Horizontal"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleFlipHorizontal(selectedGraphic.id)}
                  title="Balik Horizontal (Mirror)"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleFlipVertical(selectedGraphic.id)}
                  title="Balik Vertikal"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicateGraphic(selectedGraphic.id)}
                  title="Duplikat Elemen (Ctrl+D)"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteGraphic(selectedGraphic.id)}
                  title="Hapus Elemen (Delete)"
                  className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-800" />

              {/* Pricing Pill */}
              <div className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedGraphic.sizeCategory?.split(' ')[0]} • Rp{' '}
                {selectedGraphic.calculatedPrice?.toLocaleString('id-ID')}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Studio Aktif • Pilih elemen di kanvas untuk mengatur bordir/sablon, warna & ukuran
              </span>
            </div>
          )}
        </div>

        {/* Right: Zoom, Grid, HD Export & Order Button */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-[#0d0d0f] rounded-xl border border-slate-800 p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, parseFloat((z - 0.1).toFixed(1))))}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Perkecil Kanvas"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
              title="Reset Zoom ke 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, parseFloat((z + 0.1).toFixed(1))))}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Perbesar Kanvas"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Layers Panel Button */}
          <button
            onClick={() => setShowLayersPanel((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              showLayersPanel
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-[#0d0d0f] border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Buka / Tutup Panel Layers"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Export HD Button */}
          <button
            onClick={handleDownloadMockup}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0d0d0f] hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Download Desain Gambar HD (PNG)"
          >
            <Download className="w-3.5 h-3.5 text-[#ff5e00]" />
            <span className="hidden sm:inline">Export HD</span>
          </button>

          {/* Order CTA Button */}
          <button
            onClick={onApplyToOrder}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ff5e00] hover:bg-[#e05300] text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#ff5e00]/25 cursor-pointer shrink-0"
          >
            <span className="hidden sm:inline">Pesan Seragam</span>
            <span className="sm:hidden">Pesan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE (Photoshop Layout) */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex relative overflow-hidden bg-[#0d0d0f]">
        {/* LEFT VERTICAL TOOLBAR (56px) */}
        <div className="w-14 bg-[#18181b] border-r border-slate-800 flex flex-col items-center py-3 gap-2.5 z-20 shrink-0">
          {/* Tool: Move / Select (V) */}
          <button
            onClick={() => {
              setActiveFlyout(null)
            }}
            title="Alat Seleksi & Geser (V)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeFlyout === null
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <MousePointer className="w-5 h-5" />
          </button>

          {/* Tool: Upload Image (U) */}
          <button
            onClick={() => {
              setActiveFlyout(null)
              fileInputRef.current?.click()
            }}
            title="Unggah Logo / Gambar Desain (U)"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer relative group"
          >
            <Upload className="w-5 h-5" />
            <span className="absolute left-14 bg-black text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-800 shadow-xl">
              Unggah Gambar (U)
            </span>
          </button>

          {/* Tool: Type Tool (T) */}
          <button
            onClick={() => setActiveFlyout((prev) => (prev === 'text' ? null : 'text'))}
            title="Alat Teks Sablon / Bordir (T)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeFlyout === 'text'
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="absolute left-14 bg-black text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-800 shadow-xl">
              Teks Tulisan (T)
            </span>
          </button>

          {/* Tool: Emblem Presets */}
          <button
            onClick={() => setActiveFlyout((prev) => (prev === 'presets' ? null : 'presets'))}
            title="Emblem Cepat & Posisi Presets"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeFlyout === 'presets'
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Flag className="w-5 h-5" />
            <span className="absolute left-14 bg-black text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-800 shadow-xl">
              Preset Emblem & Posisi
            </span>
          </button>

          {/* Tool: Studio Lighting */}
          <button
            onClick={() => setActiveFlyout((prev) => (prev === 'lighting' ? null : 'lighting'))}
            title="Pencahayaan Studio & Bayangan"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeFlyout === 'lighting'
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="absolute left-14 bg-black text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-800 shadow-xl">
              Studio Lighting
            </span>
          </button>

          <div className="w-6 h-px bg-slate-800 my-1" />

          {/* Tool: Safe Guidelines Toggle */}
          <button
            onClick={() => setShowGuidelines((prev) => !prev)}
            title="Garis Panduan / Safe Print Zones"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              showGuidelines
                ? 'bg-slate-800 text-orange-400 border border-slate-700'
                : 'text-slate-500 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="absolute left-14 bg-black text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-800 shadow-xl">
              Garis Panduan Sablon
            </span>
          </button>
        </div>

        {/* FLOATING FLYOUT MENUS (Positioned right next to toolbar) */}
        {activeFlyout === 'text' && (
          <div className="absolute left-16 top-3 z-40 w-80 bg-[#18181b] border border-slate-700 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide">Alat Teks Sablon / Bordir</h4>
              </div>
              <button
                onClick={() => setActiveFlyout(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Isi Tulisan
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                  placeholder="Contoh: ZY APPAREL, LOGISTIK..."
                  autoFocus
                  className="w-full bg-[#0d0d0f] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#ff5e00]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Jenis Font
                </label>
                <select
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="w-full bg-[#0d0d0f] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="Montserrat, sans-serif">Montserrat (Modern Clean)</option>
                  <option value="Oswald, sans-serif">Oswald (Tegas Bold)</option>
                  <option value="'Bebas Neue', sans-serif">Bebas Neue (Display)</option>
                  <option value="Impact, sans-serif">Impact (Solid Tebal)</option>
                  <option value="Roboto, sans-serif">Roboto (Casual)</option>
                  <option value="serif">Playfair (Elegan)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Warna Tulisan
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    '#ffffff',
                    '#000000',
                    '#eab308',
                    '#ef4444',
                    '#3b82f6',
                    '#22c55e',
                    '#ff5e00',
                    '#a855f7',
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-lg border-2 cursor-pointer transition-transform hover:scale-110 ${
                        textColor === color ? 'border-[#ff5e00] scale-110 shadow-sm' : 'border-slate-700'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-6 h-6 rounded-lg border border-slate-700 cursor-pointer p-0 bg-transparent"
                    title="Pilih Warna Kustom"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Teknik Cetak
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTextTechnique('bordir')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      textTechnique === 'bordir'
                        ? 'bg-[#ff5e00] border-[#ff5e00] text-white shadow-sm'
                        : 'bg-[#0d0d0f] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    🧵 Bordir Komputer
                  </button>
                  <button
                    onClick={() => setTextTechnique('sablon')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      textTechnique === 'sablon'
                        ? 'bg-[#ff5e00] border-[#ff5e00] text-white shadow-sm'
                        : 'bg-[#0d0d0f] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    🎨 Sablon DTF
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  handleAddText()
                  setActiveFlyout(null)
                }}
                disabled={!inputText.trim()}
                className="w-full mt-2 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Pasang Teks ke Kanvas
              </button>
            </div>
          </div>
        )}

        {/* FLOATING PRESETS FLYOUT */}
        {activeFlyout === 'presets' && (
          <div className="absolute left-16 top-16 z-40 w-80 bg-[#18181b] border border-slate-700 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide">Emblem Cepat & Posisi</h4>
              </div>
              <button
                onClick={() => setActiveFlyout(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                  Emblem Standar Nasional
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleAddPresetLogo('flag')
                      setActiveFlyout(null)
                    }}
                    className="p-2.5 bg-[#0d0d0f] hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                  >
                    <div className="w-7 h-5 rounded overflow-hidden shrink-0 border border-slate-700">
                      <div className="h-2.5 bg-red-600" />
                      <div className="h-2.5 bg-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-200 group-hover:text-white">
                        Bendera RI
                      </div>
                      <div className="text-[9px] text-slate-400">Merah Putih</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleAddPresetLogo('k3')
                      setActiveFlyout(null)
                    }}
                    className="p-2.5 bg-[#0d0d0f] hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0 border border-white/40">
                      <span className="text-white text-xs font-black">+</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-200 group-hover:text-white">
                        Logo K3
                      </div>
                      <div className="text-[9px] text-slate-400">Keselamatan</div>
                    </div>
                  </button>
                </div>
              </div>

              {selectedGraphic && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                    Pindahkan ke Posisi Presisi:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {POSITION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          handleApplyPresetPosition(preset)
                          setActiveFlyout(null)
                        }}
                        className="px-2.5 py-1.5 bg-[#0d0d0f] hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <div className="font-bold text-[11px] text-slate-300">{preset.label}</div>
                        <div className="text-[9px] text-slate-500 capitalize">{preset.side}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLOATING LIGHTING FLYOUT */}
        {activeFlyout === 'lighting' && (
          <div className="absolute left-16 top-28 z-40 w-80 bg-[#18181b] border border-slate-700 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide">Studio Lighting Seragam</h4>
              </div>
              <button
                onClick={() => setActiveFlyout(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Kecerahan (Brightness)</span>
                  <span className="font-mono text-slate-200">{lighting.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  value={lighting.brightness}
                  onChange={(e) =>
                    setLighting({ ...lighting, brightness: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#ff5e00] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Kontras (Contrast)</span>
                  <span className="font-mono text-slate-200">{lighting.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  value={lighting.contrast}
                  onChange={(e) =>
                    setLighting({ ...lighting, contrast: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#ff5e00] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Saturasi Warna</span>
                  <span className="font-mono text-slate-200">{lighting.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  value={lighting.saturation}
                  onChange={(e) =>
                    setLighting({ ...lighting, saturation: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#ff5e00] cursor-pointer"
                />
              </div>

              <button
                onClick={() =>
                  setLighting({ brightness: 0, contrast: 0, saturation: 0, shadowDepth: 30 })
                }
                className="w-full py-2 bg-[#0d0d0f] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2"
              >
                Reset Efek Cahaya
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CENTER MASSIVE CANVASS VIEWPORT (Distraction-Free) */}
        {/* ---------------------------------------------------- */}
        <div
          ref={viewportRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] bg-[#101014] cursor-crosshair"
          style={{ minHeight: '680px' }}
        >
          {/* Printable Safe Zones Overlay */}
          {showGuidelines && (
            <div
              className="absolute inset-0 pointer-events-none transition-transform flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <div className="w-full h-full max-w-[680px] max-h-[760px] relative">
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
                    className="absolute border border-dashed border-orange-500/40 bg-orange-500/5 rounded-xl flex items-start justify-center p-1 pointer-events-none"
                  >
                    <span className="text-[9px] font-bold text-orange-400 bg-black/80 px-1.5 py-0.5 rounded shadow-xs">
                      {zone.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User's Realistic Mockup Photo for Current Side (MASSIVE & CRISP) */}
          <div
            className="w-full h-full max-w-[680px] max-h-[760px] relative pointer-events-none flex items-center justify-center transition-transform"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {currentMockupImage ? (
              <img
                src={currentMockupImage}
                alt={`${activeMockup.name} - ${currentSide}`}
                style={filterStyle}
                className="w-full h-full object-contain select-none drop-shadow-2xl"
              />
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-3xl max-w-sm pointer-events-auto bg-[#18181b]/90 backdrop-blur-xs">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-extrabold text-white">
                  Foto {currentSide.toUpperCase()} Belum Di-upload
                </p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">
                  Anda belum meng-upload foto sisi ini untuk "{activeMockup.name}".
                </p>
                <button
                  onClick={onOpenDashboard}
                  className="px-4 py-2 bg-[#ff5e00] hover:bg-[#e05300] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Upload Foto di Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Graphic & Text Elements Layer */}
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <div className="w-full h-full max-w-[680px] max-h-[760px] relative pointer-events-none">
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
                    className={`absolute select-none pointer-events-auto cursor-move ${
                      isSelected ? 'z-30' : 'z-10'
                    }`}
                  >
                    {/* Floating Action Quickbar on Top of Selected Object */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black text-white px-2 py-1 rounded-xl text-[10px] shadow-2xl backdrop-blur-xs whitespace-nowrap z-50 border border-slate-700"
                      >
                        <button
                          onClick={() => handleDuplicateGraphic(g.id)}
                          title="Duplikat (Ctrl+D)"
                          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFlipHorizontal(g.id)}
                          title="Balik Horizontal (Mirror)"
                          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                        >
                          <FlipHorizontal className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAlignCenter(g.id)}
                          title="Rata Tengah Horizontal"
                          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3 bg-slate-700 mx-0.5" />
                        <button
                          onClick={() => handleBringToFront(g.id)}
                          title="Bawa ke Paling Depan"
                          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Layers className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteGraphic(g.id)}
                          title="Hapus (Delete)"
                          className="p-1 bg-red-600/80 hover:bg-red-600 rounded text-white ml-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
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

                      {/* Photoshop Bounding Box Handles when Selected */}
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
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-xs cursor-nwse-resize shadow-xs hover:scale-125"
                          />
                          <div
                            onMouseDown={(e) => handleStartResize(e, g.id, 'ne')}
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-xs cursor-nesw-resize shadow-xs hover:scale-125"
                          />
                          <div
                            onMouseDown={(e) => handleStartResize(e, g.id, 'sw')}
                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-xs cursor-nesw-resize shadow-xs hover:scale-125"
                          />
                          <div
                            onMouseDown={(e) => handleStartResize(e, g.id, 'se')}
                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#ff5e00] rounded-xs cursor-nwse-resize shadow-xs hover:scale-125"
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
        </div>

        {/* ---------------------------------------------------- */}
        {/* RIGHT DOCKED LAYERS & PRICING PANEL */}
        {/* ---------------------------------------------------- */}
        {showLayersPanel && (
          <div className="w-76 xl:w-80 bg-[#18181b] border-l border-slate-800 flex flex-col justify-between shrink-0 z-20">
            {/* Panel Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide text-white">
                  Daftar Layers ({graphics.length})
                </h4>
              </div>
              <button
                onClick={() => setShowLayersPanel(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Tutup Panel Layers"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Layers List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-320px)] min-h-[260px]">
              {graphics.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Layers className="w-8 h-8 stroke-[1.5] mb-2 text-slate-600" />
                  <p className="text-xs font-bold text-slate-400">Belum Ada Elemen Desain</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gunakan tool di sebelah kiri (Upload / Teks / Emblem) untuk memasang desain seragam.
                  </p>
                </div>
              ) : (
                graphics.map((g, idx) => {
                  const isSelected = g.id === selectedGraphicId
                  const calc = calculateGraphicPrice(g.scale)
                  const isCurrentSide = g.side === currentSide

                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        setCurrentSide(g.side)
                        setSelectedGraphicId(g.id)
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-[#ff5e00]/10 border-[#ff5e00] shadow-xs'
                          : 'bg-[#0d0d0f] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-black/60 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {g.type === 'image' ? (
                          <img src={g.content} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Type className="w-4 h-4 text-orange-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono ${
                              isCurrentSide
                                ? 'bg-[#ff5e00] text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {g.side}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {g.technique}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-200 truncate mt-0.5">
                          {g.label || (g.type === 'text' ? g.content : 'Logo')}
                        </h5>
                        <div className="text-[10px] font-mono text-[#ff5e00] font-bold">
                          {calc.sizeCategory} • Rp {calc.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Z-Order & Delete Controls */}
                      <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleBringToFront(g.id)}
                          disabled={idx === graphics.length - 1}
                          title="Naikkan Layer"
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSendToBack(g.id)}
                          disabled={idx === 0}
                          title="Turunkan Layer"
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGraphic(g.id)}
                          title="Hapus Layer"
                          className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom Summary & Order CTA */}
            <div className="p-4 bg-[#121214] border-t border-slate-800 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Harga Polos Seragam:</span>
                  <span className="font-mono font-bold text-slate-200">
                    Rp {activeMockup.basePrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Biaya Sablon/Bordir ({graphics.length}):</span>
                  <span className="font-mono font-bold text-orange-400">
                    Rp {totalPrintCost.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="font-extrabold text-white">Estimasi Total / Pcs:</span>
                  <span className="font-mono font-black text-base text-[#ff5e00]">
                    Rp {(activeMockup.basePrice + totalPrintCost).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={onApplyToOrder}
                className="w-full py-3 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut ke Form Pemesanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. BOTTOM STATUS BAR (Photoshop Pro Status) */}
      {/* ---------------------------------------------------- */}
      <div className="h-7 bg-[#0e0e10] border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none z-10 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-[#ff5e00]" />
          <span className="font-bold text-slate-300">ZY STUDIO PRO</span>
          <span className="text-slate-600">•</span>
          <span className="truncate">
            {activeMockup.name} ({activeMockup.category})
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span>Sudut: <strong className="text-white uppercase">{currentSide}</strong></span>
          <span className="text-slate-600">•</span>
          <span>{currentSideGraphics.length} Layer di sudut ini</span>
          <span className="text-slate-600">•</span>
          <span>Zoom: <strong className="text-white">{Math.round(zoomLevel * 100)}%</strong></span>
        </div>

        <div className="font-bold text-[#ff5e00]">
          Total: Rp {(activeMockup.basePrice + totalPrintCost).toLocaleString('id-ID')} / pcs
        </div>
      </div>
    </div>
  )
}
