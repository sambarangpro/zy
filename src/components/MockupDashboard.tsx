import React, { useState, useRef, useEffect, useMemo } from 'react'
import type { MockupTemplate, ViewSide, ColorablePart } from '../types'
import {
  saveMockup,
  deleteMockup,
  setActiveMockupId,
  createDemoSampleMockup,
  exportMockupDatabase,
  importMockupDatabase,
} from '../services/mockupStorage'
import { findClosestFabricSwatch } from '../data/fabricColors'
import {
  GarmentPartIcon,
  GARMENT_PART_ICONS,
  getGarmentIconForPart,
} from '../data/garmentIcons'
import {
  Plus,
  Upload,
  Trash2,
  Edit3,
  Check,
  Palette,
  Layers,
  Tag,
  Paintbrush,
  Eraser,
  CheckCircle2,
  FolderPlus,
  Sparkles,
  Download,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Copy,
  X,
  Sliders,
  RotateCcw,
  RotateCw,
} from 'lucide-react'

// CorelDRAW Style Spline & Curve Helpers (Cubic Catmull-Rom & Bézier Curves)
function getSplineSvgPath(
  points: { x: number; y: number }[],
  isClosed: boolean,
  tension: number = 0.5
): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  const n = points.length
  let d = `M ${points[0].x} ${points[0].y}`

  if (isClosed) {
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n]
      const p1 = points[i]
      const p2 = points[(i + 1) % n]
      const p3 = points[(i + 2) % n]

      const factor = tension
      const cp1x = p1.x + ((p2.x - p0.x) / 3) * factor
      const cp1y = p1.y + ((p2.y - p0.y) / 3) * factor

      const cp2x = p2.x - ((p3.x - p1.x) / 3) * factor
      const cp2y = p2.y - ((p3.y - p1.y) / 3) * factor

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
    d += ' Z'
  } else {
    for (let i = 0; i < n - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = i + 2 < n ? points[i + 2] : p2

      const factor = tension
      const cp1x = p1.x + ((p2.x - p0.x) / 3) * factor
      const cp1y = p1.y + ((p2.y - p0.y) / 3) * factor

      const cp2x = p2.x - ((p3.x - p1.x) / 3) * factor
      const cp2y = p2.y - ((p3.y - p1.y) / 3) * factor

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
  }

  return d
}

function drawSplineToCanvas(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  isClosed: boolean,
  tension: number = 0.5
) {
  if (points.length < 2) return
  const n = points.length

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  if (isClosed) {
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n]
      const p1 = points[i]
      const p2 = points[(i + 1) % n]
      const p3 = points[(i + 2) % n]

      const factor = tension
      const cp1x = p1.x + ((p2.x - p0.x) / 3) * factor
      const cp1y = p1.y + ((p2.y - p0.y) / 3) * factor

      const cp2x = p2.x - ((p3.x - p1.x) / 3) * factor
      const cp2y = p2.y - ((p3.y - p1.y) / 3) * factor

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
    ctx.closePath()
  } else {
    for (let i = 0; i < n - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = i + 2 < n ? points[i + 2] : p2

      const factor = tension
      const cp1x = p1.x + ((p2.x - p0.x) / 3) * factor
      const cp1y = p1.y + ((p2.y - p0.y) / 3) * factor

      const cp2x = p2.x - ((p3.x - p1.x) / 3) * factor
      const cp2y = p2.y - ((p3.y - p1.y) / 3) * factor

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
  }
}

interface DashboardSnapshot {
  colorParts: ColorablePart[]
  hiddenPartIds: string[]
  canvasDataUrl: string | null
  hasDrawn: boolean
  penPoints: { x: number; y: number }[]
  editingExistingPartId: string | null
  side: ViewSide
}

interface MockupDashboardProps {
  mockups: MockupTemplate[]
  activeMockupId: string | null
  onMockupsChange: (updatedList: MockupTemplate[]) => void
  onSelectAndOpenCanvas: (mockupId: string) => void
  initialEditTarget?: { partId?: string; side?: ViewSide } | null
  onClearInitialEditTarget?: () => void
}

export const MockupDashboard: React.FC<MockupDashboardProps> = ({
  mockups,
  activeMockupId,
  onMockupsChange,
  onSelectAndOpenCanvas,
  initialEditTarget,
  onClearInitialEditTarget,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editFormData, setEditFormData] = useState<Partial<MockupTemplate>>({
    name: '',
    category: 'Kaos',
    basePrice: 85000,
    description: '',
    discount12: 5000,
    discount50: 10000,
    discount100: 15000,
  })

  // File input ref for uploading photos per angle
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetSide, setUploadTargetSide] = useState<ViewSide>('front')

  // File input ref for uploading transparent PNG masks for color parts
  const partMaskInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetPartId, setUploadTargetPartId] = useState<string | null>(null)

  // File input ref for importing database backup JSON
  const backupFileInputRef = useRef<HTMLInputElement>(null)
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null)

  // Angle currently selected in the large interactive stage
  const [selectedSide, setSelectedSide] = useState<ViewSide>('front')

  // Interactive Zone Marker Drawing State
  const [drawingTool, setDrawingTool] = useState<'brush' | 'pen' | 'rect' | 'eraser' | 'hand'>('brush')
  const [markerBrushSize, setMarkerBrushSize] = useState<number>(20)
  const [newPartName, setNewPartName] = useState<string>('Saku Dada')
  const [newPartColor, setNewPartColor] = useState<string>('#1e3a8a')
  const [isDrawingMask, setIsDrawingMask] = useState<boolean>(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [rectStartPoint, setRectStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [hasDrawn, setHasDrawn] = useState<boolean>(false)
  const [maskHistory, setMaskHistory] = useState<string[]>([])
  const [brushHoverCoord, setBrushHoverCoord] = useState<{ x: number; y: number } | null>(null)
  const [hiddenPartIds, setHiddenPartIds] = useState<string[]>([])
  const [layerPreviewOpacity, setLayerPreviewOpacity] = useState<number>(85)
  const [editingExistingPartId, setEditingExistingPartId] = useState<string | null>(null)

  // Zoom & Pan for Maximum Detail Work (up to 2000% zoom!)
  const [zoomScale, setZoomScale] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false)

  // Pen Tool (Polygon Path with Interior Fill & CorelDRAW Curves)
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([])
  const [penHoverPoint, setPenHoverPoint] = useState<{ x: number; y: number } | null>(null)
  const [isPenClosing, setIsPenClosing] = useState<boolean>(false)
  const [penCurveMode, setPenCurveMode] = useState<'straight' | 'smooth' | 'bezier'>('smooth')

  // Natural image dimensions for 1:1 pixel accuracy without letterboxing offset
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 540,
    height: 640,
  })

  // Seragam Atelier Owner Mode UI States
  const [showGrid, setShowGrid] = useState<boolean>(true)
  const [showCenterGuide, setShowCenterGuide] = useState<boolean>(true)
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false)
  const [showLogoSlot, setShowLogoSlot] = useState<boolean>(true)
  const [showMonogramSlot, setShowMonogramSlot] = useState<boolean>(true)
  const [showScotlight, setShowScotlight] = useState<boolean>(false)
  const [autoSync4Sides, setAutoSync4Sides] = useState<boolean>(true)
  const [visitorPalette, setVisitorPalette] = useState<string[]>([
    '#1e293b', // Navy
    '#ffffff', // Putih
    '#0f172a', // Hitam
    '#a89577', // Khaki
    '#7f1d1d', // Maroon
    '#14532d', // Hijau Army
    '#1d4ed8', // Biru Benhur
    '#ff5e00', // ZY Orange
  ])
  const [simulatedPreviewColor, setSimulatedPreviewColor] = useState<string>('#1e293b')

  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const colorPartsRef = useRef<ColorablePart[]>(editFormData.colorParts || [])
  useEffect(() => {
    colorPartsRef.current = editFormData.colorParts || []
  }, [editFormData.colorParts])

  // UNIFIED GLOBAL UNDO & REDO STACK FOR ALL MOCKUP DASHBOARD ACTIONS
  const [dashboardUndoStack, setDashboardUndoStack] = useState<DashboardSnapshot[]>([])
  const [dashboardRedoStack, setDashboardRedoStack] = useState<DashboardSnapshot[]>([])

  const takeDashboardSnapshot = (): DashboardSnapshot => {
    const canvas = maskCanvasRef.current
    return {
      colorParts: JSON.parse(JSON.stringify(colorPartsRef.current || editFormData.colorParts || [])),
      hiddenPartIds: [...hiddenPartIds],
      canvasDataUrl: canvas ? canvas.toDataURL() : null,
      hasDrawn,
      penPoints: [...penPoints],
      editingExistingPartId,
      side: selectedSide,
    }
  }

  const pushDashboardSnapshot = () => {
    const snap = takeDashboardSnapshot()
    setDashboardUndoStack((prev) => [...prev.slice(-40), snap])
    setDashboardRedoStack([])
  }

  const handleGlobalDashboardUndo = () => {
    if (dashboardUndoStack.length === 0) return

    const current = takeDashboardSnapshot()
    const prev = dashboardUndoStack[dashboardUndoStack.length - 1]

    setDashboardUndoStack((s) => s.slice(0, -1))
    setDashboardRedoStack((s) => [...s.slice(-40), current])

    colorPartsRef.current = prev.colorParts
    setEditFormData((f) => ({ ...f, colorParts: prev.colorParts }))
    setHiddenPartIds(prev.hiddenPartIds)
    setPenPoints(prev.penPoints)
    setEditingExistingPartId(prev.editingExistingPartId)
    setHasDrawn(prev.hasDrawn)

    if (prev.side !== selectedSide) {
      setSelectedSide(prev.side)
    }

    if (editFormData.id && editFormData.name && editFormData.frontImg) {
      const currentMockup = mockups.find((m) => m.id === editFormData.id)
      if (currentMockup) {
        const updatedMockup: MockupTemplate = {
          ...currentMockup,
          ...editFormData,
          colorParts: prev.colorParts.filter((p) => p.maskImg && p.maskImg.length > 50),
        }
        const updatedList = saveMockup(updatedMockup)
        onMockupsChange(updatedList)
      }
    }

    const canvas = maskCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (prev.canvasDataUrl && prev.hasDrawn) {
          const img = new Image()
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
          }
          img.src = prev.canvasDataUrl
        }
      }
    }
  }

  const handleGlobalDashboardRedo = () => {
    if (dashboardRedoStack.length === 0) return

    const current = takeDashboardSnapshot()
    const next = dashboardRedoStack[dashboardRedoStack.length - 1]

    setDashboardRedoStack((s) => s.slice(0, -1))
    setDashboardUndoStack((s) => [...s.slice(-40), current])

    colorPartsRef.current = next.colorParts
    setEditFormData((f) => ({ ...f, colorParts: next.colorParts }))
    setHiddenPartIds(next.hiddenPartIds)
    setPenPoints(next.penPoints)
    setEditingExistingPartId(next.editingExistingPartId)
    setHasDrawn(next.hasDrawn)

    if (next.side !== selectedSide) {
      setSelectedSide(next.side)
    }

    if (editFormData.id && editFormData.name && editFormData.frontImg) {
      const currentMockup = mockups.find((m) => m.id === editFormData.id)
      if (currentMockup) {
        const updatedMockup: MockupTemplate = {
          ...currentMockup,
          ...editFormData,
          colorParts: next.colorParts.filter((p) => p.maskImg && p.maskImg.length > 50),
        }
        const updatedList = saveMockup(updatedMockup)
        onMockupsChange(updatedList)
      }
    }

    const canvas = maskCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (next.canvasDataUrl && next.hasDrawn) {
          const img = new Image()
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
          }
          img.src = next.canvasDataUrl
        }
      }
    }
  }

  // Direct Shortcut: Edit spesifik masker bagian yang diklik dari studio CanvasCustomizer
  useEffect(() => {
    if (!initialEditTarget?.partId) return

    const targetMockup =
      mockups.find((m) => (m.colorParts || []).some((p) => p.id === initialEditTarget.partId)) ||
      mockups.find((m) => m.id === activeMockupId) ||
      mockups[0]

    if (!targetMockup) return

    const part = (targetMockup.colorParts || []).find((p) => p.id === initialEditTarget.partId)
    if (!part) return

    const parts = targetMockup.colorParts ? [...targetMockup.colorParts] : []
    colorPartsRef.current = parts
    setEditFormData({ ...targetMockup, colorParts: parts })
    setSelectedSide(initialEditTarget.side || part.side || 'front')
    setIsEditing(true)

    // Buka dan muat masker ke kanvas dengan Kuas aktif
    const timer = setTimeout(() => {
      handleLoadPartMaskToCanvas(part)
    }, 200)

    onClearInitialEditTarget?.()
    return () => clearTimeout(timer)
  }, [initialEditTarget, activeMockupId, mockups])

  // Komponen yang telah dibuat di sisi lain untuk kemudahan tautan 4 sisi
  const otherSidesComponents = useMemo(() => {
    const currentSideParts = (editFormData.colorParts || []).filter((p) => p.side === selectedSide)
    const currentSideNames = new Set(currentSideParts.map((p) => p.name.trim().toLowerCase()))
    const others = (editFormData.colorParts || []).filter((p) => p.side !== selectedSide)

    const unique = new Map<string, { name: string; defaultColor: string }>()
    others.forEach((p) => {
      const key = p.name.trim().toLowerCase()
      if (!currentSideNames.has(key) && !unique.has(key)) {
        unique.set(key, { name: p.name, defaultColor: p.defaultColor })
      }
    })
    return Array.from(unique.values())
  }, [editFormData.colorParts, selectedSide])

  // Sync canvas dimensions with actual mockup photo aspect ratio (defaults to 540x640 for PDH vector)
  useEffect(() => {
    const currentImg =
      selectedSide === 'front'
        ? editFormData.frontImg
        : selectedSide === 'back'
        ? editFormData.backImg
        : selectedSide === 'left'
        ? editFormData.leftImg
        : editFormData.rightImg

    if (!currentImg) {
      setCanvasSize({ width: 540, height: 640 })
      return
    }

    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
    }
    img.src = currentImg
  }, [selectedSide, editFormData.frontImg, editFormData.backImg, editFormData.leftImg, editFormData.rightImg])

  const handleOpenCreateNew = () => {
    colorPartsRef.current = []
    setEditFormData({
      id: 'mockup_' + Date.now(),
      name: '',
      category: 'Kaos',
      basePrice: 85000,
      description: '',
      enableClippingMask: true,
      colorParts: [],
      discount12: 5000,
      discount50: 10000,
      discount100: 15000,
      createdAt: Date.now(),
    })
    setSelectedSide('front')
    handleClearMaskDraft()
    setIsEditing(true)
  }

  const handleOpenEdit = (item: MockupTemplate) => {
    const parts = item.colorParts ? [...item.colorParts] : []
    colorPartsRef.current = parts
    setEditFormData({ ...item, colorParts: parts })
    setSelectedSide('front')
    handleClearMaskDraft()
    setIsEditing(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mockup "${name}"?`)) {
      const updated = deleteMockup(id)
      onMockupsChange(updated)
    }
  }

  const handleLoadDemoSample = () => {
    const demo = createDemoSampleMockup()
    const updated = saveMockup(demo)
    onMockupsChange(updated)
    onSelectAndOpenCanvas(demo.id)
  }

  const handleAddColorPart = (initialName?: string, side: ViewSide = 'front', defaultColor = '#1e3a8a') => {
    pushDashboardSnapshot()
    const currentAll = colorPartsRef.current || editFormData.colorParts || []
    const thisSideParts = currentAll.filter((p) => p.side === side)
    const slotIdx = thisSideParts.length + 1
    const partName = (initialName && initialName.trim()) || `Bagian ${slotIdx}`

    // Link dengan komponen yang sudah dibuat di sisi lain jika ada nama atau slot yang cocok
    const matchingFromOtherSide = currentAll.find(
      (p) =>
        p.side !== side &&
        ((initialName && p.name.trim().toLowerCase() === initialName.trim().toLowerCase()) ||
          p.groupId === `group_${slotIdx}` ||
          p.name.trim().toLowerCase() === `bagian ${slotIdx}`)
    )
    const groupId = matchingFromOtherSide?.groupId || `group_${slotIdx}`
    const finalDefaultColor = matchingFromOtherSide?.defaultColor || defaultColor
    const initialIcon = matchingFromOtherSide?.icon || getGarmentIconForPart(partName)

    const newPart: ColorablePart = {
      id: 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: partName.trim(),
      side,
      defaultColor: finalDefaultColor,
      groupId,
      icon: initialIcon,
    }

    const otherParts = currentAll.filter((p) => p.side !== side)
    const updated = [newPart, ...thisSideParts, ...otherParts]

    colorPartsRef.current = updated
    setEditFormData((prev) => ({
      ...prev,
      colorParts: updated,
    }))

    // Immediately bind this new slot as active drawing target and switch to pen tool
    setEditingExistingPartId(newPart.id)
    setNewPartName(newPart.name)
    setNewPartColor(newPart.defaultColor)
    setDrawingTool('pen')
    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
  }

  const handleAddNewColorSlot = () => {
    if (penPoints.length >= 3 || hasDrawn) {
      commitCurrentMaskToPart(editingExistingPartId)
    }
    handleAddColorPart(undefined, selectedSide)
  }

  const handleStartDrawingForSlot = (partId: string) => {
    if (penPoints.length >= 3 || hasDrawn) {
      commitCurrentMaskToPart(editingExistingPartId)
    }
    const currentAll = colorPartsRef.current || editFormData.colorParts || []
    const part = currentAll.find((p) => p.id === partId)
    if (!part) return
    setEditingExistingPartId(part.id)
    setNewPartName(part.name)
    setNewPartColor(part.defaultColor)
    setDrawingTool('pen')
    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
  }

  const handleDefringePartMask = (partId: string) => {
    const part = (editFormData.colorParts || []).find((p) => p.id === partId)
    if (!part || !part.maskImg) return

    pushDashboardSnapshot()
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const off = document.createElement('canvas')
      off.width = img.naturalWidth || canvasSize.width
      off.height = img.naturalHeight || canvasSize.height
      const offCtx = off.getContext('2d')
      if (!offCtx) return

      offCtx.drawImage(img, 0, 0)
      const imgData = offCtx.getImageData(0, 0, off.width, off.height)
      const data = imgData.data
      const w = off.width
      const h = off.height
      const copy = new Uint8ClampedArray(data)

      // Erode 4 pixels to eliminate any baked-in stroke border
      const radius = 4
      for (let y = radius; y < h - radius; y++) {
        for (let x = radius; x < w - radius; x++) {
          const idx = (y * w + x) * 4 + 3
          if (copy[idx] > 0) {
            let minA = copy[idx]
            for (let dy = -radius; dy <= radius; dy += radius) {
              for (let dx = -radius; dx <= radius; dx += radius) {
                const nIdx = ((y + dy) * w + (x + dx)) * 4 + 3
                if (copy[nIdx] < minA) minA = copy[nIdx]
              }
            }
            data[idx] = minA
          }
        }
      }
      offCtx.putImageData(imgData, 0, 0)
      const cleaned = off.toDataURL('image/png')
      setEditFormData((prev) => ({
        ...prev,
        colorParts: (prev.colorParts || []).map((p) =>
          p.id === partId ? { ...p, maskImg: cleaned } : p
        ),
      }))
    }
    img.src = part.maskImg
  }

  // LAYER ORDERING & DRAG-AND-DROP HANDLERS
  const [draggedPartId, setDraggedPartId] = useState<string | null>(null)
  const [dragOverPartId, setDragOverPartId] = useState<string | null>(null)

  const handleReorderSideParts = (reorderedSideParts: ColorablePart[]) => {
    pushDashboardSnapshot()
    const allParts = colorPartsRef.current || editFormData.colorParts || []
    let sideIdx = 0
    const newColorParts: ColorablePart[] = []

    for (const part of allParts) {
      if (part.side === selectedSide) {
        if (sideIdx < reorderedSideParts.length) {
          newColorParts.push(reorderedSideParts[sideIdx])
          sideIdx++
        }
      } else {
        newColorParts.push(part)
      }
    }
    while (sideIdx < reorderedSideParts.length) {
      newColorParts.push(reorderedSideParts[sideIdx])
      sideIdx++
    }

    colorPartsRef.current = newColorParts
    setEditFormData((prev) => ({
      ...prev,
      colorParts: newColorParts,
    }))
  }

  const handleMovePart = (partId: string, direction: 'up' | 'down') => {
    const currentSideParts = (colorPartsRef.current || editFormData.colorParts || []).filter(
      (p) => p.side === selectedSide
    )
    const index = currentSideParts.findIndex((p) => p.id === partId)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= currentSideParts.length) return

    const newSideParts = [...currentSideParts]
    const [movedPart] = newSideParts.splice(index, 1)
    newSideParts.splice(targetIndex, 0, movedPart)

    handleReorderSideParts(newSideParts)
  }

  const handleDragStart = (e: React.DragEvent, partId: string) => {
    e.dataTransfer.setData('text/plain', partId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedPartId(partId)
  }

  const handleDragOver = (e: React.DragEvent, partId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverPartId !== partId) {
      setDragOverPartId(partId)
    }
  }

  const handleDrop = (e: React.DragEvent, targetPartId: string) => {
    e.preventDefault()
    setDragOverPartId(null)
    const sourcePartId = draggedPartId || e.dataTransfer.getData('text/plain')
    setDraggedPartId(null)

    if (!sourcePartId || sourcePartId === targetPartId) return

    const currentSideParts = (colorPartsRef.current || editFormData.colorParts || []).filter(
      (p) => p.side === selectedSide
    )
    const sourceIndex = currentSideParts.findIndex((p) => p.id === sourcePartId)
    const targetIndex = currentSideParts.findIndex((p) => p.id === targetPartId)

    if (sourceIndex === -1 || targetIndex === -1) return

    const newSideParts = [...currentSideParts]
    const [movedPart] = newSideParts.splice(sourceIndex, 1)
    newSideParts.splice(targetIndex, 0, movedPart)

    handleReorderSideParts(newSideParts)
  }

  const handleDragEnd = () => {
    setDraggedPartId(null)
    setDragOverPartId(null)
  }

  const handleTogglePartVisibility = (partId: string) => {
    pushDashboardSnapshot()
    setHiddenPartIds((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    )
  }

  const handleDuplicatePart = (partId: string) => {
    const part = (editFormData.colorParts || []).find((p) => p.id === partId)
    if (!part) return
    pushDashboardSnapshot()
    const duplicate: ColorablePart = {
      ...part,
      id: 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: `${part.name} (Salinan)`,
    }
    setEditFormData((prev) => {
      const currentSideParts = (prev.colorParts || []).filter((p) => p.side === part.side)
      const otherParts = (prev.colorParts || []).filter((p) => p.side !== part.side)
      const idx = currentSideParts.findIndex((p) => p.id === partId)
      const newSideParts = [...currentSideParts]
      newSideParts.splice(idx + 1, 0, duplicate)
      return {
        ...prev,
        colorParts: [...newSideParts, ...otherParts],
      }
    })
  }

  function handleLoadPartMaskToCanvas(part: ColorablePart) {
    if (!part.maskImg) {
      alert('Layer ini belum memiliki masker gambar. Silakan gunakan Kuas atau Pen Tool untuk mulai menggambar masker.')
      return
    }

    const canvas = maskCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      // Convert black silhouette mask pixels to cyan draft color with 90% opacity
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = 'rgba(6, 182, 212, 0.90)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'

      setHasDrawn(true)
      setMaskHistory([canvas.toDataURL()])
      setNewPartName(part.name)
      setNewPartColor(part.defaultColor)
      setEditingExistingPartId(part.id)
      setHiddenPartIds((prev) => (prev.includes(part.id) ? prev : [...prev, part.id]))

      // Mode kuas otomatis aktif agar user bisa langsung mewarnai/menambahkan area!
      setDrawingTool('brush')
      setPenPoints([])
      setPenHoverPoint(null)
      setIsPenClosing(false)
    }
    img.src = part.maskImg
  }

  const handleCancelEditingExistingPart = () => {
    if (editingExistingPartId) {
      setHiddenPartIds((prev) => prev.filter((id) => id !== editingExistingPartId))
      setEditingExistingPartId(null)
    }
    handleClearMaskDraft()
  }

  const handleUpdateColorPart = (id: string, updates: Partial<ColorablePart>) => {
    pushDashboardSnapshot()
    const current = colorPartsRef.current || editFormData.colorParts || []
    const target = current.find((p) => p.id === id)

    const updated = current.map((p) => {
      if (p.id === id) return { ...p, ...updates }
      // Sinkronkan nama dan defaultColor ke sisi lain jika autoSync4Sides aktif
      if (autoSync4Sides && target) {
        const isSibling =
          (target.groupId && p.groupId && target.groupId === p.groupId) ||
          (p.name && target.name && p.name.trim().toLowerCase() === target.name.trim().toLowerCase())
        if (isSibling) {
          const syncUpdates: Partial<ColorablePart> = {}
          if (updates.name !== undefined) syncUpdates.name = updates.name
          if (updates.defaultColor !== undefined) syncUpdates.defaultColor = updates.defaultColor
          return { ...p, ...syncUpdates }
        }
      }
      return p
    })

    colorPartsRef.current = updated
    setEditFormData((prev) => ({
      ...prev,
      colorParts: updated,
    }))
  }

  // Popover pemilih icon bagian pakaian (Kerah, Saku, Kancing, dll.)
  const [activeIconPickerPartId, setActiveIconPickerPartId] = useState<string | null>(null)

  // Update Icon Bagian Pakaian Langsung (Owner Mode)
  const handleUpdatePartIconDirectly = (partId: string, newIcon: string) => {
    pushDashboardSnapshot()
    const current = colorPartsRef.current || editFormData.colorParts || []
    const target = current.find((p) => p.id === partId)
    if (!target) return

    const updated = current.map((p) => {
      if (p.id === partId) {
        return { ...p, icon: newIcon }
      }
      if (
        autoSync4Sides &&
        ((target.groupId && p.groupId && target.groupId === p.groupId) ||
          (p.name && target.name && p.name.trim().toLowerCase() === target.name.trim().toLowerCase()))
      ) {
        return { ...p, icon: newIcon }
      }
      return p
    })

    colorPartsRef.current = updated
    setEditFormData((prev) => ({ ...prev, colorParts: updated }))

    if (editFormData.id) {
      const currentMockup = mockups.find((m) => m.id === editFormData.id)
      if (currentMockup) {
        const updatedMockup: MockupTemplate = {
          ...currentMockup,
          ...editFormData,
          colorParts: updated.filter((p) => p.maskImg && p.maskImg.trim().length > 5),
        }
        const updatedList = saveMockup(updatedMockup)
        onMockupsChange(updatedList)
      }
    }
    setActiveIconPickerPartId(null)
  }

  // Update Keterangan / Nama Layer Langsung (Owner Mode)
  const handleUpdatePartNameDirectly = (partId: string, newName: string) => {
    const current = colorPartsRef.current || editFormData.colorParts || []
    const target = current.find((p) => p.id === partId)
    if (!target) return

    const suggestedIcon = getGarmentIconForPart(newName)
    const updated = current.map((p) => {
      if (p.id === partId) {
        return { ...p, name: newName, icon: p.icon || suggestedIcon }
      }
      if (
        autoSync4Sides &&
        ((target.groupId && p.groupId && target.groupId === p.groupId) ||
          (p.name && target.name && p.name.trim().toLowerCase() === target.name.trim().toLowerCase()))
      ) {
        return { ...p, name: newName, icon: p.icon || suggestedIcon }
      }
      return p
    })

    colorPartsRef.current = updated
    setEditFormData((prev) => ({ ...prev, colorParts: updated }))

    if (editingExistingPartId === partId) {
      setNewPartName(newName)
    }

    if (editFormData.id) {
      const currentMockup = mockups.find((m) => m.id === editFormData.id)
      if (currentMockup) {
        const updatedMockup: MockupTemplate = {
          ...currentMockup,
          ...editFormData,
          colorParts: updated.filter((p) => p.maskImg && p.maskImg.trim().length > 5),
        }
        const updatedList = saveMockup(updatedMockup)
        onMockupsChange(updatedList)
      }
    }
  }

  const handleRemoveColorPart = (id: string) => {
    pushDashboardSnapshot()
    colorPartsRef.current = (colorPartsRef.current || []).filter((p) => p.id !== id)
    setEditFormData((prev) => ({
      ...prev,
      colorParts: (prev.colorParts || []).filter((p) => p.id !== id),
    }))
  }

  const triggerPartMaskUpload = (partId: string) => {
    setUploadTargetPartId(partId)
    partMaskInputRef.current?.click()
  }

  const handlePartMaskUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTargetPartId) return

    pushDashboardSnapshot()
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setEditFormData((prev) => ({
        ...prev,
        colorParts: (prev.colorParts || []).map((p) =>
          p.id === uploadTargetPartId ? { ...p, maskImg: dataUrl } : p
        ),
      }))
      setUploadTargetPartId(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // DATABASE BACKUP & RESTORE HANDLERS
  const handleExportBackup = () => {
    exportMockupDatabase()
    setBackupStatusMessage('File backup database mockup berhasil di-download!')
    setTimeout(() => setBackupStatusMessage(null), 4000)
  }

  const handleTriggerImportBackup = () => {
    backupFileInputRef.current?.click()
  }

  const handleBackupFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const updated = await importMockupDatabase(file)
      onMockupsChange(updated)
      setBackupStatusMessage(`Berhasil memulihkan ${updated.length} model mockup seragam ke database!`)
      setTimeout(() => setBackupStatusMessage(null), 5000)
    } catch (err: any) {
      alert(err.message || 'Gagal memulihkan database dari file backup.')
    } finally {
      e.target.value = ''
    }
  }

  // ZOOM & PAN CONTROLS (UP TO 2000% FOR MAXIMUM PRECISION PIXEL DETAIL)
  const handleResetZoom = () => {
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleSetZoom = (newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, 0.5), 20)
    setZoomScale(clamped)
    if (clamped === 1) {
      setPanOffset({ x: 0, y: 0 })
    }
  }

  const handleZoomStep = (delta: number) => {
    setZoomScale((prev) => {
      let step = 0.25
      if (delta > 0) {
        if (prev >= 10) step = 2.0
        else if (prev >= 5) step = 1.0
        else if (prev >= 2) step = 0.5
        else step = 0.25
      } else {
        if (prev > 10) step = 2.0
        else if (prev > 5) step = 1.0
        else if (prev > 2) step = 0.5
        else step = 0.25
      }
      const next = delta > 0 ? prev + step : prev - step
      const rounded = Math.round(next * 10) / 10
      return Math.min(Math.max(rounded, 0.5), 20)
    })
  }

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    setZoomScale((prev) => {
      let step = 0.15
      if (prev >= 10) step = 1.5
      else if (prev >= 5) step = 0.8
      else if (prev >= 2) step = 0.4
      else step = 0.2

      const next = e.deltaY < 0 ? prev + step : prev - step
      const rounded = Math.round(next * 100) / 100
      return Math.min(Math.max(rounded, 0.5), 20)
    })
  }

  // PEN TOOL METHODS (FILLABLE POLYGON AREA - ZERO STROKE BORDER)
  const handleCancelPen = () => {
    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
    handleCancelEditingExistingPart()
  }

  const handleDoubleClickCanvas = () => {
    if (drawingTool === 'pen' && penPoints.length >= 3) {
      commitCurrentMaskToPart()
    }
  }

  // KEYBOARD SHORTCUTS FOR PEN TOOL & ZOOM & PAN (SPACEBAR)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return

      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(true)
      } else if (e.key === 'Enter') {
        if (drawingTool === 'pen' && penPoints.length >= 3) {
          e.preventDefault()
          commitCurrentMaskToPart()
        }
      } else if (e.key === 'Backspace') {
        if (drawingTool === 'pen' && penPoints.length > 0) {
          e.preventDefault()
          handleGlobalDashboardUndo()
        }
      } else if (e.key === 'Escape') {
        if (drawingTool === 'pen' && penPoints.length > 0) {
          e.preventDefault()
          handleCancelPen()
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault()
          handleGlobalDashboardRedo()
        } else {
          e.preventDefault()
          handleGlobalDashboardUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        handleGlobalDashboardRedo()
      } else if (e.key === 'b' || e.key === 'B') {
        setDrawingTool('brush')
      } else if (e.key === 'p' || e.key === 'P') {
        setDrawingTool('pen')
      } else if (e.key === 'e' || e.key === 'E') {
        setDrawingTool('eraser')
      } else if (e.key === 'm' || e.key === 'M') {
        if (drawingTool === 'pen') {
          e.preventDefault()
          setPenCurveMode((prev) => (prev === 'smooth' ? 'straight' : prev === 'straight' ? 'bezier' : 'smooth'))
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        handleZoomStep(0.5)
      } else if (e.key === '-') {
        e.preventDefault()
        handleZoomStep(-0.5)
      } else if (e.key === '0') {
        e.preventDefault()
        handleResetZoom()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [drawingTool, dashboardUndoStack, dashboardRedoStack, zoomScale, penPoints])

  // INTERACTIVE CANVAS ZONE MARKER METHODS (100% ACCURATE 1:1 PIXEL COORDINATES)
  const getMarkerCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return { x: 0, y: 0 }
    const rawX = ((e.clientX - rect.left) / rect.width) * canvas.width
    const rawY = ((e.clientY - rect.top) / rect.height) * canvas.height
    return {
      x: Math.max(0, Math.min(canvas.width, rawX)),
      y: Math.max(0, Math.min(canvas.height, rawY)),
    }
  }

  const handleStartDrawMask = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Pan mode: Spacebar pressed, Hand tool active, or middle mouse button
    if (isSpacePressed || drawingTool === 'hand' || e.button === 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      return
    }

    const canvas = maskCanvasRef.current
    if (!canvas) return
    const coords = getMarkerCoords(e)

    // Pen tool mode
    if (drawingTool === 'pen') {
      if (isPenClosing && penPoints.length >= 3) {
        commitCurrentMaskToPart()
        return
      }
      pushDashboardSnapshot()
      setPenPoints((prev) => [...prev, coords])
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    pushDashboardSnapshot()
    setIsDrawingMask(true)
    setLastPoint(coords)
    setMaskHistory((prev) => [...prev.slice(-15), canvas.toDataURL()])

    if (drawingTool === 'rect') {
      setRectStartPoint(coords)
    } else {
      ctx.save()
      if (drawingTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(6, 182, 212, 0.90)'
      }
      const scale = canvas.width / 500
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, (markerBrushSize * scale) / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      setHasDrawn(true)
    }
  }

  const handleDrawMaskMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      return
    }

    const coords = getMarkerCoords(e)
    if (drawingTool === 'brush' || drawingTool === 'eraser') {
      setBrushHoverCoord(coords)
    }

    if (drawingTool === 'pen') {
      setPenHoverPoint(coords)
      if (penPoints.length >= 3) {
        const dx = coords.x - penPoints[0].x
        const dy = coords.y - penPoints[0].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const canvas = maskCanvasRef.current
        const rect = canvas?.getBoundingClientRect()
        const scaleToScreen = rect && rect.width > 0 ? canvas!.width / rect.width : 1
        const snapRadius = 22 * scaleToScreen
        setIsPenClosing(dist < snapRadius)
      } else {
        setIsPenClosing(false)
      }
      return
    }

    if (!isDrawingMask) return
    const canvas = maskCanvasRef.current
    if (!canvas || !lastPoint) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (drawingTool === 'rect' && rectStartPoint) {
      if (maskHistory.length > 0) {
        const lastSnapshot = maskHistory[maskHistory.length - 1]
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          ctx.fillStyle = 'rgba(6, 182, 212, 0.75)'
          ctx.fillRect(
            rectStartPoint.x,
            rectStartPoint.y,
            coords.x - rectStartPoint.x,
            coords.y - rectStartPoint.y
          )
        }
        img.src = lastSnapshot
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(6, 182, 212, 0.75)'
        ctx.fillRect(
          rectStartPoint.x,
          rectStartPoint.y,
          coords.x - rectStartPoint.x,
          coords.y - rectStartPoint.y
        )
      }
      setHasDrawn(true)
      return
    }

    ctx.save()
    if (drawingTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)'
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const scale = canvas.width / 500
    ctx.lineWidth = markerBrushSize * scale

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    ctx.restore()

    setLastPoint(coords)
    setHasDrawn(true)
  }

  const handleEndDrawMask = () => {
    if (isPanning) {
      setIsPanning(false)
    }
    setIsDrawingMask(false)
    setLastPoint(null)
    setRectStartPoint(null)
  }

  const handleFillPenToCanvas = () => {
    if (penPoints.length < 3) return
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    pushDashboardSnapshot()
    setMaskHistory((prev) => [...prev.slice(-15), canvas.toDataURL()])

    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(6, 182, 212, 0.90)'

    if (penCurveMode === 'smooth') {
      drawSplineToCanvas(ctx, penPoints, true, 0.5)
    } else if (penCurveMode === 'bezier') {
      drawSplineToCanvas(ctx, penPoints, true, 0.8)
    } else {
      ctx.beginPath()
      ctx.moveTo(penPoints[0].x, penPoints[0].y)
      for (let i = 1; i < penPoints.length; i++) {
        ctx.lineTo(penPoints[i].x, penPoints[i].y)
      }
      ctx.closePath()
    }
    ctx.fill()
    ctx.restore()

    setHasDrawn(true)
    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
  }

  const handleClearMaskDraft = (skipSnapshot = false) => {
    const canvas = maskCanvasRef.current
    if (!canvas) return
    if (!skipSnapshot && (hasDrawn || penPoints.length > 0)) {
      pushDashboardSnapshot()
    }
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    setMaskHistory([])
    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
  }

  // COMMIT MASK (FROM PEN TOOL OR CANVAS BRUSH) DIRECTLY TO ACTIVE PART
  function commitCurrentMaskToPart(
    targetPartId?: string | null,
    customPoints?: { x: number; y: number }[]
  ): ColorablePart[] | null {
    const canvas = maskCanvasRef.current
    if (!canvas) return null

    const pts = customPoints || (penPoints.length >= 3 ? penPoints : null)
    let maskDataUrl: string | null = null

    const off = document.createElement('canvas')
    off.width = canvas.width
    off.height = canvas.height
    const offCtx = off.getContext('2d')
    if (!offCtx) return null

    let didDraw = false

    // 1. Gambar konten masker kanvas saat ini (hasil kuas & masker yang sedang diedit)
    if (hasDrawn) {
      offCtx.drawImage(canvas, 0, 0)
      didDraw = true
    }

    // 2. Gabungkan lekukan titik pen tool jika ada yang belum ditutup
    if (pts && pts.length >= 3) {
      offCtx.fillStyle = '#000000'
      if (penCurveMode === 'smooth') {
        drawSplineToCanvas(offCtx, pts, true, 0.5)
      } else if (penCurveMode === 'bezier') {
        drawSplineToCanvas(offCtx, pts, true, 0.8)
      } else {
        offCtx.beginPath()
        offCtx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) {
          offCtx.lineTo(pts[i].x, pts[i].y)
        }
        offCtx.closePath()
      }
      offCtx.fill()
      didDraw = true
    }

    if (!didDraw) return null

    // 3. Ubah semua piksel aktif non-transparan menjadi warna hitam pekat solid 100% (#000000, alpha 255)
    // Menjamin masker tidak pudar atau transparan berulang saat diedit
    const imgData = offCtx.getImageData(0, 0, off.width, off.height)
    const data = imgData.data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 20) {
        data[i] = 0
        data[i + 1] = 0
        data[i + 2] = 0
        data[i + 3] = 255
      } else {
        data[i + 3] = 0
      }
    }
    offCtx.putImageData(imgData, 0, 0)
    maskDataUrl = off.toDataURL('image/png')

    pushDashboardSnapshot()

    const currentAll = colorPartsRef.current || editFormData.colorParts || []
    const partId = targetPartId || editingExistingPartId
    const thisSideParts = currentAll.filter((p) => p.side === selectedSide)
    const partName =
      (newPartName && newPartName !== 'Bagian Baru' ? newPartName.trim() : '') ||
      (partId ? currentAll.find((p) => p.id === partId)?.name : null) ||
      `Bagian ${thisSideParts.length + 1}`

    let updatedParts: ColorablePart[] = []
    const slotIdx = thisSideParts.length + 1
    const matchingFromOtherSide = currentAll.find(
      (p) =>
        p.side !== selectedSide &&
        ((partName && p.name.trim().toLowerCase() === partName.trim().toLowerCase()) ||
          p.groupId === `group_${slotIdx}` ||
          p.name.trim().toLowerCase() === `bagian ${slotIdx}`)
    )
    const resolvedGroupId = matchingFromOtherSide?.groupId || `group_${slotIdx}`

    if (partId) {
      const exists = currentAll.some((p) => p.id === partId)
      if (exists) {
        updatedParts = currentAll.map((p) =>
          p.id === partId
            ? { ...p, name: partName, defaultColor: newPartColor, maskImg: maskDataUrl!, groupId: p.groupId || resolvedGroupId }
            : p
        )
      } else {
        const newPart: ColorablePart = {
          id: partId,
          name: partName,
          side: selectedSide,
          defaultColor: newPartColor,
          maskImg: maskDataUrl!,
          groupId: resolvedGroupId,
        }
        const otherParts = currentAll.filter((p) => p.side !== selectedSide)
        updatedParts = [newPart, ...thisSideParts, ...otherParts]
      }
    } else {
      const newPart: ColorablePart = {
        id: 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: partName,
        side: selectedSide,
        defaultColor: newPartColor,
        maskImg: maskDataUrl!,
        groupId: resolvedGroupId,
      }
      const otherParts = currentAll.filter((p) => p.side !== selectedSide)
      updatedParts = [newPart, ...thisSideParts, ...otherParts]
    }

    colorPartsRef.current = updatedParts
    setEditFormData((prev) => ({
      ...prev,
      colorParts: updatedParts,
    }))

    // Simpan otomatis ke database lokal jika model mockup valid
    if (editFormData.id && editFormData.name && editFormData.frontImg) {
      const currentMockup = mockups.find((m) => m.id === editFormData.id)
      if (currentMockup) {
        const updatedMockup: MockupTemplate = {
          ...currentMockup,
          ...editFormData,
          colorParts: updatedParts.filter((p) => p.maskImg && p.maskImg.length > 50),
        }
        const updatedList = saveMockup(updatedMockup)
        onMockupsChange(updatedList)
      }
    }

    if (partId) {
      setHiddenPartIds((prev) => prev.filter((id) => id !== partId))
    }
    setEditingExistingPartId(null)
    setNewPartName('Bagian Baru')
    handleClearMaskDraft(true)

    setBackupStatusMessage(`Masker "${partName}" berhasil diperbarui & disimpan!`)
    setTimeout(() => setBackupStatusMessage(null), 4000)

    return updatedParts
  }

  const handleSelectSide = (side: ViewSide) => {
    if (side === selectedSide) return

    // Auto-commit any active drawing or slot before switching angles!
    if (penPoints.length >= 3 || hasDrawn) {
      commitCurrentMaskToPart(editingExistingPartId)
    } else if (editingExistingPartId) {
      setHiddenPartIds((prev) => prev.filter((id) => id !== editingExistingPartId))
      setEditingExistingPartId(null)
    }

    handleClearMaskDraft()
    handleResetZoom()
    setSelectedSide(side)
  }

  const handleSaveForm = (openCanvasAfter: boolean = false) => {
    let currentColorParts = colorPartsRef.current || editFormData.colorParts || []
    if (penPoints.length >= 3 || hasDrawn) {
      const committed = commitCurrentMaskToPart(editingExistingPartId)
      if (committed) {
        currentColorParts = committed
      }
    }

    if (!editFormData.name?.trim()) {
      alert('Mohon masukkan Nama Model Seragam terlebih dahulu!')
      return
    }

    if (!editFormData.frontImg) {
      alert('Mohon upload minimal foto Tampak Depan untuk mockup ini!')
      return
    }

    // Keep all parts that have valid masks (prune empty unmasked placeholder slots if any)
    const validColorParts = currentColorParts.filter((p) => p.maskImg && p.maskImg.length > 50)

    const newMockup: MockupTemplate = {
      id: editFormData.id || 'mockup_' + Date.now(),
      name: editFormData.name.trim(),
      category: editFormData.category || 'Kaos',
      basePrice: Number(editFormData.basePrice) || 85000,
      description: editFormData.description || '',
      frontImg: editFormData.frontImg,
      backImg: editFormData.backImg,
      leftImg: editFormData.leftImg,
      rightImg: editFormData.rightImg,
      enableClippingMask: editFormData.enableClippingMask ?? true,
      colorParts: validColorParts,
      discount12: Number(editFormData.discount12) || 5000,
      discount50: Number(editFormData.discount50) || 10000,
      discount100: Number(editFormData.discount100) || 15000,
      createdAt: editFormData.createdAt || Date.now(),
    }

    const updated = saveMockup(newMockup)
    colorPartsRef.current = validColorParts
    onMockupsChange(updated)
    // Automatically set this newly created/updated mockup as active and open Studio Canvas
    onSelectAndOpenCanvas(newMockup.id)
    if (!openCanvasAfter) {
      alert(`Blangko seragam "${newMockup.name}" berhasil disimpan! Foto dan ${validColorParts.length} zona pewarnaan aktif di Studio Canvas.`)
    }
    setIsEditing(false)
  }

  const triggerUploadForSide = (side: ViewSide) => {
    setUploadTargetSide(side)
    fileInputRef.current?.click()
  }

  const handleFileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string
      const img = new Image()
      img.onload = () => {
        // High-definition optimization: auto-downscale to max 1600px so 4 photos are lightweight, fast & sharp
        const MAX_DIM = 1600
        let w = img.naturalWidth || img.width
        let h = img.naturalHeight || img.height
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w)
            w = MAX_DIM
          } else {
            w = Math.round((w * MAX_DIM) / h)
            h = MAX_DIM
          }
        }
        const off = document.createElement('canvas')
        off.width = w
        off.height = h
        const offCtx = off.getContext('2d')
        let finalDataUrl = rawDataUrl
        if (offCtx) {
          offCtx.drawImage(img, 0, 0, w, h)
          const isJpeg = file.type === 'image/jpeg' || file.name.match(/\.(jpe?g)$/i)
          finalDataUrl = isJpeg
            ? off.toDataURL('image/jpeg', 0.92)
            : off.toDataURL('image/png')
        }

        setEditFormData((prev) => {
          const sideKey =
            uploadTargetSide === 'front'
              ? 'frontImg'
              : uploadTargetSide === 'back'
              ? 'backImg'
              : uploadTargetSide === 'left'
              ? 'leftImg'
              : 'rightImg'
          return {
            ...prev,
            [sideKey]: finalDataUrl,
          }
        })
        setSelectedSide(uploadTargetSide)
      }
      img.src = rawDataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removePhotoSide = (side: ViewSide) => {
    const sideKey =
      side === 'front'
        ? 'frontImg'
        : side === 'back'
        ? 'backImg'
        : side === 'left'
        ? 'leftImg'
        : 'rightImg'
    setEditFormData((prev) => ({
      ...prev,
      [sideKey]: undefined,
    }))
  }

  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID')
  }

  const renderBaseMockup = (side: ViewSide) => {
    const sideKey =
      side === 'front'
        ? 'frontImg'
        : side === 'back'
        ? 'backImg'
        : side === 'left'
        ? 'leftImg'
        : 'rightImg'
    const imgUrl = editFormData[sideKey]
    if (imgUrl) {
      return (
        <img
          src={imgUrl}
          alt={`Mockup ${side}`}
          className="w-full h-full object-fill pointer-events-none select-none block"
        />
      )
    }

    // High detail PDH workwear vector fallback if no photo uploaded yet
    return (
      <svg className="w-full h-full drop-shadow-md block" fill="none" viewBox="0 0 540 640" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shadow Body Base */}
        <path d="M190 40 L110 95 L40 180 L85 240 L130 190 L130 580 L410 580 L410 190 L455 240 L500 180 L430 95 L350 40 Z" fill="#1b2536" stroke="#0f172a" strokeLinejoin="round" strokeWidth="2.5" />
        {/* Fabric Body (Drill Heavyweight Navy #1E293B) */}
        <path d="M130 190 L190 40 L350 40 L410 190 L410 580 L130 580 Z" fill="#1e293b" />
        {/* Left Sleeves */}
        <path d="M190 40 L110 95 L40 180 L85 240 L130 190 Z" fill="#1a2538" stroke="#0f172a" strokeWidth="1.5" />
        {/* Right Sleeves */}
        <path d="M350 40 L430 95 L500 180 L455 240 L410 190 Z" fill="#1a2538" stroke="#0f172a" strokeWidth="1.5" />
        {/* Shoulder Epaulette Left */}
        <polygon fill="#151e2e" points="175,45 125,95 140,115 190,65" stroke="#334155" strokeWidth="1.5" />
        <circle cx="178" cy="58" fill="#94a3b8" r="3.5" />
        {/* Shoulder Epaulette Right */}
        <polygon fill="#151e2e" points="365,45 415,95 400,115 350,65" stroke="#334155" strokeWidth="1.5" />
        <circle cx="362" cy="58" fill="#94a3b8" r="3.5" />
        {/* Collar Stand */}
        <path d="M190 40 C220 70 320 70 350 40 L330 85 C295 105 245 105 210 85 Z" fill="#151e2e" stroke="#334155" strokeWidth="1.5" />
        <path d="M210 85 L270 120 L330 85" stroke="#475569" strokeDasharray="3 3" strokeWidth="1.8" />
        {/* Front Central Placket */}
        <rect fill="#151e2e" height="490" stroke="#334155" strokeWidth="1.5" width="32" x="254" y="90" />
        <line stroke="#475569" strokeDasharray="2 2" strokeWidth="1" x1="258" x2="258" y1="90" y2="580" />
        <line stroke="#475569" strokeDasharray="2 2" strokeWidth="1" x1="282" x2="282" y1="90" y2="580" />
        {/* Buttons */}
        <circle cx="270" cy="130" fill="#0f172a" r="4" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="270" cy="200" fill="#0f172a" r="4" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="270" cy="280" fill="#0f172a" r="4" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="270" cy="360" fill="#0f172a" r="4" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="270" cy="440" fill="#0f172a" r="4" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="270" cy="520" fill="#0f172a" r="4" stroke="#64748b" strokeWidth="1.5" />
        {/* Left Pocket */}
        <polygon fill="#172233" points="152,190 236,190 236,215 194,228 152,215" stroke="#334155" strokeWidth="1.5" />
        <circle cx="194" cy="214" fill="#0f172a" r="3.5" stroke="#64748b" strokeWidth="1" />
        <polygon fill="#141c2b" points="155,215 233,215 233,295 194,310 155,295" stroke="#334155" strokeWidth="1.5" />
        {/* Right Pocket */}
        <polygon fill="#172233" points="304,190 388,190 388,215 346,228 304,215" stroke="#334155" strokeWidth="1.5" />
        <circle cx="346" cy="214" fill="#0f172a" r="3.5" stroke="#64748b" strokeWidth="1" />
        <polygon fill="#141c2b" points="307,215 385,215 385,295 346,310 307,295" stroke="#334155" strokeWidth="1.5" />
        {/* Safe Zone Garis Bantu Slot */}
        <rect height="55" opacity="0.45" rx="3" stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1.2" width="90" x="150" y="130" />
        <rect height="55" opacity="0.45" rx="3" stroke="#fbbf24" strokeDasharray="3 3" strokeWidth="1.2" width="90" x="302" y="130" />
        {/* Strip Scotlight K3 (Bawah) */}
        {showScotlight && (
          <>
            <rect fill="#a3e635" height="22" opacity="0.9" width="280" x="130" y="525" />
            <rect fill="#f8fafc" height="7" opacity="0.95" width="280" x="130" y="532.5" />
          </>
        )}
      </svg>
    )
  }

  // Exact stage dimensions matching canvas aspect ratio to guarantee zero letterboxing offset
  const stageAspectRatio = canvasSize.width / Math.max(1, canvasSize.height)
  const MAX_STAGE_HEIGHT = 600
  const MAX_STAGE_WIDTH = 540
  let stageDisplayHeight = MAX_STAGE_HEIGHT
  let stageDisplayWidth = stageDisplayHeight * stageAspectRatio
  if (stageDisplayWidth > MAX_STAGE_WIDTH) {
    stageDisplayWidth = MAX_STAGE_WIDTH
    stageDisplayHeight = stageDisplayWidth / stageAspectRatio
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden File Input for Mockup Photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUploaded}
        className="hidden"
      />

      {/* Hidden File Input for Part PNG Mask */}
      <input
        ref={partMaskInputRef}
        type="file"
        accept="image/png,image/svg+xml,image/*"
        onChange={handlePartMaskUploaded}
        className="hidden"
      />

      {/* Header Banner Dashboard */}
      <div className="bg-black text-white rounded-3xl p-6 sm:p-8 border border-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#ff5e00] uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Dashboard Mockup Studio
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
            Kelola & Editor Mockup Seragam
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Buat katalog seragam Anda sendiri dengan meng-upload foto realistis tampak Depan, Belakang, Sisi Kiri, dan Sisi Kanan. Atur harga dasar serta diskon lusinan.
          </p>
        </div>

        <button
          onClick={handleOpenCreateNew}
          className="px-6 py-3.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-[#ff5e00]/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tambah Model Seragam Baru
        </button>
      </div>

      {/* FULLSCREEN EDITOR BLANGKO MASTER - SERAGAM ATELIER (OWNER MODE) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-[#fafbfe] text-[#0f172a] font-body flex flex-col h-screen w-screen overflow-hidden select-none text-[13px] antialiased">
          {/* 1. TOP HEADER (CLEAN WHITE THEME) */}
          <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 text-[#0f172a] select-none z-50 flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {/* Left: Branding & Nama Template Blangko */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                <span className="material-symbols-outlined text-[18px]">design_services</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-title-md font-bold text-sm text-[#0f172a] leading-tight">
                    Blangko Master: {editFormData.name || 'Kemeja PDH'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[10px] tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    OWNER MODE
                  </span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  {editFormData.category || 'Kemeja PDH/PDL'} • {(editFormData.colorParts || []).length} Zona Masking Aktif
                </p>
              </div>
            </div>

            {/* Center: Sudut Pandang Switcher (Depan, Belakang, Lengan Kiri, Lengan Kanan) */}
            <div className="flex items-center gap-1 bg-[#f8fafc] p-1 rounded-lg border border-[#e2e8f0]">
              {(
                [
                  { id: 'front', label: 'Tampak Depan' },
                  { id: 'back', label: 'Tampak Belakang' },
                  { id: 'left', label: 'Lengan Kiri' },
                  { id: 'right', label: 'Lengan Kanan' },
                ] as const
              ).map((angle) => {
                const isActive = selectedSide === angle.id
                const hasPhoto =
                  angle.id === 'front'
                    ? !!editFormData.frontImg
                    : angle.id === 'back'
                    ? !!editFormData.backImg
                    : angle.id === 'left'
                    ? !!editFormData.leftImg
                    : !!editFormData.rightImg
                return (
                  <button
                    key={angle.id}
                    type="button"
                    onClick={() => handleSelectSide(angle.id)}
                    className={`px-3 py-1 rounded-md text-[12px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-white text-indigo-600 font-semibold shadow-xs border border-slate-200'
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-white/70 font-medium'
                    }`}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                    {angle.label}
                    {hasPhoto && !isActive && (
                      <span className="w-1 h-1 rounded-full bg-emerald-500" title="Foto Terunggah"></span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Right: Undo/Redo, Kontrol Zoom Minimalis & Aksi Utama */}
            <div className="flex items-center gap-2">
              {/* Global Undo & Redo (Batalkan / Kembalikan SEMUA Tindakan) */}
              <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-0.5 gap-0.5 mr-1">
                <button
                  type="button"
                  onClick={handleGlobalDashboardUndo}
                  disabled={dashboardUndoStack.length === 0}
                  className="h-7 px-2 text-[11px] font-bold text-slate-700 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Batalkan Tindakan Apapun (Undo / Ctrl+Z)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Undo</span>
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <button
                  type="button"
                  onClick={handleGlobalDashboardRedo}
                  disabled={dashboardRedoStack.length === 0}
                  className="h-7 px-2 text-[11px] font-bold text-slate-700 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Kembalikan Tindakan Apapun (Redo / Ctrl+Y)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Redo</span>
                </button>
              </div>

              {/* Zoom Control Minimalis (Hingga 2000%) */}
              <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2 py-1 text-[#64748b] text-[11px] font-tech-data mr-1">
                <button
                  type="button"
                  onClick={() => handleZoomStep(-1)}
                  className="hover:text-[#0f172a] px-1 text-[13px] font-bold cursor-pointer disabled:opacity-30"
                  disabled={zoomScale <= 0.5}
                  title="Zoom Out (-)"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Siklus zoom praktis: 100% -> 200% -> 500% -> 1000% -> 2000% -> 100%
                    if (zoomScale < 2) handleSetZoom(2)
                    else if (zoomScale < 5) handleSetZoom(5)
                    else if (zoomScale < 10) handleSetZoom(10)
                    else if (zoomScale < 20) handleSetZoom(20)
                    else handleSetZoom(1)
                  }}
                  className="px-1.5 text-[#0f172a] font-bold cursor-pointer hover:underline"
                  title="Klik untuk ganti tingkat zoom cepat (100% → 200% → 500% → 1000% → 2000% / Reset)"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => handleZoomStep(1)}
                  className="hover:text-[#0f172a] px-1 text-[13px] font-bold cursor-pointer disabled:opacity-30"
                  disabled={zoomScale >= 20}
                  title="Zoom In (+) hingga 2000%"
                >
                  +
                </button>
                {zoomScale >= 10 && (
                  <span className="text-[9px] font-black px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 ml-0.5 border border-indigo-200">
                    {zoomScale >= 20 ? '2000% MAX' : 'ULTRA'}
                  </span>
                )}
              </div>

              {/* Upload Foto Sisi Mockup */}
              <button
                type="button"
                onClick={() => triggerUploadForSide(selectedSide)}
                className="h-8 px-2.5 text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title={`Upload foto asli untuk ${selectedSide === 'front' ? 'Tampak Depan' : selectedSide === 'back' ? 'Tampak Belakang' : selectedSide === 'left' ? 'Lengan Kiri' : 'Lengan Kanan'}`}
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Foto Sisi Ini</span>
              </button>
              {!!editFormData[selectedSide === 'front' ? 'frontImg' : selectedSide === 'back' ? 'backImg' : selectedSide === 'left' ? 'leftImg' : 'rightImg'] && (
                <button
                  type="button"
                  onClick={() => removePhotoSide(selectedSide)}
                  className="h-8 w-8 text-red-500 hover:bg-red-50 border border-red-200 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  title="Hapus foto sisi ini (kembalikan ke vector PDH)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Tombol Info & Harga */}
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="h-8 px-2.5 text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Atur Nama, Kategori, Harga Dasar, dan Diskon Lusinan"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Info & Harga</span>
              </button>

              {/* Tombol Pratinjau Pengguna */}
              <button
                type="button"
                onClick={() => handleSaveForm(true)}
                className="h-8 px-3 text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Simulasi tampilan kanvas di sisi customer"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500">visibility</span>
                <span>Pratinjau Pengguna</span>
              </button>

              {/* Tombol Simpan Blangko */}
              <button
                type="button"
                onClick={() => handleSaveForm(false)}
                className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[12px] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Simpan Blangko</span>
              </button>

              {/* Tombol Tutup / Batal */}
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer ml-1"
                title="Tutup Editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 2. WORKSPACE BODY: 3-ZONE (TOOLBAR KIRI, CANVAS LAPANG, INSPECTOR KANAN) */}
          <div className="flex-1 flex flex-row overflow-hidden relative">
            {/* TOOLBAR KIRI: MINIMALIS & ESENSIAL */}
            <aside className="w-14 bg-white border-r border-[#e2e8f0] flex flex-col items-center py-3 justify-between flex-shrink-0 z-30 select-none shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col items-center gap-2 w-full px-2">
                {/* 1. Select / Pointer */}
                <button
                  type="button"
                  onClick={() => setDrawingTool('hand')}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    drawingTool === 'hand'
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Pilih / Geser (V)"
                >
                  <span className="material-symbols-outlined text-[20px]">near_me</span>
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    Pilih / Pointer (V)
                  </span>
                </button>

                {/* 2. Pen Tool Jahitan (Aktif) */}
                <button
                  type="button"
                  onClick={() => setDrawingTool('pen')}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group shadow-xs transition-colors cursor-pointer ${
                    drawingTool === 'pen'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Pen Tool: Gambar Masking Bagian/Pola Kain"
                >
                  <span className="material-symbols-outlined text-[20px]">polyline</span>
                  {drawingTool === 'pen' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-white ring-1 ring-indigo-400"></span>
                  )}
                  <span className="absolute left-14 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-cyan-300">Pen Tool: Color Mask Part</span>
                    <span className="text-[10px] text-slate-300">Buat Zona Pewarnaan Presisi</span>
                  </span>
                </button>

                {/* 3. Kuas / Brush */}
                <button
                  type="button"
                  onClick={() => setDrawingTool('brush')}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    drawingTool === 'brush'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Kuas Masker Manual"
                >
                  <Paintbrush className="w-4 h-4" />
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    Kuas Masker (B)
                  </span>
                </button>

                {/* 4. Penghapus */}
                <button
                  type="button"
                  onClick={() => setDrawingTool('eraser')}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    drawingTool === 'eraser'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Penghapus Masker"
                >
                  <Eraser className="w-4 h-4" />
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    Penghapus (E)
                  </span>
                </button>

                {/* Batalkan / Undo */}
                <button
                  type="button"
                  onClick={handleGlobalDashboardUndo}
                  disabled={dashboardUndoStack.length === 0}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    dashboardUndoStack.length === 0
                      ? 'text-slate-300 opacity-40 cursor-not-allowed'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Batalkan Tindakan Apapun (Undo / Ctrl+Z)"
                >
                  <span className="material-symbols-outlined text-[20px]">undo</span>
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    Batalkan / Undo (Ctrl+Z)
                  </span>
                </button>

                {/* Kembalikan / Redo */}
                <button
                  type="button"
                  onClick={handleGlobalDashboardRedo}
                  disabled={dashboardRedoStack.length === 0}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    dashboardRedoStack.length === 0
                      ? 'text-slate-300 opacity-40 cursor-not-allowed'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Kembalikan Tindakan Apapun (Redo / Ctrl+Y)"
                >
                  <span className="material-symbols-outlined text-[20px]">redo</span>
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    Kembalikan / Redo (Ctrl+Y)
                  </span>
                </button>

                <div className="w-8 h-px bg-[#e2e8f0] my-1"></div>

                {/* 5. Tambah Slot Logo */}
                <button
                  type="button"
                  onClick={() => setShowLogoSlot((prev) => !prev)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    showLogoSlot
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Toggle Slot Logo Dada"
                >
                  <span className="material-symbols-outlined text-[20px]">crop_free</span>
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    {showLogoSlot ? 'Sembunyikan Slot Logo' : 'Tampilkan Slot Logo'}
                  </span>
                </button>

                {/* 6. Tambah Scotlight */}
                <button
                  type="button"
                  onClick={() => setShowScotlight((prev) => !prev)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    showScotlight
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Tambah / Toggle Scotlight Reflektor K3"
                >
                  <span className="material-symbols-outlined text-[20px]">view_stream</span>
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    {showScotlight ? 'Sembunyikan Scotlight' : 'Tambah Scotlight K3'}
                  </span>
                </button>

                {/* 7. Slot Teks Monogram */}
                <button
                  type="button"
                  onClick={() => setShowMonogramSlot((prev) => !prev)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    showMonogramSlot
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
                  }`}
                  title="Slot Teks / Nama Dada"
                >
                  <span className="material-symbols-outlined text-[20px]">title</span>
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    {showMonogramSlot ? 'Sembunyikan Monogram' : 'Slot Teks Monogram'}
                  </span>
                </button>

                <div className="w-8 h-px bg-[#e2e8f0] my-1"></div>

                {/* Panduan Grid Toggle */}
                <button
                  type="button"
                  onClick={() => setShowGrid((prev) => !prev)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    showGrid
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle Panduan Grid"
                >
                  <span className="material-symbols-outlined text-[20px]">grid_4x4</span>
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    Grid Garis Bantu ({showGrid ? 'Aktif' : 'Nonaktif'})
                  </span>
                </button>

                {/* Center Guide Line Toggle */}
                <button
                  type="button"
                  onClick={() => setShowCenterGuide((prev) => !prev)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative group transition-colors cursor-pointer ${
                    showCenterGuide
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Toggle Garis Tengah Baju"
                >
                  <Sliders className="w-4 h-4" />
                  <span className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    Garis Tengah ({showCenterGuide ? 'Aktif' : 'Nonaktif'})
                  </span>
                </button>
              </div>

              {/* Status Indikator Bawah */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 cursor-pointer"
                  title="Blangko Siap: Masking Engine Aktif"
                ></div>
              </div>
            </aside>

            {/* KANVAS TENGAH: LAPANG DENGAN DOT GRID LEMBUT */}
            <main
              className="flex-1 flex flex-col relative overflow-hidden bg-[#fafbfe] select-none"
              style={
                showGrid
                  ? {
                      backgroundImage: 'radial-gradient(#d5dce6 1.2px, transparent 1.2px)',
                      backgroundSize: '20px 20px',
                    }
                  : undefined
              }
              onWheel={handleWheelZoom}
            >
              {/* Garis Pandu Tengah Bersih */}
              {showCenterGuide && (
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-indigo-300/40 pointer-events-none z-10"></div>
              )}

              {/* FLOATING TOP BANNER: MODE EDIT MASKER BERJALAN ATAU PEN TOOL */}
              {editingExistingPartId ? (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[11px] font-medium shadow-2xl flex flex-wrap items-center justify-between gap-3 border border-cyan-400/50 pointer-events-auto z-40 animate-in fade-in slide-in-from-top-2 duration-200 max-w-[95vw]">
                  {/* Part Name & Active Badge */}
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-slate-300">
                      Mengedit:{' '}
                      <strong className="text-cyan-200 font-black text-xs uppercase tracking-wide">
                        {(editFormData.colorParts || []).find((p) => p.id === editingExistingPartId)?.name ||
                          'Masker Bagian'}
                      </strong>
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                      Mode Kuas & Pen
                    </span>
                  </div>

                  <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

                  {/* Quick Tool Selector: Kuas / Pen Tool / Penghapus */}
                  <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setDrawingTool('brush')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        drawingTool === 'brush'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                      }`}
                      title="Kuas Masker (B): Usap pada gambar untuk menambahkan warna kain"
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      <span>Kuas (B)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDrawingTool('pen')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        drawingTool === 'pen'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                      }`}
                      title="Pen Tool (P): Buat lekukan kurva CorelDRAW presisi tinggi"
                    >
                      <span className="text-sm leading-none">✒️</span>
                      <span>Pen Tool (P)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDrawingTool('eraser')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        drawingTool === 'eraser'
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                      }`}
                      title="Penghapus (E): Hapus atau rapikan area masker yang berlebih"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Penghapus (E)</span>
                    </button>
                  </div>

                  {/* Tool Options (Brush Size or Pen Curve Modes) */}
                  {drawingTool === 'brush' || drawingTool === 'eraser' ? (
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400">Ukuran:</span>
                      <input
                        type="range"
                        min={4}
                        max={60}
                        value={markerBrushSize}
                        onChange={(e) => setMarkerBrushSize(Number(e.target.value))}
                        className="w-16 h-1.5 accent-cyan-400 cursor-pointer"
                      />
                      <span className="font-mono text-[10px] text-cyan-300 w-8">{markerBrushSize}px</span>
                    </div>
                  ) : drawingTool === 'pen' ? (
                    <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setPenCurveMode('smooth')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                          penCurveMode === 'smooth'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ∿ Halus
                      </button>
                      <button
                        type="button"
                        onClick={() => setPenCurveMode('straight')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold cursor-pointer ${
                          penCurveMode === 'straight'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ╱ Lurus
                      </button>
                      {penPoints.length >= 3 && (
                        <button
                          type="button"
                          onClick={handleFillPenToCanvas}
                          className="px-2 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] cursor-pointer ml-1"
                          title="Tambahkan kurva ini ke masker cyan sekarang"
                        >
                          + Gabung ke Masker
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Undo & Redo Shortcuts */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleGlobalDashboardUndo}
                      disabled={dashboardUndoStack.length === 0}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-white/10 disabled:cursor-not-allowed"
                      title="Undo tindakan apapun (Ctrl+Z)"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={handleGlobalDashboardRedo}
                      disabled={dashboardRedoStack.length === 0}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-white/10 disabled:cursor-not-allowed"
                      title="Redo tindakan apapun (Ctrl+Y)"
                    >
                      Redo
                    </button>
                  </div>

                  {/* Actions: Simpan & Batal */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => commitCurrentMaskToPart()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
                      title="Simpan hasil pewarnaan / penambahan masker ke seragam"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Simpan Masker</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEditingExistingPart}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="Batal edit masker tanpa menyimpan"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Batal</span>
                    </button>
                  </div>
                </div>
              ) : drawingTool === 'pen' ? (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-3.5 py-1.5 rounded-full text-[11px] font-medium shadow-xl flex items-center gap-2.5 border border-cyan-400/40 pointer-events-auto whitespace-nowrap z-40 animate-in fade-in duration-150">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>
                    Zona:{' '}
                    <strong className="text-cyan-200 font-semibold">
                      {newPartName || 'Zona Baru'}
                    </strong>
                  </span>

                  <span className="text-slate-500">|</span>

                  {/* CorelDRAW Curve Mode Switcher */}
                  <div className="flex items-center gap-0.5 bg-slate-800/90 p-0.5 rounded-full border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPenCurveMode('smooth')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        penCurveMode === 'smooth'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="Mode Kurva B-Spline Halus (Tekan 'M' untuk ganti)"
                    >
                      <span>∿</span>
                      <span>Kurva Halus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPenCurveMode('bezier')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        penCurveMode === 'bezier'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="Mode Kurva Bézier Dinamis"
                    >
                      <span>⌒</span>
                      <span>Bézier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPenCurveMode('straight')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        penCurveMode === 'straight'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="Mode Sudut Lurus / Polyline"
                    >
                      <span>╱</span>
                      <span>Lurus</span>
                    </button>
                  </div>

                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300 font-mono text-[10px]">
                    {penPoints.length} Pts
                  </span>

                  {penPoints.length >= 3 && (
                    <button
                      type="button"
                      onClick={() => commitCurrentMaskToPart()}
                      className="ml-0.5 px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                      title="Tutup bentuk dan simpan masker ke layer"
                    >
                      <span>✓ Simpan Masker</span>
                    </button>
                  )}
                  {dashboardUndoStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleGlobalDashboardUndo}
                      className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] transition-colors cursor-pointer"
                      title="Undo Node / Tindakan Terakhir (Backspace / Ctrl+Z)"
                    >
                      Undo
                    </button>
                  )}
                  {dashboardRedoStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleGlobalDashboardRedo}
                      className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] transition-colors cursor-pointer"
                      title="Redo Node / Tindakan (Ctrl+Y)"
                    >
                      Redo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelPen}
                    className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] transition-colors cursor-pointer"
                  >
                    Batal (Esc)
                  </button>
                </div>
              ) : null}

              {/* Area Kerja Mockup Kemeja */}
              <div
                className="flex-1 relative flex items-center justify-center p-6 overflow-hidden cursor-default"
                onMouseDown={(e) => {
                  if (isSpacePressed || drawingTool === 'hand' || e.button === 1) {
                    setIsPanning(true)
                    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
                  }
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
                  }
                }}
                onMouseUp={() => setIsPanning(false)}
              >
                {/* TRANSFORM CONTAINER PAN & ZOOM */}
                <div
                  className="relative transition-none select-none"
                  style={{
                    transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${
                      panOffset.y / zoomScale
                    }px)`,
                    transformOrigin: 'center center',
                  }}
                >
                  {/* KONTEN MOCKUP KEMEJA - 1:1 EXACT BOUNDING WRAPPER ZERO LETTERBOXING */}
                  <div
                    className="relative flex items-center justify-center drop-shadow-xl select-none"
                    style={{
                      width: `${Math.round(stageDisplayWidth)}px`,
                      height: `${Math.round(stageDisplayHeight)}px`,
                    }}
                  >
                    {/* BASE MOCKUP (IMAGE OR PDH VECTOR) */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none">
                      {renderBaseMockup(selectedSide)}
                    </div>

                    {/* MULTIPLY COLORABLE PARTS (FABRIC TEXTURE ABSORPTION) */}
                    {(editFormData.colorParts || [])
                      .filter((p) => p.side === selectedSide && !hiddenPartIds.includes(p.id))
                      .map((part, pIdx, arr) => {
                        if (!part.maskImg) return null
                        const isPartActive =
                          editingExistingPartId === part.id ||
                          (!editingExistingPartId &&
                            (editFormData.colorParts || []).filter((p) => p.side === selectedSide)[0]?.id === part.id)
                        const displayColor = isPartActive
                          ? simulatedPreviewColor
                          : part.defaultColor || '#1e3a8a'
                        return (
                          <div
                            key={part.id}
                            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-150"
                            style={{
                              zIndex: 10 + (arr.length - pIdx),
                              opacity: layerPreviewOpacity / 100,
                              mixBlendMode: 'multiply',
                              WebkitMaskImage: `url(${part.maskImg})`,
                              maskImage: `url(${part.maskImg})`,
                              WebkitMaskSize: '100% 100%',
                              maskSize: '100% 100%',
                              WebkitMaskRepeat: 'no-repeat',
                              maskRepeat: 'no-repeat',
                              backgroundColor: displayColor,
                            }}
                          />
                        )
                      })}

                    {/* SLOT AKTIF: LOGO DADA KIRI (BOUNDING BOX BERSIH) */}
                    {showLogoSlot && selectedSide === 'front' && (
                      <div
                        className="absolute border-2 border-indigo-500 bg-indigo-500/10 rounded-md cursor-pointer flex flex-col items-center justify-center z-20 shadow-xs pointer-events-none"
                        style={{
                          top: `${(132 / 640) * stageDisplayHeight}px`,
                          left: `${(148 / 540) * stageDisplayWidth}px`,
                          width: `${(94 / 540) * stageDisplayWidth}px`,
                          height: `${(62 / 640) * stageDisplayHeight}px`,
                        }}
                      >
                        <div className="flex items-center gap-1 opacity-90">
                          <svg className="w-4 h-4 text-amber-400 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                          </svg>
                        </div>
                        <span className="font-tech-data font-bold text-[7px] text-white bg-slate-900/70 px-1 rounded mt-0.5">
                          SLOT #1 LOGO
                        </span>
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border-2 border-indigo-600 rounded-xs"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border-2 border-indigo-600 rounded-xs"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border-2 border-indigo-600 rounded-xs"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border-2 border-indigo-600 rounded-xs"></div>
                      </div>
                    )}

                    {/* SLOT 2: NAMA BORDIR (DADA KANAN) */}
                    {showMonogramSlot && selectedSide === 'front' && (
                      <div
                        className="absolute border border-dashed border-amber-400 bg-amber-400/15 px-2 py-1 rounded text-left pointer-events-none z-20"
                        style={{
                          top: `${(136 / 640) * stageDisplayHeight}px`,
                          right: `${(152 / 540) * stageDisplayWidth}px`,
                        }}
                      >
                        <span className="font-tech-data font-bold text-[8px] tracking-wider text-amber-600 block leading-tight">
                          NAMA PETUGAS
                        </span>
                        <span className="font-tech-data text-[6px] text-slate-500 block opacity-90 uppercase">
                          JABATAN / DIVISI
                        </span>
                      </div>
                    )}

                    {/* MASK CANVAS (1:1 PIXEL COORDINATE LAYER) */}
                    <canvas
                      ref={maskCanvasRef}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      onMouseDown={handleStartDrawMask}
                      onMouseMove={handleDrawMaskMove}
                      onMouseUp={handleEndDrawMask}
                      onMouseLeave={() => setBrushHoverCoord(null)}
                      onDoubleClick={handleDoubleClickCanvas}
                      className={`absolute inset-0 w-full h-full z-20 touch-none ${
                        drawingTool === 'pen'
                          ? 'cursor-crosshair'
                          : isSpacePressed || drawingTool === 'hand'
                          ? isPanning
                            ? 'cursor-grabbing'
                            : 'cursor-grab'
                          : 'cursor-crosshair'
                      }`}
                    />

                    {/* DYNAMIC BRUSH & ERASER CURSOR CIRCLE INDICATOR */}
                    {(drawingTool === 'brush' || drawingTool === 'eraser') && brushHoverCoord && (
                      <div
                        className="pointer-events-none absolute rounded-full border-2 z-35 -translate-x-1/2 -translate-y-1/2 transition-none"
                        style={{
                          left: `${(brushHoverCoord.x / canvasSize.width) * stageDisplayWidth}px`,
                          top: `${(brushHoverCoord.y / canvasSize.height) * stageDisplayHeight}px`,
                          width: `${(markerBrushSize / canvasSize.width) * stageDisplayWidth}px`,
                          height: `${(markerBrushSize / canvasSize.width) * stageDisplayWidth}px`,
                          borderColor: drawingTool === 'eraser' ? '#f43f5e' : '#06b6d4',
                          backgroundColor:
                            drawingTool === 'eraser' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(6, 182, 212, 0.25)',
                          boxShadow:
                            drawingTool === 'eraser'
                              ? '0 0 6px rgba(244, 63, 94, 0.6)'
                              : '0 0 6px rgba(6, 182, 212, 0.6)',
                        }}
                      />
                    )}

                    {/* OVERLAY VECTOR PEN TOOL: ANCHOR NODES & CONNECTING LINES */}
                    {drawingTool === 'pen' && (
                      <div className="absolute inset-0 pointer-events-none z-30">
                        {penPoints.length > 0 && (() => {
                          const scaleToSvg = (canvasSize.width / stageDisplayWidth) / zoomScale
                          const nodeRadius = 2.2 * scaleToSvg
                          const startNodeRadius = 3.2 * scaleToSvg
                          const strokeW = 0.75 * scaleToSvg
                          const tension = penCurveMode === 'bezier' ? 0.8 : 0.5

                          return (
                            <svg
                              className="w-full h-full pointer-events-none"
                              viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                              preserveAspectRatio="none"
                            >
                              {/* Spline / Curved Mode Preview (CorelDRAW Style) - ZERO STROKE BORDER ON FILLED SHAPES */}
                              {penCurveMode !== 'straight' ? (
                                <>
                                  {penPoints.length >= 3 && (
                                    <path
                                      d={getSplineSvgPath(penPoints, true, tension)}
                                      fill="rgba(6, 182, 212, 0.25)"
                                      stroke="none"
                                    />
                                  )}
                                  {penPoints.length === 2 && (
                                    <path
                                      d={getSplineSvgPath(penPoints, false, tension)}
                                      fill="none"
                                      stroke="#06b6d4"
                                      strokeWidth={0.5 * scaleToSvg}
                                    />
                                  )}
                                </>
                              ) : (
                                <>
                                  {penPoints.length >= 3 && (
                                    <polygon
                                      points={penPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                                      fill="rgba(6, 182, 212, 0.25)"
                                      stroke="none"
                                    />
                                  )}
                                  {penPoints.length > 1 && penPoints.length < 3 && (
                                    <polyline
                                      points={penPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                                      fill="none"
                                      stroke="#06b6d4"
                                      strokeWidth={0.5 * scaleToSvg}
                                    />
                                  )}
                                </>
                              )}

                              {/* Rubberband line to hover point - Hairline, no dash, no thick stroke */}
                              {penHoverPoint && (
                                <line
                                  x1={penPoints[penPoints.length - 1].x}
                                  y1={penPoints[penPoints.length - 1].y}
                                  x2={isPenClosing ? penPoints[0].x : penHoverPoint.x}
                                  y2={isPenClosing ? penPoints[0].y : penHoverPoint.y}
                                  stroke={isPenClosing ? '#22c55e' : '#06b6d4'}
                                  strokeWidth={0.5 * scaleToSvg}
                                />
                              )}

                              {/* Anchor Node Circles - Tiny, precise & professional */}
                              {penPoints.map((p, idx) => {
                                const isStart = idx === 0
                                const r = isStart && isPenClosing ? startNodeRadius * 1.3 : isStart ? startNodeRadius : nodeRadius
                                return (
                                  <g key={idx}>
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r={r}
                                      fill={isStart && isPenClosing ? '#22c55e' : isStart ? '#ffffff' : '#06b6d4'}
                                      stroke={isStart && isPenClosing ? '#15803d' : '#0891b2'}
                                      strokeWidth={strokeW}
                                    />
                                    {isStart && isPenClosing && (
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={r * 1.6}
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth={strokeW}
                                        className="animate-ping"
                                      />
                                    )}
                                  </g>
                                )
                              })}
                            </svg>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Footer Kanvas Sederhana */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
                <div className="bg-white/95 backdrop-blur border border-[#e2e8f0] px-3 py-1.5 rounded-lg text-[11px] text-[#64748b] flex items-center gap-2.5 shadow-xs pointer-events-auto">
                  <span className="flex items-center gap-1.5 text-[#0f172a] font-semibold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        drawingTool === 'pen' ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    ></span>
                    {drawingTool === 'pen'
                      ? 'Pen Tool Active'
                      : drawingTool === 'brush'
                      ? 'Brush Active'
                      : 'Pointer Ready'}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-medium text-slate-700">Auto-Sync 4 Sisi:</span>
                  <span
                    onClick={() => handleSelectSide('front')}
                    className={`px-1.5 py-0.5 rounded font-tech-data text-[10px] font-semibold border cursor-pointer ${
                      selectedSide === 'front'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Depan {selectedSide === 'front' ? '[Aktif]' : ''}
                  </span>
                  <span
                    onClick={() => handleSelectSide('back')}
                    className={`px-1.5 py-0.5 rounded font-tech-data text-[10px] font-semibold border cursor-pointer ${
                      selectedSide === 'back'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    Belakang {selectedSide === 'back' ? '[Aktif]' : '[Siap Di-link]'}
                  </span>
                  <span
                    onClick={() => handleSelectSide('left')}
                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-tech-data text-[10px] font-semibold border border-slate-200 cursor-pointer hover:bg-slate-200"
                  >
                    Kiri & Kanan [Auto-Linked]
                  </span>
                </div>

                <div className="bg-white/95 backdrop-blur border border-[#e2e8f0] px-3 py-1.5 rounded-lg text-[11px] text-[#64748b] flex items-center gap-2 shadow-xs pointer-events-auto">
                  <span className="material-symbols-outlined text-[15px] text-cyan-600">
                    auto_fix_high
                  </span>
                  <span>
                    Snap-to-Guide: <strong>Aktif</strong> • Zoom:{' '}
                    <strong>{Math.round(zoomScale * 100)}%</strong>
                  </span>
                </div>
              </div>
            </main>

            {/* 3. PANEL KANAN: INSPECTOR BLANGKO (CLEAN, WHITE & MINIMALIS) */}
            <aside className="w-80 bg-white border-l border-[#e2e8f0] flex flex-col justify-between flex-shrink-0 z-30 select-none overflow-y-auto shadow-[-1px_0_2px_rgba(0,0,0,0.02)]">
              <div className="p-3.5 flex flex-col gap-3.5">
                {/* CARD 1: PENGATURAN ZONA PEWARNAAN (COLOR MASK TOOL) */}
                <div className="bg-white rounded-xl border border-indigo-200 bg-indigo-50/15 p-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-indigo-100">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">
                        format_color_fill
                      </span>
                      <span className="font-title-md font-semibold text-[12px] text-[#0f172a]">
                        Zona Masking Warna
                      </span>
                    </div>
                    <span className="text-[9px] font-tech-data font-semibold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                      COLOR MASK
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 text-[12px]">
                    {/* Nama Bagian */}
                    <div>
                      <label className="block text-[11px] text-[#64748b] mb-1 font-medium">
                        Nama Bagian / Komponen
                      </label>
                      <input
                        type="text"
                        value={newPartName}
                        onChange={(e) => {
                          setNewPartName(e.target.value)
                          if (editingExistingPartId) {
                            handleUpdateColorPart(editingExistingPartId, { name: e.target.value })
                          }
                        }}
                        placeholder="Contoh: Kerah Kemeja (Collar), Saku Dada..."
                        className="w-full h-8 px-2.5 rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a] text-[12px] font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Mode Pen Tool: CorelDRAW Curves vs Straight */}
                    {drawingTool === 'pen' && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-indigo-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-indigo-600">polyline</span>
                            Mode Pen Tool (CorelDRAW)
                          </label>
                          <span className="text-[9px] font-tech-data font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                            {penCurveMode === 'smooth' ? 'B-SPLINE HALUS' : penCurveMode === 'bezier' ? 'BÉZIER LENGKUNG' : 'LURUS'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setPenCurveMode('smooth')}
                            className={`py-1.5 px-1 rounded-md transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center ${
                              penCurveMode === 'smooth'
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium'
                            }`}
                            title="Mode B-Spline: Kurva otomatis melengkung halus alami melewati titik (Kerah, Lengan, Bahu)"
                          >
                            <span className="text-[13px] leading-none">∿</span>
                            <span>B-Spline</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPenCurveMode('bezier')}
                            className={`py-1.5 px-1 rounded-md transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center ${
                              penCurveMode === 'bezier'
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium'
                            }`}
                            title="Mode Bézier: Kurva melengkung dinamis bergradien tinggi"
                          >
                            <span className="text-[13px] leading-none">⌒</span>
                            <span>Bézier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPenCurveMode('straight')}
                            className={`py-1.5 px-1 rounded-md transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center ${
                              penCurveMode === 'straight'
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium'
                            }`}
                            title="Mode Lurus: Garis lurus tegas antar titik (Saku, Placket, Strip)"
                          >
                            <span className="text-[13px] leading-none">╱</span>
                            <span>Lurus</span>
                          </button>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-1 leading-tight">
                          {penCurveMode === 'smooth'
                            ? '✨ Kurva B-Spline melengkung halus alami, sangat pas untuk kerah dan lekukan seragam.'
                            : penCurveMode === 'bezier'
                            ? '✨ Kurva Bézier lengkung tinggi dengan kontur lentur.'
                            : '✨ Garis lurus tegas sudut runcing untuk bagian kotak atau lurus.'}
                        </p>
                      </div>
                    )}

                    {/* Tipe Kontrol */}
                    <div>
                      <label className="block text-[11px] text-[#64748b] mb-1 font-medium">
                        Tipe Kontrol Pengunjung
                      </label>
                      <div className="p-2 bg-white rounded-lg border border-[#e2e8f0] flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#0f172a] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-indigo-600">
                            tune
                          </span>
                          Ganti Warna Kain Mandiri
                        </span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                          Interaktif
                        </span>
                      </div>
                    </div>

                    {/* Sinkronisasi Multi-Sisi */}
                    <div>
                      <label className="flex items-start justify-between p-2.5 rounded-lg bg-white border border-indigo-200 hover:border-indigo-300 cursor-pointer shadow-xs">
                        <div className="flex flex-col gap-0.5 pr-2">
                          <span className="text-[11px] font-semibold text-[#0f172a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-indigo-600">
                              sync
                            </span>
                            Sinkronisasi 4 Sisi Otomatis
                          </span>
                          <span className="text-[10px] text-[#64748b] leading-tight">
                            Otomatis ganti warna bagian ini di 4 sisi mockup secara bersamaan saat
                            dipilih pengunjung.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoSync4Sides}
                          onChange={(e) => setAutoSync4Sides(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 mt-0.5 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Status Pemetaan 4 Sisi */}
                    <div>
                      <span className="block text-[11px] font-medium text-[#64748b] mb-1.5">
                        Pemetaan Sudut Pandang (Mapping):
                      </span>
                      <div className="flex flex-col gap-1.5 font-tech-data text-[10px]">
                        <div
                          onClick={() => handleSelectSide('front')}
                          className={`flex items-center justify-between p-1.5 px-2 bg-white rounded border cursor-pointer ${
                            selectedSide === 'front'
                              ? 'border-indigo-400 bg-indigo-50/30'
                              : 'border-[#e2e8f0] hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Tampak Depan
                          </span>
                          <span className="text-emerald-600 font-medium">
                            {selectedSide === 'front'
                              ? `Path Aktif (${penPoints.length} Pts)`
                              : 'Siap'}
                          </span>
                        </div>
                        <div
                          onClick={() => handleSelectSide('back')}
                          className={`flex items-center justify-between p-1.5 px-2 bg-white rounded border cursor-pointer ${
                            selectedSide === 'back'
                              ? 'border-indigo-400 bg-indigo-50/30'
                              : 'border-amber-200 hover:bg-amber-50/50'
                          }`}
                        >
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Tampak Belakang
                          </span>
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            Link Sisi <span className="material-symbols-outlined text-[12px]">edit</span>
                          </span>
                        </div>
                        <div
                          onClick={() => handleSelectSide('left')}
                          className={`flex items-center justify-between p-1.5 px-2 bg-white rounded border text-slate-500 cursor-pointer ${
                            selectedSide === 'left' || selectedSide === 'right'
                              ? 'border-indigo-400 bg-indigo-50/30'
                              : 'border-[#e2e8f0]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            Lengan Kiri & Kanan
                          </span>
                          <span className="text-indigo-600 font-medium">Auto-Align</span>
                        </div>
                      </div>
                    </div>

                    {/* Opsi Palet Warna Diberikan */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-[#64748b]">
                          Palet Pilihan Pengunjung:
                        </span>
                        <label className="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                          + Tambah Warna
                          <input
                            type="color"
                            className="hidden"
                            onChange={(e) => {
                              const newC = e.target.value
                              if (!visitorPalette.includes(newC)) {
                                setVisitorPalette((prev) => [...prev, newC])
                              }
                              setNewPartColor(newC)
                            }}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {visitorPalette.slice(0, 8).map((color, idx) => {
                          const isSelected = newPartColor.toLowerCase() === color.toLowerCase()
                          const swatch = findClosestFabricSwatch(color)
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setNewPartColor(color)
                                setSimulatedPreviewColor(color)
                                if (editingExistingPartId) {
                                  handleUpdateColorPart(editingExistingPartId, {
                                    defaultColor: color,
                                  })
                                }
                              }}
                              title={swatch ? `${swatch.code} - ${swatch.name}` : color}
                              className={`flex flex-col items-center p-1 rounded-md bg-white cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-2 border-indigo-600 shadow-xs ring-1 ring-indigo-200'
                                  : 'border border-[#e2e8f0] hover:border-slate-300'
                              }`}
                            >
                              <div
                                className="w-5 h-5 rounded shadow-xs border border-black/10"
                                style={{ backgroundColor: color }}
                              ></div>
                              <span className="text-[8px] font-tech-data font-semibold mt-0.5 text-slate-700 truncate max-w-full">
                                {swatch ? swatch.code : color}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Opasitas Tekstur Kain */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1">
                        <span>Penyerapan Tekstur (Multiply):</span>
                        <span className="font-tech-data text-[10px] text-slate-700">{layerPreviewOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={layerPreviewOpacity}
                        onChange={(e) => setLayerPreviewOpacity(Number(e.target.value))}
                        className="w-full h-1 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Ukuran Kuas jika mode Kuas/Penghapus */}
                    {(drawingTool === 'brush' || drawingTool === 'eraser') && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1">
                          <span>Ukuran Kuas/Penghapus:</span>
                          <span className="font-tech-data text-[10px] text-slate-700">{markerBrushSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={60}
                          value={markerBrushSize}
                          onChange={(e) => setMarkerBrushSize(Number(e.target.value))}
                          className="w-full h-1 accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: SIMULASI DASHBOARD PENGUNJUNG (CUSTOMER PREVIEW) */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-slate-700">
                        preview
                      </span>
                      <span className="font-title-md font-semibold text-[12px] text-[#0f172a]">
                        Simulasi Sisi Pengunjung
                      </span>
                    </div>
                    <span className="text-[9px] font-tech-data font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      PREVIEW
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mb-2 leading-relaxed">
                    Tampilan widget pemilih warna yang muncul di sesi pemesan:
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[#0f172a] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-indigo-600">
                          palette
                        </span>
                        Ubah Warna {newPartName || 'Bagian'}:
                      </span>
                      <span className="text-[9px] text-indigo-600 font-tech-data font-medium">
                        Dipilih: {simulatedPreviewColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {visitorPalette.slice(0, 7).map((color, idx) => {
                        const isMatch = simulatedPreviewColor.toLowerCase() === color.toLowerCase()
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSimulatedPreviewColor(color)
                              setNewPartColor(color)
                              if (editingExistingPartId) {
                                handleUpdateColorPart(editingExistingPartId, { defaultColor: color })
                              }
                            }}
                            className={`w-6 h-6 rounded-full border border-black/10 transition-transform flex items-center justify-center cursor-pointer ${
                              isMatch ? 'ring-2 ring-indigo-600 scale-110 shadow-xs' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                            title={`Simulasikan warna ${color}`}
                          >
                            {isMatch && (
                              <Check
                                className={`w-3.5 h-3.5 ${
                                  color.toLowerCase() === '#ffffff'
                                    ? 'text-slate-900'
                                    : 'text-white'
                                }`}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* CARD 3: DAFTAR LAYER / ZONA BLANGKO */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-indigo-600">
                        layers
                      </span>
                      <span className="font-title-md font-semibold text-[12px] text-[#0f172a]">
                        Daftar Zona & Layer
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#64748b]">
                        {(editFormData.colorParts || []).filter((p) => p.side === selectedSide).length} Item
                      </span>
                      <button
                        type="button"
                        onClick={handleAddNewColorSlot}
                        className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition-colors cursor-pointer"
                        title="Buat Slot Layer Baru"
                      >
                        + Slot Manual
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-[11px] max-h-[380px] overflow-y-auto pr-0.5">
                    {(editFormData.colorParts || []).filter((p) => p.side === selectedSide).length === 0 ? (
                      <div className="text-center py-3 text-slate-400 text-[11px] space-y-2">
                        <p>Belum ada zona warna di sisi ini.</p>
                        {otherSidesComponents.length > 0 && (
                          <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100 text-left">
                            <span className="text-[10px] font-bold text-indigo-900 block mb-1">
                              Tautkan Komponen Sisi Lain (Sinkron 4 Sisi):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {otherSidesComponents.map((comp) => (
                                <button
                                  key={comp.name}
                                  type="button"
                                  onClick={() => handleAddColorPart(comp.name, selectedSide, comp.defaultColor)}
                                  className="px-2 py-0.5 rounded bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title={`Tautkan dan gambar masker untuk ${comp.name}`}
                                >
                                  <span className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: comp.defaultColor }} />
                                  <span>+ Gambar {comp.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Atau klik <strong>+ Slot Manual</strong> / langsung gambar dengan <strong>Pen Tool</strong> di kanvas.
                        </p>
                      </div>
                    ) : (
                      (editFormData.colorParts || [])
                        .filter((p) => p.side === selectedSide)
                        .map((part, index, arr) => {
                          const isTarget = editingExistingPartId === part.id
                          const hasMask = !!part.maskImg
                          const isHidden = hiddenPartIds.includes(part.id)
                          return (
                            <div
                              key={part.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, part.id)}
                              onDragOver={(e) => handleDragOver(e, part.id)}
                              onDrop={(e) => handleDrop(e, part.id)}
                              onDragEnd={handleDragEnd}
                              className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                                isTarget
                                  ? 'bg-indigo-50/90 border-indigo-400 shadow-xs ring-1 ring-indigo-400/30'
                                  : 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              {/* BARIS 1: Grip, Warna, Keterangan / Nama Layer (Input), Visibility, Hapus */}
                              <div className="flex items-center gap-1.5 w-full">
                                <span title="Geser urutan layer" className="cursor-grab shrink-0">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                                <div
                                  className="w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-2xs"
                                  style={{
                                    backgroundColor:
                                      editingExistingPartId === part.id
                                        ? simulatedPreviewColor
                                        : part.defaultColor,
                                  }}
                                  title={`Warna dasar: ${part.defaultColor}`}
                                />

                                {/* Tombol Pemilih Icon Bagian Pakaian */}
                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveIconPickerPartId((prev) =>
                                        prev === part.id ? null : part.id
                                      )
                                    }
                                    className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 text-indigo-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                    title="Pilih Icon Bagian Pakaian (Kerah, Saku, Kancing, dll.)"
                                  >
                                    <GarmentPartIcon
                                      iconId={part.icon}
                                      partName={part.name}
                                      className="w-4 h-4 stroke-[2.2]"
                                    />
                                  </button>

                                  {/* Icon Picker Popover */}
                                  {activeIconPickerPartId === part.id && (
                                    <div
                                      className="absolute top-8 left-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 w-64 animate-in fade-in zoom-in-95 duration-100"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                        <span className="text-[11px] font-extrabold text-slate-800">
                                          Pilih Icon Bagian Pakaian
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveIconPickerPartId(null)}
                                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1">
                                        {GARMENT_PART_ICONS.map((iconMeta) => {
                                          const isSelected =
                                            (part.icon || getGarmentIconForPart(part.name)) ===
                                            iconMeta.id
                                          return (
                                            <button
                                              key={iconMeta.id}
                                              type="button"
                                              onClick={() =>
                                                handleUpdatePartIconDirectly(part.id, iconMeta.id)
                                              }
                                              className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                                isSelected
                                                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400'
                                                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700'
                                              }`}
                                              title={`${iconMeta.label} - ${iconMeta.description}`}
                                            >
                                              <GarmentPartIcon
                                                iconId={iconMeta.id}
                                                className="w-4 h-4 stroke-[2.2]"
                                              />
                                              <span className="text-[8px] font-semibold text-center truncate w-full leading-tight">
                                                {iconMeta.label}
                                              </span>
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Input Keterangan / Nama Layer (Owner Mode: Bebas beri nama/keterangan layer) */}
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={part.name || ''}
                                    onFocus={() => pushDashboardSnapshot()}
                                    onChange={(e) => handleUpdatePartNameDirectly(part.id, e.target.value)}
                                    placeholder="Keterangan layer (misal: Kerah)..."
                                    className={`w-full h-7 px-2 text-xs font-bold rounded-lg border transition-all ${
                                      isTarget
                                        ? 'bg-white border-indigo-400 text-indigo-950 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                                    }`}
                                    title="Ketik keterangan atau nama layer bagian seragam ini"
                                  />
                                </div>

                                {isTarget && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-extrabold border border-cyan-300 animate-pulse shrink-0">
                                    Aktif
                                  </span>
                                )}

                                {/* Visibility Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePartVisibility(part.id)}
                                  className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                                  title={isHidden ? 'Tampilkan Layer' : 'Sembunyikan Layer'}
                                >
                                  {isHidden ? (
                                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  )}
                                </button>

                                {/* Delete Layer */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorPart(part.id)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer shrink-0"
                                  title="Hapus Layer Bagian Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* BARIS 2: Toolbar Tindakan (Urutan Naik/Turun, Rapikan Tepi, Upload, Duplicate, Edit Masker) */}
                              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200/70 text-[10px]">
                                <div className="flex items-center gap-1">
                                  {/* Move Up / Down */}
                                  <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => handleMovePart(part.id, 'up')}
                                      className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                                      title="Naikkan Urutan Layer"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === arr.length - 1}
                                      onClick={() => handleMovePart(part.id, 'down')}
                                      className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                                      title="Turunkan Urutan Layer"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Rapikan Tepi (Defringe) */}
                                  {hasMask && (
                                    <button
                                      type="button"
                                      onClick={() => handleDefringePartMask(part.id)}
                                      className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-0.5"
                                      title="Rapikan tepi masker (hilangkan sisa garis tebal stroke)"
                                    >
                                      <span>✨ Rapikan</span>
                                    </button>
                                  )}

                                  {/* Upload File Masker PNG */}
                                  <button
                                    type="button"
                                    onClick={() => triggerPartMaskUpload(part.id)}
                                    className="p-1 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md cursor-pointer transition-colors"
                                    title="Upload file PNG masker transparan"
                                  >
                                    <Upload className="w-3 h-3" />
                                  </button>

                                  {/* Duplicate */}
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicatePart(part.id)}
                                    className="p-1 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md cursor-pointer transition-colors"
                                    title="Duplikat Layer"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  {!hasMask ? (
                                    <button
                                      type="button"
                                      onClick={() => handleStartDrawingForSlot(part.id)}
                                      className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="Mulai gambar masker untuk slot ini"
                                    >
                                      <Edit3 className="w-3 h-3 stroke-[2.5]" />
                                      <span>Gambar Masker</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isTarget) {
                                          commitCurrentMaskToPart()
                                        } else {
                                          handleLoadPartMaskToCanvas(part)
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                        isTarget
                                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                                          : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
                                      }`}
                                      title={
                                        isTarget
                                          ? 'Simpan perubahan masker sekarang'
                                          : 'Edit dan tambah area pewarnaan masker ini (pakai kuas / pen tool)'
                                      }
                                    >
                                      {isTarget ? (
                                        <>
                                          <Check className="w-3 h-3 stroke-[3]" />
                                          <span>Simpan Masker</span>
                                        </>
                                      ) : (
                                        <>
                                          <Edit3 className="w-3 h-3" />
                                          <span>Edit Masker</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar di Inspector */}
              <div className="p-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-[11px]">
                <span className="text-[#64748b]">Draf otomatis disimpan</span>
                <button
                  type="button"
                  onClick={() => {
                    if (hasDrawn || penPoints.length >= 3) {
                      commitCurrentMaskToPart()
                    } else {
                      handleSaveForm(false)
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Terapkan</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </aside>
          </div>

          {/* MODAL INFORMASI & HARGA SERAGAM (INFO & HARGA) */}
          {showInfoModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Pengaturan Model & Harga Seragam
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Atur identitas katalog, diskon kuantitas, dan clipping mask
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Nama Model */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Model Seragam
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Contoh: Kemeja PDH Ventura Lengan Pendek"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* Kategori & Harga Dasar */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                      <select
                        value={editFormData.category}
                        onChange={(e) =>
                          setEditFormData((prev) => ({ ...prev, category: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium bg-white"
                      >
                        <option value="Kemeja PDH/PDL">Kemeja PDH/PDL</option>
                        <option value="Kemeja Formal">Kemeja Formal</option>
                        <option value="Kaos / T-Shirt">Kaos / T-Shirt</option>
                        <option value="Polo Shirt">Polo Shirt</option>
                        <option value="Jaket / Hoodie">Jaket / Hoodie</option>
                        <option value="Rompi K3">Rompi K3</option>
                        <option value="Jas / Blazer">Jas / Blazer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Harga Dasar Satuan (Rp)
                      </label>
                      <input
                        type="number"
                        value={editFormData.basePrice}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            basePrice: Number(e.target.value),
                          }))
                        }
                        placeholder="85000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Diskon Lusinan */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="block font-bold text-slate-800 text-[11px]">
                      Potongan Harga Satuan (Diskon Kuantitas):
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Min. 12 pcs</label>
                        <input
                          type="number"
                          value={editFormData.discount12}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              discount12: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Min. 50 pcs</label>
                        <input
                          type="number"
                          value={editFormData.discount50}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              discount50: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                          placeholder="10000"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Min. 100 pcs</label>
                        <input
                          type="number"
                          value={editFormData.discount100}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              discount100: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                          placeholder="15000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deskripsi & Bahan */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Deskripsi & Karakteristik Bahan
                    </label>
                    <textarea
                      rows={2}
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Contoh: Bahan American Drill heavyweight 210gsm, serat rapat dan dingin."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-xs resize-none"
                    />
                  </div>

                  {/* Toggle Clipping Mask */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Clipping Mask Pola Baju
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Kunci grafis atau warna agar tidak bocor keluar batas pola kain.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editFormData.enableClippingMask ?? true}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          enableClippingMask: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(false)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Simpan & Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KATALOG MOCKUP SAYA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="font-extrabold text-slate-900 text-lg">
              Koleksi Model Mockup Seragam
            </h3>
            <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-full font-mono">
              {mockups.length} Model Tersedia
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden file input for backup restore */}
            <input
              type="file"
              ref={backupFileInputRef}
              onChange={handleBackupFileSelected}
              accept=".json"
              className="hidden"
            />

            {/* Backup & Restore Buttons */}
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-slate-300"
              title="Download cadangan data semua mockup ke komputer Anda"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Backup Database</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerImportBackup}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-slate-300"
              title="Pulihkan mockup dari file cadangan JSON"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pulihkan Database</span>
            </button>

            {mockups.length > 0 && !isEditing && (
              <button
                onClick={handleOpenCreateNew}
                className="px-4 py-2 bg-[#ff5e00] hover:bg-[#e05300] text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-1"
              >
                <Plus className="w-4 h-4" />
                Tambah Model Lain
              </button>
            )}
          </div>
        </div>

        {/* Security / Reassurance Notice Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-orange-50/60 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-xs">
                  Penyimpanan Database Aman & Permanen
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Auto-Sync ke Disk & Browser
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Mockup yang Anda buat otomatis tersimpan ganda di file disk (<code className="bg-white/80 px-1 py-0.5 rounded text-blue-800 font-mono text-[10px] font-bold">mockups-db.json</code>) dan memori browser. Klik <b>Backup Database</b> untuk mengunduh arsip cadangan kapan saja agar 100% aman saat pembaruan aplikasi!
              </p>
            </div>
          </div>
          {backupStatusMessage && (
            <div className="px-3.5 py-2 bg-emerald-100 border border-emerald-200 text-emerald-950 rounded-xl font-bold text-xs animate-fade-in flex items-center gap-2 shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{backupStatusMessage}</span>
            </div>
          )}
        </div>

        {mockups.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#ff5e00] flex items-center justify-center shadow-xs">
              <FolderPlus className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">
                Belum Ada Mockup Seragam yang Dibuat
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Anda dapat menambahkan model seragam baru menggunakan foto realistis Anda sendiri (tampak depan, belakang, kiri, kanan) lalu mengatur harga dasarnya.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={handleOpenCreateNew}
                className="w-full sm:w-auto px-6 py-3 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Buat Model Mockup Pertama Anda
              </button>
              <button
                onClick={handleLoadDemoSample}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
              >
                <Sparkles className="w-4 h-4 text-[#ff5e00]" />
                Muat Contoh Mockup PDH (Demo)
              </button>
            </div>
          </div>
        ) : (
          /* Grid Mockup Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockups.map((item) => {
              const isActive = activeMockupId === item.id
              const anglesCount = [item.frontImg, item.backImg, item.leftImg, item.rightImg].filter(
                Boolean
              ).length

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border p-4 flex flex-col justify-between transition-all bg-white shadow-xs group ${
                    isActive
                      ? 'border-[#ff5e00] ring-2 ring-[#ff5e00]/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="aspect-4/3 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden p-2 flex items-center justify-center relative mb-3">
                      {item.frontImg ? (
                        <img
                          src={item.frontImg}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">Tanpa Foto</span>
                      )}

                      {/* Active pill */}
                      {isActive && (
                        <span className="absolute top-2 left-2 bg-[#ff5e00] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Aktif di Kanvas
                        </span>
                      )}

                      {/* Angles indicator */}
                      <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                        {anglesCount} Sisi Foto
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff5e00] bg-orange-50 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.colorParts && item.colorParts.length > 0 && (
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Palette className="w-2.5 h-2.5" />
                            {item.colorParts.length} Bagian Warna
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs font-black text-black pt-1">
                        {formatRupiah(item.basePrice)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">/ pcs</span>
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 pt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setActiveMockupId(item.id)
                        onSelectAndOpenCanvas(item.id)
                      }}
                      className="w-full py-2.5 px-3 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Buka di Kanvas Desain
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                        title="Hapus Mockup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
  )
}
