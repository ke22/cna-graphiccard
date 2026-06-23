## Why

使用者在圖卡預覽頁（`index.html`）看到的內容來自 Google Sheet 的某個分頁，但目前工具列沒有任何方式可以回到原始試算表去檢視或修正來源資料。編輯者必須自行尋找試算表連結，流程不順。新增一個「查看原始表」連結，讓使用者一鍵在新分頁開啟目前預覽分頁所對應的 Google Sheet。

## What Changes

- 在工具列右側群組（`tb-group--right`，與「匯出」「教學」並列）新增一個指向來源 Google Sheet 的連結控制項。
- 連結以 `<a target="_blank" rel="noopener">` 呈現，樣式比照既有的「教學」連結（`toolbar-link`）。
- 連結網址在頁面載入時由 `setupMissionSwitch` 設定，指向「目前預覽分頁」對應的試算表編輯網址（含 `gid`）：`https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit?gid=<gid>#gid=<gid>`。
- 新增純函式 `buildSheetEditUrl(spreadsheetId, sheetId)` 至 `src/sheets-api.js`，與既有的 `buildGvizCsvUrl` / `buildTemplateUrl` 並列，負責組出編輯網址。
- 連結預設隱藏；僅當已確認載入某試算表（`setupMissionSwitch` 成功取得 `spreadsheetId`）時才顯示。本機 CSV 模式（`?mission=name`、無 `spreadsheet`/`gid`）下保持隱藏，因為沒有來源試算表。

## Non-Goals

- 不嵌入（embed）試算表內容到頁面內，只開新分頁。
- 不提供複製圖卡分享連結（`index.html?...`）的功能——本次僅針對「開啟來源試算表」。
- 不改變既有的試算表切換（`sheet-select`）或分頁切換（`mission-select`）行為。
- 不新增資料抓取；重用 `setupMissionSwitch` 已解析的記憶體狀態。

## Capabilities

### New Capabilities

- `source-sheet-link`: 工具列上指向目前預覽分頁所對應 Google Sheet 編輯網址的連結，含其顯示／隱藏條件與目標網址規則。

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 `source-sheet-link`
- Affected code:
  - New: 無新檔案（新增函式置於既有檔案）
  - Modified:
    - `index.html`（工具列右側新增連結元素）
    - `src/main.js`（`setupMissionSwitch` 設定連結網址與顯示狀態）
    - `src/sheets-api.js`（新增 `buildSheetEditUrl`）
  - Removed: 無
