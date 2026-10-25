import React, { useState, useRef } from 'react'
import type { MockupTemplate, ViewSide } from '../types'
import {
  saveMockup,
  deleteMockup,
  setActiveMockupId,
  createDemoSampleMockup,
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
  FolderPlus,
  Tag,
  Percent,
  Sparkles,
  Scissors,
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

  const handleOpenCreateNew = () => {
    setEditFormData({
      id: 'mockup_' + Date.now(),
      name: '',
      category: 'Kaos',
      basePrice: 85000,
      description: '',
      enableClippingMask: true,
      discount12: 5000,
      discount50: 10000,
      discount100: 15000,
      createdAt: Date.now(),
    })
    setIsEditing(true)
  }

  const handleOpenEdit = (item: MockupTemplate) => {
    setEditFormData({ ...item })
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
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUploaded}
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#ff5e00]" />
                {editFormData.id && mockups.some((m) => m.id === editFormData.id)
                  ? 'Edit Model Seragam'
                  : 'Buat Model Seragam Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi rincian nama seragam, harga, dan foto realistis 4 sudut pandang.
              </p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-slate-400 hover:text-black px-3 py-1.5 rounded-xl bg-slate-100"
            >
              Batal
            </button>
          </div>

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

            {/* 4 Kotak Upload Foto Mockup Realistis */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Upload Foto Mockup Realistis Anda (4 Sisi):</span>
                <span className="text-[10px] text-[#ff5e00] font-normal">PNG / JPG Transparan disarankan</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'front' as ViewSide, label: 'Tampak Depan (Wajib)', key: 'frontImg' as const },
                  { id: 'back' as ViewSide, label: 'Tampak Belakang', key: 'backImg' as const },
                  { id: 'left' as ViewSide, label: 'Tampak Sisi Kiri', key: 'leftImg' as const },
                  { id: 'right' as ViewSide, label: 'Tampak Sisi Kanan', key: 'rightImg' as const },
                ].map((slot) => {
                  const img = editFormData[slot.key]
                  return (
                    <div
                      key={slot.id}
                      className="p-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/70 flex flex-col items-center justify-between gap-2 text-center hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between w-full px-1">
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

                      {/* Photo preview container */}
                      <div
                        onClick={() => triggerUploadForSide(slot.id)}
                        className="w-full aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center cursor-pointer group relative shadow-2xs"
                      >
                        {img ? (
                          <>
                            <img
                              src={img}
                              alt={slot.label}
                              className="w-full h-full object-contain p-1"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              Klik untuk Ganti
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-[#ff5e00] transition-colors p-2">
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px] font-bold">+ Upload Foto</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

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
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h3 className="font-extrabold text-slate-900 text-lg">
              Koleksi Model Mockup Seragam
            </h3>
            <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-full font-mono">
              {mockups.length} Model Tersedia
            </span>
          </div>

          {mockups.length > 0 && !isEditing && (
            <button
              onClick={handleOpenCreateNew}
              className="text-xs font-extrabold text-[#ff5e00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Model Lain
            </button>
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
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff5e00] bg-orange-50 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
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
