import type { MockupTemplate } from '../types'
import { PRINT_ZONES } from '../data/garments'

const STORAGE_KEY = 'zy_custom_mockup_templates'
const ACTIVE_MOCKUP_KEY = 'zy_active_mockup_id'

// In-memory cache guarantees that active session data is never lost or blocked by storage quotas
let memoryMockupCache: MockupTemplate[] = []

// IndexedDB Storage Engine (Virtually unlimited capacity, handles large high-res base64 images effortlessly)
const IDB_NAME = 'zy_mockup_database'
const IDB_STORE = 'mockups_store'
const IDB_VERSION = 1

function openMockupDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'))
      return
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION)
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function idbSaveAllMockups(mockups: MockupTemplate[]): Promise<void> {
  try {
    const db = await openMockupDB()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    store.clear()
    for (const m of mockups) {
      store.put(m)
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('IndexedDB save failed', err)
  }
}

export async function idbGetAllMockups(): Promise<MockupTemplate[]> {
  try {
    const db = await openMockupDB()
    const tx = db.transaction(IDB_STORE, 'readonly')
    const store = tx.objectStore(IDB_STORE)
    const request = store.getAll()
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export function getMockupList(): MockupTemplate[] {
  if (memoryMockupCache.length > 0) {
    return memoryMockupCache
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryMockupCache = parsed
      return parsed
    }
  } catch (e) {
    console.warn('Failed to load mockups from localStorage', e)
  }
  return []
}

// ASYNC PERSISTENCE TO DISK (Vite dev server middleware writes to mockups-db.json)
async function saveToDiskAsync(mockups: MockupTemplate[]): Promise<void> {
  try {
    await fetch('/api/mockups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockups),
    })
  } catch (e) {
    console.warn('Could not sync mockups to disk API', e)
  }
}

export async function syncMockupsWithDisk(): Promise<MockupTemplate[]> {
  const localList = getMockupList()
  const idbList = await idbGetAllMockups()
  let diskList: MockupTemplate[] = []

  try {
    let res = await fetch('/api/mockups')
    if (!res.ok) {
      res = await fetch('./mockups-db.json')
    }
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        diskList = data
      }
    }
  } catch {
    try {
      const fallbackRes = await fetch('./mockups-db.json')
      if (fallbackRes.ok) {
        const data = await fallbackRes.json()
        if (Array.isArray(data)) {
          diskList = data
        }
      }
    } catch (e) {
      console.warn('Could not sync with mockups database file', e)
    }
  }

  // Merge helper: always preserve colorParts with actual items and all 4 photos
  const mergeTwo = (a: MockupTemplate, b: MockupTemplate): MockupTemplate => {
    const partsA = a.colorParts || []
    const partsB = b.colorParts || []
    // Pick the version that actually has colorParts
    const bestParts = partsB.length > 0 ? partsB : partsA
    const zonesA = a.printZones || []
    const zonesB = b.printZones || []
    const bestZones = zonesB.length > 0 ? zonesB : zonesA
    return {
      ...a,
      ...b,
      frontImg: b.frontImg || a.frontImg,
      backImg: b.backImg || a.backImg,
      leftImg: b.leftImg || a.leftImg,
      rightImg: b.rightImg || a.rightImg,
      colorParts: bestParts,
      printZones: bestZones,
    }
  }

  const map = new Map<string, MockupTemplate>()
  // 1. Ingest diskList
  diskList.forEach((m) => {
    if (m && m.id) map.set(m.id, m)
  })
  // 2. Ingest idbList
  idbList.forEach((m) => {
    if (m && m.id) {
      const existing = map.get(m.id)
      map.set(m.id, existing ? mergeTwo(existing, m) : m)
    }
  })
  // 3. Ingest localList
  localList.forEach((m) => {
    if (m && m.id) {
      const existing = map.get(m.id)
      map.set(m.id, existing ? mergeTwo(existing, m) : m)
    }
  })

  const merged = Array.from(map.values())
  if (merged.length > 0) {
    memoryMockupCache = merged
    idbSaveAllMockups(merged)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch {
      // Exceeds 5MB localStorage quota; safely stored in IndexedDB & Disk API
    }
    // Do NOT call saveToDiskAsync here during read/sync to prevent endless write loops & reload triggers
    return merged
  }

  return localList
}

export function saveMockup(mockup: MockupTemplate): MockupTemplate[] {
  const current = memoryMockupCache.length > 0 ? memoryMockupCache : getMockupList()
  const existingIdx = current.findIndex((m) => m.id === mockup.id)

  let updated: MockupTemplate[]
  if (existingIdx >= 0) {
    updated = current.map((m) => (m.id === mockup.id ? mockup : m))
  } else {
    updated = [mockup, ...current]
  }

  // 1. Always update in-memory cache immediately
  memoryMockupCache = updated

  // 2. Always set active mockup ID (20 bytes string, guaranteed to succeed)
  setActiveMockupId(mockup.id)

  // 3. Save to IndexedDB (virtually unlimited quota for large images)
  idbSaveAllMockups(updated)

  // 4. Safely attempt localStorage without letting QuotaExceededError stop execution
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('LocalStorage quota exceeded (safely stored in IndexedDB & disk)', e)
  }

  // 5. Persist directly to hard drive file mockups-db.json
  saveToDiskAsync(updated)

  return updated
}

export function deleteMockup(id: string): MockupTemplate[] {
  const current = memoryMockupCache.length > 0 ? memoryMockupCache : getMockupList()
  const updated = current.filter((m) => m.id !== id)
  memoryMockupCache = updated

  idbSaveAllMockups(updated)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('Failed to delete mockup in localStorage', e)
  }

  const active = getActiveMockupId()
  if (active === id) {
    if (updated.length > 0) {
      setActiveMockupId(updated[0].id)
    } else {
      try {
        localStorage.removeItem(ACTIVE_MOCKUP_KEY)
      } catch {}
    }
  }

  // Update hard drive file mockups-db.json
  saveToDiskAsync(updated)

  return updated
}

export function exportMockupDatabase(): void {
  const list = getMockupList()
  if (list.length === 0) {
    alert('Belum ada mockup yang tersimpan untuk di-backup.')
    return
  }

  const exportData = {
    app: 'ZY Uniform Customizer',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    totalMockups: list.length,
    mockups: list,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `zy_backup_mockup_seragam_${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importMockupDatabase(file: File): Promise<MockupTemplate[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = JSON.parse(text)
        let incoming: MockupTemplate[] = []
        if (Array.isArray(parsed)) {
          incoming = parsed
        } else if (parsed && Array.isArray(parsed.mockups)) {
          incoming = parsed.mockups
        } else {
          throw new Error('Format file backup tidak valid. Harus berisi array data mockup.')
        }

        const validIncoming = incoming.filter((m) => m && m.name && (m.frontImg || m.id))
        if (validIncoming.length === 0) {
          throw new Error('Tidak ditemukan data mockup seragam yang valid dalam file ini.')
        }

        const current = getMockupList()
        const map = new Map<string, MockupTemplate>()
        current.forEach((m) => map.set(m.id, m))
        validIncoming.forEach((m) => map.set(m.id, m))

        const merged = Array.from(map.values())
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        saveToDiskAsync(merged)

        if (merged.length > 0 && !getActiveMockupId()) {
          setActiveMockupId(merged[0].id)
        }

        resolve(merged)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file backup.'))
    reader.readAsText(file)
  })
}

export function getActiveMockupId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_MOCKUP_KEY)
  } catch {
    return null
  }
}

export function setActiveMockupId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_MOCKUP_KEY, id)
  } catch {}
}

export function createDemoSampleMockup(): MockupTemplate {
  const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550" width="100%" height="100%"><defs><linearGradient id="bgF" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="50%" stop-color="#283953"/><stop offset="100%" stop-color="#141e2d"/></linearGradient></defs><g><path d="M 175 75 L 115 130 L 45 190 L 85 240 L 135 195 L 145 490 L 355 490 L 365 195 L 415 240 L 455 190 L 385 130 L 325 75 Z" fill="url(#bgF)" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/><path d="M 175 75 Q 250 115 325 75 L 305 135 L 250 148 L 195 135 Z" fill="#0f172a" stroke="#334155" stroke-width="2"/><rect x="238" y="148" width="24" height="342" fill="#141e2d" stroke="#334155" stroke-width="1.5"/><circle cx="250" cy="180" r="4.5" fill="#94a3b8"/><circle cx="250" cy="240" r="4.5" fill="#94a3b8"/><circle cx="250" cy="300" r="4.5" fill="#94a3b8"/><circle cx="250" cy="360" r="4.5" fill="#94a3b8"/><circle cx="250" cy="420" r="4.5" fill="#94a3b8"/><rect x="160" y="225" width="60" height="70" rx="4" fill="#182232" stroke="#334155" stroke-width="1.5"/><path d="M 158 225 L 190 238 L 222 225 L 222 215 L 158 215 Z" fill="#0f172a" stroke="#334155" stroke-width="1.5"/><circle cx="190" cy="230" r="3" fill="#94a3b8"/><rect x="280" y="225" width="60" height="70" rx="4" fill="#182232" stroke="#334155" stroke-width="1.5"/><path d="M 278 225 L 310 238 L 342 225 L 342 215 L 278 215 Z" fill="#0f172a" stroke="#334155" stroke-width="1.5"/><circle cx="310" cy="230" r="3" fill="#94a3b8"/><path d="M 175 75 L 115 130 L 125 142 L 180 87 Z" fill="#0f172a" stroke="#ff5e00" stroke-width="1.5"/><path d="M 325 75 L 385 130 L 375 142 L 320 87 Z" fill="#0f172a" stroke="#ff5e00" stroke-width="1.5"/></g></svg>`

  const backSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550" width="100%" height="100%"><defs><linearGradient id="bgB" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="50%" stop-color="#283953"/><stop offset="100%" stop-color="#141e2d"/></linearGradient></defs><g><path d="M 175 75 L 115 130 L 45 190 L 85 240 L 135 195 L 145 490 L 355 490 L 365 195 L 415 240 L 455 190 L 385 130 L 325 75 Z" fill="url(#bgB)" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/><path d="M 175 75 Q 250 88 325 75 L 315 105 Q 250 115 185 105 Z" fill="#0f172a" stroke="#334155" stroke-width="2"/><path d="M 140 185 L 360 185" stroke="#334155" stroke-width="2" stroke-dasharray="4 3"/><line x1="250" y1="189" x2="250" y2="480" stroke="#141e2d" stroke-width="2"/></g></svg>`

  const leftSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550" width="100%" height="100%"><defs><linearGradient id="bgL" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="50%" stop-color="#283953"/><stop offset="100%" stop-color="#141e2d"/></linearGradient></defs><g><path d="M 210 90 Q 250 110 290 90 L 320 220 L 310 490 L 190 490 L 180 220 Z" fill="#141e2d" stroke="#0f172a" stroke-width="2"/><path d="M 190 120 Q 250 100 310 120 L 325 320 L 175 320 Z" fill="url(#bgL)" stroke="#0f172a" stroke-width="3"/><rect x="175" y="315" width="150" height="24" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/><path d="M 230 105 L 270 105 L 265 145 L 235 145 Z" fill="#0f172a" stroke="#ff5e00" stroke-width="1.5"/><circle cx="250" cy="140" r="3" fill="#94a3b8"/><rect x="235" y="190" width="30" height="65" rx="3" fill="#182232" stroke="#334155" stroke-width="1.5"/><line x1="250" y1="190" x2="250" y2="255" stroke="#334155" stroke-width="1"/></g></svg>`

  const rightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550" width="100%" height="100%"><defs><linearGradient id="bgR" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="50%" stop-color="#283953"/><stop offset="100%" stop-color="#141e2d"/></linearGradient></defs><g><path d="M 210 90 Q 250 110 290 90 L 320 220 L 310 490 L 190 490 L 180 220 Z" fill="#141e2d" stroke="#0f172a" stroke-width="2"/><path d="M 190 120 Q 250 100 310 120 L 325 320 L 175 320 Z" fill="url(#bgR)" stroke="#0f172a" stroke-width="3"/><rect x="175" y="315" width="150" height="24" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/><path d="M 230 105 L 270 105 L 265 145 L 235 145 Z" fill="#0f172a" stroke="#ff5e00" stroke-width="1.5"/><circle cx="250" cy="140" r="3" fill="#94a3b8"/><rect x="230" y="190" width="40" height="50" rx="3" fill="#2d3748" stroke="#ff5e00" stroke-width="1.2" stroke-dasharray="3 2"/></g></svg>`

  // Part masks for default demo PDH
  const collarMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550"><path d="M 175 75 Q 250 115 325 75 L 305 135 L 250 148 L 195 135 Z" fill="#000"/></svg>`
  const pocketMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550"><rect x="160" y="225" width="60" height="70" rx="4" fill="#000"/><path d="M 158 225 L 190 238 L 222 225 L 222 215 L 158 215 Z" fill="#000"/><rect x="280" y="225" width="60" height="70" rx="4" fill="#000"/><path d="M 278 225 L 310 238 L 342 225 L 342 215 L 278 215 Z" fill="#000"/></svg>`
  const placketMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550"><rect x="238" y="148" width="24" height="342" fill="#000"/></svg>`
  const buttonsMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550"><circle cx="250" cy="180" r="5" fill="#000"/><circle cx="250" cy="240" r="5" fill="#000"/><circle cx="250" cy="300" r="5" fill="#000"/><circle cx="250" cy="360" r="5" fill="#000"/><circle cx="250" cy="420" r="5" fill="#000"/><circle cx="190" cy="230" r="3.5" fill="#000"/><circle cx="310" cy="230" r="3.5" fill="#000"/></svg>`
  const shoulderMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550"><path d="M 175 75 L 115 130 L 125 142 L 180 87 Z" fill="#000"/><path d="M 325 75 L 385 130 L 375 142 L 320 87 Z" fill="#000"/></svg>`

  return {
    id: 'demo_pdh_sample',
    name: 'Kemeja PDH Komando (Contoh 4 Sisi)',
    category: 'PDH',
    basePrice: 145000,
    description: 'Contoh seragam PDH resmi ZY Clothes dengan 4 sudut pandang lengkap (Depan, Belakang, Sisi Kiri ber-saku pena, Sisi Kanan ber-velcro patch). Dilengkapi area warna Kerah, Saku, Kancing, Garis Kancing, dan Pangkat Pundak.',
    enableClippingMask: true,
    discount12: 5000,
    discount50: 10000,
    discount100: 15000,
    frontImg: `data:image/svg+xml;utf8,${encodeURIComponent(frontSvg)}`,
    backImg: `data:image/svg+xml;utf8,${encodeURIComponent(backSvg)}`,
    leftImg: `data:image/svg+xml;utf8,${encodeURIComponent(leftSvg)}`,
    rightImg: `data:image/svg+xml;utf8,${encodeURIComponent(rightSvg)}`,
    defaultBaseColor: '#1e3a8a',
    colorParts: [
      {
        id: 'part_collar',
        name: 'Kerah Baju',
        side: 'front',
        defaultColor: '#0f172a',
        icon: 'collar',
        maskImg: `data:image/svg+xml;utf8,${encodeURIComponent(collarMaskSvg)}`,
      },
      {
        id: 'part_pockets',
        name: 'Saku Dada (Kanan & Kiri)',
        side: 'front',
        defaultColor: '#182232',
        icon: 'pocket',
        maskImg: `data:image/svg+xml;utf8,${encodeURIComponent(pocketMaskSvg)}`,
      },
      {
        id: 'part_placket',
        name: 'Garis Kancing (Placket)',
        side: 'front',
        defaultColor: '#141e2d',
        icon: 'placket',
        maskImg: `data:image/svg+xml;utf8,${encodeURIComponent(placketMaskSvg)}`,
      },
      {
        id: 'part_buttons',
        name: 'Kancing Baju',
        side: 'front',
        defaultColor: '#94a3b8',
        icon: 'buttons',
        maskImg: `data:image/svg+xml;utf8,${encodeURIComponent(buttonsMaskSvg)}`,
      },
      {
        id: 'part_shoulder',
        name: 'Pangkat / Lidah Pundak',
        side: 'front',
        defaultColor: '#ff5e00',
        icon: 'shoulder_strap',
        maskImg: `data:image/svg+xml;utf8,${encodeURIComponent(shoulderMaskSvg)}`,
      },
    ],
    printZones: [...PRINT_ZONES],
    createdAt: Date.now(),
  }
}
