"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Menu,
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

interface MobileNavProps {
  currentPage: string
  onNavigate: (page: string) => void
  selectedAccount: AccountType | null
  onSelectAccount: (account: AccountType | null) => void
}

export function MobileNav({ currentPage, onNavigate, selectedAccount, onSelectAccount }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [childrenExpanded, setChildrenExpanded] = useState(true)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildName, setNewChildName] = useState("")

  const { getAllAccounts, addChildAccount, removeChildAccount, childAccounts } = useStore()
  const allAccounts = getAllAccounts()
  const mainAccounts = allAccounts.filter((a) => !a.parentId)

  const handleAccountClick = (accountId: AccountType) => {
    onSelectAccount(accountId)
    onNavigate("account-detail")
    setOpen(false)
  }

  const handleNavigate = (page: string) => {
    onSelectAccount(null)
    onNavigate(page)
    setOpen(false)
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
    if (confirm("確定要刪除此帳戶嗎？")) {
      removeChildAccount(accountId)
      if (selectedAccount === accountId) {
        onSelectAccount(null)
        onNavigate("dashboard")
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">開啟選單</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            存股管理系統
          </SheetTitle>
        </SheetHeader>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* 總覽 */}
          <Button
            variant={currentPage === "dashboard" && !selectedAccount ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-12",
              currentPage === "dashboard" && !selectedAccount && "bg-emerald-500/10 text-emerald-500",
            )}
            onClick={() => handleNavigate("dashboard")}
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
                "w-full justify-start gap-3 h-12",
                selectedAccount === account.id && "bg-emerald-500/10 text-emerald-500",
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
              className="w-full justify-start gap-3 h-12"
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
                        "flex-1 justify-start gap-3 pl-4 h-11",
                        selectedAccount === account.id && "bg-emerald-500/10 text-emerald-500",
                      )}
                      onClick={() => handleAccountClick(account.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                      {account.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
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
                      className="h-9 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddChild()
                        if (e.key === "Escape") {
                          setIsAddingChild(false)
                          setNewChildName("")
                        }
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={handleAddChild}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
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
                    className="w-full justify-start gap-3 pl-4 h-11 text-muted-foreground"
                    onClick={() => setIsAddingChild(true)}
                  >
                    <Plus className="h-4 w-4" />
                    新增孩子
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t mt-4 space-y-1">
            <Button
              variant={currentPage === "add-investment" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                currentPage === "add-investment" && "bg-emerald-500/10 text-emerald-500",
              )}
              onClick={() => handleNavigate("add-investment")}
            >
              <PlusCircle className="h-5 w-5" />
              新增投資
            </Button>

            <Button
              variant={currentPage === "recurring" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                currentPage === "recurring" && "bg-emerald-500/10 text-emerald-500",
              )}
              onClick={() => handleNavigate("recurring")}
            >
              <CalendarClock className="h-5 w-5" />
              定期定額
            </Button>

            <Button
              variant={currentPage === "dividend" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                currentPage === "dividend" && "bg-emerald-500/10 text-emerald-500",
              )}
              onClick={() => handleNavigate("dividend")}
            >
              <Gift className="h-5 w-5" />
              配股配息
            </Button>

            <Button
              variant={currentPage === "settings" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                currentPage === "settings" && "bg-emerald-500/10 text-emerald-500",
              )}
              onClick={() => handleNavigate("settings")}
            >
              <Settings className="h-5 w-5" />
              設定
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
