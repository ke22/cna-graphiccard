## Context

CNA 圖卡產生器為純前端靜態網站（HTML/CSS/JS，無框架、無建置、`python -m http.server` 服務）。模板 `index.html` 由 `?mission=` 或 `?sheet=` 驅動：`src/main.js:118` 已支援 `?sheet=` 覆寫資料來源，`?title=` 覆寫標題。資料以 gviz CSV（`gid` 為單一分頁）載入，`src/csv-loader.js` 內含 cache-bust 與 RFC4180 解析。

目前缺口：編輯者必須手動輸入 `?mission=中文名稱` 並手動維護 `missions/index.json`。本設計新增一個啟動入口 dashboard，讓編輯者連結一份試算表、從分頁清單挑選後開啟模板。資料編輯仍在 Google Sheet，模板仍只負責讀取與渲染。

## Goals / Non-Goals

**Goals:**

- 提供 `dashboard.html`：貼一次試算表網址 → 自動列出分頁 → 挑選後開啟既有模板。
- 試算表網址記憶於 `localStorage`，再次造訪自動帶入並重新列分頁；未有記憶值時預設帶入目前綁定試算表。
- 重用模板既有 `?sheet=`／`?title=` 機制，模板資料載入邏輯不變。
- 模板工具列可直接切換同一試算表的其他分頁。
- 模板預覽依 viewport 縮放以完整顯示卡片，同時保留 1200px 匯出尺寸。
- 連結／列分頁失敗時顯示明確錯誤訊息。

**Non-Goals:**

- 不在 dashboard 內編輯試算表資料（資料編輯維持在 Google Sheet）。
- 不提供「在 dashboard 內新增／刪除 mission 並寫回 `missions/index.json`」——靜態站無後端，不做寫入。
- 不做縮圖預覽牆（本期為文字清單／下拉選單；縮圖另案評估）。
- 不處理私有試算表的 OAuth 登入流程（僅支援公開可讀試算表）。

## Decisions

**D1：以分頁(tab/gid)作為 mission 單位，一份試算表多分頁 = 多張圖卡。**
理由：符合編輯者「同一新聞主題集中在一份試算表、各分頁一張卡」的習慣，並直接滿足 HANDOFF 既有待辦「接第二個分頁、不同 gid、驗證多圖卡管理」。
替代方案：以 `missions/index.json` 的任務清單為下拉來源（純靜態、零金鑰），但無法自動發現新分頁、仍需手動維護 JSON，故不採用。

**D2：用 Google Sheets API v4 `spreadsheets.get` 列分頁，非 gviz。**
理由：gviz CSV 端點一次只回單一 `gid` 的資料，無法列舉分頁名稱與 gid。`spreadsheets.get?fields=sheets.properties(title,sheetId)` 對公開試算表只需 API key（免 OAuth）即可取得每個分頁的 `title` 與 `sheetId`。
替代方案：解析試算表公開 HTML 取分頁清單——脆弱且易因版面改版失效，不採用。

**D3：dashboard 僅組裝網址並導向模板，不重寫載入邏輯。**
理由：模板已支援 `?sheet=` 覆寫。dashboard 將選定分頁組為 gviz CSV 網址（`https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv&gid=<gid>`）並以 `?sheet=&title=` 開啟 `index.html`，邏輯最小、風險最低。

**D4：API key 以前端常數保存，並於 Google Cloud Console 限制範圍。**
理由：純靜態站無法隱藏金鑰。對公開唯讀試算表，外洩風險可接受；以「限定 Sheets API＋限定 HTTP referrer 網域」收斂濫用面。

**D5：Sheets API 輔助函式集中於 `src/sheets-api.js`，dashboard 與模板共用。**
理由：dashboard 與模板都需要解析 spreadsheet ID、列分頁、組 gviz/template URL；集中可避免 API key、URL 組裝與錯誤處理重複。

**D6：預覽縮放只作用於畫面，匯出時暫時移除。**
理由：編輯者需要看見完整卡片，但 PNG 仍必須維持設計規格 1200px。以 wrapper/scale 做畫面縮放，匯出時加上 `body.is-exporting` 還原原始尺寸。

## Implementation Contract

**Behavior（可觀察行為）：**

- 開啟 `dashboard.html`：若 `localStorage` 有先前試算表網址則自動帶入並自動列分頁；否則帶入預設試算表 URL 並自動列分頁。
- 編輯者輸入試算表網址按「連結試算表」→ 下拉選單以分頁 `title` 列出全部分頁（依試算表順序）。成功後將網址寫入 `localStorage`。
- 選定某分頁並按「開啟」→ 在同分頁或新分頁載入 `index.html?sheet=<gviz CSV url>&title=<分頁title>`，畫面顯示該分頁資料渲染的時間軸圖卡。
- 模板以 `?sheet=` 開啟時，工具列顯示同一試算表的分頁下拉選單；切換選項即導向對應 gid。
- 模板預覽以 viewport 計算 `--preview-scale`，讓卡片完整顯示於可視區；匯出時暫時移除縮放。

**Interface / 資料形狀：**

- 從試算表網址解析 spreadsheet ID：比對 `/spreadsheets/d/<ID>/` 樣式，取出 `<ID>`。
- 列分頁請求：`GET https://sheets.googleapis.com/v4/spreadsheets/<ID>?fields=sheets.properties(title,sheetId)&key=<API_KEY>`，回應 `sheets[].properties.{title, sheetId}`。
- 組裝開啟網址：`index.html?sheet=` + `encodeURIComponent('https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&gid=<sheetId>')` + `&title=` + `encodeURIComponent(title)`。
- `localStorage` 鍵：`cna-dashboard-sheet-url`，值為最後一次成功連結的原始網址字串。
- 預設試算表 URL：`https://docs.google.com/spreadsheets/d/1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8/edit?gid=0#gid=0`。

**Failure modes（明確顯示，不靜默）：**

- 網址無法解析出 spreadsheet ID → 顯示「無法辨識試算表網址」。
- API 回應非 2xx（試算表非公開、ID 錯誤、金鑰失效）→ 顯示「無法讀取試算表分頁（請確認試算表已公開共用）」。
- 分頁清單為空 → 顯示「此試算表沒有可用分頁」。
- 未選分頁就按「開啟」→ 按鈕維持停用或顯示提示，不導向。

**Acceptance criteria（人工驗證）：**

1. 以目前綁定的公開試算表 ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` 連結，下拉選單至少列出該試算表的分頁名稱。
2. 選分頁開啟後，模板顯示對應分頁資料的時間軸（與直接用該 gid 的 `?sheet=` 網址結果一致）。
3. 重新整理 dashboard，試算表網址自動帶入；無 localStorage 時帶入預設試算表。
4. 模板工具列可直接切換同一試算表分頁。
5. 預覽卡片在桌機／筆電 viewport 內完整顯示，匯出仍維持原始卡片尺寸。
6. 貼入格式錯誤網址或非公開試算表時，畫面出現上述對應錯誤訊息，且無 JS 未捕捉例外。

**Scope boundaries：**

- 範圍內：`dashboard.html`、`src/dashboard.js`、`src/sheets-api.js`、`src/styles/dashboard.css`；組裝並導向模板網址；localStorage 記憶；模板分頁切換；預覽縮放；錯誤訊息。
- 範圍外：模板資料載入／斷頁／渲染／匯出（皆沿用既有）；寫回 `missions/index.json`；縮圖預覽；私有試算表 OAuth。

## Risks / Trade-offs

- [API key 暴露於前端] → 限制金鑰為 Sheets API 與指定 referrer 網域；試算表為公開唯讀，外洩影響有限。
- [編輯者把試算表設為「限本人」而非公開] → API 回 403；以明確錯誤訊息引導改為公開共用。
- [gviz 與 Sheets API 對「公開」定義略有差異] → 驗收項目 1/2 會以實際綁定試算表交叉驗證；若不一致，於 design 補記載並退回手動 gid。
- [分頁名稱含特殊字元] → 一律 `encodeURIComponent` 後組裝網址，避免破壞 query string。
