"use client"

import { motion } from "motion/react"
import dynamic from "next/dynamic"
import { ShieldCheck } from "lucide-react"

// 3D canvas is client-only; skip SSR to avoid hydration/WebGL issues.
const Shield3D = dynamic(() => import("./shield-3d").then((m) => m.Shield3D), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <ShieldCheck className="size-16 animate-pulse text-danger/40" />
    </div>
  ),
})

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-background">
      {/* Subtle grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-10 top-1/2 size-64 -translate-y-1/2 rounded-full bg-danger/10 blur-3xl" aria-hidden />

      <div className="relative grid grid-cols-1 items-center gap-4 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex w-fit items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-3 py-1"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-danger" />
            </span>
            <span className="font-mono text-xs tracking-wide text-danger">THREAT ENGINE ACTIVE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            FraudShield <span className="text-danger">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground"
          >
            Real-time transaction monitoring with explainable risk scoring. Every payment is scanned,
            scored, and traced back to its top contributing signals in milliseconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="rounded-md border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
              MODEL v4.2
            </span>
            <span className="rounded-md border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-success">
              99.2% PRECISION
            </span>
            <span className="rounded-md border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
              SHAP EXPLAINABILITY
            </span>
          </motion.div>
        </div>

        {/* 3D shield */}
        <div className="relative h-52 w-full md:h-64">
          <Shield3D />
        </div>
      </div>
    </section>
  )
}
