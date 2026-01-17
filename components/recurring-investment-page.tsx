"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore } from "@/lib/store"
import type { AccountType, RecurringExecutionRecord } from "@/lib/types"
import { searchStock, fetchHistoricalPrice } from "@/lib/stock-api"
import { Loader2, Search, CheckCircle, AlertCircle, CalendarClock, Trash2 } from "lucide-react"
import { BackupButton } from "./backup-button"
import { cn } from "@/lib/utils"

export function RecurringInvestmentPage() {
  const {
    addRecurringInvestment,
    recurringInvestments,
    deleteRecurringInvestment,
    setExecutionHistory,
    addInvestments,
    getAllAccounts,
  } = useStore()

  const allAccounts = getAllAccounts()

  const [symbol, setSymbol] = useState("")
  const [stockName, setStockName] = useState("")
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [amount, setAmount] = useState("")
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [startYear, setStartYear] = useState("")
  const [startMonth, setStartMonth] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("main")

  const [isSearching, setIsSearching] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [previewRecords, setPreviewRecords] = useState<Omit<RecurringExecutionRecord, "id">[]>([])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2014 }, (_, i) => 2015 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleSearchStock = async () => {
    if (!symbol.trim()) return

    setIsSearching(true)
    setSearchError("")
    setStockName("")
    setCurrentPrice(null)

    try {
      const stock = await searchStock(symbol.trim())
      if (stock) {
        setStockName(stock.name)
        setCurrentPrice(stock.currentPrice)
      } else {
        setSearchError("找不到此股票代號")
      }
    } catch {
      setSearchError("搜索股票時發生錯誤")
    } finally {
      setIsSearching(false)
    }
  }

  const calculateHistoricalRecords = useCallback(async () => {
    if (!symbol || !stockName || !amount || !startYear || !startMonth || !dayOfMonth) return

    setIsCalculating(true)
    setPreviewRecords([])

    try {
      const records: Omit<RecurringExecutionRecord, "id">[] = []
      const today = new Date()

      const start = new Date(Number.parseInt(startYear), Number.parseInt(startMonth) - 1, dayOfMonth)

      if (start > today) {
        setIsCalculating(false)
        return
      }

      const current = new Date(start)

      while (current <= today) {
        const dateStr = current.toISOString().split("T")[0]

        const price = await fetchHistoricalPrice(symbol, dateStr)

        if (price && price > 0) {
          const investAmount = Number.parseFloat(amount)
          const shares = investAmount / price

          records.push({
            date: dateStr,
            symbol: symbol.toUpperCase(),
            name: stockName,
            amount: investAmount,
            price,
            shares,
            marketValue: shares * price,
          })
        }

        current.setMonth(current.getMonth() + 1)
        current.setDate(dayOfMonth)
      }

      setPreviewRecords(records)
    } catch (error) {
      console.error("Error calculating records:", error)
    } finally {
      setIsCalculating(false)
    }
  }, [symbol, stockName, amount, startYear, startMonth, dayOfMonth])

  useEffect(() => {
    if (symbol && stockName && amount && startYear && startMonth && dayOfMonth) {
      const timer = setTimeout(() => {
        calculateHistoricalRecords()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [symbol, stockName, amount, startYear, startMonth, dayOfMonth, calculateHistoricalRecords])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symbol || !stockName || !amount || !startYear || !startMonth) {
      return
    }

    setIsSubmitting(true)

    try {
      const startDate = `${startYear}-${startMonth.padStart(2, "0")}-${dayOfMonth.toString().padStart(2, "0")}`

      const recurringId = addRecurringInvestment({
        accountType,
        symbol: symbol.toUpperCase(),
        name: stockName,
        amount: Number.parseFloat(amount),
        dayOfMonth,
        startDate,
        isActive: true,
      })

      setTimeout(() => {
        const newRecurring = useStore.getState().recurringInvestments
        const lastAdded = newRecurring[newRecurring.length - 1]
        if (lastAdded && previewRecords.length > 0) {
          setExecutionHistory(lastAdded.id, previewRecords)

          const totalShares = previewRecords.reduce((sum, r) => sum + r.shares, 0)
          const totalAmount = previewRecords.reduce((sum, r) => sum + r.amount, 0)
          const avgPrice = totalShares > 0 ? totalAmount / totalShares : 0

          const latestPrice = currentPrice || avgPrice

          addInvestments([
            {
              accountType,
              symbol: symbol.toUpperCase(),
              name: stockName,
              shares: totalShares,
              buyPrice: avgPrice,
              currentPrice: latestPrice,
              buyDate: startDate,
              note: `定期定額 (${previewRecords.length}期)`,
              source: "recurring",
              recurringId: lastAdded.id,
            },
          ])
        }
      }, 100)

      setSubmitSuccess(true)

      setTimeout(() => {
        setSymbol("")
        setStockName("")
        setCurrentPrice(null)
        setAmount("")
        setStartYear("")
        setStartMonth("")
        setPreviewRecords([])
        setSubmitSuccess(false)
      }, 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = previewRecords.reduce((sum, r) => sum + r.amount, 0)
  const totalShares = previewRecords.reduce((sum, r) => sum + r.shares, 0)
  const avgPrice = totalShares > 0 ? totalAmount / totalShares : 0
  const currentMarketValue = currentPrice ? totalShares * currentPrice : 0
  const profitLoss = currentMarketValue - totalAmount
  const profitLossPercent = totalAmount > 0 ? (profitLoss / totalAmount) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">新增定期定額</h1>
        <BackupButton variant="ghost" size="icon" />
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CalendarClock className="h-5 w-5" />
              定期定額設定
            </CardTitle>
            <CardDescription>
              設定定期定額投資計畫，系統會根據開始日期自動計算歷史扣款紀錄並同步到持股明細
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 股票搜索 */}
              <div className="space-y-2">
                <Label htmlFor="symbol">股票代號</Label>
                <div className="flex gap-2">
                  <Input
                    id="symbol"
                    placeholder="例如: 0050, 0056, 00878"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleSearchStock()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleSearchStock} disabled={isSearching || !symbol.trim()}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {searchError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {searchError}
                  </p>
                )}
              </div>

              {/* 股票資訊 */}
              {stockName && (
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">股票名稱</span>
                    <span className="font-medium text-foreground">{stockName}</span>
                  </div>
                  {currentPrice !== null && currentPrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">目前股價</span>
                      <span className="font-medium text-foreground">${currentPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 每期金額 */}
              <div className="space-y-2">
                <Label htmlFor="amount">每期投入金額 (TWD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="例如: 3000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* 扣款日 */}
              <div className="space-y-2">
                <Label>扣款日</Label>
                <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(Number.parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">每月 1 日</SelectItem>
                    <SelectItem value="5">每月 5 日</SelectItem>
                    <SelectItem value="15">每月 15 日</SelectItem>
                    <SelectItem value="25">每月 25 日</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>開始扣款年月</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={startYear} onValueChange={setStartYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇年份" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year} 年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={startMonth} onValueChange={setStartMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇月份" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {month} 月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  選擇開始扣款的年月，系統會自動計算從該日期到今天的所有扣款紀錄
                </p>
              </div>

              {/* 帳戶類型 */}
              <div className="space-y-2">
                <Label>投資帳戶</Label>
                <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.icon} {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 計算中提示 */}
              {isCalculating && (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  正在計算歷史扣款紀錄...
                </div>
              )}

              {/* 預覽紀錄 */}
              {previewRecords.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">預計扣款紀錄預覽</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">總投入金額</span>
                        <div className="font-bold text-foreground">${totalAmount.toLocaleString("zh-TW")}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">預計總股數</span>
                        <div className="font-bold text-foreground">{totalShares.toFixed(4)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">平均成本</span>
                        <div className="font-bold text-foreground">${avgPrice.toFixed(2)}</div>
                      </div>
                      {currentPrice && currentPrice > 0 && (
                        <div>
                          <span className="text-muted-foreground">預估報酬率</span>
                          <div
                            className={cn("font-bold", profitLossPercent >= 0 ? "text-emerald-500" : "text-red-500")}
                          >
                            {profitLossPercent >= 0 ? "+" : ""}
                            {profitLossPercent.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>扣款日期</TableHead>
                          <TableHead className="text-right">當時股價</TableHead>
                          <TableHead className="text-right">購入股數</TableHead>
                          <TableHead className="text-right">扣款金額</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRecords.map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{record.date}</TableCell>
                            <TableCell className="text-right">${record.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{record.shares.toFixed(4)}</TableCell>
                            <TableCell className="text-right">${record.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* 提交按鈕 */}
              <Button
                type="submit"
                className={cn("w-full", submitSuccess && "bg-emerald-500 hover:bg-emerald-600")}
                disabled={!stockName || !amount || !startYear || !startMonth || isSubmitting || isCalculating}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : submitSuccess ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : null}
                {submitSuccess ? "設定成功！" : "建立定期定額"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 現有定期定額列表 */}
      {recurringInvestments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">現有定期定額設定</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>帳戶</TableHead>
                  <TableHead>股票</TableHead>
                  <TableHead className="text-right">每期金額</TableHead>
                  <TableHead>扣款日</TableHead>
                  <TableHead>開始日期</TableHead>
                  <TableHead className="text-right">已扣款次數</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringInvestments.map((rec) => {
                  const account = allAccounts.find((a) => a.id === rec.accountType)
                  return (
                    <TableRow key={rec.id}>
                      <TableCell>
                        {account?.icon} {account?.name}
                      </TableCell>
                      <TableCell>
                        {rec.symbol} {rec.name}
                      </TableCell>
                      <TableCell className="text-right">${rec.amount.toLocaleString()}</TableCell>
                      <TableCell>每月 {rec.dayOfMonth} 日</TableCell>
                      <TableCell>{rec.startDate}</TableCell>
                      <TableCell className="text-right">{rec.executionHistory.length} 次</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            rec.isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-gray-500/20 text-gray-500",
                          )}
                        >
                          {rec.isActive ? "執行中" : "已暫停"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecurringInvestment(rec.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
