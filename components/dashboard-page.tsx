"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { getAccountColor, type AccountType } from "@/lib/types"
import { RefreshCw, TrendingUp, TrendingDown, Wallet, Target, DollarSign, ChevronRight } from "lucide-react"
import { fetchMultipleStockPrices } from "@/lib/stock-api"
import { RealAssetGrowthChart } from "./charts/real-asset-growth-chart"
import { AnnualGrowthChart } from "./charts/annual-growth-chart"
import { AccountAllocationChart } from "./charts/account-allocation-chart"
import { BackupButton } from "./backup-button"
import { cn } from "@/lib/utils"

interface DashboardPageProps {
  onNavigateToAccount?: (accountId: AccountType) => void
}

export function DashboardPage({ onNavigateToAccount }: DashboardPageProps) {
  const { investments, recurringInvestments, updateAllPrices, getAllAccounts } = useStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const allAccounts = getAllAccounts()

  const updatePrices = useCallback(async () => {
    const symbols = [...new Set(investments.map((inv) => inv.symbol))]
    if (symbols.length === 0) return

    setIsUpdating(true)
    try {
      const stocks = await fetchMultipleStockPrices(symbols)
      const prices: Record<string, number> = {}
      Object.entries(stocks).forEach(([symbol, stock]) => {
        if (stock.currentPrice > 0) {
          prices[symbol] = stock.currentPrice
        }
      })
      updateAllPrices(prices)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error updating prices:", error)
    } finally {
      setIsUpdating(false)
    }
  }, [investments, updateAllPrices])

  useEffect(() => {
    if (investments.length > 0) {
      updatePrices()
    }
  }, [])

  // 計算各帳戶數據
  const accountSummaries = allAccounts.map((account, index) => {
    const accountInvestments = investments.filter((inv) => inv.accountType === account.id)
    const totalInvested = accountInvestments.reduce((sum, inv) => sum + inv.buyPrice * inv.shares, 0)
    const currentValue = accountInvestments.reduce((sum, inv) => sum + inv.currentPrice * inv.shares, 0)
    const profitLoss = currentValue - totalInvested
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

    return {
      accountType: account.id,
      name: account.name,
      icon: account.icon,
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercent,
      holdings: accountInvestments.length,
      color: getAccountColor(account.id, index),
    }
  })

  const totalInvested = accountSummaries.reduce((sum, acc) => sum + acc.totalInvested, 0)
  const totalValue = accountSummaries.reduce((sum, acc) => sum + acc.currentValue, 0)
  const totalProfitLoss = totalValue - totalInvested
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

  // 帳戶配置比例數據
  const accountValues: Record<AccountType, number> = {} as Record<AccountType, number>
  accountSummaries.forEach((acc) => {
    accountValues[acc.accountType] = acc.currentValue
  })

  const handleAccountClick = (accountType: AccountType) => {
    if (onNavigateToAccount) {
      onNavigateToAccount(accountType)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">投資總覽</h1>
          <p className="text-muted-foreground">
            {lastUpdated ? `最後更新: ${lastUpdated.toLocaleString("zh-TW")}` : "尚未更新股價"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BackupButton variant="outline" size="default" showText />
          <Button onClick={updatePrices} disabled={isUpdating} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
            更新股價
          </Button>
        </div>
      </div>

      {/* 總覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">總投入金額</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalInvested.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">目前市值</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalValue.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-l-4", totalProfitLoss >= 0 ? "border-l-emerald-500" : "border-l-red-500")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">總損益</CardTitle>
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                totalProfitLoss >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
              )}
            >
              {totalProfitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalProfitLoss >= 0 ? "text-emerald-500" : "text-red-500")}>
              {totalProfitLoss >= 0 ? "+" : ""}${totalProfitLoss.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-l-4", totalProfitLossPercent >= 0 ? "border-l-emerald-500" : "border-l-red-500")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">總報酬率</CardTitle>
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                totalProfitLossPercent >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
              )}
            >
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn("text-2xl font-bold", totalProfitLossPercent >= 0 ? "text-emerald-500" : "text-red-500")}
            >
              {totalProfitLossPercent >= 0 ? "+" : ""}
              {totalProfitLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RealAssetGrowthChart investments={investments} recurringInvestments={recurringInvestments} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnnualGrowthChart investments={investments} recurringInvestments={recurringInvestments} />
          <AccountAllocationChart accountValues={accountValues} />
        </div>
      </div>

      {/* 帳戶總覽 - 添加點擊導航功能 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">帳戶總覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountSummaries.map((account) => (
              <Card
                key={account.accountType}
                className="bg-card border-2 cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 group"
                onClick={() => handleAccountClick(account.accountType)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: account.color }} />
                      <div>
                        <div className="font-semibold text-foreground text-lg">{account.name}</div>
                        <div className="text-sm text-muted-foreground">{account.holdings} 筆持股</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">投入金額</span>
                      <span className="text-foreground font-medium">
                        ${account.totalInvested.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">目前市值</span>
                      <span className="text-foreground font-medium">
                        ${account.currentValue.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">報酬率</span>
                      <span
                        className={cn(
                          "font-semibold text-lg",
                          account.profitLossPercent >= 0 ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {account.profitLossPercent >= 0 ? "+" : ""}
                        {account.profitLossPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
