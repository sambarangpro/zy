import React from 'react'
import type { GarmentColorParts, GarmentType, StudioLighting, ViewSide } from '../types'

interface MockupSVGProps {
  type: GarmentType
  side: ViewSide
  colors: GarmentColorParts
  lighting?: StudioLighting
  className?: string
}

export const MockupSVG: React.FC<MockupSVGProps> = ({
  type,
  side,
  colors,
  lighting = { brightness: 0, contrast: 0, saturation: 0, shadowDepth: 35 },
  className = 'w-full h-full drop-shadow-xl',
}) => {
  // Lighting filter calculations
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
      {/* 3D Fabric Wrinkle Shading Gradient */}
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

      <linearGradient id="collarInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
      </linearGradient>

      <linearGradient id="placketGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="50%" stopColor="#000000" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
      </linearGradient>

      <filter id="pocketShadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
      </filter>
    </defs>
  )

  // 1. KAOS (HEAVYWEIGHT T-SHIRT)
  const renderKaos = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          {/* Inner Collar Back */}
          <path d="M 240 100 Q 300 135 360 100 Q 300 75 240 100 Z" fill={colors.collar} filter="brightness(0.7)" />
          <path d="M 240 100 Q 300 135 360 100 Q 300 75 240 100 Z" fill="url(#collarInnerGrad)" />

          {/* Left Sleeve (Viewer's right) */}
          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill="url(#sleeveRightGrad)" />

          {/* Right Sleeve (Viewer's left) */}
          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

          {/* Body Main */}
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

          {/* Front Ribbed Crewneck Collar */}
          <path
            d="M 235 98 Q 300 170 365 98 Q 380 110 365 118 Q 300 195 235 118 Q 220 110 235 98 Z"
            fill={colors.collar}
            stroke="#0a0a0c"
            strokeWidth="1.5"
          />

          {/* 3D Realistic fold wrinkles */}
          <path d="M 165 245 Q 200 270 230 260" stroke="#000000" strokeOpacity={0.25 * shadowOpacity * 2} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 435 245 Q 400 270 370 260" stroke="#000000" strokeOpacity={0.25 * shadowOpacity * 2} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 175 480 Q 205 490 220 485" stroke="#000000" strokeOpacity={0.2 * shadowOpacity * 2} strokeWidth="2" strokeLinecap="round" />
          <path d="M 425 480 Q 395 490 380 485" stroke="#000000" strokeOpacity={0.2 * shadowOpacity * 2} strokeWidth="2" strokeLinecap="round" />

          {/* Hem bottom double stitch line */}
          <line x1="163" y1="605" x2="437" y2="605" stroke="#000000" strokeOpacity="0.25" strokeDasharray="4 3" strokeWidth="1.5" />
          <line x1="83" y1="305" x2="160" y2="240" stroke="#000000" strokeOpacity="0.2" strokeDasharray="3 3" strokeWidth="1.5" />
          <line x1="517" y1="305" x2="440" y2="240" stroke="#000000" strokeOpacity="0.2" strokeDasharray="3 3" strokeWidth="1.5" />
        </svg>
      )
    }

    // Kaos Back View
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
        <line x1="235" y1="98" x2="155" y2="150" stroke="#000000" strokeOpacity="0.3" strokeDasharray="4 3" strokeWidth="1.5" />
        <line x1="365" y1="98" x2="445" y2="150" stroke="#000000" strokeOpacity="0.3" strokeDasharray="4 3" strokeWidth="1.5" />
        <line x1="163" y1="605" x2="437" y2="605" stroke="#000000" strokeOpacity="0.25" strokeDasharray="4 3" strokeWidth="1.5" />
      </svg>
    )
  }

  // 2. PDH / PDL (PAKAIAN DINAS HARIAN)
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

          {/* Button placket */}
          <rect x="284" y="115" width="32" height="515" fill={colors.body} filter="brightness(0.95)" stroke="#0a0a0c" strokeWidth="1.5" />
          <rect x="284" y="115" width="32" height="515" fill="url(#placketGrad)" />
          {[160, 230, 310, 390, 470, 550].map((by) => (
            <circle key={by} cx="300" cy={by} r="6.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
          ))}

          {/* Flap Pockets */}
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

          {/* Formal Shirt Collar Leaves */}
          <path d="M 300 120 L 380 90 L 340 165 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" />
          <path d="M 300 120 L 220 90 L 260 165 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" />
        </svg>
      )
    }

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
        <line x1="295" y1="195" x2="295" y2="480" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="305" y1="195" x2="305" y2="480" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />
      </svg>
    )
  }

  // 3. ROMPI LAPANGAN / TACTICAL SAFETY
  const renderRompi = () => {
    return (
      <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        <path
          d="M 230 100 L 165 140 Q 200 240 175 320 L 175 620 L 425 620 L 425 320 Q 400 240 435 140 L 370 100 Q 300 85 230 100 Z"
          fill={colors.body}
          stroke="#0a0a0c"
          strokeWidth="1.8"
        />
        <path
          d="M 230 100 L 165 140 Q 200 240 175 320 L 175 620 L 425 620 L 425 320 Q 400 240 435 140 L 370 100 Q 300 85 230 100 Z"
          fill="url(#bodyShadingFront)"
        />

        {/* Scotlite Reflective Band */}
        <rect x="175" y="450" width="250" height="26" fill={colors.accent} stroke="#334155" strokeWidth="1" />
        <rect x="175" y="458" width="250" height="10" fill="#ffffff" fillOpacity="0.8" />

        {side === 'front' ? (
          <>
            <rect x="296" y="100" width="8" height="520" fill="#334155" stroke="#0a0a0c" strokeWidth="1" />
            <circle cx="300" cy="180" r="5" fill="#94a3b8" />
            <path d="M 230 100 L 300 260 L 300 100 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.2" />
            <path d="M 370 100 L 300 260 L 300 100 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.2" />
            <rect x="325" y="270" width="85" height="55" rx="4" fill={colors.pocket} stroke="#0a0a0c" strokeWidth="1.5" />
            <rect x="190" y="270" width="85" height="55" rx="4" fill={colors.pocket} stroke="#0a0a0c" strokeWidth="1.5" />
            <rect x="185" y="500" width="95" height="95" rx="4" fill={colors.pocket} stroke="#0a0a0c" strokeWidth="1.5" />
            <rect x="320" y="500" width="95" height="95" rx="4" fill={colors.pocket} stroke="#0a0a0c" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <path d="M 230 100 Q 300 115 370 100 L 370 85 Q 300 75 230 85 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
            <rect x="200" y="105" width="26" height="345" fill={colors.accent} stroke="#334155" strokeWidth="1" opacity="0.9" />
            <rect x="374" y="105" width="26" height="345" fill={colors.accent} stroke="#334155" strokeWidth="1" opacity="0.9" />
          </>
        )}
      </svg>
    )
  }

  // 4. KEMEJA FORMAL
  const renderKemeja = () => {
    return (
      <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <path
          d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 115 235 95 Z"
          fill={colors.body}
          stroke="#0a0a0c"
          strokeWidth="1.5"
        />
        {side === 'front' ? (
          <>
            <rect x="286" y="115" width="28" height="515" fill={colors.body} filter="brightness(0.96)" stroke="#0a0a0c" strokeWidth="1.5" />
            {[160, 240, 320, 400, 480, 560].map((by) => (
              <circle key={by} cx="300" cy={by} r="5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
            ))}
            <path d="M 345 250 L 405 250 L 405 325 L 375 340 L 345 325 Z" fill={colors.pocket} stroke="#0a0a0c" strokeWidth="1.5" />
            <path d="M 300 120 L 375 92 L 335 160 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
            <path d="M 300 120 L 225 92 L 265 160 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
          </>
        ) : (
          <path d="M 235 95 Q 300 110 365 95 L 365 80 Q 300 65 235 80 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
        )}
      </svg>
    )
  }

  // 5. POLO SHIRT
  const renderPolo = () => {
    return (
      <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <path
          d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 130 235 98 Z"
          fill={colors.body}
          stroke="#0a0a0c"
          strokeWidth="1.5"
        />
        {side === 'front' ? (
          <>
            <rect x="286" y="115" width="28" height="150" fill={colors.body} filter="brightness(0.95)" stroke="#0a0a0c" strokeWidth="1.5" />
            <circle cx="300" cy="140" r="4.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
            <circle cx="300" cy="180" r="4.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
            <circle cx="300" cy="220" r="4.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
            <path d="M 300 120 L 380 92 L 355 160 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
            <path d="M 300 120 L 220 92 L 245 160 L 300 120 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
          </>
        ) : (
          <path d="M 235 98 Q 300 115 365 98 L 365 85 Q 300 70 235 85 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
        )}
      </svg>
    )
  }

  // 6. JAKET BOMBER
  const renderJaket = () => {
    return (
      <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        <path d="M 440 145 L 565 255 L 510 345 L 430 255 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <path d="M 160 145 L 35 255 L 90 345 L 170 255 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <path
          d="M 240 105 L 160 145 L 170 255 Q 185 430 165 595 L 435 595 Q 415 430 430 255 L 440 145 L 360 105 Q 300 120 240 105 Z"
          fill={colors.body}
          stroke="#0a0a0c"
          strokeWidth="1.8"
        />
        <rect x="165" y="595" width="270" height="35" rx="3" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
        {side === 'front' && (
          <>
            <rect x="296" y="105" width="8" height="525" fill="#475569" stroke="#0a0a0c" strokeWidth="1" />
            <circle cx="300" cy="150" r="5" fill="#e2e8f0" />
            <line x1="200" y1="460" x2="255" y2="520" stroke={colors.pocket} strokeWidth="10" strokeLinecap="round" />
            <line x1="400" y1="460" x2="345" y2="520" stroke={colors.pocket} strokeWidth="10" strokeLinecap="round" />
          </>
        )}
        <path d="M 240 105 Q 300 125 360 105 L 350 82 Q 300 70 250 82 Z" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />
      </svg>
    )
  }

  // 7. HOODIE JUMPER (STREETWEAR)
  const renderHoodie = () => {
    return (
      <svg viewBox="0 0 600 700" className={className} style={filterStyle} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        {/* Hood (Tudung) */}
        <path
          d="M 215 110 C 205 30, 395 30, 385 110 C 350 75, 250 75, 215 110 Z"
          fill={colors.collar}
          stroke="#0a0a0c"
          strokeWidth="2"
        />

        {/* Sleeves */}
        <path d="M 440 145 L 565 260 L 510 350 L 430 255 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <rect x="495" y="330" width="30" height="25" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.2" transform="rotate(35 495 330)" />

        <path d="M 160 145 L 35 260 L 90 350 L 170 255 Z" fill={colors.sleeves} stroke="#0a0a0c" strokeWidth="1.5" />
        <rect x="75" y="320" width="30" height="25" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.2" transform="rotate(-35 75 320)" />

        {/* Body */}
        <path
          d="M 230 110 L 160 145 L 170 255 Q 185 430 165 595 L 435 595 Q 415 430 430 255 L 440 145 L 370 110 Q 300 135 230 110 Z"
          fill={colors.body}
          stroke="#0a0a0c"
          strokeWidth="1.8"
        />

        {/* Bottom Waistband */}
        <rect x="165" y="595" width="270" height="35" rx="3" fill={colors.collar} stroke="#0a0a0c" strokeWidth="1.5" />

        {side === 'front' && (
          <>
            {/* Drawstrings (Tali Hoodie) */}
            <path d="M 270 120 Q 265 180 270 220" stroke={colors.accent} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="270" cy="222" r="3" fill="#cbd5e1" />
            <path d="M 330 120 Q 335 180 330 220" stroke={colors.accent} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="330" cy="222" r="3" fill="#cbd5e1" />

            {/* Kangaroo Pocket */}
            <path
              d="M 230 460 L 370 460 L 390 550 L 210 550 Z"
              fill={colors.pocket}
              stroke="#0a0a0c"
              strokeWidth="1.5"
              filter="url(#pocketShadow)"
            />
          </>
        )}
      </svg>
    )
  }

  switch (type) {
    case 'pdh':
      return renderPDH()
    case 'kaos':
      return renderKaos()
    case 'rompi':
      return renderRompi()
    case 'kemeja':
      return renderKemeja()
    case 'polo':
      return renderPolo()
    case 'jaket':
      return renderJaket()
    case 'hoodie':
      return renderHoodie()
    default:
      return renderKaos()
  }
}
