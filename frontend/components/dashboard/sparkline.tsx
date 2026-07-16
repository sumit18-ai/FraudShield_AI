"use client"

import { motion } from "motion/react"
import { useId } from "react"

interface SparklineProps {
  data: number[]
  color: string
  width?: number
  height?: number
}

// A lightweight animated area sparkline drawn as an SVG path.
export function Sparkline({ data, color, width = 120, height = 36 }: SparklineProps) {
  const id = useId()
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 4) - 2
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#fill-${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <motion.circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      />
    </svg>
  )
}
