## Context

系統目前只有給開發者看的技術文件（`HANDOFF.md`、`docs/templates/*.md`），沒有給一般使用者（編輯、設計師、新加入協作者）一個可在瀏覽器內循序閱讀的教學頁。專案整體是純前端、無框架、無建置（`index.html`、`dashboard.html`、`probe.html` 都是直接用 `<script type="module">` 載入 `src/*.js`），教學頁必須延續這個慣例，不能引入打包工具或框架。

## Goals / Non-Goals

**Goals:**

- 提供一個不需要讀程式碼就能上手的教學頁，涵蓋啟動方式、三個版型的 CSV schema 與範例、Dashboard 串接試算表流程、版型/模式切換、2× JPG 匯出流程。
- 完全純前端、無建置依賴，可直接用現有的 `python3 -m http.server` 開啟，與其他頁面一致。
- 從現有入口頁（`index.html`、`dashboard.html`）的工具列可被發現並連結過去。

**Non-Goals:**

- 不嵌入任何版型的即時 iframe 預覽；版型畫面用文字說明與 CSV 範例表格呈現即可。
- 不做多語言；僅繁體中文，與專案現況一致。
- 不新增搜尋、互動精靈（wizard）或可替換輸入的表單；教學頁是唯讀文件呈現，僅導覽與捲動高亮是互動行為。
- 不更動任何既有版型渲染、CSV 解析、分頁、匯出或 Dashboard 連結試算表的行為；`index.html`、`dashboard.html` 既有元素的 id/class/行為不重新命名或移除。

## Decisions

### Standalone static page, no template registry dependency

教學內容是寫死在 `tutorial.html` 裡、依章節分組的語意化 `<section>` 區塊，不 fetch 任何 mission CSV，也不 import `src/templates/registry.js`，因為內容是文件說明而非即時資料。考慮過的替代方案：在教學頁內用 `<iframe src="index.html?...">` 嵌入即時版型預覽——此次change 不採用，因為會引入 iframe 尺寸/捲動與跨頁樣式互相影響的複雜度；列為 Non-Goal，未來可另案評估。

### Section navigation via anchors + IntersectionObserver

側邊（或頂部）`<nav class="tutorial-nav">` 列出指向各 `<section id="...">` 的錨點連結；新增的 `src/tutorial.js`（純 `<script>`，非 ES module，因為沒有任何 import 需求）用單一 `IntersectionObserver` 監看所有章節，捲動時把目前章節對應的 `<nav>` 連結加上 `.active`；點擊連結則交給瀏覽器原生錨點捲動，並用 CSS `scroll-behavior: smooth` 讓捲動平滑，不需要額外寫 JS 捲動數學。考慮過的替代方案：hash 路由＋點擊時手動 `scrollIntoView`——此次 change 不採用，因為原生錨點＋CSS smooth-scroll 已同時涵蓋點擊與捲動兩種情境，不需要重複邏輯。

### Shared visual tokens, isolated layout styles

`tutorial.html` 引入既有的 `src/styles/main.css` 取得色彩 token（`--color-header`、`--color-text-year`、`--color-text-content` 等）與字體堆疊，但教學頁專屬的版面（側欄寬度、內容欄寬、CSV 範例表格、程式碼樣式區塊）放在新檔案 `src/styles/tutorial.css`，所有規則 scope 在 `.tutorial-page` 根 class 之下，避免外漏影響 `index.html`/`dashboard.html`（兩者不會引入 `tutorial.css`）。考慮過的替代方案：教學頁用全新獨立色票——此次 change 不採用，因為沿用既有 token 才能讓教學頁視覺與圖卡產生器一致。

### Toolbar link addition is additive only

`index.html` 在 `.toolbar-actions` 最後新增一個連到 `tutorial.html` 的連結；`dashboard.html` 在 `.toolbar` 內新增同樣的連結。兩者都只新增元素，不重新命名、移除或改變既有 toolbar 元素的 id/class/行為，因此 `src/main.js`、`src/dashboard.js` 不需要任何修改。

## Implementation Contract

**行為（Behavior）：**

- 用 `python3 -m http.server` 開啟 `tutorial.html` 後，頁面顯示一個固定的章節導覽（`.tutorial-nav`）與依序排列的內容章節，章節至少包含：系統簡介、本機啟動方式、版型一 CSV schema 與範例、版型二 CSV schema 與範例、版型三 CSV schema 與範例、Dashboard 串接試算表流程、版型與切分／不切分模式切換、2× JPG 匯出流程；匯出章節須說明固定卡片輸出為 2400×2400、MIME 為 `image/jpeg`、檔名為 `card-{n}.jpg`。
- 點擊 `.tutorial-nav` 內任一連結，頁面平滑捲動到對應 `<section id>`，且該連結在 `.tutorial-nav` 中被加上 `.active`（同時移除其他連結的 `.active`）。
- 手動捲動頁面經過某章節時，`.tutorial-nav` 中對應該章節的連結會自動被標記 `.active`（捲動高亮與點擊高亮共用同一套 active-state 邏輯）。
- `index.html` 的 `.toolbar-actions` 與 `dashboard.html` 的 `.toolbar` 內各新增一個可見的連結／按鈕，導向 `tutorial.html`；點擊後瀏覽器導航到該頁。
- 載入 `tutorial.html`、`index.html`、`dashboard.html` 三頁時，瀏覽器 console 皆無未捕捉錯誤；既有版型渲染、CSV 解析、分頁、匯出、Dashboard 連結試算表流程行為不變。

**介面／資料形狀（Interface / data shape）：**

- `tutorial.html`：每個內容章節為 `<section id="<kebab-case-id>" class="tutorial-section">`；`.tutorial-nav` 內每個項目為 `<a href="#<kebab-case-id>">`，`href` 的錨點值必須與對應 `<section id>` 完全相同。
- `src/tutorial.js`：純 script（無 `type="module"`），只做兩件事——(1) 對所有 `.tutorial-section` 建立一個 `IntersectionObserver`，命中時切換 `.tutorial-nav a` 的 `.active`；(2) 不需要任何對外 export 或全域變數洩漏到 `window` 之外的命名空間。
- `src/styles/tutorial.css`：所有選擇器以 `.tutorial-page` 為根（例如 `.tutorial-page .tutorial-nav`），不得有任何不限定在 `.tutorial-page` 之下的全域選擇器（避免影響 `index.html`/`dashboard.html` 的既有樣式，即使它們目前沒有引入此檔案）。
- `index.html`、`dashboard.html` 的新連結沿用既有 class 命名風格（例如 `class="toolbar-link"`），不得重複使用既有 id。

**失敗模式（Failure modes）：**

- 若 `src/tutorial.js` 載入失敗或被瀏覽器封鎖，`tutorial.html` 內容仍必須可讀（章節與文字皆為靜態 HTML，不依賴 JS 才能顯示），僅捲動高亮這個漸進增強效果會缺失，不會造成頁面空白或錯誤。
- `IntersectionObserver` 在不支援的環境下若建構失敗，`tutorial.js` 不得擲出未捕捉例外影響其他頁面腳本；捲動高亮失效時頁面其餘功能（點擊連結捲動）仍正常，因為那是瀏覽器原生錨點行為。

**驗收標準（Acceptance criteria）：**

- 手動以 `python3 -m http.server 8766` 開啟 `tutorial.html`，逐一點擊 `.tutorial-nav` 內每個連結，確認捲動到對應章節且該連結取得 `.active`；手動捲動整頁，確認經過的章節對應連結會自動取得 `.active`。
- 確認 `tutorial.html` 內三個版型章節各自列出該版型的 CSV 欄位清單與至少一個範例列，且與目前各版型 `COLUMNS`／既有 `docs/templates/*.md` 描述一致。
- 開啟 `index.html` 與 `dashboard.html`，確認工具列新增的連結存在、可點擊並導向 `tutorial.html`；確認原有版型切換、模式切換、Dashboard 連結試算表等既有功能不受影響（無 console error、無 UI 跑版）。
- 三頁（`tutorial.html`、`index.html`、`dashboard.html`）開啟時瀏覽器 console 皆無錯誤。

**範圍邊界（Scope boundaries）：**

- 範圍內：新增 `tutorial.html`、`src/styles/tutorial.css`、`src/tutorial.js`；在 `index.html`、`dashboard.html` 各新增一個導向教學頁的連結。
- 範圍外：任何版型渲染邏輯（`src/templates/*.js`）、CSV 解析（`src/csv-loader.js`）、分頁（`src/paginator.js`）、匯出（`src/exporter.js`）、Dashboard 試算表串接（`src/dashboard.js`、`src/sheets-api.js`）的行為變更；iframe 即時預覽；多語言；搜尋功能。

## Risks / Trade-offs

- [Risk] 教學內容（CSV 範例、操作步驟）是寫死的靜態文字，未來版型 schema 或 Dashboard 流程變更時可能與教學頁不同步 → Mitigation: 每個版型章節旁標註對應的 spec capability 名稱（如 `template3-datetime-timeline`），並在 `HANDOFF.md` 補一行提醒：修改對應版型/流程時要同步檢查 `tutorial.html`。
- [Risk] `index.html` 工具列已有多個控制元件，新增連結在窄螢幕可能造成換行擠版 → Mitigation: 新連結沿用 `main.css` 既有的 `@media (max-width: 900px)` toolbar 換行規則，放在 `.toolbar-actions` 最後一個，不新增 breakpoint。
