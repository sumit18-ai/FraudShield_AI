"use client"

import { ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

function useClock() {
  const [now, setNow] = useState<string>("")
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", { hour12: false }) + " UTC"
    setNow(fmt())
    const id = setInterval(() => setNow(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function TopBar() {
  const clock = useClock()

  return (
    <header className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-danger/15 text-danger">
          <ShieldCheck className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            FraudShield <span className="text-danger">AI</span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Threat Operations Console
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 sm:flex">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="font-mono text-xs text-muted-foreground">All systems nominal</span>
        </div>
        <div className="rounded-md border border-border bg-background/60 px-2.5 py-1.5">
          <span className="font-mono text-xs tabular-nums text-foreground">{clock || "--:--:--"}</span>
        </div>
      </div>
    </header>
  )
}
