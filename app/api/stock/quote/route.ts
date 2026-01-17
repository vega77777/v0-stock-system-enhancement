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

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
  }

  try {
    // 使用 Yahoo Finance API
    const cleanSymbol = symbol.replace(".TW", "").replace(".TWO", "")

    const isOTC = OTC_STOCKS.has(cleanSymbol)
    const symbols = isOTC ? [`${cleanSymbol}.TWO`, `${cleanSymbol}.TW`] : [`${cleanSymbol}.TW`, `${cleanSymbol}.TWO`]

    // 嘗試多個 API 來源
    const baseUrls = [
      "https://query1.finance.yahoo.com/v8/finance/chart/",
      "https://query2.finance.yahoo.com/v8/finance/chart/",
    ]

    let data = null
    for (const twSymbol of symbols) {
      for (const baseUrl of baseUrls) {
        try {
          const url = `${baseUrl}${twSymbol}?interval=1d&range=1d`
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          })
          if (response.ok) {
            data = await response.json()
            if (data?.chart?.result?.[0]) break
          }
        } catch {
          continue
        }
      }
      if (data?.chart?.result?.[0]) break
    }

    if (!data?.chart?.result?.[0]) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 })
    }

    const result = data.chart.result[0]
    const meta = result.meta
    const quote = result.indicators?.quote?.[0]

    const currentPrice = meta.regularMarketPrice || (quote?.close ? quote.close[quote.close.length - 1] : 0)
    const previousClose = meta.previousClose || meta.chartPreviousClose

    return NextResponse.json({
      symbol: cleanSymbol,
      name: meta.shortName || meta.longName || cleanSymbol,
      price: Number(currentPrice?.toFixed(2)) || 0,
      previousClose: Number(previousClose?.toFixed(2)) || 0,
      change: Number((currentPrice - previousClose)?.toFixed(2)) || 0,
      changePercent: Number((((currentPrice - previousClose) / previousClose) * 100)?.toFixed(2)) || 0,
    })
  } catch (error) {
    console.error("Error fetching stock quote:", error)
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
  }
}
