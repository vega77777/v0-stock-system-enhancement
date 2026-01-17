"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { Gift, DollarSign, TrendingUp, Calculator, Plus, Trash2, Check } from "lucide-react"
import type { AccountType, DividendRecord } from "@/lib/types"

export function DividendPage() {
  const {
    investments,
    dividendRecords,
    getAllAccounts,
    addDividendRecord,
    updateDividendRecord,
    deleteDividendRecord,
    addInvestment,
  } = useStore()

  const allAccounts = getAllAccounts()

  // 表單狀態
  const [selectedAccount, setSelectedAccount] = useState<AccountType>("main")
  const [selectedSymbol, setSelectedSymbol] = useState<string>("")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [exDividendDate, setExDividendDate] = useState<string>("")
  const [paymentDate, setPaymentDate] = useState<string>("")
  const [cashDividend, setCashDividend] = useState<string>("")
  const [stockDividend, setStockDividend] = useState<string>("")

  // 取得該帳戶的持股列表
  const accountInvestments = useMemo(() => {
    return investments.filter((inv) => inv.accountType === selectedAccount)
  }, [investments, selectedAccount])

  // 取得選中股票的持有股數
  const holdingShares = useMemo(() => {
    if (!selectedSymbol) return 0
    return accountInvestments.filter((inv) => inv.symbol === selectedSymbol).reduce((sum, inv) => sum + inv.shares, 0)
  }, [accountInvestments, selectedSymbol])

  // 計算配股配息
  const calculatedDividend = useMemo(() => {
    const cash = Number.parseFloat(cashDividend) || 0
    const stock = Number.parseFloat(stockDividend) || 0

    // 現金股利計算
    const cashAmount = holdingShares * cash

    // 股票股利計算: 每1元股票股利 = 0.1股
    // 例如: 股票股利0.3元, 持有1000股 -> 0.3 * 1000 / 10 = 30股
    const stockShares = Math.floor((stock * holdingShares) / 10)

    return { cashAmount, stockShares }
  }, [holdingShares, cashDividend, stockDividend])

  // 取得股票名稱
  const getStockName = (symbol: string) => {
    const investment = investments.find((inv) => inv.symbol === symbol)
    return investment?.name || symbol
  }

  // 新增配股配息記錄
  const handleAddDividend = () => {
    if (!selectedSymbol || !exDividendDate) return

    const cash = Number.parseFloat(cashDividend) || 0
    const stock = Number.parseFloat(stockDividend) || 0

    addDividendRecord({
      accountType: selectedAccount,
      symbol: selectedSymbol,
      name: getStockName(selectedSymbol),
      year,
      exDividendDate,
      paymentDate: paymentDate || exDividendDate,
      cashDividend: cash,
      stockDividend: stock,
      holdingShares,
      cashAmount: calculatedDividend.cashAmount,
      stockShares: calculatedDividend.stockShares,
      reinvested: false,
    })

    // 重置表單
    setSelectedSymbol("")
    setCashDividend("")
    setStockDividend("")
    setExDividendDate("")
    setPaymentDate("")
  }

  // 將股票股利加入持股
  const handleReinvestStock = (dividend: DividendRecord) => {
    if (dividend.reinvested || dividend.stockShares <= 0) return

    // 新增股票股利為新的投資記錄
    addInvestment({
      accountType: dividend.accountType,
      symbol: dividend.symbol,
      name: dividend.name,
      shares: dividend.stockShares,
      buyPrice: 0, // 股票股利成本為 0
      currentPrice: 0,
      buyDate: dividend.paymentDate,
      source: "dividend",
      note: `${dividend.year}年股票股利`,
    })

    // 更新配股配息記錄
    updateDividendRecord(dividend.id, { reinvested: true })
  }

  // 統計資料
  const statistics = useMemo(() => {
    const totalCash = dividendRecords.reduce((sum, div) => sum + div.cashAmount, 0)
    const totalStockShares = dividendRecords.reduce((sum, div) => sum + div.stockShares, 0)
    const byYear: Record<number, { cash: number; stock: number }> = {}

    dividendRecords.forEach((div) => {
      if (!byYear[div.year]) {
        byYear[div.year] = { cash: 0, stock: 0 }
      }
      byYear[div.year].cash += div.cashAmount
      byYear[div.year].stock += div.stockShares
    })

    return { totalCash, totalStockShares, byYear }
  }, [dividendRecords])

  // 取得不重複的股票列表
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set(accountInvestments.map((inv) => inv.symbol))
    return Array.from(symbols)
  }, [accountInvestments])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">配股配息管理</h1>
          <p className="text-muted-foreground mt-1">管理您的股票股利和現金股利</p>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              累計現金股利
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">NT$ {statistics.totalCash.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" />
              累計股票股利
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">{statistics.totalStockShares.toLocaleString()} 股</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              配息記錄數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-500">{dividendRecords.length} 筆</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="add" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="add" className="gap-2">
            <Plus className="h-4 w-4" />
            新增配息
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Calculator className="h-4 w-4" />
            配息紀錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>新增配股配息</CardTitle>
              <CardDescription>輸入配股配息資訊，系統會自動計算您可獲得的股利</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>選擇帳戶</Label>
                  <Select value={selectedAccount} onValueChange={(v) => setSelectedAccount(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇帳戶" />
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

                <div className="space-y-2">
                  <Label>選擇股票</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇持有股票" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSymbols.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol} - {getStockName(symbol)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>年度</Label>
                  <Select value={year.toString()} onValueChange={(v) => setYear(Number.parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2024, 2023, 2022, 2021].map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y} 年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>除權息日</Label>
                  <Input type="date" value={exDividendDate} onChange={(e) => setExDividendDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>發放日 (選填)</Label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>持有股數</Label>
                  <Input value={holdingShares.toLocaleString()} disabled />
                </div>

                <div className="space-y-2">
                  <Label>現金股利 (每股)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="例如: 1.85"
                    value={cashDividend}
                    onChange={(e) => setCashDividend(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>股票股利 (每股)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="例如: 0.3"
                    value={stockDividend}
                    onChange={(e) => setStockDividend(e.target.value)}
                  />
                </div>
              </div>

              {/* 計算結果預覽 */}
              {selectedSymbol && holdingShares > 0 && (
                <Card className="bg-muted/50 mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">配息計算結果</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">現金股利:</span>
                      <span className="font-semibold text-emerald-500">
                        NT$ {calculatedDividend.cashAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">股票股利:</span>
                      <span className="font-semibold text-blue-500">
                        {calculatedDividend.stockShares.toLocaleString()} 股
                      </span>
                    </div>
                    {Number.parseFloat(stockDividend) > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        計算方式: {stockDividend} × {holdingShares.toLocaleString()} ÷ 10 ={" "}
                        {calculatedDividend.stockShares} 股
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleAddDividend}
                disabled={!selectedSymbol || !exDividendDate}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增配息記錄
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>配息紀錄</CardTitle>
              <CardDescription>所有配股配息的歷史紀錄</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>年度</TableHead>
                      <TableHead>帳戶</TableHead>
                      <TableHead>股票</TableHead>
                      <TableHead>持有股數</TableHead>
                      <TableHead>現金股利</TableHead>
                      <TableHead>股票股利</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dividendRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          尚無配息紀錄
                        </TableCell>
                      </TableRow>
                    ) : (
                      dividendRecords.map((dividend) => {
                        const account = allAccounts.find((a) => a.id === dividend.accountType)
                        return (
                          <TableRow key={dividend.id}>
                            <TableCell>{dividend.year}</TableCell>
                            <TableCell>{account?.name || dividend.accountType}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{dividend.symbol}</p>
                                <p className="text-xs text-muted-foreground">{dividend.name}</p>
                              </div>
                            </TableCell>
                            <TableCell>{dividend.holdingShares.toLocaleString()}</TableCell>
                            <TableCell className="text-emerald-500">
                              NT$ {dividend.cashAmount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-blue-500">{dividend.stockShares.toLocaleString()} 股</TableCell>
                            <TableCell>
                              {dividend.stockShares > 0 ? (
                                dividend.reinvested ? (
                                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                                    已入帳
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                                    待入帳
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="secondary">僅現金</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {dividend.stockShares > 0 && !dividend.reinvested && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReinvestStock(dividend)}
                                    className="text-emerald-500 hover:text-emerald-600"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    入帳
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteDividendRecord(dividend.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
