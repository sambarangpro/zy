import React from 'react'

export type GarmentIconId =
  | 'all_garment'     // Seluruh Seragam
  | 'collar'          // Kerah Kemeja / Polo
  | 'collar_round'    // Lingkaran Kerah / Rib Leher
  | 'placket'         // Garis Kancing
  | 'buttons'         // Kancing
  | 'shoulder_strap'  // Pita Bahu / Pangkat
  | 'sleeves'         // Lengan
  | 'cuffs'           // Manset Lengan
  | 'pocket_flap'     // Tutup Saku
  | 'pocket'          // Saku
  | 'body_front'      // Badan Depan
  | 'body_back'       // Badan Belakang
  | 'zipper'          // Resleting
  | 'piping'          // Lis / Variasi
  | 'hood'            // Tudung / Hoodie
  | 'hem'             // Belahan / Rib Bawah

export interface GarmentIconMeta {
  id: GarmentIconId
  label: string
  description: string
}

export const GARMENT_PART_ICONS: GarmentIconMeta[] = [
  { id: 'all_garment', label: 'Seluruh Seragam', description: 'Warna badan dasar seluruh seragam' },
  { id: 'collar', label: 'Kerah', description: 'Kerah kemeja, polo, atau kerah lipat' },
  { id: 'collar_round', label: 'Lingkaran Kerah', description: 'Rib leher kaos O-Neck, V-Neck, atau lingkar kerah' },
  { id: 'placket', label: 'Garis Kancing', description: 'Placket garis kancing depan baju' },
  { id: 'buttons', label: 'Kancing', description: 'Kancing baju / kancing seragam' },
  { id: 'shoulder_strap', label: 'Pita Bahu', description: 'Lidah pundak, pangkat bahu, atau epaulette' },
  { id: 'sleeves', label: 'Lengan', description: 'Bagian lengan pendek atau panjang' },
  { id: 'cuffs', label: 'Manset Lengan', description: 'Manset ujung lengan atau rib pergelangan' },
  { id: 'pocket_flap', label: 'Tutup Saku', description: 'Penutup saku atau flap lid kantong' },
  { id: 'pocket', label: 'Saku', description: 'Kantong saku dada atau saku samping' },
  { id: 'body_front', label: 'Badan Depan', description: 'Pola badan bagian depan' },
  { id: 'body_back', label: 'Badan Belakang', description: 'Pola badan bagian belakang' },
  { id: 'zipper', label: 'Resleting', description: 'Ritsleting depan / zipper jaket' },
  { id: 'piping', label: 'Lis / Variasi', description: 'Garis lis variasi, strip, atau piping kontras' },
  { id: 'hood', label: 'Tudung / Hoodie', description: 'Tudung kepala sweater / hoodie / jaket' },
  { id: 'hem', label: 'Belahan Bawah', description: 'Rib pinggang atau belahan samping bawah' },
]

export function getGarmentIconForPart(partName?: string, explicitIconId?: string): GarmentIconId {
  if (explicitIconId && GARMENT_PART_ICONS.some((item) => item.id === explicitIconId)) {
    return explicitIconId as GarmentIconId
  }
  const name = (partName || '').trim().toLowerCase()
  if (!name) return 'collar'

  if (name.includes('seluruh') || name.includes('keseluruhan')) return 'all_garment'
  if (name.includes('lingkar') || name.includes('rib leher') || name.includes('kerah bulat') || name.includes('o-neck')) return 'collar_round'
  if (name.includes('tutup saku') || name.includes('flap')) return 'pocket_flap'
  if (name.includes('saku') || name.includes('kantong')) return 'pocket'
  if (name.includes('garis kancing') || name.includes('placket')) return 'placket'
  if (name.includes('kancing')) return 'buttons'
  if (name.includes('pita bahu') || name.includes('pangkat') || name.includes('lidah pundak') || name.includes('bahu') || name.includes('pundak')) return 'shoulder_strap'
  if (name.includes('manset') || name.includes('ujung lengan') || name.includes('rib lengan')) return 'cuffs'
  if (name.includes('lengan')) return 'sleeves'
  if (name.includes('kerah')) return 'collar'
  if (name.includes('resleting') || name.includes('zipper') || name.includes('ritsleting')) return 'zipper'
  if (name.includes('lis') || name.includes('garis') || name.includes('variasi') || name.includes('strip')) return 'piping'
  if (name.includes('tudung') || name.includes('hood')) return 'hood'
  if (name.includes('belakang')) return 'body_back'
  if (name.includes('depan')) return 'body_front'
  if (name.includes('badan')) return 'body_front'
  if (name.includes('bawah') || name.includes('hem') || name.includes('pinggang')) return 'hem'

  return 'collar'
}

interface GarmentPartIconProps {
  iconId?: string
  partName?: string
  className?: string
  title?: string
}

export const GarmentPartIcon: React.FC<GarmentPartIconProps> = ({
  iconId,
  partName,
  className = 'w-4 h-4',
  title,
}) => {
  const resolvedId = getGarmentIconForPart(partName, iconId)
  const meta = GARMENT_PART_ICONS.find((item) => item.id === resolvedId)
  const displayTitle = title || meta?.label || 'Bagian Pakaian'

  switch (resolvedId) {
    case 'all_garment':
      // Silhouette kemeja/seragam lengkap
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a2 2 0 001.23 1.54L6 11.5V20a2 2 0 002 2h8a2 2 0 002-2v-8.5l1.91-.8a2 2 0 001.23-1.54l.58-3.47a2 2 0 00-1.34-2.23z" />
        </svg>
      )

    case 'collar':
      // Kerah kemeja/polo terlipat rapi
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M3 6c2-2 6-3 9-3s7 1 9 3" />
          <path d="M3 6l6 8 3-4 3 4 6-8" />
          <path d="M9 14l3 7 3-7" />
        </svg>
      )

    case 'collar_round':
      // Lingkaran kerah bulat / rib leher
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <ellipse cx="12" cy="11" rx="8" ry="6" />
          <path d="M4 11c0 4 3.5 7 8 7s8-3 8-7" />
          <path d="M12 5v2M12 17v2" strokeDasharray="1 1" />
        </svg>
      )

    case 'placket':
      // Garis kancing depan (placket)
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <rect x="8.5" y="2.5" width="7" height="19" rx="1.5" />
          <circle cx="12" cy="7" r="1.2" fill="currentColor" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
          <circle cx="12" cy="17" r="1.2" fill="currentColor" />
        </svg>
      )

    case 'buttons':
      // Kancing baju 4 lubang
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
          <circle cx="14" cy="10" r="1" fill="currentColor" />
          <circle cx="10" cy="14" r="1" fill="currentColor" />
          <circle cx="14" cy="14" r="1" fill="currentColor" />
        </svg>
      )

    case 'shoulder_strap':
      // Pita bahu / lidah pundak / pangkat (epaulette)
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M3 8.5h13l4 3.5-4 3.5H3z" />
          <circle cx="15.5" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )

    case 'sleeves':
      // Pola potongan lengan baju
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M5 4l10-2 4 14-6 4-8-16z" />
          <path d="M13 16l6-2" />
        </svg>
      )

    case 'cuffs':
      // Manset pergelangan tangan baju
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <line x1="7.5" y1="7" x2="7.5" y2="17" />
          <circle cx="16" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )

    case 'pocket_flap':
      // Tutup saku / penutup kantong
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M3 7h18l-2.5 6.5-6.5 3-6.5-3z" />
          <circle cx="12" cy="11.5" r="1.2" fill="currentColor" />
          <path d="M5 16.5h14v3.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3.5z" strokeDasharray="2 2" />
        </svg>
      )

    case 'pocket':
      // Saku dada seragam
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M5 4h14v9a6 6 0 01-6 6h-2a6 6 0 01-6-6V4z" />
          <line x1="5" y1="8" x2="19" y2="8" />
        </svg>
      )

    case 'body_front':
      // Badan depan seragam
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M7 3h10l2 6v12H5V9l2-6z" />
          <path d="M9 3a3 3 0 006 0" />
          <line x1="12" y1="3" x2="12" y2="12" />
        </svg>
      )

    case 'body_back':
      // Badan belakang seragam dengan yoke pundak
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M7 3h10l2 6v12H5V9l2-6z" />
          <line x1="5" y1="8" x2="19" y2="8" />
          <line x1="12" y1="8" x2="12" y2="21" />
        </svg>
      )

    case 'zipper':
      // Resleting jaket / baju
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <line x1="12" y1="2" x2="12" y2="22" />
          <rect x="10" y="8" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.2" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          <path d="M8.5 5h2M13.5 5h2M8.5 7h2M13.5 7h2M8.5 17h2M13.5 17h2M8.5 19h2M13.5 19h2" />
        </svg>
      )

    case 'piping':
      // Lis / variasi garis seragam
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M4 19L19 4" />
          <path d="M8 21L21 8" />
          <line x1="2" y1="17" x2="7" y2="22" />
          <line x1="17" y1="2" x2="22" y2="7" />
        </svg>
      )

    case 'hood':
      // Tudung / hoodie
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M6 21V11a6 6 0 0112 0v10" />
          <path d="M9 21c0-4 1-6 3-6s3 2 3 6" />
          <line x1="8" y1="21" x2="16" y2="21" />
        </svg>
      )

    case 'hem':
      // Belahan samping atau rib bawah
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <path d="M5 4v10M19 4v10" />
          <line x1="7.5" y1="14" x2="7.5" y2="20" />
          <line x1="12" y1="14" x2="12" y2="20" />
          <line x1="16.5" y1="14" x2="16.5" y2="20" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <title>{displayTitle}</title>
          <path d="M3 6c2-2 6-3 9-3s7 1 9 3" />
          <path d="M3 6l6 8 3-4 3 4 6-8" />
        </svg>
      )
  }
}
