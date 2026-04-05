"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles, Clock4, CheckCircle2 } from "lucide-react"

interface MissionStatus {
  canClaim: boolean
  nextEligibleAt: string | null
  currentBalance: number
  lastRewardAmount?: number | null
  lastClaimedAt?: string | null
  depositTotal?: number
  minDepositRequired?: number
  meetsDepositRequirement?: boolean
}

export function DailyProfitMission() {
  const [status, setStatus] = useState<MissionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cooldownDisplay, setCooldownDisplay] = useState<string>("")

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/missions/daily-profit/status", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load mission status")
      }

      const minDepositRequired = Number(data?.minDepositRequired ?? 50)
      const depositTotal = Number(data?.depositTotal ?? 0)

      setStatus({
        canClaim: Boolean(data.canClaim),
        nextEligibleAt: data.nextEligibleAt ?? null,
        currentBalance: Number(data.currentBalance ?? 0),
        lastRewardAmount: data.lastRewardAmount ?? null,
        lastClaimedAt: data.lastClaimedAt ?? null,
        depositTotal,
        minDepositRequired,
        meetsDepositRequirement:
          typeof data?.meetsDepositRequirement === "boolean"
            ? Boolean(data.meetsDepositRequirement)
            : depositTotal >= minDepositRequired,
      })
    } catch (err: any) {
      setError(err?.message || "Failed to load mission status")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (!status?.nextEligibleAt) {
      setCooldownDisplay("")
      return
    }

    const next = new Date(status.nextEligibleAt).getTime()
    const updateCountdown = () => {
      const now = Date.now()
      const diff = next - now
      if (diff <= 0) {
        setCooldownDisplay("")
        return
      }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setCooldownDisplay(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`,
      )
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [status?.nextEligibleAt])

  const handleComplete = async () => {
    if (!status?.canClaim) return
    if (status.meetsDepositRequirement === false) {
      const minimum = status.minDepositRequired ?? 50
      setError(`Deposit at least $${minimum} to start this mission.`)
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const idKey = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `mission-${Date.now()}`
      const response = await fetch("/api/missions/daily-profit/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idKey,
        },
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setSuccess(data?.message ?? "Rewarded")
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                canClaim: false,
                nextEligibleAt: data?.nextEligibleAt ?? prev.nextEligibleAt,
                currentBalance: Number(data?.newBalance ?? prev.currentBalance),
                lastRewardAmount: Number(data?.rewardAmount ?? prev.lastRewardAmount ?? 0),
                lastClaimedAt: new Date().toISOString(),
              }
            : null,
        )
      } else if (response.status === 403) {
        const message =
          data?.error ?? `Deposit at least $${status?.minDepositRequired ?? 50} to start this mission.`
        setError(message)
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                canClaim: false,
                meetsDepositRequirement: false,
              }
            : prev,
        )
      } else if (response.status === 429 || response.status === 409) {
        setError(data?.error ?? "Cooldown active. Try again later.")
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                canClaim: false,
                nextEligibleAt: data?.nextEligibleAt ?? prev.nextEligibleAt,
              }
            : prev,
        )
      } else {
        setError(data?.error ?? "Unable to complete mission")
      }
    } catch (err: any) {
      setError(err?.message || "Unable to complete mission")
    } finally {
      setSubmitting(false)
    }
  }

  const eligibilityLabel = useMemo(() => {
    if (!status) return ""
    if (status.meetsDepositRequirement === false) {
      const minimum = status.minDepositRequired ?? 50
      const deposited = Number(status.depositTotal ?? 0).toFixed(0)
      return `Deposit $${minimum} (current $${deposited})`
    }
    if (status.canClaim) return "Available now"
    if (cooldownDisplay) return `Cooldown ${cooldownDisplay}`
    return "Refreshing..."
  }, [cooldownDisplay, status])

  const minDepositRequired = status?.minDepositRequired ?? 50
  const depositTotal = status?.depositTotal ?? 0
  const meetsDepositRequirement = status?.meetsDepositRequirement ?? true
  const actionDisabled = !status?.canClaim || submitting || loading || !meetsDepositRequirement

  return (
    <Card className="col-span-full rounded-2xl bg-white/55 backdrop-blur-2xl border border-white/40 shadow-xl shadow-cyan-500/5">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100/70 backdrop-blur-md border border-cyan-200/60 text-cyan-700 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-600 font-medium">Daily Profit Mission</p>
            <span className="text-lg font-semibold text-gray-900">Claim your 2.5% reward</span>
          </div>
        </CardTitle>
        <Badge
          variant={status?.canClaim ? "default" : "outline"}
          className={`text-[11px] backdrop-blur-md ${
            status?.canClaim
              ? "bg-teal-100 text-teal-800 border-teal-200"
              : "bg-gray-100 text-gray-700 border-gray-200"
          }`}
        >
          {eligibilityLabel || "Status"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {error && (
          <Alert variant="destructive" className="bg-red-50/70 backdrop-blur-md border-red-200/50 text-red-800 rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-teal-50/70 backdrop-blur-md border-teal-200/50 text-teal-800 rounded-xl">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Eligibility Block - Glass */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 p-5 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>Eligibility</span>
              <Clock4 className="h-4 w-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {!meetsDepositRequirement ? "Deposit required" : status?.canClaim ? "Available" : cooldownDisplay || "Calculating..."}
            </p>
            <p className="mt-3 text-xs text-gray-600">
              {!meetsDepositRequirement
                ? `Deposit at least $${minDepositRequired.toFixed(0)} to unlock. Current: $${depositTotal.toFixed(2)}.`
                : status?.nextEligibleAt
                  ? `Next eligible: ${new Date(status.nextEligibleAt).toLocaleString()}`
                  : "Complete once every 24 hours."}
            </p>
          </div>

          {/* Last Reward Block - Glass */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 p-5 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>Last reward</span>
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              ${status?.lastRewardAmount !== undefined && status?.lastRewardAmount !== null ? status.lastRewardAmount.toFixed(2) : "0.00"}
            </p>
            <p className="mt-3 text-xs text-gray-600">
              {status?.lastClaimedAt ? `Claimed ${new Date(status.lastClaimedAt).toLocaleString()}` : "No claims yet."}
            </p>
          </div>
        </div>

        {/* Reward Preview Section - Big Glass Block */}
        <div className="rounded-2xl bg-white/55 backdrop-blur-2xl border border-white/35 p-6 shadow-xl shadow-teal-500/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">Reward preview</p>
              <p className="text-xs text-gray-600">2.5% of your current wallet balance added instantly.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 mb-6">
            <div className="rounded-2xl bg-white/65 backdrop-blur-lg border border-white/30 p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>Deposit requirement</span>
                <Badge
                  variant={meetsDepositRequirement ? "secondary" : "destructive"}
                  className={`text-[11px] backdrop-blur-sm ${
                    meetsDepositRequirement ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {meetsDepositRequirement ? "Ready" : "Deposit"}
                </Badge>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                ${depositTotal.toFixed(2)} / ${minDepositRequired.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Deposit at least ${minDepositRequired.toFixed(0)} to start.
              </p>
            </div>

            <div className="rounded-2xl bg-white/65 backdrop-blur-lg border border-white/30 p-5 text-right shadow-sm">
              <p className="text-xs uppercase tracking-wider text-gray-500">Current balance</p>
              <p className="mt-2 text-xl font-semibold text-cyan-700">
                ${status ? status.currentBalance.toFixed(2) : "0.00"}
              </p>
              <p className="mt-2 text-xs text-gray-600">Reward = 2.5% of this balance.</p>
            </div>
          </div>

          <Button
            onClick={() => void handleComplete()}
            disabled={actionDisabled}
            className={`h-12 w-full text-white font-medium rounded-2xl shadow-md transition-all duration-300 ${
              meetsDepositRequirement
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110"
                : "bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {meetsDepositRequirement ? "Complete Mission" : `Deposit $${minDepositRequired.toFixed(0)} to start`}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}