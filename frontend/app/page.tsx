import { FraudDashboard } from "@/components/dashboard/fraud-dashboard"

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient background: radial glows + fine grid for a control-room feel */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(60rem 40rem at 85% -10%, color-mix(in oklch, var(--danger) 14%, transparent), transparent 70%), radial-gradient(50rem 40rem at 0% 100%, color-mix(in oklch, var(--chart-3) 10%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 100% 80% at 50% 0%, black, transparent 75%)",
        }}
        aria-hidden
      />
      <div className="relative z-10">
        <FraudDashboard />
      </div>
    </main>
  )
}
