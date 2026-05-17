'use client';

import React, { useId } from 'react';

interface KaiLogoProps {
  size?: number;
}

export function KaiLogo({ size = 32 }: KaiLogoProps) {
  const uid = useId().replace(/:/g, '');

  // Head silhouette path (profile facing right, 100x100 viewBox)
  const headPath = `
    M 44 80 L 44 70
    C 37 65 26 57 24 47
    C 20 36 24 20 34 14
    C 41 9 52 7 60 10
    C 69 13 76 22 76 33
    C 77 42 71 49 69 53
    L 73 56 L 69 59
    C 66 64 63 68 60 72
    C 57 76 53 79 51 80
    L 44 80 Z
  `;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Background gradient — deep navy */}
        <radialGradient id={`bg-${uid}`} cx="40%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1a3f9c" />
          <stop offset="100%" stopColor="#0a1a6b" />
        </radialGradient>

        {/* Circuit lines gradient */}
        <linearGradient id={`cg-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.7" />
        </linearGradient>

        {/* Clip to head silhouette for circuit lines */}
        <clipPath id={`clip-${uid}`}>
          <path d={headPath} />
        </clipPath>
      </defs>

      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${uid})`} />

      {/* Subtle inner glow */}
      <circle cx="40" cy="38" r="30" fill="white" fillOpacity="0.03" />

      {/* Head silhouette */}
      <path d={headPath} fill="white" fillOpacity="0.95" />

      {/* Circuit lines — pixel coords are tied to the 110×110 viewBox; don't adjust independently */}
      <g clipPath={`url(#clip-${uid})`}>
        {/* Line 1 — top */}
        <line x1="46" y1="22" x2="76" y2="22" stroke={`url(#cg-${uid})`} strokeWidth="2.2" strokeLinecap="round" />
        {/* Nodes on line 1 */}
        {[46, 56, 66, 75].map(x => (
          <circle key={`n1-${x}`} cx={x} cy={22} r={x === 46 || x === 75 ? 2.8 : 2} fill="#38BDF8" />
        ))}

        {/* Line 2 — middle */}
        <line x1="38" y1="32" x2="76" y2="32" stroke={`url(#cg-${uid})`} strokeWidth="2" strokeLinecap="round" />
        {[38, 50, 62, 74].map(x => (
          <circle key={`n2-${x}`} cx={x} cy={32} r={x === 38 || x === 74 ? 2.5 : 1.8} fill="#7DD3FC" />
        ))}

        {/* Line 3 — lower */}
        <line x1="35" y1="42" x2="70" y2="42" stroke={`url(#cg-${uid})`} strokeWidth="1.8" strokeLinecap="round" />
        {[35, 47, 58, 69].map(x => (
          <circle key={`n3-${x}`} cx={x} cy={42} r={1.8} fill="#38BDF8" />
        ))}

        {/* Vertical connectors between lines */}
        <line x1="56" y1="22" x2="50" y2="32" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="62" y1="32" x2="58" y2="42" stroke="#7DD3FC" strokeWidth="1.5" strokeOpacity="0.7" />
      </g>

      {/* Decorative dots outside head — left side (data stream visual) */}
      {[
        [17, 38, 2.2, 0.7],
        [13, 46, 1.8, 0.6],
        [17, 54, 2.2, 0.65],
        [10, 42, 1.4, 0.4],
        [10, 50, 1.4, 0.4],
        [10, 58, 1.4, 0.35],
      ].map(([cx, cy, r, op], i) => (
        <circle key={`dot-${i}`} cx={cx as number} cy={cy as number} r={r as number} fill="#38BDF8" fillOpacity={op as number} />
      ))}
    </svg>
  );
}

/** Full wordmark: logo + K-AI text + company */
export function KaiWordmark({ size = 32, showCompany = false }: { size?: number; showCompany?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <KaiLogo size={size} />
      <div>
        <div className="text-gray-900" style={{ fontSize: size * 0.47, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
          K-AI
        </div>
        {showCompany && (
          <div className="text-gray-400" style={{ fontSize: size * 0.3, fontWeight: 400, lineHeight: 1.1 }}>
            by Wondering Kaslana
          </div>
        )}
      </div>
    </div>
  );
}
