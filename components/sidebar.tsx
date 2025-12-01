"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { HelpCircle, LogOut, Wallet, Menu, X, Users, History, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { navigationItems } from "@/lib/data/navigation"
import { useAuth } from "@/contexts/auth-context"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, isDev, isAdmin, isViewingAsUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsOpen(false)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="sidebar"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen || !isMobile ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">FinanceTrack</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Primary navigation">
            {/* Show management dashboard when admin/dev is NOT viewing as a user */}
            {(isAdmin || isDev) && !isViewingAsUser && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
                  pathname === "/admin"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
                aria-current={pathname === "/admin" ? "page" : undefined}
              >
                <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                <span>Management</span>
              </Link>
            )}
            
            {/* Regular navigation items - show for regular users OR when viewing as a user */}
            {((!isAdmin && !isDev) || isViewingAsUser) && (
              <>
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </>
            )}
            
            {/* Management Links - show when admin/dev is NOT viewing as a user */}
            {isDev && !isViewingAsUser && (
              <Link
                href="/users"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
                  pathname === "/users"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
                aria-current={pathname === "/users" ? "page" : undefined}
              >
                <Users className="h-5 w-5" aria-hidden="true" />
                <span>User Management</span>
              </Link>
            )}
            {isAdmin && !isViewingAsUser && (
              <Link
                href="/restore-points"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
                  pathname === "/restore-points"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
                aria-current={pathname === "/restore-points" ? "page" : undefined}
              >
                <History className="h-5 w-5" aria-hidden="true" />
                <span>Restore Points</span>
              </Link>
            )}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-sidebar-border p-4 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-label="Get help"
            >
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
              <span>Help</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-label="Log out"
              onClick={async () => {
                await logout()
                router.push("/login")
              }}
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
