import React from 'react'
import type { GarmentColorParts, GarmentType, ViewSide } from '../types'

interface MockupSVGProps {
  type: GarmentType
  side: ViewSide
  colors: GarmentColorParts
  className?: string
}

export const MockupSVG: React.FC<MockupSVGProps> = ({
  type,
  side,
  colors,
  className = 'w-full h-full drop-shadow-xl',
}) => {
  // Common realistic shading filter & gradients
  const renderDefs = () => (
    <defs>
      {/* Fabric Texture Shading Gradients */}
      <linearGradient id="bodyShadingFront" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
        <stop offset="25%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="50%" stopColor="#000000" stopOpacity="0.02" />
        <stop offset="75%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
      </linearGradient>

      <linearGradient id="sleeveLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
      </linearGradient>

      <linearGradient id="sleeveRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
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

  // ----------------------------------------------------
  // 1. KAOS (T-SHIRT)
  // ----------------------------------------------------
  const renderKaos = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          {/* Inner Collar Back visible */}
          <path d="M 240 100 Q 300 135 360 100 Q 300 75 240 100 Z" fill={colors.collar} filter="brightness(0.7)" />
          <path d="M 240 100 Q 300 135 360 100 Q 300 75 240 100 Z" fill="url(#collarInnerGrad)" />

          {/* Sleeves */}
          {/* Left Sleeve (Viewer's right) */}
          <path
            d="M 445 150 L 565 240 L 515 315 L 435 245 Z"
            fill={colors.sleeves}
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill="url(#sleeveRightGrad)" />

          {/* Right Sleeve (Viewer's left) */}
          <path
            d="M 155 150 L 35 240 L 85 315 L 165 245 Z"
            fill={colors.sleeves}
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

          {/* Body Main */}
          <path
            d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 145 235 98 Z"
            fill={colors.body}
            stroke="#1e293b"
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
            stroke="#0f172a"
            strokeWidth="1.5"
          />

          {/* Realistic wrinkles and seams */}
          <path d="M 165 245 Q 200 270 230 260" stroke="#000000" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
          <path d="M 435 245 Q 400 270 370 260" stroke="#000000" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
          <path d="M 175 480 Q 205 490 220 485" stroke="#000000" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round" />
          <path d="M 425 480 Q 395 490 380 485" stroke="#000000" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round" />

          {/* Hem bottom double stitch line */}
          <line x1="163" y1="605" x2="437" y2="605" stroke="#000000" strokeOpacity="0.25" strokeDasharray="4 3" strokeWidth="1.5" />
          <line x1="83" y1="305" x2="160" y2="240" stroke="#000000" strokeOpacity="0.2" strokeDasharray="3 3" strokeWidth="1.5" />
          <line x1="517" y1="305" x2="440" y2="240" stroke="#000000" strokeOpacity="0.2" strokeDasharray="3 3" strokeWidth="1.5" />
        </svg>
      )
    }

    // Kaos Back View
    return (
      <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        {/* Sleeves */}
        <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill={colors.sleeves} stroke="#1e293b" strokeWidth="1.5" />
        <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

        <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill={colors.sleeves} stroke="#1e293b" strokeWidth="1.5" />
        <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill="url(#sleeveRightGrad)" />

        {/* Back Body */}
        <path
          d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 85 235 98 Z"
          fill={colors.body}
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        <path
          d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 85 235 98 Z"
          fill="url(#bodyShadingFront)"
        />

        {/* Back Collar Band */}
        <path
          d="M 235 98 Q 300 115 365 98 L 365 88 Q 300 75 235 88 Z"
          fill={colors.collar}
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {/* Back Shoulder Seams */}
        <line x1="235" y1="98" x2="155" y2="150" stroke="#000000" strokeOpacity="0.3" strokeDasharray="4 3" strokeWidth="1.5" />
        <line x1="365" y1="98" x2="445" y2="150" stroke="#000000" strokeOpacity="0.3" strokeDasharray="4 3" strokeWidth="1.5" />

        {/* Hem line */}
        <line x1="163" y1="605" x2="437" y2="605" stroke="#000000" strokeOpacity="0.25" strokeDasharray="4 3" strokeWidth="1.5" />
      </svg>
    )
  }

  // ----------------------------------------------------
  // 2. PDH / PDL (PAKAIAN DINAS HARIAN DENGAN SAKU & EPAULET)
  // ----------------------------------------------------
  const renderPDH = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          {/* Inner Collar */}
          <path d="M 230 110 Q 300 130 370 110 L 350 75 Q 300 65 250 75 Z" fill={colors.collar} filter="brightness(0.7)" />

          {/* Sleeves */}
          {/* Left Sleeve (Right side of screen) */}
          <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill="url(#sleeveRightGrad)" />

          {/* Right Sleeve */}
          <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

          {/* Main Body */}
          <path
            d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 115 235 95 Z"
            fill={colors.body}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <path
            d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 115 235 95 Z"
            fill="url(#bodyShadingFront)"
          />

          {/* Center Button Placket (Plaket Kancing Tengah) */}
          <rect x="284" y="115" width="32" height="515" fill={colors.body} filter="brightness(0.95)" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="284" y="115" width="32" height="515" fill="url(#placketGrad)" />

          {/* Buttons on placket */}
          {[160, 230, 310, 390, 470, 550].map((by) => (
            <g key={by}>
              <circle cx="300" cy={by} r="6.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
              <circle cx="300" cy={by} r="4" fill="#ffffff" fillOpacity="0.4" />
            </g>
          ))}

          {/* PDH Flap Chest Pockets (Saku Tempel Tutup Kancing) */}
          {/* Right Chest Pocket (Viewer's Left) */}
          <g filter="url(#pocketShadow)">
            <path
              d="M 195 245 L 265 245 L 265 330 Q 230 345 195 330 Z"
              fill={colors.pocket}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Center Box Pleat in Pocket */}
            <line x1="230" y1="245" x2="230" y2="335" stroke="#000000" strokeOpacity="0.3" strokeWidth="2" />
            {/* Flap with pointed end */}
            <path
              d="M 193 245 L 267 245 L 267 270 L 230 285 L 193 270 Z"
              fill={colors.pocket}
              filter="brightness(1.05)"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Flap Button */}
            <circle cx="230" cy="272" r="4.5" fill={colors.accent} stroke="#334155" strokeWidth="1" />
          </g>

          {/* Left Chest Pocket (Viewer's Right) */}
          <g filter="url(#pocketShadow)">
            <path
              d="M 335 245 L 405 245 L 405 330 Q 370 345 335 330 Z"
              fill={colors.pocket}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Center Box Pleat */}
            <line x1="370" y1="245" x2="370" y2="335" stroke="#000000" strokeOpacity="0.3" strokeWidth="2" />
            {/* Pen Slot on left pocket */}
            <line x1="392" y1="245" x2="392" y2="295" stroke="#000000" strokeOpacity="0.4" strokeDasharray="2 2" strokeWidth="1.5" />
            {/* Flap */}
            <path
              d="M 333 245 L 407 245 L 407 270 L 370 285 L 333 270 Z"
              fill={colors.pocket}
              filter="brightness(1.05)"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            <circle cx="370" cy="272" r="4.5" fill={colors.accent} stroke="#334155" strokeWidth="1" />
          </g>

          {/* Epaulets (Lidah Pundak Khas PDH) */}
          {/* Right Shoulder Epaulet */}
          <g>
            <path
              d="M 160 140 L 235 98 L 225 118 L 165 152 Z"
              fill={colors.accent}
              stroke="#0f172a"
              strokeWidth="1.2"
            />
            <circle cx="225" cy="112" r="4" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
          </g>
          {/* Left Shoulder Epaulet */}
          <g>
            <path
              d="M 440 140 L 365 98 L 375 118 L 435 152 Z"
              fill={colors.accent}
              stroke="#0f172a"
              strokeWidth="1.2"
            />
            <circle cx="375" cy="112" r="4" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
          </g>

          {/* Formal Shirt Collar Wings (Kerah Kemeja PDH) */}
          {/* Left Collar Leaf */}
          <path
            d="M 300 120 L 380 90 L 340 165 L 300 120 Z"
            fill={colors.collar}
            stroke="#0f172a"
            strokeWidth="1.5"
            filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
          />
          {/* Right Collar Leaf */}
          <path
            d="M 300 120 L 220 90 L 260 165 L 300 120 Z"
            fill={colors.collar}
            stroke="#0f172a"
            strokeWidth="1.5"
            filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
          />

          {/* Sleeve Cuffs & Hem line */}
          <line x1="85" y1="315" x2="165" y2="245" stroke="#000000" strokeOpacity="0.2" strokeWidth="2" />
          <line x1="515" y1="315" x2="435" y2="245" stroke="#000000" strokeOpacity="0.2" strokeWidth="2" />
          <line x1="160" y1="615" x2="440" y2="615" stroke="#000000" strokeOpacity="0.3" strokeDasharray="4 3" strokeWidth="1.5" />
        </svg>
      )
    }

    // PDH Back View
    return (
      <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        {/* Sleeves */}
        <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
        <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

        <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
        <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill="url(#sleeveRightGrad)" />

        {/* Back Body */}
        <path
          d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 80 235 95 Z"
          fill={colors.body}
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        <path
          d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 80 235 95 Z"
          fill="url(#bodyShadingFront)"
        />

        {/* Back Collar Band */}
        <path d="M 235 95 Q 300 110 365 95 L 365 80 Q 300 65 235 80 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />

        {/* PDH Back Yoke (Pundak Atas Horizontal Seam) */}
        <path
          d="M 175 190 Q 300 205 425 190 L 440 140 L 365 95 Q 300 110 235 95 L 160 140 Z"
          fill={colors.accent}
          fillOpacity="0.25"
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {/* Back Center Inverted Box Pleat (Lipatan Punggung Tengah) */}
        <line x1="295" y1="195" x2="295" y2="480" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="305" y1="195" x2="305" y2="480" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Bottom Hem */}
        <line x1="160" y1="615" x2="440" y2="615" stroke="#000000" strokeOpacity="0.3" strokeDasharray="4 3" strokeWidth="1.5" />
      </svg>
    )
  }

  // ----------------------------------------------------
  // 3. ROMPI LAPANGAN / SAFETY (VEST WITH SCOTLITE)
  // ----------------------------------------------------
  const renderRompi = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          {/* Inner Lining behind V-Neck */}
          <path d="M 240 110 L 300 280 L 360 110 Q 300 80 240 110 Z" fill="#1e293b" />

          {/* Vest Body (Sleeveless with deep armholes) */}
          <path
            d="M 230 100 L 165 140 Q 200 240 175 320 L 175 620 L 425 620 L 425 320 Q 400 240 435 140 L 370 100 Q 300 85 230 100 Z"
            fill={colors.body}
            stroke="#0f172a"
            strokeWidth="1.8"
          />
          <path
            d="M 230 100 L 165 140 Q 200 240 175 320 L 175 620 L 425 620 L 425 320 Q 400 240 435 140 L 370 100 Q 300 85 230 100 Z"
            fill="url(#bodyShadingFront)"
          />

          {/* High-Vis Reflective Strips / Scotlite Horizontal Band */}
          <rect x="175" y="450" width="250" height="26" fill={colors.accent} stroke="#334155" strokeWidth="1" />
          <rect x="175" y="458" width="250" height="10" fill="#ffffff" fillOpacity="0.8" />

          {/* Scotlite Shoulder Stripes */}
          <path d="M 185 130 L 220 105 L 220 280 L 185 280 Z" fill={colors.accent} stroke="#334155" strokeWidth="1" opacity="0.9" />
          <path d="M 415 130 L 380 105 L 380 280 L 415 280 Z" fill={colors.accent} stroke="#334155" strokeWidth="1" opacity="0.9" />

          {/* Center Heavy-Duty Zipper */}
          <rect x="296" y="100" width="8" height="520" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          {/* Zipper Puller */}
          <circle cx="300" cy="180" r="5" fill="#94a3b8" />
          <rect x="298" y="180" width="4" height="12" fill="#64748b" rx="2" />

          {/* V-Neck / Stand Collar */}
          <path d="M 230 100 L 300 260 L 300 100 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.2" />
          <path d="M 370 100 L 300 260 L 300 100 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.2" />

          {/* Upper Chest Pocket with Zipper (Left) */}
          <rect x="325" y="270" width="85" height="55" rx="4" fill={colors.pocket} stroke="#0f172a" strokeWidth="1.5" />
          <line x1="330" y1="282" x2="405" y2="282" stroke="#475569" strokeWidth="2.5" />

          {/* ID Card / Radio Loop Pocket (Right) */}
          <rect x="190" y="270" width="85" height="55" rx="4" fill={colors.pocket} stroke="#0f172a" strokeWidth="1.5" />
          <rect x="200" y="280" width="65" height="35" rx="2" fill="#ffffff" fillOpacity="0.25" stroke="#475569" strokeDasharray="2 2" />

          {/* Bottom Dual Cargo Pockets with Flap */}
          <g filter="url(#pocketShadow)">
            <rect x="185" y="500" width="95" height="95" rx="4" fill={colors.pocket} stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 183 500 L 282 500 L 282 522 L 183 522 Z" fill={colors.pocket} filter="brightness(1.1)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="232" cy="512" r="3.5" fill={colors.accent} />
          </g>
          <g filter="url(#pocketShadow)">
            <rect x="320" y="500" width="95" height="95" rx="4" fill={colors.pocket} stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 318 500 L 417 500 L 417 522 L 318 522 Z" fill={colors.pocket} filter="brightness(1.1)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="367" cy="512" r="3.5" fill={colors.accent} />
          </g>

          {/* Armhole binding trim */}
          <path d="M 165 140 Q 200 240 175 320" stroke="#000000" strokeWidth="3" />
          <path d="M 435 140 Q 400 240 425 320" stroke="#000000" strokeWidth="3" />
        </svg>
      )
    }

    // Rompi Back View
    return (
      <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        {/* Vest Back Body */}
        <path
          d="M 230 100 L 165 140 Q 200 240 175 320 L 175 620 L 425 620 L 425 320 Q 400 240 435 140 L 370 100 Q 300 85 230 100 Z"
          fill={colors.body}
          stroke="#0f172a"
          strokeWidth="1.8"
        />
        <path
          d="M 230 100 L 165 140 Q 200 240 175 320 L 175 620 L 425 620 L 425 320 Q 400 240 435 140 L 370 100 Q 300 85 230 100 Z"
          fill="url(#bodyShadingFront)"
        />

        {/* Back Collar Trim */}
        <path d="M 230 100 Q 300 115 370 100 L 370 85 Q 300 75 230 85 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />

        {/* Vertical Scotlite from shoulders */}
        <rect x="200" y="105" width="26" height="345" fill={colors.accent} stroke="#334155" strokeWidth="1" opacity="0.9" />
        <rect x="374" y="105" width="26" height="345" fill={colors.accent} stroke="#334155" strokeWidth="1" opacity="0.9" />

        {/* Large Horizontal Back Scotlite Band */}
        <rect x="175" y="450" width="250" height="26" fill={colors.accent} stroke="#334155" strokeWidth="1" />
        <rect x="175" y="458" width="250" height="10" fill="#ffffff" fillOpacity="0.8" />

        {/* Upper Back Yoke Seam */}
        <line x1="175" y1="230" x2="425" y2="230" stroke="#000000" strokeOpacity="0.3" strokeDasharray="4 3" strokeWidth="1.5" />
      </svg>
    )
  }

  // ----------------------------------------------------
  // 4. KEMEJA KANTOR / CASUAL SHIRT
  // ----------------------------------------------------
  const renderKemeja = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          {/* Inner Collar */}
          <path d="M 235 105 Q 300 130 365 105 L 350 75 Q 300 65 250 75 Z" fill={colors.collar} filter="brightness(0.7)" />

          {/* Sleeves */}
          <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill="url(#sleeveRightGrad)" />

          <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

          {/* Body Main */}
          <path
            d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 115 235 95 Z"
            fill={colors.body}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <path
            d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 115 235 95 Z"
            fill="url(#bodyShadingFront)"
          />

          {/* Clean Placket */}
          <rect x="286" y="115" width="28" height="515" fill={colors.body} filter="brightness(0.96)" stroke="#0f172a" strokeWidth="1.5" />
          {[160, 240, 320, 400, 480, 560].map((by) => (
            <circle key={by} cx="300" cy={by} r="5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
          ))}

          {/* Single Left Chest Pocket (Clean V-cut) */}
          <g filter="url(#pocketShadow)">
            <path
              d="M 345 250 L 405 250 L 405 325 L 375 340 L 345 325 Z"
              fill={colors.pocket}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            <line x1="345" y1="262" x2="405" y2="262" stroke="#000000" strokeOpacity="0.25" strokeDasharray="3 2" />
          </g>

          {/* Crisp Point Collar */}
          <path d="M 300 120 L 375 92 L 335 160 L 300 120 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.25))" />
          <path d="M 300 120 L 225 92 L 265 160 L 300 120 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.25))" />

          {/* Hem Curve */}
          <path d="M 158 630 Q 300 645 442 630" stroke="#000000" strokeOpacity="0.2" strokeWidth="2" />
        </svg>
      )
    }

    return (
      <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
        <path d="M 160 140 L 35 245 L 85 325 L 165 245 Z" fill="url(#sleeveLeftGrad)" />

        <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
        <path d="M 440 140 L 565 245 L 515 325 L 435 245 Z" fill="url(#sleeveRightGrad)" />

        <path
          d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 80 235 95 Z"
          fill={colors.body}
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        <path
          d="M 235 95 L 160 140 L 165 245 Q 175 425 158 630 L 442 630 Q 425 425 435 245 L 440 140 L 365 95 Q 300 80 235 95 Z"
          fill="url(#bodyShadingFront)"
        />

        <path d="M 235 95 Q 300 110 365 95 L 365 80 Q 300 65 235 80 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />
        {/* Back Yoke */}
        <line x1="175" y1="190" x2="425" y2="190" stroke="#000000" strokeOpacity="0.3" strokeDasharray="3 3" strokeWidth="1.5" />
      </svg>
    )
  }

  // ----------------------------------------------------
  // 5. POLO SHIRT (WANGKI)
  // ----------------------------------------------------
  const renderPolo = () => {
    if (side === 'front') {
      return (
        <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {renderDefs()}
          {/* Inner collar */}
          <path d="M 240 100 Q 300 125 360 100 L 350 75 Q 300 65 250 75 Z" fill={colors.collar} filter="brightness(0.7)" />

          {/* Sleeves with ribbed cuff trim */}
          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill={colors.sleeves} stroke="#1e293b" strokeWidth="1.5" />
          <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill="url(#sleeveRightGrad)" />
          {/* Sleeve cuff rib */}
          <path d="M 525 298 L 515 315 L 435 245 L 443 230 Z" fill={colors.accent} stroke="#0f172a" strokeWidth="1" />

          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill={colors.sleeves} stroke="#1e293b" strokeWidth="1.5" />
          <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill="url(#sleeveLeftGrad)" />
          <path d="M 75 298 L 85 315 L 165 245 L 157 230 Z" fill={colors.accent} stroke="#0f172a" strokeWidth="1" />

          {/* Body */}
          <path
            d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 130 235 98 Z"
            fill={colors.body}
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          <path
            d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 130 235 98 Z"
            fill="url(#bodyShadingFront)"
          />

          {/* 3-Button Placket */}
          <rect x="286" y="115" width="28" height="150" fill={colors.body} filter="brightness(0.95)" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="300" cy="140" r="4.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
          <circle cx="300" cy="180" r="4.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />
          <circle cx="300" cy="220" r="4.5" fill={colors.accent} stroke="#475569" strokeWidth="1" />

          {/* Polo Ribbed Collar */}
          <path d="M 300 120 L 380 92 L 355 160 L 300 120 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 300 120 L 220 92 L 245 160 L 300 120 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />

          {/* Bottom Side Slits (Belahan Samping Bawah Polo) */}
          <line x1="160" y1="585" x2="160" y2="620" stroke="#000000" strokeWidth="2.5" />
          <line x1="440" y1="585" x2="440" y2="620" stroke="#000000" strokeWidth="2.5" />
        </svg>
      )
    }

    return (
      <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        <path d="M 155 150 L 35 240 L 85 315 L 165 245 Z" fill={colors.sleeves} stroke="#1e293b" strokeWidth="1.5" />
        <path d="M 445 150 L 565 240 L 515 315 L 435 245 Z" fill={colors.sleeves} stroke="#1e293b" strokeWidth="1.5" />

        <path
          d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 85 235 98 Z"
          fill={colors.body}
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        <path
          d="M 235 98 L 155 150 L 165 245 Q 175 420 160 620 L 440 620 Q 425 420 435 245 L 445 150 L 365 98 Q 300 85 235 98 Z"
          fill="url(#bodyShadingFront)"
        />
        <path d="M 235 98 Q 300 115 365 98 L 365 85 Q 300 70 235 85 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />
      </svg>
    )
  }

  // ----------------------------------------------------
  // 6. JAKET BOMBER / PARKA
  // ----------------------------------------------------
  const renderJaket = () => {
    return (
      <svg viewBox="0 0 600 700" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderDefs()}
        {/* Sleeves with thick ribbed cuffs */}
        <path d="M 440 145 L 565 255 L 510 345 L 430 255 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
        <rect x="495" y="325" width="30" height="25" fill={colors.collar} stroke="#0f172a" strokeWidth="1.2" transform="rotate(35 495 325)" />

        <path d="M 160 145 L 35 255 L 90 345 L 170 255 Z" fill={colors.sleeves} stroke="#0f172a" strokeWidth="1.5" />
        <rect x="75" y="315" width="30" height="25" fill={colors.collar} stroke="#0f172a" strokeWidth="1.2" transform="rotate(-35 75 315)" />

        {/* Jacket Body */}
        <path
          d="M 240 105 L 160 145 L 170 255 Q 185 430 165 595 L 435 595 Q 415 430 430 255 L 440 145 L 360 105 Q 300 120 240 105 Z"
          fill={colors.body}
          stroke="#0f172a"
          strokeWidth="1.8"
        />
        <path
          d="M 240 105 L 160 145 L 170 255 Q 185 430 165 595 L 435 595 Q 415 430 430 255 L 440 145 L 360 105 Q 300 120 240 105 Z"
          fill="url(#bodyShadingFront)"
        />

        {/* Elastic Bottom Ribbed Waistband */}
        <rect x="165" y="595" width="270" height="35" rx="3" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />

        {side === 'front' && (
          <>
            {/* Center Metal Zipper */}
            <rect x="296" y="105" width="8" height="525" fill="#475569" stroke="#0f172a" strokeWidth="1" />
            <circle cx="300" cy="150" r="5" fill="#e2e8f0" />

            {/* Slanted Welt Pockets with snap buttons */}
            <g>
              <line x1="200" y1="460" x2="255" y2="520" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
              <line x1="200" y1="460" x2="255" y2="520" stroke={colors.pocket} strokeWidth="10" strokeLinecap="round" />
              <circle cx="227" cy="490" r="4" fill={colors.accent} />
            </g>
            <g>
              <line x1="400" y1="460" x2="345" y2="520" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
              <line x1="400" y1="460" x2="345" y2="520" stroke={colors.pocket} strokeWidth="10" strokeLinecap="round" />
              <circle cx="373" cy="490" r="4" fill={colors.accent} />
            </g>
          </>
        )}

        {/* Bomber Stand/Rib Collar */}
        <path d="M 240 105 Q 300 125 360 105 L 350 82 Q 300 70 250 82 Z" fill={colors.collar} stroke="#0f172a" strokeWidth="1.5" />
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
    default:
      return renderKaos()
  }
}
