"use client"

import { useState } from "react"
import { Bell, Search, X, Wallet, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { mockAccounts } from "@/lib/data/accounts"
import type { Account } from "@/lib/types"

interface HeaderProps {
  title: string
  selectedAccountId?: number | null
  onAccountSelect?: (accountId: number | null) => void
  accounts?: Account[]
}

export function Header({ title, selectedAccountId, onAccountSelect, accounts: propsAccounts }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const accounts = propsAccounts || mockAccounts
  const selectedAccount = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) : null

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Account Selector */}
        {onAccountSelect && (
          <Select
            value={selectedAccountId ? String(selectedAccountId) : "all"}
            onValueChange={(value) => onAccountSelect(value === "all" ? null : parseInt(value))}
          >
            <SelectTrigger className="h-9 w-auto min-w-[140px] max-w-[200px] sm:min-w-[160px] sm:max-w-[220px]">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Wallet className="h-4 w-4 flex-shrink-0" />
                {selectedAccount ? (
                  <>
                    <span className="flex-shrink-0 text-base leading-none">{selectedAccount.icon || "💳"}</span>
                    <span className="truncate min-w-0">{selectedAccount.name}</span>
                  </>
                ) : (
                  <SelectValue placeholder="Select account" className="truncate min-w-0">
                    All Accounts
                  </SelectValue>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>All Accounts</span>
                </div>
              </SelectItem>
              {accounts
                .filter((a) => a.isActive)
                .map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    <div className="flex items-center gap-2">
                      <span>{account.icon || "💳"}</span>
                      <span className="truncate">{account.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        C${(account.balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {/* Mobile search toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          aria-label={isSearchOpen ? "Close search" : "Open search"}
          aria-expanded={isSearchOpen}
        >
          {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>

        {/* Search - hidden on mobile when closed, visible on desktop */}
        <div
          className={cn(
            "relative",
            isSearchOpen
              ? "absolute left-0 right-0 top-16 z-50 mx-4 block lg:relative lg:top-0 lg:mx-0"
              : "hidden lg:block",
          )}
        >
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full bg-background pl-9 lg:w-64"
            aria-label="Search"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" aria-label="1 unread notification" />
        </Button>

        <div className="hidden items-center gap-3 sm:flex">
          <Avatar className="h-9 w-9" aria-label="User profile">
            <AvatarImage src="/placeholder.svg?height=36&width=36" alt="John Doe" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium">John Doe</div>
          </div>
        </div>
      </div>
    </header>
  )
}
