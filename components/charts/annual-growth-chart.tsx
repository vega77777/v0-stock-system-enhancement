"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Line, ComposedChart } from "recharts"
import type { Investment, RecurringInvestment } from "@/lib/types"

interface AnnualGrowthChartProps {
  investments: Investment[]
  recurringInvestments: RecurringInvestment[]
  title?: string
}

export function AnnualGrowthChart({
  investments,
  recurringInvestments,
  title = "年度資產成長統計",
}: AnnualGrowthChartProps) {
  const data = useMemo(() => {
    type Transaction = {
      date: string
      symbol: string
      shares: number
      cost: number
      currentPrice: number
    }

    const transactions: Transaction[] = []

    // 收集單筆投資
    investments.forEach((inv) => {
      transactions.push({
        date: inv.buyDate,
        symbol: inv.symbol,
        shares: inv.shares,
        cost: inv.buyPrice * inv.shares,
        currentPrice: inv.currentPrice,
      })
    })

    // 收集定期定額投資
    recurringInvestments.forEach((rec) => {
      rec.executionHistory.forEach((exec) => {
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

    // 按年份處理交易
    const yearlyData: Record<
      string,
      {
        transactions: Transaction[]
        yearInvested: number
      }
    > = {}

    transactions.forEach((tx) => {
      const year = tx.date.substring(0, 4)

      if (!yearlyData[year]) {
        yearlyData[year] = {
          transactions: [],
          yearInvested: 0,
        }
      }

      yearlyData[year].transactions.push(tx)
      yearlyData[year].yearInvested += tx.cost
    })

    // 計算每年的累積資產狀況
    let cumulativeInvested = 0
    const cumulativeHoldings: Record<string, { shares: number; currentPrice: number }> = {}

    const result = Object.entries(yearlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => {
        // 更新累積持股
        data.transactions.forEach((tx) => {
          if (!cumulativeHoldings[tx.symbol]) {
            cumulativeHoldings[tx.symbol] = { shares: 0, currentPrice: tx.currentPrice }
          }
          cumulativeHoldings[tx.symbol].shares += tx.shares
          cumulativeHoldings[tx.symbol].currentPrice = tx.currentPrice
        })

        cumulativeInvested += data.yearInvested

        // 計算該年度結束時的市值
        const currentValue = Object.values(cumulativeHoldings).reduce((sum, h) => sum + h.shares * h.currentPrice, 0)

        const profitLoss = currentValue - cumulativeInvested
        const returnRate = cumulativeInvested > 0 ? (profitLoss / cumulativeInvested) * 100 : 0

        return {
          year,
          yearInvested: Math.round(data.yearInvested),
          cumulativeInvested: Math.round(cumulativeInvested),
          currentValue: Math.round(currentValue),
          profitLoss: Math.round(profitLoss),
          returnRate: Number(returnRate.toFixed(2)),
        }
      })

    return result
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
          <CardTitle className="text-blue-500 text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">尚無投資紀錄</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-500 text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">根據實際投入年份統計資產成長狀況</p>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulativeInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorCurrentValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#888", fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#888", fontSize: 10 }}
                tickFormatter={formatValue}
                width={60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#888", fontSize: 10 }}
                tickFormatter={(value) => `${value}%`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string) => {
                  if (name === "returnRate") {
                    return [`${value}%`, "報酬率"]
                  }
                  if (name === "yearInvested") {
                    return [`$${value.toLocaleString()}`, "當年投入"]
                  }
                  if (name === "cumulativeInvested") {
                    return [`$${value.toLocaleString()}`, "累積投入"]
                  }
                  if (name === "currentValue") {
                    return [`$${value.toLocaleString()}`, "目前市值"]
                  }
                  return [value, name]
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => {
                  if (value === "cumulativeInvested") return "累積投入"
                  if (value === "currentValue") return "目前市值"
                  if (value === "returnRate") return "累積報酬率"
                  return value
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="cumulativeInvested"
                fill="url(#colorCumulativeInvested)"
                radius={[4, 4, 0, 0]}
              />
              <Bar yAxisId="left" dataKey="currentValue" fill="url(#colorCurrentValue)" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="returnRate"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#f59e0b", r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
