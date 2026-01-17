export interface Stock {
  symbol: string
  name: string
  currentPrice: number
  previousClose?: number
  change?: number
  changePercent?: number
  lastUpdated?: Date
}

export interface Investment {
  id: string
  accountType: AccountType
  symbol: string
  name: string
  shares: number
  buyPrice: number
  currentPrice: number
  buyDate: string
  note?: string
  source?: "manual" | "recurring" | "dividend"
  recurringId?: string
}

export interface RecurringInvestment {
  id: string
  accountType: AccountType
  symbol: string
  name: string
  amount: number
  dayOfMonth: number
  startDate: string
  isActive: boolean
  executionHistory: RecurringExecutionRecord[]
}

export interface RecurringExecutionRecord {
  id: string
  date: string
  symbol: string
  name: string
  amount: number
  price: number
  shares: number
  marketValue: number
}

export interface DividendRecord {
  id: string
  accountType: AccountType
  symbol: string
  name: string
  year: number
  exDividendDate: string // 除權息日
  paymentDate: string // 發放日
  cashDividend: number // 現金股利 (每股)
  stockDividend: number // 股票股利 (每股)
  holdingShares: number // 持有股數
  cashAmount: number // 獲得現金
  stockShares: number // 獲得股數
  reinvested: boolean // 是否已將股票股利加入持股
  createdAt: string
}

export type AccountType = "main" | "retirement" | string

export interface AccountInfo {
  id: AccountType
  name: string
  icon: string
  description: string
  parentId?: string
  isCustom?: boolean
}

export const DEFAULT_ACCOUNTS: AccountInfo[] = [
  { id: "main", name: "主帳戶", icon: "💼", description: "主要投資帳戶" },
  { id: "retirement", name: "退休金", icon: "🏖️", description: "退休金規劃" },
]

export const DEFAULT_CHILD_ACCOUNTS: AccountInfo[] = [
  { id: "bingsheng", name: "秉昇", icon: "👦", description: "秉昇存股帳戶", parentId: "children", isCustom: true },
  { id: "liangying", name: "亮穎", icon: "👧", description: "亮穎存股帳戶", parentId: "children", isCustom: true },
  { id: "liangqiao", name: "亮喬", icon: "👶", description: "亮喬存股帳戶", parentId: "children", isCustom: true },
]

export const ACCOUNT_COLORS: Record<string, string> = {
  main: "#22c55e",
  retirement: "#ec4899",
  bingsheng: "#f97316",
  liangying: "#3b82f6",
  liangqiao: "#ef4444",
}

const colorPalette = ["#8b5cf6", "#06b6d4", "#84cc16", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"]
export function getAccountColor(accountId: string, index = 0): string {
  return ACCOUNT_COLORS[accountId] || colorPalette[index % colorPalette.length]
}

export interface StoreState {
  investments: Investment[]
  recurringInvestments: RecurringInvestment[]
  dividendRecords: DividendRecord[]
  stockCache: Record<string, Stock>
  customChildAccounts: AccountInfo[]
}
