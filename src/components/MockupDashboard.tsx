import React, { useState, useRef, useEffect } from 'react'
import type { MockupTemplate, ViewSide, ColorablePart } from '../types'
import {
  saveMockup,
  deleteMockup,
  setActiveMockupId,
  createDemoSampleMockup,
  exportMockupDatabase,
  importMockupDatabase,
} from '../services/mockupStorage'
import {
  Plus,
  Upload,
  Trash2,
  Edit3,
  Check,
  Palette,
  Layers,
  ArrowRight,
  Tag,
  Scissors,
  Paintbrush,
  Eraser,
  Square,
  RotateCcw,
  CheckCircle2,
  Percent,
  FolderPlus,
  Sparkles,
  PenTool,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  Download,
  ShieldCheck,
} from 'lucide-react'

interface MockupDashboardProps {
  mockups: MockupTemplate[]
  activeMockupId: string | null
  onMockupsChange: (updatedList: MockupTemplate[]) => void
  onSelectAndOpenCanvas: (mockupId: string) => void
}

export const MockupDashboard: React.FC<MockupDashboardProps> = ({
  mockups,
  activeMockupId,
  onMockupsChange,
  onSelectAndOpenCanvas,
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

  // Active Tab in Form: 'marker' (Big Photo & Zone Marker) | 'details' (Info & Pricing)
  const [activeEditorTab, setActiveEditorTab] = useState<'marker' | 'details'>('marker')

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
  const [highlightedPartId, setHighlightedPartId] = useState<string | null>(null)

  // Zoom & Pan for Maximum Detail Work (up to 1000% zoom!)
  const [zoomScale, setZoomScale] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false)

  // Pen Tool (Polygon Path with Interior Fill)
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([])
  const [penHoverPoint, setPenHoverPoint] = useState<{ x: number; y: number } | null>(null)
  const [isPenClosing, setIsPenClosing] = useState<boolean>(false)

  // Natural image dimensions for 1:1 pixel accuracy without letterboxing offset
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 1400,
  })

  const maskCanvasRef = useRef<HTMLCanvasElement>(null)

  // Sync canvas dimensions with actual mockup photo aspect ratio
  useEffect(() => {
    const currentImg =
      selectedSide === 'front'
        ? editFormData.frontImg
        : selectedSide === 'back'
        ? editFormData.backImg
        : selectedSide === 'left'
        ? editFormData.leftImg
        : editFormData.rightImg

    if (!currentImg) return

    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
    }
    img.src = currentImg
  }, [selectedSide, editFormData.frontImg, editFormData.backImg, editFormData.leftImg, editFormData.rightImg])

  const handleOpenCreateNew = () => {
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
    setActiveEditorTab('marker')
    handleClearMaskDraft()
    setIsEditing(true)
  }

  const handleOpenEdit = (item: MockupTemplate) => {
    setEditFormData({ ...item, colorParts: item.colorParts ? [...item.colorParts] : [] })
    setSelectedSide('front')
    setActiveEditorTab('marker')
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

  const handleAddColorPart = (name: string, side: ViewSide = 'front', defaultColor = '#1e3a8a') => {
    const newPart: ColorablePart = {
      id: 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name,
      side,
      defaultColor,
    }
    setEditFormData((prev) => ({
      ...prev,
      colorParts: [...(prev.colorParts || []), newPart],
    }))
  }

  const handleUpdateColorPart = (id: string, updates: Partial<ColorablePart>) => {
    setEditFormData((prev) => ({
      ...prev,
      colorParts: (prev.colorParts || []).map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  }

  const handleRemoveColorPart = (id: string) => {
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

  // ZOOM & PAN CONTROLS (UP TO 1000% FOR MAXIMUM PRECISION)
  const handleResetZoom = () => {
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleSetZoom = (newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, 0.75), 10)
    setZoomScale(clamped)
    if (clamped === 1) {
      setPanOffset({ x: 0, y: 0 })
    }
  }

  const handleZoomStep = (delta: number) => {
    setZoomScale((prev) => {
      const next = Math.round((prev + delta) * 10) / 10
      return Math.min(Math.max(next, 0.75), 10)
    })
  }

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.25 : -0.25
    setZoomScale((prev) => {
      const next = Math.round((prev + delta) * 100) / 100
      return Math.min(Math.max(next, 0.75), 10)
    })
  }

  // PEN TOOL METHODS (FILLABLE POLYGON AREA)
  const handleCloseAndFillPen = () => {
    const canvas = maskCanvasRef.current
    if (!canvas || penPoints.length < 3) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setMaskHistory((prev) => [...prev.slice(-15), canvas.toDataURL()])

    ctx.save()
    ctx.fillStyle = 'rgba(6, 182, 212, 0.85)'
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.95)'
    const scale = canvas.width / 500
    ctx.lineWidth = 2 * scale
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(penPoints[0].x, penPoints[0].y)
    for (let i = 1; i < penPoints.length; i++) {
      ctx.lineTo(penPoints[i].x, penPoints[i].y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
    setHasDrawn(true)
  }

  const handleUndoPenPoint = () => {
    setPenPoints((prev) => prev.slice(0, -1))
    setIsPenClosing(false)
  }

  const handleCancelPen = () => {
    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
  }

  const handleDoubleClickCanvas = () => {
    if (drawingTool === 'pen' && penPoints.length >= 3) {
      handleCloseAndFillPen()
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
          handleCloseAndFillPen()
        }
      } else if (e.key === 'Backspace') {
        if (drawingTool === 'pen' && penPoints.length > 0) {
          e.preventDefault()
          handleUndoPenPoint()
        }
      } else if (e.key === 'Escape') {
        if (drawingTool === 'pen' && penPoints.length > 0) {
          e.preventDefault()
          handleCancelPen()
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
  }, [drawingTool, penPoints, zoomScale])

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
        handleCloseAndFillPen()
        return
      }
      setPenPoints((prev) => [...prev, coords])
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

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
        ctx.fillStyle = 'rgba(6, 182, 212, 0.85)'
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

  const handleUndoMask = () => {
    if (drawingTool === 'pen' && penPoints.length > 0) {
      handleUndoPenPoint()
      return
    }

    const canvas = maskCanvasRef.current
    if (!canvas || maskHistory.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prevHistory = [...maskHistory]
    const lastData = prevHistory.pop()
    setMaskHistory(prevHistory)

    if (lastData) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = lastData
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
    }
  }

  const handleClearMaskDraft = () => {
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    setMaskHistory([])
    setPenPoints([])
    setPenHoverPoint(null)
    setIsPenClosing(false)
  }

  const handleSaveDrawnArea = () => {
    const canvas = maskCanvasRef.current
    if (!canvas || !hasDrawn) return

    const off = document.createElement('canvas')
    off.width = canvas.width
    off.height = canvas.height
    const offCtx = off.getContext('2d')
    if (!offCtx) return

    // Convert cyan marked pixels to solid black silhouette mask
    offCtx.drawImage(canvas, 0, 0)
    offCtx.globalCompositeOperation = 'source-in'
    offCtx.fillStyle = '#000000'
    offCtx.fillRect(0, 0, off.width, off.height)

    const maskDataUrl = off.toDataURL('image/png')
    const partName = newPartName.trim() || 'Bagian Seragam'

    const newPart: ColorablePart = {
      id: 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: partName,
      side: selectedSide,
      defaultColor: newPartColor,
      maskImg: maskDataUrl,
    }

    setEditFormData((prev) => ({
      ...prev,
      colorParts: [...(prev.colorParts || []), newPart],
    }))

    handleClearMaskDraft()
  }

  const handleSelectSide = (side: ViewSide) => {
    handleClearMaskDraft()
    handleResetZoom()
    setSelectedSide(side)
  }

  const handleSaveForm = (openCanvasAfter: boolean = false) => {
    if (!editFormData.name?.trim()) {
      alert('Mohon masukkan Nama Model Seragam terlebih dahulu!')
      return
    }

    if (!editFormData.frontImg) {
      alert('Mohon upload minimal foto Tampak Depan untuk mockup ini!')
      return
    }

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
      colorParts: editFormData.colorParts || [],
      discount12: Number(editFormData.discount12) || 5000,
      discount50: Number(editFormData.discount50) || 10000,
      discount100: Number(editFormData.discount100) || 15000,
      createdAt: editFormData.createdAt || Date.now(),
    }

    const updated = saveMockup(newMockup)
    onMockupsChange(updated)
    setIsEditing(false)

    if (openCanvasAfter) {
      onSelectAndOpenCanvas(newMockup.id)
    }
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
      const dataUrl = event.target?.result as string
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
          [sideKey]: dataUrl,
        }
      })
      setSelectedSide(uploadTargetSide)
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

      {/* FORM EDITOR MODAL / VIEW (Jika sedang mode edit/tambah) */}
      {isEditing && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 animate-in fade-in duration-200 space-y-6">
          {/* Header Modal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ff5e00] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {editFormData.id && mockups.some((m) => m.id === editFormData.id)
                    ? 'Editor Model Mockup & Area Warna'
                    : 'Buat Model Mockup Baru'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tandai langsung area saku, kerah, dan kancing di tampilan foto besar agar pengguna bisa ganti warna instan di Studio.
              </p>
            </div>

            {/* Main Tabs Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveEditorTab('marker')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeEditorTab === 'marker'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-[#ff5e00]" />
                <span>1. Editor Foto & Penanda Area (Tampilan Besar)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEditorTab('details')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeEditorTab === 'details'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>2. Informasi & Harga</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          {activeEditorTab === 'marker' ? (
            <div className="space-y-4">
              {/* Angle Switcher Header Bar */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 mr-1">Pilih Sudut Foto:</span>
                  {[
                    { id: 'front' as ViewSide, label: 'Tampak Depan (Utama)', key: 'frontImg' as const },
                    { id: 'back' as ViewSide, label: 'Tampak Belakang', key: 'backImg' as const },
                    { id: 'left' as ViewSide, label: 'Tampak Kiri', key: 'leftImg' as const },
                    { id: 'right' as ViewSide, label: 'Tampak Kanan', key: 'rightImg' as const },
                  ].map((angle) => {
                    const img = editFormData[angle.key]
                    const count = (editFormData.colorParts || []).filter((p) => p.side === angle.id).length
                    const isActive = selectedSide === angle.id
                    return (
                      <button
                        key={angle.id}
                        type="button"
                        onClick={() => handleSelectSide(angle.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-slate-900 border border-[#ff5e00]/40 shadow-xs ring-2 ring-[#ff5e00]/20'
                            : 'bg-white/60 text-slate-600 border border-slate-200 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        {img ? (
                          <img src={img} alt={angle.label} className="w-5 h-5 object-contain rounded" />
                        ) : (
                          <div className="w-5 h-5 rounded bg-slate-200 border border-slate-300 flex items-center justify-center text-[9px] text-slate-500 font-bold">
                            ?
                          </div>
                        )}
                        <span>{angle.label}</span>
                        {img ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                            Foto Ada
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                            Kosong
                          </span>
                        )}
                        <span className="text-[10px] bg-orange-100 text-[#ff5e00] font-black px-1.5 py-0.5 rounded-full">
                          {count} Area
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerUploadForSide(selectedSide)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#ff5e00]" />
                    <span>Upload / Ganti Foto {selectedSide === 'front' ? 'Depan' : selectedSide === 'back' ? 'Belakang' : selectedSide === 'left' ? 'Kiri' : 'Kanan'}</span>
                  </button>
                </div>
              </div>

              {/* Main Stage & Control Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* LARGE CANVAS STAGE WITH ZOOM (UP TO 1000%) & PEN TOOL */}
                <div
                  onWheel={handleWheelZoom}
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
                  onMouseUp={() => {
                    if (isPanning) setIsPanning(false)
                  }}
                  onMouseLeave={() => {
                    if (isPanning) setIsPanning(false)
                  }}
                  className={`lg:col-span-7 xl:col-span-8 bg-slate-200/60 rounded-3xl border border-slate-200 relative flex flex-col items-center justify-center p-0 select-none overflow-hidden min-h-[580px] sm:min-h-[660px] shadow-inner bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] ${
                    isSpacePressed || drawingTool === 'hand'
                      ? isPanning
                        ? 'cursor-grabbing'
                        : 'cursor-grab'
                      : drawingTool === 'pen'
                      ? isPenClosing
                        ? 'cursor-pointer'
                        : 'cursor-crosshair'
                      : 'cursor-crosshair'
                  }`}
                >
                  {(() => {
                    const currentImg =
                      selectedSide === 'front'
                        ? editFormData.frontImg
                        : selectedSide === 'back'
                        ? editFormData.backImg
                        : selectedSide === 'left'
                        ? editFormData.leftImg
                        : editFormData.rightImg

                    const currentParts = (editFormData.colorParts || []).filter(
                      (p) => p.side === selectedSide
                    )

                    if (!currentImg) {
                      return (
                        <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm space-y-4">
                          <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                            <Upload className="w-8 h-8 text-[#ff5e00]" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-slate-900">
                              Foto Tampak {selectedSide === 'front' ? 'Depan' : selectedSide === 'back' ? 'Belakang' : selectedSide === 'left' ? 'Kiri' : 'Kanan'} Belum Ada
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Upload foto realistis seragam Anda (disarankan foto berlatar transparan atau polos) untuk mulai menandai bagian-bagian warna di atasnya.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerUploadForSide(selectedSide)}
                            className="px-5 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#ff5e00]/25 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            + Upload Foto Sekarang
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div className="relative w-full h-[540px] sm:h-[620px] flex items-center justify-center overflow-hidden">
                        {/* TOP FLOATING ZOOM & PAN BAR (UP TO 1000% ZOOM) */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-2.5 py-1.5 shadow-md flex items-center gap-1.5 z-20 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => handleZoomStep(-0.5)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Perkecil Zoom (-)"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="range"
                            min={0.75}
                            max={10}
                            step={0.25}
                            value={zoomScale}
                            onChange={(e) => handleSetZoom(Number(e.target.value))}
                            className="w-20 sm:w-24 accent-[#ff5e00] cursor-pointer"
                            title="Geser Tingkat Zoom (hingga 1000%)"
                          />

                          <span className="font-mono text-xs font-black text-slate-900 w-12 text-center">
                            {Math.round(zoomScale * 100)}%
                          </span>

                          <button
                            type="button"
                            onClick={() => handleZoomStep(0.5)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Perbesar Zoom (+)"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Presets */}
                          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-1.5">
                            {[
                              { label: '100%', val: 1 },
                              { label: '250%', val: 2.5 },
                              { label: '500%', val: 5 },
                              { label: '1000%', val: 10 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleSetZoom(preset.val)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                                  Math.abs(zoomScale - preset.val) < 0.1
                                    ? 'bg-[#ff5e00] text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title={`Zoom ke ${preset.label}`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {/* Reset Button */}
                          <button
                            type="button"
                            onClick={handleResetZoom}
                            className="p-1 sm:px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 border-l border-slate-200 pl-1.5 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="Reset Zoom ke 100% & Tengahkan (0)"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-[#ff5e00]" />
                            <span className="hidden sm:inline">Reset</span>
                          </button>
                        </div>

                        {/* TOP-LEFT STATUS BADGE */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs pointer-events-none flex items-center gap-2 z-20">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                          <span className="text-[11px] font-bold text-slate-700">
                            {drawingTool === 'pen'
                              ? 'Mode Pen Tool: Hubungkan titik sudut, klik titik awal untuk isi warna'
                              : drawingTool === 'hand'
                              ? 'Mode Geser: Drag kanvas untuk bernavigasi'
                              : `Mode Penanda Aktif (${Math.round(zoomScale * 100)}% Detail)`}
                          </span>
                        </div>

                        {/* TRANSFORMED INNER VIEWPORT CONTAINER */}
                        <div
                          className="relative flex items-center justify-center"
                          style={{
                            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                            transformOrigin: 'center center',
                            transition: isPanning ? 'none' : 'transform 0.08s ease-out',
                          }}
                        >
                          {/* EXACT BOUNDING WRAPPER - MATCHES GARMENT PHOTO 1:1 WITH ZERO LETTERBOXING */}
                          <div className="relative inline-block select-none shadow-md rounded-2xl overflow-hidden bg-white/40">
                            {/* Garment Photo Base */}
                            <img
                              src={currentImg}
                              alt="Base Mockup Angle"
                              className="block max-h-[500px] sm:max-h-[580px] w-auto max-w-[85vw] sm:max-w-[620px] object-contain pointer-events-none select-none z-0"
                            />

                            {/* Saved Color Parts Overlays with Multiply Blend Mode */}
                            {currentParts.map((part) => {
                              if (!part.maskImg) return null
                              const isHighlighted = highlightedPartId === part.id
                              return (
                                <div
                                  key={part.id}
                                  className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
                                    isHighlighted ? 'ring-2 ring-[#ff5e00] ring-inset' : ''
                                  }`}
                                  style={{
                                    mixBlendMode: 'multiply',
                                    opacity: isHighlighted ? 1 : 0.85,
                                    maskImage: `url(${part.maskImg})`,
                                    WebkitMaskImage: `url(${part.maskImg})`,
                                    maskSize: '100% 100%',
                                    WebkitMaskSize: '100% 100%',
                                    backgroundColor: part.defaultColor,
                                  }}
                                />
                              )
                            })}

                            {/* Interactive Drawing Canvas */}
                            <canvas
                              ref={maskCanvasRef}
                              width={canvasSize.width}
                              height={canvasSize.height}
                              onMouseDown={handleStartDrawMask}
                              onMouseMove={handleDrawMaskMove}
                              onMouseUp={handleEndDrawMask}
                              onMouseLeave={handleEndDrawMask}
                              onDoubleClick={handleDoubleClickCanvas}
                              className="absolute inset-0 w-full h-full touch-none z-10"
                            />

                            {/* PEN TOOL VECTOR LIVE PREVIEW SVG */}
                            {drawingTool === 'pen' && penPoints.length > 0 && (() => {
                              const zoomFactor = Math.max(0.5, zoomScale)
                              const baseScale = (canvasSize.width / 600) / zoomFactor
                              const nodeRadius = Math.max(3, 5 * baseScale)
                              const startNodeRadius = Math.max(5, 7.5 * baseScale)
                              const strokeW = Math.max(1, 2 * baseScale)

                              return (
                                <svg
                                  className="absolute inset-0 w-full h-full pointer-events-none z-15"
                                  viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                                >
                                  {/* Filled polygon preview if 3 or more points */}
                                  {penPoints.length >= 3 && (
                                    <polygon
                                      points={penPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                                      fill="rgba(6, 182, 212, 0.35)"
                                      stroke="#06b6d4"
                                      strokeWidth={strokeW}
                                      strokeDasharray="6,4"
                                    />
                                  )}

                                  {/* Connected line between points */}
                                  {penPoints.length > 1 && (
                                    <polyline
                                      points={penPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                                      fill="none"
                                      stroke="#06b6d4"
                                      strokeWidth={strokeW * 1.3}
                                    />
                                  )}

                                  {/* Rubberband line to hover point */}
                                  {penHoverPoint && (
                                    <line
                                      x1={penPoints[penPoints.length - 1].x}
                                      y1={penPoints[penPoints.length - 1].y}
                                      x2={penHoverPoint.x}
                                      y2={penHoverPoint.y}
                                      stroke={isPenClosing ? '#22c55e' : '#06b6d4'}
                                      strokeWidth={strokeW * 1.2}
                                      strokeDasharray="4,4"
                                    />
                                  )}

                                  {/* Node circles */}
                                  {penPoints.map((p, idx) => {
                                    const isStart = idx === 0
                                    const r = isStart ? startNodeRadius : nodeRadius
                                    return (
                                      <g key={idx}>
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r={r}
                                          fill={isStart && isPenClosing ? '#22c55e' : '#ffffff'}
                                          stroke={isStart && isPenClosing ? '#15803d' : '#0891b2'}
                                          strokeWidth={strokeW}
                                        />
                                        {isStart && isPenClosing && (
                                          <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={r * 2}
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
                        </div>

                        {/* FLOATING TOOL BAR OVERLAY AT BOTTOM */}
                        <div className="absolute bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2 shadow-lg flex flex-col items-center gap-1.5 z-20">
                          {/* Pen Tool In-Progress Action Bar */}
                          {drawingTool === 'pen' && penPoints.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-xl">
                              <span className="text-[10px] font-black text-cyan-900">
                                {penPoints.length} Titik Sudut
                              </span>
                              <button
                                type="button"
                                onClick={handleCloseAndFillPen}
                                disabled={penPoints.length < 3}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                                  penPoints.length >= 3
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                                title="Tutup bentuk poligon dan isi warna area dalamnya (Enter)"
                              >
                                <Check className="w-3 h-3" />
                                <span>Isi Area Ini (Enter)</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleUndoPenPoint}
                                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Batalkan titik terakhir (Backspace)"
                              >
                                Urungkan Titik
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelPen}
                                className="px-2 py-0.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Batalkan pen tool (Esc)"
                              >
                                Batal
                              </button>
                            </div>
                          )}

                          {/* Main Tools Row */}
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            {/* Tool Selector */}
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setDrawingTool('brush')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  drawingTool === 'brush'
                                    ? 'bg-[#ff5e00] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Kuas Penanda Area (Bebas)"
                              >
                                <Paintbrush className="w-3.5 h-3.5" />
                                <span>Kuas</span>
                              </button>

                              {/* PEN TOOL */}
                              <button
                                type="button"
                                onClick={() => setDrawingTool('pen')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  drawingTool === 'pen'
                                    ? 'bg-[#ff5e00] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Pen Tool: Buat garis sudut-sudut rapi (kerah, saku, kancing) lalu isi warna area dalamnya"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                                <span>Pen Tool</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDrawingTool('rect')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  drawingTool === 'rect'
                                    ? 'bg-[#ff5e00] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Kotak Seleksi Cepat"
                              >
                                <Square className="w-3.5 h-3.5" />
                                <span>Kotak</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDrawingTool('eraser')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  drawingTool === 'eraser'
                                    ? 'bg-slate-800 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Penghapus Goresan"
                              >
                                <Eraser className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDrawingTool('hand')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  drawingTool === 'hand'
                                    ? 'bg-slate-800 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Hand / Geser Kanvas (atau tahan tombol Spasi)"
                              >
                                <Hand className="w-3.5 h-3.5" />
                                <span>Geser</span>
                              </button>
                            </div>

                            {/* Brush Size Slider */}
                            {(drawingTool === 'brush' || drawingTool === 'eraser') && (
                              <div className="flex items-center gap-2 px-2 border-l border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                  Ukuran:
                                </span>
                                <input
                                  type="range"
                                  min={2}
                                  max={65}
                                  value={markerBrushSize}
                                  onChange={(e) => setMarkerBrushSize(Number(e.target.value))}
                                  className="w-20 accent-[#ff5e00] cursor-pointer"
                                />
                                <span className="font-mono text-[10px] font-bold text-slate-700 w-5">
                                  {markerBrushSize}
                                </span>
                              </div>
                            )}

                            {/* Pen Tool Guide Info */}
                            {drawingTool === 'pen' && penPoints.length === 0 && (
                              <div className="hidden sm:flex items-center gap-1 px-2 border-l border-slate-200 text-[10px] text-slate-600 font-bold">
                                <span>Klik di foto untuk buat titik sudut</span>
                              </div>
                            )}

                            {/* Undo & Clear */}
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-1">
                              <button
                                type="button"
                                onClick={handleUndoMask}
                                disabled={maskHistory.length === 0 && penPoints.length === 0}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  maskHistory.length > 0 || penPoints.length > 0
                                    ? 'text-slate-700 hover:bg-slate-100'
                                    : 'text-slate-300 cursor-not-allowed'
                                }`}
                                title="Urungkan Coretan / Titik (Undo)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleClearMaskDraft}
                                disabled={!hasDrawn && penPoints.length === 0}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  hasDrawn || penPoints.length > 0
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-slate-300 cursor-not-allowed'
                                }`}
                                title="Bersihkan Coretan Ini"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* RIGHT CONTROL PANEL: SAVE AREA & ACTIVE PARTS */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                  {/* CARD 1: SAVE DRAWN AREA */}
                  <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#ff5e00] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">
                          1. Simpan Area yang Ditandai
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Beri nama bagian yang baru saja Anda tandai dengan kuas/kotak di sebelah kiri.
                        </p>
                      </div>
                    </div>

                    {/* Quick Preset Names */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        Pilih Cepat Nama Bagian:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'Saku Dada', color: '#1e293b' },
                          { name: 'Kerah Baju', color: '#0f172a' },
                          { name: 'Kancing Baju', color: '#94a3b8' },
                          { name: 'Garis Kancing', color: '#334155' },
                          { name: 'Lidah Pundak', color: '#ea580c' },
                          { name: 'Badan Utama', color: '#1e3a8a' },
                          { name: 'Manset Lengan', color: '#0284c7' },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setNewPartName(preset.name)
                              setNewPartColor(preset.color)
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-slate-200/80"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Part Name & Color Inputs */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-700 mb-1">
                          Nama Bagian:
                        </label>
                        <input
                          type="text"
                          value={newPartName}
                          onChange={(e) => setNewPartName(e.target.value)}
                          placeholder="Misal: Saku Dada Kanan"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-extrabold text-slate-700">
                          Warna Bawaan (Default):
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newPartColor}
                            onChange={(e) => setNewPartColor(e.target.value)}
                            className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                            title="Pilih Warna Bawaan"
                          />
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {newPartColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Part Button */}
                    <button
                      type="button"
                      onClick={handleSaveDrawnArea}
                      disabled={!hasDrawn}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                        hasDrawn
                          ? 'bg-[#ff5e00] hover:bg-[#e05300] text-white shadow-[#ff5e00]/25'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{hasDrawn ? '✓ Simpan Area Ini (Tambah Bagian)' : 'Goreskan Kuas Dulu di Mockup'}</span>
                    </button>
                  </div>

                  {/* CARD 2: ACTIVE PARTS ON THIS SIDE */}
                  <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">
                            2. Bagian Aktif di Sisi {selectedSide === 'front' ? 'Depan' : selectedSide === 'back' ? 'Belakang' : selectedSide === 'left' ? 'Kiri' : 'Kanan'}
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            Bagian yang siap diwarnai oleh pembeli
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddColorPart('Bagian Baru', selectedSide)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Tambah slot bagian secara manual"
                        >
                          <Plus className="w-3 h-3 text-[#ff5e00]" />
                          Slot Manual
                        </button>
                        <span className="text-[10px] bg-orange-100 text-[#ff5e00] font-black px-2 py-0.5 rounded-full">
                          {(editFormData.colorParts || []).filter((p) => p.side === selectedSide).length} Bagian
                        </span>
                      </div>
                    </div>

                    {/* Part List */}
                    {(() => {
                      const currentSideParts = (editFormData.colorParts || []).filter(
                        (p) => p.side === selectedSide
                      )
                      if (currentSideParts.length === 0) {
                        return (
                          <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                            <p className="text-xs font-bold text-slate-600">
                              Belum ada bagian yang ditandai di sisi ini.
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Gunakan kuas atau kotak penanda di foto seragam untuk menandai saku, kerah, kancing, dll.
                            </p>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {currentSideParts.map((part) => (
                            <div
                              key={part.id}
                              onMouseEnter={() => setHighlightedPartId(part.id)}
                              onMouseLeave={() => setHighlightedPartId(null)}
                              className={`p-2.5 rounded-2xl border transition-all ${
                                highlightedPartId === part.id
                                  ? 'bg-orange-50/70 border-[#ff5e00] shadow-xs'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={part.name}
                                  onChange={(e) =>
                                    handleUpdateColorPart(part.id, { name: e.target.value })
                                  }
                                  className="text-xs font-extrabold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#ff5e00] focus:outline-none px-1 py-0.5 flex-1"
                                />
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={part.defaultColor}
                                    onChange={(e) =>
                                      handleUpdateColorPart(part.id, {
                                        defaultColor: e.target.value,
                                      })
                                    }
                                    className="w-5 h-5 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                                    title="Ganti Warna Bagian"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => triggerPartMaskUpload(part.id)}
                                    className="p-1 text-slate-400 hover:text-[#ff5e00] transition-colors"
                                    title={part.maskImg ? 'Ganti file Mask PNG' : 'Upload file Mask PNG'}
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorPart(part.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Hapus bagian ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* CARD 3: REALISTIC TEXTURE NOTE */}
                  <div className="p-3.5 bg-gradient-to-br from-orange-50/80 to-amber-50/60 rounded-2xl border border-orange-200/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-orange-950 font-black text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-[#ff5e00]" />
                      <span>Otomatis Meresap ke Tekstur Kain (Multiply)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      Warna yang dipilih pembeli di studio canvas otomatis menyatu dengan serat, kerutan, dan bayangan kain asli seragam Anda tanpa menutupi detail aslinya!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: INFORMASI & HARGA */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Nama & Kategori */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Nama Model Seragam *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kemeja PDH Mahasiswa Bahan Drill"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                        Kategori Seragam
                      </label>
                      <select
                        value={editFormData.category || 'Kaos'}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, category: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
                      >
                        <option value="Kaos">Kaos (T-Shirt)</option>
                        <option value="PDH / PDL">PDH / PDL</option>
                        <option value="Kemeja">Kemeja Formal / Kantor</option>
                        <option value="Rompi">Rompi Tactical / Safety</option>
                        <option value="Polo">Polo Shirt</option>
                        <option value="Jaket">Jaket Bomber / Parka</option>
                        <option value="Hoodie">Hoodie / Streetwear</option>
                        <option value="Custom">Seragam Khusus Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-[#ff5e00]" />
                        Harga Dasar Polos (Rp) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="85000"
                        value={editFormData.basePrice || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            basePrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00]"
                      />
                    </div>
                  </div>

                  {/* Diskon Lusinan ZY */}
                  <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-3">
                    <span className="text-xs font-extrabold text-orange-950 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#ff5e00]" />
                      Diskon Grosir Bertingkat (Potongan per Pcs):
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block mb-0.5">≥12 pcs (Lusinan)</span>
                        <input
                          type="number"
                          step="1000"
                          value={editFormData.discount12 ?? 5000}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              discount12: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block mb-0.5">≥50 pcs (Partai)</span>
                        <input
                          type="number"
                          step="1000"
                          value={editFormData.discount50 ?? 10000}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              discount50: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block mb-0.5">≥100 pcs (Grosir)</span>
                        <input
                          type="number"
                          step="1000"
                          value={editFormData.discount100 ?? 15000}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              discount100: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Setting Clipping Mask Otomatis */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ff5e00] flex items-center justify-center shrink-0">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block">
                            Metode Clipping Mask Otomatis
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Kunci desain & warna kuas di siluet baju (tidak tembus keluar)
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.enableClippingMask ?? true}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, enableClippingMask: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff5e00]"></div>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                      💡 <b>Tips Pro:</b> Saat clipping mask aktif, gambar sablon/bordir dan goresan kuas pewarna akan otomatis dipotong rapi mengikuti bentuk luar baju (background transparan).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Keterangan / Deskripsi Bahan
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Menggunakan kain Drill grade A, jahitan bartack, adem dan rapi."
                      value={editFormData.description || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, description: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff5e00] resize-none"
                    />
                  </div>
                </div>

                {/* Ringkasan 4 Sudut Foto & Tombol Akses Editor Besar */}
                <div className="space-y-3">
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Foto Mockup Seragam (4 Sudut):</span>
                    <span className="text-[10px] text-[#ff5e00] font-normal">Klik untuk Buka di Editor Besar</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'front' as ViewSide, label: 'Tampak Depan (Wajib)', key: 'frontImg' as const },
                      { id: 'back' as ViewSide, label: 'Tampak Belakang', key: 'backImg' as const },
                      { id: 'left' as ViewSide, label: 'Tampak Sisi Kiri', key: 'leftImg' as const },
                      { id: 'right' as ViewSide, label: 'Tampak Sisi Kanan', key: 'rightImg' as const },
                    ].map((slot) => {
                      const img = editFormData[slot.key]
                      const partsCount = (editFormData.colorParts || []).filter((p) => p.side === slot.id).length
                      return (
                        <div
                          key={slot.id}
                          className="p-3 border border-slate-200 rounded-2xl bg-white shadow-2xs flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-slate-800 truncate">
                              {slot.label}
                            </span>
                            {img && (
                              <button
                                type="button"
                                onClick={() => removePhotoSide(slot.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Hapus foto ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div
                            onClick={() => {
                              setSelectedSide(slot.id)
                              setActiveEditorTab('marker')
                            }}
                            className="w-full h-32 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center cursor-pointer group relative"
                          >
                            {img ? (
                              <>
                                <img
                                  src={img}
                                  alt={slot.label}
                                  className="w-full h-full object-contain p-1"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold text-center px-2">
                                  Buka di Editor Penanda Area ➔
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-[#ff5e00] transition-colors p-2 text-center">
                                <Upload className="w-5 h-5" />
                                <span className="text-[10px] font-bold">+ Upload Foto</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-bold">{partsCount} Area Ditandai</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSide(slot.id)
                                setActiveEditorTab('marker')
                              }}
                              className="text-[#ff5e00] font-bold hover:underline cursor-pointer"
                            >
                              Tandai Area ➔
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSaveForm(false)}
              className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-slate-900 text-white font-extrabold rounded-xl text-xs transition-colors shadow-xs"
            >
              Simpan ke Katalog
            </button>
            <button
              type="button"
              onClick={() => handleSaveForm(true)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#ff5e00] hover:bg-[#e05300] text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-[#ff5e00]/25 flex items-center justify-center gap-1.5"
            >
              Simpan & Buka di Kanvas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
