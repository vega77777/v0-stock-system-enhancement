"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import type { AccountType } from "@/lib/types"
import { searchStock, fetchHistoricalPrice } from "@/lib/stock-api"
import { Loader2, Search, CheckCircle, AlertCircle } from "lucide-react"
import { BackupButton } from "./backup-button"
import { cn } from "@/lib/utils"

export function AddInvestmentPage() {
  const { addInvestment, getAllAccounts } = useStore()
  const allAccounts = getAllAccounts()

  const [symbol, setSymbol] = useState("")
  const [stockName, setStockName] = useState("")
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [buyPrice, setBuyPrice] = useState("")
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState("")
  const [shares, setShares] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("main")
  const [note, setNote] = useState("")

  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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
        if (!buyPrice && stock.currentPrice > 0) {
          setBuyPrice(stock.currentPrice.toFixed(2))
        }
      } else {
        setSearchError("找不到此股票代號")
      }
    } catch {
      setSearchError("搜索股票時發生錯誤")
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const fetchPrice = async () => {
      if (!symbol.trim() || !buyDate) return

      const today = new Date().toISOString().split("T")[0]
      if (buyDate === today && currentPrice && currentPrice > 0) {
        setBuyPrice(currentPrice.toFixed(2))
        return
      }

      setIsFetchingPrice(true)
      try {
        const price = await fetchHistoricalPrice(symbol.trim(), buyDate)
        if (price && price > 0) {
          setBuyPrice(price.toFixed(2))
        }
      } catch (error) {
        console.error("Error fetching historical price:", error)
      } finally {
        setIsFetchingPrice(false)
      }
    }

    if (stockName) {
      fetchPrice()
    }
  }, [buyDate, symbol, stockName, currentPrice])

  useEffect(() => {
    if (amount && buyPrice) {
      const calculatedShares = Number.parseFloat(amount) / Number.parseFloat(buyPrice)
      if (!isNaN(calculatedShares) && calculatedShares > 0) {
        setShares(calculatedShares.toFixed(4))
      }
    }
  }, [amount, buyPrice])

  const handleSharesChange = (value: string) => {
    setShares(value)
    if (value && buyPrice) {
      const calculatedAmount = Number.parseFloat(value) * Number.parseFloat(buyPrice)
      if (!isNaN(calculatedAmount) && calculatedAmount > 0) {
        setAmount(calculatedAmount.toFixed(0))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symbol || !stockName || !buyPrice || !shares) {
      return
    }

    setIsSubmitting(true)

    try {
      addInvestment({
        accountType,
        symbol: symbol.toUpperCase(),
        name: stockName,
        shares: Number.parseFloat(shares),
        buyPrice: Number.parseFloat(buyPrice),
        currentPrice: currentPrice || Number.parseFloat(buyPrice),
        buyDate,
        note: note || undefined,
        source: "manual",
      })

      setSubmitSuccess(true)

      setTimeout(() => {
        setSymbol("")
        setStockName("")
        setCurrentPrice(null)
        setBuyPrice("")
        setBuyDate(new Date().toISOString().split("T")[0])
        setAmount("")
        setShares("")
        setNote("")
        setSubmitSuccess(false)
      }, 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">新增投資</h1>
        <BackupButton variant="ghost" size="icon" />
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">投資資訊</CardTitle>
            <CardDescription>輸入股票代號並選擇購買日期，系統會自動帶入當時的股價</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 股票搜索 */}
              <div className="space-y-2">
                <Label htmlFor="symbol">股票代號</Label>
                <div className="flex gap-2">
                  <Input
                    id="symbol"
                    placeholder="例如: 2330, 0050, 6431"
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
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold text-foreground">股票資訊已找到</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">股票名稱</span>
                    <span className="font-semibold text-foreground">{stockName}</span>
                  </div>
                  {currentPrice !== null && currentPrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">目前股價</span>
                      <span className="font-semibold text-foreground text-lg">${currentPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 購買日期 */}
              <div className="space-y-2">
                <Label htmlFor="buyDate">購買日期</Label>
                <Input
                  id="buyDate"
                  type="date"
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
                {isFetchingPrice && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在獲取當日股價...
                  </p>
                )}
              </div>

              {/* 購入價格 */}
              <div className="space-y-2">
                <Label htmlFor="buyPrice">購入價格</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">系統會根據購買日期自動帶入當時股價，您也可以手動修改</p>
              </div>

              {/* 投入金額 */}
              <div className="space-y-2">
                <Label htmlFor="amount">投入金額 (TWD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* 購入股數 */}
              <div className="space-y-2">
                <Label htmlFor="shares">購入股數</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.0001"
                  placeholder="0"
                  value={shares}
                  onChange={(e) => handleSharesChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">根據投入金額和股價自動計算，您也可以手動輸入股數</p>
              </div>

              {/* 帳戶類型 - 使用動態帳戶列表 */}
              <div className="space-y-2">
                <Label htmlFor="accountType">投資帳戶</Label>
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

              {/* 備註 */}
              <div className="space-y-2">
                <Label htmlFor="note">備註 (選填)</Label>
                <Input
                  id="note"
                  placeholder="例如: 存股第一筆"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* 提交按鈕 */}
              <Button
                type="submit"
                className={cn("w-full", submitSuccess && "bg-emerald-500 hover:bg-emerald-600")}
                disabled={!stockName || !buyPrice || !shares || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : submitSuccess ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : null}
                {submitSuccess ? "新增成功！" : "新增投資"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
