"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard,
  PlusCircle,
  CalendarClock,
  Settings,
  TrendingUp,
  Wallet,
  ChevronDown,
  ChevronRight,
  Users,
  Plus,
  X,
  Check,
  Gift,
} from "lucide-react"
import { useStore } from "@/lib/store"
import type { AccountType } from "@/lib/types"

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  selectedAccount: AccountType | null
  onSelectAccount: (account: AccountType | null) => void
}

export function Sidebar({ currentPage, onNavigate, selectedAccount, onSelectAccount }: SidebarProps) {
  const [childrenExpanded, setChildrenExpanded] = useState(true)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildName, setNewChildName] = useState("")

  const { getAllAccounts, addChildAccount, removeChildAccount, childAccounts } = useStore()
  const allAccounts = getAllAccounts()

  const mainAccounts = allAccounts.filter((a) => !a.parentId)

  const handleAccountClick = (accountId: AccountType) => {
    onSelectAccount(accountId)
    onNavigate("account-detail")
  }

  const handleAddChild = () => {
    if (newChildName.trim()) {
      addChildAccount(newChildName.trim())
      setNewChildName("")
      setIsAddingChild(false)
    }
  }

  const handleRemoveChild = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation()
    if (confirm("確定要刪除此帳戶嗎？該帳戶下的所有投資記錄也會一併刪除。")) {
      removeChildAccount(accountId)
      if (selectedAccount === accountId) {
        onSelectAccount(null)
        onNavigate("dashboard")
      }
    }
  }

  return (
    <aside className="hidden md:flex w-64 min-h-screen bg-card border-r border-border p-4 flex-col">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground">存股管理系統</h1>
      </div>

      <nav className="space-y-1 flex-1">
        {/* 總覽 */}
        <Button
          variant={currentPage === "dashboard" && !selectedAccount ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3",
            currentPage === "dashboard" &&
              !selectedAccount &&
              "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
          )}
          onClick={() => {
            onSelectAccount(null)
            onNavigate("dashboard")
          }}
        >
          <LayoutDashboard className="h-5 w-5" />
          總覽
        </Button>

        {/* 主帳戶和退休金 */}
        {mainAccounts.map((account) => (
          <Button
            key={account.id}
            variant={selectedAccount === account.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              selectedAccount === account.id && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
            )}
            onClick={() => handleAccountClick(account.id)}
          >
            <Wallet className="h-5 w-5" />
            {account.name}
          </Button>
        ))}

        {/* 孩子存股 */}
        <div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setChildrenExpanded(!childrenExpanded)}
          >
            {childrenExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <Users className="h-5 w-5" />
            孩子存股
          </Button>

          {childrenExpanded && (
            <div className="ml-4 space-y-1">
              {childAccounts.map((account) => (
                <div key={account.id} className="group flex items-center">
                  <Button
                    variant={selectedAccount === account.id ? "secondary" : "ghost"}
                    className={cn(
                      "flex-1 justify-start gap-3 pl-4",
                      selectedAccount === account.id && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
                    )}
                    onClick={() => handleAccountClick(account.id)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    {account.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={(e) => handleRemoveChild(e, account.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {isAddingChild ? (
                <div className="flex items-center gap-1 pl-4 pr-1">
                  <Input
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="輸入名稱"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddChild()
                      if (e.key === "Escape") {
                        setIsAddingChild(false)
                        setNewChildName("")
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600"
                    onClick={handleAddChild}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => {
                      setIsAddingChild(false)
                      setNewChildName("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 pl-4 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsAddingChild(true)}
                >
                  <Plus className="h-4 w-4" />
                  新增孩子
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border mt-4">
          {/* 功能選單 */}
          <Button
            variant={currentPage === "add-investment" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              currentPage === "add-investment" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
            )}
            onClick={() => {
              onSelectAccount(null)
              onNavigate("add-investment")
            }}
          >
            <PlusCircle className="h-5 w-5" />
            新增投資
          </Button>

          <Button
            variant={currentPage === "recurring" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              currentPage === "recurring" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
            )}
            onClick={() => {
              onSelectAccount(null)
              onNavigate("recurring")
            }}
          >
            <CalendarClock className="h-5 w-5" />
            定期定額
          </Button>

          <Button
            variant={currentPage === "dividend" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              currentPage === "dividend" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
            )}
            onClick={() => {
              onSelectAccount(null)
              onNavigate("dividend")
            }}
          >
            <Gift className="h-5 w-5" />
            配股配息
          </Button>

          <Button
            variant={currentPage === "settings" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              currentPage === "settings" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
            )}
            onClick={() => {
              onSelectAccount(null)
              onNavigate("settings")
            }}
          >
            <Settings className="h-5 w-5" />
            設定
          </Button>
        </div>
      </nav>
    </aside>
  )
}
