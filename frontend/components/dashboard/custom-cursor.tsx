"use client"

import { useEffect, useRef, useState } from "react"

// A security-console themed reticle cursor.
// Perf: the dot follows the pointer 1:1 via direct DOM writes (no React state
// per move), the ring eases in a single rAF loop, and React state only updates
// when the interactive/pressed status actually changes.
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    // Only enable on devices with a fine pointer (mouse/trackpad).
    const mq = window.matchMedia("(pointer: fine)")
    if (!mq.matches) return
    setEnabled(true)
    document.documentElement.classList.add("custom-cursor-active")

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ring = { x: target.x, y: target.y }
    let frame: number
    let lastInteractive = false
    let visible = false

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      // Move the dot 1:1 immediately — no state, no lag.
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`
        if (!visible) {
          visible = true
          dotRef.current.style.opacity = "1"
        }
      }
      // Only re-render when the hovered element type flips.
      const el = e.target as HTMLElement | null
      const nextInteractive = Boolean(
        el?.closest("button, a, [role='button'], input, select"),
      )
      if (nextInteractive !== lastInteractive) {
        lastInteractive = nextInteractive
        setInteractive(nextInteractive)
      }
    }

    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    // Ring trails the dot with light easing for a smooth reticle feel.
    const tick = () => {
      ring.x += (target.x - ring.x) * 0.35
      ring.y += (target.y - ring.y) * 0.35
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`
      }
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      cancelAnimationFrame(frame)
      document.documentElement.classList.remove("custom-cursor-active")
    }
  }, [])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block" aria-hidden>
      {/* Center dot */}
      <div
        ref={dotRef}
        className="fixed left-0 top-0 size-2 rounded-full bg-danger opacity-0"
        style={{
          willChange: "transform",
          boxShadow: "0 0 10px 1px color-mix(in oklch, var(--danger) 70%, transparent)",
        }}
      />
      {/* Reticle ring */}
      <div ref={ringRef} className="fixed left-0 top-0" style={{ willChange: "transform" }}>
        <div
          className={[
            "relative flex items-center justify-center rounded-full border",
            interactive ? "border-danger" : "border-muted-foreground/60",
          ].join(" ")}
          style={{
            width: interactive ? 46 : 30,
            height: interactive ? 46 : 30,
            transform: `translate(-50%, -50%) scale(${pressed ? 0.8 : 1})`,
            transition: "width 0.2s ease, height 0.2s ease, transform 0.12s ease, border-color 0.2s ease",
            boxShadow: interactive
              ? "0 0 18px 1px color-mix(in oklch, var(--danger) 45%, transparent)"
              : "none",
          }}
        >
          {/* Crosshair ticks */}
          <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-current opacity-70" />
          <span className="absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2 bg-current opacity-70" />
          <span className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-current opacity-70" />
          <span className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-current opacity-70" />
        </div>
      </div>
    </div>
  )
}
