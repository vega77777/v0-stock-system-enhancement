"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Download, Upload, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SettingsPage() {
  const { investments, recurringInvestments } = useStore()
  const [exportSuccess, setExportSuccess] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [importError, setImportError] = useState("")

  const handleExport = () => {
    const data = {
      investments,
      recurringInvestments,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stock-investment-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportSuccess(true)
    setTimeout(() => setExportSuccess(false), 3000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)

        if (!data.investments || !Array.isArray(data.investments)) {
          throw new Error("Invalid backup file format")
        }

        // 這裡應該要有 store 的 import 方法，但為了簡化，我們直接用 localStorage
        localStorage.setItem(
          "stock-investment-store",
          JSON.stringify({
            state: {
              investments: data.investments,
              recurringInvestments: data.recurringInvestments || [],
              stockCache: {},
            },
            version: 0,
          }),
        )

        setImportSuccess(true)
        setImportError("")
        setTimeout(() => {
          setImportSuccess(false)
          window.location.reload()
        }, 2000)
      } catch (error) {
        setImportError("匯入失敗：檔案格式不正確")
        setImportSuccess(false)
      }
    }
    reader.readAsText(file)
  }

  const handleClearAll = () => {
    localStorage.removeItem("stock-investment-store")
    window.location.reload()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">設定</h1>

      {/* 資料備份 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">資料備份</CardTitle>
          <CardDescription>匯出您的投資紀錄以便備份或轉移到其他裝置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExport} className="w-full gap-2">
            {exportSuccess ? <CheckCircle className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {exportSuccess ? "匯出成功！" : "匯出資料"}
          </Button>

          <div className="text-sm text-muted-foreground">
            目前資料：{investments.length} 筆投資紀錄，
            {recurringInvestments.length} 筆定期定額設定
          </div>
        </CardContent>
      </Card>

      {/* 資料還原 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">資料還原</CardTitle>
          <CardDescription>從備份檔案還原您的投資紀錄</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              {importSuccess ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {importSuccess ? "還原成功！重新載入中..." : "選擇備份檔案"}
            </Button>
          </div>

          {importError && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {importError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 清除資料 */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">危險區域</CardTitle>
          <CardDescription>以下操作無法復原，請謹慎操作</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2">
                <Trash2 className="h-4 w-4" />
                清除所有資料
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確定要清除所有資料嗎？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作將永久刪除所有投資紀錄和定期定額設定，無法復原。 建議先匯出備份後再進行此操作。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-red-500 hover:bg-red-600">
                  確定清除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
