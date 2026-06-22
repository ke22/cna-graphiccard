# Learning — CNA 圖卡產生器

最後更新：2026-06-22

---

## Session 2026-06-22（production deployment）

### 不要把完整外部 URL 塞進 production query parameter

本機與一般靜態伺服器都接受：

```text
index.html?sheet=https%3A%2F%2Fdocs.google.com%2F...
```

但 CNA edge/WAF 會把「query 內含 encoded `https://`」判定為危險請求，在 HTML 和 JavaScript 執行前直接回 `403 Forbidden`。因此前端的 legacy fallback 或 redirect 無法修復 production 舊連結。

正確設計是只傳不可執行的識別值：

```text
index.html?spreadsheet=<spreadsheet-id>&gid=<sheet-id>&title=<title>
```

再由 `src/main.js` 呼叫 `buildGvizCsvUrl()`，在 client-side 組合 Google gviz URL。遇到 CDN/WAF 問題時，驗證時要分開測：無 query、一般 query、nested URL query、以及 ID-only query，才能確定是應用程式錯誤還是 edge policy。

---

### HTTP 200 不等於修正版已部署

`index.html` 回 200 只能證明檔案存在。這次 production 仍提供舊 `main.js`，所以根頁面載入後仍產生舊的 blocked URL。可靠的部署驗證應直接檢查變更過的 asset：

- 比對 `Content-Length` 或 checksum。
- 查看 `Last-Modified`。
- 用 cache-busting query 取得檔案並搜尋修正版 marker。
- 驗證使用者實際走到的最終 URL，而不是只測入口頁。

本次具體訊號：production `src/main.js` 是 13,152 bytes，修正版是 13,648 bytes。CNA CDN 使用 `max-age=180`，上傳後最多可能等三分鐘才看到新內容。

---

### GitHub 帳號不是 FTP 自動部署的網路邊界

Personal GitHub repository 可以保存 Actions secrets 並執行 workflow，但 GitHub-hosted runner 位於公網。`webap.cna.com.tw` 只在 CNA DNS 解析為 private IP `172.30.142.2`，GitHub-hosted runner 因此出現 `Name or service not known`。改帳號、改 FTP 密碼或重跑 job 都不會解決 routing/DNS 問題。

可行方案只有：

1. 在 CNA 網路／VPN 內架設 self-hosted runner；或
2. 由 CNA IT 提供受控、可從公網到達的 Explicit FTPS endpoint。

Self-hosted runner 是 GitHub 與 CNA private network 的 bridge。它能執行 repository workflow，應使用 CNA 管理的專用機器、最小權限 FTP 帳號與專用 remote directory，不應長期使用個人日常工作機。

---

### `mirror --delete` 必須綁定專用子目錄

FTP 自動部署使用 `lftp mirror --reverse --delete` 時，錯誤的 remote path 可能刪除同層其他專案。`DEPLOY_PATH` 必須是已確認的專用目錄（本專案為 `/missions/timeline`），不能使用 `/missions` 等共享 parent。第一次上線或網路架構未確認時，先建立只含 production assets 的本機 package 並用 FileZilla 手動覆寫，比直接啟用 delete sync 安全。

---

### Console 訊息要按來源分類

`contentscript.js` 的 `MaxListenersExceededWarning`、`ObjectMultiplex` 與 orphaned stream 訊息來自瀏覽器 extension，不是本專案程式碼。`favicon.ico 404` 也不影響卡片功能。除錯時先看 request URL、HTTP status、initiator 與 repository source path，避免被 extension noise 帶離真正的 403。

---

## Session 2026-06-21

### CSV 欄位名稱別名要在所有層同步

`美伊戰爭大事記` 試算表的年代欄名是 `西元`，不是 `年代` 或 `年`。這導致三個版型都沒有年份 badge。

根本原因：欄位別名分散在兩個地方：

1. `csv-loader.js` 的 `metaFrom()` — 決定整張試算表的 `sheetMeta.year`（fallback 年份來源）
2. 各版型 `COLUMNS.year` 陣列 — 決定逐列攜帶年份的 `rawYear`

只修一個地方，另一個地方還是找不到欄位，年份仍然空白。**兩個地方要一起改。** `timeline.js` 還有一個 `hasYear` 判斷（決定欄位位置 fallback），也要同步加入 `'西元'`。

教訓：新增欄位別名時，用 `grep -r "年代.*年\|年.*年代" src/` 確認所有用到該欄位的位置，不要只改最明顯的那一個。

---

### localStorage 會蓋過程式碼裡的預設值

`cna-dashboard-sheet-url` 存在 localStorage 後，`DEFAULT_SPREADSHEET_URL` 的任何變更都不會生效，直到使用者清除 storage 或用無痕模式。這讓「為什麼程式碼改了但畫面沒變」非常難除錯。

設計決策：讓 localStorage 保留優先權（記住上次用的試算表是合理 UX），但要在 HANDOFF 和教學裡明確記錄清除方式。不要試圖在程式碼裡「悄悄忽略」localStorage — 那只會製造更難預測的行為。

---

### ES module 快取問題難以即時驗證

瀏覽器對 `type="module"` 的快取比一般 script 更激進，`Cmd+Shift+R` 有時不夠。在驗證視覺變化時，無痕模式是最可靠的方式，尤其是共用模組（如 `tutorial-popup.js`）被多頁引入時。

---

### `<dialog>` 的 backdrop click 偵測

點擊 `::backdrop` 偽元素，事件會觸發在 `<dialog>` 元素本身（`event.target === dialogEl`），而不是在 backdrop DOM 節點上。這是正確行為，但反直覺。

```js
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close(); // backdrop click
});
```

如果沒有這個判斷，點擊 dialog 內容區域也會意外關閉。必須判斷 `event.target` 等於 dialog 本身（即點到邊框/backdrop 區域），而非 dialog 的子元素。

---

### 共用彈窗模組優於各頁內嵌

`tutorial-popup.js` 被 `index.html` 和 `dashboard.html` 都引入。如果把 `<dialog>` 寫死在各 HTML 檔案裡，內容一旦需要更新就要改兩個地方，且容易漂移。

動態建立 dialog 並 append 到 body，配合 `id` 冪等性檢查（若已存在就 return），兩個頁面共用同一份 JS，完全同步。

---

### 兩個 tab 的 popup 要明確區分受眾

把操作流程和版型說明放在同一頁面會造成資訊混雜。Tab 切換的分工：
- **操作流程** tab：記者/編輯看，3 個步驟，零技術術語
- **版型說明** tab：協作者/新人看，哪種資料配哪個版型，必填欄位用顏色標示

版型說明用視覺標籤（藍色 = 必填，灰色 = 選填）比表格更直覺，因為欄位數量少（3–7 個），不需要橫向捲動。

---

### toolbar 改版：ghost select 比下拉框有氣質

舊工具列是深色背景 + 白字 select，在深色頁面背景下對比度不足，且 select 樣式跨瀏覽器難統一。

新設計：白色 frosted glass toolbar + ghost select（no border at rest，hover 時 `#F3F4F6` 背景）。外觀乾淨，不需要手刻 dropdown，瀏覽器原生 select 下拉表現正常。`backdrop-filter: blur(12px)` 讓深色背景的預覽卡片透過工具列仍可感知，不會像白牆一樣切斷視覺。

---

### dashboard nav active state 用 bottom border 比 box 好

舊的 active state 是白色方框（`background: rgba(255,255,255,0.15)` + `border`），在淺色 nav 上看不清楚。改用 `box-shadow: inset 0 -3px 0 0 var(--dashboard-nav-accent)` 的底部 underline，視覺重量輕，和 tab 設計語言一致，且只需一行 CSS。

---

## Session 2026-06-18（add-headline-template）

### 版型差異應集中在 `src/templates/`

`main.js` 只負責選版型與流程控制，`renderer.js` 只負責共用卡片外框、頁首、年代徽章、頁尾。版型特定邏輯一律放在各 template module 的 `buildNodes` 和 `renderNode`，不要放回共用層。

### template module 穩定介面

`{ id, columns, buildNodes, renderNode }`。新增版型時延續此介面，不要因為「方便」而在 main.js 加版型判斷。

### CSV 解析不要改成 split

現有 loader 處理 quoted CSV、多行欄位與 Google Sheet gviz CSV。版型二的 `內文` 需要保留多行換行（`\n`），簡單 split 會破壞。

### 年代向下填充放在 buildNodes

不同版型 schema 不同，但「空年代沿用上一列」是資料整理流程的共通習慣。各 template 自己處理，`main.js` 傳 `fallbackYear` 作保底。

### Unclean Data Mapping（版型二）

`柯文哲案大事記` 原始 CSV 是兩欄交錯：日期列 + 下一列空日期的內文。轉換規則：日期列第 2 欄 → 小標；空日期列第 2 欄 → 上一筆內文。民國年轉西元：`113年` → `2024`。UTF-8 without BOM，否則 `年代` 會被讀成 `﻿年代`（BOM 殘留）。

### Dashboard / Sheet 切換關鍵

- `mission`（manifest 任務）與 `spreadsheet`/`gid`（Google Sheet 覆寫）是兩個獨立機制，不互相依賴。
- `dashboard.html` 開出的 URL 是 `index.html?spreadsheet=...&gid=...&title=...`，不需要 `mission`。舊版曾使用 `sheet=<encoded gviz URL>`，但 production WAF 會拒絕該格式。
- 切換分頁是整頁導向，不是局部 fetch。導向時保留 `template` 參數，否則會 fallback 到版型一。
- 卡片頁首優先用 sheet/CSV 的 `標題` 欄，`?title=` 只是分頁名稱 fallback。

### 驗證

- 一定要用 HTTP server，`file://` 讓 module/fetch 行為失真。
- macOS 可用 port：8766（8765 可能被占）。
- `probe.html` 是比截圖更好的 headless 驗證工具，可讀取 DOM 量測尺寸和 overflow。
- Dashboard 驗證需要外部網路（Google Sheets API v4 列分頁）；資料載入走 gviz CSV（兩者失敗模式不同）。
- `spectra validate --strict` 只驗結構，不代表瀏覽器渲染已通過。交付前仍要做真實瀏覽器匯出測試。

### 容易踩的點

- `probe.html` 要確認 query params 有正確轉送到 iframe（`split=0`、`export=1`）。
- `missions/index.json` 未設 `template` 代表預設 timeline，不是資料缺漏。
- `headline.css` 只應處理版型二節點層級，不要覆蓋共用卡片外框，避免版型一回歸。
- Sheets API key 要在 Google Cloud Console 限制 Sheets API 與部署網域 referrer。
