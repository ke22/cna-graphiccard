## 1. Dashboard 頁面骨架

- [x] 1.1 建立 `dashboard.html`：含試算表網址輸入框、「連結試算表」按鈕、分頁下拉選單、「開啟」按鈕、錯誤訊息區，並以 `<script type="module" src="src/dashboard.js">` 載入。
- [x] 1.2 建立 `src/styles/dashboard.css` 並於 `dashboard.html` 引用，套用與工具列一致的視覺（沿用 `src/styles/main.css` 既有色系）。

## 2. Connect spreadsheet and persist its URL

- [x] 2.0 覆蓋 Requirement: Connect spreadsheet and persist its URL
- [x] 2.1 實作 spreadsheet ID 解析：以正則比對 `/spreadsheets/d/<ID>/` 取出 ID；無法解析時於錯誤區顯示「無法辨識試算表網址」並中止，不呼叫 API。
- [x] 2.2 連結成功後將原始網址寫入 `localStorage['cna-dashboard-sheet-url']`。
- [x] 2.3 頁面載入時若該鍵存在，自動帶入輸入框並自動觸發一次連結／列分頁流程。
- [x] 2.4 無 localStorage 記憶值時，搜尋列預設帶入目前綁定試算表 `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` 並自動列分頁。

## 3. List spreadsheet tabs via Sheets API

- [x] 3.0 覆蓋 Requirement: List spreadsheet tabs via Sheets API
- [x] 3.1 實作分頁列舉：`GET https://sheets.googleapis.com/v4/spreadsheets/<ID>?fields=sheets.properties(title,sheetId)&key=<API_KEY>`，解析 `sheets[].properties.{title,sheetId}`，依序填入下拉選單（option label=title、value=sheetId）。
- [x] 3.2 錯誤處理：API 非 2xx 顯示「無法讀取試算表分頁（請確認試算表已公開共用）」；`sheets[]` 為空顯示「此試算表沒有可用分頁」。所有路徑皆 try/catch，無未捕捉例外。
- [x] 3.3 API key 以模組常數定義，並在檔頭註解標明須於 Google Cloud Console 限制為 Sheets API＋指定 referrer 網域。

## 4. Open selected tab in the timeline template

- [x] 4.0 覆蓋 Requirement: Open selected tab in the timeline template
- [x] 4.1 實作「開啟」：以選定分頁組 gviz CSV 網址 `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&gid=<sheetId>`，導向 `index.html?sheet=<encodeURIComponent(gviz)>&title=<encodeURIComponent(title)>`。
- [x] 4.2 未選分頁時「開啟」按鈕維持停用（或點擊顯示提示），不導向。
- [x] 4.3 Dashboard 加入版型選擇，開啟時帶入 `template=timeline|headline`；選 headline 時模板頁以版型二渲染。

## 5. Switch spreadsheet tabs from the timeline template

- [x] 5.0 覆蓋 Requirement: Switch spreadsheet tabs from the timeline template
- [x] 5.1 建立 `src/sheets-api.js` 共用 spreadsheet ID/gid 解析、分頁列舉、gviz/template URL 組裝。
- [x] 5.2 在 `index.html` 工具列加入分頁下拉選單，當 `?sheet=` 含 spreadsheet ID 時列出同一試算表分頁。
- [x] 5.3 切換模板工具列分頁時，直接導向該 gid 對應的 `index.html?sheet=...&title=...`。
- [x] 5.4 切換模板工具列分頁時保留目前 URL 的 `template` 與 `split` 參數。
- [x] 5.5 在 `index.html` 工具列加入版型下拉選單，載入 mission 或 sheet 後顯示目前版型；切換版型時保留目前 sheet/page/title 與 split 參數。

## 6. Fit timeline preview to the viewport

- [x] 6.0 覆蓋 Requirement: Fit timeline preview to the viewport
- [x] 6.1 以 viewport 計算 `--preview-scale`，讓預覽卡片在工具列下方可視範圍內完整顯示。
- [x] 6.2 匯出 PNG 時暫時移除預覽縮放，維持原始卡片尺寸。

## 7. 驗證

- [x] 7.1 以公開試算表 ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` 連結，確認下拉選單列出其分頁名稱。
- [x] 7.2 選分頁開啟後，確認模板顯示之時間軸與直接用該 gid 的 `?sheet=` 網址結果一致。
- [x] 7.3 重整 dashboard 確認網址自動帶入；貼入格式錯誤網址與非公開試算表，確認顯示對應錯誤訊息且 console 無未捕捉例外。
- [x] 7.4 在模板工具列切換分頁，確認 URL 與卡片內容切換至對應 gid。
- [x] 7.5 確認預覽卡片完整顯示於目前 viewport，匯出圖仍為原始卡片尺寸。
- [x] 7.6 在 dashboard 選「版型二：標題時間軸」開啟分頁，確認 URL 含 `template=headline` 且模板頁渲染 `.node--headline`。
- [x] 7.7 在模板頁 toolbar 切換版型，確認 URL 保留目前 sheet/page/title 與 split，且 DOM 在 `.node--headline` 與版型一節點間切換。
