// components/admin/admin-dashboard.tsx
// @ts-nocheck
"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TransactionTable, type TransactionFilters } from "@/components/admin/transaction-table"
import { UserTable, type UserFilters } from "@/components/admin/user-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatNumberWithFallback } from "@/lib/utils/safe-parsing"
import { multiplyAmountByPercent } from "@/lib/utils/numeric"
import type {
  AdminSessionUser,
  AdminStats,
  AdminTransactionRecord,
  AdminUserRecord,
  AdminPlatformSettings,
  AdminWalletSetting,
} from "@/lib/types/admin"
import { Input } from "@/components/ui/input"

type JsonRecord = Record<string, unknown>

interface TransactionsResponse extends JsonRecord {
  data?: AdminTransactionRecord[]
  nextCursor?: string | null
  error?: unknown
}

interface UsersResponse extends JsonRecord {
  data?: AdminUserRecord[]
  nextCursor?: string | null
  error?: unknown
}

interface StatsResponse extends JsonRecord {
  stats?: Partial<AdminStats>
  error?: unknown
}

async function readJsonSafe<T extends JsonRecord>(response: Response): Promise<T | null> {
  try {
    const clone = response.clone()
    const text = await clone.text()
    if (!text) return null

    try {
      return JSON.parse(text) as T
    } catch (parseError) {
      console.error("Failed to parse JSON response", parseError, { preview: text.slice(0, 200) })
      return null
    }
  } catch (error) {
    console.error("Unexpected error while reading response", error)
    return null
  }
}

function normalizeAdminStats(stats: Partial<AdminStats> | null | undefined): Partial<AdminStats> {
  if (!stats || typeof stats !== "object") return {}

  const numericKeys: Array<keyof AdminStats> = [
    "totalUsers",
    "activeUsers",
    "pendingDeposits",
    "pendingWithdrawals",
    "totalDeposits",
    "totalWithdrawals",
  ]

  const safeStats: Partial<AdminStats> = {}
  for (const key of numericKeys) {
    const value = stats[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      safeStats[key] = value
    }
  }

  return safeStats
}

interface AdminDashboardProps {
  initialUser: AdminSessionUser
  initialStats: AdminStats
  initialSettings?: Partial<AdminPlatformSettings>
  initialError?: string | null
}

const TRANSACTION_LIMIT = 50
const USER_LIMIT = 100

export function AdminDashboard({
  initialUser,
  initialStats,
  initialSettings = {},
  initialError = null,
}: AdminDashboardProps) {
  const [user, setUser] = useState(initialUser)
  const [stats, setStats] = useState(initialStats)
  const { toast } = useToast()

  // ── Wallet states ──
  const [walletSettings, setWalletSettings] = useState<AdminWalletSetting[]>(initialSettings.wallets ?? [])
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  // ── Transactions states ──
  const [transactions, setTransactions] = useState<AdminTransactionRecord[]>([])
  const [transactionCursor, setTransactionCursor] = useState<string | null>(null)
  const [transactionHasMore, setTransactionHasMore] = useState(false)
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilters>({})
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(initialError)

  // ── Users states ──
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [userCursor, setUserCursor] = useState<string | null>(null)
  const [userHasMore, setUserHasMore] = useState(false)
  const [userFilters, setUserFilters] = useState<UserFilters>({})
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState<string | null>(initialError)

  // ── Daily Mining Profit states ──
  const safeDaily =
  typeof initialSettings?.dailyProfitPercent === "number"
    ? initialSettings.dailyProfitPercent
    : 1.5
  const [dailyProfitPercent, setDailyProfitPercent] = useState(safeDaily)
  const [dailyProfitDraft, setDailyProfitDraft] = useState(safeDaily.toFixed(2))
  const [dailyProfitBounds] = useState({ min: 0, max: 10 })
  const [dailyProfitLoading, setDailyProfitLoading] = useState(false)
  const [dailyProfitSaving, setDailyProfitSaving] = useState(false)
  const [dailyProfitError, setDailyProfitError] = useState<string | null>(null)

  // ── Team Daily Profit states ──
  const safeTeam = Number.isFinite(Number(initialSettings?.teamDailyProfitPercent))
    ? Number(initialSettings?.teamDailyProfitPercent)
    : null
  const [teamDailyProfitPercent, setTeamDailyProfitPercent] = useState<number | null>(safeTeam)
  const [teamDailyDraft, setTeamDailyDraft] = useState(
    safeTeam !== null ? safeTeam.toFixed(2) : ""
  )
  const [teamDailyBounds] = useState({ min: 0, max: 10 })
  const [teamDailyLoading, setTeamDailyLoading] = useState(false)
  const [teamDailySaving, setTeamDailySaving] = useState(false)
  const [teamDailyError, setTeamDailyError] = useState<string | null>(null)

  const transactionCursorRef = useRef<string | null>(null)
  const transactionLoadingRef = useRef(false)
  const userCursorRef = useRef<string | null>(null)
  const userLoadingRef = useRef(false)
  const lastStatsErrorRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  const dailyProfitDraftExample = useMemo(() => multiplyAmountByPercent(100, dailyProfitDraft), [dailyProfitDraft])
  const savedDailyProfitExample = useMemo(() => multiplyAmountByPercent(100, dailyProfitPercent), [dailyProfitPercent])

  const disableDailySave = dailyProfitSaving || dailyProfitLoading || !dailyProfitDraft.trim() || Number.isNaN(Number(dailyProfitDraft))
  const disableTeamSave = teamDailySaving || teamDailyLoading

  const runIfMounted = useCallback((cb: () => void) => {
    if (isMountedRef.current) cb()
  }, [])

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  // ── Fetch Transactions ──
  const fetchTransactions = useCallback(async ({ reset = false }: { reset?: boolean } = {}) => {
    if (transactionLoadingRef.current) return
    transactionLoadingRef.current = true

    runIfMounted(() => {
      setTransactionLoading(true)
      setTransactionError(null)
    })

    try {
      const query = new URLSearchParams({
        limit: TRANSACTION_LIMIT.toString(),
        ...(reset ? {} : { cursor: transactionCursorRef.current || "" }),
        ...Object.entries(transactionFilters).reduce((acc, [key, value]) => {
          if (value) acc[key] = String(value)
          return acc
        }, {} as Record<string, string>),
      })

      const res = await fetch(`/api/admin/transactions?${query}`, { cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "No response")
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
      }

      const payload = await readJsonSafe<TransactionsResponse>(res)
      if (!payload?.data) throw new Error("No transaction data received")

      runIfMounted(() => {
        setTransactions(prev => (reset ? payload.data! : [...prev, ...payload.data!]))
        setTransactionCursor(payload.nextCursor || null)
        setTransactionHasMore(!!payload.nextCursor)
        transactionCursorRef.current = payload.nextCursor || null
      })
    } catch (err: any) {
      const msg = err.message || "Failed to load transactions"
      runIfMounted(() => setTransactionError(msg))
      toast({ variant: "destructive", description: msg })

      // Mock data fallback (temporary)
      runIfMounted(() => {
        setTransactions([
          { id: "mock1", amount: 100, type: "deposit", status: "completed", createdAt: new Date().toISOString() },
          { id: "mock2", amount: 50, type: "withdrawal", status: "pending", createdAt: new Date().toISOString() },
        ])
        setTransactionHasMore(false)
      })
    } finally {
      runIfMounted(() => setTransactionLoading(false))
      transactionLoadingRef.current = false
    }
  }, [runIfMounted, toast, transactionFilters])

  // ── Fetch Users ──
  const fetchUsers = useCallback(async ({ reset = false }: { reset?: boolean } = {}) => {
    if (userLoadingRef.current) return
    userLoadingRef.current = true

    runIfMounted(() => {
      setUserLoading(true)
      setUserError(null)
    })

    try {
      const query = new URLSearchParams({
        limit: USER_LIMIT.toString(),
        ...(reset ? {} : { cursor: userCursorRef.current || "" }),
        ...Object.entries(userFilters).reduce((acc, [key, value]) => {
          if (value) acc[key] = String(value)
          return acc
        }, {} as Record<string, string>),
      })

      const res = await fetch(`/api/admin/users?${query}`, { cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "No response")
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
      }

      const payload = await readJsonSafe<UsersResponse>(res)
      if (!payload?.data) throw new Error("No user data received")

      runIfMounted(() => {
        setUsers(prev => (reset ? payload.data! : [...prev, ...payload.data!]))
        setUserCursor(payload.nextCursor || null)
        setUserHasMore(!!payload.nextCursor)
        userCursorRef.current = payload.nextCursor || null
      })
    } catch (err: any) {
      const msg = err.message || "Failed to load users"
      runIfMounted(() => setUserError(msg))
      toast({ variant: "destructive", description: msg })

      // Mock data fallback (temporary)
      runIfMounted(() => {
        setUsers([
          { id: "mock1", email: "user1@example.com", name: "User One", createdAt: new Date().toISOString() },
          { id: "mock2", email: "user2@example.com", name: "User Two", createdAt: new Date().toISOString() },
        ])
        setUserHasMore(false)
      })
    } finally {
      runIfMounted(() => setUserLoading(false))
      userLoadingRef.current = false
    }
  }, [runIfMounted, toast, userFilters])

  // ── Fetch Daily Profit ──
  const fetchDailyProfitSettings = useCallback(async () => {
    runIfMounted(() => {
      setDailyProfitLoading(true)
      setDailyProfitError(null)
    })

    try {
      const res = await fetch("/api/admin/settings/daily-profit-percent", { cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "No response")
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
      }

      const payload = await readJsonSafe<{ dailyProfitPercent?: number }>(res)
      const percent = Number(payload?.dailyProfitPercent)
      if (Number.isFinite(percent)) {
        runIfMounted(() => {
          setDailyProfitPercent(percent)
          setDailyProfitDraft(percent.toFixed(2))
        })
      }
    } catch (err: any) {
      const msg = err.message || "Cannot load daily profit percent"
      runIfMounted(() => setDailyProfitError(msg))
      toast({ variant: "destructive", description: msg })
    } finally {
      runIfMounted(() => setDailyProfitLoading(false))
    }
  }, [runIfMounted, toast])

  // ── Fetch Team Daily Profit ──
  const fetchTeamDailyProfitSettings = useCallback(async () => {
    runIfMounted(() => {
      setTeamDailyLoading(true)
      setTeamDailyError(null)
    })

    try {
      const res = await fetch("/api/admin/settings/team-daily-profit-percent", { cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "No response")
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
      }

      const payload = await readJsonSafe<{ teamDailyProfitPercent?: number | null }>(res)
      const percent = payload?.teamDailyProfitPercent ?? null
      runIfMounted(() => {
        setTeamDailyProfitPercent(percent)
        setTeamDailyDraft(percent !== null ? percent.toFixed(2) : "")
      })
    } catch (err: any) {
      const msg = err.message || "Cannot load team daily profit"
      runIfMounted(() => setTeamDailyError(msg))
      toast({ variant: "destructive", description: msg })
    } finally {
      runIfMounted(() => setTeamDailyLoading(false))
    }
  }, [runIfMounted, toast])

  // ── Fetch Wallet Settings ──
  const fetchWalletSettings = useCallback(async () => {
    runIfMounted(() => {
      setWalletLoading(true)
      setWalletError(null)
    })

    try {
      const res = await fetch("/api/admin/settings/wallets", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load wallets")
      const payload = await readJsonSafe<{ wallets?: AdminWalletSetting[] }>(res)
      runIfMounted(() => setWalletSettings(payload?.wallets ?? []))
    } catch (err: any) {
      runIfMounted(() => setWalletError(err.message || "Wallet load failed"))
    } finally {
      runIfMounted(() => setWalletLoading(false))
    }
  }, [runIfMounted])

  // ── Fetch Stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" })
      if (!res.ok) throw new Error("Stats load failed")
      const payload = await readJsonSafe<StatsResponse>(res)
      const normalized = normalizeAdminStats(payload?.stats)
      runIfMounted(() => setStats(prev => ({ ...prev, ...normalized })))
      lastStatsErrorRef.current = null
    } catch (err: any) {
      const msg = err.message || "Stats load failed"
      if (lastStatsErrorRef.current !== msg) {
        toast({ variant: "destructive", description: msg })
        lastStatsErrorRef.current = msg
      }
    }
  }, [runIfMounted, toast])

  // ── Refresh All ──
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchDailyProfitSettings(),
      fetchTeamDailyProfitSettings(),
      fetchWalletSettings(),
      fetchStats(),
      fetchTransactions({ reset: true }),
      fetchUsers({ reset: true }),
    ])
  }, [
    fetchDailyProfitSettings,
    fetchTeamDailyProfitSettings,
    fetchWalletSettings,
    fetchStats,
    fetchTransactions,
    fetchUsers,
  ])

  // ── Initial Load ──
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto md:ml-64">
        <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Monitor platform performance and review user activity.</p>
            </div>
            <Button variant="secondary" className="gap-2" onClick={refreshAll} disabled={transactionLoading || userLoading}>
              {transactionLoading || userLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={stats.totalUsers} />
            <StatCard label="Active users" value={stats.activeUsers} />
            <StatCard label="Pending deposits" value={stats.pendingDeposits} />
            <StatCard label="Pending withdrawals" value={stats.pendingWithdrawals} />
          </div>

          {/* Daily Mining Profit */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Mining Profit Rate</CardTitle>
              <CardDescription>Platform-wide daily mining payout percentage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={async (e: FormEvent) => {
                  e.preventDefault()
                  if (disableDailySave) return
                  setDailyProfitSaving(true)
                  try {
                    const res = await fetch("/api/admin/settings/daily-profit-percent", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ percent: Number(dailyProfitDraft) }),
                    })
                    if (!res.ok) {
                      const text = await res.text().catch(() => "No response")
                      throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
                    }
                    const data = await readJsonSafe<{ dailyProfitPercent?: number }>(res)
                    const newPercent = Number(data?.dailyProfitPercent)
                    if (Number.isFinite(newPercent)) {
                      runIfMounted(() => {
                        setDailyProfitPercent(newPercent)
                        setDailyProfitDraft(newPercent.toFixed(2))
                        toast({ description: `Updated to ${newPercent.toFixed(2)}%` })
                      })
                    }
                  } catch (err: any) {
                    runIfMounted(() => {
                      toast({ variant: "destructive", description: err.message || "Update failed" })
                    })
                  } finally {
                    runIfMounted(() => setDailyProfitSaving(false))
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 max-w-xs">
                    <label className="text-sm font-medium block mb-1.5">Daily profit %</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={dailyProfitBounds.min}
                      max={dailyProfitBounds.max}
                      value={dailyProfitDraft}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setDailyProfitDraft(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={disableDailySave}>
                      {dailyProfitSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchDailyProfitSettings}
                      disabled={dailyProfitLoading || dailyProfitSaving}
                    >
                      {dailyProfitLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-3 space-y-1">
                  <p>Current: <strong>{dailyProfitPercent.toFixed(2)}%</strong> → $100 = ${savedDailyProfitExample.toFixed(2)}</p>
                  <p>Preview: $100 = ${dailyProfitDraftExample.toFixed(2)} (range: {dailyProfitBounds.min}%–{dailyProfitBounds.max}%)</p>
                </div>
                {dailyProfitError && <p className="text-destructive text-sm mt-2">{dailyProfitError}</p>}
              </form>
            </CardContent>
          </Card>

          {/* Team Daily Profit */}
          <Card>
            <CardHeader>
              <CardTitle>Team Daily Profit Rate (Override)</CardTitle>
              <CardDescription>Optional override — leave blank for level-based defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={async (e: FormEvent) => {
                  e.preventDefault()
                  if (disableTeamSave) return
                  setTeamDailySaving(true)
                  try {
                    const trimmed = teamDailyDraft.trim()
                    const body = trimmed === "" ? { percent: null } : { percent: Number(trimmed) }
                    const res = await fetch("/api/admin/settings/team-daily-profit-percent", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    })
                    if (!res.ok) {
                      const text = await res.text().catch(() => "No response")
                      throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
                    }
                    const data = await readJsonSafe<{ teamDailyProfitPercent?: number | null }>(res)
                    const newPercent = data?.teamDailyProfitPercent ?? null
                    runIfMounted(() => {
                      setTeamDailyProfitPercent(newPercent)
                      setTeamDailyDraft(newPercent !== null ? newPercent.toFixed(2) : "")
                      toast({
                        description: newPercent === null
                          ? "Override removed (using defaults)"
                          : `Set to ${newPercent.toFixed(2)}%`
                      })
                    })
                  } catch (err: any) {
                    runIfMounted(() => {
                      toast({ variant: "destructive", description: err.message || "Update failed" })
                    })
                  } finally {
                    runIfMounted(() => setTeamDailySaving(false))
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 max-w-xs">
                    <label className="text-sm font-medium block mb-1.5">Team daily profit %</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={teamDailyBounds.min}
                      max={teamDailyBounds.max}
                      value={teamDailyDraft}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTeamDailyDraft(e.target.value)}
                      placeholder="Leave blank for defaults"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={disableTeamSave}>
                      {teamDailySaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchTeamDailyProfitSettings}
                      disabled={teamDailyLoading || teamDailySaving}
                    >
                      {teamDailyLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-3 space-y-1">
                  <p>
                    Current: {teamDailyProfitPercent === null ? (
                      <strong>Disabled (defaults)</strong>
                    ) : (
                      <strong>{teamDailyProfitPercent.toFixed(2)}%</strong>
                    )}
                  </p>
                  <p>
                    Preview: {teamDailyDraft.trim() ? `$100 → ${multiplyAmountByPercent(100, Number(teamDailyDraft)).toFixed(2)}` : "—"}
                  </p>
                  <p>Clear input to use level-based defaults.</p>
                </div>
                {teamDailyError && <p className="text-destructive text-sm mt-2">{teamDailyError}</p>}
              </form>
            </CardContent>
          </Card>

          {/* Wallet Addresses */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Wallet Addresses</CardTitle>
              </div>
              <CardDescription>Deposit wallet addresses (managed via environment variables)</CardDescription>
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : walletSettings.length === 0 ? (
                <p className="text-muted-foreground text-sm">No wallet addresses configured in the environment.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {walletSettings.map(w => (
                    <div key={w.id} className="space-y-2">
                      <label className="text-sm font-medium">{w.label}</label>
                      <Input
                        value={w.address || "Not configured"}
                        readOnly
                        disabled
                        className="font-mono text-sm"
                      />
                      <div className="text-xs text-muted-foreground">
                        <p>Network: {w.network || "Unknown"}</p>
                        <p>Source: {w.source === "env" ? "Environment" : "Unknown"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {walletError && <p className="text-destructive text-sm mt-4">{walletError}</p>}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={fetchWalletSettings}
                  disabled={walletLoading}
                >
                  {walletLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <TransactionTable
            items={transactions}
            loading={transactionLoading}
            error={transactionError}
            hasMore={transactionHasMore}
            onLoadMore={() => fetchTransactions()}
            onRefresh={() => fetchTransactions({ reset: true })}
            filters={transactionFilters}
            onFiltersChange={setTransactionFilters}
            onExport={() => {
              toast({ description: "Export feature coming soon!" })
            }}
          />

          {/* Users Table */}
          <UserTable
            items={users}
            loading={userLoading}
            error={userError}
            hasMore={userHasMore}
            onLoadMore={() => fetchUsers()}
            onRefresh={() => fetchUsers({ reset: true })}
            filters={userFilters}
            onFiltersChange={setUserFilters}
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: unknown }) {
  const formatted = formatNumberWithFallback(value, "0")
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatted}</div>
      </CardContent>
    </Card>
  )
}