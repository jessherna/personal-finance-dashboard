"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { UserSwitcher } from "@/components/user-switcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  Users,
  Settings,
  History,
  BarChart3,
  Shield,
  Crown,
  Eye,
  LayoutDashboard,
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  const { user, isAdmin, isDev, isViewingAsUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || (!isAdmin && !isDev)) {
      router.push("/")
    }
  }, [user, isAdmin, isDev, router])

  // Redirect to regular dashboard if viewing as user
  useEffect(() => {
    if (isViewingAsUser) {
      router.push("/")
    }
  }, [isViewingAsUser, router])

  if (!user || (!isAdmin && !isDev)) {
    return null
  }

  const managementCards = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: Users,
      href: "/users",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Restore Points",
      description: "View and restore page layouts to previous versions",
      icon: History,
      href: "/restore-points",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      adminOnly: true,
    },
    {
      title: "View As User",
      description: "View the application from a user's perspective",
      icon: Eye,
      href: "#",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      onClick: () => {
        // This will be handled by the UserSwitcher component
      },
    },
    {
      title: "Settings",
      description: "Configure application settings and preferences",
      icon: Settings,
      href: "/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950",
    },
  ]

  const filteredCards = managementCards.filter((card) => {
    if (card.adminOnly && !isAdmin) return false
    return true
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Management Dashboard" />
        <main className="p-4 sm:p-6 lg:p-8">

          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {isAdmin ? (
                <Crown className="h-8 w-8 text-yellow-600" />
              ) : (
                <Shield className="h-8 w-8 text-blue-600" />
              )}
              <h1 className="text-3xl font-bold">
                Welcome, {user.name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {isAdmin
                ? "Manage the application, users, and system settings"
                : "Customize pages and manage application features"}
            </p>
          </div>

          {/* Management Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {filteredCards.map((card) => {
              const Icon = card.icon
              const content = (
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              )

              if (card.href === "#") {
                return (
                  <div key={card.title} onClick={card.onClick}>
                    {content}
                  </div>
                )
              }

              return (
                <Link key={card.title} href={card.href}>
                  {content}
                </Link>
              )
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <UserSwitcher />
                {isAdmin && (
                  <Link href="/restore-points">
                    <Button variant="outline">
                      <History className="h-4 w-4 mr-2" />
                      View Restore Points
                    </Button>
                  </Link>
                )}
                <Link href="/users">
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

