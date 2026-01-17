"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface StockAllocationData {
  name: string
  symbol: string
  value: number
  color: string
}

interface StockAllocationChartProps {
  data: StockAllocationData[]
  title?: string
}

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#f43f5e",
]

export function StockAllocationChart({ data, title = "持股配置比例" }: StockAllocationChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }))

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)

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
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {chartData.map((entry, index) => (
        <div key={index} className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-muted-foreground">{entry.symbol}</span>
        </div>
      ))}
    </div>
  )

  if (chartData.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-500 text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">尚無持股資料</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-emerald-500 text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">總市值: ${totalValue.toLocaleString()}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string, props: { payload: StockAllocationData }) => [
                  `$${value.toLocaleString()} (${((value / totalValue) * 100).toFixed(1)}%)`,
                  `${props.payload.symbol} ${props.payload.name}`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {renderLegend()}
      </CardContent>
    </Card>
  )
}
