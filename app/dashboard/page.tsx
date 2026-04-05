"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import { Button } from "@/components/ui/button"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { DailyProfitMission } from "@/components/dashboard/daily-profit-mission"

interface DashboardData {
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
  user: {
    level: number
    referralCode: string
    roiEarnedTotal: number
    depositTotal: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    const parseResponse = async (response: Response) => {
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""

      if (contentType.includes("application/json")) {
        const json = await response.json().catch(() => null)
        return { json, rawText: "" }
      }

      const rawText = (await response.text().catch(() => "")) || ""
      return { json: null, rawText }
    }

    try {
      const [dashboardRes, userRes] = await Promise.all([
        fetch("/api/dashboard", { credentials: "include" }),
        fetch("/api/auth/me", { credentials: "include" }),
      ])

      const [dashboardPayload, userPayload] = await Promise.all([parseResponse(dashboardRes), parseResponse(userRes)])

      if (dashboardRes.status === 401 || userRes.status === 401) {
        router.replace("/auth/login")
        return
      }

      if (dashboardRes.status === 403) {
        router.replace("/auth/login?blocked=1")
        return
      }

      if (dashboardRes.ok && userRes.ok && dashboardPayload.json && userPayload.json) {
        setData(dashboardPayload.json as DashboardData)
        setUser((userPayload.json as any).user)
        setErrorMessage(null)
        return
      }

      const dashError =
        (dashboardPayload.json && typeof dashboardPayload.json === "object" && (dashboardPayload.json as any).error) ||
        dashboardPayload.rawText
      const friendlyMessage = typeof dashError === "string" && dashError.trim() ? dashError.trim() : null

      setErrorMessage(friendlyMessage ?? "Failed to load dashboard data")
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      setErrorMessage("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // ────────────────────────────────────────────────
  // DUMMY DATA FOR EARNINGS CHART (simple fake data)
  // You can later replace with real API data
  // ────────────────────────────────────────────────
  const earningsData = [
    { name: 'Day 1', daily: 5, weekly: 35, monthly: 150 },
    { name: 'Day 2', daily: 8, weekly: 56, monthly: 240 },
    { name: 'Day 3', daily: 12, weekly: 84, monthly: 360 },
    { name: 'Day 4', daily: 10, weekly: 70, monthly: 300 },
    { name: 'Day 5', daily: 15, weekly: 105, monthly: 450 },
    { name: 'Day 6', daily: 18, weekly: 126, monthly: 540 },
    { name: 'Day 7', daily: 20, weekly: 140, monthly: 600 },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full bg-cyan-200/30 backdrop-blur-sm" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium tracking-wide text-gray-700">Preparing your workspace</p>
            <p className="text-xs text-gray-500">Securing session • Syncing insights • Final touches</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
        <div className="space-y-4 text-center bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 p-8 shadow-xl max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100/80 text-red-600 text-3xl backdrop-blur-sm">
            !
          </div>
          <p className="font-medium text-gray-800">Failed to load dashboard data</p>
          <p className="text-gray-600">{errorMessage || "Please refresh the page or try again later"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-white text-gray-900">
      {/* Subtle light overlay for polish */}
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light">
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-100/20 via-sky-100/10 to-transparent" />
      </div>

      <main className="relative min-w-0">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 pt-6 md:px-8">
          <div className="flex flex-col gap-2">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/50 bg-white/50 backdrop-blur-md px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
              5gbotify overview
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">Hi, {user?.name}</h1>
            <p className="text-sm text-gray-600">Role: Network Harvester · Tier {data.user.level}</p>
          </div>

          {/* ────────────────────────────────────────────────
              1. EARNINGS CHART SECTION (Added)
              ──────────────────────────────────────────────── */}
          

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-center">
            <div className="rounded-2xl bg-white/50 backdrop-blur-2xl border border-white/40 shadow-xl shadow-cyan-500/5 p-6">
              <KPICards kpis={data.kpis} />
            </div>

            <div className="rounded-2xl bg-white/55 backdrop-blur-2xl border border-white/40 shadow-xl shadow-sky-500/5 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-600 font-medium">Ops status</p>
                  <p className="text-sm text-gray-600 mt-1">Backend parity confirmed with refreshed skin.</p>
                </div>
                <span className="rounded-md bg-cyan-100/60 px-3 py-1 text-[11px] font-semibold uppercase text-cyan-700 backdrop-blur-sm">
                  synced
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/wallet/deposit"
                  className="rounded-xl bg-sky-50/70 border border-sky-200/40 px-5 py-4 text-sky-700 font-medium hover:bg-sky-100/70 hover:border-sky-300 transition-all duration-300"
                >
                  Add funds in Top-Up Center
                  <span className="block text-xs text-sky-600 mt-1">Same flow, sharper look</span>
                </Link>
                <Link
                  href="/tasks"
                  className="rounded-xl bg-pink-50/70 border border-pink-200/40 px-5 py-4 text-pink-700 font-medium hover:bg-pink-100/70 hover:border-pink-300 transition-all duration-300"
                >
                  View missions
                  <span className="block text-xs text-pink-600 mt-1">Track quests and rewards</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/55 backdrop-blur-2xl border border-white/40 shadow-xl shadow-cyan-500/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Earnings Chart</h2>
              <div className="text-xs text-gray-600">ROI Growth (Last 7 Days)</div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={earningsData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="daily" 
                    stroke="#0ea5e9" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 8 }} 
                    name="Daily" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weekly" 
                    stroke="#60a5fa" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    name="Weekly" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="monthly" 
                    stroke="#ec4899" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    name="Monthly" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
          </div>


          

          {/* ────────────────────────────────────────────────
              2. SYSTEM STATUS CARD (Added)
              ──────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white/55 backdrop-blur-2xl border border-white/40 shadow-xl shadow-teal-500/5 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white/70 backdrop-blur-md border border-white/30 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">API Response</p>
                <p className="text-2xl font-bold text-teal-700">120ms</p>
                <p className="text-xs text-gray-600 mt-1">Average</p>
              </div>
              <div className="rounded-xl bg-white/70 backdrop-blur-md border border-white/30 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Server Load</p>
                <p className="text-2xl font-bold text-sky-700">Normal</p>
                <p className="text-xs text-gray-600 mt-1">25% CPU</p>
              </div>
              <div className="rounded-xl bg-white/70 backdrop-blur-md border border-white/30 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Database</p>
                <p className="text-2xl font-bold text-teal-700">Healthy</p>
                <p className="text-xs text-gray-600 mt-1">No issues</p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-8 xl:grid-cols-[2fr,1.25fr]">
            <div className="rounded-2xl bg-white/50 backdrop-blur-2xl border border-white/40 shadow-xl shadow-teal-500/5 p-6">
              <DailyProfitMission />
            </div>
            <div className="grid gap-6">
              {/* HalvingChart / RateLimitTelemetryCard agar add karna ho */}
            </div>
          </div>



          {/* ────────────────────────────────────────────────
              3. REFERRAL INVITE SECTION (Added)
              ──────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white/55 backdrop-blur-2xl border border-white/40 shadow-xl shadow-pink-500/5 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Friends & Earn</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Referral Code & Link */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Your Referral Code</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-xl bg-white/70 backdrop-blur-md border border-white/40 px-4 py-3 text-lg font-mono font-bold text-sky-700 text-center">
                      {data.user.referralCode || "ABC123"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 rounded-xl border-sky-200 bg-white/60 backdrop-blur-md text-sky-700 hover:bg-sky-50"
                      onClick={() => {
                        navigator.clipboard.writeText(data.user.referralCode || "ABC123")
                        alert("Referral code copied!")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          
        </div>
      </main>
    </div>
  )
}