## Why

目前編輯者要開啟某張圖卡，必須手動在網址列輸入 `index.html?mission=中文任務名稱`，既要記得精確的中文名稱、又得手動維護 `missions/index.json` 註冊清單。這對日常在 Google Sheet 編輯資料的記者來說摩擦很大。參考 Infogram「連結資料來源 → 從清單挑選 → 開啟」的流程，提供一個 dashboard 讓編輯者連結試算表後，直接從下拉選單挑選分頁（mission）載入模板。

## What Changes

- 新增獨立的靜態頁面 `dashboard.html`（與 `index.html` 平行），作為圖卡啟動入口。
- 編輯者貼上一次 Google 試算表網址即可「連結試算表」，網址記憶於 `localStorage`，下次自動帶入。
- 未有記憶網址時，dashboard 預設帶入目前使用的公開試算表。
- 透過 Google Sheets API v4（`spreadsheets.get`，公開讀取、用 API key、免 OAuth）列出該試算表所有分頁名稱與 `gid`，填入下拉選單。
- 選定分頁與版型後，dashboard 以 `index.html?sheet=<該 gid 的 gviz CSV 網址>&title=<分頁名稱>&template=<版型>` 開啟既有模板；模板載入路徑沿用現有 `?sheet=` 覆寫機制，不變更資料載入邏輯。
- 模板工具列可從同一試算表分頁清單直接切換 mission，並保留目前的版型選擇。
- 模板預覽依視窗縮放，以便完整檢視卡片；匯出仍維持原始設計尺寸。
- 連結失敗（網址格式錯誤／非公開／API 失敗）時於 dashboard 顯示明確錯誤訊息，不靜默失敗。

## Non-Goals (optional)

（保留至 design.md 的 Goals/Non-Goals 章節）

## Capabilities

### New Capabilities

- `mission-dashboard`: 連結 Google 試算表、列出分頁、挑選分頁與版型後以正確網址開啟既有模板的啟動入口。

### Modified Capabilities

（無）

## Impact

- Affected specs: 新增 `mission-dashboard`
- Affected code:
  - New: dashboard.html、src/dashboard.js、src/sheets-api.js、src/styles/dashboard.css
  - Modified: index.html、src/main.js、src/exporter.js、src/styles/main.css
  - Removed: （無）
- Dependencies: 需要一組 Google Sheets API v4 金鑰（限制為 Sheets API＋指定網域）。沿用既有 gviz CSV 與 html2canvas，無新增建置工具。
