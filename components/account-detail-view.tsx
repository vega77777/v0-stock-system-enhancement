"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore } from "@/lib/store"
import type { AccountType } from "@/lib/types"
import { TrendingUp, TrendingDown, Trash2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchMultipleStockPrices } from "@/lib/stock-api"
import { RealAssetGrowthChart } from "./charts/real-asset-growth-chart"
import { StockAllocationChart } from "./charts/stock-allocation-chart"
import { BackupButton } from "./backup-button"

interface AccountDetailViewProps {
  accountType: AccountType
}

export function AccountDetailView({ accountType }: AccountDetailViewProps) {
  const { investments, deleteInvestment, recurringInvestments, updateAllPrices, getAllAccounts } = useStore()
  const [isUpdating, setIsUpdating] = useState(false)

  const allAccounts = getAllAccounts()
  const account = allAccounts.find((a) => a.id === accountType)

  const accountInvestments = investments.filter((inv) => inv.accountType === accountType)
  const accountRecurring = recurringInvestments.filter((rec) => rec.accountType === accountType)

  const mergedHoldings = useMemo(() => {
    const holdingsMap = new Map<
      string,
      {
        symbol: string
        name: string
        totalShares: number
        totalCost: number
        currentPrice: number
        buyDates: string[]
        ids: string[]
        sources: string[]
      }
    >()

    accountInvestments.forEach((inv) => {
      const existing = holdingsMap.get(inv.symbol)
      if (existing) {
        existing.totalShares += inv.shares
        existing.totalCost += inv.buyPrice * inv.shares
        existing.currentPrice = inv.currentPrice // 使用最新價格
        existing.buyDates.push(inv.buyDate)
        existing.ids.push(inv.id)
        existing.sources.push(inv.source || "manual")
      } else {
        holdingsMap.set(inv.symbol, {
          symbol: inv.symbol,
          name: inv.name,
          totalShares: inv.shares,
          totalCost: inv.buyPrice * inv.shares,
          currentPrice: inv.currentPrice,
          buyDates: [inv.buyDate],
          ids: [inv.id],
          sources: [inv.source || "manual"],
        })
      }
    })

    return Array.from(holdingsMap.values()).map((h) => ({
      ...h,
      avgPrice: h.totalCost / h.totalShares,
      marketValue: h.totalShares * h.currentPrice,
      profitLoss: h.totalShares * h.currentPrice - h.totalCost,
      profitLossPercent: h.totalCost > 0 ? ((h.totalShares * h.currentPrice - h.totalCost) / h.totalCost) * 100 : 0,
    }))
  }, [accountInvestments])

  const totalInvested = mergedHoldings.reduce((sum, h) => sum + h.totalCost, 0)
  const currentValue = mergedHoldings.reduce((sum, h) => sum + h.marketValue, 0)
  const profitLoss = currentValue - totalInvested
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

  // 定期定額歷史記錄
  const allRecurringHistory = accountRecurring.flatMap((rec) => rec.executionHistory)

  // 股票配置資料 - 使用合併後的持股數據
  const stockAllocationData = mergedHoldings.map((h) => ({
    name: h.name,
    symbol: h.symbol,
    value: h.marketValue,
    color: "",
  }))

  const updatePrices = useCallback(async () => {
    const symbols = [...new Set(accountInvestments.map((inv) => inv.symbol))]
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
    } catch (error) {
      console.error("Error updating prices:", error)
    } finally {
      setIsUpdating(false)
    }
  }, [accountInvestments, updateAllPrices])

  useEffect(() => {
    if (accountInvestments.length > 0) {
      updatePrices()
    }
  }, [accountType])

  const handleDeleteHolding = (ids: string[]) => {
    if (confirm("確定要刪除此持股嗎？")) {
      ids.forEach((id) => deleteInvestment(id))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{account?.icon}</span>
          <h1 className="text-2xl font-bold text-foreground">{account?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <BackupButton variant="ghost" size="icon" />
          <Button onClick={updatePrices} disabled={isUpdating} variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
            更新股價
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">投入金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalInvested.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">目前市值</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${currentValue.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-l-4", profitLoss >= 0 ? "border-l-emerald-500" : "border-l-red-500")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">損益金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold flex items-center gap-1",
                profitLoss >= 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {profitLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {profitLoss >= 0 ? "+" : ""}${Math.abs(profitLoss).toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-l-4", profitLossPercent >= 0 ? "border-l-emerald-500" : "border-l-red-500")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">報酬率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", profitLossPercent >= 0 ? "text-emerald-500" : "text-red-500")}>
              {profitLossPercent >= 0 ? "+" : ""}
              {profitLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealAssetGrowthChart
          investments={accountInvestments}
          recurringInvestments={accountRecurring}
          title="資產累積趨勢"
        />
        <StockAllocationChart data={stockAllocationData} title="持股配置比例" />
      </div>

      {/* 持股明細 - 使用合併後的數據顯示 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">持股明細</CardTitle>
        </CardHeader>
        <CardContent>
          {mergedHoldings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">此帳戶尚無投資紀錄</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>股票代號</TableHead>
                  <TableHead>股票名稱</TableHead>
                  <TableHead className="text-right">總持股數</TableHead>
                  <TableHead className="text-right">平均成本</TableHead>
                  <TableHead className="text-right">現價</TableHead>
                  <TableHead className="text-right">投入金額</TableHead>
                  <TableHead className="text-right">市值</TableHead>
                  <TableHead className="text-right">報酬率</TableHead>
                  <TableHead>來源</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedHoldings.map((holding) => (
                  <TableRow key={holding.symbol}>
                    <TableCell className="font-medium">{holding.symbol}</TableCell>
                    <TableCell>{holding.name}</TableCell>
                    <TableCell className="text-right">
                      {holding.totalShares.toLocaleString("zh-TW", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">${holding.avgPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${holding.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${holding.totalCost.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      ${holding.marketValue.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        holding.profitLossPercent >= 0 ? "text-emerald-500" : "text-red-500",
                      )}
                    >
                      {holding.profitLossPercent >= 0 ? "+" : ""}
                      {holding.profitLossPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          holding.sources.includes("recurring")
                            ? "bg-blue-500/20 text-blue-500"
                            : "bg-gray-500/20 text-gray-500",
                        )}
                      >
                        {holding.sources.includes("recurring") ? "定期定額" : "手動"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHolding(holding.ids)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 定期定額紀錄 */}
      {accountRecurring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">定期定額扣款明細</CardTitle>
          </CardHeader>
          <CardContent>
            {accountRecurring.map((rec) => (
              <div key={rec.id} className="mb-6 last:mb-0">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-sm">{rec.symbol}</span>
                  {rec.name} - 每月{rec.dayOfMonth}日 ${rec.amount.toLocaleString()}
                </h4>
                {rec.executionHistory.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>扣款日期</TableHead>
                          <TableHead className="text-right">扣款金額</TableHead>
                          <TableHead className="text-right">當時股價</TableHead>
                          <TableHead className="text-right">購入股數</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rec.executionHistory.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell>{h.date}</TableCell>
                            <TableCell className="text-right">${h.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${h.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{h.shares.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">尚無扣款紀錄</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
