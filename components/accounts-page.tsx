"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AccountType } from "@/lib/types"
import { useStore } from "@/lib/store"
import { AccountDetailView } from "./account-detail-view"
import { cn } from "@/lib/utils"

export function AccountsPage() {
  const { investments, getAllAccounts } = useStore()
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null)

  const allAccounts = getAllAccounts()

  if (selectedAccount) {
    return <AccountDetailView accountType={selectedAccount} />
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">帳戶管理</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAccounts.map((account) => {
          const accountInvestments = investments.filter((inv) => inv.accountType === account.id)
          const totalInvested = accountInvestments.reduce((sum, inv) => sum + inv.buyPrice * inv.shares, 0)
          const currentValue = accountInvestments.reduce((sum, inv) => sum + inv.currentPrice * inv.shares, 0)
          const profitLoss = currentValue - totalInvested
          const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

          return (
            <Card
              key={account.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedAccount(account.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <span className="text-3xl">{account.icon}</span>
                  <div>
                    <div className="text-lg">{account.name}</div>
                    <div className="text-sm font-normal text-muted-foreground">{account.description}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">持股數量</span>
                    <span className="text-foreground">{accountInvestments.length} 筆</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">投入金額</span>
                    <span className="text-foreground">
                      ${totalInvested.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">目前市值</span>
                    <span className="text-foreground">
                      ${currentValue.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">報酬率</span>
                    <span className={cn("font-medium", profitLossPercent >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {profitLossPercent >= 0 ? "+" : ""}
                      {profitLossPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
