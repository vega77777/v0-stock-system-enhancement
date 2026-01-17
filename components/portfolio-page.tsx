"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface AggregatedStock {
  symbol: string
  name: string
  totalShares: number
  totalInvested: number
  currentPrice: number
  marketValue: number
  profitLoss: number
  profitLossPercent: number
  avgCost: number
  accounts: string[]
}

export function PortfolioPage() {
  const { investments, getAllAccounts } = useStore()
  const allAccounts = getAllAccounts()

  const aggregatedStocks = useMemo(() => {
    const stockMap = new Map<string, AggregatedStock>()

    investments.forEach((inv) => {
      const existing = stockMap.get(inv.symbol)
      const invested = inv.buyPrice * inv.shares
      const marketValue = inv.currentPrice * inv.shares
      const accountName = allAccounts.find((a) => a.id === inv.accountType)?.name || inv.accountType

      if (existing) {
        existing.totalShares += inv.shares
        existing.totalInvested += invested
        existing.marketValue += marketValue
        existing.currentPrice = inv.currentPrice
        if (!existing.accounts.includes(accountName)) {
          existing.accounts.push(accountName)
        }
      } else {
        stockMap.set(inv.symbol, {
          symbol: inv.symbol,
          name: inv.name,
          totalShares: inv.shares,
          totalInvested: invested,
          currentPrice: inv.currentPrice,
          marketValue,
          profitLoss: 0,
          profitLossPercent: 0,
          avgCost: 0,
          accounts: [accountName],
        })
      }
    })

    // 計算平均成本和損益
    stockMap.forEach((stock) => {
      stock.avgCost = stock.totalInvested / stock.totalShares
      stock.profitLoss = stock.marketValue - stock.totalInvested
      stock.profitLossPercent = stock.totalInvested > 0 ? (stock.profitLoss / stock.totalInvested) * 100 : 0
    })

    return Array.from(stockMap.values()).sort((a, b) => b.marketValue - a.marketValue)
  }, [investments, allAccounts])

  const totalInvested = aggregatedStocks.reduce((sum, s) => sum + s.totalInvested, 0)
  const totalMarketValue = aggregatedStocks.reduce((sum, s) => sum + s.marketValue, 0)
  const totalProfitLoss = totalMarketValue - totalInvested
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">投資組合</h1>

      {/* 總計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">總投入金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalInvested.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">目前市值</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalMarketValue.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">總損益</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold flex items-center gap-1",
                totalProfitLoss >= 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {totalProfitLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {totalProfitLoss >= 0 ? "+" : ""}$
              {Math.abs(totalProfitLoss).toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">總報酬率</CardTitle>
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

      {/* 持股明細 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">所有持股明細</CardTitle>
        </CardHeader>
        <CardContent>
          {aggregatedStocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">尚無投資紀錄</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>股票代號</TableHead>
                  <TableHead>股票名稱</TableHead>
                  <TableHead className="text-right">總持股</TableHead>
                  <TableHead className="text-right">平均成本</TableHead>
                  <TableHead className="text-right">現價</TableHead>
                  <TableHead className="text-right">投入金額</TableHead>
                  <TableHead className="text-right">市值</TableHead>
                  <TableHead className="text-right">損益</TableHead>
                  <TableHead className="text-right">報酬率</TableHead>
                  <TableHead>帳戶</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedStocks.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell className="text-right">
                      {stock.totalShares.toLocaleString("zh-TW", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">${stock.avgCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${stock.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${stock.totalInvested.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      ${stock.marketValue.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell
                      className={cn("text-right", stock.profitLoss >= 0 ? "text-emerald-500" : "text-red-500")}
                    >
                      {stock.profitLoss >= 0 ? "+" : ""}$
                      {Math.abs(stock.profitLoss).toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        stock.profitLossPercent >= 0 ? "text-emerald-500" : "text-red-500",
                      )}
                    >
                      {stock.profitLossPercent >= 0 ? "+" : ""}
                      {stock.profitLossPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {stock.accounts.map((acc) => (
                          <span key={acc} className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">
                            {acc}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 持股占比 */}
      {aggregatedStocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">持股占比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aggregatedStocks.map((stock) => {
                const percentage = totalMarketValue > 0 ? (stock.marketValue / totalMarketValue) * 100 : 0
                return (
                  <div key={stock.symbol} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {stock.symbol} {stock.name}
                      </span>
                      <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
