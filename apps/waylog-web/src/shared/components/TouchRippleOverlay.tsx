import { alpha, Box, keyframes } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const rippleAnim = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
`

interface Ripple {
  x: number
  y: number
  key: number
}

export function TouchRippleOverlay() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const nextKey = useRef(0)

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      setRipples(prev => [...prev, { x: e.clientX, y: e.clientY, key: nextKey.current++ }])
    }

    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])

  return (
    <>
      {ripples.map(ripple => (
        <Box
          key={ripple.key}
          sx={{
            position: 'fixed',
            left: ripple.x,
            top: ripple.y,
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: alpha('#1976d2', 0.5),
            pointerEvents: 'none',
            zIndex: 9999,
            animation: `${rippleAnim} 0.5s ease-out forwards`,
          }}
          onAnimationEnd={() => setRipples(prev => prev.filter(r => r.key !== ripple.key))}
        />
      ))}
    </>
  )
}
