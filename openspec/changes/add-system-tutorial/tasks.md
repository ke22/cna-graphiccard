## 1. 搭建 tutorial.html 結構與內容

實作需求 **Tutorial page section navigation**（標記結構契約）與 **Tutorial content coverage**。

- [x] 1.1 依照 design 的 **Standalone static page, no template registry dependency** 決策，在專案根目錄新增 `tutorial.html`（內容寫死的語意化 HTML，不 fetch 任何 mission CSV，也不 import `src/templates/registry.js`）：`<head>` 依序引入 `src/styles/main.css` 與新檔案 `src/styles/tutorial.css`；`<body class="tutorial-page">` 內含一個 `<nav class="tutorial-nav">`，列出每個章節對應的 `<a href="#<id>">`，以及一個 `<section id="<id>" class="tutorial-section">` 對應每個主題，依序使用以下 id：`system-overview`、`getting-started`、`template-timeline`、`template-headline`、`template3`、`dashboard-flow`、`switching-modes`、`export-flow`。驗證方式：直接在瀏覽器開啟 `tutorial.html`，確認每個 `.tutorial-nav a` 的 `href` 都精確對應到一個存在的 `.tutorial-section` `id`（沒有失效錨點、沒有孤兒章節）。
- [x] 1.2 撰寫 `system-overview` 與 `getting-started` 章節內容，滿足需求 **Tutorial content coverage** 中系統簡介與啟動說明的部分：簡短說明 CNA 圖卡產生器（三個版型、無建置純前端），以及精確的本機啟動指令（`cd` 到專案根目錄、`python3 -m http.server 8766`），並附上常用網址 `http://localhost:8766/dashboard.html` 與 `http://localhost:8766/index.html?mission=<name>`。驗證方式：確認指令內容與 `HANDOFF.md` 的「如何啟動」段落逐字一致。
- [x] 1.3 撰寫 `template-timeline`、`template-headline`、`template3` 三個章節內容，滿足需求 **Tutorial content coverage** 中各版型 CSV 說明的部分，各自列出該版型的 CSV 欄位與一個具體範例列：`template-timeline` 顯示 `年代,日期,內文`，搭配來自 `missions/2026_美伊戰爭大事記/` 的 `2026,2月28日,...美國與以色列對伊朗各地發動空襲...` 範例列；`template-headline` 顯示 `年代,標題,時間,小標,內文,資料來源,更新時間`，搭配來自 `missions/2026_柯文哲案大事記/` 的 `2024,柯文哲案大事記,5月2日,北檢他字案偵辦京華城、北士科等案,...` 範例列；`template3` 使用相同欄位組合，搭配來自 `missions/2024_南韓戒嚴大事記/` 的 `12月3日22 : 23` ／`總統尹錫悅透過電視談話宣布實施緊急戒嚴令` ／`任命陸軍參謀總長朴安洙為戒嚴司令` 範例列。驗證方式：確認每個章節列出的欄位與 `src/templates/timeline.js`、`src/templates/headline.js`、`src/templates/template3.js` 各自的 `COLUMNS` 物件一致。
- [x] 1.4 撰寫 `dashboard-flow`、`switching-modes`、`export-flow` 三個章節內容，滿足需求 **Tutorial content coverage** 中 Dashboard／切換／匯出說明的部分：`dashboard-flow` 依序說明 `dashboard.html` 的試算表網址輸入框、連結試算表按鈕、選擇分頁下拉選單、版型選單、開啟按鈕；`switching-modes` 說明模板頁的 `#template-select`（三個版型選項）與 `#btn-mode-split` / `#btn-mode-single` 切分／不切分切換；`export-flow` 說明 `#btn-export`（匯出所有卡片）按鈕，以及 PNG 會逐卡分別下載。驗證方式：確認文中提到的每個元素 id／文字標籤都存在於目前的 `dashboard.html` 與 `index.html` 標記中。

## 2. 實作章節導覽互動行為

實作需求 **Tutorial page section navigation**。

- [x] 2.1 依照 design 的 **Section navigation via anchors + IntersectionObserver** 決策，實作需求 **Tutorial page section navigation**：新增 `src/tutorial.js` 作為純 script（不加 `type="module"`）；對所有 `.tutorial-section` 元素建立一個 `IntersectionObserver`；當某個章節進入可視範圍時，把對應 `href` 的 `.tutorial-nav a` 加上 `.active`，同時移除其他所有導覽連結的 `.active`，確保任一時刻只有一個連結是 active。在 `tutorial.html` 的 `<body>` 結尾附近用 `<script src="src/tutorial.js"></script>` 載入。驗證方式：在本機伺服器上點擊每個 `.tutorial-nav` 連結，確認會捲動到對應章節且該連結取得 `.active`、其他連結失去 `.active`；手動捲動整頁經過每個章節時，對應的導覽連結也會跟著更新為 active。
- [x] 2.2 在 `src/styles/tutorial.css` 對 `.tutorial-page`（或頁面 scope 下的 `html`）設定 `scroll-behavior: smooth`，讓原生錨點點擊產生平滑捲動，不需要額外的 JS 捲動運算。驗證方式：點擊 `.tutorial-nav` 連結時畫面是平滑捲動，而不是瞬間跳轉。

## 3. 為教學頁設計樣式

實作 design 的 **Shared visual tokens, isolated layout styles** 決策。

- [x] 3.1 新增 `src/styles/tutorial.css`，所有選擇器皆 scope 在 `.tutorial-page` 之下（例如 `.tutorial-page .tutorial-nav`、`.tutorial-page .tutorial-section`）：寬螢幕時側欄導覽固定／黏附在內容旁、內容區可獨立捲動；窄螢幕斷點下導覽改為堆疊在內容上方；CSV 範例表格／程式碼區塊清晰易讀；色彩與字體沿用 `main.css` 的 token（`--color-header`、`--color-text-year`、`--color-text-content`）。驗證方式：確認此檔案內沒有任何選擇器漏掉 `.tutorial-page` scope，並在寬螢幕（例如 1400px）與窄螢幕（例如 600px）兩種視窗寬度下，目視確認導覽／內容／範例表格沒有重疊。

## 4. 在既有入口頁新增教學頁連結

實作需求 **Tutorial discovery links on existing entry pages**。

- [x] 4.1 依照 design 的 **Toolbar link addition is additive only** 決策，實作需求 **Tutorial discovery links on existing entry pages**：在 `index.html` 的 `.toolbar-actions` 最後新增 `<a href="tutorial.html" class="toolbar-link">教學</a>`，不重複使用任何既有元素 id，也不修改任何既有工具列元素。驗證方式：確認連結正常顯示、點擊後導向 `tutorial.html`，且 `#template-select`、`#btn-mode-split`／`#btn-mode-single`、`#btn-refresh`、`#btn-export` 仍正常運作（無 console 錯誤，且在 `src/styles/main.css` 既有的 `@media (max-width: 900px)` 斷點下不跑版）。
- [x] 4.2 依照 design 的 **Toolbar link addition is additive only** 決策，實作需求 **Tutorial discovery links on existing entry pages**：在 `dashboard.html` 的 `.toolbar` 內新增同樣樣式的 `<a href="tutorial.html" class="toolbar-link">教學</a>`，不重複使用任何既有元素 id。驗證方式：確認連結正常顯示、點擊後導向 `tutorial.html`，且既有的連結試算表／選擇分頁／版型選單／開啟流程仍正常運作。

## 5. 驗證與交接

實作需求 **No regression to existing page behavior** 以及 design 的 Implementation Contract 驗收標準。

- [x] 5.1 驗證需求 **No regression to existing page behavior**：執行 `spectra analyze add-system-tutorial --json` 與 `spectra validate add-system-tutorial`，再用本機伺服器手動煙霧測試（Playwright 或真實瀏覽器）：開啟 `tutorial.html`、`index.html`、`dashboard.html`，確認三者 console 皆無錯誤；在 `tutorial.html` 上逐一點擊每個 `.tutorial-nav` 連結，確認捲動與 `.active` 切換正確；在 `index.html` 與 `dashboard.html` 上操作版型切換、切分／不切分切換、刷新、匯出、Dashboard 的試算表／分頁選擇，確認新連結沒有造成任何回歸。
- [x] 5.2 在 `HANDOFF.md` 新增「教學頁」段落，說明 `tutorial.html` 的用途、新增的三個檔案，以及 design 的 Risks 段落提到的提醒事項：未來修改任一版型的 CSV schema 或 Dashboard 流程時，需同步檢查並更新 `tutorial.html` 對應章節。驗證方式：確認讀者只看 `HANDOFF.md` 就能找到 `tutorial.html`。

## 6. 同步 2× JPG 匯出教學

- [x] 6.1 更新需求 **Tutorial content coverage** 與 **No regression to existing page behavior**：將 `tutorial.html` 的導覽標籤、系統簡介與 `export-flow` 章節由 PNG 改為 2× JPG，明確說明固定卡片輸出為 2400×2400、MIME 為 `image/jpeg`、檔名依序為 `card-{n}.jpg`；同步更新 `HANDOFF.md` 中對教學頁及匯出器的格式描述，但不得修改 `src/exporter.js` 行為。驗證方式：執行 `rg -n "PNG|JPG|image/jpeg|2400×2400|card-" tutorial.html HANDOFF.md`，確認教學相關敘述一致且不再把目前匯出格式描述為 PNG，再執行 `spectra analyze add-system-tutorial --json` 與 `spectra validate add-system-tutorial`。
