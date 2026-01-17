import { type NextRequest, NextResponse } from "next/server"

const OTC_STOCKS = new Set([
  "6431",
  "6432",
  "6435",
  "6438",
  "6443",
  "6446",
  "6449",
  "6451",
  "6456",
  "6462",
  "6464",
  "6469",
  "6472",
  "3293",
  "5765",
  "6488",
  "8446",
  "3265",
  "6547",
  "8069",
  "6531",
  "8050",
  "5765",
  "6598",
])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const date = searchParams.get("date")

  if (!symbol || !date) {
    return NextResponse.json({ error: "Symbol and date are required" }, { status: 400 })
  }

  try {
    const cleanSymbol = symbol.replace(".TW", "").replace(".TWO", "")

    // 解析日期
    const targetDate = new Date(date)
    const startDate = new Date(targetDate)
    startDate.setDate(startDate.getDate() - 7) // 往前找7天確保有交易日
    const endDate = new Date(targetDate)
    endDate.setDate(endDate.getDate() + 1)

    const period1 = Math.floor(startDate.getTime() / 1000)
    const period2 = Math.floor(endDate.getTime() / 1000)

    const isOTC = OTC_STOCKS.has(cleanSymbol)
    const symbols = isOTC ? [`${cleanSymbol}.TWO`, `${cleanSymbol}.TW`] : [`${cleanSymbol}.TW`, `${cleanSymbol}.TWO`]

    for (const twSymbol of symbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${twSymbol}?period1=${period1}&period2=${period2}&interval=1d`

        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (!response.ok) continue

        const data = await response.json()

        if (!data.chart?.result?.[0]) continue

        const result = data.chart.result[0]
        const timestamps = result.timestamp || []
        const closes = result.indicators?.quote?.[0]?.close || []

        // 找到最接近目標日期的價格
        const targetTime = targetDate.getTime() / 1000
        let closestIndex = 0
        let closestDiff = Math.abs(timestamps[0] - targetTime)

        for (let i = 1; i < timestamps.length; i++) {
          const diff = Math.abs(timestamps[i] - targetTime)
          if (diff < closestDiff && timestamps[i] <= targetTime + 86400) {
            closestDiff = diff
            closestIndex = i
          }
        }

        const price = closes[closestIndex]
        if (price && price > 0) {
          return NextResponse.json({
            symbol: cleanSymbol,
            date,
            price: Number(price.toFixed(2)),
          })
        }
      } catch {
        continue
      }
    }

    return NextResponse.json({ error: "Price not found for date" }, { status: 404 })
  } catch (error) {
    console.error("Error fetching historical price:", error)
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
  }
}
