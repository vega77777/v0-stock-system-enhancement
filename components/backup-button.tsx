"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Download, Upload, CheckCircle } from "lucide-react"
import { downloadBackup, restoreFromBackup, type BackupData } from "@/lib/backup-utils"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface BackupButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
}

export function BackupButton({ variant = "ghost", size = "icon", showText = false }: BackupButtonProps) {
  const [isSuccess, setIsSuccess] = useState(false)

  const handleBackup = () => {
    downloadBackup()
    setIsSuccess(true)
    setTimeout(() => setIsSuccess(false), 2000)
  }

  const handleRestore = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const backupData = JSON.parse(event.target?.result as string) as BackupData
            const success = restoreFromBackup(backupData)
            if (success) {
              setIsSuccess(true)
              setTimeout(() => {
                setIsSuccess(false)
                window.location.reload()
              }, 1000)
            }
          } catch (error) {
            console.error("Failed to restore backup:", error)
            alert("備份檔案格式錯誤")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (showText) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={cn(isSuccess && "bg-emerald-500 hover:bg-emerald-600")}>
            {isSuccess ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isSuccess ? "已儲存" : "備份"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleBackup}>
            <Download className="h-4 w-4 mr-2" />
            下載備份
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRestore}>
            <Upload className="h-4 w-4 mr-2" />
            還原備份
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={cn(isSuccess && "bg-emerald-500 hover:bg-emerald-600")}>
          {isSuccess ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleBackup}>
          <Download className="h-4 w-4 mr-2" />
          下載備份
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRestore}>
          <Upload className="h-4 w-4 mr-2" />
          還原備份
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
