"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Download, Upload } from "lucide-react"
import { useStore } from "@/lib/store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SyncStatus() {
  const { lastSynced, isSyncing, syncToCloud, loadFromCloud } = useStore()
  const [syncResult, setSyncResult] = useState<"success" | "error" | null>(null)

  // 自動同步 (每5分鐘)
  useEffect(() => {
    const interval = setInterval(
      () => {
        syncToCloud()
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [syncToCloud])

  // 初始載入雲端資料
  useEffect(() => {
    loadFromCloud()
  }, [loadFromCloud])

  const handleSync = async () => {
    setSyncResult(null)
    const success = await syncToCloud()
    setSyncResult(success ? "success" : "error")
    setTimeout(() => setSyncResult(null), 3000)
  }

  const handleLoad = async () => {
    setSyncResult(null)
    const success = await loadFromCloud()
    setSyncResult(success ? "success" : "error")
    setTimeout(() => setSyncResult(null), 3000)
  }

  const formatLastSynced = () => {
    if (!lastSynced) return "從未同步"
    const date = new Date(lastSynced)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "剛剛"
    if (diffMins < 60) return `${diffMins} 分鐘前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小時前`
    return date.toLocaleDateString("zh-TW")
  }

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-9" disabled={isSyncing}>
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                ) : syncResult === "success" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : syncResult === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : lastSynced ? (
                  <Cloud className="h-4 w-4 text-emerald-500" />
                ) : (
                  <CloudOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="hidden md:inline text-xs text-muted-foreground">
                  {isSyncing ? "同步中..." : formatLastSynced()}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>雲端同步</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
            <Upload className="h-4 w-4 mr-2" />
            上傳到雲端
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLoad} disabled={isSyncing}>
            <Download className="h-4 w-4 mr-2" />
            從雲端載入
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {lastSynced ? <>最後同步: {new Date(lastSynced).toLocaleString("zh-TW")}</> : <>尚未同步到雲端</>}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
