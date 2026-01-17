"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Lock, TrendingUp } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // 檢查密碼
    if (password === "bhf10058") {
      // 設置 cookie 來記住已認證狀態
      document.cookie = `auth-token=authenticated; path=/; max-age=${60 * 60 * 24 * 7}` // 7天有效期
      router.push("/")
      router.refresh()
    } else {
      setError("密碼錯誤，請重新輸入")
      setIsLoading(false)
      setPassword("")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-gray-900 dark:via-background dark:to-gray-800 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl border-emerald-100 dark:border-emerald-900">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            存股管理系統
          </h1>
          <p className="text-muted-foreground text-sm">請輸入密碼以繼續</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 border-emerald-200 focus:border-emerald-500 dark:border-emerald-800"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
            disabled={isLoading || !password}
          >
            {isLoading ? "驗證中..." : "登入"}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          <p>投資理財，穩健前行</p>
        </div>
      </Card>
    </div>
  )
}
