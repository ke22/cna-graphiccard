## Context

圖卡產生器目前是純前端、單一寫死的渲染流程：`main.js` 直接 import `csv-loader`（欄位映射 `年代/時間/內文`）、`paginator`（量高度斷頁）、`renderer`（圓點＋時間＋內文 DOM），程式中沒有「版型」這個概念。版型一的節點是「時間 → 內文」兩層。

新需求「柯文哲案大事記」是法律案件年表，來源資料每個事件含**摘要＋詳述兩層**（小標 vs 內文），且年份以民國表示。記者希望輸出時年代統一西元、摘要以粗體小標呈現、詳述為次層段落。此結構版型一表達不了，需新增版型二；同時把「選版型」抽成接縫，避免版型專屬邏輯散落在 main/loader/renderer。

約束：純前端、無建置工具、以 HTTP 伺服器開啟；內文須逐字照 CSV 不得竄改；卡片固定 1200×1200（匯出 2×）；現有版型一行為不得改變。

## Goals / Non-Goals

**Goals:**

- 引入版型接縫：版型模組統一介面 ＋ registry，`main.js` 對版型無感（不再 import 版型專屬邏輯）。
- 版型一邏輯原樣搬入 `src/templates/timeline.js`，輸出與搬移前逐位元一致。
- 新增版型二（`headline`）：schema `年代,標題,時間,小標,內文,資料來源,更新時間`（年代西元），節點三層 stacked 渲染。
- 版型選擇：`missions/index.json` 的 `template` 欄（預設 `timeline`）＋ `?template=` 覆寫。
- 年代徽章、斷頁、頁首頁尾、雙輸出、匯出、預覽縮放由兩版型共用。

**Non-Goals:**

- 不做民國→西元的自動換算邏輯；年代欄由記者直接填西元（程式只照欄位值用）。
- 不為版型二設計與版型一不同的頁首／頁尾／徽章樣式；共用既有外框。
- 不新增版型選擇 UI（工具列不加版型下拉）；僅靠 manifest 欄與 URL 參數。
- 不變更版型一的任何視覺或輸出。
- 不處理來源 CSV 無標頭／摘要詳述合併等資料清理；版型二只吃符合 schema 的標頭式 CSV。

## Decisions

**決策 1：版型介面只涵蓋「欄位映射」與「節點渲染」，外框與斷頁共用。**
版型模組輸出 `{ id, buildNodes(records, ctx) → nodes, renderNode(node) → HTMLElement }`。卡片外框（頁首／年代徽章插入／頁尾）、`renderCards` 的組卡與斷頁邏輯維持在共用層，呼叫版型的 `renderNode` 取得每個節點 DOM。
理由：版型一與版型二差異**只在節點內部結構與欄位**；外框、徽章、斷頁、雙輸出完全相同。把共用部分留在共用層，版型模組才夠薄但仍有實質行為（schema＋節點 DOM），通過 deletion test（刪掉 headline.js 版型二即無法渲染）。
替代方案：讓每個版型自備整張卡片渲染 → 會把頁首頁尾徽章邏輯複製兩份，違反 DRY 且日後改頁尾要改兩處，否決。

**決策 2：`renderNode` 由共用 renderer 委派給版型。**
現有 `renderer.js` 的 `renderNode` 內含版型一專屬的「時間＋內文」結構。重構為：共用 `renderCards`／徽章／頁尾保留在 `renderer.js`，但節點內部交由「目前版型的 `renderNode`」產生。版型一的節點結構搬到 `templates/timeline.js`，版型二在 `templates/headline.js`。
理由：保持斷頁量測（量實際渲染高度，含徽章與間距）不動，符合既有「徽章包進節點一起量」的做法。

**決策 3：版型選擇優先序為 `?template=` > `missions/index.json` 的 `template` > 預設 `timeline`。**
`main.js` 解析 mission 後讀 manifest 取 `template`，URL 可覆寫供測試；未知 id 退回 `timeline` 並 console 警告。
理由：與既有 meta 欄（資料來源/更新時間）的「URL > sheet/manifest > 預設」優先序一致，記者心智模型不變。

**決策 4：版型二節點為三層 stacked，欄位缺值優雅降級。**
DOM：`.node-time`（粗體）/ `.node-subhead`（粗體，小標）/ `.node-content`（一般、行高 1.6，內文）。小標／內文左緣對齊、相對時間略縮排。小標為空則不渲染該層、內文為空則不渲染該層；兩者皆空的節點不產生。
理由：來源資料有「只有摘要、無詳述」的事件，需可只顯示小標而不留空白。

## Implementation Contract

**Behavior（使用者可觀察）：**
- 開啟 `index.html?mission=<名稱>`，若該任務 manifest 的 `template` 為 `headline`，畫面以版型二渲染：每個事件顯示「時間（粗）→ 小標（粗）→ 內文（一般）」三層；年代變動時插入西元年代徽章；頁首標題、頁尾資料來源／更新時間、切分／不切分、匯出皆與版型一一致。
- manifest 未指定 `template` 或值為 `timeline` 時，輸出與本次變更前**完全相同**（版型一回歸測試）。
- `?template=headline` 可覆寫 manifest 值；未知版型 id 退回 `timeline`。

**Interface / data shape：**
- 版型模組介面：`export default { id: string, columns: {…別名映射}, buildNodes(records, ctx) → Array<node>, renderNode(node) → HTMLElement }`。
  - 版型一 node：`{ year, date, content, badge }`（沿用現狀）。
  - 版型二 node：`{ year, date, subhead, content, badge }`；`buildNodes` 從標頭 `年代/標題/時間/小標/內文/資料來源/更新時間` 映射，年代向下填充、跨年標 `badge`，`標題/資料來源/更新時間` 取整欄第一個非空值。
- `src/templates/registry.js`：`export function getTemplate(id) → templateModule`（未知 id 回 timeline）。
- `missions/index.json` 每筆任務新增可選欄 `"template": "timeline" | "headline"`。
- `renderer.js`：`renderCards(pagedNodes, options)` 維持簽名；內部改用 `options.template.renderNode` 產生節點 DOM；徽章與頁尾邏輯不變。

**Failure modes：**
- manifest 無 `template` → 預設 `timeline`（靜默）。
- `template` 為未知 id → 退回 `timeline`，`console.warn` 提示（不中斷渲染）。
- 版型二某節點小標與內文皆空 → 該節點略過，不產生空白節點。

**Acceptance criteria：**
- 既有任務 `2026_美伊戰爭大事記`（未設 template）以 headless Chrome 渲染，卡片 DOM 結構與尺寸與變更前一致（版型一無回歸）。
- 新增一筆 `template: "headline"` 的測試任務（用柯文哲案資料、標頭符合 schema、年代填西元），渲染後每節點含 `.node-time`/`.node-subhead`/`.node-content`，內文逐字等於 CSV 欄位值。
- 只有小標的事件：DOM 僅含 `.node-time` 與 `.node-subhead`，無 `.node-content`。
- `?template=headline` 對既有任務生效；`?template=bogus` 退回版型一。
- 切分／不切分、匯出、年代徽章在版型二皆正常。

**Scope boundaries：**
- In scope：template 接縫、版型一搬移、版型二模組與 CSS、manifest `template` 欄、`main.js` 選版型、版型二規格文件。
- Out of scope：民國→西元換算、版型選擇 UI、版型一視覺變更、來源 CSV 清理工具、Google Sheet 端的版型欄。

## Risks / Trade-offs

- [搬移版型一時不慎改動行為] → 先重構（搬移）並以 headless Chrome 對既有任務做 DOM／尺寸回歸比對，確認一致後再加版型二。
- [斷頁高度量測對版型二三層結構低估而溢出] → 沿用既有量測法（量實際渲染高度、含節點間距與徽章），版型二節點以相同隱藏容器寬度量測；新增節點較高時斷頁自動納入。
- [小標與內文視覺層級不明顯] → 小標粗體＋深色、內文一般＋行高 1.6，並維持 WCAG（≥16px、行高 ≥1.5）。
- [registry 過薄淪為 pass-through] → registry 同時負責未知 id 退回與預設解析，非單純轉發；刪除後 main 無法選版型，通過 deletion test。
