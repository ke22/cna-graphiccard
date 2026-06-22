## Why

目前圖卡產生器只有單一寫死的「版型一·時間軸」渲染流程（`main.js` 直接串接 csv-loader → paginator → renderer），程式中沒有任何版型抽象。新的「柯文哲案大事記」這類法律案件年表，需要**摘要（小標）＋詳述（內文）兩層內容**的呈現，版型一的「時間→內文」單層結構無法表達。因此需要新增版型二，並在此同時把「選哪個版型」這件事抽成可切換的接縫，避免日後每加一個版型就在 main/csv-loader/renderer 各長一段 if 分支。

## What Changes

- 抽出**版型接縫**：新增 `src/templates/` 目錄，每個版型為一個模組，輸出統一介面（欄位映射 `buildNodes` ＋ 節點渲染 `renderNode`）；新增 `src/templates/registry.js` 以 id 對應版型模組。
- 把現有版型一邏輯**原樣搬入** `src/templates/timeline.js`（行為不變、輸出需與搬移前一致），`main.js` 改為向選定版型取資料與渲染，不再直接 import 既有 renderer/loader 的版型專屬部分。
- 新增**版型二**（`src/templates/headline.js`）：schema 為 `年代,標題,時間,小標,內文,資料來源,更新時間`（年代一律西元）；節點以三層 stacked 呈現「時間（粗體）→ 小標（粗體）→ 內文（一般、行高 1.6）」，小標／內文左緣對齊縮排；小標可獨立存在、內文可省略（僅顯示小標那一行）。
- **版型選擇**：`missions/index.json` 每筆任務新增 `"template"` 欄（預設 `"timeline"`）；`main.js` 讀取後挑選版型；網址 `?template=` 可覆寫供測試。
- 共用部分維持不變並由兩版型沿用：年代徽章（跨年插入、年代西元向下填充）、智慧斷頁、頁首／頁尾、切分／不切分雙輸出、html2canvas 匯出、預覽縮放。

## Non-Goals (optional)

（範圍排除細節記於 design.md 的 Goals/Non-Goals）

## Capabilities

### New Capabilities

- `template-system`: 版型註冊與選擇機制——版型模組統一介面、registry 以 id 對應模組、`missions/index.json` 的 `template` 欄與 `?template=` 覆寫的解析優先序，以及兩版型共用的卡片框架（頁首／年代徽章／頁尾／斷頁／雙輸出）契約。
- `headline-template`: 版型二的資料 schema（`年代,標題,時間,小標,內文,資料來源,更新時間`，年代西元）與三層 stacked 節點渲染（時間→小標→內文，小標可獨立、內文可省略）。

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 template-system、headline-template 兩個能力。
- Affected code:
  - New: src/templates/registry.js, src/templates/timeline.js, src/templates/headline.js, src/styles/headline.css, docs/templates/版型二-標題時間軸.md
  - Modified: src/main.js, src/csv-loader.js, src/renderer.js, missions/index.json, index.html
  - Removed: (none)
