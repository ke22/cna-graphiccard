## 1. 專案基礎設置（技術選型：純 html/css/js，無框架 / 模組職責劃分）

- [x] 1.1 建立 `index.html`（範圍邊界確立）：頁面載入時從 URL `?mission=` 參數讀取任務名稱，引入 html2canvas CDN（`https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`）、`src/styles/main.css`、`src/styles/timeline.css`、`src/main.js`（type=module）。本方案採技術選型：純 HTML/CSS/JS，無框架，無建置工具，記者直接在本機瀏覽器開啟。驗證：在瀏覽器開啟 `index.html?mission=test`，DevTools Network 面板中 html2canvas 與 CSS 均載入成功，頁面無 console error。

- [x] 1.2 建立 `src/styles/main.css`，實作 CSS 設計 Token 系統（css 視覺設計系統）：定義 `--color-header: #004E98`、`--color-bg: #F7F7F7`、`--color-node: #004E98`、`--color-line: #B9BBC2`、`--color-text-year: #1F2933`、`--color-text-content: #12141A`、`--card-width: 1200px`、`--header-height: 232px`，並設定全域字體與背景（深色背景 `#1a1a2e`）。驗證：在 DevTools Console 執行 `getComputedStyle(document.documentElement).getPropertyValue('--color-header').trim()` 回傳 `#004E98`。

## 2. CSV 資料載入（csv-data-loader）

- [x] 2.1 實作 `src/csv-loader.js` 的 RFC 4180 CSV 解析器：支援引號包覆欄位（含逗號、換行、雙引號跳脫），正確跳過第一行標頭。驗證：在 DevTools Console 匯入並呼叫 `import { parseCSV } from './src/csv-loader.js'; parseCSV('a,b\n"1,2","3\n4"')` 應回傳 `[{a: '1,2', b: '3\n4'}]`（欄位含逗號與換行均被正確保留）。

- [x] 2.2 實作 `src/csv-loader.js` 的 `loadNodes(missionName)` async 函式（資料介面 / Node array output contract）：函式簽名為 `loadNodes(missionName): Promise<Array<{date: string, content: string}>>`，使用 `fetch` 取得 `missions/{missionName}/` 下的第一個 CSV 檔（需有機制定位檔名，例如維護一個 index 或使用固定檔名對應，或在 HTML 提供 data attribute），回傳節點陣列，順序與 CSV 相同。驗證：呼叫 `await loadNodes('2026_美伊戰爭大事記')` 回傳長度為 22 的陣列，第一個元素 `date` 為 `"2月28日"`。

- [x] 2.3 實作 `loadNodes` 的失敗模式與錯誤處理（csv-data-loader 錯誤情境 / 失敗模式）：當 fetch 回傳 404 或網路失敗時，函式拋出包含任務名稱的 Error，呼叫端在頁面顯示 "無法載入資料：{missionName} 不存在"。驗證：開啟 `index.html?mission=nonexistent`，頁面顯示錯誤訊息而非空白或未捕獲例外。

## 3. 智慧斷頁（smart-pagination / 斷頁演算法：運行時 DOM 高度測量）

- [x] 3.1 實作 `src/paginator.js` 的 Runtime DOM height measurement 隱藏測量容器：建立一個 `visibility:hidden; position:absolute; top:-9999px; width:1160px`（卡片內容區寬度）的 div 附加至 body，用於測量節點真實渲染高度，awaits `document.fonts.ready` 確保字型載入後再量測。驗證：開啟頁面後，DevTools Elements 面板中可找到一個 `id="measure-container"` 的元素位於文件流外。

- [x] 3.2 實作 `src/paginator.js` 的 `paginate(nodes, maxHeight = 888)` async 函式（Node integrity during pagination）：對每個節點渲染至測量容器後取 `getBoundingClientRect().height`，依節點完整不切割原則（累積高度 + 節點高度 > maxHeight 時開新卡片）分組，單一節點超過 maxHeight 時強制放入並輸出 console warning（Oversized node fallback）。驗證：在 DevTools Console 執行 `await paginate(nodes)`（22 個節點），回傳陣列長度 2–4，所有子陣列節點總數為 22，不存在空子陣列。

- [x] 3.3 驗證斷頁節點完整性（node integrity during pagination）：觀察所有 22 個節點均出現且各只出現一次。驗證：在 Console 執行 `paginate(nodes).then(cards => cards.flat().length)` 回傳 22。

## 4. 卡片渲染（timeline-renderer）

- [x] 4.1 建立 `src/styles/timeline.css`，實作 CSS design token system 與 Timeline node visual structure 樣式：定義 `.card`（1200px 寬、min-height 1200px、背景 `var(--color-bg)`）、`.card-header`（height `var(--header-height)`、background `var(--color-header)`）、`.timeline-line`（垂直線，width 4px、background `var(--color-line)`）、`.node-dot`（直徑 30px 圓形、background `var(--color-node)`）、`.node-date`（color `var(--color-text-year)`、font-weight bold）、`.node-content`（color `var(--color-text-content)`）。驗證：渲染任意卡片後，在 DevTools 檢查 `.card-header` 的計算背景色為 `rgb(0, 78, 152)`（即 `#004E98`）。

- [x] 4.2 實作 `src/renderer.js` 的 `renderCards(pagedNodes)` 函式，渲染 Timeline node visual structure：接受二維節點陣列，為每個子陣列建立一個 `.card` DOM 元素（含 `.card-header`、`.timeline-line`、每個節點的 `.node-dot + .node-date + .node-content`），多段落內容（含 `\n\n`）拆分為多個 `<p>` 元素。驗證：呼叫 `renderCards([[{date:'3月8日',content:'段落一\n\n段落二'}]])` 後，`.node-content` 內包含 2 個 `<p>` 元素。

- [x] 4.3 確認卡片 DOM 符合 card visual structure 規格（驗收條件：固定 1200px 寬、header 232px 高）：在渲染完成後，對 document.querySelectorAll('.card') 逐一檢查 `offsetWidth === 1200` 與 `.card-header` 的 `offsetHeight === 232`。驗證：DevTools Console 執行 `[...document.querySelectorAll('.card')].every(c => c.offsetWidth === 1200)` 回傳 `true`。

## 5. 主流程整合（行為（使用者觀察） / 雙輸出模式架構）

- [x] 5.1 實作 `src/main.js` 主流程（scrollable preview layout / Scrollable preview layout）：從 URL 讀取 `mission` 參數 → `loadNodes` → `paginate` → `renderCards` → 掛載至頁面；捕捉錯誤並顯示錯誤訊息。驗證：開啟 `index.html?mission=2026_美伊戰爭大事記`，頁面無 console error，且可看到 2–4 張卡片垂直排列，每張均有深藍頁首，22 個節點全部可見（`document.querySelectorAll('.node-date').length === 22`）。

- [x] 5.2 建立工具列並實作 Preview mode as default（雙輸出模式架構）：在頁面頂部渲染固定定位工具列，顯示任務名稱（來自 URL 參數）與「匯出所有卡片」按鈕（id=`btn-export`），預設載入即為預覽模式。驗證：頁面載入後 `document.getElementById('btn-export')` 不為 null，工具列顯示正確任務名稱，且所有卡片可滾動瀏覽。

## 6. 匯出功能（dual-output-mode / PNG export for each card）

- [x] 6.1 實作 `src/exporter.js` 的 `exportCards()` 函式（PNG export for each card / Export progress feedback）：使用 `html2canvas(cardEl, { scale: 2 })` 截圖，以 `<a download="card-{n}.png">` 方式觸發下載，依序處理每張卡片，每完成一張更新按鈕文字為「匯出中… ({n}/{total})」（Export progress feedback），全部完成後文字恢復「匯出所有卡片」。驗證：點擊匯出按鈕後，瀏覽器依序觸發 N 個 PNG 下載（N = 卡片總數），且每個 PNG 大小大於 10KB（代表非空圖）。

- [x] 6.2 實作 html2canvas 不可用時的 export error handling（Export error handling）：在 `DOMContentLoaded` 時檢查 `window.html2canvas`，若不存在則將 `btn-export` 設為 `disabled`，並設定 `title="請在 Chrome/Firefox 中開啟"`。驗證：在 DevTools Console 執行 `delete window.html2canvas; location.reload()`，頁面重載後按鈕呈現 disabled 狀態。

- [x] 6.3 驗證 export produces one PNG per card（2x scale / 驗收條件確認）：匯出 3 張卡片後，下載的 3 個 PNG 檔名為 `card-1.png`、`card-2.png`、`card-3.png`，且各檔案在圖片編輯器中開啟後尺寸為 2400×2400px（scale: 2 的效果）。驗證：手動下載並以 macOS Preview 或任意圖片檢視器確認尺寸。
