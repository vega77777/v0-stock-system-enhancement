"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useStore } from "@/lib/store"
import { getAccountColor, type AccountType } from "@/lib/types"

interface AccountAllocationChartProps {
  accountValues: Record<AccountType, number>
  title?: string
}

export function AccountAllocationChart({ accountValues, title = "帳戶配置比例" }: AccountAllocationChartProps) {
  const { getAllAccounts } = useStore()
  const allAccounts = getAllAccounts()

  const totalValue = Object.values(accountValues).reduce((sum, val) => sum + val, 0)

  const data = allAccounts
    .map((account, index) => ({
      name: account.name,
      value: accountValues[account.id] || 0,
      color: getAccountColor(account.id, index),
      percentage: totalValue > 0 ? (((accountValues[account.id] || 0) / totalValue) * 100).toFixed(1) : "0",
    }))
    .filter((item) => item.value > 0)

  // 如果沒有資料，顯示預設的空白圖
  const displayData =
    data.length > 0
      ? data
      : allAccounts.map((account, index) => ({
          name: account.name,
          value: 20,
          color: getAccountColor(account.id, index),
          percentage: "20",
        }))

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
  }) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {displayData.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm" style={{ color: entry.color }}>
            {entry.name}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-amber-500 text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">各帳戶資產分佈狀況</p>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {renderLegend()}
      </CardContent>
    </Card>
  )
}
