# Learning — add-headline-template

最後更新：2026-06-18

## 可保留的設計決策

- 版型差異應集中在 `src/templates/`。`main.js` 只負責選版型與流程控制，`renderer.js` 只負責共用卡片外框、頁首、年代徽章、頁尾。
- template module 目前的穩定介面是 `{ id, columns, buildNodes, renderNode }`。新增版型時優先延續這個介面。
- `timeline` 是安全 fallback。manifest 沒有 `template` 或 URL 給未知 `template` 時，都不應影響既有任務。
- CSV 解析不要改成簡單 split。現有 loader 處理 quoted CSV、多行欄位與 Google Sheet gviz CSV，版型二需要保留多行內文。
- 年代向下填充要放在各 template 的 `buildNodes`，因為不同版型 schema 不同，但「空年代沿用上一列」是資料整理流程的共通習慣。

## 版型二資料行為

- schema：`年代,標題,時間,小標,內文,資料來源,更新時間`。
- `標題`、`資料來源`、`更新時間` 取整欄第一個非空值，作為 meta。
- `年代` 使用西元欄位值，逐列向下填充。
- `小標` 與 `內文` 皆空的列不產生節點。
- 只有 `小標` 沒有 `內文` 是合法狀態；DOM 不應渲染空的 `.node-content`。
- 內文需逐字保留，包含換行。

## Unclean Data Mapping

- `/Users/yulincho/Desktop/柯文哲案大事記 - 工作表1.csv` 原始格式是兩欄交錯列：有日期列代表事件，下一列日期空白時併入上一筆內文。
- 轉換規則：第 1 欄日期 -> `年代` + `時間`；同列第 2 欄 -> `小標`；下一列空日期的第 2 欄 -> 上一筆 `內文`。
- 民國年轉西元：`113年` -> `2024`、`114年` -> `2025`、`115年` -> `2026`，後續空年份沿用上一個年份。
- 清理後輸出：`missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv`，30 筆事件、18 筆有內文、12 筆只有小標、0 筆空節點。
- 輸出必須用 UTF-8 without BOM。現有 CSV parser 不會移除標頭第一欄的 BOM，否則 `年代` 會被讀成 `﻿年代`，導致年份抓不到。

## 驗證經驗

- 本專案一定要用 HTTP server 驗證，`file://` 會讓 module/fetch 行為失真。
- macOS sandbox 下 `python3 -m http.server 8765` 可能因 port 被占用或權限失敗；這次可用 port 是 8766。
- headless Chrome 驗證可用 `probe.html`，同源 iframe 能讀取卡片 DOM，比截圖更適合檢查卡片數、尺寸與 overflow。
- Dashboard 驗證需要外部網路，因為列分頁走 Google Sheets API v4；資料載入則走 gviz CSV。兩者失敗模式不同，要分開看。
- Chrome headless 在此環境可能不會自動結束，常見原因是 updater/helper process；拿到 DOM 輸出後可中止 session。
- CDN 網路不可假設可用。匯出流程若要在受限環境驗證，可 stub `window.html2canvas`，確認 `exportCards()` 有逐張 render 並觸發 download；最後交付前仍要做一次真實瀏覽器匯出。

## Dashboard / Sheet 切換

- `dashboard.html` 是啟動入口，不是 `index.html` 裡的模式。它只負責選 Google 試算表分頁並導向模板。
- `src/sheets-api.js` 是共用層：dashboard 和模板工具列都用它解析 spreadsheet ID/gid、列分頁、組 gviz URL。
- dashboard 開出的模板 URL 是 `index.html?sheet=<encoded gviz>&title=<encoded tab title>&template=<timeline|headline>`；這條路徑可以沒有 `mission`。
- 卡片頁首標題應優先跟 sheet/CSV 的 `標題` 欄；URL `title` 是分頁名稱 fallback，不應覆蓋資料表標題。
- 要看版型二，必須選「版型二：標題時間軸」或手動在 URL 加 `template=headline`。
- 模板頁只有在 `?sheet=` 裡解析得到 spreadsheet ID 時，才會顯示工具列的 `#mission-select` 分頁下拉。
- 模板頁 toolbar 也有 `#template-select`；切換版型會改 URL 的 `template`，保留目前 sheet/page/title/split，再重新載入。
- 切換分頁不是局部 fetch 重繪，而是導向新的 `index.html?sheet=...&title=...`。導向時要保留 `template`，否則會回到預設版型一。
- Sheets API key 放在 `src/sheets-api.js`，應在 Google Cloud Console 限制 Sheets API 與部署網域 referrer；本機測試可能可用，部署後仍要測一次。

## 容易踩的點

- `probe.html` 原本只支援 `m`，後來改成轉送其他 query params；測 `split=0` 或 `export=1` 時要確認 query 有進 iframe。
- dashboard 的「分頁」是 Google Sheet tab/gid，不等於 `missions/index.json` 的 mission。`mission` 是本機 manifest 任務；`sheet` 是線上 CSV 覆寫來源。
- 卡片固定寬高是 CSS/layout 契約。新增節點內容或樣式時，先測切分與不切分兩種模式。
- `headline.css` 只應處理版型二節點層級，不要覆蓋共用卡片外框，避免版型一回歸。
- `missions/index.json` 中未設 `template` 的任務代表預設 timeline，不是資料缺漏。
- `spectra validate add-headline-template --strict` 只驗 specs/tasks 結構，不代表瀏覽器渲染或 PNG 匯出已真實通過。

## 下一次接手的最短路徑

1. 啟動 server：`python3 -m http.server 8766`
2. 開 `dashboard.html` 確認可列出 Google Sheet 分頁。
3. 從 dashboard 開一個分頁，確認 URL 變成 `index.html?sheet=...&title=...` 且工具列可再切分頁。
4. 開 `index.html?mission=2026_柯文哲案大事記` 看版型二切分卡。
5. 開 `index.html?mission=2026_柯文哲案大事記&split=0` 看長圖。
6. 開 `probe.html?m=2026_柯文哲案大事記&export=1` 快速驗 exporter wiring。
7. 跑 `spectra validate add-headline-template --strict` 和 `spectra validate add-mission-dashboard --strict`。
