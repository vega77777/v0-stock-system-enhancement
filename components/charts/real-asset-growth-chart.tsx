"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { Investment, RecurringInvestment } from "@/lib/types"

interface RealAssetGrowthChartProps {
  investments: Investment[]
  recurringInvestments: RecurringInvestment[]
  title?: string
}

export function RealAssetGrowthChart({
  investments,
  recurringInvestments,
  title = "資產累積趨勢",
}: RealAssetGrowthChartProps) {
  const data = useMemo(() => {
    // 收集所有交易事件（包含日期、購買成本和股票資訊）
    type Transaction = {
      date: string
      symbol: string
      shares: number
      cost: number
      currentPrice: number
    }

    const transactions: Transaction[] = []

    // 單筆投資
    investments.forEach((inv) => {
      transactions.push({
        date: inv.buyDate,
        symbol: inv.symbol,
        shares: inv.shares,
        cost: inv.buyPrice * inv.shares,
        currentPrice: inv.currentPrice,
      })
    })

    // 定期定額的執行紀錄
    recurringInvestments.forEach((rec) => {
      rec.executionHistory.forEach((exec) => {
        // 找到這個股票的最新價格
        const inv = investments.find((i) => i.symbol === exec.symbol)
        const currentPrice = inv?.currentPrice || exec.price

        transactions.push({
          date: exec.date,
          symbol: exec.symbol,
          shares: exec.shares,
          cost: exec.amount,
          currentPrice: currentPrice,
        })
      })
    })

    if (transactions.length === 0) {
      return []
    }

    // 按日期排序
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 建立持股追蹤
    const holdings: Record<string, { shares: number; cost: number; currentPrice: number }> = {}

    // 建立時間序列資料點
    const dataPoints: Array<{ date: string; invested: number; value: number }> = []

    transactions.forEach((tx) => {
      // 更新持股
      if (!holdings[tx.symbol]) {
        holdings[tx.symbol] = { shares: 0, cost: 0, currentPrice: tx.currentPrice }
      }
      holdings[tx.symbol].shares += tx.shares
      holdings[tx.symbol].cost += tx.cost
      holdings[tx.symbol].currentPrice = tx.currentPrice

      // 計算當前總投入和總市值
      const totalInvested = Object.values(holdings).reduce((sum, h) => sum + h.cost, 0)
      const totalValue = Object.values(holdings).reduce((sum, h) => sum + h.shares * h.currentPrice, 0)

      dataPoints.push({
        date: tx.date,
        invested: Math.round(totalInvested),
        value: Math.round(totalValue),
      })
    })

    // 按月份合併資料（使用每月最後一筆交易）
    const monthlyData: Record<string, { invested: number; value: number }> = {}

    dataPoints.forEach((point) => {
      const month = point.date.substring(0, 7) // YYYY-MM
      monthlyData[month] = {
        invested: point.invested,
        value: point.value,
      }
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        invested: data.invested,
        value: data.value,
      }))
  }, [investments, recurringInvestments])

  const formatValue = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}萬`
    }
    return value.toLocaleString()
  }

  if (data.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-500 text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">尚無投資紀錄</div>
        </CardContent>
      </Card>
    )
  }

  const latestData = data[data.length - 1]
  const totalReturn = latestData ? latestData.value - latestData.invested : 0
  const totalReturnPercent = latestData && latestData.invested > 0 ? (totalReturn / latestData.invested) * 100 : 0

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-emerald-500 text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          從購入日期至今的實際資產累積曲線
          {latestData && (
            <span className="ml-4">
              <span className={totalReturnPercent >= 0 ? "text-emerald-500" : "text-red-500"}>
                損益: {totalReturn >= 0 ? "+" : ""}${totalReturn.toLocaleString()} ({totalReturnPercent >= 0 ? "+" : ""}
                {totalReturnPercent.toFixed(2)}%)
              </span>
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#888", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#888", fontSize: 10 }}
                tickFormatter={formatValue}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string) => {
                  const label = name === "invested" ? "累積投入" : "目前市值"
                  return [`$${value.toLocaleString()}`, label]
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (value === "invested" ? "累積投入" : "目前市值")}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#64748b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInvested)"
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
