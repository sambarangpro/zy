import React from 'react'
import { MockupSVG } from './MockupSVG'
import { Printer, X, ShieldCheck } from 'lucide-react'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  summary: any
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  if (!isOpen || !summary) return null

  const handlePrint = () => {
    window.print()
  }

  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Actions Toolbar */}
        <div className="p-4 bg-black text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#ff5e00] px-2.5 py-1 rounded-md font-extrabold text-white">
              SURAT PERINTAH KERJA (SPK)
            </span>
            <span className="text-xs text-slate-400">ZY Clothes Studio</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#ff5e00] hover:bg-[#e05300] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 sm:p-10 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-black text-[#ff5e00] rounded-xl flex items-center justify-center font-black text-sm tracking-tighter">
                  ZY
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 font-display">
                  ZY CLOTHES STUDIO
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Pabrik Konveksi, Bordir Komputer & Sablon Digital Berkualitas
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kawasan Industri Kreatif Bandung • WhatsApp: +62 812-3456-7890
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-wider text-[#ff5e00] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                INVOICE & LEMBAR SPK
              </span>
              <p className="font-mono text-sm font-extrabold text-slate-900 mt-2">
                {summary.id}
              </p>
              <p className="text-xs text-slate-500">{summary.date}</p>
            </div>
          </div>

          {/* Customer & Order Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-5 mb-6 text-xs border border-slate-200/80">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                DITUJUKAN KEPADA:
              </span>
              <p className="font-extrabold text-slate-900 text-sm">{summary.customerName}</p>
              <p className="font-semibold text-slate-700">{summary.customerCompany}</p>
              <p className="text-slate-600 mt-0.5">WA: {summary.customerPhone}</p>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Alamat: {summary.customerAddress}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                JADWAL & SPESIFIKASI:
              </span>
              <p className="text-slate-700">
                Target Deadline: <b className="text-slate-900 font-bold">{summary.targetDate}</b>
              </p>
              <p className="text-slate-700 mt-0.5">
                Model Seragam: <b className="text-slate-900">{summary.garmentName}</b>
              </p>
              <p className="text-slate-700 mt-0.5">
                Bahan Kain: <b className="text-slate-900">{summary.fabricName}</b>
              </p>
              <p className="text-slate-700 mt-0.5">
                Teknik Logo: <b className="text-slate-900">{summary.technique}</b>
              </p>
            </div>
          </div>

          {/* Visual Mockup & Color Specifications */}
          <div className="grid grid-cols-3 gap-4 mb-6 border border-slate-200 rounded-2xl p-4 items-center">
            <div className="col-span-1 aspect-square bg-slate-100 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
              {summary.mockupImg ? (
                <img
                  src={summary.mockupImg}
                  alt={summary.garmentName}
                  className="max-h-full max-w-full object-contain drop-shadow"
                />
              ) : (
                <div className="w-36 h-36 relative">
                  <MockupSVG type={summary.garmentType} side="front" colors={summary.colors} />
                </div>
              )}
            </div>

            <div className="col-span-2 text-xs space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">
                Spesifikasi Warna Kain Terpilih:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500">Badan Utama:</span>{' '}
                  <span className="font-mono font-bold">{summary.colors.body}</span>
                </div>
                <div>
                  <span className="text-slate-500">Kerah / Leher:</span>{' '}
                  <span className="font-mono font-bold">{summary.colors.collar}</span>
                </div>
                <div>
                  <span className="text-slate-500">Lengan:</span>{' '}
                  <span className="font-mono font-bold">{summary.colors.sleeves}</span>
                </div>
                <div>
                  <span className="text-slate-500">Saku / List:</span>{' '}
                  <span className="font-mono font-bold">{summary.colors.pocket}</span>
                </div>
              </div>
              <div className="pt-2 text-slate-600 text-[11px]">
                <b>Catatan Khusus:</b> {summary.specialNotes}
              </div>
            </div>
          </div>

          {/* Size Breakdown Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
            <table className="w-full text-xs text-center">
              <thead className="bg-black text-white font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5">S</th>
                  <th className="p-2.5">M</th>
                  <th className="p-2.5">L</th>
                  <th className="p-2.5">XL</th>
                  <th className="p-2.5">XXL</th>
                  <th className="p-2.5">3XL</th>
                  <th className="p-2.5">Custom</th>
                  <th className="p-2.5 bg-[#ff5e00]">TOTAL</th>
                </tr>
              </thead>
              <tbody className="bg-slate-50 font-bold text-slate-800 text-sm">
                <tr>
                  <td className="p-3 border-r border-slate-200">{summary.sizes.S}</td>
                  <td className="p-3 border-r border-slate-200">{summary.sizes.M}</td>
                  <td className="p-3 border-r border-slate-200">{summary.sizes.L}</td>
                  <td className="p-3 border-r border-slate-200">{summary.sizes.XL}</td>
                  <td className="p-3 border-r border-slate-200">{summary.sizes.XXL}</td>
                  <td className="p-3 border-r border-slate-200">{summary.sizes['3XL']}</td>
                  <td className="p-3 border-r border-slate-200">{summary.sizes.Custom}</td>
                  <td className="p-3 bg-orange-50 text-[#ff5e00] font-black text-base">
                    {summary.totalQuantity} pcs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Table */}
          <div className="flex justify-end mb-8">
            <div className="w-72 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({summary.totalQuantity} pcs):</span>
                <span className="font-semibold">{formatRupiah(summary.subtotalBeforeDiscount)}</span>
              </div>
              {summary.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Diskon Grosir:</span>
                  <span>-{formatRupiah(summary.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-2 text-slate-950">
                <span>TOTAL AKHIR:</span>
                <span className="text-[#ff5e00]">{formatRupiah(summary.finalTotal)}</span>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                DP Produksi 50%: {formatRupiah(Math.round(summary.finalTotal * 0.5))}
              </div>
            </div>
          </div>

          {/* Signatures & Terms */}
          <div className="grid grid-cols-2 gap-10 pt-6 border-t border-slate-200 text-xs text-center">
            <div>
              <p className="text-slate-500 mb-16">Pihak Pemesan / Pelanggan,</p>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-44">
                ( {summary.customerName} )
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Pihak Konveksi & Produksi,</p>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-44">
                ( ZY Clothes Production )
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center print:hidden">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Garansi 100% perbaikan jika terdapat cacat jahitan atau sablon
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
