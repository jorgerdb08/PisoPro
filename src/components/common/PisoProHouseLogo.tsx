import React from "react";

interface PisoProHouseLogoProps {
  className?: string;
  size?: number;
}

export function PisoProHouseLogo({ className = "h-14 w-14", size = 56 }: PisoProHouseLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="PisoPro Casa Logo"
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38496D" />
          <stop offset="50%" stop-color="#31405F" />
          <stop offset="100%" stop-color="#243048" />
        </linearGradient>
        <linearGradient id="logoHouseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#F1F5F9" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.32" />
        </filter>
      </defs>

      {/* Rounded Squircle Container */}
      <rect width="512" height="512" rx="112" fill="url(#logoBgGrad)" />

      {/* Minimalist Modern House (Casa) */}
      <g transform="translate(256, 256) scale(0.88) translate(-256, -256)" filter="url(#logoGlow)">
        {/* Chimney */}
        <path
          d="M 320,192 L 320,138 C 320,132 324,128 330,128 L 352,128 C 358,128 362,132 362,138 L 362,228 Z"
          fill="url(#logoHouseGrad)"
        />

        {/* Main Roof with Eaves and Walls */}
        <path
          d="M 242,132
             C 250,124 262,124 270,132
             L 394,234
             C 402,241 400,250 390,250
             L 358,250
             L 358,374
             C 358,384 350,392 340,392
             L 172,392
             C 162,392 154,384 154,374
             L 154,250
             L 122,250
             C 112,250 110,241 118,234
             Z"
          fill="url(#logoHouseGrad)"
        />

        {/* 4-Pane Modern Loft Window */}
        <rect x="230" y="184" width="22" height="22" rx="4" fill="url(#logoBgGrad)" />
        <rect x="260" y="184" width="22" height="22" rx="4" fill="url(#logoBgGrad)" />
        <rect x="230" y="214" width="22" height="22" rx="4" fill="url(#logoBgGrad)" />
        <rect x="260" y="214" width="22" height="22" rx="4" fill="url(#logoBgGrad)" />

        {/* Arched Doorway */}
        <path
          d="M 224,392
             L 224,320
             C 224,302 238,288 256,288
             C 274,288 288,302 288,320
             L 288,392
             Z"
          fill="url(#logoBgGrad)"
        />
      </g>
    </svg>
  );
}
