import React from 'react'
import type { GarmentColorParts, GarmentType, StudioLighting, ViewSide } from '../types'

interface MockupSVGProps {
  type: GarmentType
  side: ViewSide
  colors: GarmentColorParts
  lighting?: StudioLighting
  customImage?: string // User's own realistic mockup photo
  className?: string
}

export const MockupSVG: React.FC<MockupSVGProps> = ({
  type,
  side,
  colors,
  lighting = { brightness: 0, contrast: 0, saturation: 0, shadowDepth: 35 },
  customImage,
  className = 'w-full h-full drop-shadow-xl',
}) => {
  const brightnessVal = 1 + lighting.brightness / 100
  const contrastVal = 1 + lighting.contrast / 100
  const saturationVal = 1 + lighting.saturation / 100
  const shadowOpacity = Math.max(0, Math.min(1, lighting.shadowDepth / 100))

  const filterStyle = {
    filter: `brightness(${brightnessVal}) contrast(${contrastVal}) saturate(${saturationVal})`,
  }

  // Common realistic shading filter & gradients
  const renderDefs = () => (
    <defs>
      <linearGradient id="bodyShadingFront" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#000000" stopOpacity={0.22 * shadowOpacity * 2} />
        <stop offset="25%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="50%" stopColor="#000000" stopOpacity="0.02" />
        <stop offset="75%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity={0.22 * shadowOpacity * 2} />
      </linearGradient>

      <linearGradient id="sleeveLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#000000" stopOpacity={0.3 * shadowOpacity * 1.5} />
      </linearGradient>

      <linearGradient id="sleeveRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#000000" stopOpacity={0.3 * shadowOpacity * 1.5} />
      </linearGradient>

      <linearGradient id="sideViewGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#000000" stopOpacity={0.3 * shadowOpacity * 1.5} />
        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#000000" stopOpacity={0.25 * shadowOpacity * 1.5} />
      </linearGradient>

      <linearGradient id="collarInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
      </linearGradient>

      <filter id="pocketShadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
      </filter>
    </defs>
  )

  // JIKA PENGGUNA MENGUPLOAD GAMBAR MOCKUP SENDIRI (Realistis dari foto)
  if (customImage) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src={customImage}
          alt={`Mockup ${side}`}
          style={filterStyle}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
        {/* Subtle fabric wrinkle multiply overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-multiply transition-opacity"
          style={{
            backgroundColor: colors.body,
            opacity: 0.28,
          }}
        />
      </div>
    )
  }

  // 1. KAOS
  const renderKaos = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          <path d="M 240 100 Q 300 135 360 100 Q 300 75 240 100 Z" fill={colors.collar} filter="brightness(0.7)" />
          <path d="M 240 100 Q 300 135 360 100 Q 300 75 240 100 Z" fill="url(#collarInnerGrad)" />

          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill="url(#sleeveRightGrad)" />

          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

          <path
            d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 145 235 98 Z"
            fill={colors.body}
            stroke="#0a0a0c"
            strokeWidth="1.5"
          />
          <path
            d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 145 235 98 Z"
            fill="url(#bodyShadingFront)"
          />

          <path
            d="M 235 98 Q 300 170 365 98 Q 380 110 365 118 Q 300 195 235 118 Q 220 110 235 98 Z"
            fill={colors.collar}
            stroke="#0a0a0c"
            strokeWidth="1.5"
          />

          <path d="M 165 245 Q 200 270 230 260" stroke="#000000" strokeOpacity={0.25 * shadowOpacity * 2} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 435 245 Q 400 270 370 260" stroke="#000000" strokeOpacity={0.25 * shadowOpacity * 2} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="163" y1="605" x2="437" y2="605" stroke="#000000" strokeOpacity="0.25" strokeDasharray="4 3" strokeWidth="1.5" />
        </svg>
      )
    }

    if (side === 'back') {
      return (
        <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill="url(#sleeveRightGrad)" />

          <path
            d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 85 235 98 Z"
            fill={colors.body}
            stroke="#0a0a0c"
            strokeWidth="1.5"
          />
          <path
            d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 85 235 98 Z"
            fill="url(#bodyShadingFront)"
          />

          <path d="M 235 98 Q 300 115 365 98 L 365 88 Q 300 75 235 88 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
          <line x1="163" y1="605" x2="437" y2="605" stroke="#000000" strokeOpacity="0.25" strokeDasharray="4 3" strokeWidth="1.5" />
        </svg>
      )
    }

    // Tampak Sisi Kiri / Kanan (Side Views for Sleeves)
    const isLeft = side === 'left'
    return (
      <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        {/* Torso Profile */}
        <path
          d={
            isLeft
              ? 'M 250 110 L 290 145 L 305 270 L 320 620 L 230 620 L 210 270 Z'
              : 'M 350 110 L 310 145 L 295 270 L 280 620 L 370 620 L 390 270 Z'
          }
          fill={colors.body}
          filter="brightness(0.9)"
          stroke="#0a0a0c"
          strokeWidth="1.5"
        />

        {/* Sleeve Profile Large (Focused on center) */}
        <path
          d="M 220 115 L 380 115 L 420 370 L 180 370 Z"
          fill={colors.sleeves}
          stroke="#0a0a0c"
          strokeWidth="2"
        />
        <path d="M 220 115 L 380 115 L 420 370 L 180 370 Z" fill="url(#sideViewGrad)" />

        {/* Sleeve Cuff */}
        <rect x="180" y="370" width="240" height="28" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />

        {/* Shoulder seam */}
        <line x1="300" y1="85" x2="300" y2="120" stroke="#000000" strokeWidth="2" strokeDasharray="3 3" />
        {/* Collar side tip */}
        <path d="M 270 95 Q 300 80 330 95 L 330 115 Q 300 100 270 115 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
      </svg>
    )
  }

  // 2. PDH / PDL
  const renderPDH = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          <path d="M 230 110 Q 300 130 370 110 L 350 75 Q 300 65 250 75 Z" fill={colors.collar} filter="brightness(0.7)" />

          <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill="url(#sleeveRightGrad)" />

          <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

          <path
            d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 115 235 95 Z"
            fill={colors.body}
            stroke="#0a0a0c"
            strokeWidth="1.5"
          />
          <path
            d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 115 235 95 Z"
            fill="url(#bodyShadingFront)"
          />

          <rect x="284" y="115" width="32" height="515" fill={colors.body} filter="brightness(0.95)" stroke="#0a0a0c" strokeWidth="1.5" />
          {[160, 230, 310, 390, 470, 550].map((by) => (
            <circle key={by} cx="300" cy={by} r="6.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
          ))}

          {/* Pockets */}
          <g filter="url(#pocketShadow)">
            <path d="M 195 245 L 265 245 L 265 330 Q 230 345 195 330 Z" fill={colors.pocket} stroke="#0a0a0c" strokeWidth="1.5" />
            <line x1="230" y1="245" x2="230" y2="335" stroke="#000000" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M 193 245 L 267 245 L 267 270 L 230 285 L 193 270 Z" fill={colors.pocket} filter="brightness(1.05)" stroke="#0a0a0c" strokeWidth="1.5" />
            <circle cx="230" cy="272" r="4.5" fill={colors.accent} />
          </g>

          <g filter="url(#pocketShadow)">
            <path d="M 335 245 L 405 245 L 405 330 Q 370 345 335 330 Z" fill={colors.pocket} stroke="#0a0a0c" strokeWidth="1.5" />
            <line x1="370" y1="245" x2="370" y2="335" stroke="#000000" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M 333 245 L 407 245 L 407 270 L 370 285 L 333 270 Z" fill={colors.pocket} filter="brightness(1.05)" stroke="#0a0a0c" strokeWidth="1.5" />
            <circle cx="370" cy="272" r="4.5" fill={colors.accent} />
          </g>

          {/* Epaulets */}
          <path d="M 160 140 L 235 98 L 225 118 L 165 152 Z" fill={colors.accent} stroke="#0a0a0c" strokeWidth="1.2" />
          <path d="M 440 140 L 365 98 L 375 118 L 435 152 Z" fill={colors.accent} stroke="#0a0a0c" strokeWidth="1.2" />

          {/* Collar Leaves */}
          <path d="M 300 120 L 380 90 L 340 165 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" />
          <path d="M 300 120 L 220 90 L 260 165 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" />
        </svg>
      )
    }

    if (side === 'back') {
      return (
        <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path
            d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 80 235 95 Z"
            fill={colors.body}
            stroke="#0a0a0c"
            strokeWidth="1.5"
          />
          <path d="M 235 95 Q 300 110 365 95 L 365 80 Q 300 65 235 80 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 175 190 Q 300 205 425 190 L 440 140 L 365 95 Q 300 110 235 95 L 160 140 Z" fill={colors.accent} fillOpacity="0.25" stroke="#0a0a0c" strokeWidth="1.5" />
        </svg>
      )
    }

    // Side View for PDH Sleeve
    return (
      <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        <path d="M 220 115 L 380 115 L 420 420 L 180 420 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="2" />
        <path d="M 220 115 L 380 115 L 420 420 L 180 420 Z" fill="url(#sideViewGrad)" />
        {/* PDH Shoulder Epaulet Side View */}
        <path d="M 260 115 L 340 115 L 330 135 L 270 135 Z" fill={colors.accent} stroke="#0a0a0c" strokeWidth="1.5" />
        {/* Button Cuff */}
        <rect x="180" y="420" width="240" height="35" fill={colors.body} filter="brightness(0.95)" stroke="#0a0a0c" strokeWidth="1.5" />
        <circle cx="300" cy="437" r="5" fill={colors.accent} />
      </svg>
    )
  }

  // 3. Rompi, Kemeja, Polo, Jaket, Hoodie fallback to front/back/side
  switch (type) {
    case 'pdh':
      return renderPDH()
    default:
      return renderKaos()
  }
}
