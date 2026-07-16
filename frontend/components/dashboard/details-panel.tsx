"use client"

import type { RiskLevel, Transaction } from "@/lib/fraud-types"
import { MousePointerClick } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { GaugeChart } from "./gauge-chart"

interface DetailsPanelProps {
  transaction: Transaction | null
}

const LEVEL_BADGE: Record<RiskLevel, string> = {
  safe: "border-success/40 bg-success/10 text-success",
  review: "border-warning/40 bg-warning/10 text-warning",
  fraud: "border-danger/40 bg-danger/10 text-danger",
}

function ShapBar({ impact, index }: { impact: number; index: number }) {
  // impact in [-1, 1]; center at 50%. Positive => right (danger), negative => left (success).
  const pct = Math.min(50, Math.abs(impact) * 50)
  const positive = impact >= 0
  return (
    <div className="relative h-2 w-full rounded-full bg-muted" aria-hidden>
      <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
      <motion.span
        className={`absolute top-0 h-full rounded-full ${positive ? "bg-danger" : "bg-success"}`}
        style={positive ? { left: "50%" } : { right: "50%" }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, delay: 0.15 + index * 0.06, ease: "easeOut" }}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <MousePointerClick className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No transaction selected</p>
      <p className="max-w-[240px] text-xs text-muted-foreground">
        Select a transaction from the live feed to inspect its risk score and top contributing
        factors.
      </p>
    </div>
  )
}

export function DetailsPanel({ transaction }: DetailsPanelProps) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">Transaction Analysis</h2>
      </header>

      <AnimatePresence mode="wait">
      {!transaction ? (
        <EmptyState key="empty" />
      ) : (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6 overflow-y-auto p-4"
        >
          {/* Header meta */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{transaction.id}</p>
              <p className="mt-1 truncate text-lg font-semibold text-foreground">
                {transaction.merchant}
              </p>
              <p className="text-xs text-muted-foreground">{transaction.category}</p>
            </div>
            <span
              className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${LEVEL_BADGE[transaction.level]}`}
            >
              {transaction.level}
            </span>
          </div>

          {/* Gauge */}
          <div className="rounded-lg border border-border/60 bg-background/40 py-4">
            <GaugeChart value={transaction.riskScore} />
          </div>

          {/* Meta grid */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 text-sm">
            {[
              ["Amount", `${transaction.currency} ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
              ["Card", `•••• ${transaction.cardLast4}`],
              ["Location", transaction.location],
              ["Time", new Date(transaction.timestamp).toLocaleTimeString()],
            ].map(([label, value]) => (
              <div key={label} className="bg-card p-3">
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 truncate font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          {/* SHAP top risk factors */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Top Risk Factors
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">SHAP</span>
            </div>
            <ul className="flex flex-col gap-3">
              {transaction.riskFactors.map((f, i) => (
                <motion.li
                  key={f.feature}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-foreground">{f.feature}</span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {f.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShapBar impact={f.impact} index={i} />
                    <span
                      className={`w-12 shrink-0 text-right font-mono text-xs tabular-nums ${f.impact >= 0 ? "text-danger" : "text-success"}`}
                    >
                      {f.impact >= 0 ? "+" : ""}
                      {f.impact.toFixed(2)}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" /> Lowers risk
              </span>
              <span className="flex items-center gap-1.5">
                Raises risk <span className="size-2 rounded-full bg-danger" />
              </span>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </section>
  )
}
