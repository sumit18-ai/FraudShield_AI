"use client"

import type { RiskLevel, Transaction } from "@/lib/fraud-types"
import { ChevronRight } from "lucide-react"

interface LiveFeedProps {
  transactions: Transaction[]
  selectedId: string | null
  onSelect: (t: Transaction) => void
  paused: boolean
  onTogglePause: () => void
}

const LEVEL_META: Record<
  RiskLevel,
  { label: string; dot: string; text: string; bar: string; accent: string }
> = {
  safe: { label: "SAFE", dot: "bg-success", text: "text-success", bar: "bg-success", accent: "bg-success/70" },
  review: { label: "REVIEW", dot: "bg-warning", text: "text-warning", bar: "bg-warning", accent: "bg-warning/70" },
  fraud: { label: "FRAUD", dot: "bg-danger", text: "text-danger", bar: "bg-danger", accent: "bg-danger" },
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return "now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  return `${m}m ago`
}

function FeedRow({
  txn,
  selected,
  onSelect,
}: {
  txn: Transaction
  selected: boolean
  onSelect: (t: Transaction) => void
}) {
  const meta = LEVEL_META[txn.level]
  const isHighRisk = txn.level === "fraud"

  return (
    <button
      type="button"
      onClick={() => onSelect(txn)}
      className={[
        "animate-feed-enter shrink-0 group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden rounded-lg border py-2.5 pl-4 pr-3 text-left transition-all",
        isHighRisk ? "animate-fraud-flash" : "",
        selected
          ? "border-primary bg-accent shadow-[0_0_0_1px_var(--primary)]"
          : "border-border/60 bg-card/40 hover:-translate-y-px hover:border-border hover:bg-accent/50",
      ].join(" ")}
      aria-pressed={selected}
    >
      {/* Left accent bar keyed to risk level */}
      <span className={`absolute inset-y-0 left-0 w-1 ${meta.accent}`} aria-hidden />

      <span className="flex items-center gap-2.5">
        <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
        <span className="font-mono text-xs text-muted-foreground">{txn.id}</span>
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{txn.merchant}</span>
          <span className="hidden shrink-0 rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground md:inline">
            {txn.category}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-mono font-medium text-foreground/90">
            {txn.currency} {txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span aria-hidden>·</span>
          <span className="hidden sm:inline">{txn.location}</span>
          <span aria-hidden className="hidden sm:inline">·</span>
          <span>{timeAgo(txn.timestamp)}</span>
        </span>
      </span>

      <span className="flex items-center gap-3">
        <span className="flex flex-col items-end gap-1">
          <span className={`font-mono text-sm font-semibold tabular-nums ${meta.text}`}>
            {txn.riskScore}
            <span className={`ml-1.5 text-[10px] font-semibold tracking-widest ${meta.text}`}>
              {meta.label}
            </span>
          </span>
          {/* Risk score mini-bar */}
          <span className="h-1 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span
              className={`block h-full rounded-full ${meta.bar}`}
              style={{ width: `${txn.riskScore}%` }}
            />
          </span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

export function LiveFeed({
  transactions,
  selectedId,
  onSelect,
  paused,
  onTogglePause,
}: LiveFeedProps) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            {!paused && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
            )}
            <span className={`relative inline-flex size-2.5 rounded-full ${paused ? "bg-muted-foreground" : "bg-danger"}`} />
          </span>
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Live Transaction Feed</h2>
        </div>
        <button
          type="button"
          onClick={onTogglePause}
          className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {paused ? "RESUME" : "PAUSE"}
        </button>
      </header>

      <div className="flex flex-col gap-1.5 overflow-y-auto p-2" style={{ maxHeight: "min(60vh, 640px)" }}>
        {transactions.map((txn) => (
          <FeedRow
            key={txn.id}
            txn={txn}
            selected={txn.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}
