# Handoff — CNA 圖卡產生器

最後更新：2026-06-18

## 這是什麼

中央社（CNA）新聞圖卡產生器，純前端（HTML/CSS/JS，無框架、無建置）。目前支援兩個時間軸版型：

- **版型一·時間軸**：欄位 `年代,時間,內文`，用於一般事件時間軸。
- **版型二·標題時間軸**：欄位 `年代,標題,時間,小標,內文,資料來源,更新時間`，用於有主標、小標與段落內文的大事記。

完整規格：

- `docs/templates/版型一-時間軸.md`
- `docs/templates/版型二-標題時間軸.md`

## 如何啟動

必須用 HTTP 伺服器開啟，不能雙擊用 `file://`，因為 ES module 與 fetch 會被瀏覽器限制。

```bash
cd /Users/yulincho/Documents/GitHub/cna-graphiccard
python3 -m http.server 8766
```

常用網址：

```text
http://localhost:8766/dashboard.html
http://localhost:8766/index.html?mission=2026_美伊戰爭大事記
http://localhost:8766/index.html?mission=2026_柯文哲案大事記
http://localhost:8766/index.html?mission=2026_柯文哲案大事記&split=0
```

改完 JS/CSS 後瀏覽器要強制重整 `Cmd+Shift+R`。`python3 -m http.server` 不會幫忙送 no-cache header。

## 主要檔案

```text
index.html                         工具列、卡片掛載點、樣式引入
dashboard.html                     Google Sheet 圖卡啟動入口
probe.html                         headless/iframe 驗證工具
src/
  main.js                          主流程：URL 參數、載入資料、選版型、斷頁、渲染
  dashboard.js                     dashboard 連結試算表、列分頁、開啟模板
  csv-loader.js                    manifest 定位、Google Sheet/本機 CSV 載入、RFC4180 解析
  paginator.js                     量測節點高度、切分/不切分、DP 平衡斷頁
  renderer.js                      共用卡片外框、頁首、年代徽章、頁尾、呼叫版型 renderNode
  exporter.js                      html2canvas 逐卡輸出 PNG
  sheets-api.js                    Sheets API、spreadsheet/gid 解析、gviz URL 組裝
  templates/
    registry.js                    template id -> template module，未知 id fallback 到 timeline
    timeline.js                    版型一 buildNodes/renderNode
    headline.js                    版型二 buildNodes/renderNode
  styles/
    dashboard.css                  dashboard 頁面樣式
    main.css                       全域與工具列
    timeline.css                   共用卡片與版型一節點樣式
    headline.css                   版型二三層節點樣式
missions/
  index.json                       任務 manifest；可用 template 指定版型
  2026_美伊戰爭大事記/*.csv         版型一資料
  2026_柯文哲案大事記/*.csv         版型二資料
openspec/changes/add-headline-template/
  proposal.md
  tasks.md                         所有項目已完成
openspec/changes/add-mission-dashboard/
  proposal.md
  tasks.md                         實作項目已完成，驗證清單仍保留人工確認項
```

## Dashboard / Sheet / Page 切換

Dashboard 功能已存在，入口是：

```text
http://localhost:8766/dashboard.html
```

流程：

1. `dashboard.html` 預設帶入公開試算表 `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8`。
2. `src/dashboard.js` 呼叫 Google Sheets API v4 列出分頁，每個 option 的 value 是 `sheetId`/`gid`。
3. 可選「版型一：時間軸」或「版型二：標題時間軸」。
4. 按「開啟」會導到 `index.html?sheet=<gviz CSV URL>&title=<分頁名稱>&template=<版型>`，不需要 `mission`；卡片頁首會優先使用 sheet/CSV 的 `標題` 欄，`title` 只作 fallback。
5. `index.html` 若以 `?sheet=` 開啟，工具列的 `#mission-select` 會顯示同一試算表的分頁清單。
6. 模板工具列也有 `#template-select`，載入後可直接切換版型。
7. 在模板工具列切換分頁，會導到新的 `index.html?sheet=...&title=...`，並保留目前 URL 的 `template` 與 `split` 參數。

相關 URL 組裝集中在 `src/sheets-api.js`：

- `parseSpreadsheetId(url)`
- `parseSheetId(url)`
- `buildGvizCsvUrl(spreadsheetId, sheetId)`
- `buildTemplateUrl(spreadsheetId, sheetId, title, options)`

注意：列分頁依賴 `src/sheets-api.js` 內的 Google Sheets API key，試算表也必須公開可讀。資料內容仍走 gviz CSV；Sheets API 只用來拿分頁清單。

## 版型選擇邏輯

`src/main.js` 的版型優先序：

1. URL `?template=...`
2. `missions/index.json` 裡該任務的 `template`
3. 預設 `timeline`

未知 template id 會在 `src/templates/registry.js` fallback 到 `timeline` 並 `console.warn`。

目前 manifest：

- `2026_美伊戰爭大事記`：未設 `template`，預設 `timeline`，並有 Google Sheet `sheet` 即時來源。
- `2026_柯文哲案大事記`：`template: "headline"`，`sheet` 指向同一試算表的 `gid=751022733`，本機 CSV 作為 fallback。

## 驗證狀態

Spectra change：`add-headline-template`

```bash
spectra validate add-headline-template --strict
```

結果：`✓ add-headline-template — valid`

Spectra change：`add-mission-dashboard`

```bash
spectra validate add-mission-dashboard --strict
```

結果：`✓ add-mission-dashboard — valid`

已完成驗證：

- Dashboard：headless Chrome 開 `dashboard.html`，成功列出預設試算表 4 個分頁：`type_1`, `type_2`, `「20260615_美伊戰爭大事記」的副本`, `工作表2`。
- Dashboard 版型選擇：`dashboard.html` 已顯示「版型一：時間軸」與「版型二：標題時間軸」選單，開啟 URL 會帶 `template=timeline|headline`。
- Sheet URL 模板載入：`index.html?sheet=<gid 0 gviz>&title=type_1` 不帶 `mission` 可正常渲染卡片，工具列分頁下拉顯示同 4 個分頁。
- Sheet URL 版型二：`index.html?sheet=<gid 761990654 gviz>&title=type_2&template=headline` 可正常渲染 `.node--headline`。
- 模板頁 nav 版型切換：`index.html?sheet=<gid 761990654 gviz>&title=type_2&template=headline&split=0` 會顯示 toolbar 版型選單、不切分狀態、`.node--headline`。
- URL 組裝：Node 檢查 `parseSpreadsheetId`、`parseSheetId`、`buildGvizCsvUrl`、`buildTemplateUrl` 輸出正確。
- 版型一 `2026_美伊戰爭大事記`：切分模式 4 張，每張 1200x1200，無 overflow。
- 版型一 `split=0`：單張長圖 1200x3167，無 overflow。
- 版型二 `2026_柯文哲案大事記`：切分模式 6 張，每張 1200x1200，無 overflow。
- 版型二 `split=0`：單張長圖 1200x5419，無 overflow。
- 版型二資料解析：30 筆節點、年代 badge 為 2024/2025/2026、12 筆只有小標、空列不產生節點、跨列年代填充正常、多行內文保留。
- 未整理資料轉換：`/Users/yulincho/Desktop/柯文哲案大事記 - 工作表1.csv` 已整理成 `missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv`，可貼到 Google Sheet `工作表2` / `gid=751022733`。
- 匯出流程：因 CDN/網路限制，使用 `probe.html?export=1` stub `html2canvas` 驗證 `exportCards()` 會逐卡 render/download；版型一 4/4、版型二 6/6。

## 驗證工具

`probe.html` 會用同源 iframe 載入 `index.html`，量測 `.card` 的寬高與 overflow。

例：

```text
http://localhost:8766/probe.html?m=2026_柯文哲案大事記
http://localhost:8766/probe.html?m=2026_柯文哲案大事記&split=0
http://localhost:8766/probe.html?m=2026_柯文哲案大事記&export=1
```

注意：`probe.html` 的 `m` 會轉成 iframe 裡的 `mission`，其他 query params 會原樣轉送，所以可測 `split=0`、`template=headline`、`export=1`。

## Git / 工作區狀態

目前 repo 是有效 git worktree，但本次變更尚未 commit。預期會看到以下變更：

- Modified tracked：`HANDOFF.md`, `dashboard.html`, `index.html`, `missions/index.json`, `openspec/changes/add-mission-dashboard/*`, `src/csv-loader.js`, `src/dashboard.js`, `src/main.js`, `src/paginator.js`, `src/renderer.js`, `src/sheets-api.js`, `src/styles/dashboard.css`, `src/styles/main.css`
- Untracked：`LEARNING.md`, `docs/templates/版型二-標題時間軸.md`, `missions/2026_柯文哲案大事記/`, `openspec/changes/add-headline-template/`, `probe.html`, `src/styles/headline.css`, `src/templates/`
- Do not commit：`missions/.DS_Store` metadata change.

不要用 `git reset --hard` 或 checkout 清掉未追蹤檔；這些就是版型二與驗證所需內容。

## 後續建議

- 若要交付，先人工用瀏覽器測一次真實 html2canvas 匯出，確認 CDN 可載入且 PNG 實際下載正常。
- Dashboard 交付前也建議人工點一次「開啟」與模板工具列分頁切換，確認 Google API key 在部署網域 referrer 限制下仍可用。
- 若要納入更多版型，沿用 `src/templates/{id}.js` 的 `buildNodes/renderNode` 介面，不要把版型特定欄位邏輯放回 `main.js` 或 `renderer.js`。
- 若 `2026_柯文哲案大事記` 之後要接 Google Sheet，在 `missions/index.json` 加 `sheet` 即可；本機 CSV 可保留作 fallback。
