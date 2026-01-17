import type { Stock } from "./types"

// 台灣股票代碼對照表（包含無法從 API 獲取的股票）
const STOCK_NAME_MAP: Record<string, string> = {
  "0050": "元大台灣50",
  "0056": "元大高股息",
  "00878": "國泰永續高股息",
  "00713": "元大台灣高息低波",
  "00919": "群益台灣精選高息",
  "00929": "復華台灣科技優息",
  "00940": "元大台灣價值高息",
  "00850": "元大臺灣ESG永續",
  "00692": "富邦公司治理",
  "006208": "富邦台50",
  "2330": "台積電",
  "2317": "鴻海",
  "2454": "聯發科",
  "2412": "中華電",
  "2308": "台達電",
  "2303": "聯電",
  "2881": "富邦金",
  "2882": "國泰金",
  "2891": "中信金",
  "2886": "兆豐金",
  "2884": "玉山金",
  "2892": "第一金",
  "2887": "台新金",
  "2890": "永豐金",
  "2883": "開發金",
  "2885": "元大金",
  "2880": "華南金",
  "2888": "新光金",
  "2801": "彰銀",
  "5880": "合庫金",
  "2834": "臺企銀",
  "6431": "光麗-KY",
  "6432": "今展科",
  "6433": "冠德",
  "6435": "大中",
  "6438": "迅得",
  "6443": "元晶",
  "6446": "藥華藥",
  "6449": "鈺邦",
  "6451": "訊芯-KY",
  "6456": "GIS-KY",
  "6462": "神盾",
  "6464": "台數科",
  "6469": "大樹",
  "6472": "保瑞",
  "3008": "大立光",
  "2382": "廣達",
  "2327": "國巨",
  "2474": "可成",
  "3711": "日月光投控",
  "2357": "華碩",
  "2912": "統一超",
  "1301": "台塑",
  "1303": "南亞",
  "1326": "台化",
  "6505": "台塑化",
  "2002": "中鋼",
  "1402": "遠東新",
  "2207": "和泰車",
  "2395": "研華",
  "3045": "台灣大",
  "4904": "遠傳",
  "9910": "豐泰",
  "2379": "瑞昱",
  "3034": "聯詠",
  "5871": "中租-KY",
  "1216": "統一",
  "2345": "智邦",
  "2603": "長榮",
  "2609": "陽明",
  "2615": "萬海",
  "3037": "欣興",
  "2049": "上銀",
  "2301": "光寶科",
  "2377": "微星",
  "2353": "宏碁",
  "2356": "英業達",
  "3017": "奇鋐",
  "3231": "緯創",
  "4938": "和碩",
  "2324": "仁寶",
  "3443": "創意",
  "5347": "世界",
  "2408": "南亞科",
  "3533": "嘉澤",
  "6669": "緯穎",
  "2360": "致茂",
}

// 獲取股票即時報價
export async function fetchStockPrice(symbol: string): Promise<Stock | null> {
  try {
    // 優先嘗試上市股票 (.TW)
    let twSymbol = symbol.includes(".TW") || symbol.includes(".TWO") ? symbol : `${symbol}.TW`
    let response = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(twSymbol)}`)

    // 如果上市失敗，嘗試上櫃 (.TWO)
    if (!response.ok && !symbol.includes(".TWO")) {
      twSymbol = `${symbol}.TWO`
      response = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(twSymbol)}`)
    }

    if (!response.ok) {
      throw new Error("Failed to fetch stock price")
    }

    const data = await response.json()

    if (data.error) {
      const name = STOCK_NAME_MAP[symbol] || symbol
      return {
        symbol,
        name,
        currentPrice: 0,
        lastUpdated: new Date(),
      }
    }

    return {
      symbol,
      name: data.name || STOCK_NAME_MAP[symbol] || symbol,
      currentPrice: data.price || 0,
      previousClose: data.previousClose,
      change: data.change,
      changePercent: data.changePercent,
      lastUpdated: new Date(),
    }
  } catch (error) {
    console.error("Error fetching stock price:", error)
    const name = STOCK_NAME_MAP[symbol] || symbol
    return {
      symbol,
      name,
      currentPrice: 0,
      lastUpdated: new Date(),
    }
  }
}

// 獲取股票歷史價格
export async function fetchHistoricalPrice(symbol: string, date: string): Promise<number | null> {
  try {
    // 優先嘗試上市股票
    let twSymbol = symbol.includes(".TW") || symbol.includes(".TWO") ? symbol : `${symbol}.TW`
    let response = await fetch(
      `/api/stock/historical?symbol=${encodeURIComponent(twSymbol)}&date=${encodeURIComponent(date)}`,
    )

    // 如果上市失敗，嘗試上櫃
    if (!response.ok && !symbol.includes(".TWO")) {
      twSymbol = `${symbol}.TWO`
      response = await fetch(
        `/api/stock/historical?symbol=${encodeURIComponent(twSymbol)}&date=${encodeURIComponent(date)}`,
      )
    }

    if (!response.ok) {
      throw new Error("Failed to fetch historical price")
    }

    const data = await response.json()
    return data.price || null
  } catch (error) {
    console.error("Error fetching historical price:", error)
    return null
  }
}

// 搜索股票
export async function searchStock(query: string): Promise<Stock | null> {
  // 先檢查本地名稱對照表
  const symbol = query.toUpperCase()
  if (STOCK_NAME_MAP[symbol]) {
    const stock = await fetchStockPrice(symbol)
    if (stock) {
      // 確保有正確的名稱
      stock.name = STOCK_NAME_MAP[symbol]
    }
    return stock
  }

  // 嘗試透過 API 搜索
  try {
    const response = await fetch(`/api/stock/search?query=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error("Failed to search stock")
    }

    const data = await response.json()
    if (data.symbol) {
      return {
        symbol: data.symbol,
        name: data.name || STOCK_NAME_MAP[data.symbol] || data.symbol,
        currentPrice: data.price || 0,
        lastUpdated: new Date(),
      }
    }
    return null
  } catch (error) {
    console.error("Error searching stock:", error)
    return null
  }
}

// 獲取股票名稱
export function getStockName(symbol: string): string {
  return STOCK_NAME_MAP[symbol] || symbol
}

// 批量更新股價
export async function fetchMultipleStockPrices(symbols: string[]): Promise<Record<string, Stock>> {
  const results: Record<string, Stock> = {}

  // 並行獲取所有股票價格
  const promises = symbols.map(async (symbol) => {
    const stock = await fetchStockPrice(symbol)
    if (stock) {
      results[symbol] = stock
    }
  })

  await Promise.all(promises)
  return results
}
