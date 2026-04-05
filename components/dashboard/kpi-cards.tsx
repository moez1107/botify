"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet, DollarSign, ArrowDownToLine, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardsProps {
  kpis: {
    totalEarning: number
    totalBalance: number
    currentBalance: number
    activeMembers: number
    totalWithdraw: number
    pendingWithdraw: number
    teamReward: number
    teamRewardToday?: number
  }
}

export function KPICards({ kpis }: KPICardsProps) {
  const formatCurrency = (amount: number) =>
    amount.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const cards = [
    {
      title: "Lifetime Yield",
      subtitle: "Cumulative network payouts",
      value: formatCurrency(kpis.totalEarning),
      icon: TrendingUp,
      tone: "text-teal-700",
      badge: "bg-teal-100 text-teal-800 border-teal-200",
    },
    {
      title: "Vault Balance",
      value: formatCurrency(kpis.totalBalance),
      subtitle: "All secured funds",
      icon: Wallet,
      tone: "text-cyan-700",
      badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    },
    {
      title: "Inst. Withdrawable",
      value: formatCurrency(kpis.currentBalance),
      subtitle: "Ready for cash out",
      icon: DollarSign,
      tone: "text-sky-700",
      badge: "bg-sky-100 text-sky-800 border-sky-200",
    },
    {
      title: "Total Payouts Sent",
      value: formatCurrency(kpis.totalWithdraw),
      subtitle: "Completed disbursements",
      icon: ArrowDownToLine,
      tone: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      title: "Payouts in Queue",
      value: formatCurrency(kpis.pendingWithdraw),
      subtitle: "Processing pipeline",
      icon: Clock,
      tone: "text-pink-700",
      badge: "bg-pink-100 text-pink-800 border-pink-200",
    },
  ]

  return (
    <div className="mb-6 grid gap-5 md:gap-6 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="group relative h-full overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-cyan-500/10 transition-all hover:-translate-y-1 hover:shadow-cyan-500/20"
        >
          {/* Subtle light gradient overlay for polish */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/20 via-sky-100/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400/30 via-teal-400/30 to-sky-400/30 rounded-b-2xl" />
          </div>

          <div className="relative flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-gray-900">{card.title}</CardTitle>
                <p className="text-xs text-gray-600">{card.subtitle ?? "Live synced with backend"}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm text-cyan-600">
                <card.icon className="h-5 w-5" />
              </div>
            </div>

            <div className={`text-2xl font-bold tracking-tight ${card.tone}`}>
              {card.value}
            </div>

            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-gray-500">
              <span>live feed</span>
              <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold backdrop-blur-sm border", card.badge)}>
                synced
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}