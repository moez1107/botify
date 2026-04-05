"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-white text-gray-900">
      {/* Subtle mesh overlay (light version) */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <Image 
          src="/images/mesh-light.svg" // Assume light version bana li ya white tint wali use kar
          alt="mesh background" 
          fill 
          className="object-cover" 
          priority 
        />
      </div>

      {/* Light radial gradients for depth */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.08),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(96,165,250,0.06),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.05),transparent_35%)]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/30 bg-white/60 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200/50 bg-white/70 backdrop-blur-md text-sky-600 shadow-sm">
              <span className="text-lg font-black drop-shadow">5G</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-sky-600 font-medium">5gbotify</p>
              <p className="text-sm text-gray-600">Signal-grade orchestration</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/auth/login">
              <Button 
                variant="outline" 
                className="border-sky-200 bg-white/60 backdrop-blur-md text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button 
                className="bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:brightness-105 transition"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative container mx-auto px-4 py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/50 bg-white/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 shadow-sm">
              Network harvester ready
            </p>
            <h1 className="text-balance text-4xl md:text-5xl font-bold leading-tight text-gray-900">
              Run a <span className="text-sky-600">modern earning</span> surface that feels fresh & clean.
            </h1>
            <p className="text-balance text-lg text-gray-600">
              5gbotify gives you a clean, distraction-free interface with light gradients, glass cards, and soft accents — perfect for tracking referrals & earnings.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="h-12 min-w-[200px] bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:brightness-105 transition"
                >
                  Start boosting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 min-w-[200px] border-sky-200 bg-white/60 backdrop-blur-md text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition"
                >
                  I already have an account
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/65 backdrop-blur-xl border border-white/30 p-5 shadow-md">
                <p className="text-xs uppercase tracking-wider text-gray-600">Latency monitor</p>
                <p className="mt-2 text-2xl font-semibold text-sky-700">42 ms</p>
                <p className="text-sm text-gray-500">Average pipeline handshake time.</p>
              </div>
              <div className="rounded-xl bg-white/65 backdrop-blur-xl border border-white/30 p-5 shadow-md">
                <p className="text-xs uppercase tracking-wider text-gray-600">Crew online</p>
                <p className="mt-2 text-2xl font-semibold text-teal-700">+1,280</p>
                <p className="text-sm text-gray-500">Operators active in the mesh.</p>
              </div>
            </div>
          </div>

          {/* Right side preview */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/60 backdrop-blur-2xl p-8 shadow-2xl shadow-sky-500/10">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-200/20 blur-3xl" />
              <div className="absolute -bottom-14 -right-12 h-40 w-40 rounded-full bg-blue-200/15 blur-3xl" />
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-gray-600">Orbit preview</p>
                  <span className="rounded-md bg-sky-100/70 px-3 py-1 text-[11px] font-semibold text-sky-700 backdrop-blur-sm">
                    alpha ring
                  </span>
                </div>
                <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/30 p-5 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>Boost aperture</span>
                    <span className="font-semibold text-teal-600">Ready</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gray-200/50">
                    <div className="h-full w-5/6 rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-teal-400" />
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Engine tuned for single-tap acceleration.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/70 backdrop-blur-md border border-white/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-600">Cycle ETA</p>
                    <p className="mt-1 text-xl font-semibold text-sky-700">02:14:09</p>
                    <p className="text-xs text-gray-500">Until next auto-open window.</p>
                  </div>
                  <div className="rounded-xl bg-white/70 backdrop-blur-md border border-white/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-600">Throttle</p>
                    <p className="mt-1 text-xl font-semibold text-teal-700">Adaptive</p>
                    <p className="text-xs text-gray-500">Governed by fraud guards.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group rounded-2xl bg-white/65 backdrop-blur-xl border border-white/30 p-8 shadow-xl shadow-sky-500/10 hover:shadow-sky-500/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100/70 text-sky-700 shadow-sm">
                  <Zap className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Signal-first earnings</h3>
                  <p className="text-sm text-gray-600 mt-1">Trigger payouts with clear telemetry and fast feedback.</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-sky-600 opacity-70 transition group-hover:translate-x-2 group-hover:opacity-100" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group rounded-2xl bg-white/65 backdrop-blur-xl border border-white/30 p-8 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100/70 text-blue-700 shadow-sm">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Operational security</h3>
                  <p className="text-sm text-gray-600 mt-1">Layered protections keep payouts clean and auditable.</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-blue-600 opacity-70 transition group-hover:translate-x-2 group-hover:opacity-100" />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}