import type React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Sans_TC } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "存股系統 - 投資理財助手",
  description: "追蹤您的股票投資、定期定額，輕鬆管理多帳戶投資組合",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#10b981",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${notoSansTC.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
