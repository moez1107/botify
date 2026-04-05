"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, RefreshCw, UserPlus } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { OTPInput } from "@/components/auth/otp-input"
import { formatOTPSuccessMessage, type OTPSuccessPayload } from "@/lib/utils/otp-messages"

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  referralCode: string
}

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [infoMessage, setInfoMessage] = useState("")
  const [step, setStep] = useState<"details" | "otp">("details")
  const [otpValue, setOtpValue] = useState("")
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const fromRef = (searchParams.get("ref") || searchParams.get("referral") || "").trim()
    if (fromRef && !formData.referralCode) {
      setFormData((prev) => ({ ...prev, referralCode: fromRef.toUpperCase() }))
    }
  }, [searchParams])

  useEffect(() => {
    if (otpCountdown <= 0) return

    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [otpCountdown])

  const normalizedEmail = useMemo(() => formData.email.trim().toLowerCase(), [formData.email])

  const resetOTPState = () => {
    setStep("details")
    setOtpValue("")
    setOtpCountdown(0)
    setIsResending(false)
    setInfoMessage("")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (step !== "otp") {
      setInfoMessage("")
    }

    if (step === "details") {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      setIsLoading(true)

      try {
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            purpose: "registration",
          }),
        })

        const data = (await response.json().catch(() => ({}))) as OTPSuccessPayload & { error?: string }

        if (!response.ok) {
          setError(data.message || data.error || "Failed to send verification code")
          return
        }

        setInfoMessage(
          formatOTPSuccessMessage(
            data,
            "Verification code sent to your email. Enter it below to verify your account.",
          ),
        )
        setStep("otp")
        setOtpValue("")
        setOtpCountdown(60)
      } catch (submitError) {
        console.error("Send OTP error", submitError)
        setError("Network error. Please try again.")
      } finally {
        setIsLoading(false)
      }

      return
    }

    if (otpValue.length !== 6) {
      setError("Please enter the 6-digit verification code")
      return
    }

    setIsLoading(true)

    try {
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: otpValue,
          email: normalizedEmail,
          purpose: "registration",
        }),
      })

      const verifyData = await verifyResponse.json().catch(() => ({}))

      if (!verifyResponse.ok) {
        const parsedError = verifyData as { error?: string; message?: string }
        setError(parsedError.message || parsedError.error || "Verification failed")
        return
      }

      const registerResponse = await fetch("/api/auth/register-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: normalizedEmail,
          password: formData.password,
          referralCode: formData.referralCode.trim().toUpperCase(),
          otpCode: otpValue,
        }),
      })

      const registerData = await registerResponse.json().catch(() => ({}))

      if (!registerResponse.ok) {
        const parsedError = registerData as { error?: string; message?: string }
        setError(parsedError?.message || parsedError?.error || "Registration failed")
        return
      }

      router.push("/dashboard")
    } catch (submitError) {
      console.error("Registration with OTP error", submitError)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (isResending || step !== "otp") return

    setError("")
    setInfoMessage("")
    setIsResending(true)

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          purpose: "registration",
        }),
      })

      const data = (await response.json().catch(() => ({}))) as OTPSuccessPayload & { error?: string; message?: string }

      if (!response.ok) {
        setError(data.message || data.error || "Failed to resend code")
        return
      }

      setInfoMessage(formatOTPSuccessMessage(data, "A new verification code has been sent to your email."))
      setOtpValue("")
      setOtpCountdown(60)
    } catch (resendError) {
      console.error("Resend OTP error", resendError)
      setError("Network error. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative isolate w-full overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-sky-50 via-blue-50 to-white shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
      {/* Soft light gradient overlays */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/30 via-transparent to-blue-100/20" />
      </div>
      <div className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-sky-200/20 blur-3xl" />
      <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-blue-200/15 blur-3xl" />

      <div className="relative grid gap-10 p-8 md:grid-cols-[1.05fr,1fr] lg:p-12">
        {/* Left side - welcome info */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 border border-sky-200/50 shadow-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100/70 text-sky-600">
              <UserPlus className="h-4 w-4" />
            </span>
            Start your referral journey
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-gray-900">
              Create an account with a fresh, split-panel experience
            </h1>
            <p className="text-sm leading-relaxed text-gray-600">
              We separated guidance from actions so you can stay focused. Complete your details, verify with email, and secure your referral perks.
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 p-6 shadow-md">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/70 text-sky-700 text-xs font-semibold">1</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Add your details</p>
                <p className="text-xs text-gray-600">Name, email, and a referral code you received.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/70 text-sky-700 text-xs font-semibold">2</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Verify ownership</p>
                <p className="text-xs text-gray-600">We send a short-lived code to your inbox. Enter it to continue.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/70 text-sky-700 text-xs font-semibold">3</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Join the program</p>
                <p className="text-xs text-gray-600">Access the referral dashboard and begin inviting others.</p>
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
              <p className="text-xs uppercase tracking-wider text-gray-600 font-medium">Create Account</p>
              <p className="text-lg font-semibold text-gray-900">Verify and activate your referral profile</p>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-50/80 border-red-200/50 text-red-800 rounded-2xl backdrop-blur-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {infoMessage && (
              <Alert className="bg-sky-50/80 border-sky-200/50 text-sky-800 rounded-2xl backdrop-blur-sm">
                <AlertDescription>{infoMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...prev, name: event.target.value }))
                      if (step === "otp") {
                        resetOTPState()
                      }
                    }}
                    required
                    className="h-12 rounded-xl border-white/40 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 focus:border-sky-400 focus:ring-sky-400/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...prev, email: event.target.value }))
                      if (step === "otp") {
                        resetOTPState()
                      }
                    }}
                    required
                    disabled={step === "otp"}
                    className="h-12 rounded-xl border-white/40 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 focus:border-sky-400 focus:ring-sky-400/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Password
                  </Label>
                  <PasswordInput
                    id="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...prev, password: event.target.value }))
                      if (step === "otp") {
                        resetOTPState()
                      }
                    }}
                    required
                    minLength={6}
                    className="h-12 rounded-xl border-white/40 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 focus:border-sky-400 focus:ring-sky-400/20"
                    disabled={step === "otp"}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Re-enter Password
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))
                      if (step === "otp") {
                        resetOTPState()
                      }
                    }}
                    required
                    minLength={6}
                    className="h-12 rounded-xl border-white/40 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 focus:border-sky-400 focus:ring-sky-400/20"
                    disabled={step === "otp"}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="referralCode" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Referral Code
                </Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="Enter referral code (required)"
                  value={formData.referralCode}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, referralCode: event.target.value.toUpperCase() }))
                    if (step === "otp") {
                      resetOTPState()
                    }
                  }}
                  required
                  disabled={step === "otp"}
                  className="h-12 rounded-xl border-white/40 bg-white/70 backdrop-blur-md text-gray-900 placeholder:text-gray-500 focus:border-sky-400 focus:ring-sky-400/20"
                />
              </div>

              {step === "otp" && (
                <div className="space-y-4 rounded-2xl bg-white/65 backdrop-blur-xl border border-white/30 p-6 shadow-md">
                  <div className="space-y-2 text-center">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Enter the 6-digit code
                    </Label>
                    <OTPInput value={otpValue} onChange={setOtpValue} disabled={isLoading} />
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-600 sm:flex-row">
                    <span>
                      {otpCountdown > 0 ? `New code in ${otpCountdown}s` : "Didn't get the code?"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOTP}
                      disabled={isResending || otpCountdown > 0}
                      className="h-8 px-3 text-sky-600 hover:bg-sky-50 hover:text-sky-700 transition"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> Resending...
                        </>
                      ) : (
                        "Resend code"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {step === "details" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-sky-200 bg-white/60 backdrop-blur-md text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition shadow-sm sm:w-auto"
                    onClick={() => router.push("/auth/forgot")}
                  >
                    Forgot Password?
                  </Button>
                )}

                <Button
                  type="submit"
                  className="h-11 flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:brightness-105 transition-all duration-300 sm:flex-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {step === "details" ? "Sending Code..." : "Verifying..."}
                    </>
                  ) : step === "details" ? (
                    "Send Verification Code"
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>
              </div>
            </form>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline">
                Login instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}