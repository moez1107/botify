"use client"

import { type FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, UserRoundPlus } from "lucide-react"

import { useTopLoader } from "@/components/top-loader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LoginFormData {
  email: string
  password: string
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { startTask, stopTask } = useTopLoader()
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [blockedModalOpen, setBlockedModalOpen] = useState(false)

  const sanitizeMessage = (message: string | null | undefined) => {
    if (!message) return ""
    const text = message.trim()
    if (!text) return ""
    const withoutTags = text.replace(/<[^>]*>/g, "").trim()
    return withoutTags || ""
  }

  useEffect(() => {
    if (searchParams?.get("blocked")) {
      setBlockedModalOpen(true)
    }
  }, [searchParams])

  const handleContactSupport = () => {
    setBlockedModalOpen(false)
    router.push("/support")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    startTask()
    try {
      let identifier = formData.email.trim().toLowerCase()
      if (!identifier) {
        setError("Email is required")
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          identifierType: "email",
          password: formData.password,
        }),
      })

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
      let parsed: Record<string, unknown> | null = null
      let fallbackText = ""

      if (contentType.includes("application/json")) {
        parsed = (await response.json().catch(() => null)) as Record<string, unknown> | null
      } else {
        fallbackText = (await response.text().catch(() => "")) || ""
      }

      const success = Boolean(parsed?.success)

      if (response.status === 403 && parsed?.blocked) {
        setBlockedModalOpen(true)
        setError("")
        return
      }

      if (!response.ok || !success) {
        const backendMessage =
          (typeof parsed?.error === "string" && parsed.error) ||
          (typeof parsed?.message === "string" && parsed.message) ||
          fallbackText

        const fallbackMessage =
          response.status === 401 || response.status === 403
            ? "Incorrect email or password."
            : "Login failed. Please try again."

        setError(sanitizeMessage(backendMessage) || fallbackMessage)
        return
      }

      router.replace("/dashboard")
      router.refresh()
    } catch (submitError) {
      console.error("Login error", submitError)
      const message =
        submitError instanceof Error && submitError.name !== "AbortError"
          ? submitError.message
          : ""

      if (message && /fetch failed|network|request|failed to fetch/i.test(message)) {
        setError("Server not reachable. Please try later.")
      } else if (message) {
        setError(message)
      } else {
        setError("Server not reachable. Please try later.")
      }
    } finally {
      stopTask()
      setIsLoading(false)
    }
  }

  return (
    <div className="relative isolate w-full overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-sky-50 via-blue-50 to-white shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
      {/* Subtle light gradient overlays */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/30 via-transparent to-blue-100/20" />
      </div>
      <div className="absolute -left-20 top-12 h-52 w-52 rounded-full bg-sky-200/20 blur-3xl" />
      <div className="absolute -right-24 -top-16 h-60 w-60 rounded-full bg-blue-200/15 blur-3xl" />

      <div className="relative grid gap-10 p-8 md:grid-cols-[1fr,1.05fr] lg:p-12">
        {/* Left side - welcome info */}
        <div className="space-y-6 md:self-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 border border-sky-200/50 shadow-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100/70 text-sky-600">
              <UserRoundPlus className="h-4 w-4" />
            </span>
            Sign in to referrals
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-gray-900">
              Modern, distraction-free login for your referral dashboard
            </h1>
            <p className="text-sm leading-relaxed text-gray-600">
              Sign in with your email and pick up right where you left off. One clean, secure session—no phone details needed.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 p-5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-100/70 backdrop-blur-sm" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">Adaptive security</p>
                <p className="text-xs text-gray-600">We detect blocked accounts early to protect your referrals.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - actual form */}
        <div className="relative rounded-3xl bg-white/65 backdrop-blur-2xl border border-white/40 p-8 shadow-xl shadow-sky-500/10">
          <div className="absolute right-6 top-6 h-10 w-10 rounded-full bg-sky-100/30 blur-xl" />
          <div className="absolute left-4 bottom-6 h-10 w-10 rounded-full bg-blue-100/20 blur-xl" />
          <div className="relative space-y-6">
            <div className="space-y-1 text-left">
              <p className="text-xs uppercase tracking-wider text-gray-600 font-medium">Login</p>
              <p className="text-lg font-semibold text-gray-900">Access your referral space</p>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-50/80 border-red-200/50 text-red-800 rounded-2xl backdrop-blur-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  className="h-12 rounded-xl border-white/40 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 focus:border-sky-400 focus:ring-sky-400/20"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  className="h-12 rounded-xl border-white/40 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 focus:border-sky-400 focus:ring-sky-400/20"
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/auth/forgot"
                  className="text-sm font-medium text-sky-600 underline-offset-4 transition hover:text-sky-700 hover:underline"
                >
                  Forgot Password?
                </Link>
                <div className="flex w-full gap-3 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-sky-200 bg-white/60 backdrop-blur-md text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition shadow-sm sm:flex-none"
                    onClick={() => router.push("/auth/register")}
                  >
                    Create Account
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:brightness-105 transition-all duration-300 sm:flex-none"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Dialog open={blockedModalOpen} onOpenChange={setBlockedModalOpen}>
        <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl shadow-sky-500/10">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Account Blocked</DialogTitle>
            <DialogDescription className="text-gray-600">
              Your account has been blocked by an administrator. For more information, contact Support.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button onClick={handleContactSupport} className="w-full bg-sky-500 hover:bg-sky-600 text-white">
              Contact Support
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}