# 存股管理系統 - Electron 打包指南

## 安裝依賴

首先安裝所有必要的依賴：

```bash
npm install
```

## 開發模式

在開發模式下運行 Electron 應用：

```bash
npm run electron:dev
```

這會同時啟動 Next.js 開發伺服器和 Electron 視窗。

## 打包成執行檔

### Windows 版本

打包成 Windows 執行檔（.exe）：

```bash
npm run electron:build:win
```

產生的檔案位於 `dist` 資料夾：
- `存股管理系統 Setup.exe` - 安裝程式
- `存股管理系統.exe` - 綠色版（可攜式）

### macOS 版本

打包成 macOS 應用：

```bash
npm run electron:build:mac
```

產生的檔案：
- `.dmg` - macOS 安裝映像檔
- `.zip` - 壓縮應用程式

### Linux 版本

打包成 Linux 應用：

```bash
npm run electron:build:linux
```

產生的檔案：
- `.AppImage` - 通用 Linux 應用
- `.deb` - Debian/Ubuntu 安裝包

## 圖示設定

為了讓應用程式顯示自訂圖示，請準備以下檔案：

- `public/icon.ico` - Windows 圖示（256x256 或 512x512）
- `public/icon.icns` - macOS 圖示
- `public/icon.png` - Linux 圖示（512x512 PNG）

您可以使用線上工具將 PNG 圖片轉換為所需格式。

## 常見問題

### 1. 打包時出現 "export const dynamic" 錯誤

這個錯誤已經修正。系統現在使用完整的 Next.js 伺服器模式，而非靜態導出：
- `next.config.mjs` 已移除 `output: 'export'` 配置
- `electron/main.js` 會在生產模式下自動啟動內建的 Next.js 伺服器
- API 路由（股票查詢、歷史價格等）可以正常運作

### 2. 打包失敗

如果遇到打包失敗，請確認：
- 已執行 `npm install` 安裝所有依賴
- Node.js 版本為 18 或以上
- 有足夠的磁碟空間（至少 2GB）
- 確認 `.next` 資料夾已正確建立（執行 `npm run build` 後）

### 3. 執行檔無法啟動

- Windows: 可能被防毒軟體阻擋，請加入白名單
- macOS: 需要允許來自未識別開發者的應用程式
- Linux: 確認檔案具有執行權限 `chmod +x`

### 4. 股票資料無法載入

應用程式需要網路連線才能：
- 查詢即時股價
- 獲取歷史股價資料
- 搜尋股票代號和名稱

確保執行檔有網路存取權限，且防火牆未阻擋。

### 5. 資料儲存位置

應用程式的資料儲存在 localStorage，位於：
- Windows: `%APPDATA%\stock-management-system`
- macOS: `~/Library/Application Support/stock-management-system`
- Linux: `~/.config/stock-management-system`

備份功能會將資料下載為 JSON 檔案，可在需要時還原。

## 技術架構

本應用採用以下技術：
- **Electron**: 桌面應用框架
- **Next.js 16**: React 框架與 API 路由
- **React 19**: 使用者介面
- **Zustand**: 狀態管理
- **Recharts**: 圖表視覺化
- **Yahoo Finance API**: 股票資料來源

## 發布應用

打包完成後，您可以：
1. 直接分享 `dist` 資料夾中的執行檔
2. 上傳到雲端空間供他人下載
3. 建立安裝程式讓使用者安裝

## 更新應用

當程式碼有更新時：
1. 修改 `package.json` 中的版本號
2. 重新執行打包指令
3. 分發新版本給使用者

## 開發提示

- 開發時使用 `npm run electron:dev` 可以即時看到變更
- API 路由位於 `app/api/stock/` 目錄
- 狀態管理在 `lib/store.ts`
- 圖表組件在 `components/charts/` 目錄
