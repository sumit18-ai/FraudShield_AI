"use client"

import { generateTransaction, seedTransactions } from "@/lib/fraud-data"
import type { Transaction } from "@/lib/fraud-types"
import { motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { CustomCursor } from "./custom-cursor"
import { DetailsPanel } from "./details-panel"
import { Hero } from "./hero"
import { LiveFeed } from "./live-feed"
import { StatCards } from "./stat-cards"
import { TopBar } from "./top-bar"

const MAX_FEED = 40

export function FraudDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [paused, setPaused] = useState(false)
  const [totalScanned, setTotalScanned] = useState(0)
  const [fraudDetected, setFraudDetected] = useState(0)

  // Seed the feed once on mount so SSR/CSR stay consistent.
  useEffect(() => {
    async function seed() {
      try {
        const seedData = await seedTransactions(12)
        setTransactions(seedData)
        setTotalScanned(seedData.length)
        setFraudDetected(seedData.filter((t) => t.level === "fraud").length)
      } catch (err) {
        console.error("Failed to seed transactions", err)
      }
    }
    seed()
  }, [])

  const pausedRef = useRef(paused)
  pausedRef.current = paused

  // Simulated live stream from the scoring API.
  useEffect(() => {
    const interval = setInterval(
      async () => {
        if (pausedRef.current) return
        try {
          const txn = await generateTransaction()
          setTransactions((prev) => [txn, ...prev].slice(0, MAX_FEED))
          setTotalScanned((n) => n + 1)
          if (txn.level === "fraud") setFraudDetected((n) => n + 1)
        } catch (err) {
          console.error("Error generating transaction", err)
        }
      },
      1600 + Math.random() * 900,
    )
    return () => clearInterval(interval)
  }, [])

  const handleSelect = useCallback((t: Transaction) => setSelected(t), [])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <CustomCursor />

      <TopBar />

      <Hero />

      <StatCards
        totalScanned={totalScanned}
        fraudDetected={fraudDetected}
        accuracyRate={99.2}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]"
      >
        <LiveFeed
          transactions={transactions}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
        />
        <DetailsPanel transaction={selected} />
      </motion.div>
    </div>
  )
}
