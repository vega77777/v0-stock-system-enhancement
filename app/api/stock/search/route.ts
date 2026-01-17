import { type NextRequest, NextResponse } from "next/server"

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
  // 6431 光麗-KY 是上櫃股票
  "6431": "光麗-KY",
  "6432": "今展科",
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
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const upperQuery = query.toUpperCase()

    const isOTC = OTC_STOCKS.has(upperQuery)
    const symbols = isOTC ? [`${upperQuery}.TWO`, `${upperQuery}.TW`] : [`${upperQuery}.TW`, `${upperQuery}.TWO`]

    // 先檢查本地對照表
    if (STOCK_NAME_MAP[upperQuery]) {
      for (const symbol of symbols) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          })

          if (!response.ok) continue

          const data = await response.json()
          if (data.chart?.result?.[0]) {
            const meta = data.chart.result[0].meta
            return NextResponse.json({
              symbol: upperQuery,
              name: STOCK_NAME_MAP[upperQuery],
              price: Number(meta.regularMarketPrice?.toFixed(2)) || 0,
            })
          }
        } catch {
          continue
        }
      }

      // 如果無法獲取價格，仍返回股票資訊
      return NextResponse.json({
        symbol: upperQuery,
        name: STOCK_NAME_MAP[upperQuery],
        price: 0,
      })
    }

    // 嘗試從 Yahoo Finance 搜索
    for (const symbol of symbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (!response.ok) continue

        const data = await response.json()
        if (data.chart?.result?.[0]) {
          const meta = data.chart.result[0].meta
          return NextResponse.json({
            symbol: upperQuery,
            name: meta.shortName || meta.longName || upperQuery,
            price: Number(meta.regularMarketPrice?.toFixed(2)) || 0,
          })
        }
      } catch {
        continue
      }
    }

    return NextResponse.json({ error: "Stock not found" }, { status: 404 })
  } catch (error) {
    console.error("Error searching stock:", error)
    return NextResponse.json({ error: "Failed to search stock" }, { status: 500 })
  }
}
