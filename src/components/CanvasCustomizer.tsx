import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type {
  ViewSide,
  CanvasGraphic,
  StudioLighting,
  MockupTemplate,
  ColorablePart,
  PrintZone,
  PrintSizeCategory,
} from '../types'
import {
  POSITION_PRESETS,
  PRINT_ZONES,
  calculateGraphicPrice,
  getGraphicPriceForZoneOrScale,
} from '../data/garments'
import { saveMockup } from '../services/mockupStorage'
import {
  Upload,
  Type,
  Trash2,
  Download,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
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
  Paintbrush,
  Eraser,
  RotateCcw,
  RotateCw,
  Wand2,
  Scissors,
  Palette,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  GripVertical,
  Check,
  Search,
  Edit3,
} from 'lucide-react'
import {
  FABRIC_COLOR_DATABASE,
  FABRIC_CATALOGS,
  findClosestFabricSwatch,
} from '../data/fabricColors'
import { GarmentPartIcon, getGarmentIconForPart } from '../data/garmentIcons'

interface CanvasCustomizerProps {
  activeMockup: MockupTemplate | null
  graphics: CanvasGraphic[]
  onGraphicsChange: (graphics: CanvasGraphic[]) => void
  onOpenDashboard: (targetPartId?: string, targetSide?: ViewSide) => void
  onApplyToOrder: () => void
  onMockupUpdate?: (updatedMockup: MockupTemplate) => void
}

// Emblem Bordir Bendera Indonesia Standar PDH Nasional (dengan bordir tepi dan jahitan benang emas realistis)
export const INDONESIA_FLAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64" width="96" height="64"><rect x="2" y="2" width="92" height="60" rx="4" fill="#0f172a" stroke="#d97706" stroke-width="2.5"/><rect x="4" y="4" width="88" height="28" rx="1.5" fill="#dc2626"/><rect x="4" y="32" width="88" height="28" rx="1.5" fill="#f8fafc"/><rect x="5.5" y="5.5" width="85" height="53" rx="2" fill="none" stroke="#fbbf24" stroke-width="0.9" stroke-dasharray="2.5 1.5"/></svg>`

export const INDONESIA_FLAG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(INDONESIA_FLAG_SVG)}`

export const CanvasCustomizer: React.FC<CanvasCustomizerProps> = ({
  activeMockup,
  graphics,
  onGraphicsChange,
  onOpenDashboard,
  onApplyToOrder,
  onMockupUpdate,
}) => {
  // 4 Sudut Pandang
  const [currentSide, setCurrentSide] = useState<ViewSide>('front')
  const [selectedGraphicId, setSelectedGraphicId] = useState<string | null>(null)
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(true)
  const [activeFlyout, setActiveFlyout] = useState<
    'text' | 'lighting' | 'presets' | 'brush' | 'colorParts' | null
  >(null)

  // Active Tool: 'select' | 'brush' | 'eraser' | 'palette'
  const [activeTool, setActiveTool] = useState<'select' | 'brush' | 'eraser' | 'palette'>('select')

  // Part Colors per defined part ID: { [partId: string]: hexColor }
  const [partColors, setPartColors] = useState<Record<string, string>>({})

  // Warna Dasar Keseluruhan Seragam (Layer Paling Bawah - Menggantikan warna keseluruhan kecuali layer aktif)
  const [baseGarmentColor, setBaseGarmentColor] = useState<string>(
    () => activeMockup?.defaultBaseColor || '#1e3a8a'
  )
  const [isBaseColorHidden, setIsBaseColorHidden] = useState<boolean>(false)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (activeMockup?.defaultBaseColor) {
      setBaseGarmentColor(activeMockup.defaultBaseColor)
    }
  }, [activeMockup?.id])

  // Visibility layer masker bagian seragam (fungsi mata-mata setiap bagian kain)
  const [hiddenColorPartKeys, setHiddenColorPartKeys] = useState<string[]>([])

  // Pop-up Katalog Warna Kain Resmi untuk layer bagian yang diklik
  const [activeColorPickerGroupKey, setActiveColorPickerGroupKey] = useState<string | null>(null)
  const [fabricCatalogFilter, setFabricCatalogFilter] = useState<string>('all')
  const [fabricSearchQuery, setFabricSearchQuery] = useState<string>('')

  const handleToggleColorPartVisibility = (groupKey: string) => {
    pushHistorySnapshot()
    setHiddenColorPartKeys((prev) =>
      prev.includes(groupKey) ? prev.filter((k) => k !== groupKey) : [...prev, groupKey]
    )
  }

  // Clipping Mask: Kunci gambar & kuas agar tidak keluar dari siluet seragam
  const [isClippingMaskActive, setIsClippingMaskActive] = useState<boolean>(
    activeMockup?.enableClippingMask ?? true
  )

  // Brush settings: ukuran, warna, blend mode, opacity
  const [brushSize, setBrushSize] = useState<number>(10)
  const [brushColor, setBrushColor] = useState<string>('#1e3a8a') // Default Navy
  const [brushOpacity, setBrushOpacity] = useState<number>(100)
  const [brushBlendMode, setBrushBlendMode] = useState<'multiply' | 'source-over'>('multiply')

  // Paint storage per side (dataURL string) & undo history
  const [paintLayers, setPaintLayers] = useState<Record<ViewSide, string | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  })

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
  // Global active technique preference for uploads & new graphics (Bordir vs Sablon)
  const [activeTechnique, setActiveTechnique] = useState<'bordir' | 'sablon'>('bordir')
  const [textTechnique, setTextTechnique] = useState<'bordir' | 'sablon'>('bordir')
  const [hiddenGraphicIds, setHiddenGraphicIds] = useState<string[]>([])
  const [draggedGraphicId, setDraggedGraphicId] = useState<string | null>(null)
  const [dragOverGraphicId, setDragOverGraphicId] = useState<string | null>(null)

  // Target print safe zone when user initiates upload from a specific zone on canvas
  const [targetZoneForUpload, setTargetZoneForUpload] = useState<PrintZone | null>(null)

  // Upload configuration modal state: shows dialog choosing between Bordir and Sablon + target zone
  const [uploadModalData, setUploadModalData] = useState<{
    dataUrl: string
    fileName: string
    targetZoneId: string | 'custom'
    technique: 'bordir' | 'sablon'
  } | null>(null)

  // Snapshot format untuk Global Unified Undo/Redo (mencakup SEMUA tindakan di kanvas)
  interface CustomizerSnapshot {
    graphics: CanvasGraphic[]
    partColors: Record<string, string>
    hiddenColorPartKeys: string[]
    paintLayers: Record<ViewSide, string | null>
    hiddenGraphicIds: string[]
    activeSide?: ViewSide
    baseGarmentColor?: string
    isBaseColorHidden?: boolean
  }

  // Canvas Global Undo/Redo History Stack (Tombol Batalkan / Kembalikan SEMUA tindakan)
  const [unifiedUndoStack, setUnifiedUndoStack] = useState<CustomizerSnapshot[]>([])
  const [unifiedRedoStack, setUnifiedRedoStack] = useState<CustomizerSnapshot[]>([])
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false)

  // Ambil snapshot status studio kanvas saat ini
  const takeCurrentSnapshot = (): CustomizerSnapshot => ({
    graphics: JSON.parse(JSON.stringify(graphics)),
    partColors: { ...partColors },
    hiddenColorPartKeys: [...hiddenColorPartKeys],
    paintLayers: { ...paintLayers },
    hiddenGraphicIds: [...hiddenGraphicIds],
    activeSide: currentSide,
    baseGarmentColor,
    isBaseColorHidden,
  })

  // Simpan riwayat tindakan ke undo stack sebelum perubahan dilakukan
  const pushHistorySnapshot = (customState?: Partial<CustomizerSnapshot>) => {
    const current = customState ? { ...takeCurrentSnapshot(), ...customState } : takeCurrentSnapshot()
    setUnifiedUndoStack((prev) => [...prev.slice(-40), current])
    setUnifiedRedoStack([])
  }

  const updateGraphicsWithHistory = (newGraphics: CanvasGraphic[]) => {
    pushHistorySnapshot()
    onGraphicsChange(newGraphics)
  }

  // Batalkan tindakan apapun (Undo Global)
  const handleGlobalUndo = () => {
    if (unifiedUndoStack.length === 0) return
    const current = takeCurrentSnapshot()
    const prev = unifiedUndoStack[unifiedUndoStack.length - 1]

    setUnifiedUndoStack((s) => s.slice(0, -1))
    setUnifiedRedoStack((s) => [...s.slice(-40), current])

    onGraphicsChange(prev.graphics)
    setPartColors(prev.partColors)
    setHiddenColorPartKeys(prev.hiddenColorPartKeys)
    setPaintLayers(prev.paintLayers)
    setHiddenGraphicIds(prev.hiddenGraphicIds)
    if (prev.baseGarmentColor !== undefined) {
      setBaseGarmentColor(prev.baseGarmentColor)
    }
    if (prev.isBaseColorHidden !== undefined) {
      setIsBaseColorHidden(prev.isBaseColorHidden)
    }
    if (prev.activeSide && prev.activeSide !== currentSide) {
      setCurrentSide(prev.activeSide)
    }
  }

  // Kembalikan tindakan apapun (Redo Global)
  const handleGlobalRedo = () => {
    if (unifiedRedoStack.length === 0) return
    const current = takeCurrentSnapshot()
    const next = unifiedRedoStack[unifiedRedoStack.length - 1]

    setUnifiedRedoStack((s) => s.slice(0, -1))
    setUnifiedUndoStack((s) => [...s.slice(-40), current])

    onGraphicsChange(next.graphics)
    setPartColors(next.partColors)
    setHiddenColorPartKeys(next.hiddenColorPartKeys)
    setPaintLayers(next.paintLayers)
    setHiddenGraphicIds(next.hiddenGraphicIds)
    if (next.baseGarmentColor !== undefined) {
      setBaseGarmentColor(next.baseGarmentColor)
    }
    if (next.isBaseColorHidden !== undefined) {
      setIsBaseColorHidden(next.isBaseColorHidden)
    }
    if (next.activeSide && next.activeSide !== currentSide) {
      setCurrentSide(next.activeSide)
    }
  }

  // Quick Alignment standard for uniform embroidery & printing
  const handleQuickAlign = (
    presetId: 'left_chest' | 'right_chest' | 'center_back' | 'center_chest'
  ) => {
    if (!selectedGraphicId) return
    const preset = POSITION_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      handleApplyPresetPosition(preset)
    }
  }

  // Magic Wand Tool: 1-click background remover for logos/images (JPG/PNG)
  const handleRemoveWhiteBackground = (graphicId: string) => {
    const g = graphics.find((item) => item.id === graphicId)
    if (!g || g.type !== 'image') return

    setIsRemovingBg(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setIsRemovingBg(false)
          return
        }
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imgData.data

        // Convert white and near-white pixels to transparent with anti-aliasing
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const gVal = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          if (a === 0) continue

          if (r > 230 && gVal > 230 && b > 230) {
            data[i + 3] = 0 // completely transparent
          } else if (r > 212 && gVal > 212 && b > 212) {
            // Anti-aliasing soft edge feathering
            const factor = (230 - Math.min(r, gVal, b)) / 18
            data[i + 3] = Math.round(a * Math.max(0, Math.min(1, factor)))
          }
        }

        ctx.putImageData(imgData, 0, 0)
        const cleanDataUrl = canvas.toDataURL('image/png')
        updateGraphicsWithHistory(
          graphics.map((item) =>
            item.id === graphicId ? { ...item, content: cleanDataUrl } : item
          )
        )
      } catch (err) {
        console.error('Error in handleRemoveWhiteBackground:', err)
      } finally {
        setIsRemovingBg(false)
      }
    }
    img.onerror = () => {
      setIsRemovingBg(false)
    }
    img.src = g.content
  }

  // Brush drawing runtime state
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const paintCanvasRef = useRef<HTMLCanvasElement>(null)

  const currentSideGraphics = graphics.filter((g) => g.side === currentSide)
  const selectedGraphic = graphics.find((g) => g.id === selectedGraphicId)
  const currentPrintZones = useMemo(() => {
    const zones =
      activeMockup?.printZones && activeMockup.printZones.length > 0
        ? activeMockup.printZones
        : PRINT_ZONES
    return zones.filter((z) => z.side === currentSide)
  }, [activeMockup?.printZones, currentSide])

  // Proyeksi Otomatis Lengan Kiri & Kanan Lintas Sudut Pandang (Depan, Samping, Belakang)
  // Satu kali upload di sisi mana saja langsung otomatis tampil di tampak depan secara menyamping 3D realistis & rapi!
  const sleeveProjectedGraphics = useMemo(() => {
    if (currentSide !== 'front' && currentSide !== 'back') {
      return []
    }

    const projected: Array<{
      graphic: CanvasGraphic
      sourceSide: 'left' | 'right'
      isWearerLeft: boolean
      isViewerRight: boolean
      x: number
      y: number
      scaleX: number
      scaleY: number
      rotationX: number
      rotationY: number
      rotationZ: number
      enableAutoClipping: boolean
    }> = []

    graphics.forEach((g) => {
      if (hiddenGraphicIds.includes(g.id)) return

      // 1. Jika ada logo di Lengan Kiri (Wearer's Left Arm)
      if (g.side === 'left') {
        // Di Tampak Depan: lengan kiri pemakai terlihat di sebelah KANAN layar (Viewer Right, x > 50)
        // Di Tampak Belakang: lengan kiri pemakai terlihat di sebelah KIRI layar (Viewer Left, x < 50)
        const isViewerRight = currentSide === 'front'
        const matchingSleeveZone = currentPrintZones.find((z) => {
          const n = z.name.toLowerCase()
          if (isViewerRight) {
            return (n.includes('lengan kiri') || n.includes('bahu kiri')) || (z.x > 50 && (n.includes('lengan') || n.includes('sleeve') || n.includes('bahu')))
          } else {
            return (n.includes('lengan kiri') || n.includes('bahu kiri')) || (z.x < 50 && (n.includes('lengan') || n.includes('sleeve') || n.includes('bahu')))
          }
        })

        // Base anchor titik tengah kain lengan (bukan tepi terluar agar tidak menggantung di luar kain)
        const baseX = matchingSleeveZone ? matchingSleeveZone.x : (isViewerRight ? 77 : 23)
        const baseY = matchingSleeveZone ? matchingSleeveZone.y : 34

        // Presisi offset horizontal & vertikal mengikuti pergeseran pengguna di Tampak Samping (g.x dan g.y)
        const offsetX = ((g.x - 50) / 50) * 4.5
        const offsetY = ((g.y - 35) / 50) * 16

        // Batasi batas aman agar desain selalu berada di atas kain lengan
        const minX = isViewerRight ? 50 : 2
        const maxX = isViewerRight ? 98 : 50
        const anchorX = Math.max(minX, Math.min(maxX, baseX + (isViewerRight ? -offsetX : offsetX)))
        const anchorY = Math.max(5, Math.min(95, baseY + offsetY))

        const baseScale = g.scale || 0.8
        const flipX = g.scaleX || 1
        const flipY = g.scaleY || 1

        const rotX =
          g.rotationX !== undefined && g.rotationX !== 0
            ? g.rotationX
            : matchingSleeveZone?.rotationX !== undefined
            ? matchingSleeveZone.rotationX
            : 0

        const rotY =
          g.rotationY !== undefined && g.rotationY !== 0
            ? g.rotationY
            : matchingSleeveZone?.rotationY !== undefined && matchingSleeveZone.rotationY !== 0
            ? matchingSleeveZone.rotationY
            : isViewerRight
            ? -35
            : 35

        const rotZ =
          g.rotationZ !== undefined && g.rotationZ !== 0
            ? g.rotationZ
            : g.rotation !== undefined && g.rotation !== 0
            ? g.rotation
            : matchingSleeveZone?.rotationZ !== undefined
            ? matchingSleeveZone.rotationZ
            : 0

        const autoClip = matchingSleeveZone?.enableAutoClipping ?? g.enableAutoClipping ?? true

        projected.push({
          graphic: g,
          sourceSide: 'left',
          isWearerLeft: true,
          isViewerRight,
          x: Math.round(anchorX * 10) / 10,
          y: Math.round(anchorY * 10) / 10,
          // Kompresi horizontal tampak menyamping yang rapi, simetris, dan tegak (tidak miring/penyok)
          scaleX: Number((baseScale * flipX * 0.62).toFixed(3)),
          scaleY: Number((baseScale * flipY * 0.86).toFixed(3)),
          rotationX: rotX,
          rotationY: rotY,
          rotationZ: rotZ,
          enableAutoClipping: autoClip,
        })
      }

      // 2. Jika ada logo di Lengan Kanan (Wearer's Right Arm)
      if (g.side === 'right') {
        // Di Tampak Depan: lengan kanan pemakai terlihat di sebelah KIRI layar (Viewer Left, x < 50)
        // Di Tampak Belakang: lengan kanan pemakai terlihat di sebelah KANAN layar (Viewer Right, x > 50)
        const isViewerRight = currentSide === 'back'
        const matchingSleeveZone = currentPrintZones.find((z) => {
          const n = z.name.toLowerCase()
          if (isViewerRight) {
            return (n.includes('lengan kanan') || n.includes('bahu kanan')) || (z.x > 50 && (n.includes('lengan') || n.includes('sleeve') || n.includes('bahu')))
          } else {
            return (n.includes('lengan kanan') || n.includes('bahu kanan')) || (z.x < 50 && (n.includes('lengan') || n.includes('sleeve') || n.includes('bahu')))
          }
        })

        // Base anchor titik tengah kain lengan (bukan tepi terluar agar tidak menggantung di luar kain)
        const baseX = matchingSleeveZone ? matchingSleeveZone.x : (isViewerRight ? 77 : 23)
        const baseY = matchingSleeveZone ? matchingSleeveZone.y : 34

        // Presisi offset horizontal & vertikal mengikuti pergeseran pengguna di Tampak Samping (g.x dan g.y)
        const offsetX = ((g.x - 50) / 50) * 4.5
        const offsetY = ((g.y - 35) / 50) * 16

        // Batasi batas aman agar desain selalu berada di atas kain lengan
        const minX = isViewerRight ? 50 : 2
        const maxX = isViewerRight ? 98 : 50
        const anchorX = Math.max(minX, Math.min(maxX, baseX + (isViewerRight ? -offsetX : offsetX)))
        const anchorY = Math.max(5, Math.min(95, baseY + offsetY))

        const baseScale = g.scale || 0.8
        const flipX = g.scaleX || 1
        const flipY = g.scaleY || 1

        const rotX =
          g.rotationX !== undefined && g.rotationX !== 0
            ? g.rotationX
            : matchingSleeveZone?.rotationX !== undefined
            ? matchingSleeveZone.rotationX
            : 0

        const rotY =
          g.rotationY !== undefined && g.rotationY !== 0
            ? g.rotationY
            : matchingSleeveZone?.rotationY !== undefined && matchingSleeveZone.rotationY !== 0
            ? matchingSleeveZone.rotationY
            : isViewerRight
            ? -35
            : 35

        const rotZ =
          g.rotationZ !== undefined && g.rotationZ !== 0
            ? g.rotationZ
            : g.rotation !== undefined && g.rotation !== 0
            ? g.rotation
            : matchingSleeveZone?.rotationZ !== undefined
            ? matchingSleeveZone.rotationZ
            : 0

        const autoClip = matchingSleeveZone?.enableAutoClipping ?? g.enableAutoClipping ?? true

        projected.push({
          graphic: g,
          sourceSide: 'right',
          isWearerLeft: false,
          isViewerRight,
          x: Math.round(anchorX * 10) / 10,
          y: Math.round(anchorY * 10) / 10,
          // Kompresi horizontal tampak menyamping yang rapi, simetris, dan tegak (tidak miring/penyok)
          scaleX: Number((baseScale * flipX * 0.62).toFixed(3)),
          scaleY: Number((baseScale * flipY * 0.86).toFixed(3)),
          rotationX: rotX,
          rotationY: rotY,
          rotationZ: rotZ,
          enableAutoClipping: autoClip,
        })
      }
    })

    return projected
  }, [graphics, currentSide, hiddenGraphicIds, currentPrintZones])

  // Sync clipping mask when activeMockup changes
  useEffect(() => {
    if (activeMockup?.enableClippingMask !== undefined) {
      setIsClippingMaskActive(activeMockup.enableClippingMask)
    }
  }, [activeMockup?.id])

  // Toggle sync color parts across all 4 sides (Depan, Belakang, Kiri, Kanan) - default ACTIVE
  const [syncColorPartsAcrossSides, setSyncColorPartsAcrossSides] = useState<boolean>(true)

  // Sync colorable parts colors when activeMockup changes
  useEffect(() => {
    if (activeMockup?.colorParts && activeMockup.colorParts.length > 0) {
      const initial: Record<string, string> = {}
      activeMockup.colorParts.forEach((p) => {
        initial[p.id] = p.defaultColor
      })
      setPartColors((prev) => ({ ...initial, ...prev }))
    } else {
      setPartColors({})
    }
  }, [activeMockup?.id, activeMockup?.colorParts])

  // Helper: Dapatkan kunci identifikasi unik komponen lintas sudut pandang
  const getPartMatchKey = useCallback((part: ColorablePart, allParts: ColorablePart[]) => {
    if (part.groupId && part.groupId.trim()) {
      return part.groupId.trim().toLowerCase()
    }
    const cleanName = (part.name || '').trim().toLowerCase()
    if (cleanName) {
      return cleanName
    }
    const sameSide = allParts.filter((p) => p.side === part.side)
    const idx = sameSide.findIndex((p) => p.id === part.id)
    return `slot_index_${idx >= 0 ? idx : 0}`
  }, [])

  // Helper: Cari semua bagian (part) di 4 sisi yang merupakan komponen yang sama (misal: Kerah / Bagian 1)
  const findMatchingSiblingParts = useCallback(
    (targetPart: ColorablePart, allParts: ColorablePart[]): ColorablePart[] => {
      const targetKey = getPartMatchKey(targetPart, allParts)
      const targetName = (targetPart.name || '').trim().toLowerCase()

      // Ambil indeks pada sisinya sendiri
      const targetSideParts = allParts.filter((p) => p.side === targetPart.side)
      const targetIdx = targetSideParts.findIndex((p) => p.id === targetPart.id)

      return allParts.filter((p) => {
        if (p.id === targetPart.id) return true
        if (targetPart.groupId && p.groupId && targetPart.groupId === p.groupId) return true
        if (targetName && p.name && p.name.trim().toLowerCase() === targetName) return true
        if (getPartMatchKey(p, allParts) === targetKey) return true

        // Slot position match: jika urutan layer sama pada sisinya masing-masing (misal Bagian 1 / index 0)
        const pSideParts = allParts.filter((s) => s.side === p.side)
        const pIdx = pSideParts.findIndex((s) => s.id === p.id)
        if (targetIdx !== -1 && pIdx === targetIdx) return true

        return false
      })
    },
    [getPartMatchKey]
  )

  // Getter warna bagian yang selalu konsisten dan tersinkronisasi lintas sisi
  const getPartColor = useCallback(
    (part: ColorablePart): string => {
      if (partColors[part.id]) return partColors[part.id]

      const allParts = activeMockup?.colorParts || []
      const siblings = findMatchingSiblingParts(part, allParts)
      for (const sib of siblings) {
        if (partColors[sib.id]) return partColors[sib.id]
      }

      return part.defaultColor || '#1e3a8a'
    },
    [partColors, activeMockup?.colorParts, findMatchingSiblingParts]
  )

  // Handler ganti warna: Otomatis sinkronkan 4 sisi secara bersamaan
  const handlePartColorChange = (partId: string, color: string) => {
    pushHistorySnapshot()
    const allParts = activeMockup?.colorParts || []
    const targetPart = allParts.find((p) => p.id === partId)

    if (!targetPart || !syncColorPartsAcrossSides) {
      setPartColors((prev) => ({
        ...prev,
        [partId]: color,
      }))
      return
    }

    // Cari seluruh bagian yang sesuai di Depan, Belakang, Kiri, Kanan
    const siblings = findMatchingSiblingParts(targetPart, allParts)
    setPartColors((prev) => {
      const next = { ...prev }
      siblings.forEach((sib) => {
        next[sib.id] = color
      })
      next[partId] = color
      return next
    })
  }

  const handleResetPartColors = () => {
    if (activeMockup?.colorParts) {
      pushHistorySnapshot()
      const resetObj: Record<string, string> = {}
      activeMockup.colorParts.forEach((p) => {
        resetObj[p.id] = p.defaultColor
      })
      setPartColors(resetObj)
    }
  }

  // Filter color parts for currently selected angle
  const currentSideColorParts = (activeMockup?.colorParts || []).filter(
    (p) => p.side === currentSide
  )

  // Unified groups untuk palet warna komponen seragam di 4 sudut pandang
  const unifiedPartGroups = useMemo(() => {
    const allParts = activeMockup?.colorParts || []
    const groupsMap = new Map<
      string,
      {
        key: string
        name: string
        defaultColor: string
        currentColor: string
        primaryPartId: string
        parts: ColorablePart[]
        sides: ViewSide[]
        icon?: string
      }
    >()

    allParts.forEach((part) => {
      const key = getPartMatchKey(part, allParts)
      const existing = groupsMap.get(key)
      const currentColor = getPartColor(part)
      const cleanPartName = (part.name || '').trim()

      if (existing) {
        existing.parts.push(part)
        if (!existing.sides.includes(part.side)) {
          existing.sides.push(part.side)
        }
        if (partColors[part.id]) {
          existing.currentColor = partColors[part.id]
        }
        if (!existing.icon && part.icon) {
          existing.icon = part.icon
        }
        // Prioritaskan nama spesifik dari Owner Mode jika ada
        const existingIsGeneric = !existing.name || /^bagian\s*\d+$/i.test(existing.name.trim())
        const partIsGeneric = !cleanPartName || /^bagian\s*\d+$/i.test(cleanPartName)
        if (cleanPartName && (existingIsGeneric || !partIsGeneric)) {
          existing.name = cleanPartName
          if (!existing.icon || existing.icon === 'other') {
            existing.icon = part.icon || getGarmentIconForPart(cleanPartName)
          }
        }
      } else {
        groupsMap.set(key, {
          key,
          name: cleanPartName || `Bagian ${groupsMap.size + 1}`,
          defaultColor: part.defaultColor || '#1e3a8a',
          currentColor,
          primaryPartId: part.id,
          parts: [part],
          sides: [part.side],
          icon: part.icon || getGarmentIconForPart(cleanPartName),
        })
      }
    })

    return Array.from(groupsMap.values())
  }, [activeMockup?.colorParts, getPartMatchKey, getPartColor, partColors])

  // Custom Nama Layer: Bagian Kain
  const [renamingGroupKey, setRenamingGroupKey] = useState<string | null>(null)
  const [renamingGroupName, setRenamingGroupName] = useState<string>('')

  const handleStartRenameGroup = (groupKey: string, currentName: string) => {
    setRenamingGroupKey(groupKey)
    setRenamingGroupName(currentName)
  }

  const handleSaveGroupName = (groupKey: string) => {
    if (!renamingGroupKey) return
    const trimmed = renamingGroupName.trim()
    if (!trimmed || !activeMockup) {
      setRenamingGroupKey(null)
      return
    }

    const targetGroup = unifiedPartGroups.find((g) => g.key === groupKey)
    if (!targetGroup || targetGroup.name === trimmed) {
      setRenamingGroupKey(null)
      return
    }

    pushHistorySnapshot()

    const updatedColorParts = (activeMockup.colorParts || []).map((p) => {
      if (
        targetGroup.parts.some((gp) => gp.id === p.id) ||
        p.groupId === groupKey ||
        p.name === targetGroup.name
      ) {
        return { ...p, name: trimmed }
      }
      return p
    })

    const updatedMockup: MockupTemplate = {
      ...activeMockup,
      colorParts: updatedColorParts,
    }

    saveMockup(updatedMockup)
    if (onMockupUpdate) {
      onMockupUpdate(updatedMockup)
    }

    setRenamingGroupKey(null)
  }

  // Custom Nama Layer: Elemen Grafis (Logo & Teks)
  const [renamingGraphicId, setRenamingGraphicId] = useState<string | null>(null)
  const [renamingGraphicLabel, setRenamingGraphicLabel] = useState<string>('')

  const handleStartRenameGraphic = (g: CanvasGraphic) => {
    setRenamingGraphicId(g.id)
    setRenamingGraphicLabel(g.label || (g.type === 'text' ? g.content : 'Logo'))
  }

  const handleSaveGraphicLabel = (id: string) => {
    if (!renamingGraphicId) return
    const trimmed = renamingGraphicLabel.trim()
    const target = graphics.find((g) => g.id === id)
    const currentName = target?.label || (target?.type === 'text' ? target.content : 'Logo')

    if (trimmed && trimmed !== currentName) {
      updateGraphicsWithHistory(
        graphics.map((item) =>
          item.id === id ? { ...item, label: trimmed } : item
        )
      )
    }
    setRenamingGraphicId(null)
  }

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

  // Natural image dimensions for 1:1 pixel accuracy matching MockupDashboard (Zero Letterboxing Offset)
  const [mockupNaturalSize, setMockupNaturalSize] = useState<{ width: number; height: number }>({
    width: 540,
    height: 640,
  })

  useEffect(() => {
    if (!currentMockupImage) {
      setMockupNaturalSize({ width: 540, height: 640 })
      return
    }
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setMockupNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
    }
    img.src = currentMockupImage
  }, [currentMockupImage])

  const stageAspectRatio = mockupNaturalSize.width / Math.max(1, mockupNaturalSize.height)
  const MAX_STAGE_HEIGHT = 600
  const MAX_STAGE_WIDTH = 540
  let stageDisplayHeight = MAX_STAGE_HEIGHT
  let stageDisplayWidth = stageDisplayHeight * stageAspectRatio
  if (stageDisplayWidth > MAX_STAGE_WIDTH) {
    stageDisplayWidth = MAX_STAGE_WIDTH
    stageDisplayHeight = stageDisplayWidth / stageAspectRatio
  }

  // Redraw paint layer whenever currentSide changes
  useEffect(() => {
    const canvas = paintCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const currentData = paintLayers[currentSide]
    if (currentData) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = currentData
    }
  }, [currentSide, paintLayers[currentSide]])

  // Gambar Kanvas Warna Keseluruhan Seragam (Warna Dasar Paling Bawah, Tidak Menimpa Pola / Layer Aktif)
  useEffect(() => {
    const canvas = baseCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!currentMockupImage || isBaseColorHidden || !baseGarmentColor) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    let isCancelled = false
    const mockupImg = new Image()
    mockupImg.crossOrigin = 'anonymous'
    mockupImg.onload = () => {
      if (isCancelled) return
      const w = mockupImg.naturalWidth > 0 ? mockupImg.naturalWidth : 1200
      const h = mockupImg.naturalHeight > 0 ? mockupImg.naturalHeight : 1400
      canvas.width = w
      canvas.height = h

      ctx.clearRect(0, 0, w, h)

      // 1. Gambar siluet pakaian dari foto mockup
      ctx.drawImage(mockupImg, 0, 0, w, h)

      // 2. Warnai siluet pakaian dengan warna keseluruhan seragam
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = baseGarmentColor
      ctx.fillRect(0, 0, w, h)

      // 3. Potong / kecualikan bagian layer yang aktif (misal: Kerah warna kuning) agar warna layer tetap murni & tidak tertimpa
      const allParts = activeMockup?.colorParts || []
      const activePartsWithMask = currentSideColorParts.filter((p) => {
        if (!p.maskImg) return false
        const groupKey = getPartMatchKey(p, allParts)
        return !hiddenColorPartKeys.includes(groupKey) && !hiddenColorPartKeys.includes(p.id)
      })

      if (activePartsWithMask.length === 0) {
        ctx.globalCompositeOperation = 'source-over'
        return
      }

      let loadedCount = 0
      activePartsWithMask.forEach((part) => {
        const maskImg = new Image()
        maskImg.crossOrigin = 'anonymous'
        maskImg.onload = () => {
          if (isCancelled) return
          ctx.save()
          ctx.globalCompositeOperation = 'destination-out'
          ctx.drawImage(maskImg, 0, 0, w, h)
          ctx.restore()
          loadedCount++
          if (loadedCount === activePartsWithMask.length) {
            ctx.globalCompositeOperation = 'source-over'
          }
        }
        maskImg.onerror = () => {
          loadedCount++
        }
        maskImg.src = part.maskImg!
      })
    }
    mockupImg.src = currentMockupImage

    return () => {
      isCancelled = true
    }
  }, [
    currentMockupImage,
    baseGarmentColor,
    isBaseColorHidden,
    currentSideColorParts,
    hiddenColorPartKeys,
    activeMockup?.colorParts,
    getPartMatchKey,
    currentSide,
  ])

  // Keyboard navigation & Photoshop shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return

      if (e.key === 'Escape') {
        setSelectedGraphicId(null)
        setActiveFlyout(null)
        setActiveTool('select')
        return
      }

      // Hotkey V: Select tool
      if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        setActiveTool('select')
        setActiveFlyout(null)
        return
      }

      // Hotkey B: Brush tool
      if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey) {
        setActiveTool('brush')
        setActiveFlyout('brush')
        setSelectedGraphicId(null)
        return
      }

      // Hotkey E: Eraser tool
      if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
        setActiveTool('eraser')
        setActiveFlyout('brush')
        setSelectedGraphicId(null)
        return
      }

      // Hotkey T: Text tool
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        setActiveTool('select')
        setActiveFlyout('text')
        return
      }

      // Hotkey [ and ]: Brush size adjust
      if (e.key === '[') {
        setBrushSize((s) => Math.max(2, s - 2))
      } else if (e.key === ']') {
        setBrushSize((s) => Math.min(60, s + 2))
      }

      // Ctrl + Z: Undo tindakan apapun
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleGlobalUndo()
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        handleGlobalRedo()
      }

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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedGraphicId, graphics, activeTool, currentSide, unifiedUndoStack, unifiedRedoStack])

  const nudgeGraphic = (dx: number, dy: number) => {
    if (!selectedGraphicId) return
    updateGraphicsWithHistory(
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

  // ----------------------------------------------------
  // BRUSH & ERASER DRAWING ENGINE
  // ----------------------------------------------------
  const getPaintCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = paintCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const handlePaintMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'brush' && activeTool !== 'eraser') return
    const canvas = paintCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    pushHistorySnapshot()
    setIsDrawing(true)
    const coords = getPaintCoords(e)
    setLastPoint(coords)

    // Draw initial dot
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const scaledSize = brushSize * (canvas.width / 450)

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.fillStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = brushColor
      ctx.fillStyle = brushColor
      ctx.globalAlpha = brushOpacity / 100
    }

    ctx.beginPath()
    ctx.arc(coords.x, coords.y, scaledSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const handlePaintMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (activeTool !== 'brush' && activeTool !== 'eraser')) return
    const canvas = paintCanvasRef.current
    if (!canvas || !lastPoint) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords = getPaintCoords(e)

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const scaledSize = brushSize * (canvas.width / 450)
    ctx.lineWidth = scaledSize

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = brushColor
      ctx.globalAlpha = brushOpacity / 100
    }

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    ctx.restore()

    setLastPoint(coords)
  }

  const handlePaintMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setLastPoint(null)
    const canvas = paintCanvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setPaintLayers((prev) => ({
      ...prev,
      [currentSide]: dataUrl,
    }))
  }

  const handleClearPaint = () => {
    pushHistorySnapshot()
    const canvas = paintCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setPaintLayers((prev) => ({ ...prev, [currentSide]: null }))
  }

  // Calculate live total print cost (menggunakan harga zona cetak blangko jika ada)
  const totalPrintCost = graphics.reduce((sum, g) => {
    const calc = getGraphicPriceForZoneOrScale(g, activeMockup?.printZones)
    return sum + calc.price
  }, 0)

  // Helper: Deteksi apakah Bendera Indonesia sudah terpasang di seragam
  const indonesianFlag = graphics.find(
    (g) =>
      g.id.startsWith('flag_id_') ||
      (g.label && g.label.toLowerCase().includes('bendera')) ||
      (g.label && g.label.toLowerCase().includes('merah putih'))
  )

  const flagLocation: 'sleeve' | 'chest' | null = indonesianFlag
    ? indonesianFlag.side === 'right' ||
      (indonesianFlag.label && indonesianFlag.label.toLowerCase().includes('bahu')) ||
      (indonesianFlag.label && indonesianFlag.label.toLowerCase().includes('lengan'))
      ? 'sleeve'
      : 'chest'
    : null

  // Pasang atau Pindahkan Bendera Indonesia ke Bahu Kanan atau Dada Kanan (Standar PDH)
  const handleApplyIndonesianFlag = (targetLocation: 'sleeve' | 'chest') => {
    let targetSide: ViewSide = 'right'
    let targetX = 50
    let targetY = 35
    let targetScale = 0.72
    let rotX = 0
    let rotY = 0
    let rotZ = 0
    let label = 'Bendera Indonesia (Bahu Kanan)'

    if (targetLocation === 'chest') {
      targetSide = 'front'
      const chestZone = activeMockup?.printZones?.find(
        (z) => z.side === 'front' && (z.name.toLowerCase().includes('dada kanan') || (z.x < 45 && z.x > 15))
      )
      targetX = chestZone ? chestZone.x : 31
      targetY = chestZone ? chestZone.y : 28
      rotX = chestZone?.rotationX || 0
      rotY = chestZone?.rotationY !== undefined ? chestZone.rotationY : -4
      rotZ = chestZone?.rotationZ !== undefined ? chestZone.rotationZ : -7
      targetScale = 0.52
      label = 'Bendera Indonesia (Dada Kanan)'
      if (currentSide !== 'front') {
        setCurrentSide('front')
      }
    } else {
      targetSide = 'right'
      const sleeveZone = activeMockup?.printZones?.find(
        (z) => z.side === 'right' || z.name.toLowerCase().includes('lengan kanan')
      )
      targetX = sleeveZone ? sleeveZone.x : 50
      targetY = sleeveZone ? sleeveZone.y : 35
      targetScale = 0.72
      label = 'Bendera Indonesia (Bahu Kanan)'
    }

    const calc = calculateGraphicPrice(targetScale)

    if (indonesianFlag) {
      const updated = graphics.map((g) => {
        if (g.id === indonesianFlag.id) {
          return {
            ...g,
            side: targetSide,
            content: INDONESIA_FLAG_DATA_URL,
            x: targetX,
            y: targetY,
            scale: targetScale,
            rotation: rotZ,
            rotationX: rotX,
            rotationY: rotY,
            rotationZ: rotZ,
            enableAutoClipping: true,
            technique: 'bordir' as const,
            label,
            calculatedPrice: calc.price,
            sizeCategory: calc.sizeCategory,
          }
        }
        return g
      })
      updateGraphicsWithHistory(updated)
      setSelectedGraphicId(indonesianFlag.id)
    } else {
      const newFlagId = 'flag_id_' + Date.now()
      const newGraphic: CanvasGraphic = {
        id: newFlagId,
        type: 'image',
        side: targetSide,
        content: INDONESIA_FLAG_DATA_URL,
        x: targetX,
        y: targetY,
        scale: targetScale,
        scaleX: 1,
        scaleY: 1,
        rotation: rotZ,
        rotationX: rotX,
        rotationY: rotY,
        rotationZ: rotZ,
        enableAutoClipping: true,
        technique: 'bordir',
        label,
        sizeCategory: calc.sizeCategory,
        calculatedPrice: calc.price,
        opacity: 100,
        blendMode: 'normal',
        isLocked: false,
      }
      updateGraphicsWithHistory([...graphics, newGraphic])
      setSelectedGraphicId(newFlagId)
    }
  }

  const handleRemoveIndonesianFlag = () => {
    if (!indonesianFlag) return
    const filtered = graphics.filter((g) => g.id !== indonesianFlag.id)
    updateGraphicsWithHistory(filtered)
    if (selectedGraphicId === indonesianFlag.id) {
      setSelectedGraphicId(null)
    }
  }

  // Add preset badges
  const handleAddPresetLogo = (type: 'flag' | 'k3') => {
    if (type === 'flag') {
      handleApplyIndonesianFlag('sleeve')
      return
    }

    const k3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#15803d" stroke="#ffffff" stroke-width="2"/><path d="M 33 18 H 47 V 33 H 62 V 47 H 47 V 62 H 33 V 47 H 18 V 33 H 33 Z" fill="#ffffff"/></svg>`
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(k3Svg)}`
    const label = 'Emblem K3 Keselamatan'

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
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      enableAutoClipping: true,
      technique: 'bordir',
      label,
      sizeCategory: calc.sizeCategory,
      calculatedPrice: calc.price,
    }

    updateGraphicsWithHistory([...graphics, newGraphic])
    setSelectedGraphicId(newGraphic.id)
  }

  // Initiate image upload targeting a specific print zone
  const handleInitiateUploadForZone = (zone: PrintZone) => {
    setTargetZoneForUpload(zone)
    setActiveTool('select')
    setActiveFlyout(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  // Render Contoh Area Gambar Logo / Patch Realistis (Identik 1:1 dengan MockupDashboard)
  const renderSampleEmblem = (zone: PrintZone) => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-0.5 select-none pointer-events-none drop-shadow-md">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full max-w-full max-h-full overflow-visible drop-shadow-sm"
        >
          <defs>
            <linearGradient id={`cz-grad-shield-${zone.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id={`cz-grad-gold-${zone.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <path
            d="M50 6 L84 20 L84 54 Q84 84 50 94 Q16 84 16 54 L16 20 Z"
            fill={`url(#cz-grad-shield-${zone.id})`}
            stroke={`url(#cz-grad-gold-${zone.id})`}
            strokeWidth="3.5"
          />
          <path
            d="M50 13 L77 24 L77 52 Q77 77 50 86 Q23 77 23 52 L23 24 Z"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeDasharray="2.5 1.5"
          />
          <polygon
            points="50,22 53.5,33 65,33 55.7,40 59.2,51 50,44.5 40.8,51 44.3,40 35,33 46.5,33"
            fill={`url(#cz-grad-gold-${zone.id})`}
            stroke="#92400e"
            strokeWidth="0.8"
          />
          <rect x="25" y="56" width="50" height="13" rx="2.5" fill="#dc2626" stroke="#fbbf24" strokeWidth="1" />
          <text
            x="50"
            y="65.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="6"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="0.4"
          >
            SABLON / BORDIR
          </text>
          <text
            x="50"
            y="77.5"
            textAnchor="middle"
            fill="#fde047"
            fontSize="4.8"
            fontWeight="700"
            fontFamily="sans-serif"
            letterSpacing="0.3"
          >
            ★ PREMIUM ★
          </text>
        </svg>
      </div>
    )
  }

  // Handle image upload from user device - opens modal choosing between Bordir and Sablon + target zone
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      // Preselect the clicked zone or the first available zone on the current side
      const initialZone = targetZoneForUpload || (currentPrintZones.length > 0 ? currentPrintZones[0] : null)
      setUploadModalData({
        dataUrl,
        fileName: file.name.replace(/\.[^/.]+$/, '').slice(0, 24),
        targetZoneId: initialZone ? initialZone.id : 'custom',
        technique: activeTechnique || 'bordir',
      })
      setTargetZoneForUpload(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Confirm graphic upload from the configuration modal
  const handleConfirmUploadGraphic = () => {
    if (!uploadModalData) return

    const { dataUrl, fileName, targetZoneId, technique } = uploadModalData
    const chosenZone = currentPrintZones.find((z) => z.id === targetZoneId)

    let graphicX = 50
    let graphicY = 40
    let scale = 0.8
    let price = 15000
    let sizeCat: PrintSizeCategory = 'Logo Kecil (≤10×10cm)'
    let targetSide: ViewSide = chosenZone ? chosenZone.side : currentSide

    if (chosenZone) {
      const zoneNameLower = chosenZone.name.toLowerCase()
      // Jika upload ditujukan ke Bahu/Lengan Kiri (meskipun diunggah dari Tampak Depan atau Belakang)
      if (zoneNameLower.includes('lengan kiri') || zoneNameLower.includes('bahu kiri')) {
        targetSide = 'left'
        graphicX = 50
        graphicY = 35
      } else if (zoneNameLower.includes('lengan kanan') || zoneNameLower.includes('bahu kanan')) {
        targetSide = 'right'
        graphicX = 50
        graphicY = 35
      } else {
        graphicX = chosenZone.x
        graphicY = chosenZone.y
      }
      // Proportionally scale to fit neatly inside the zone
      scale = Math.min(1.2, Math.max(0.4, Number(((chosenZone.width / 24) * 0.75).toFixed(2))))
      price = chosenZone.price
      sizeCat = (chosenZone.maxSizeCm || 'Logo Kecil (≤10×10cm)') as PrintSizeCategory
    } else {
      const calc = calculateGraphicPrice(0.8)
      price = calc.price
      sizeCat = calc.sizeCategory
    }

    const newGraphic: CanvasGraphic = {
      id: 'g_' + Date.now(),
      type: 'image',
      side: targetSide,
      content: dataUrl,
      x: graphicX,
      y: graphicY,
      scale,
      scaleX: 1,
      scaleY: 1,
      rotation: chosenZone?.rotationZ !== undefined ? chosenZone.rotationZ : 0,
      rotationX: chosenZone?.rotationX || 0,
      rotationY: chosenZone?.rotationY || 0,
      rotationZ: chosenZone?.rotationZ !== undefined ? chosenZone.rotationZ : 0,
      enableAutoClipping: chosenZone?.enableAutoClipping ?? true,
      technique,
      label: fileName.trim() || (technique === 'bordir' ? 'Bordir Komputer' : 'Sablon DTF'),
      sizeCategory: sizeCat,
      calculatedPrice: price,
      opacity: 100,
      blendMode: 'normal',
      isLocked: false,
    }

    updateGraphicsWithHistory([...graphics, newGraphic])
    setSelectedGraphicId(newGraphic.id)
    setUploadModalData(null)
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
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      enableAutoClipping: true,
      textColor,
      fontFamily: textFont,
      fontSize: 22,
      technique: textTechnique,
      label: inputText,
      sizeCategory: calc.sizeCategory,
      calculatedPrice: calc.price,
    }

    updateGraphicsWithHistory([...graphics, newGraphic])
    setSelectedGraphicId(newGraphic.id)
    setInputText('')
  }

  // Apply preset position
  const handleApplyPresetPosition = (preset: (typeof POSITION_PRESETS)[0]) => {
    if (!selectedGraphicId) return

    setCurrentSide(preset.side)
    updateGraphicsWithHistory(
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
    updateGraphicsWithHistory(graphics.filter((g) => g.id !== id))
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
    updateGraphicsWithHistory([...graphics, duplicated])
    setSelectedGraphicId(duplicated.id)
  }

  // Flip Horizontal
  const handleFlipHorizontal = (id: string) => {
    updateGraphicsWithHistory(
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
    updateGraphicsWithHistory(
      graphics.map((g) => {
        if (g.id === id) {
          const currentScaleY = g.scaleY || 1
          return { ...g, scaleY: currentScaleY * -1 }
        }
        return g
      })
    )
  }

  // Layer Ordering & Management
  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = graphics.findIndex((g) => g.id === id)
    if (idx === -1) return
    // Higher index renders in front (higher z-index).
    // 'up' moves to higher index (in front), 'down' moves to lower index (behind)
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1
    if (targetIdx < 0 || targetIdx >= graphics.length) return

    const newGraphics = [...graphics]
    const [moved] = newGraphics.splice(idx, 1)
    newGraphics.splice(targetIdx, 0, moved)
    updateGraphicsWithHistory(newGraphics)
  }

  const handleBringToFront = (id: string) => {
    const item = graphics.find((g) => g.id === id)
    if (!item) return
    const rest = graphics.filter((g) => g.id !== id)
    updateGraphicsWithHistory([...rest, item])
  }

  const handleSendToBack = (id: string) => {
    const item = graphics.find((g) => g.id === id)
    if (!item) return
    const rest = graphics.filter((g) => g.id !== id)
    updateGraphicsWithHistory([item, ...rest])
  }

  const handleToggleLock = (id: string) => {
    updateGraphicsWithHistory(
      graphics.map((g) => (g.id === id ? { ...g, isLocked: !g.isLocked } : g))
    )
  }

  const handleToggleGraphicVisibility = (id: string) => {
    setHiddenGraphicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleAlign = (
    id: string,
    align: 'center_h' | 'center_v' | 'left' | 'right' | 'top' | 'bottom'
  ) => {
    updateGraphicsWithHistory(
      graphics.map((g) => {
        if (g.id !== id) return g
        switch (align) {
          case 'center_h':
            return { ...g, x: 50 }
          case 'center_v':
            return { ...g, y: 50 }
          case 'left':
            return { ...g, x: 32 }
          case 'right':
            return { ...g, x: 68 }
          case 'top':
            return { ...g, y: 28 }
          case 'bottom':
            return { ...g, y: 72 }
          default:
            return g
        }
      })
    )
  }

  // Drag and drop reordering for Layers Panel
  const handleGraphicDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedGraphicId(id)
  }

  const handleGraphicDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverGraphicId !== id) {
      setDragOverGraphicId(id)
    }
  }

  const handleGraphicDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverGraphicId(null)
    const sourceId = draggedGraphicId || e.dataTransfer.getData('text/plain')
    setDraggedGraphicId(null)
    if (!sourceId || sourceId === targetId) return

    const srcIdx = graphics.findIndex((item) => item.id === sourceId)
    const tgtIdx = graphics.findIndex((item) => item.id === targetId)
    if (srcIdx === -1 || tgtIdx === -1) return

    const newGraphics = [...graphics]
    const [moved] = newGraphics.splice(srcIdx, 1)
    newGraphics.splice(tgtIdx, 0, moved)
    updateGraphicsWithHistory(newGraphics)
  }

  const handleGraphicDragEnd = () => {
    setDraggedGraphicId(null)
    setDragOverGraphicId(null)
  }

  // ----------------------------------------------------
  // MOUSE DRAG / RESIZE / ROTATE ENGINE
  // ----------------------------------------------------
  const handleStartMove = (e: React.MouseEvent, gId: string) => {
    if (activeTool !== 'select') return
    e.stopPropagation()
    setSelectedGraphicId(gId)
    const g = graphics.find((item) => item.id === gId)
    if (!g || g.isLocked) return

    pushHistorySnapshot()

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
    if (!g || g.isLocked) return

    pushHistorySnapshot()

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

    pushHistorySnapshot()

    // Ambil titik pusat piksel sebenarnya dari elemen grafik di layar
    const el = document.getElementById(`graphic-element-${gId}`)
    let centerX = e.clientX
    let centerY = e.clientY
    if (el) {
      const elRect = el.getBoundingClientRect()
      centerX = elRect.left + elRect.width / 2
      centerY = elRect.top + elRect.height / 2
    }

    // Hitung sudut awal mouse terhadap titik pusat objek
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)

    setDragState({
      mode: 'rotate',
      startX: centerX,
      startY: centerY,
      initialGraphicX: startAngle,
      initialGraphicY: 0,
      initialScale: 0,
      initialRotation: g.rotation || 0,
    })
  }

  // Putar grafik secara instan berdasarkan derajat tertentu (+45, -45, dll.)
  const handleRotateGraphicBy = (gId: string, deltaDeg: number) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === gId) {
          let newRot = Math.round((g.rotation || 0) + deltaDeg) % 360
          if (newRot < 0) newRot += 360
          return { ...g, rotation: newRot, rotationZ: newRot }
        }
        return g
      })
    )
  }

  // Reset rotasi ke 0 derajat (tegak lurus)
  const handleResetRotation = (gId: string) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => (g.id === gId ? { ...g, rotation: 0, rotationZ: 0 } : g))
    )
  }

  // Set Rotasi X grafik (Perspektif 3D Vertikal / Menunduk: -85 sampai +85 derajat)
  const handleSetGraphicRotationX = (gId: string, rotX: number) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => (g.id === gId ? { ...g, rotationX: Math.max(-85, Math.min(85, rotX)) } : g))
    )
  }

  // Set Rotasi Y grafik (Perspektif 3D Menyamping: -85 sampai +85 derajat)
  const handleSetGraphicRotationY = (gId: string, rotY: number) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => (g.id === gId ? { ...g, rotationY: Math.max(-85, Math.min(85, rotY)) } : g))
    )
  }

  // Set Rotasi Z grafik (Sudut Putar 2D Bidang Kain: -180 sampai +180 derajat)
  const handleSetGraphicRotationZ = (gId: string, rotZ: number) => {
    pushHistorySnapshot()
    let newRot = rotZ
    if (newRot > 180) newRot -= 360
    if (newRot < -180) newRot += 360
    onGraphicsChange(
      graphics.map((g) => (g.id === gId ? { ...g, rotation: newRot, rotationZ: newRot } : g))
    )
  }

  // Nudge Rotasi X (+5, -5)
  const handleNudgeGraphicRotationX = (gId: string, deltaDeg: number, baseValue?: number) => {
    const target = graphics.find((g) => g.id === gId)
    const current = target?.rotationX !== undefined ? target.rotationX : (baseValue ?? 0)
    handleSetGraphicRotationX(gId, current + deltaDeg)
  }

  // Nudge Rotasi Y (+5, -5)
  const handleNudgeGraphicRotationY = (gId: string, deltaDeg: number, baseValue?: number) => {
    const target = graphics.find((g) => g.id === gId)
    const current = target?.rotationY !== undefined ? target.rotationY : (baseValue ?? 0)
    handleSetGraphicRotationY(gId, current + deltaDeg)
  }

  // Nudge Rotasi Z (+5, -5)
  const handleNudgeGraphicRotationZ = (gId: string, deltaDeg: number, baseValue?: number) => {
    const target = graphics.find((g) => g.id === gId)
    const current = target?.rotationZ !== undefined ? target.rotationZ : (baseValue !== undefined ? baseValue : (target?.rotation || 0))
    handleSetGraphicRotationZ(gId, current + deltaDeg)
  }

  // Reset semua rotasi 3D (X, Y, Z) ke 0 derajat
  const handleResetGraphic3D = (gId: string) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => (g.id === gId ? { ...g, rotationX: 0, rotationY: 0, rotation: 0, rotationZ: 0 } : g))
    )
  }

  // Toggle Auto Clipping Mask grafik (Potong siluet kain baju)
    // Ubah skala / ukuran grafis secara presisi
  const handleScaleGraphic = (gId: string, delta: number) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id !== gId) return g
        const newScale = Math.max(0.2, Math.min(2.5, Number(((g.scale || 1) + delta).toFixed(2))))
        const calc = calculateGraphicPrice(newScale)
        return {
          ...g,
          scale: newScale,
          sizeCategory: calc.sizeCategory,
          calculatedPrice: calc.price,
        }
      })
    )
  }

  const handleToggleGraphicAutoClipping = (gId: string) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id === gId) {
          const currentVal = g.enableAutoClipping ?? true
          return { ...g, enableAutoClipping: !currentVal }
        }
        return g
      })
    )
  }

  // Geser posisi grafis secara presisi (Nudge per 2%)
  const handleNudgeGraphic = (gId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => {
        if (g.id !== gId) return g
        const step = 2
        let newX = g.x
        let newY = g.y
        if (direction === 'up') newY = Math.max(10, g.y - step)
        if (direction === 'down') newY = Math.min(85, g.y + step)
        if (direction === 'left') newX = Math.max(15, g.x - step)
        if (direction === 'right') newX = Math.min(85, g.x + step)
        return { ...g, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }
      })
    )
  }

  // Reset posisi lengan ke titik tengah default (50, 35)
  const handleResetSleevePosition = (gId: string) => {
    pushHistorySnapshot()
    onGraphicsChange(
      graphics.map((g) => (g.id === gId ? { ...g, x: 50, y: 35 } : g))
    )
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.mode || !selectedGraphicId || !viewportRef.current) return

    const deltaPixelX = e.clientX - dragState.startX
    const deltaPixelY = e.clientY - dragState.startY
    const stageW = (stageDisplayWidth || 540) * (zoomLevel || 1)
    const stageH = (stageDisplayHeight || 600) * (zoomLevel || 1)

    if (dragState.mode === 'move') {
      const deltaPercentX = (deltaPixelX / stageW) * 100
      const deltaPercentY = (deltaPixelY / stageH) * 100

      const targetG = graphics.find((g) => g.id === selectedGraphicId)
      const isProjectedView =
        (currentSide === 'front' || currentSide === 'back') &&
        (targetG?.side === 'left' || targetG?.side === 'right')

      let newX: number
      let newY: number

      if (isProjectedView && targetG) {
        // Dragging projected sleeve graphic in front/back view maps naturally to sleeve axes
        const isViewerRight =
          (currentSide === 'front' && targetG.side === 'left') ||
          (currentSide === 'back' && targetG.side === 'right')

        const effectiveDeltaX = isViewerRight ? -deltaPercentX / 0.45 : deltaPercentX / 0.45
        const effectiveDeltaY = deltaPercentY / 0.85

        newX = Math.max(15, Math.min(85, dragState.initialGraphicX + effectiveDeltaX))
        newY = Math.max(10, Math.min(85, dragState.initialGraphicY + effectiveDeltaY))
      } else {
        // When clipping mask is on, strictly constrain graphics within mockup bounds
        const minX = isClippingMaskActive ? 15 : 5
        const maxX = isClippingMaskActive ? 85 : 95
        const minY = isClippingMaskActive ? 12 : 8
        const maxY = isClippingMaskActive ? 88 : 92

        newX = Math.max(minX, Math.min(maxX, dragState.initialGraphicX + deltaPercentX))
        newY = Math.max(minY, Math.min(maxY, dragState.initialGraphicY + deltaPercentY))
      }

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
      const centerX = dragState.startX
      const centerY = dragState.startY
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      const angleDelta = currentAngle - dragState.initialGraphicX
      let newRotation = Math.round((dragState.initialRotation + angleDelta) % 360)
      if (newRotation < 0) newRotation += 360

      onGraphicsChange(
        graphics.map((item) => {
          if (item.id === selectedGraphicId) {
            return { ...item, rotation: newRotation, rotationZ: newRotation }
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
    if (activeTool !== 'select') return
    if (e.target === viewportRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      setSelectedGraphicId(null)
    }
  }

  // Export Lossless HD Mockup (includes Mockup Image, Paint Layer & Graphics)
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
      let loadedCount = 0
      const visibleCurrentGraphics = currentSideGraphics
      const visibleProjected = sleeveProjectedGraphics
      const totalItems = visibleCurrentGraphics.length + visibleProjected.length

      const finishExport = () => {
        const link = document.createElement('a')
        link.download = `ZY_Studio_${activeMockup?.name || 'Mockup'}_${currentSide}_${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }

      if (totalItems === 0) {
        finishExport()
        return
      }

      const checkFinished = () => {
        loadedCount++
        if (loadedCount >= totalItems) {
          finishExport()
        }
      }

      // 1. Gambar Desain Tampak Sisi Aktif (Flat Direct View)
      visibleCurrentGraphics.forEach((g) => {
        const posX = (g.x / 100) * canvas.width
        const posY = (g.y / 100) * canvas.height
        const rotYRad = ((g.rotationY || 0) * Math.PI) / 180
        const rotXRad = ((g.rotationX || 0) * Math.PI) / 180
        const cosY = Math.cos(rotYRad)
        const cosX = Math.cos(rotXRad)
        const scaleX = (g.scaleX || 1) * g.scale * Math.max(0.15, Math.abs(cosY))
        const scaleY = (g.scaleY || 1) * g.scale * Math.max(0.15, Math.abs(cosX))

        ctx.save()
        ctx.translate(posX, posY)
        ctx.rotate(((g.rotationZ !== undefined ? g.rotationZ : g.rotation) * Math.PI) / 180)
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
          ctx.restore()
          checkFinished()
        } else {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const w = 240
            const h = (img.height / img.width) * w
            ctx.drawImage(img, -w / 2, -h / 2, w, h)
            ctx.restore()
            checkFinished()
          }
          img.onerror = () => {
            ctx.restore()
            checkFinished()
          }
          img.src = g.content
        }
      })

      // 2. Gambar Desain Proyeksi Lengan (Menyamping Realistis di Tampak Depan / Belakang)
      visibleProjected.forEach((proj) => {
        const posX = (proj.x / 100) * canvas.width
        const posY = (proj.y / 100) * canvas.height
        const rotRad = ((proj.rotationZ || proj.graphic.rotation || 0) * Math.PI) / 180
        const rotYRad = ((proj.rotationY || 0) * Math.PI) / 180
        const rotXRad = ((proj.rotationX || 0) * Math.PI) / 180
        const cosY = Math.cos(rotYRad)
        const cosX = Math.cos(rotXRad)
        const scaleX = proj.scaleX * Math.max(0.2, Math.abs(cosY))
        const scaleY = proj.scaleY * Math.max(0.2, Math.abs(cosX))

        ctx.save()
        ctx.translate(posX, posY)
        ctx.rotate(rotRad)
        ctx.scale(scaleX, scaleY)

        if (proj.graphic.type === 'text') {
          ctx.font = `bold ${(proj.graphic.fontSize || 22) * 2.6}px ${proj.graphic.fontFamily || 'Montserrat'}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = proj.graphic.textColor || '#ffffff'
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.strokeText(proj.graphic.content, 0, 0)
          ctx.fillText(proj.graphic.content, 0, 0)
          ctx.restore()
          checkFinished()
        } else {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const w = 240
            const h = (img.height / img.width) * w
            ctx.drawImage(img, -w / 2, -h / 2, w, h)
            ctx.restore()
            checkFinished()
          }
          img.onerror = () => {
            ctx.restore()
            checkFinished()
          }
          img.src = proj.graphic.content
        }
      })
    }

    const drawPaintLayerAndContinue = () => {
      const paintData = paintLayers[currentSide]
      if (paintData) {
        const paintImg = new Image()
        paintImg.onload = () => {
          ctx.save()
          if (brushBlendMode === 'multiply') {
            ctx.globalCompositeOperation = 'multiply'
          }
          ctx.drawImage(paintImg, 0, 0, canvas.width, canvas.height)
          ctx.restore()
          drawGraphicsOnCanvas()
        }
        paintImg.src = paintData
      } else {
        drawGraphicsOnCanvas()
      }
    }

    const drawColorPartsAndContinue = () => {
      // Invert so bottom-most is drawn first, and top-most (index 0) is drawn last on top
      const allParts = activeMockup?.colorParts || []
      const partsToDraw = [...currentSideColorParts].reverse().filter((p) => {
        if (!p.maskImg) return false
        const groupKey = getPartMatchKey(p, allParts)
        return !hiddenColorPartKeys.includes(groupKey) && !hiddenColorPartKeys.includes(p.id)
      })

      const renderActiveParts = () => {
        if (partsToDraw.length === 0) {
          drawPaintLayerAndContinue()
          return
        }

        const renderedLayers: (HTMLCanvasElement | null)[] = new Array(partsToDraw.length).fill(null)
        let loadedParts = 0

        partsToDraw.forEach((part, idx) => {
          const maskImg = new Image()
          maskImg.crossOrigin = 'anonymous'
          maskImg.onload = () => {
            const offCanvas = document.createElement('canvas')
            offCanvas.width = canvas.width
            offCanvas.height = canvas.height
            const offCtx = offCanvas.getContext('2d')
            if (offCtx) {
              const color = getPartColor(part)
              offCtx.fillStyle = color
              offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height)
              offCtx.globalCompositeOperation = 'destination-in'
              offCtx.drawImage(maskImg, 0, 0, offCanvas.width, offCanvas.height)
              renderedLayers[idx] = offCanvas
            }
            loadedParts++
            if (loadedParts === partsToDraw.length) {
              // Draw in exact bottom-to-top sequence
              renderedLayers.forEach((layer) => {
                if (layer) {
                  ctx.save()
                  ctx.globalCompositeOperation = 'multiply'
                  ctx.drawImage(layer, 0, 0)
                  ctx.restore()
                }
              })
              drawPaintLayerAndContinue()
            }
          }
          maskImg.onerror = () => {
            loadedParts++
            if (loadedParts === partsToDraw.length) {
              renderedLayers.forEach((layer) => {
                if (layer) {
                  ctx.save()
                  ctx.globalCompositeOperation = 'multiply'
                  ctx.drawImage(layer, 0, 0)
                  ctx.restore()
                }
              })
              drawPaintLayerAndContinue()
            }
          }
          maskImg.src = part.maskImg!
        })
      }

      // Gambar warna dasar keseluruhan seragam terlebih dahulu (posisi di bawah semua layer)
      if (baseGarmentColor && !isBaseColorHidden && currentMockupImage) {
        const mockupImg = new Image()
        mockupImg.crossOrigin = 'anonymous'
        mockupImg.onload = () => {
          const offBaseCanvas = document.createElement('canvas')
          offBaseCanvas.width = canvas.width
          offBaseCanvas.height = canvas.height
          const offBaseCtx = offBaseCanvas.getContext('2d')
          if (offBaseCtx) {
            offBaseCtx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height)
            offBaseCtx.globalCompositeOperation = 'source-in'
            offBaseCtx.fillStyle = baseGarmentColor
            offBaseCtx.fillRect(0, 0, canvas.width, canvas.height)

            if (partsToDraw.length > 0) {
              let loadedMasks = 0
              partsToDraw.forEach((part) => {
                const maskImg = new Image()
                maskImg.crossOrigin = 'anonymous'
                maskImg.onload = () => {
                  offBaseCtx.save()
                  offBaseCtx.globalCompositeOperation = 'destination-out'
                  offBaseCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)
                  offBaseCtx.restore()
                  loadedMasks++
                  if (loadedMasks === partsToDraw.length) {
                    ctx.save()
                    ctx.globalCompositeOperation = 'multiply'
                    ctx.drawImage(offBaseCanvas, 0, 0)
                    ctx.restore()
                    renderActiveParts()
                  }
                }
                maskImg.onerror = () => {
                  loadedMasks++
                  if (loadedMasks === partsToDraw.length) {
                    ctx.save()
                    ctx.globalCompositeOperation = 'multiply'
                    ctx.drawImage(offBaseCanvas, 0, 0)
                    ctx.restore()
                    renderActiveParts()
                  }
                }
                maskImg.src = part.maskImg!
              })
              return
            } else {
              ctx.save()
              ctx.globalCompositeOperation = 'multiply'
              ctx.drawImage(offBaseCanvas, 0, 0)
              ctx.restore()
            }
          }
          renderActiveParts()
        }
        mockupImg.onerror = () => {
          renderActiveParts()
        }
        mockupImg.src = currentMockupImage
      } else {
        renderActiveParts()
      }
    }

    if (currentMockupImage) {
      const customImg = new Image()
      customImg.crossOrigin = 'anonymous'
      customImg.onload = () => {
        ctx.drawImage(customImg, 0, 0, canvas.width, canvas.height)
        drawColorPartsAndContinue()
      }
      customImg.src = currentMockupImage
    } else {
      drawColorPartsAndContinue()
    }
  }

  // Lighting filter style
  const filterStyle = {
    filter: `brightness(${1 + lighting.brightness / 100}) contrast(${1 + lighting.contrast / 100}) saturate(${1 + lighting.saturation / 100})`,
  }

  // Clipping Mask style (masks inner elements to the silhouette of the garment PNG)
  const clippingMaskStyle: React.CSSProperties =
    isClippingMaskActive && currentMockupImage
      ? {
          WebkitMaskImage: `url("${currentMockupImage}")`,
          maskImage: `url("${currentMockupImage}")`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }
      : {}

  // JIKA BELUM ADA MOCKUP SAMA SEKALI (Empty State)
  if (!activeMockup) {
    return (
      <div className="bg-white text-slate-800 rounded-3xl p-12 text-center border border-slate-200 shadow-xl flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#ff5e00] flex items-center justify-center shadow-xs border border-orange-200">
          <PlusCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">
            Belum Ada Mockup Seragam yang Dipilih
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Silakan buka <b>Editor Mockup</b> untuk membuat dan meng-upload foto realistis seragam Anda sendiri (Depan, Belakang, Kiri, Kanan) atau gunakan template demo.
          </p>
        </div>
        <button
          onClick={() => onOpenDashboard()}
          className="px-6 py-3.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 flex items-center gap-2 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          Buka Editor Mockup
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xl select-none flex flex-col min-h-[820px] text-slate-800">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* ---------------------------------------------------- */}
      {/* 1. TOP OPTIONS & CONTEXTUAL INSPECTOR BAR (Photoshop Light Style) */}
      {/* ---------------------------------------------------- */}
      <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 text-xs z-30 shrink-0">
        {/* Left: View Angles Switcher & Mockup Pill */}
        <div className="flex items-center gap-2">
          {/* Angles Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
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
                      ? 'bg-[#ff5e00] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {side.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-black text-[#ff5e00]' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="h-5 w-px bg-slate-200 hidden md:block" />

          {/* Active Mockup Indicator & Switcher */}
          <button
            onClick={() => onOpenDashboard()}
            title="Klik untuk ganti mockup seragam"
            className="hidden sm:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-50 text-[#ff5e00] border border-orange-200">
              {activeMockup.category}
            </span>
            <span className="font-bold text-xs truncate max-w-[130px] text-slate-900">
              {activeMockup.name}
            </span>
            <span className="text-[10px] text-slate-400 hover:text-orange-600 underline underline-offset-2 ml-1">
              Ganti
            </span>
          </button>
        </div>

        {/* Center: Dynamic Contextual Inspector */}
        <div className="hidden lg:flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
          {/* Inspector Mode 1: Brush / Eraser Active */}
          {activeTool === 'brush' || activeTool === 'eraser' ? (
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5e00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                {activeTool === 'brush' ? (
                  <>
                    <Paintbrush className="w-3 h-3" />
                    Kuas Pewarna
                  </>
                ) : (
                  <>
                    <Eraser className="w-3 h-3" />
                    Penghapus Kuas
                  </>
                )}
              </span>

              {/* Ukuran Brush */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[11px]">
                <span className="text-slate-500 font-medium">Ukuran:</span>
                <span className="font-mono font-bold text-slate-900">{brushSize}px</span>
                <input
                  type="range"
                  min="2"
                  max="60"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-16 accent-[#ff5e00] cursor-pointer"
                  title="Ubah Ukuran Kuas ([ dan ])"
                />
              </div>

              {/* Warna Kuas */}
              {activeTool === 'brush' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px] font-medium">Warna:</span>
                  <label
                    title="Ganti Warna Kuas"
                    className="w-5 h-5 rounded-md border border-slate-300 cursor-pointer shadow-2xs overflow-hidden"
                    style={{ backgroundColor: brushColor }}
                  >
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="opacity-0 w-0 h-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {/* Mode Blend */}
              <button
                onClick={() =>
                  setBrushBlendMode((m) => (m === 'multiply' ? 'source-over' : 'multiply'))
                }
                title="Klik untuk ganti efek warna kain"
                className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                {brushBlendMode === 'multiply' ? '🧵 Efek Kain (Multiply)' : '🎨 Cat Solid'}
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Undo & Redo & Clear */}
              <button
                type="button"
                onClick={handleGlobalUndo}
                disabled={unifiedUndoStack.length === 0}
                title="Batalkan Tindakan (Ctrl+Z)"
                className="p-1 hover:bg-slate-200/80 disabled:opacity-40 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Undo</span>
              </button>
              <button
                type="button"
                onClick={handleGlobalRedo}
                disabled={unifiedRedoStack.length === 0}
                title="Kembalikan Tindakan (Ctrl+Y)"
                className="p-1 hover:bg-slate-200/80 disabled:opacity-40 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Redo</span>
              </button>
              <button
                type="button"
                onClick={handleClearPaint}
                title="Hapus Semua Warna di Sudut Ini"
                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Bersihkan</span>
              </button>
            </div>
          ) : selectedGraphic ? (
            /* Inspector Mode 2: Graphic Element Selected */
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5e00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  {selectedGraphic.type === 'text' ? 'Teks' : 'Logo/Gambar'}
                </span>
                {renamingGraphicId === selectedGraphic.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={renamingGraphicLabel}
                      onChange={(e) => setRenamingGraphicLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveGraphicLabel(selectedGraphic.id)
                        if (e.key === 'Escape') setRenamingGraphicId(null)
                      }}
                      onBlur={() => handleSaveGraphicLabel(selectedGraphic.id)}
                      autoFocus
                      className="h-6 px-1.5 text-xs font-bold border border-[#ff5e00] rounded bg-white text-slate-900 w-32 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveGraphicLabel(selectedGraphic.id)}
                      className="p-1 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer"
                      title="Simpan Nama"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingGraphicId(null)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                      title="Batal"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 group/inspname">
                    <span
                      onClick={() => handleStartRenameGraphic(selectedGraphic)}
                      className="font-bold text-slate-800 text-xs truncate max-w-[120px] cursor-pointer hover:underline"
                      title="Klik untuk ubah nama layer ini"
                    >
                      {selectedGraphic.label || (selectedGraphic.type === 'text' ? selectedGraphic.content : 'Logo')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartRenameGraphic(selectedGraphic)}
                      className="p-0.5 text-slate-400 hover:text-[#ff5e00] rounded transition-colors cursor-pointer"
                      title="Ubah nama layer (custom nama)"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Technique Switcher: Bordir vs Sablon */}
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  onClick={() => {
                    updateGraphicsWithHistory(
                      graphics.map((g) =>
                        g.id === selectedGraphic.id ? { ...g, technique: 'bordir' } : g
                      )
                    )
                  }}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                    selectedGraphic.technique === 'bordir'
                      ? 'bg-[#ff5e00] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="🧵 Tekstur Bordir Komputer 3D (Serat benang timbul, berarah & berkilau)"
                >
                  <span>🧵 Bordir</span>
                </button>
                <button
                  onClick={() => {
                    updateGraphicsWithHistory(
                      graphics.map((g) =>
                        g.id === selectedGraphic.id ? { ...g, technique: 'sablon' } : g
                      )
                    )
                  }}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                    selectedGraphic.technique === 'sablon'
                      ? 'bg-[#ff5e00] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="🎨 Tekstur Sablon DTF / Plastisol (Cetakan rata halus merekat ke serat kain)"
                >
                  <span>🎨 Sablon</span>
                </button>
              </div>

              {/* Image Specific: Magic Wand Background Remover */}
              {selectedGraphic.type === 'image' && (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <button
                    onClick={() => handleRemoveWhiteBackground(selectedGraphic.id)}
                    disabled={isRemovingBg}
                    title="🪄 Hapus Latar Putih Otomatis (Magic Wand) agar logo transparan menyatu ke kain"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                  >
                    <Wand2 className={`w-3 h-3 text-amber-600 ${isRemovingBg ? 'animate-spin' : ''}`} />
                    <span>{isRemovingBg ? 'Memproses...' : 'Hapus Latar Putih'}</span>
                  </button>
                </>
              )}

              {/* Text specific controls */}
              {selectedGraphic.type === 'text' && (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <select
                    value={selectedGraphic.fontFamily || 'Montserrat, sans-serif'}
                    onChange={(e) => {
                      updateGraphicsWithHistory(
                        graphics.map((g) =>
                          g.id === selectedGraphic.id ? { ...g, fontFamily: e.target.value } : g
                        )
                      )
                    }}
                    className="bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1 outline-hidden shadow-2xs"
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
                    className="w-6 h-6 rounded-lg border border-slate-300 cursor-pointer flex items-center justify-center overflow-hidden shrink-0 shadow-2xs"
                    style={{ backgroundColor: selectedGraphic.textColor || '#ffffff' }}
                  >
                    <input
                      type="color"
                      value={selectedGraphic.textColor || '#ffffff'}
                      onChange={(e) => {
                        updateGraphicsWithHistory(
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

              <div className="h-4 w-px bg-slate-200" />

              {/* Quick Alignment Presets (Illustrator Style) */}
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                <button
                  onClick={() => handleQuickAlign('left_chest')}
                  className="px-1.5 py-0.5 text-slate-700 hover:text-slate-900 hover:bg-white rounded font-bold cursor-pointer transition-colors"
                  title="Posisikan ke Dada Kiri (Standar Bordir Saku PDH)"
                >
                  Dada Kiri
                </button>
                <button
                  onClick={() => handleQuickAlign('right_chest')}
                  className="px-1.5 py-0.5 text-slate-700 hover:text-slate-900 hover:bg-white rounded font-bold cursor-pointer transition-colors"
                  title="Posisikan ke Dada Kanan (Standar Bordir Nama)"
                >
                  Dada Kanan
                </button>
                <button
                  onClick={() => handleQuickAlign('center_back')}
                  className="px-1.5 py-0.5 text-slate-700 hover:text-slate-900 hover:bg-white rounded font-bold cursor-pointer transition-colors"
                  title="Posisikan ke Punggung Belakang (Besar A3)"
                >
                  Punggung
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Transform & Photoshop-Style Controls */}
              <div className="flex items-center gap-1">
                {/* Opacity Slider */}
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[10px]">
                  <span className="text-slate-500 font-semibold">Opasitas:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={selectedGraphic.opacity !== undefined ? selectedGraphic.opacity : 100}
                    onChange={(e) => {
                      const op = Number(e.target.value)
                      updateGraphicsWithHistory(
                        graphics.map((g) => (g.id === selectedGraphic.id ? { ...g, opacity: op } : g))
                      )
                    }}
                    className="w-12 accent-[#ff5e00] h-1 bg-slate-300 rounded cursor-pointer"
                  />
                  <span className="font-mono text-slate-700 font-bold w-6 text-right">
                    {selectedGraphic.opacity !== undefined ? selectedGraphic.opacity : 100}%
                  </span>
                </div>

                {/* Blend Mode */}
                <select
                  value={selectedGraphic.blendMode || 'normal'}
                  onChange={(e) => {
                    const bm = e.target.value as any
                    updateGraphicsWithHistory(
                      graphics.map((g) => (g.id === selectedGraphic.id ? { ...g, blendMode: bm } : g))
                    )
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-[10px] rounded-lg px-1.5 py-1 font-bold cursor-pointer shadow-2xs"
                  title="Blend Mode Serat Kain"
                >
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply (Serap Kain)</option>
                  <option value="screen">Screen (Terang)</option>
                  <option value="overlay">Overlay</option>
                </select>

                <div className="h-4 w-px bg-slate-200" />

                <button
                  onClick={() => handleAlign(selectedGraphic.id, 'center_h')}
                  title="Rata Tengah Horizontal"
                  className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleFlipHorizontal(selectedGraphic.id)}
                  title="Balik Horizontal (Mirror)"
                  className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleFlipVertical(selectedGraphic.id)}
                  title="Balik Vertikal"
                  className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleLock(selectedGraphic.id)}
                  title={selectedGraphic.isLocked ? 'Buka Kunci Objek' : 'Kunci Posisi Objek (Cegah Tergeser)'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    selectedGraphic.isLocked
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {selectedGraphic.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDuplicateGraphic(selectedGraphic.id)}
                  title="Duplikat Elemen (Ctrl+D)"
                  className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteGraphic(selectedGraphic.id)}
                  title="Hapus Elemen (Delete)"
                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* 3D Multi-Axis Rotation Pill in Inspector */}
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] font-mono">
                <span className="text-slate-500 font-semibold font-sans">3D:</span>
                <span className="text-amber-700 font-bold" title="Rotasi Y (Menyamping)">Y:{selectedGraphic.rotationY || 0}°</span>
                <span className="text-cyan-700 font-bold" title="Rotasi X (Menunduk)">X:{selectedGraphic.rotationX || 0}°</span>
                <span className="text-pink-700 font-bold" title="Rotasi Z (Roll / Sudut Pola)">Z:{selectedGraphic.rotationZ !== undefined ? selectedGraphic.rotationZ : (selectedGraphic.rotation || 0)}°</span>
                {Boolean(selectedGraphic.rotationX || selectedGraphic.rotationY || (selectedGraphic.rotationZ !== undefined ? selectedGraphic.rotationZ : selectedGraphic.rotation)) && (
                  <button
                    type="button"
                    onClick={() => handleResetGraphic3D(selectedGraphic.id)}
                    className="ml-1 px-1 py-0.2 bg-slate-200 hover:bg-red-500 text-slate-700 hover:text-white rounded text-[8px] cursor-pointer transition-colors"
                    title="Reset 3D (X, Y, Z) ke 0°"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Pricing Pill */}
              <div className="text-[11px] font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                {selectedGraphic.sizeCategory?.split(' ')[0]} • Rp{' '}
                {selectedGraphic.calculatedPrice?.toLocaleString('id-ID')}
              </div>
            </>
          ) : (
            /* Inspector Mode 3: Idle Studio Status */
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Studio Aktif • [V] Seleksi • [B] Kuas Pewarna • [E] Penghapus • [T] Teks
              </span>
            </div>
          )}

          <div className="h-4 w-px bg-slate-200" />

          {/* Toggle Clipping Mask Quick Button */}
          <button
            onClick={() => setIsClippingMaskActive((prev) => !prev)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isClippingMaskActive
                ? 'bg-orange-100 text-[#ff5e00] border border-orange-200'
                : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
            }`}
            title="Kunci gambar dan warna kuas pada siluet seragam agar tidak keluar garis"
          >
            <Scissors className="w-3 h-3" />
            <span>Mask: {isClippingMaskActive ? 'Terkunci' : 'Bebas'}</span>
          </button>
        </div>

        {/* Right: Undo/Redo, Zoom, Grid, HD Export & Order Button */}
        <div className="flex items-center gap-2">
          {/* Global Undo & Redo (Tombol Batalkan & Kembalikan untuk SEMUA Tindakan) */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs gap-0.5">
            <button
              type="button"
              onClick={handleGlobalUndo}
              disabled={unifiedUndoStack.length === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                unifiedUndoStack.length === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'hover:bg-amber-50 text-slate-700 hover:text-amber-800 cursor-pointer'
              }`}
              title="Batalkan Tindakan Apapun (Warna Kain, Posisi Logo, Teks, Kuas) / Ctrl+Z"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Batalkan</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={handleGlobalRedo}
              disabled={unifiedRedoStack.length === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                unifiedRedoStack.length === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 cursor-pointer'
              }`}
              title="Kembalikan Tindakan yang Dibatalkan (Redo / Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kembalikan</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, parseFloat((z - 0.1).toFixed(1))))}
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Perkecil Kanvas"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 text-[11px] font-mono font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              title="Reset Zoom ke 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, parseFloat((z + 0.1).toFixed(1))))}
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
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
                ? 'bg-slate-200/90 border-slate-300 text-slate-900 font-bold'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Buka / Tutup Panel Layers"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Export HD Button */}
          <button
            onClick={handleDownloadMockup}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
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
      {/* 2. MAIN WORKSPACE (Light Layout) */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex relative overflow-hidden bg-[#f8fafc]">
        {/* LEFT VERTICAL TOOLBAR (56px) */}
        <div className="w-14 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-2 z-20 shrink-0">
          {/* Tool: Move / Select (V) */}
          <button
            onClick={() => {
              setActiveTool('select')
              setActiveFlyout(null)
            }}
            title="Alat Seleksi & Geser (V)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'select' && activeFlyout === null
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MousePointer className="w-5 h-5" />
          </button>

          {/* Tool: Warna Keseluruhan Seragam (Warna Dasar Paling Bawah) */}
          <button
            onClick={() => {
              setActiveTool('palette')
              setActiveColorPickerGroupKey('__base__')
              setActiveFlyout(null)
            }}
            title="Warna Keseluruhan Seragam (Warna Dasar Bawah)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeColorPickerGroupKey === '__base__' || activeTool === 'palette'
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'bg-orange-50/80 text-[#ff5e00] hover:bg-orange-100'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span
              style={{ backgroundColor: baseGarmentColor }}
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-1.5 ring-white border border-black/10 shadow-2xs"
            />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Warna Keseluruhan Seragam (Lapisan Bawah)
            </span>
          </button>

          {/* Tool: Paint Brush (B) - Mewarnai Saku, Kancing, Kerah */}
          <button
            onClick={() => {
              setActiveTool('brush')
              setActiveFlyout((prev) => (prev === 'brush' ? null : 'brush'))
              setSelectedGraphicId(null)
            }}
            title="Kuas Pewarna Seragam (B) - Warnai Saku, Kerah & Kancing"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTool === 'brush'
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Paintbrush className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Kuas Pewarna (B)
            </span>
          </button>

          {/* Tool: Eraser (E) */}
          <button
            onClick={() => {
              setActiveTool('eraser')
              setActiveFlyout('brush')
              setSelectedGraphicId(null)
            }}
            title="Penghapus Kuas (E)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTool === 'eraser'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Eraser className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Penghapus Kuas (E)
            </span>
          </button>

          {/* Tool: Clipping Mask Toggle */}
          <button
            onClick={() => setIsClippingMaskActive((prev) => !prev)}
            title={`Metode Clipping Mask: ${isClippingMaskActive ? 'Aktif (Terkunci)' : 'Nonaktif (Bebas)'}`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              isClippingMaskActive
                ? 'bg-orange-50 text-[#ff5e00] border border-orange-300'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scissors className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              {isClippingMaskActive ? 'Clipping Mask: Aktif' : 'Clipping Mask: Nonaktif'}
            </span>
          </button>

          <div className="w-6 h-px bg-slate-200 my-0.5" />

          {/* Tool: Toggle Mode Tekstur Desain (Bordir vs Sablon) */}
          <button
            onClick={() => {
              const next = activeTechnique === 'bordir' ? 'sablon' : 'bordir'
              setActiveTechnique(next)
              if (selectedGraphic) {
                updateGraphicsWithHistory(
                  graphics.map((g) => (g.id === selectedGraphic.id ? { ...g, technique: next } : g))
                )
              }
            }}
            title={`Mode Tekstur: ${activeTechnique === 'bordir' ? '🧵 Bordir Komputer (Benang Timbul)' : '🎨 Sablon DTF (Plastisol Halus)'} - Klik untuk ubah mode`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTechnique === 'bordir'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            }`}
          >
            <span className="text-base select-none">{activeTechnique === 'bordir' ? '🧵' : '🎨'}</span>
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl flex flex-col items-start gap-0.5">
              <span className="font-bold text-amber-300">
                {activeTechnique === 'bordir' ? 'Mode: 🧵 Bordir Komputer' : 'Mode: 🎨 Sablon DTF'}
              </span>
              <span className="text-[10px] text-slate-300">
                {activeTechnique === 'bordir'
                  ? 'Gambar/logo baru otomatis bertekstur benang timbul'
                  : 'Gambar/logo baru otomatis bertekstur sablon halus'}
              </span>
            </span>
          </button>

          {/* Tool: Upload Image (U) */}
          <button
            onClick={() => {
              setTargetZoneForUpload(null)
              setActiveTool('select')
              setActiveFlyout(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
                fileInputRef.current.click()
              }
            }}
            title="Unggah Logo / Gambar Desain (U) - Pilih Bordir atau Sablon"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer relative group"
          >
            <Upload className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Unggah Gambar (U)
            </span>
          </button>

          {/* Tool: Type Tool (T) */}
          <button
            onClick={() => {
              setActiveTool('select')
              setActiveFlyout((prev) => (prev === 'text' ? null : 'text'))
            }}
            title="Alat Teks Sablon / Bordir (T)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeFlyout === 'text'
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Teks Tulisan (T)
            </span>
          </button>

          {/* Tool: Emblem Presets */}
          <button
            onClick={() => {
              setActiveTool('select')
              setActiveFlyout((prev) => (prev === 'presets' ? null : 'presets'))
            }}
            title="Emblem Cepat & Posisi Presets"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              activeFlyout === 'presets'
                ? 'bg-[#ff5e00] text-white shadow-md shadow-[#ff5e00]/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flag className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
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
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Studio Lighting
            </span>
          </button>

          <div className="w-6 h-px bg-slate-200 my-0.5" />

          {/* Tool: Safe Guidelines Toggle */}
          <button
            onClick={() => setShowGuidelines((prev) => !prev)}
            title="Garis Panduan / Safe Print Zones"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
              showGuidelines
                ? 'bg-orange-50 text-[#ff5e00] border border-orange-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Garis Panduan Sablon
            </span>
          </button>
        </div>

        {/* FLOATING FLYOUT MENUS */}
        {/* FLYOUT 1: BRUSH TOOL CONTROLS */}
        {activeFlyout === 'brush' && (
          <div className="absolute left-16 top-3 z-40 w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide text-slate-900">
                  Kuas Pewarna Seragam
                </h4>
              </div>
              <button
                onClick={() => setActiveFlyout(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 pt-3">
              {/* Tool Toggle: Kuas vs Penghapus */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTool('brush')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTool === 'brush'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5 text-[#ff5e00]" />
                  Kuas (B)
                </button>
                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTool === 'eraser'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5 text-slate-700" />
                  Penghapus (E)
                </button>
              </div>

              {/* Ukuran Kuas Slider & Quick Size Buttons */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-600 font-bold">Ukuran Kuas</span>
                  <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                    {brushSize} px
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full accent-[#ff5e00] cursor-pointer"
                />

                {/* Quick Presets: Kancing, Garis, Saku, Kerah */}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[
                    { label: 'Kancing', size: 3 },
                    { label: 'Garis/Lis', size: 8 },
                    { label: 'Saku', size: 18 },
                    { label: 'Kerah/Blok', size: 36 },
                  ].map((preset) => (
                    <button
                      key={preset.size}
                      onClick={() => setBrushSize(preset.size)}
                      className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer text-center ${
                        brushSize === preset.size
                          ? 'bg-[#ff5e00] text-white border-[#ff5e00]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label} ({preset.size}px)
                    </button>
                  ))}
                </div>
              </div>

              {/* Palet Warna Kuas */}
              {activeTool === 'brush' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Pilihan Warna Bagian Pakaian
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: 'Navy', hex: '#1e293b' },
                      { name: 'Hitam', hex: '#0a0a0c' },
                      { name: 'Putih', hex: '#ffffff' },
                      { name: 'Maroon', hex: '#7f1d1d' },
                      { name: 'Merah', hex: '#ef4444' },
                      { name: 'Scotlite Kuning', hex: '#facc15' },
                      { name: 'Hijau Army', hex: '#365314' },
                      { name: 'Hijau Botol', hex: '#14532d' },
                      { name: 'Biru Benhur', hex: '#1d4ed8' },
                      { name: 'Krem / Khaki', hex: '#bfa07a' },
                      { name: 'ZY Orange', hex: '#ff5e00' },
                      { name: 'Abu-abu', hex: '#64748b' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setBrushColor(c.hex)}
                        title={c.name}
                        style={{ backgroundColor: c.hex }}
                        className={`w-6 h-6 rounded-lg border-2 cursor-pointer transition-transform hover:scale-110 ${
                          brushColor === c.hex
                            ? 'border-[#ff5e00] scale-110 shadow-sm ring-2 ring-orange-200'
                            : 'border-slate-300'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-6 h-6 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                      title="Pilih Warna Kustom"
                    />
                  </div>
                </div>
              )}

              {/* Blend Mode: Realistis Kain vs Solid */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Efek Pewarnaan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBrushBlendMode('multiply')}
                    className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                      brushBlendMode === 'multiply'
                        ? 'bg-orange-50 border-[#ff5e00] text-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-[11px] text-[#ff5e00]">🧵 Realistis Kain</div>
                    <div className="text-[9px] text-slate-500">Lipatan & bayangan tetap tampak nyata</div>
                  </button>
                  <button
                    onClick={() => setBrushBlendMode('source-over')}
                    className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                      brushBlendMode === 'source-over'
                        ? 'bg-orange-50 border-[#ff5e00] text-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-[11px] text-slate-900">🎨 Cat Solid</div>
                    <div className="text-[9px] text-slate-500">Menutup rata warna asli kain</div>
                  </button>
                </div>
              </div>

              {/* Opacity Kuas */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-bold">Kepekatan (Opacity)</span>
                  <span className="font-mono text-slate-800 font-bold">{brushOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(parseInt(e.target.value))}
                  className="w-full accent-[#ff5e00] cursor-pointer"
                />
              </div>

              {/* Action Buttons: Undo, Redo & Reset */}
              <div className="pt-2 border-t border-slate-100 flex gap-1.5">
                <button
                  type="button"
                  onClick={handleGlobalUndo}
                  disabled={unifiedUndoStack.length === 0}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Batalkan Tindakan (Ctrl+Z)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={handleGlobalRedo}
                  disabled={unifiedRedoStack.length === 0}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Kembalikan Tindakan (Ctrl+Y)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Redo</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearPaint}
                  className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Hapus semua goresan kuas di sudut ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLYOUT 2: TEXT TOOL */}
        {activeFlyout === 'text' && (
          <div className="absolute left-16 top-3 z-40 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide text-slate-900">Alat Teks Sablon / Bordir</h4>
              </div>
              <button
                onClick={() => setActiveFlyout(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Isi Tulisan
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                  placeholder="Contoh: ZY APPAREL, LOGISTIK..."
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#ff5e00] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Jenis Font
                </label>
                <select
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#ff5e00]"
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
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
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
                        textColor === color ? 'border-[#ff5e00] scale-110 shadow-sm' : 'border-slate-300'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-6 h-6 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                    title="Pilih Warna Kustom"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Teknik Cetak
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTextTechnique('bordir')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      textTechnique === 'bordir'
                        ? 'bg-[#ff5e00] border-[#ff5e00] text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧵 Bordir Komputer
                  </button>
                  <button
                    onClick={() => setTextTechnique('sablon')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      textTechnique === 'sablon'
                        ? 'bg-[#ff5e00] border-[#ff5e00] text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
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
                className="w-full mt-2 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Pasang Teks ke Kanvas
              </button>
            </div>
          </div>
        )}

        {/* FLYOUT 3: PRESETS */}
        {activeFlyout === 'presets' && (
          <div className="absolute left-16 top-16 z-40 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide text-slate-900">Emblem Cepat & Posisi</h4>
              </div>
              <button
                onClick={() => setActiveFlyout(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">
                  Emblem Standar Nasional
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleApplyIndonesianFlag('sleeve')
                      setActiveFlyout(null)
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                    title="Pasang Bordir Bendera Indonesia di Bahu / Lengan Kanan"
                  >
                    <div className="w-7 h-5 rounded overflow-hidden shrink-0 border border-amber-600 shadow-2xs relative bg-slate-900 flex flex-col justify-between p-0.5">
                      <div className="h-1.5 bg-red-600 rounded-2xs" />
                      <div className="h-1.5 bg-white rounded-2xs" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-black">
                        Bendera RI
                      </div>
                      <div className="text-[9px] text-slate-500">Bahu Kanan</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleApplyIndonesianFlag('chest')
                      setActiveFlyout(null)
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                    title="Pasang Bordir Bendera Indonesia di Dada Kanan"
                  >
                    <div className="w-7 h-5 rounded overflow-hidden shrink-0 border border-amber-600 shadow-2xs relative bg-slate-900 flex flex-col justify-between p-0.5">
                      <div className="h-1.5 bg-red-600 rounded-2xs" />
                      <div className="h-1.5 bg-white rounded-2xs" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-black">
                        Bendera RI
                      </div>
                      <div className="text-[9px] text-slate-500">Dada Kanan</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleAddPresetLogo('k3')
                      setActiveFlyout(null)
                    }}
                    className="col-span-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0 border border-white/40 shadow-2xs">
                      <span className="text-white text-xs font-black">+</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-black">
                        Logo K3
                      </div>
                      <div className="text-[9px] text-slate-500">Keselamatan Kerja</div>
                    </div>
                  </button>
                </div>
              </div>

              {selectedGraphic && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">
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
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <div className="font-bold text-[11px] text-slate-700">{preset.label}</div>
                        <div className="text-[9px] text-slate-400 capitalize">{preset.side}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLYOUT 4: STUDIO LIGHTING */}
        {activeFlyout === 'lighting' && (
          <div className="absolute left-16 top-28 z-40 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide text-slate-900">Studio Lighting Seragam</h4>
              </div>
              <button
                onClick={() => setActiveFlyout(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Kecerahan (Brightness)</span>
                  <span className="font-mono text-slate-800 font-bold">{lighting.brightness}%</span>
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
                  <span className="text-slate-600 font-medium">Kontras (Contrast)</span>
                  <span className="font-mono text-slate-800 font-bold">{lighting.contrast}%</span>
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
                  <span className="text-slate-600 font-medium">Saturasi Warna</span>
                  <span className="font-mono text-slate-800 font-bold">{lighting.saturation}%</span>
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
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2"
              >
                Reset Efek Cahaya
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CENTER MASSIVE CANVASS VIEWPORT (Light, Bright & Comfortable) */}
        {/* ---------------------------------------------------- */}
        <div
          ref={viewportRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-[#f8f9fc] cursor-default"
          style={{
            minHeight: '680px',
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1.25px, transparent 1.25px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* User's Realistic Mockup Stage with EXACT 1:1 BOUNDING WRAPPER MATCHING CANVAS OWNER */}
          <div
            ref={stageRef}
            className="relative flex items-center justify-center transition-transform drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] select-none shrink-0"
            style={{
              width: `${Math.round(stageDisplayWidth)}px`,
              height: `${Math.round(stageDisplayHeight)}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            {/* If photo not uploaded */}
            {!currentMockupImage ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-3xl max-w-sm pointer-events-auto bg-white/95 backdrop-blur-xs shadow-md">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-extrabold text-slate-900">
                  Foto {currentSide.toUpperCase()} Belum Di-upload
                </p>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">
                  Anda belum meng-upload foto sisi ini untuk "{activeMockup?.name || 'Mockup'}".
                </p>
                <button
                  onClick={() => onOpenDashboard()}
                  className="px-4 py-2 bg-[#ff5e00] hover:bg-[#e05300] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Upload Foto di Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* 1-3. SHIRT BASE & MULTIPLY COLOR PARTS (Masked strictly to garment silhouette) */}
                <div
                  style={clippingMaskStyle}
                  className="w-full h-full absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                >
                  {/* 1. The Base Shirt Mockup Photo */}
                  <img
                    src={currentMockupImage}
                    alt={`${activeMockup?.name || 'Mockup'} - ${currentSide}`}
                    style={filterStyle}
                    className="w-full h-full object-contain select-none pointer-events-none"
                  />

                  {/* 1.5 WARNA KESELURUHAN SERAGAM (BASE GARMENT COLOR - POSISI SELALU DI BAWAH LAYER-LAYER) */}
                  {baseGarmentColor && !isBaseColorHidden && (
                    <canvas
                      ref={baseCanvasRef}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-opacity duration-150 z-2"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  )}

                  {/* 2. AUTOMATIC COLORABLE PARTS (Kerah, Saku, Kancing, Garis Kancing - Multiply Blending absorbs directly into fabric!) */}
                  {currentSideColorParts.map((part, pIdx) => {
                    const allParts = activeMockup?.colorParts || []
                    const groupKey = getPartMatchKey(part, allParts)
                    if (hiddenColorPartKeys.includes(groupKey) || hiddenColorPartKeys.includes(part.id)) {
                      return null
                    }
                    const color = getPartColor(part)
                    if (!part.maskImg || !color) return null
                    return (
                      <div
                        key={part.id}
                        style={{
                          zIndex: 5 + (currentSideColorParts.length - pIdx),
                          WebkitMaskImage: `url("${part.maskImg}")`,
                          maskImage: `url("${part.maskImg}")`,
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          backgroundColor: color,
                          mixBlendMode: 'multiply',
                        }}
                        className="absolute inset-0 w-full h-full pointer-events-none select-none transition-colors duration-150"
                      />
                    )
                  })}

                  {/* 3. INTERACTIVE PAINT CANVAS (Kuas Pewarna Saku/Kancing/Kerah - Multiply Blending preserves fabric folds & texture!) */}
                  <canvas
                    ref={paintCanvasRef}
                    width={1200}
                    height={1400}
                    onMouseDown={handlePaintMouseDown}
                    onMouseMove={handlePaintMouseMove}
                    onMouseUp={handlePaintMouseUp}
                    onMouseLeave={handlePaintMouseUp}
                    style={{
                      mixBlendMode: brushBlendMode === 'multiply' ? 'multiply' : 'normal',
                      opacity: brushOpacity / 100,
                    }}
                    className={`absolute inset-0 w-full h-full object-contain ${
                      activeTool === 'brush' || activeTool === 'eraser'
                        ? 'pointer-events-auto cursor-crosshair z-25'
                        : 'pointer-events-none z-15'
                    }`}
                  />
                </div>

                {/* 3.8. AUTO CLIPPING MASK LAYER FOR GRAPHICS (Potong Otomatis Mengikuti Siluet Kontur Kain Baju) */}
                {isClippingMaskActive && currentMockupImage && (
                  <div
                    style={clippingMaskStyle}
                    className="w-full h-full absolute inset-0 pointer-events-none z-18 overflow-hidden"
                  >
                    {/* A. Masked Visuals for Current Side Graphics */}
                    {currentSideGraphics
                      .filter((g) => !hiddenGraphicIds.includes(g.id) && (g.enableAutoClipping ?? true))
                      .map((g) => {
                        const scaleX = (g.scaleX || 1) * g.scale
                        const scaleY = (g.scaleY || 1) * g.scale
                        return (
                          <div
                            key={`masked-vis-${g.id}`}
                            style={{
                              left: `${g.x}%`,
                              top: `${g.y}%`,
                              transform: `translate(-50%, -50%) perspective(500px) rotateX(${g.rotationX || 0}deg) rotateY(${g.rotationY || 0}deg) rotate(${g.rotationZ !== undefined ? g.rotationZ : g.rotation}deg)`,
                              transformOrigin: 'center center',
                              opacity: (g.opacity !== undefined ? g.opacity : 100) / 100,
                              mixBlendMode: g.blendMode || 'normal',
                            }}
                            className="absolute select-none pointer-events-none"
                          >
                            <div
                              style={{
                                transform: `scale(${scaleX}, ${scaleY})`,
                                transformOrigin: 'center center',
                              }}
                            >
                              {g.type === 'image' ? (
                                <div className="relative inline-block select-none">
                                  <img
                                    src={g.content}
                                    alt="graphic"
                                    className="max-w-[140px] max-h-[140px] object-contain select-none pointer-events-none block"
                                    style={{
                                      filter:
                                        g.technique === 'bordir'
                                          ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.7)) drop-shadow(1px 3px 5px rgba(0,0,0,0.5)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.85)) contrast(1.1) saturate(1.18)'
                                          : 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.35))',
                                    }}
                                  />

                                  {/* Realistic 3D Embroidery Overlays */}
                                  {g.technique === 'bordir' && (
                                    <>
                                      <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                          WebkitMaskImage: `url("${g.content}")`,
                                          maskImage: `url("${g.content}")`,
                                          WebkitMaskSize: 'contain',
                                          maskSize: 'contain',
                                          WebkitMaskRepeat: 'no-repeat',
                                          maskRepeat: 'no-repeat',
                                          WebkitMaskPosition: 'center',
                                          maskPosition: 'center',
                                          backgroundImage:
                                            'repeating-linear-gradient(55deg, rgba(255,255,255,0.42) 0px, rgba(255,255,255,0.42) 1.2px, transparent 1.2px, transparent 2.4px, rgba(0,0,0,0.38) 2.4px, rgba(0,0,0,0.38) 3.6px, transparent 3.6px, transparent 4.8px)',
                                          mixBlendMode: 'overlay',
                                        }}
                                      />
                                      <div
                                        className="absolute inset-0 pointer-events-none opacity-55"
                                        style={{
                                          WebkitMaskImage: `url("${g.content}")`,
                                          maskImage: `url("${g.content}")`,
                                          WebkitMaskSize: 'contain',
                                          maskSize: 'contain',
                                          WebkitMaskRepeat: 'no-repeat',
                                          maskRepeat: 'no-repeat',
                                          WebkitMaskPosition: 'center',
                                          maskPosition: 'center',
                                          backgroundImage:
                                            'repeating-linear-gradient(-35deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1.5px, transparent 1.5px, transparent 6px)',
                                          mixBlendMode: 'soft-light',
                                        }}
                                      />
                                    </>
                                  )}

                                  {g.technique === 'sablon' && (
                                    <div
                                      className="absolute inset-0 pointer-events-none opacity-25"
                                      style={{
                                        WebkitMaskImage: `url("${g.content}")`,
                                        maskImage: `url("${g.content}")`,
                                        WebkitMaskSize: 'contain',
                                        maskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskPosition: 'center',
                                        background:
                                          'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 65%)',
                                        mixBlendMode: 'screen',
                                      }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="relative inline-block select-none">
                                  <span
                                    style={{
                                      fontSize: `${g.fontSize || 22}px`,
                                      fontFamily: g.fontFamily || 'Montserrat',
                                      color: g.textColor || '#ffffff',
                                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                    }}
                                    className="font-bold whitespace-nowrap block px-2 py-0.5"
                                  >
                                    {g.content}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}

                    {/* B. Masked Visuals for Sleeve Projected Graphics */}
                    {sleeveProjectedGraphics
                      .filter((proj) => proj.enableAutoClipping)
                      .map((proj) => {
                        return (
                          <div
                            key={`masked-proj-${proj.graphic.id}`}
                            style={{
                              left: `${proj.x}%`,
                              top: `${proj.y}%`,
                              transform: `translate(-50%, -50%) perspective(500px) rotateX(${proj.rotationX || 0}deg) rotateY(${proj.rotationY || 0}deg) rotateZ(${proj.rotationZ !== undefined ? proj.rotationZ : (proj.graphic.rotation || 0)}deg) scale(${proj.scaleX}, ${proj.scaleY})`,
                              transformOrigin: 'center center',
                              opacity: (proj.graphic.opacity !== undefined ? proj.graphic.opacity : 100) / 100,
                              mixBlendMode: proj.graphic.blendMode || 'normal',
                            }}
                            className="absolute select-none pointer-events-none"
                          >
                            <div className="relative inline-block select-none">
                              <img
                                src={proj.graphic.content}
                                alt="projected-sleeve-logo"
                                className="max-w-[140px] max-h-[140px] object-contain select-none pointer-events-none block"
                                style={{
                                  filter:
                                    proj.graphic.technique === 'bordir'
                                      ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.65)) drop-shadow(1px 2px 4px rgba(0,0,0,0.4)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.85)) contrast(1.1) saturate(1.15)'
                                      : 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                                }}
                              />

                              {proj.graphic.technique === 'bordir' && (
                                <>
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      WebkitMaskImage: `url("${proj.graphic.content}")`,
                                      maskImage: `url("${proj.graphic.content}")`,
                                      WebkitMaskSize: 'contain',
                                      maskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      maskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'center',
                                      maskPosition: 'center',
                                      backgroundImage:
                                        'repeating-linear-gradient(55deg, rgba(255,255,255,0.42) 0px, rgba(255,255,255,0.42) 1.2px, transparent 1.2px, transparent 2.4px, rgba(0,0,0,0.38) 2.4px, rgba(0,0,0,0.38) 3.6px, transparent 3.6px, transparent 4.8px)',
                                      mixBlendMode: 'overlay',
                                    }}
                                  />
                                  <div
                                    className="absolute inset-0 pointer-events-none opacity-55"
                                    style={{
                                      WebkitMaskImage: `url("${proj.graphic.content}")`,
                                      maskImage: `url("${proj.graphic.content}")`,
                                      WebkitMaskSize: 'contain',
                                      maskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      maskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'center',
                                      maskPosition: 'center',
                                      backgroundImage:
                                        'repeating-linear-gradient(-35deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1.5px, transparent 1.5px, transparent 6px)',
                                      mixBlendMode: 'soft-light',
                                    }}
                                  />
                                </>
                              )}

                              {/* Cylindrical Sheen */}
                              <div
                                className="absolute inset-0 pointer-events-none opacity-20"
                                style={{
                                  WebkitMaskImage: `url("${proj.graphic.content}")`,
                                  maskImage: `url("${proj.graphic.content}")`,
                                  WebkitMaskSize: 'contain',
                                  maskSize: 'contain',
                                  WebkitMaskRepeat: 'no-repeat',
                                  maskRepeat: 'no-repeat',
                                  WebkitMaskPosition: 'center',
                                  maskPosition: 'center',
                                  background: proj.isViewerRight
                                    ? 'linear-gradient(to right, transparent 30%, rgba(255,255,255,0.6) 65%, transparent 85%)'
                                    : 'linear-gradient(to left, transparent 30%, rgba(255,255,255,0.6) 65%, transparent 85%)',
                                  mixBlendMode: 'screen',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}

                    {/* C. Sample Emblems with Auto-Clipping Mask (Matching Canvas Owner) */}
                    {showGuidelines && (
                      <>
                        {currentPrintZones
                          .filter((z) => {
                            const hasG = currentSideGraphics.some(
                              (g) =>
                                Math.abs(g.x - z.x) <= Math.max(z.width / 2, 4) &&
                                Math.abs(g.y - z.y) <= Math.max(z.height / 2, 4)
                            )
                            const hasP = sleeveProjectedGraphics.some(
                              (p) =>
                                Math.abs(p.x - z.x) <= Math.max(z.width / 2, 4) &&
                                Math.abs(p.y - z.y) <= Math.max(z.height / 2, 4)
                            )
                            return !hasG && !hasP && (z.enableAutoClipping ?? true)
                          })
                          .map((zone) => (
                            <div
                              key={`cz-sample-masked-${zone.id}`}
                              style={{
                                left: `${zone.x}%`,
                                top: `${zone.y}%`,
                                width: `${zone.width}%`,
                                height: `${zone.height}%`,
                                transform: `translate(-50%, -50%) perspective(500px) rotateX(${zone.rotationX || 0}deg) rotateY(${zone.rotationY || 0}deg) rotateZ(${zone.rotationZ || 0}deg)`,
                                transformOrigin: 'center center',
                              }}
                              className="absolute pointer-events-none z-10"
                            >
                              {renderSampleEmblem(zone)}
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                )}

                {/* 3.9 UNMASKED SAMPLE EMBLEMS (For zones without auto-clipping or when clipping is off) */}
                {showGuidelines && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none z-17 overflow-hidden">
                    {currentPrintZones
                      .filter((z) => {
                        const hasG = currentSideGraphics.some(
                          (g) =>
                            Math.abs(g.x - z.x) <= Math.max(z.width / 2, 4) &&
                            Math.abs(g.y - z.y) <= Math.max(z.height / 2, 4)
                        )
                        const hasP = sleeveProjectedGraphics.some(
                          (p) =>
                            Math.abs(p.x - z.x) <= Math.max(z.width / 2, 4) &&
                            Math.abs(p.y - z.y) <= Math.max(z.height / 2, 4)
                        )
                        return !hasG && !hasP && (!isClippingMaskActive || !(z.enableAutoClipping ?? true))
                      })
                      .map((zone) => (
                        <div
                          key={`cz-sample-unmasked-${zone.id}`}
                          style={{
                            left: `${zone.x}%`,
                            top: `${zone.y}%`,
                            width: `${zone.width}%`,
                            height: `${zone.height}%`,
                            transform: `translate(-50%, -50%) perspective(500px) rotateX(${zone.rotationX || 0}deg) rotateY(${zone.rotationY || 0}deg) rotateZ(${zone.rotationZ || 0}deg)`,
                            transformOrigin: 'center center',
                          }}
                          className="absolute pointer-events-none z-10"
                        >
                          {renderSampleEmblem(zone)}
                        </div>
                      ))}
                  </div>
                )}

                {/* 4. GRAPHIC & TEXT ELEMENTS LAYER (UNMASKED - FRAME & CONTROLS NEVER CLIPPED BY SHIRT MASK!) */}
                <div
                  className={`absolute inset-0 w-full h-full ${
                    activeTool === 'select' ? 'pointer-events-auto' : 'pointer-events-none'
                  } z-20`}
                >
                  {currentSideGraphics
                    .filter((g) => !hiddenGraphicIds.includes(g.id))
                    .map((g, idx) => {
                      const isSelected = g.id === selectedGraphicId
                      const calc = getGraphicPriceForZoneOrScale(g, activeMockup?.printZones)
                      const scaleX = (g.scaleX || 1) * g.scale
                      const scaleY = (g.scaleY || 1) * g.scale

                      const isClipped = isClippingMaskActive && (g.enableAutoClipping ?? true)

                      return (
                        <React.Fragment key={`graphic-frag-${g.id}`}>
                          {/* Main Graphic Container */}
                          <div
                            id={`graphic-element-${g.id}`}
                            style={{
                              left: `${g.x}%`,
                              top: `${g.y}%`,
                              transform: `translate(-50%, -50%) perspective(500px) rotateX(${g.rotationX || 0}deg) rotateY(${g.rotationY || 0}deg) rotate(${g.rotationZ !== undefined ? g.rotationZ : g.rotation}deg)`,
                              transformOrigin: 'center center',
                              zIndex: isSelected ? 40 : 10 + idx,
                              opacity: (g.opacity !== undefined ? g.opacity : 100) / 100,
                              mixBlendMode: g.blendMode || 'normal',
                            }}
                            className={`absolute select-none pointer-events-auto ${
                              g.isLocked ? 'cursor-default' : 'cursor-move'
                            }`}
                          >
                            {/* Main Bounding Box */}
                            <div
                              onMouseDown={(e) => handleStartMove(e, g.id)}
                              className={`relative p-1 transition-all ${
                                isSelected
                                  ? 'border-2 border-[#ff5e00] rounded-lg shadow-sm bg-orange-500/5'
                                  : 'hover:border hover:border-[#ff5e00]/60 rounded-lg'
                              }`}
                            >
                              {/* Content Image / Text */}
                              <div
                                style={{
                                  transform: `scale(${scaleX}, ${scaleY})`,
                                  transformOrigin: 'center center',
                                  opacity: isClipped ? 0 : 1,
                                }}
                                className="pointer-events-none"
                              >
                            {g.type === 'image' ? (
                              <div className="relative inline-block select-none">
                                <img
                                  src={g.content}
                                  alt="graphic"
                                  className="max-w-[140px] max-h-[140px] object-contain select-none pointer-events-none block"
                                  style={{
                                    filter:
                                      g.technique === 'bordir'
                                        ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.7)) drop-shadow(1px 3px 5px rgba(0,0,0,0.5)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.85)) contrast(1.1) saturate(1.18)'
                                        : 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.35))',
                                  }}
                                />

                                {/* Realistic 3D Computer Embroidery (Bordir Komputer) Thread Ridge Overlays */}
                                {g.technique === 'bordir' ? (
                                  <>
                                    {/* 55-degree dense satin/tatami thread grooves */}
                                    <div
                                      className="absolute inset-0 pointer-events-none"
                                      style={{
                                        WebkitMaskImage: `url("${g.content}")`,
                                        maskImage: `url("${g.content}")`,
                                        WebkitMaskSize: 'contain',
                                        maskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskPosition: 'center',
                                        backgroundImage:
                                          'repeating-linear-gradient(55deg, rgba(255,255,255,0.42) 0px, rgba(255,255,255,0.42) 1.2px, transparent 1.2px, transparent 2.4px, rgba(0,0,0,0.38) 2.4px, rgba(0,0,0,0.38) 3.6px, transparent 3.6px, transparent 4.8px)',
                                        mixBlendMode: 'overlay',
                                      }}
                                    />
                                    {/* Subtle cross-thread satin sheen */}
                                    <div
                                      className="absolute inset-0 pointer-events-none opacity-55"
                                      style={{
                                        WebkitMaskImage: `url("${g.content}")`,
                                        maskImage: `url("${g.content}")`,
                                        WebkitMaskSize: 'contain',
                                        maskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskPosition: 'center',
                                        backgroundImage:
                                          'repeating-linear-gradient(-35deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1.5px, transparent 1.5px, transparent 6px)',
                                        mixBlendMode: 'soft-light',
                                      }}
                                    />
                                  </>
                                ) : (
                                  /* Subtle DTF / Plastisol smooth screenprint finish */
                                  <div
                                    className="absolute inset-0 pointer-events-none opacity-25"
                                    style={{
                                      WebkitMaskImage: `url("${g.content}")`,
                                      maskImage: `url("${g.content}")`,
                                      WebkitMaskSize: 'contain',
                                      maskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      maskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'center',
                                      maskPosition: 'center',
                                      background:
                                        'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 65%)',
                                      mixBlendMode: 'screen',
                                    }}
                                  />
                                )}
                              </div>
                            ) : (
                              /* Text Graphic with Bordir Embossed or Sablon Crisp Effect */
                              <div
                                style={{
                                  color: g.textColor || '#ffffff',
                                  fontFamily: g.fontFamily || 'Montserrat',
                                  fontSize: `${g.fontSize || 22}px`,
                                  textShadow:
                                    g.technique === 'bordir'
                                      ? '-1px -1px 0 rgba(255,255,255,0.65), 1px 1px 0 rgba(0,0,0,0.7), 2px 3px 3px rgba(0,0,0,0.6)'
                                      : '0 1px 2px rgba(0,0,0,0.4)',
                                  letterSpacing: g.technique === 'bordir' ? '0.04em' : 'normal',
                                }}
                                className="font-black whitespace-nowrap text-center px-2 py-0.5 relative select-none"
                              >
                                <span>{g.content}</span>
                                {g.technique === 'bordir' && (
                                  <span
                                    className="absolute inset-0 pointer-events-none opacity-35 px-2 py-0.5"
                                    style={{
                                      backgroundImage:
                                        'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 3px, #000000 3px, #000000 4px, transparent 4px, transparent 6px)',
                                      WebkitBackgroundClip: 'text',
                                      backgroundClip: 'text',
                                      color: 'transparent',
                                      mixBlendMode: 'overlay',
                                    }}
                                  >
                                    {g.content}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Photoshop Bounding Box Handles when Selected */}
                          {isSelected && (
                            <>
                              {/* Top Rotation Handle */}
                              <div
                                onMouseDown={(e) => handleStartRotate(e, g.id)}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#ff5e00] border-2 border-white rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-125 transition-transform z-30"
                                title="Klik & putar bebas (atau gunakan tombol rotasi di toolbar)"
                              >
                                <RotateCw className="w-2.5 h-2.5 text-white pointer-events-none" />
                              </div>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#ff5e00] pointer-events-none" />

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
                              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-[#ff5e00] text-[9px] font-mono font-bold px-1.5 rounded-full shadow-xs whitespace-nowrap">
                                {calc.sizeCategory.split(' ')[0]} • Rp {calc.price.toLocaleString('id-ID')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })}

                  {/* 4.5. LIVE 3D SLEEVE PROJECTIONS (Tampak Menyamping Rapi & Proporsional) */}
                  {sleeveProjectedGraphics.map((proj) => {
                    const isSelected = proj.graphic.id === selectedGraphicId

                    return (
                      <React.Fragment key={`proj-wrap-${proj.graphic.id}`}>
                        {/* B. VISUAL ELEMENT - FORESHORTENED SLEEVE GRAPHIC */}
                        <div
                          key={`proj-${proj.graphic.id}`}
                          onMouseDown={(e) => handleStartMove(e, proj.graphic.id)}
                          style={{
                            left: `${proj.x}%`,
                            top: `${proj.y}%`,
                            transform: `translate(-50%, -50%) perspective(500px) rotateX(${proj.rotationX || 0}deg) rotateY(${proj.rotationY || 0}deg) rotateZ(${proj.rotationZ !== undefined ? proj.rotationZ : (proj.graphic.rotation || 0)}deg) scale(${proj.scaleX}, ${proj.scaleY})`,
                            transformOrigin: 'center center',
                            zIndex: isSelected ? 40 : 25,
                            opacity: (proj.graphic.opacity !== undefined ? proj.graphic.opacity : 100) / 100,
                            mixBlendMode: proj.graphic.blendMode || 'normal',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGraphicId(proj.graphic.id)
                          }}
                          className={`absolute select-none pointer-events-auto cursor-grab active:cursor-grabbing group/proj transition-all duration-150 ${
                            isSelected
                              ? 'ring-2 ring-[#ff5e00] rounded-xl p-1 shadow-md bg-orange-500/5'
                              : 'hover:ring-1 hover:ring-orange-400/60 rounded-lg'
                          }`}
                          title={`Desain Lengan ${proj.isWearerLeft ? 'Kiri' : 'Kanan'} (Tampak Menyamping) - Klik untuk pilih, drag untuk geser`}
                        >
                          {/* Visual Content: Image with Bordir / Sablon */}
                          <div
                            style={{
                              opacity: (isClippingMaskActive && proj.enableAutoClipping) ? 0 : 1,
                            }}
                            className="relative inline-block select-none"
                          >
                            <img
                              src={proj.graphic.content}
                              alt="projected-sleeve-logo"
                              className="max-w-[140px] max-h-[140px] object-contain select-none pointer-events-none block"
                              style={{
                                filter:
                                  proj.graphic.technique === 'bordir'
                                    ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.65)) drop-shadow(1px 2px 4px rgba(0,0,0,0.4)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.85)) contrast(1.1) saturate(1.15)'
                                    : 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                              }}
                            />

                            {/* Realistic 3D Computer Embroidery Overlay (Bordir) */}
                            {proj.graphic.technique === 'bordir' && (
                              <>
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={{
                                    WebkitMaskImage: `url("${proj.graphic.content}")`,
                                    maskImage: `url("${proj.graphic.content}")`,
                                    WebkitMaskSize: 'contain',
                                    maskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center',
                                    maskPosition: 'center',
                                    backgroundImage:
                                      'repeating-linear-gradient(55deg, rgba(255,255,255,0.42) 0px, rgba(255,255,255,0.42) 1.2px, transparent 1.2px, transparent 2.4px, rgba(0,0,0,0.38) 2.4px, rgba(0,0,0,0.38) 3.6px, transparent 3.6px, transparent 4.8px)',
                                    mixBlendMode: 'overlay',
                                  }}
                                />
                                <div
                                  className="absolute inset-0 pointer-events-none opacity-55"
                                  style={{
                                    WebkitMaskImage: `url("${proj.graphic.content}")`,
                                    maskImage: `url("${proj.graphic.content}")`,
                                    WebkitMaskSize: 'contain',
                                    maskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center',
                                    maskPosition: 'center',
                                    backgroundImage:
                                      'repeating-linear-gradient(-35deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1.5px, transparent 1.5px, transparent 6px)',
                                    mixBlendMode: 'soft-light',
                                  }}
                                />
                              </>
                            )}

                            {/* Soft Cylindrical Highlight Sheen on fabric curve (NO dark dirty shadow) */}
                            <div
                              className="absolute inset-0 pointer-events-none opacity-20"
                              style={{
                                WebkitMaskImage: `url("${proj.graphic.content}")`,
                                maskImage: `url("${proj.graphic.content}")`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center',
                                background: proj.isViewerRight
                                  ? 'linear-gradient(to right, transparent 30%, rgba(255,255,255,0.6) 65%, transparent 85%)'
                                  : 'linear-gradient(to left, transparent 30%, rgba(255,255,255,0.6) 65%, transparent 85%)',
                                mixBlendMode: 'screen',
                              }}
                            />
                          </div>

                          {/* Mini Hover Pill when not selected */}
                          {!isSelected && (
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/proj:opacity-100 transition-opacity bg-slate-900/90 text-white px-2 py-0.5 rounded-full text-[8.5px] font-bold shadow-lg border border-slate-700 whitespace-nowrap pointer-events-auto flex items-center gap-1 z-30">
                              <span className="text-[#ff5e00]">🔗 Lengan {proj.isWearerLeft ? 'Kiri' : 'Kanan'}</span>
                              <span className="text-slate-400">• Menyamping</span>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>

                {/* 5. GARIS PANDUAN SABLON & TITIK UPLOAD (PRINT SAFE ZONES) - DI DEPAN OBJEK SERAGAM */}
                {showGuidelines && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none z-30">
                    {currentPrintZones.map((zone) => {
                      // Check whether a graphic currently occupies this print safe zone
                      const graphicsInZone = currentSideGraphics.filter(
                        (g) =>
                          Math.abs(g.x - zone.x) <= Math.max(zone.width / 2, 4) &&
                          Math.abs(g.y - zone.y) <= Math.max(zone.height / 2, 4)
                      )
                      const projectedInZone = sleeveProjectedGraphics.filter(
                        (p) =>
                          Math.abs(p.x - zone.x) <= Math.max(zone.width / 2, 4) &&
                          Math.abs(p.y - zone.y) <= Math.max(zone.height / 2, 4)
                      )
                      const hasGraphic = graphicsInZone.length > 0 || projectedInZone.length > 0

                      return (
                        <div
                          key={zone.id}
                          style={{
                            left: `${zone.x}%`,
                            top: `${zone.y}%`,
                            width: `${zone.width}%`,
                            height: `${zone.height}%`,
                            transform: `translate(-50%, -50%) perspective(500px) rotateX(${zone.rotationX || 0}deg) rotateY(${zone.rotationY || 0}deg) rotateZ(${zone.rotationZ || 0}deg)`,
                            transformOrigin: 'center center',
                          }}
                          onClick={(e) => {
                            if (!hasGraphic) {
                              e.stopPropagation()
                              handleInitiateUploadForZone(zone)
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const file = e.dataTransfer.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string
                                setUploadModalData({
                                  dataUrl,
                                  fileName: file.name.replace(/\.[^/.]+$/, '').slice(0, 24),
                                  targetZoneId: zone.id,
                                  technique: activeTechnique || 'bordir',
                                })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className={`absolute border-2 rounded-2xl flex flex-col items-center justify-between p-1.5 transition-all group/zone ${
                            !hasGraphic
                              ? 'border-dashed border-indigo-500/80 bg-indigo-500/10 hover:border-[#ff5e00] hover:bg-[#ff5e00]/15 pointer-events-auto cursor-pointer shadow-xs backdrop-blur-[0.5px]'
                              : 'border-transparent pointer-events-none'
                          }`}
                          title={
                            !hasGraphic
                              ? `Klik untuk upload desain ke titik ${zone.name}`
                              : `Titik Produksi: ${zone.name}`
                          }
                        >
                          {/* Center size info matching Canvas Owner */}
                          <div className="flex flex-col items-center pointer-events-none z-10">
                            {zone.maxSizeCm && (
                              <span className="text-[8px] font-mono font-semibold text-slate-800 bg-white/90 px-1.5 py-0.2 rounded border border-slate-200 shadow-2xs">
                                {zone.maxSizeCm}
                              </span>
                            )}
                          </div>

                          {/* Hover Upload Button */}
                          {!hasGraphic ? (
                            <div className="pointer-events-auto opacity-0 group-hover/zone:opacity-100 transition-opacity my-auto flex items-center gap-1 px-2.5 py-1 bg-[#ff5e00] hover:bg-[#e05300] text-white rounded-lg text-[9px] font-bold shadow-md transform group-hover/zone:scale-105 active:scale-95 cursor-pointer">
                              <Upload className="w-3 h-3 text-white" />
                              <span>Upload Desain</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInitiateUploadForZone(zone)
                              }}
                              className="pointer-events-auto opacity-0 group-hover/zone:opacity-100 transition-opacity my-auto flex items-center gap-1 px-2.5 py-1 bg-slate-900/95 hover:bg-[#ff5e00] text-white rounded-xl text-[9px] font-bold shadow-lg border border-slate-700 hover:border-orange-500 cursor-pointer"
                              title={`Tambah atau ganti desain di titik ${zone.name}`}
                            >
                              <Upload className="w-3 h-3 text-[#ff5e00] group-hover:text-white" />
                              <span>+ Ganti / Tambah</span>
                            </button>
                          )}

                          {/* Corner markers matching Canvas Owner */}
                          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-slate-700 pointer-events-none" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 pointer-events-none" />
                          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-slate-700 pointer-events-none" />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-slate-700 pointer-events-none" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* RIGHT DOCKED LAYERS & PRICING PANEL (Light & Crisp) */}
        {/* ---------------------------------------------------- */}
        {showLayersPanel && (
          <div className="w-76 xl:w-80 bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 z-20">
            {/* Panel Header */}
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff5e00]" />
                <h4 className="font-extrabold text-xs tracking-wide text-slate-900">
                  Daftar Layers ({unifiedPartGroups.length + graphics.length})
                </h4>
              </div>
              <button
                onClick={() => setShowLayersPanel(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup Panel Layers"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Layers List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[calc(100vh-320px)] min-h-[260px]">
              {/* 1. SECTION: BAGIAN KAIN & POLA SERAGAM (MASKING COLOR LAYERS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    <Palette className="w-3.5 h-3.5 text-[#ff5e00]" />
                    <span>Bagian Kain ({unifiedPartGroups.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Klik untuk ubah warna</span>
                </div>

                {unifiedPartGroups.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">Belum Ada Pola Bagian</p>
                    <p className="text-[10px] mt-0.5">Buka Dashboard untuk membuat masker zona warna.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {unifiedPartGroups.map((group) => {
                      const isHidden = hiddenColorPartKeys.includes(group.key)
                      const swatchInfo = findClosestFabricSwatch(group.currentColor)

                      return (
                        <div
                          key={group.key}
                          onClick={() => setActiveColorPickerGroupKey(group.key)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                            activeColorPickerGroupKey === group.key
                              ? 'bg-orange-50/90 border-[#ff5e00] shadow-2xs ring-1 ring-[#ff5e00]/30'
                              : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                          } ${isHidden ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Tombol Mata-mata (Fungsi Layer Visibility) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleColorPartVisibility(group.key)
                              }}
                              title={isHidden ? `Aktifkan warna ${group.name}` : `Sembunyikan warna ${group.name}`}
                              className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                            >
                              {isHidden ? (
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                            </button>

                            {/* Icon Khusus Bagian Pakaian (Garment Part Icon) */}
                            <div
                              className="w-8 h-8 rounded-xl bg-white group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs transition-colors"
                              title={`Bagian: ${group.name}`}
                            >
                              <GarmentPartIcon
                                iconId={group.icon}
                                partName={group.name}
                                className="w-4 h-4 stroke-[2.2]"
                              />
                            </div>

                            {/* Bulatan Warna Kain */}
                            <div
                              style={{ backgroundColor: group.currentColor }}
                              className="w-5 h-5 rounded-full border-2 border-white ring-1 ring-slate-300 shrink-0 shadow-2xs"
                              title={`Warna Aktif: ${group.currentColor}`}
                            />

                            {/* Nama Bagian & Info Kain Pabrik */}
                            <div className="min-w-0 flex-1">
                              {renamingGroupKey === group.key ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={renamingGroupName}
                                    onChange={(e) => setRenamingGroupName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveGroupName(group.key)
                                      if (e.key === 'Escape') setRenamingGroupKey(null)
                                    }}
                                    onBlur={() => handleSaveGroupName(group.key)}
                                    autoFocus
                                    className="h-6 px-1.5 text-xs font-bold rounded border border-indigo-500 bg-white text-slate-900 focus:outline-hidden w-28 shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveGroupName(group.key)}
                                    className="p-1 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer"
                                    title="Simpan Nama Layer"
                                  >
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRenamingGroupKey(null)}
                                    className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                                    title="Batal"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    onDoubleClick={(e) => {
                                      e.stopPropagation()
                                      handleStartRenameGroup(group.key, group.name)
                                    }}
                                    className="font-black text-xs text-slate-900 cursor-pointer hover:underline"
                                    title={`${group.name} (Klik 2x untuk ganti nama layer)`}
                                  >
                                    {group.name}
                                  </span>
                                  {group.sides.length === 4 ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shrink-0">
                                      4 Sisi
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                                      {group.sides.length} Sisi
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                {swatchInfo ? (
                                  <span className="font-medium text-slate-700 truncate">
                                    {swatchInfo.code} • {swatchInfo.name}
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-400">{group.currentColor}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Indikator Palet Warna (Tanpa tombol teks yang memakan tempat) */}
                          <div className="flex items-center shrink-0 pr-1 text-slate-400 group-hover:text-[#ff5e00] transition-colors" title="Klik kartu untuk ubah warna kain">
                            <Palette className="w-4 h-4" />
                          </div>
                        </div>
                      )
                    })}

                    {/* LAYER PALING BAWAH: WARNA KESELURUHAN SERAGAM (SELALU DI BAWAH SEMUA LAYER) */}
                    <div
                      onClick={() => {
                        setActiveTool('palette')
                        setActiveColorPickerGroupKey('__base__')
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                        activeColorPickerGroupKey === '__base__'
                          ? 'bg-orange-50/90 border-[#ff5e00] shadow-2xs ring-1 ring-[#ff5e00]/30'
                          : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                      } ${isBaseColorHidden ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Tombol Mata-mata (Visibility Warna Dasar) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            pushHistorySnapshot()
                            setIsBaseColorHidden((prev) => !prev)
                          }}
                          title={
                            isBaseColorHidden
                              ? 'Tampilkan warna keseluruhan seragam'
                              : 'Sembunyikan warna keseluruhan seragam'
                          }
                          className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                        >
                          {isBaseColorHidden ? (
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-[#ff5e00]" />
                          )}
                        </button>

                        {/* Icon Seluruh Seragam */}
                        <div
                          className="w-8 h-8 rounded-xl bg-orange-100/60 group-hover:bg-[#ff5e00]/15 border border-orange-200 text-[#ff5e00] flex items-center justify-center shrink-0 shadow-2xs transition-colors"
                          title="Seluruh Seragam"
                        >
                          <GarmentPartIcon
                            iconId="all_garment"
                            className="w-4 h-4 stroke-[2.2]"
                          />
                        </div>

                        {/* Bulatan Warna Dasar */}
                        <div
                          style={{ backgroundColor: baseGarmentColor }}
                          className="w-5 h-5 rounded-full border-2 border-white ring-1 ring-slate-300 shrink-0 shadow-2xs"
                          title={`Warna Dasar: ${baseGarmentColor}`}
                        />

                        {/* Keterangan Layer */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs text-slate-900 tracking-tight">
                              Warna Keseluruhan Seragam
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-100 text-[#ff5e00] font-black shrink-0">
                              Lapisan Bawah
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            {(() => {
                              const swatch = findClosestFabricSwatch(baseGarmentColor)
                              return swatch ? (
                                <span className="font-medium text-slate-700 truncate">
                                  {swatch.code} • {swatch.name}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400">{baseGarmentColor}</span>
                              )
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Indikator Palet Warna */}
                      <div className="flex items-center shrink-0 pr-1 text-slate-400 group-hover:text-[#ff5e00] transition-colors" title="Klik kartu untuk ubah warna seluruh seragam">
                        <Palette className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SECTION: ELEMEN DESAIN (LOGO, BORDIR & TEKS) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Elemen Desain ({graphics.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Bordir & Sablon</span>
                </div>

                {/* BADGE EMBLEM STANDAR PDH: BENDERA INDONESIA (SIAP PAKAI) */}
                <div className="p-2.5 bg-gradient-to-br from-slate-50 to-amber-50/40 border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Real Flag Badge Mini Thumbnail */}
                      <div className="w-8 h-5.5 rounded overflow-hidden shrink-0 border border-amber-600/90 shadow-2xs relative bg-slate-900 flex flex-col justify-between p-0.5">
                        <div className="w-full h-2 bg-red-600 rounded-2xs" />
                        <div className="w-full h-2 bg-white rounded-2xs" />
                        <div className="absolute inset-0 border border-dashed border-amber-300/60 rounded-sm pointer-events-none" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                          <span>Bendera Indonesia</span>
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-100/90 px-1 py-0.2 rounded">Bordir</span>
                        </div>
                        <div className="text-[9.5px] text-slate-500">
                          {indonesianFlag ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                              Terpasang di {flagLocation === 'sleeve' ? 'Bahu Kanan' : 'Dada Kanan'}
                            </span>
                          ) : (
                            'Standar Seragam PDH Nasional'
                          )}
                        </div>
                      </div>
                    </div>

                    {indonesianFlag && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveIndonesianFlag()
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Bendera Indonesia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 1-Click Positioning Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleApplyIndonesianFlag('sleeve')}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        flagLocation === 'sleeve'
                          ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                      title="Pasang di Bahu / Lengan Kanan seragam PDH"
                    >
                      <span>{flagLocation === 'sleeve' ? '✓ Bahu Kanan' : '📍 Bahu Kanan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyIndonesianFlag('chest')}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        flagLocation === 'chest'
                          ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                      title="Pasang di Dada Kanan seragam PDH"
                    >
                      <span>{flagLocation === 'chest' ? '✓ Dada Kanan' : '📍 Dada Kanan'}</span>
                    </button>
                  </div>
                </div>

                {/* 2.1. PENGATURAN ELEMEN TERPILIH (FOKUS TOOLS: ROTASI, POSISI & UKURAN) */}
                {selectedGraphic && (
                  <div className="p-3 bg-white border-2 border-[#ff5e00] rounded-2xl shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-100">
                    {/* Header: Nama & Info */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                          {selectedGraphic.type === 'image' ? (
                            <img src={selectedGraphic.content} alt="" className="w-5 h-5 object-contain" />
                          ) : (
                            <Type className="w-4 h-4 text-[#ff5e00]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black text-slate-800 truncate">
                            {selectedGraphic.label || (selectedGraphic.type === 'text' ? selectedGraphic.content : 'Elemen Terpilih')}
                          </div>
                          <div className="text-[9px] text-slate-400 capitalize">
                            Sisi: <span className="font-bold text-slate-600">{selectedGraphic.side}</span>
                            {selectedGraphic.side === 'left' || selectedGraphic.side === 'right' ? ' (Lengan / Bahu)' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteGraphic(selectedGraphic.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Elemen ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGraphicId(null)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Tutup Pengaturan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* GRUP 1: ROTASI (2D & 3D) */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                        <span>Rotasi</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleResetRotation(selectedGraphic.id)
                            handleResetGraphic3D(selectedGraphic.id)
                          }}
                          className="text-[9px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Reset semua rotasi ke 0°"
                        >
                          Reset 0°
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        {/* Rotasi 2D (Z) */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-col justify-between">
                          <div className="text-[9px] font-bold text-pink-600 mb-1 flex items-center justify-between">
                            <span>Rotasi 2D</span>
                            <span className="font-mono font-bold text-[10px] text-slate-800">
                              {selectedGraphic.rotationZ !== undefined ? selectedGraphic.rotationZ : (selectedGraphic.rotation || 0)}°
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleRotateGraphicBy(selectedGraphic.id, -45)}
                              className="px-1 py-0.5 text-[8.5px] bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 rounded font-mono"
                              title="Putar -45°"
                            >-45°</button>
                            <button
                              type="button"
                              onClick={() => handleNudgeGraphicRotationZ(selectedGraphic.id, -5)}
                              className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-bold cursor-pointer text-xs"
                              title="Putar -5°"
                            >-</button>
                            <button
                              type="button"
                              onClick={() => handleNudgeGraphicRotationZ(selectedGraphic.id, 5)}
                              className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-bold cursor-pointer text-xs"
                              title="Putar +5°"
                            >+</button>
                            <button
                              type="button"
                              onClick={() => handleRotateGraphicBy(selectedGraphic.id, 45)}
                              className="px-1 py-0.5 text-[8.5px] bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 rounded font-mono"
                              title="Putar +45°"
                            >+45°</button>
                          </div>
                        </div>

                        {/* Rotasi 3D Y (Yaw Menyamping) */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-col justify-between">
                          <div className="text-[9px] font-bold text-amber-600 mb-1 flex items-center justify-between">
                            <span>3D Samping (Y)</span>
                            <span className="font-mono font-bold text-[10px] text-slate-800">
                              {selectedGraphic.rotationY || 0}°
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleNudgeGraphicRotationY(selectedGraphic.id, -5)}
                              className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-bold cursor-pointer text-xs"
                              title="Putar Y -5°"
                            >-</button>
                            <button
                              type="button"
                              onClick={() => handleNudgeGraphicRotationY(selectedGraphic.id, 5)}
                              className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-bold cursor-pointer text-xs"
                              title="Putar Y +5°"
                            >+</button>
                          </div>
                        </div>

                        {/* Rotasi 3D X (Pitch Menunduk) */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-col justify-between">
                          <div className="text-[9px] font-bold text-cyan-600 mb-1 flex items-center justify-between">
                            <span>3D Nunduk (X)</span>
                            <span className="font-mono font-bold text-[10px] text-slate-800">
                              {selectedGraphic.rotationX || 0}°
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleNudgeGraphicRotationX(selectedGraphic.id, -5)}
                              className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-bold cursor-pointer text-xs"
                              title="Putar X -5°"
                            >-</button>
                            <button
                              type="button"
                              onClick={() => handleNudgeGraphicRotationX(selectedGraphic.id, 5)}
                              className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-bold cursor-pointer text-xs"
                              title="Putar X +5°"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GRUP 2: POSISI & UKURAN */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                        <span>Posisi & Ukuran</span>
                        <button
                          type="button"
                          onClick={() => handleAlign(selectedGraphic.id, 'center_h')}
                          className="text-[9px] font-bold text-[#ff5e00] hover:underline cursor-pointer"
                          title="Rata tengah horizontal"
                        >
                          Rata Tengah
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Nudge Panah Arah */}
                        <div className="grid grid-cols-3 gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 w-24 shrink-0">
                          <div />
                          <button
                            type="button"
                            onClick={() => handleNudgeGraphic(selectedGraphic.id, 'up')}
                            className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 cursor-pointer shadow-2xs"
                            title="Geser Naik (2%)"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <div />
                          <button
                            type="button"
                            onClick={() => handleNudgeGraphic(selectedGraphic.id, 'left')}
                            className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 cursor-pointer shadow-2xs"
                            title="Geser Kiri (2%)"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetSleevePosition(selectedGraphic.id)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded text-[8px] font-bold cursor-pointer"
                            title="Pusatkan posisi"
                          >
                            •
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNudgeGraphic(selectedGraphic.id, 'right')}
                            className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 cursor-pointer shadow-2xs"
                            title="Geser Kanan (2%)"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <div />
                          <button
                            type="button"
                            onClick={() => handleNudgeGraphic(selectedGraphic.id, 'down')}
                            className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 cursor-pointer shadow-2xs"
                            title="Geser Turun (2%)"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <div />
                        </div>

                        {/* Skala / Ukuran */}
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-500">Ukuran / Skala:</span>
                            <span className="font-mono font-bold text-[#ff5e00]">
                              {Math.round((selectedGraphic.scale || 1) * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              type="button"
                              onClick={() => handleScaleGraphic(selectedGraphic.id, -0.05)}
                              className="flex-1 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-bold text-xs cursor-pointer"
                              title="Perkecil (-5%)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScaleGraphic(selectedGraphic.id, 0.05)}
                              className="flex-1 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-bold text-xs cursor-pointer"
                              title="Perbesar (+5%)"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GRUP 3: TOOLS & FITUR */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Toggle Auto Clipping */}
                        <button
                          type="button"
                          onClick={() => handleToggleGraphicAutoClipping(selectedGraphic.id)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            (selectedGraphic.enableAutoClipping ?? true)
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title="Potong otomatis mengikuti siluet kain seragam"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>{(selectedGraphic.enableAutoClipping ?? true) ? 'Clip: ON' : 'Clip: OFF'}</span>
                        </button>

                        {/* Toggle Teknik: Bordir vs Sablon */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextTech = selectedGraphic.technique === 'bordir' ? 'sablon' : 'bordir'
                            updateGraphicsWithHistory(
                              graphics.map((item) =>
                                item.id === selectedGraphic.id ? { ...item, technique: nextTech } : item
                              )
                            )
                          }}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            selectedGraphic.technique === 'bordir'
                              ? 'bg-amber-50 text-amber-900 border border-amber-300'
                              : 'bg-indigo-50 text-indigo-900 border border-indigo-300'
                          }`}
                          title="Ubah teknik produksi"
                        >
                          <span>{selectedGraphic.technique === 'bordir' ? '🪡 Bordir' : '🎨 Sablon'}</span>
                        </button>

                        {/* Balik Horizontal (Mirror) */}
                        <button
                          type="button"
                          onClick={() => handleFlipHorizontal(selectedGraphic.id)}
                          className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                          title="Balik Horizontal (Mirror)"
                        >
                          <FlipHorizontal className="w-3 h-3" />
                          <span>Mirror</span>
                        </button>

                        {/* Duplikat */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateGraphic(selectedGraphic.id)}
                          className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                          title="Duplikat Elemen"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Duplikat</span>
                        </button>

                        {/* Layer Stacking: Bawa ke Depan */}
                        <button
                          type="button"
                          onClick={() => handleBringToFront(selectedGraphic.id)}
                          className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                          title="Bawa ke Paling Depan"
                        >
                          <ChevronUp className="w-3 h-3" />
                          <span>Ke Depan</span>
                        </button>

                        {/* Layer Stacking: Kirim ke Belakang */}
                        <button
                          type="button"
                          onClick={() => handleSendToBack(selectedGraphic.id)}
                          className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                          title="Kirim ke Paling Belakang"
                        >
                          <ChevronDown className="w-3 h-3" />
                          <span>Ke Belakang</span>
                        </button>
                      </div>

                      {/* Jika elemen berada di lengan dan saat ini melihat tampak depan/belakang: tombol Buka Samping */}
                      {(selectedGraphic.side === 'left' || selectedGraphic.side === 'right') &&
                        (currentSide === 'front' || currentSide === 'back') && (
                          <button
                            type="button"
                            onClick={() => setCurrentSide(selectedGraphic.side)}
                            className="w-full py-1.5 px-2 bg-slate-900 hover:bg-[#ff5e00] text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                            title="Buka tampak samping untuk melihat & mengedit lengan secara langsung"
                          >
                            <span>Buka Tampak Samping ({selectedGraphic.side === 'left' ? 'Kiri' : 'Kanan'}) →</span>
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {graphics.length === 0 ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('select')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                          fileInputRef.current.click()
                        }
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-[#ff5e00]" />
                      <span>+ Upload Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool('select')
                        setActiveFlyout('text')
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Type className="w-3 h-3 text-indigo-600" />
                      <span>+ Tambah Teks</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[...graphics]
                      .map((g, origIdx) => ({ g, origIdx }))
                      .reverse()
                      .map(({ g, origIdx }) => {
                        const isSelected = g.id === selectedGraphicId
                        const calc = getGraphicPriceForZoneOrScale(g, activeMockup?.printZones)
                        const isCurrentSide = g.side === currentSide
                        const isProjectedOnCurrentView =
                          (currentSide === 'front' || currentSide === 'back') &&
                          (g.side === 'left' || g.side === 'right')
                        const isHidden = hiddenGraphicIds.includes(g.id)

                        return (
                          <div
                            key={g.id}
                            draggable
                            onDragStart={(e) => handleGraphicDragStart(e, g.id)}
                            onDragOver={(e) => handleGraphicDragOver(e, g.id)}
                            onDrop={(e) => handleGraphicDrop(e, g.id)}
                            onDragEnd={handleGraphicDragEnd}
                            onClick={() => {
                              setActiveTool('select')
                              if (!isCurrentSide && !isProjectedOnCurrentView) {
                                setCurrentSide(g.side)
                              }
                              setSelectedGraphicId(g.id)
                            }}
                            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-orange-50/80 border-[#ff5e00] shadow-xs ring-1 ring-[#ff5e00]/20'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                            } ${isHidden ? 'opacity-40' : ''}`}
                          >
                            {/* Drag Handle */}
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab shrink-0" />

                            {/* Thumbnail */}
                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              {g.type === 'image' ? (
                                <img src={g.content} alt="" className="w-full h-full object-contain p-1" />
                              ) : (
                                <Type className="w-4 h-4 text-[#ff5e00]" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isCurrentSide ? (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono bg-[#ff5e00] text-white">
                                    {g.side}
                                  </span>
                                ) : isProjectedOnCurrentView ? (
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"
                                    title="Desain ini berada di lengan dan diproyeksikan secara 3D menyamping pada sudut pandang saat ini"
                                  >
                                    <span>🔗 {g.side === 'left' ? 'L. Kiri' : 'L. Kanan'}</span>
                                    <span className="bg-amber-600 text-white text-[8px] font-black px-1 rounded-xs">
                                      3D Samping
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono bg-slate-200 text-slate-700">
                                    {g.side}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const nextTech = g.technique === 'bordir' ? 'sablon' : 'bordir'
                                    updateGraphicsWithHistory(
                                      graphics.map((item) =>
                                        item.id === g.id ? { ...item, technique: nextTech } : item
                                      )
                                    )
                                  }}
                                  className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                                    g.technique === 'bordir'
                                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300/60'
                                      : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-300/60'
                                  }`}
                                  title="Klik untuk ubah teknik: Bordir / Sablon"
                                >
                                  {g.technique === 'bordir' ? '🪡 Bordir 3D' : '🎨 Sablon DTF'}
                                </button>

                                {isProjectedOnCurrentView && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCurrentSide(g.side)
                                      setSelectedGraphicId(g.id)
                                    }}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-[#ff5e00] hover:text-white text-slate-600 transition-colors border border-slate-200 cursor-pointer"
                                    title="Buka Tampak Samping untuk mengedit posisi & ukuran secara datar"
                                  >
                                    Buka Sisi →
                                  </button>
                                )}
                              </div>
                              {renamingGraphicId === g.id ? (
                                <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={renamingGraphicLabel}
                                    onChange={(e) => setRenamingGraphicLabel(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveGraphicLabel(g.id)
                                      if (e.key === 'Escape') setRenamingGraphicId(null)
                                    }}
                                    onBlur={() => handleSaveGraphicLabel(g.id)}
                                    autoFocus
                                    className="h-6 px-1.5 text-xs font-bold rounded border border-[#ff5e00] bg-white text-slate-900 focus:outline-hidden w-full shadow-2xs"
                                    placeholder="Nama layer..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveGraphicLabel(g.id)}
                                    className="p-1 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer shrink-0"
                                    title="Simpan Nama"
                                  >
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRenamingGraphicId(null)}
                                    className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer shrink-0"
                                    title="Batal"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 group/gname min-w-0 mt-0.5">
                                  <h5
                                    onDoubleClick={(e) => {
                                      e.stopPropagation()
                                      handleStartRenameGraphic(g)
                                    }}
                                    className="font-bold text-xs text-slate-900 truncate cursor-pointer hover:underline"
                                    title={`${g.label || (g.type === 'text' ? g.content : 'Logo')} (Klik 2x atau pensil untuk ganti nama layer)`}
                                  >
                                    {g.label || (g.type === 'text' ? g.content : 'Logo')}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartRenameGraphic(g)
                                    }}
                                    className="opacity-0 group-hover/gname:opacity-100 p-0.5 text-slate-400 hover:text-[#ff5e00] rounded transition-opacity cursor-pointer shrink-0"
                                    title="Ubah nama layer grafis ini"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                              <div className="text-[10px] font-mono text-[#ff5e00] font-bold">
                                {calc.sizeCategory} • Rp {calc.price.toLocaleString('id-ID')}
                              </div>
                            </div>

                            {/* Actions: Visibility, Lock, Step Up, Step Down, Delete */}
                            <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => handleToggleGraphicVisibility(g.id)}
                                  title={isHidden ? 'Tampilkan Layer' : 'Sembunyikan Layer'}
                                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                                >
                                  {isHidden ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-indigo-600" />}
                                </button>
                                <button
                                  onClick={() => handleToggleLock(g.id)}
                                  title={g.isLocked ? 'Buka Kunci Layer' : 'Kunci Layer (Cegah Tergeser)'}
                                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                                >
                                  {g.isLocked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3" />}
                                </button>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => handleMoveLayer(g.id, 'up')}
                                  disabled={origIdx === graphics.length - 1}
                                  title="Naikkan Layer (Maju ke Depan)"
                                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded cursor-pointer"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveLayer(g.id, 'down')}
                                  disabled={origIdx === 0}
                                  title="Turunkan Layer (Mundur ke Belakang)"
                                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGraphic(g.id)}
                                  title="Hapus Layer"
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Summary & Order CTA */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Harga Polos Seragam:</span>
                  <span className="font-mono font-bold text-slate-800">
                    Rp {activeMockup.basePrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Biaya Sablon/Bordir ({graphics.length}):</span>
                  <span className="font-mono font-bold text-[#ff5e00]">
                    Rp {totalPrintCost.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-900">Estimasi Total / Pcs:</span>
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

      {/* POP-UP MODAL: KATALOG WARNA KAIN RESMI (STANDAR PABRIK TEKSTIL) */}
      {activeColorPickerGroupKey && (() => {
        const isBaseColor = activeColorPickerGroupKey === '__base__'
        const activeGroup = isBaseColor
          ? {
              key: '__base__',
              name: 'Warna Keseluruhan Seragam',
              currentColor: baseGarmentColor,
              defaultColor: activeMockup?.defaultBaseColor || '#ffffff',
              primaryPartId: '__base__',
              parts: [],
              sides: ['front', 'back', 'left', 'right'] as ViewSide[],
              icon: 'all_garment',
            }
          : unifiedPartGroups.find((g) => g.key === activeColorPickerGroupKey)

        if (!activeGroup) return null

        const currentSwatch = findClosestFabricSwatch(activeGroup.currentColor)

        const filteredSwatches = FABRIC_COLOR_DATABASE.filter((swatch) => {
          const matchCatalog = fabricCatalogFilter === 'all' || swatch.catalog === fabricCatalogFilter
          const query = fabricSearchQuery.trim().toLowerCase()
          const matchSearch =
            !query ||
            swatch.name.toLowerCase().includes(query) ||
            swatch.code.toLowerCase().includes(query) ||
            (swatch.description && swatch.description.toLowerCase().includes(query))
          return matchCatalog && matchSearch
        })

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setActiveColorPickerGroupKey(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ff5e00]/10 text-[#ff5e00] flex items-center justify-center">
                    <GarmentPartIcon
                      iconId={isBaseColor ? 'all_garment' : activeGroup.icon}
                      partName={activeGroup.name}
                      className="w-5 h-5 stroke-[2.2]"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>Katalog Warna Kain:</span>
                      <span className="text-[#ff5e00] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 text-xs font-black">
                        {activeGroup.name}
                      </span>
                      {isBaseColor && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-[#ff5e00] font-black">
                          Lapisan Dasar Bawah
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isBaseColor
                        ? 'Warna keseluruhan seragam (posisi selalu di bawah layer-layer sehingga tidak menimpa pola atau layer aktif seperti kerah).'
                        : 'Standar resmi pabrik tekstil (Nagata Drill, American Drill, Tropical & Combed). Warna otomatis tersinkron di 4 sisi.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveColorPickerGroupKey(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Selection Banner */}
              <div className="p-3 px-6 bg-orange-50/60 border-b border-orange-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: activeGroup.currentColor }}
                    className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-orange-300 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {currentSwatch ? currentSwatch.name : 'Warna Terpilih'}
                      </span>
                      {currentSwatch && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-slate-700 border border-orange-200 font-bold">
                          Kode: {currentSwatch.code}
                        </span>
                      )}
                      {currentSwatch?.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-100 text-[#ff5e00] font-black">
                          {currentSwatch.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {currentSwatch?.description || 'Warna diterapkan dengan blending serat kain realistis'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isBaseColor) {
                        pushHistorySnapshot()
                        setBaseGarmentColor(activeMockup?.defaultBaseColor || '#ffffff')
                      } else {
                        handleResetPartColors()
                      }
                    }}
                    className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                    title="Kembalikan ke warna bawaan awal"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Bawaan</span>
                  </button>
                  <label className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={syncColorPartsAcrossSides}
                      onChange={(e) => setSyncColorPartsAcrossSides(e.target.checked)}
                      className="rounded text-[#ff5e00] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Sinkron 4 Sisi</span>
                  </label>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 px-6 border-b border-slate-100 space-y-3 bg-white">
                {/* Catalog Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {FABRIC_CATALOGS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFabricCatalogFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        fabricCatalogFilter === cat.id
                          ? 'bg-[#ff5e00] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fabricSearchQuery}
                    onChange={(e) => setFabricSearchQuery(e.target.value)}
                    placeholder="Cari nama warna atau kode katalog (misal: Navy, Khaki, Kuning, 114, Army)..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff5e00]/20 focus:border-[#ff5e00]"
                  />
                  {fabricSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFabricSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Swatches Grid */}
              <div className="flex-1 overflow-y-auto p-6 max-h-[420px]">
                {filteredSwatches.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Palette className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Warna Tidak Ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Coba kata kunci lain atau pilih tab "Semua Katalog Kain".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredSwatches.map((swatch) => {
                      const isSelected = activeGroup.currentColor.toLowerCase() === swatch.hex.toLowerCase()

                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => {
                            pushHistorySnapshot()
                            if (isBaseColor) {
                              setBaseGarmentColor(swatch.hex)
                            } else {
                              handlePartColorChange(activeGroup.primaryPartId, swatch.hex)
                            }
                          }}
                          className={`p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative group hover:scale-[1.02] ${
                            isSelected
                              ? 'bg-orange-50/90 border-[#ff5e00] ring-2 ring-orange-300 shadow-sm'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-2xs'
                          }`}
                        >
                          {/* Color Swatch Box */}
                          <div
                            style={{ backgroundColor: swatch.hex }}
                            className="w-full h-12 rounded-xl border border-black/10 relative overflow-hidden shadow-inner flex items-center justify-center"
                          >
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#ff5e00]">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                            )}
                            {swatch.badge && (
                              <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold">
                                {swatch.badge}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                #{swatch.code}
                              </span>
                              <span className="text-[9px] text-slate-400 truncate">
                                {swatch.catalogName}
                              </span>
                            </div>
                            <h5 className="font-extrabold text-[11px] text-slate-900 truncate mt-0.5 leading-tight">
                              {swatch.name}
                            </h5>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Menampilkan <b>{filteredSwatches.length}</b> warna kain resmi katalog pabrik.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveColorPickerGroupKey(null)}
                  className="px-5 py-2 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Selesai & Terapkan
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* POP-UP MODAL: KONFIGURASI CETAK GAMBAR (PILIHAN BORDIR ATAU SABLON) */}
      {uploadModalData && (() => {
        const selectedZone = currentPrintZones.find((z) => z.id === uploadModalData.targetZoneId)
        const isBordir = uploadModalData.technique === 'bordir'

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setUploadModalData(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/70 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-[#ff5e00] flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      Pilih Teknik Cetak Desain
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih apakah gambar dijadikan <b>Bordir Komputer (Timbul 3D)</b> atau <b>Sablon DTF Halus</b>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadModalData(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Section 1: Live Preview Thumbnail & Layer Name */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  {/* Visual Thumbnail Preview */}
                  <div className="w-28 h-28 bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 border border-slate-800 shadow-inner">
                    <img
                      src={uploadModalData.dataUrl}
                      alt="preview"
                      className="max-w-[85px] max-h-[85px] object-contain select-none"
                      style={{
                        filter: isBordir
                          ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.7)) drop-shadow(1px 2px 3px rgba(0,0,0,0.5)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.85)) contrast(1.1) saturate(1.18)'
                          : 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.35))',
                      }}
                    />
                    {isBordir && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          WebkitMaskImage: `url("${uploadModalData.dataUrl}")`,
                          maskImage: `url("${uploadModalData.dataUrl}")`,
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          backgroundImage:
                            'repeating-linear-gradient(55deg, rgba(255,255,255,0.45) 0px, rgba(255,255,255,0.45) 1.2px, transparent 1.2px, transparent 2.4px, rgba(0,0,0,0.4) 2.4px, rgba(0,0,0,0.4) 3.6px, transparent 3.6px, transparent 4.8px)',
                          mixBlendMode: 'overlay',
                        }}
                      />
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">
                      {isBordir ? '🪡 3D Bordir' : '🎨 Sablon'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 w-full space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Nama Label Layer:
                    </label>
                    <input
                      type="text"
                      value={uploadModalData.fileName}
                      onChange={(e) =>
                        setUploadModalData({ ...uploadModalData, fileName: e.target.value })
                      }
                      placeholder="Misal: Logo Dada Kiri..."
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#ff5e00]/20 focus:border-[#ff5e00]"
                    />
                    <p className="text-[11px] text-slate-400">
                      Ukuran dan posisi otomatis disesuaikan dengan titik yang Anda pilih di bawah.
                    </p>
                  </div>
                </div>

                {/* Section 2: Pilihan Teknik (BORDIR vs SABLON) */}
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                    1. Pilih Teknik Produksi (Wajib)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option A: BORDIR KOMPUTER */}
                    <button
                      type="button"
                      onClick={() => setUploadModalData({ ...uploadModalData, technique: 'bordir' })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isBordir
                          ? 'border-amber-500 bg-amber-50/60 shadow-md ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">🪡</span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isBordir
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Benang Timbul 3D
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          Bordir Komputer
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Efek rajutan serat benang timbul dengan relief 3D dan kilau benang satin. Tahan cuci bertahun-tahun & berkesan formal eksklusif.
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-amber-800">Cocok: Kemeja, Polo, Jaket, Rompi</span>
                        {isBordir && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                      </div>
                    </button>

                    {/* Option B: SABLON DTF / PLASTISOL */}
                    <button
                      type="button"
                      onClick={() => setUploadModalData({ ...uploadModalData, technique: 'sablon' })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        !isBordir
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">🎨</span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              !isBordir
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Plastisol / DTF Halus
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          Sablon DTF / Plastisol
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Warna tajam solid & gradasi detail foto, tekstur lentur halus menyatu dengan serat kain seragam.
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-indigo-200/60 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-indigo-800">Cocok: Kaos, Jersey, Desain Besar</span>
                        {!isBordir && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 3: Pilihan Titik Penempatan (Print Zones) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                      2. Titik Penempatan Desain ({currentPrintZones.length} Titik Blangko)
                    </label>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Sisi: {currentSide}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentPrintZones.map((zone) => {
                      const isZoneSelected = uploadModalData.targetZoneId === zone.id

                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() =>
                            setUploadModalData({ ...uploadModalData, targetZoneId: zone.id })
                          }
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isZoneSelected
                              ? 'border-[#ff5e00] bg-orange-50/80 shadow-xs ring-1 ring-[#ff5e00]/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isZoneSelected
                                  ? 'bg-[#ff5e00] text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              ⊞
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-xs text-slate-900 truncate">
                                {zone.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                {zone.maxSizeCm && <span>{zone.maxSizeCm}</span>}
                                <span>•</span>
                                <span className="font-bold text-emerald-600 font-mono">
                                  Rp {zone.price.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isZoneSelected && <Check className="w-4 h-4 text-[#ff5e00] stroke-[3] shrink-0" />}
                        </button>
                      )
                    })}

                    {/* Opsi Titik Kustom Bebas */}
                    <button
                      type="button"
                      onClick={() =>
                        setUploadModalData({ ...uploadModalData, targetZoneId: 'custom' })
                      }
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        uploadModalData.targetZoneId === 'custom'
                          ? 'border-[#ff5e00] bg-orange-50/80 shadow-xs ring-1 ring-[#ff5e00]/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            uploadModalData.targetZoneId === 'custom'
                              ? 'bg-[#ff5e00] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          ✦
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs text-slate-900 truncate">
                            Titik Bebas (Tengah Kanvas)
                          </h5>
                          <span className="text-[10px] text-slate-500">
                            Bisa digeser bebas ke mana saja
                          </span>
                        </div>
                      </div>
                      {uploadModalData.targetZoneId === 'custom' && (
                        <Check className="w-4 h-4 text-[#ff5e00] stroke-[3] shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  Biaya Titik: <strong className="text-slate-900 font-mono text-sm">Rp {(selectedZone ? selectedZone.price : 15000).toLocaleString('id-ID')}</strong>
                  <span className="text-slate-400 mx-1.5">•</span>
                  Teknik: <strong className={isBordir ? 'text-amber-700' : 'text-indigo-700'}>{isBordir ? '🪡 Bordir 3D' : '🎨 Sablon DTF'}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalData(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUploadGraphic}
                    className="px-5 py-2 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-orange-500/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Pasang Desain ke Seragam</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ---------------------------------------------------- */}
      {/* 3. BOTTOM STATUS BAR (Light Pro Status) */}
      {/* ---------------------------------------------------- */}
      <div className="h-7 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-[11px] text-slate-500 font-mono select-none z-10 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-[#ff5e00]" />
          <span className="font-bold text-slate-800">ZY STUDIO PRO</span>
          <span className="text-slate-400">•</span>
          <span className="truncate text-slate-600">
            {activeMockup.name} ({activeMockup.category})
          </span>
          <span className="text-slate-400">•</span>
          <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${isClippingMaskActive ? 'bg-orange-100 text-[#ff5e00]' : 'bg-slate-200 text-slate-600'}`}>
            Mask: {isClippingMaskActive ? 'Aktif' : 'Bebas'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span>Sudut: <strong className="text-slate-900 uppercase">{currentSide}</strong></span>
          <span className="text-slate-400">•</span>
          <span>Tool: <strong className="text-slate-900 uppercase">{activeTool === 'brush' ? `Kuas (${brushSize}px)` : activeTool === 'eraser' ? 'Penghapus' : 'Seleksi'}</strong></span>
          <span className="text-slate-400">•</span>
          <span>{currentSideGraphics.length} Layer di sudut ini</span>
          <span className="text-slate-400">•</span>
          <span>Zoom: <strong className="text-slate-900">{Math.round(zoomLevel * 100)}%</strong></span>
        </div>

        <div className="font-bold text-[#ff5e00]">
          Total: Rp {(activeMockup.basePrice + totalPrintCost).toLocaleString('id-ID')} / pcs
        </div>
      </div>
    </div>
  )
}
