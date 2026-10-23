import React, { useState } from 'react'
import { SIZE_CHART } from '../data/garments'
import { Ruler, X, Info } from 'lucide-react'

interface SizeChartModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pdh' | 'kaos' | 'rompi'>('pdh')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Ruler className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Panduan Ukuran Standar (Size Chart)</h3>
              <p className="text-xs text-slate-400">Toleransi jahitan konveksi ± 1 - 1.5 cm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          {[
            { id: 'pdh', label: 'Kemeja PDH / PDL / Formal' },
            { id: 'kaos', label: 'Kaos Combed / Polo' },
            { id: 'rompi', label: 'Rompi Lapangan / Safety' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 mb-6">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Ukuran</th>
                  <th className="p-3">Lebar Dada (cm)</th>
                  <th className="p-3">Panjang Baju (cm)</th>
                  {activeTab !== 'rompi' && <th className="p-3">Panjang Lengan (cm)</th>}
                  {activeTab === 'pdh' && <th className="p-3">Lebar Bahu (cm)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {SIZE_CHART[activeTab].map((row) => (
                  <tr key={row.size} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-extrabold text-slate-900 bg-slate-50/60">{row.size}</td>
                    <td className="p-3 text-slate-700 font-medium">{row.chest} cm</td>
                    <td className="p-3 text-slate-700 font-medium">{row.length} cm</td>
                    {activeTab !== 'rompi' && (
                      <td className="p-3 text-slate-700 font-medium">{(row as any).sleeve} cm</td>
                    )}
                    {activeTab === 'pdh' && (
                      <td className="p-3 text-slate-700 font-medium">{(row as any).shoulder} cm</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tips Cara Mengukur */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Tips Menentukan Ukuran Baju:</p>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>Ukur baju kemeja / kaos yang paling nyaman Anda pakai saat ini dalam posisi terbentang rata di lantai.</li>
                <li>Ukur <b>Lebar Dada</b> dari jahitan bawah ketiak kiri ke ketiak kanan.</li>
                <li>Ukur <b>Panjang Baju</b> dari ujung kerah bahu tertinggi hingga keliman bawah.</li>
                <li>Jika ukuran tubuh berada di antara dua size, disarankan memilih 1 tingkat ukuran lebih besar (upsize).</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  )
}
