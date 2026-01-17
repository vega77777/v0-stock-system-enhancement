"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import type { Investment, RecurringExecutionRecord } from "@/lib/types"

interface AccountGrowthChartProps {
  investments: Investment[]
  recurringHistory: RecurringExecutionRecord[]
  title?: string
}

export function AccountGrowthChart({ investments, recurringHistory, title = "資產累積趨勢" }: AccountGrowthChartProps) {
  const data = useMemo(() => {
    const allTransactions: { date: string; cost: number; currentValue: number }[] = []

    // 單筆投資 - 計算成本和當前市值
    investments.forEach((inv) => {
      allTransactions.push({
        date: inv.buyDate,
        cost: inv.buyPrice * inv.shares,
        currentValue: inv.currentPrice * inv.shares,
      })
    })

    // 按日期排序
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (allTransactions.length === 0) {
      return []
    }

    // 按月份累積
    const monthlyData: Record<string, { cost: number; value: number }> = {}
    let cumulativeCost = 0
    let cumulativeValue = 0

    allTransactions.forEach((tx) => {
      const month = tx.date.substring(0, 7)
      cumulativeCost += tx.cost
      cumulativeValue += tx.currentValue
      monthlyData[month] = { cost: cumulativeCost, value: cumulativeValue }
    })

    // 轉換為圖表資料
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      cost: Math.round(data.cost),
      value: Math.round(data.value),
    }))
  }, [investments, recurringHistory])

  const formatValue = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}萬`
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
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">尚無投資紀錄</div>
        </CardContent>
      </Card>
    )
  }

  // 計算總報酬
  const latestData = data[data.length - 1]
  const totalReturn = latestData ? ((latestData.value - latestData.cost) / latestData.cost) * 100 : 0

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-emerald-500 text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          累積市值變化{" "}
          {latestData && (
            <span className={totalReturn >= 0 ? "text-emerald-500" : "text-red-500"}>
              ({totalReturn >= 0 ? "+" : ""}
              {totalReturn.toFixed(2)}%)
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAccountValue" x1="0" y1="0" x2="0" y2="1">
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
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === "value" ? "目前市值" : "投入成本",
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAccountValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
