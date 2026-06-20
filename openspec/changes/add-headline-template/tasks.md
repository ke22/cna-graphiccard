## 1. 抽出版型接縫（重構，版型一行為不變）

- [x] 1.1 在 src/renderer.js 把節點內部結構的產生委派出去：`renderCards(pagedNodes, options)` 改為呼叫 `options.template.renderNode(node)` 取得每個節點 DOM，外框／年代徽章／頁尾邏輯保留在 renderer（實作規格 Requirement: Shared card frame across templates）。驗證：暫以版型一自身的 renderNode 傳入，headless Chrome 渲染 `2026_美伊戰爭大事記`，DOM 結構與卡片尺寸與重構前一致。
- [x] 1.2 新增 src/templates/timeline.js，預設輸出 `{ id:'timeline', columns, buildNodes, renderNode }`：buildNodes 封裝現有「年代/時間/內文」映射與年代向下填充＋badge 標記（從 csv-loader 的 loadNodes 與 main.js 的 badge 迴圈搬入），renderNode 封裝現有時間＋內文節點 DOM（實作規格 Requirement: Template module interface）。驗證：以 headless Chrome 比對重構前後，`2026_美伊戰爭大事記` 卡片 DOM 與尺寸逐項一致（無回歸）。
- [x] 1.3 新增 src/templates/registry.js，輸出 `getTemplate(id)`：已知 id 回對應模組，未知 id 回 timeline 並 `console.warn`（實作規格 Requirement: Template registry and selection）。驗證：於瀏覽器主控台呼叫 `getTemplate('timeline')`、`getTemplate('bogus')`，前者回 timeline 模組、後者回 timeline 並印出警告。

## 2. 版型選擇接線

- [x] 2.1 在 src/main.js 解析版型：優先序 `?template=` > manifest（loadMeta 回傳的 template）> 預設 `timeline`；取得版型後改用 `template.buildNodes` 建節點、將 template 傳入 `renderCards`。驗證：`?template=headline` 對既有任務生效、`?template=bogus` 退回版型一、未帶參數時行為與現狀一致（headless Chrome 確認）。
- [x] 2.2 在 src/csv-loader.js 的 loadMeta 一併回傳 manifest 的 `template` 欄（未設時為 `undefined`），並在 missions/index.json 的型別說明／既有任務維持無 template 欄＝預設 timeline。驗證：對未設 template 的任務，loadMeta 回傳的 template 為 undefined 且渲染為版型一。

## 3. 版型二（headline）

- [x] 3.1 新增 src/templates/headline.js：buildNodes 從標頭 `年代,標題,時間,小標,內文,資料來源,更新時間` 映射為 `{ year, date, subhead, content, badge }`，年代逐列向下填充（西元，照欄位值）、跨年標 badge，標題/資料來源/更新時間取整欄第一個非空值；小標與內文皆空的列不產生節點（實作規格 Requirement: Headline template data schema；空列處理見 Requirement: Optional subhead and content degradation）。驗證：用柯文哲案資料建測試 CSV，於主控台呼叫 buildNodes，節點數正確、年代正確填充、只有小標的事件其 content 為空、空列不產生節點。
- [x] 3.2 在 headline.js 的 renderNode 產生三層 stacked DOM：`.node-time`（粗）/`.node-subhead`（粗）/`.node-content`（一般、行高≥1.5）；小標為空不渲染該層、內文為空不渲染該層；內文逐字照 CSV（實作規格 Requirement: Three-tier stacked node rendering 與 Requirement: Optional subhead and content degradation）。新增 src/styles/headline.css 定義三層樣式與小標/內文左緣對齊縮排，並在 index.html 引入。驗證：headless Chrome 渲染版型二測試任務，完整節點含三個 class、僅小標事件無 `.node-content`、`.node-content` 文字逐字等於 CSV 欄位值。
- [x] 3.3 建立版型二回歸樣本：在 missions/ 新增一筆測試任務（柯文哲案資料、標頭符合 schema、年代填西元 2024/2025/2026）並於 missions/index.json 標 `"template":"headline"`。驗證：以該任務開啟，年代徽章在 2024→2025→2026 變動前各插入一次、切分／不切分皆正常、匯出可產生 PNG。

## 4. 文件

- [x] 4.1 新增 docs/templates/版型二-標題時間軸.md，比照 docs/templates/版型一-時間軸.md 結構，記錄 schema（含小標）、年代西元、三層 stacked 版面、與版型一的差異、範例 CSV。驗證：內容審閱——schema 七欄齊備、含「小標可獨立／內文可省略」與「年代用西元」說明、範例 CSV 可被版型二 buildNodes 正確解析。

## 5. 整體驗證

- [x] 5.1 版型一無回歸：以 headless Chrome 對 `2026_美伊戰爭大事記`（未設 template）比對本次變更前後的卡片 DOM 結構、尺寸與斷頁張數一致。驗證：截圖＋同源 iframe 探針量測（卡片 1200×1200、無 overflow），與基準一致。
- [x] 5.2 版型二端到端：以版型二測試任務確認三層節點、年代徽章、頁尾、切分/不切分、匯出全部正常，內文逐字無竄改。驗證：headless Chrome 探針量測各卡無 overflow＋逐節點文字比對 CSV。
