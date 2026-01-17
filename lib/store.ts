"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Investment,
  RecurringInvestment,
  DividendRecord,
  Stock,
  AccountType,
  RecurringExecutionRecord,
  AccountInfo,
} from "./types"
import { DEFAULT_CHILD_ACCOUNTS } from "./types"
import { autoBackup } from "./backup-utils"
import {
  syncInvestmentToCloud,
  deleteInvestmentFromCloud,
  syncRecurringToCloud,
  deleteRecurringFromCloud,
  syncDividendToCloud,
  deleteDividendFromCloud,
  syncAccountToCloud,
  deleteAccountFromCloud,
  fetchAllFromCloud,
} from "./supabase-sync"

interface StoreState {
  investments: Investment[]
  recurringInvestments: RecurringInvestment[]
  dividendRecords: DividendRecord[]
  stockCache: Record<string, Stock>
  childAccounts: AccountInfo[]
  lastSynced: string | null
  isSyncing: boolean

  // Investment actions
  addInvestment: (investment: Omit<Investment, "id">) => void
  addInvestments: (investments: Omit<Investment, "id">[]) => void
  updateInvestment: (id: string, updates: Partial<Investment>) => void
  deleteInvestment: (id: string) => void
  deleteInvestmentsByRecurringId: (recurringId: string) => void

  // Recurring investment actions
  addRecurringInvestment: (recurring: Omit<RecurringInvestment, "id" | "executionHistory">) => string
  updateRecurringInvestment: (id: string, updates: Partial<RecurringInvestment>) => void
  deleteRecurringInvestment: (id: string) => void
  addExecutionRecord: (recurringId: string, record: Omit<RecurringExecutionRecord, "id">) => void
  setExecutionHistory: (recurringId: string, records: Omit<RecurringExecutionRecord, "id">[]) => void

  addDividendRecord: (dividend: Omit<DividendRecord, "id" | "createdAt">) => void
  updateDividendRecord: (id: string, updates: Partial<DividendRecord>) => void
  deleteDividendRecord: (id: string) => void
  getDividendsByAccount: (accountType: AccountType) => DividendRecord[]
  getDividendsBySymbol: (symbol: string, accountType?: AccountType) => DividendRecord[]

  // Child account actions
  addChildAccount: (name: string) => void
  removeChildAccount: (accountId: string) => void
  updateChildAccountName: (accountId: string, newName: string) => void

  // Stock cache actions
  updateStockCache: (stocks: Record<string, Stock>) => void

  // Utility actions
  getInvestmentsByAccount: (accountType: AccountType) => Investment[]
  getRecurringByAccount: (accountType: AccountType) => RecurringInvestment[]
  getAllAccounts: () => AccountInfo[]
  updateAllPrices: (prices: Record<string, number>) => void

  syncToCloud: () => Promise<boolean>
  loadFromCloud: () => Promise<boolean>
  setLocalData: (data: {
    investments: Investment[]
    recurringInvestments: RecurringInvestment[]
    dividendRecords: DividendRecord[]
    childAccounts: AccountInfo[]
  }) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      investments: [],
      recurringInvestments: [],
      dividendRecords: [],
      stockCache: {},
      childAccounts: DEFAULT_CHILD_ACCOUNTS,
      lastSynced: null,
      isSyncing: false,

      addInvestment: (investment) => {
        const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newInvestment = { ...investment, id }
        set((state) => ({
          investments: [...state.investments, newInvestment],
        }))
        syncInvestmentToCloud(newInvestment)
        setTimeout(autoBackup, 100)
      },

      addInvestments: (investments) => {
        const newInvestments = investments.map((inv, index) => ({
          ...inv,
          id: `inv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        }))
        set((state) => ({
          investments: [...state.investments, ...newInvestments],
        }))
        newInvestments.forEach((inv) => syncInvestmentToCloud(inv))
        setTimeout(autoBackup, 100)
      },

      updateInvestment: (id, updates) => {
        set((state) => ({
          investments: state.investments.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
        }))
        const updated = get().investments.find((inv) => inv.id === id)
        if (updated) syncInvestmentToCloud(updated)
        setTimeout(autoBackup, 100)
      },

      deleteInvestment: (id) => {
        set((state) => ({
          investments: state.investments.filter((inv) => inv.id !== id),
        }))
        deleteInvestmentFromCloud(id)
        setTimeout(autoBackup, 100)
      },

      deleteInvestmentsByRecurringId: (recurringId) => {
        const toDelete = get().investments.filter((inv) => inv.recurringId === recurringId)
        set((state) => ({
          investments: state.investments.filter((inv) => inv.recurringId !== recurringId),
        }))
        toDelete.forEach((inv) => deleteInvestmentFromCloud(inv.id))
      },

      addRecurringInvestment: (recurring) => {
        const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newRecurring = { ...recurring, id, executionHistory: [] }
        set((state) => ({
          recurringInvestments: [...state.recurringInvestments, newRecurring],
        }))
        syncRecurringToCloud(newRecurring)
        setTimeout(autoBackup, 100)
        return id
      },

      updateRecurringInvestment: (id, updates) => {
        set((state) => ({
          recurringInvestments: state.recurringInvestments.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec)),
        }))
        const updated = get().recurringInvestments.find((rec) => rec.id === id)
        if (updated) syncRecurringToCloud(updated)
        setTimeout(autoBackup, 100)
      },

      deleteRecurringInvestment: (id) => {
        get().deleteInvestmentsByRecurringId(id)
        set((state) => ({
          recurringInvestments: state.recurringInvestments.filter((rec) => rec.id !== id),
        }))
        deleteRecurringFromCloud(id)
        setTimeout(autoBackup, 100)
      },

      addExecutionRecord: (recurringId, record) => {
        const recordId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          recurringInvestments: state.recurringInvestments.map((rec) =>
            rec.id === recurringId
              ? {
                  ...rec,
                  executionHistory: [...rec.executionHistory, { ...record, id: recordId }],
                }
              : rec,
          ),
        }))
        const updated = get().recurringInvestments.find((rec) => rec.id === recurringId)
        if (updated) syncRecurringToCloud(updated)
      },

      setExecutionHistory: (recurringId, records) => {
        set((state) => ({
          recurringInvestments: state.recurringInvestments.map((rec) =>
            rec.id === recurringId
              ? {
                  ...rec,
                  executionHistory: records.map((r, idx) => ({
                    ...r,
                    id: `exec_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
                  })),
                }
              : rec,
          ),
        }))
        const updated = get().recurringInvestments.find((rec) => rec.id === recurringId)
        if (updated) syncRecurringToCloud(updated)
      },

      addDividendRecord: (dividend) => {
        const id = `div_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newDividend: DividendRecord = {
          ...dividend,
          id,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          dividendRecords: [...state.dividendRecords, newDividend],
        }))
        syncDividendToCloud(newDividend)
        setTimeout(autoBackup, 100)
      },

      updateDividendRecord: (id, updates) => {
        set((state) => ({
          dividendRecords: state.dividendRecords.map((div) => (div.id === id ? { ...div, ...updates } : div)),
        }))
        const updated = get().dividendRecords.find((div) => div.id === id)
        if (updated) syncDividendToCloud(updated)
        setTimeout(autoBackup, 100)
      },

      deleteDividendRecord: (id) => {
        set((state) => ({
          dividendRecords: state.dividendRecords.filter((div) => div.id !== id),
        }))
        deleteDividendFromCloud(id)
        setTimeout(autoBackup, 100)
      },

      getDividendsByAccount: (accountType) => {
        return get().dividendRecords.filter((div) => div.accountType === accountType)
      },

      getDividendsBySymbol: (symbol, accountType) => {
        const dividends = get().dividendRecords.filter((div) => div.symbol === symbol)
        if (accountType) {
          return dividends.filter((div) => div.accountType === accountType)
        }
        return dividends
      },

      addChildAccount: (name) => {
        const id = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const icons = ["👦", "👧", "👶", "🧒", "👨", "👩"]
        const iconIndex = get().childAccounts.length % icons.length
        const newAccount: AccountInfo = {
          id,
          name,
          icon: icons[iconIndex],
          description: `${name}存股帳戶`,
          parentId: "children",
          isCustom: true,
        }
        set((state) => ({
          childAccounts: [...state.childAccounts, newAccount],
        }))
        syncAccountToCloud(newAccount)
        setTimeout(autoBackup, 100)
      },

      removeChildAccount: (accountId) => {
        set((state) => ({
          childAccounts: state.childAccounts.filter((acc) => acc.id !== accountId),
          investments: state.investments.filter((inv) => inv.accountType !== accountId),
          recurringInvestments: state.recurringInvestments.filter((rec) => rec.accountType !== accountId),
          dividendRecords: state.dividendRecords.filter((div) => div.accountType !== accountId),
        }))
        deleteAccountFromCloud(accountId)
        setTimeout(autoBackup, 100)
      },

      updateChildAccountName: (accountId, newName) => {
        set((state) => ({
          childAccounts: state.childAccounts.map((acc) =>
            acc.id === accountId ? { ...acc, name: newName, description: `${newName}存股帳戶` } : acc,
          ),
        }))
        const updated = get().childAccounts.find((acc) => acc.id === accountId)
        if (updated) syncAccountToCloud(updated)
        setTimeout(autoBackup, 100)
      },

      updateStockCache: (stocks) => {
        set((state) => ({
          stockCache: { ...state.stockCache, ...stocks },
        }))
      },

      getInvestmentsByAccount: (accountType) => {
        return get().investments.filter((inv) => inv.accountType === accountType)
      },

      getRecurringByAccount: (accountType) => {
        return get().recurringInvestments.filter((rec) => rec.accountType === accountType)
      },

      getAllAccounts: () => {
        const { childAccounts } = get()
        return [
          { id: "main", name: "主帳戶", icon: "💼", description: "主要投資帳戶" },
          { id: "retirement", name: "退休金", icon: "🏖️", description: "退休金規劃" },
          ...childAccounts,
        ]
      },

      updateAllPrices: (prices) => {
        set((state) => ({
          investments: state.investments.map((inv) => ({
            ...inv,
            currentPrice: prices[inv.symbol] ?? inv.currentPrice,
          })),
        }))
      },

      syncToCloud: async () => {
        set({ isSyncing: true })
        try {
          const { investments, recurringInvestments, dividendRecords, childAccounts } = get()

          for (const inv of investments) {
            await syncInvestmentToCloud(inv)
          }
          for (const rec of recurringInvestments) {
            await syncRecurringToCloud(rec)
          }
          for (const div of dividendRecords) {
            await syncDividendToCloud(div)
          }
          for (const acc of childAccounts) {
            await syncAccountToCloud(acc)
          }

          set({ lastSynced: new Date().toISOString(), isSyncing: false })
          return true
        } catch (error) {
          console.error("[v0] Sync to cloud error:", error)
          set({ isSyncing: false })
          return false
        }
      },

      loadFromCloud: async () => {
        set({ isSyncing: true })
        try {
          const data = await fetchAllFromCloud()

          if (
            data.investments.length > 0 ||
            data.recurringInvestments.length > 0 ||
            data.dividendRecords.length > 0 ||
            data.childAccounts.length > 0
          ) {
            set({
              investments: data.investments,
              recurringInvestments: data.recurringInvestments,
              dividendRecords: data.dividendRecords,
              childAccounts: data.childAccounts.length > 0 ? data.childAccounts : DEFAULT_CHILD_ACCOUNTS,
              lastSynced: new Date().toISOString(),
              isSyncing: false,
            })
          } else {
            set({ isSyncing: false })
          }
          return true
        } catch (error) {
          console.error("[v0] Load from cloud error:", error)
          set({ isSyncing: false })
          return false
        }
      },

      setLocalData: (data) => {
        set({
          investments: data.investments,
          recurringInvestments: data.recurringInvestments,
          dividendRecords: data.dividendRecords,
          childAccounts: data.childAccounts,
        })
      },
    }),
    {
      name: "stock-investment-store",
    },
  ),
)
