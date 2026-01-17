"use client"

import { useStore } from "./store"

export interface BackupData {
  version: string
  timestamp: string
  investments: any[]
  recurringInvestments: any[]
  childAccounts: any[]
}

export function createBackup(): BackupData {
  const state = useStore.getState()

  return {
    version: "1.0",
    timestamp: new Date().toISOString(),
    investments: state.investments,
    recurringInvestments: state.recurringInvestments,
    childAccounts: state.childAccounts,
  }
}

export function downloadBackup() {
  const backup = createBackup()
  const date = new Date()
  const filename = `存股系統備份_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}.json`

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function restoreFromBackup(backupData: BackupData): boolean {
  try {
    const state = useStore.getState()

    // 清空現有資料並恢復備份
    useStore.setState({
      investments: backupData.investments,
      recurringInvestments: backupData.recurringInvestments,
      childAccounts: backupData.childAccounts,
    })

    return true
  } catch (error) {
    console.error("Restore failed:", error)
    return false
  }
}

// 自動備份到 localStorage（作為安全網）
export function autoBackup() {
  try {
    const backup = createBackup()
    const backups = getAutoBackups()

    // 保留最近10個自動備份
    if (backups.length >= 10) {
      backups.shift()
    }

    backups.push(backup)
    localStorage.setItem("stock-system-auto-backups", JSON.stringify(backups))
  } catch (error) {
    console.error("Auto backup failed:", error)
  }
}

export function getAutoBackups(): BackupData[] {
  try {
    const data = localStorage.getItem("stock-system-auto-backups")
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}
