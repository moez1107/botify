"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { PRIMARY_NAV_ITEMS, ADMIN_NAV_ITEM } from "@/components/layout/nav-config"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface MobileNavDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorRef: React.RefObject<HTMLButtonElement>
}

interface DrawerUser {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string | null
}

export function MobileNavDrawer({ open, onOpenChange, anchorRef }: MobileNavDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)
  const [user, setUser] = useState<DrawerUser | null>(null)
  const scrollYRef = useRef(0)
  const isBodyLockedRef = useRef(false)
  const titleId = useId()
  const liveRegionRef = useRef<HTMLDivElement | null>(null)
  const hasFetchedUser = useRef(false)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
    }
  }, [open])

  useEffect(() => {
    if (open && !hasFetchedUser.current) {
      hasFetchedUser.current = true
      setIsLoadingUser(true)
      void fetch("/api/auth/me")
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to load user")
          }
          const data = (await response.json()) as { user?: DrawerUser }
          if (data.user) {
            setUser(data.user)
          }
          setUserError(null)
        })
        .catch((error) => {
          console.error(error)
          setUserError("Unable to load account details")
        })
        .finally(() => {
          setIsLoadingUser(false)
        })
    }
  }, [open])

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = open ? "Navigation drawer opened" : "Navigation drawer closed"
    }
  }, [open, shouldRender])

  useEffect(() => {
    const body = document.body

    if (open) {
      scrollYRef.current = window.scrollY
      body.style.top = `-${scrollYRef.current}px`
      body.style.position = "fixed"
      body.style.width = "100%"
      isBodyLockedRef.current = true
    } else if (isBodyLockedRef.current) {
      body.style.removeProperty("position")
      body.style.removeProperty("top")
      body.style.removeProperty("width")
      window.scrollTo({ top: scrollYRef.current })
      isBodyLockedRef.current = false
    }

    return () => {
      body.style.removeProperty("position")
      body.style.removeProperty("top")
      body.style.removeProperty("width")
      if (isBodyLockedRef.current) {
        window.scrollTo({ top: scrollYRef.current })
        isBodyLockedRef.current = false
      }
    }
  }, [open])

  const previousPathnameRef = useRef(pathname)

  useEffect(() => {
    if (pathname !== previousPathnameRef.current) {
      previousPathnameRef.current = pathname

      if (open) {
        onOpenChange(false)
      }
    }
  }, [pathname, open, onOpenChange])

  const initials = useMemo(() => {
    if (!user?.name) {
      return ""
    }
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join("")
  }, [user?.name])

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      onOpenChange(false)
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error", error)
    }
  }, [onOpenChange, router])

  const linkClasses = useCallback(
    (isActive: boolean) =>
      cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
        "ring-offset-white/50",
        isActive
          ? "bg-white/70 text-sky-700 shadow-sm backdrop-blur-sm"
          : "text-gray-700 hover:bg-white/50 hover:text-sky-600 hover:shadow-sm hover:backdrop-blur-sm",
      ),
    [],
  )

  const renderNavItems = () => (
    <ul className="space-y-1">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={item.href === "/team" ? true : undefined}
              onClick={() => onOpenChange(false)}
              className={linkClasses(isActive)}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-5 w-5 text-gray-600" aria-hidden />
              <span className="truncate">{item.name}</span>
            </Link>
          </li>
        )
      })}
      {user?.role === "admin" && (
        <li key={ADMIN_NAV_ITEM.href}>
          <Link
            href={ADMIN_NAV_ITEM.href}
            prefetch={ADMIN_NAV_ITEM.href === "/team" ? true : undefined}
            onClick={() => onOpenChange(false)}
            className={linkClasses(
              pathname === ADMIN_NAV_ITEM.href || pathname.startsWith(`${ADMIN_NAV_ITEM.href}/`),
            )}
            aria-current={
              pathname === ADMIN_NAV_ITEM.href || pathname.startsWith(`${ADMIN_NAV_ITEM.href}/`)
                ? "page"
                : undefined
            }
          >
            <ADMIN_NAV_ITEM.icon className="h-5 w-5 text-gray-600" aria-hidden />
            <span className="truncate">{ADMIN_NAV_ITEM.name}</span>
          </Link>
        </li>
      )}
    </ul>
  )

  if (!shouldRender) {
    return null
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[900] bg-black/30 backdrop-blur-sm opacity-0 transition-opacity duration-300 data-[state=open]:opacity-100" />
        <DialogPrimitive.Content
          id="mobile-drawer"
          aria-modal="true"
          aria-labelledby={titleId}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            anchorRef.current?.focus()
          }}
          className={cn(
            "pointer-events-auto fixed left-0 top-0 z-[1000] flex h-screen w-[86vw] max-w-xs flex-col overflow-hidden",
            "bg-gradient-to-b from-sky-50 via-blue-50 to-white",
            "backdrop-blur-2xl border-r border-white/40 shadow-2xl shadow-sky-500/10",
            "transition-[transform,opacity] duration-300 ease-out",
            "data-[state=closed]:-translate-x-8 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
            "data-[state=open]:translate-x-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="space-y-5 px-6 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] border-b border-white/30">
              <DialogPrimitive.Title id={titleId} className="sr-only">
                Mobile navigation
              </DialogPrimitive.Title>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-white/50 shadow-sm">
                  {user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name ?? "User avatar"} />
                  ) : (
                    <AvatarFallback className="text-lg font-semibold bg-sky-100 text-sky-700">
                      {initials || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold leading-tight truncate text-gray-900">
                    {user?.name ?? (isLoadingUser ? "Loading..." : "Guest")}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {user?.email ?? (userError ? "Sign in required" : "")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full rounded-xl border-sky-200 bg-white/60 backdrop-blur-sm text-sky-700 hover:bg-sky-50 hover:text-sky-800 transition"
                asChild
              >
                <Link href="/profile" onClick={() => onOpenChange(false)}>
                  View Profile
                </Link>
              </Button>
            </div>

            <Separator className="border-white/30" />

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {renderNavItems()}
            </div>

            <Separator className="border-white/30" />

            <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-2xl px-4 py-3.5 text-base font-medium text-gray-700 hover:bg-white/50 hover:text-sky-700 transition"
                onClick={() => {
                  void handleLogout()
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
        <div ref={liveRegionRef} className="sr-only" aria-live="polite" />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}