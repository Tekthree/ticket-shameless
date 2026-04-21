'use client'

import Image from 'next/image'

export default function PageLoader({ done }: { done: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#111110',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: done ? 'none' : 'all',
      opacity: done ? 0 : 1,
      transition: 'opacity 0.6s ease 0.2s',
    }}>
      <div style={{
        animation: done ? undefined : 'ss-logo-reveal 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
      }}>
        <Image
          src="/shameless-logo.png"
          alt="Simply Shameless"
          width={64}
          height={64}
          style={{ height: 64, width: 'auto' }}
          priority
        />
      </div>
      <style>{`
        @keyframes ss-logo-reveal {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
