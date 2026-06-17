## Why

新聞媒體在製作重大事件時間軸圖卡時，需將大量文字資料（來自 Google 試算表/CSV）轉換為符合品牌規格的視覺卡片。現有流程仰賴人工逐張排版 SVG/設計稿，當內容超過單張卡片容量時，需手動判斷斷點並調整排版，效率低且容易出錯。

## What Changes

- **新增** CSV/Google 試算表資料讀取與解析功能
- **新增** 1200px 寬度固定、符合 SVG 模板樣式的 Timeline 渲染器
- **新增** 智慧斷頁機制：當 Timeline 節點（日期 + 內容文字）預計超越卡片高度邊界（1200px）時，自動將整個節點推至下一張卡片頂部，並在當前卡片底部留出合理間距
- **新增** 雙模式輸出：滾動視圖（所有卡片連續顯示）與獨立卡片匯出（每張 1200×1200px 可存為圖片）
- **新增** 任務目錄（missions/）結構，每個任務包含 CSV 資料與對應輸出

## Non-Goals

- 不支援線上即時同步 Google Sheets API（僅讀取匯出的 CSV 檔案）
- 不提供拖拉式視覺化編輯介面
- 不支援非 Timeline 形式的圖表類型（如圓餅圖、長條圖）

## Capabilities

### New Capabilities

- `csv-data-loader`: 讀取並解析 missions/ 目錄下的 CSV 檔案，將每列轉為具型別的 Timeline 節點資料結構（日期、內容、計算高度）
- `timeline-renderer`: 以 HTML/CSS 渲染 1200px 寬度的 Timeline 卡片，還原 SVG 模板視覺語言（深藍 #004E98 頁首、灰底 #F7F7F7、左側垂直線、圓點節點）
- `smart-pagination`: 運行時測量每個節點的 DOM 高度，在累積高度超過卡片可用區域（約 960px）前自動插入分頁，保持節點完整不被切割
- `dual-output-mode`: 提供滾動預覽視圖與獨立卡片匯出兩種輸出模式，匯出使用 html2canvas 將每張卡片截圖為 PNG

### Modified Capabilities

（無）

## Impact

- 受影響的 Spec：csv-data-loader、timeline-renderer、smart-pagination、dual-output-mode（全為新增）
- 受影響的程式碼：
  - 新增：missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv（已存在，作為首個任務資料）
  - 新增：index.html
  - 新增：src/main.js
  - 新增：src/csv-loader.js
  - 新增：src/renderer.js
  - 新增：src/paginator.js
  - 新增：src/exporter.js
  - 新增：src/styles/main.css
  - 新增：src/styles/timeline.css
