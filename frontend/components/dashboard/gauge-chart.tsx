"use client"

import { useEffect, useState } from "react"

interface GaugeChartProps {
  /** 0-100 */
  value: number
  label?: string
}

// Semi-circle gauge (180deg) rendered with SVG arcs.
const START_ANGLE = 180
const END_ANGLE = 0
const RADIUS = 80
const CENTER = 100
const STROKE = 16

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER - radius * Math.sin(rad),
  }
}

function arcPath(startAngle: number, endAngle: number, radius: number) {
  const start = polar(startAngle, radius)
  const end = polar(endAngle, radius)
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
  // sweep 0 because angles decrease from 180 -> 0 going clockwise on screen
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

function colorForScore(score: number) {
  if (score >= 75) return "var(--color-danger)"
  if (score >= 45) return "var(--color-warning)"
  return "var(--color-success)"
}

export function GaugeChart({ value, label }: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const [display, setDisplay] = useState(0)

  // Animate the needle/value toward the target.
  useEffect(() => {
    let frame: number
    const startVal = display
    const startTime = performance.now()
    const duration = 650

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(startVal + (clamped - startVal) * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped])

  const angle = START_ANGLE + (display / 100) * (END_ANGLE - START_ANGLE)
  const valueColor = colorForScore(display)
  const needle = polar(angle, RADIUS - STROKE / 2 - 2)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[240px]" role="img" aria-label={`Risk score ${Math.round(display)} out of 100`}>
        {/* track */}
        <path
          d={arcPath(START_ANGLE, END_ANGLE, RADIUS)}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={arcPath(START_ANGLE, angle, RADIUS)}
          fill="none"
          stroke={valueColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
        {/* needle */}
        <line
          x1={CENTER}
          y1={CENTER}
          x2={needle.x}
          y2={needle.y}
          stroke={valueColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={CENTER} cy={CENTER} r={6} fill={valueColor} />
      </svg>
      <div className="-mt-6 flex flex-col items-center">
        <span
          className="font-mono text-4xl font-semibold tabular-nums"
          style={{ color: valueColor }}
        >
          {Math.round(display)}
        </span>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label ?? "Risk Score"}
        </span>
      </div>
    </div>
  )
}
