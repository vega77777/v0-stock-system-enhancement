"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { SyncStatus } from "@/components/sync-status"
import { DashboardPage } from "@/components/dashboard-page"
import { AddInvestmentPage } from "@/components/add-investment-page"
import { RecurringInvestmentPage } from "@/components/recurring-investment-page"
import { DividendPage } from "@/components/dividend-page"
import { SettingsPage } from "@/components/settings-page"
import { AccountDetailView } from "@/components/account-detail-view"
import { Button } from "@/components/ui/button"
import { LogOut, TrendingUp } from "lucide-react"
import type { AccountType } from "@/lib/types"

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null)
  const router = useRouter()

  const handleNavigateToAccount = (accountId: AccountType) => {
    setSelectedAccount(accountId)
    setCurrentPage("account-detail")
  }

  const handleLogout = () => {
    document.cookie = "auth-token=; path=/; max-age=0"
    router.push("/login")
    router.refresh()
  }

  const renderPage = () => {
    if (currentPage === "account-detail" && selectedAccount) {
      return <AccountDetailView accountType={selectedAccount} />
    }

    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigateToAccount={handleNavigateToAccount} />
      case "add-investment":
        return <AddInvestmentPage />
      case "recurring":
        return <RecurringInvestmentPage />
      case "dividend":
        return <DividendPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardPage onNavigateToAccount={handleNavigateToAccount} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        selectedAccount={selectedAccount}
        onSelectAccount={setSelectedAccount}
      />
      <main className="flex-1 overflow-auto relative">
        <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:border-none">
          <div className="flex items-center gap-3">
            <MobileNav
              currentPage={currentPage}
              onNavigate={setCurrentPage}
              selectedAccount={selectedAccount}
              onSelectAccount={setSelectedAccount}
            />
            <div className="flex items-center gap-2 md:hidden">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">存股管理</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SyncStatus />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">登出</span>
            </Button>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  )
}
