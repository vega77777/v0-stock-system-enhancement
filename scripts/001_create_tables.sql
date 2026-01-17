-- 投資紀錄表
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account TEXT NOT NULL,
  stock_id TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  shares DECIMAL(15,4) NOT NULL,
  avg_cost DECIMAL(15,4) NOT NULL,
  purchase_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investments_select_own" ON investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "investments_insert_own" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "investments_update_own" ON investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "investments_delete_own" ON investments FOR DELETE USING (auth.uid() = user_id);

-- 定期定額紀錄表
CREATE TABLE IF NOT EXISTS recurring_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account TEXT NOT NULL,
  stock_id TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  monthly_amount DECIMAL(15,2) NOT NULL,
  deduction_day INTEGER NOT NULL,
  start_year INTEGER NOT NULL,
  start_month INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recurring_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurring_investments_select_own" ON recurring_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_investments_insert_own" ON recurring_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_investments_update_own" ON recurring_investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_investments_delete_own" ON recurring_investments FOR DELETE USING (auth.uid() = user_id);

-- 配股配息紀錄表
CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
  stock_id TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  cash_dividend DECIMAL(15,4) DEFAULT 0,
  stock_dividend DECIMAL(15,4) DEFAULT 0,
  shares_held DECIMAL(15,4) NOT NULL,
  cash_received DECIMAL(15,2) DEFAULT 0,
  shares_received DECIMAL(15,4) DEFAULT 0,
  ex_dividend_date DATE,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dividends_select_own" ON dividends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dividends_insert_own" ON dividends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dividends_update_own" ON dividends FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dividends_delete_own" ON dividends FOR DELETE USING (auth.uid() = user_id);

-- 自定義孩子帳戶表
CREATE TABLE IF NOT EXISTS custom_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_accounts_select_own" ON custom_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "custom_accounts_insert_own" ON custom_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom_accounts_update_own" ON custom_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "custom_accounts_delete_own" ON custom_accounts FOR DELETE USING (auth.uid() = user_id);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_account ON investments(account);
CREATE INDEX IF NOT EXISTS idx_recurring_investments_user_id ON recurring_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_user_id ON dividends(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_stock_id ON dividends(stock_id);
CREATE INDEX IF NOT EXISTS idx_custom_accounts_user_id ON custom_accounts(user_id);
