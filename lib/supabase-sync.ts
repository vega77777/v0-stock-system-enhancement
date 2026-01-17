"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Investment, RecurringInvestment, DividendRecord, AccountInfo, RecurringExecutionRecord } from "./types"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface SyncStatus {
  lastSynced: Date | null
  isSyncing: boolean
  error: string | null
}

// 投資記錄同步
export async function syncInvestmentToCloud(investment: Investment): Promise<boolean> {
  try {
    const { error } = await supabase.from("investments").upsert({
      id: investment.id,
      account_type: investment.accountType,
      symbol: investment.symbol,
      name: investment.name,
      shares: investment.shares,
      buy_price: investment.buyPrice,
      current_price: investment.currentPrice,
      buy_date: investment.buyDate,
      note: investment.note || null,
      source: investment.source || "manual",
      recurring_id: investment.recurringId || null,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Sync investment error:", error)
    return false
  }
}

export async function deleteInvestmentFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("investments").delete().eq("id", id)
    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Delete investment error:", error)
    return false
  }
}

export async function fetchInvestmentsFromCloud(): Promise<Investment[]> {
  try {
    const { data, error } = await supabase.from("investments").select("*").order("buy_date", { ascending: false })

    if (error) throw error

    return (data || []).map((row) => ({
      id: row.id,
      accountType: row.account_type,
      symbol: row.symbol,
      name: row.name,
      shares: row.shares,
      buyPrice: row.buy_price,
      currentPrice: row.current_price,
      buyDate: row.buy_date,
      note: row.note,
      source: row.source,
      recurringId: row.recurring_id,
    }))
  } catch (error) {
    console.error("[v0] Fetch investments error:", error)
    return []
  }
}

// 定期定額同步
export async function syncRecurringToCloud(recurring: RecurringInvestment): Promise<boolean> {
  try {
    const { error } = await supabase.from("recurring_investments").upsert({
      id: recurring.id,
      account_type: recurring.accountType,
      symbol: recurring.symbol,
      name: recurring.name,
      amount: recurring.amount,
      day_of_month: recurring.dayOfMonth,
      start_date: recurring.startDate,
      is_active: recurring.isActive,
      execution_history: JSON.stringify(recurring.executionHistory),
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Sync recurring error:", error)
    return false
  }
}

export async function deleteRecurringFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("recurring_investments").delete().eq("id", id)
    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Delete recurring error:", error)
    return false
  }
}

export async function fetchRecurringFromCloud(): Promise<RecurringInvestment[]> {
  try {
    const { data, error } = await supabase
      .from("recurring_investments")
      .select("*")
      .order("start_date", { ascending: false })

    if (error) throw error

    return (data || []).map((row) => ({
      id: row.id,
      accountType: row.account_type,
      symbol: row.symbol,
      name: row.name,
      amount: row.amount,
      dayOfMonth: row.day_of_month,
      startDate: row.start_date,
      isActive: row.is_active,
      executionHistory: JSON.parse(row.execution_history || "[]") as RecurringExecutionRecord[],
    }))
  } catch (error) {
    console.error("[v0] Fetch recurring error:", error)
    return []
  }
}

// 配股配息同步
export async function syncDividendToCloud(dividend: DividendRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from("dividends").upsert({
      id: dividend.id,
      account_type: dividend.accountType,
      symbol: dividend.symbol,
      name: dividend.name,
      year: dividend.year,
      ex_dividend_date: dividend.exDividendDate,
      payment_date: dividend.paymentDate,
      cash_dividend: dividend.cashDividend,
      stock_dividend: dividend.stockDividend,
      holding_shares: dividend.holdingShares,
      cash_amount: dividend.cashAmount,
      stock_shares: dividend.stockShares,
      reinvested: dividend.reinvested,
      created_at: dividend.createdAt,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Sync dividend error:", error)
    return false
  }
}

export async function deleteDividendFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("dividends").delete().eq("id", id)
    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Delete dividend error:", error)
    return false
  }
}

export async function fetchDividendsFromCloud(): Promise<DividendRecord[]> {
  try {
    const { data, error } = await supabase.from("dividends").select("*").order("year", { ascending: false })

    if (error) throw error

    return (data || []).map((row) => ({
      id: row.id,
      accountType: row.account_type,
      symbol: row.symbol,
      name: row.name,
      year: row.year,
      exDividendDate: row.ex_dividend_date,
      paymentDate: row.payment_date,
      cashDividend: row.cash_dividend,
      stockDividend: row.stock_dividend,
      holdingShares: row.holding_shares,
      cashAmount: row.cash_amount,
      stockShares: row.stock_shares,
      reinvested: row.reinvested,
      createdAt: row.created_at,
    }))
  } catch (error) {
    console.error("[v0] Fetch dividends error:", error)
    return []
  }
}

// 自定義帳戶同步
export async function syncAccountToCloud(account: AccountInfo): Promise<boolean> {
  try {
    const { error } = await supabase.from("custom_accounts").upsert({
      id: account.id,
      name: account.name,
      icon: account.icon,
      description: account.description,
      parent_id: account.parentId || null,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Sync account error:", error)
    return false
  }
}

export async function deleteAccountFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("custom_accounts").delete().eq("id", id)
    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Delete account error:", error)
    return false
  }
}

export async function fetchAccountsFromCloud(): Promise<AccountInfo[]> {
  try {
    const { data, error } = await supabase.from("custom_accounts").select("*").order("created_at", { ascending: true })

    if (error) throw error

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      description: row.description,
      parentId: row.parent_id,
      isCustom: true,
    }))
  } catch (error) {
    console.error("[v0] Fetch accounts error:", error)
    return []
  }
}

// 完整資料同步
export async function syncAllToCloud(data: {
  investments: Investment[]
  recurringInvestments: RecurringInvestment[]
  dividendRecords: DividendRecord[]
  childAccounts: AccountInfo[]
}): Promise<boolean> {
  try {
    // 同步投資
    for (const inv of data.investments) {
      await syncInvestmentToCloud(inv)
    }

    // 同步定期定額
    for (const rec of data.recurringInvestments) {
      await syncRecurringToCloud(rec)
    }

    // 同步配股配息
    for (const div of data.dividendRecords) {
      await syncDividendToCloud(div)
    }

    // 同步帳戶
    for (const acc of data.childAccounts) {
      await syncAccountToCloud(acc)
    }

    return true
  } catch (error) {
    console.error("[v0] Sync all error:", error)
    return false
  }
}

export async function fetchAllFromCloud(): Promise<{
  investments: Investment[]
  recurringInvestments: RecurringInvestment[]
  dividendRecords: DividendRecord[]
  childAccounts: AccountInfo[]
}> {
  const [investments, recurringInvestments, dividendRecords, childAccounts] = await Promise.all([
    fetchInvestmentsFromCloud(),
    fetchRecurringFromCloud(),
    fetchDividendsFromCloud(),
    fetchAccountsFromCloud(),
  ])

  return { investments, recurringInvestments, dividendRecords, childAccounts }
}
