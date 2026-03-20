import React from 'react';
import { cn } from '@/lib/utils';

export const MatrixLogo = ({ className = "w-16 h-16" }: { className?: string }) => (
  <div className={cn("relative", className)}>
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
      <defs>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0"/>
        </radialGradient>
      </defs>
      
      <circle cx="200" cy="200" r="150" fill="url(#center-glow)"/>
      
      <g className="spin-ring">
        <circle cx="200" cy="200" r="140" fill="none" stroke="#00e5ff" strokeWidth="0.5" strokeDasharray="4 12" opacity="0.2"/>
        <circle cx="200" cy="200" r="120" fill="none" stroke="#00e5ff" strokeWidth="1" strokeDasharray="80 160" opacity="0.3"/>
      </g>
      
      <g className="spin-arc">
        <path d="M 200,80 A 120,120 0 0,1 320,200" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)"/>
        <path d="M 200,320 A 120,120 0 0,1 80,200" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)"/>
      </g>
      
      <circle cx="200" cy="200" r="16" className="pulse-ring" fill="none" stroke="#00e5ff" strokeWidth="1"/>
      <circle cx="200" cy="200" r="16" fill="#0d1a24" stroke="#00e5ff" strokeWidth="1.8" opacity="0.9" filter="url(#glow)"/>
      <circle cx="200" cy="200" r="5" fill="#00e5ff" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);
