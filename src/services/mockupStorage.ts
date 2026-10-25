import type { MockupTemplate } from '../types'

const STORAGE_KEY = 'zy_custom_mockup_templates'
const ACTIVE_MOCKUP_KEY = 'zy_active_mockup_id'

export function getMockupList(): MockupTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load mockups from localStorage', e)
    return []
  }
}

export function saveMockup(mockup: MockupTemplate): MockupTemplate[] {
  const current = getMockupList()
  const existingIdx = current.findIndex((m) => m.id === mockup.id)

  let updated: MockupTemplate[]
  if (existingIdx >= 0) {
    updated = current.map((m) => (m.id === mockup.id ? mockup : m))
  } else {
    updated = [mockup, ...current]
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setActiveMockupId(mockup.id)
  } catch (e) {
    console.error('Failed to save mockup to localStorage', e)
  }

  return updated
}

export function deleteMockup(id: string): MockupTemplate[] {
  const current = getMockupList()
  const updated = current.filter((m) => m.id !== id)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    const active = getActiveMockupId()
    if (active === id) {
      if (updated.length > 0) {
        setActiveMockupId(updated[0].id)
      } else {
        localStorage.removeItem(ACTIVE_MOCKUP_KEY)
      }
    }
  } catch (e) {
    console.error('Failed to delete mockup', e)
  }

  return updated
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

  return {
    id: 'demo_pdh_sample',
    name: 'Kemeja PDH Komando (Contoh 4 Sisi)',
    category: 'PDH',
    basePrice: 145000,
    description: 'Contoh seragam PDH resmi ZY Clothes dengan 4 sudut pandang lengkap (Depan, Belakang, Sisi Kiri ber-saku pena, Sisi Kanan ber-velcro patch).',
    discount12: 5000,
    discount50: 10000,
    discount100: 15000,
    frontImg: `data:image/svg+xml;utf8,${encodeURIComponent(frontSvg)}`,
    backImg: `data:image/svg+xml;utf8,${encodeURIComponent(backSvg)}`,
    leftImg: `data:image/svg+xml;utf8,${encodeURIComponent(leftSvg)}`,
    rightImg: `data:image/svg+xml;utf8,${encodeURIComponent(rightSvg)}`,
    createdAt: Date.now(),
  }
}
