## 1. URL 組建函式

- [x] 1.1 在 `src/sheets-api.js` 新增 pure function `buildSheetEditUrl(spreadsheetId, sheetId)`，回傳 `https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit?gid=<gid>#gid=<gid>`，滿足 Source sheet edit URL construction 需求。驗證方式：以範例值 `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` + `2027148002` 在瀏覽器主控台呼叫，確認輸出與 spec 範例字串完全一致。

## 2. 工具列連結元素

- [x] 2.1 在 `index.html` 工具列右側群組 `tb-group--right`（與 `btn-export`、`btn-tutorial` 並列）新增 `<a id="btn-source-sheet" class="toolbar-link" target="_blank" rel="noopener" hidden>` 連結元素，達成 Source sheet link in toolbar 需求的標記結構。驗證方式：載入 `index.html`，於 DevTools 確認元素存在、預設為 `hidden`、且具備 `target="_blank"` 與 `rel="noopener"`。

## 3. 載入時設定連結狀態

- [x] 3.1 在 `src/main.js` 的 `setupMissionSwitch` 內，成功解析 `spreadsheetId` 與 `currentSheetId` 後，以 `buildSheetEditUrl` 設定 `#btn-source-sheet` 的 `href` 並移除 `hidden`，完成 Source sheet link in toolbar 的顯示路徑。驗證方式：以 `index.html?spreadsheet=<id>&gid=<gid>` 載入，確認連結顯示且 `href` 指向目前預覽分頁的編輯網址，點擊後在新分頁開啟對應 Google Sheet 分頁。
- [x] 3.2 確保本機 CSV 模式（`index.html?mission=<name>`、無 `spreadsheet`/`gid`，`setupMissionSwitch` 在缺少 `spreadsheetId` 時提前 return）下 `#btn-source-sheet` 維持 `hidden`，符合 Source sheet link in toolbar 的隱藏條件。驗證方式：以 `index.html?mission=<name>` 載入，於 DevTools 確認連結仍為 `hidden`。
