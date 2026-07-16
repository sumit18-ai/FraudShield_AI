"use client"

import { Activity, ShieldAlert, Target, TrendingDown, TrendingUp } from "lucide-react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { type ComponentType, useEffect } from "react"
import { Sparkline } from "./sparkline"

interface StatCardsProps {
  totalScanned: number
  fraudDetected: number
  accuracyRate: number
}

interface StatConfig {
  key: string
  label: string
  value: number
  format: (n: number) => string
  sub: string
  icon: ComponentType<{ className?: string }>
  danger?: boolean
  accentClass: string
  spark: number[]
  sparkColor: string
  trend: number
  trendGood: "up" | "down"
}

// Smoothly animates a number toward its target when it changes.
function AnimatedNumber({
  value,
  format,
}: {
  value: number
  format: (n: number) => string
}) {
  const mv = useMotionValue(value)
  const rounded = useTransform(mv, (v) => format(v))

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: "easeOut" })
    return controls.stop
  }, [mv, value])

  return <motion.span>{rounded}</motion.span>
}

function StatCard({ stat, index }: { stat: StatConfig; index: number }) {
  const Icon = stat.icon
  const trendUp = stat.trend >= 0
  const isGood = (trendUp ? "up" : "down") === stat.trendGood
  const TrendIcon = trendUp ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={[
        "group relative overflow-hidden rounded-xl border bg-card/80 p-5 backdrop-blur transition-colors",
        stat.danger
          ? "border-danger/50 animate-pulse-glow"
          : "border-border hover:border-muted-foreground/40",
      ].join(" ")}
    >
      {/* Sheen sweep on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {stat.label}
          </p>
          <p
            className={[
              "mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight lg:text-4xl",
              stat.danger ? "text-danger" : "text-foreground",
            ].join(" ")}
          >
            <AnimatedNumber value={stat.value} format={stat.format} />
          </p>
        </div>
        <motion.div
          whileHover={{ rotate: stat.danger ? [0, -8, 8, -6, 0] : 0, scale: 1.08 }}
          transition={{ duration: 0.5 }}
          className={[
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            stat.accentClass,
          ].join(" ")}
        >
          <Icon className="size-5" />
        </motion.div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span
            className={[
              "flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
              isGood ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
            ].join(" ")}
          >
            <TrendIcon className="size-3" />
            {trendUp ? "+" : ""}
            {stat.trend.toFixed(1)}%
          </span>
          <p className="text-xs text-muted-foreground">{stat.sub}</p>
        </div>
        <div className="shrink-0 opacity-90">
          <Sparkline data={stat.spark} color={stat.sparkColor} />
        </div>
      </div>
    </motion.div>
  )
}

export function StatCards({ totalScanned, fraudDetected, accuracyRate }: StatCardsProps) {
  const fraudRate = totalScanned > 0 ? (fraudDetected / totalScanned) * 100 : 0

  const stats: StatConfig[] = [
    {
      key: "scanned",
      label: "Total Scanned",
      value: totalScanned,
      format: (n) => Math.round(n).toLocaleString(),
      sub: "Transactions this session",
      icon: Activity,
      accentClass: "bg-muted text-foreground",
      spark: [12, 18, 15, 22, 28, 24, 34, 30, 38, 44, 42, 52],
      sparkColor: "var(--chart-3)",
      trend: 8.4,
      trendGood: "up",
    },
    {
      key: "fraud",
      label: "Fraud Detected",
      value: fraudDetected,
      format: (n) => Math.round(n).toLocaleString(),
      sub: `${fraudRate.toFixed(1)}% flagged high-risk`,
      icon: ShieldAlert,
      danger: true,
      accentClass: "bg-danger/15 text-danger",
      spark: [8, 6, 10, 7, 12, 9, 14, 11, 18, 13, 20, 17],
      sparkColor: "var(--danger)",
      trend: 3.1,
      trendGood: "down",
    },
    {
      key: "accuracy",
      label: "Accuracy Rate",
      value: accuracyRate,
      format: (n) => `${n.toFixed(1)}%`,
      sub: "Rolling precision (24h)",
      icon: Target,
      accentClass: "bg-success/15 text-success",
      spark: [96, 97, 96.5, 98, 97.5, 98.4, 98, 99, 98.7, 99.1, 99, 99.2],
      sparkColor: "var(--success)",
      trend: 0.6,
      trendGood: "up",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat, i) => (
        <StatCard key={stat.key} stat={stat} index={i} />
      ))}
    </div>
  )
}
