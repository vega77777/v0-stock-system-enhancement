"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface AssetGrowthChartProps {
  currentValue: number
  startYear?: number
  endYear?: number
  annualReturn?: number
  title?: string
}

export function AssetGrowthChart({
  currentValue,
  startYear = 2021,
  endYear = 2050,
  annualReturn = 0.07,
  title = "資產成長趨勢",
}: AssetGrowthChartProps) {
  const data = useMemo(() => {
    const result = []
    const currentYear = new Date().getFullYear()
    let value = currentValue > 0 ? currentValue : 100000 // 預設起始值

    for (let year = startYear; year <= endYear; year++) {
      if (year < currentYear) {
        // 過去的年份，模擬歷史成長
        const yearsFromStart = year - startYear
        value =
          (currentValue > 0 ? currentValue / Math.pow(1 + annualReturn, currentYear - startYear) : 100000) *
          Math.pow(1 + annualReturn, yearsFromStart)
      } else if (year === currentYear) {
        value = currentValue > 0 ? currentValue : 100000
      } else {
        // 未來的年份，假設年化報酬率
        value = value * (1 + annualReturn)
      }

      result.push({
        year: year.toString(),
        value: Math.round(value),
      })
    }
    return result
  }, [currentValue, startYear, endYear, annualReturn])

  const formatValue = (value: number) => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}千萬`
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}萬`
    }
    return value.toLocaleString()
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-emerald-500 text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {startYear}-{endYear} 年度資產累積路徑（假設年化報酬 {(annualReturn * 100).toFixed(0)}%）
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
                interval={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#888", fontSize: 12 }}
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, "資產價值"]}
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
