## Context

Dashboard 是編輯者進入 Google Sheets 圖卡流程的工作入口。目前固定工具列只顯示「CNA 圖卡 Dashboard」與單一「教學」連結，沒有品牌層級、目前頁狀態或前往圖卡預覽的直接入口。專案是無框架靜態 HTML/CSS/JS；本變更不得增加依賴，也不得影響 `src/dashboard.js` 綁定的表單元素。

## Goals / Non-Goals

**Goals:**

- 讓導覽清楚表達產品品牌、目前所在頁面與三個主要目的地。
- 建立克制、可信賴的 CNA 新聞編輯台視覺：深海軍藍主色、紅色細線、明確字級層次。
- 讓滑鼠、鍵盤與觸控使用者都能辨識互動狀態。
- 在 320px 至桌面寬度維持單列、可用且不遮住 dashboard 主內容。

**Non-Goals:**

- 不重設 dashboard 表單卡片、欄位或按鈕。
- 不修改 Sheets API、localStorage、分頁／版型選擇或導向邏輯。
- 不新增外部字型、圖示套件、圖片或 JavaScript 導覽控制。
- 不同步改造 `index.html` 的工具列。

## Decisions

### Editorial masthead with existing toolbar compatibility

把現有 `#toolbar.toolbar` 元素改為 `<header>`，並新增 `.dashboard-toolbar` 作為 dashboard 專屬樣式 scope；保留既有 id/class 以避免文件、測試或通用 toolbar 規則失效。品牌鎖定使用兩層文字：「CNA GRAPHICS」小型 kicker 與「圖卡工作台」主標，使用系統既有中文字型，不載入外部資源。導覽底部用 CNA 紅色 3px 細線提供辨識度，背景採不透明深海軍藍，避免通用半透明 toolbar 在白色 dashboard 上顯得像浮層。

替代方案是全面改寫 `main.css` 的 `.toolbar`；不採用，因為會連帶改變圖卡預覽頁。

### Three destination navigation with current page state

品牌區連回 `dashboard.html`，右側語意化 `<nav aria-label="主要導覽">` 提供「Dashboard」、「圖卡預覽」與「使用教學」三個文字入口，分別指向 `dashboard.html`、`index.html`、`tutorial.html`。Dashboard 入口使用 `aria-current="page"` 與可見 active 樣式；其餘入口保留明確 hover／focus-visible 狀態。連結不使用新 id，也不需要 JavaScript。

替代方案是只美化原本的「教學」按鈕；不採用，因為無法解決跨頁資訊架構和目前頁辨識問題。

### Dashboard-scoped responsive navigation

所有新增規則放在 `src/styles/dashboard.css` 並以 `.dashboard-toolbar` 為根，避免影響其他頁面。桌面版使用 72px 單列 masthead；每個導覽連結最小高度 44px。`max-width: 640px` 時縮小間距與字級、隱藏品牌副標但保留「CNA GRAPHICS」，右側導覽允許水平捲動而不換行，確保 320px 寬度下三個入口仍可觸達。Dashboard 主內容上方 padding 與 masthead 高度同步調整，避免遮擋。

替代方案是行動版漢堡選單；不採用，因為只有三個入口，新增展開狀態與 JavaScript 會增加不必要複雜度。

## Implementation Contract

**Behavior:**

- 開啟 `dashboard.html` 時，頂部顯示 CNA GRAPHICS／圖卡工作台品牌與 Dashboard、圖卡預覽、使用教學三個入口。
- Dashboard 入口以 `aria-current="page"` 和可見樣式標記目前頁；品牌與 Dashboard 入口皆導向 `dashboard.html`，圖卡預覽導向 `index.html`，使用教學導向 `tutorial.html`。
- 以 Tab 鍵巡覽時，每個品牌／導覽連結都有清楚的 focus-visible 外框；滑鼠 hover 及目前頁狀態互不混淆。
- 320px、640px 與桌面寬度下，導覽不與品牌重疊、不換成多列，主內容不被固定 masthead 遮住；必要時主要導覽區可水平捲動。
- Dashboard 既有 Sheet 選擇、連結試算表、分頁、版型與開啟按鈕的 id、DOM 行為及 `src/dashboard.js` 不變。

**Interface / data shape:**

- 根元素維持 `id="toolbar" class="toolbar dashboard-toolbar"`，語意元素為 `<header>`。
- 品牌連結 class 為 `.dashboard-brand`，內含 `.dashboard-brand-kicker` 與 `.dashboard-brand-title`。
- 主要導覽為 `.dashboard-primary-nav`，含三個 `.dashboard-nav-link`；目前頁另有 `.is-current` 與 `aria-current="page"`。
- 不增加 JavaScript API、localStorage key、query parameter 或外部依賴。

**Failure modes:**

- 若 dashboard 專屬 CSS 載入失敗，語意化 header/nav 與原生連結仍可操作，不影響表單流程。
- `index.html` 沒有 query string 時沿用既有預設 mission 行為；導覽不自行組裝或保存 URL。
- 窄螢幕空間不足時允許 nav 區水平捲動，不隱藏任何目的地。

**Acceptance criteria:**

- DOM 檢查確認三個導覽 href、`aria-label`、`aria-current` 與既有 dashboard 表單 id 全部存在。
- 在 1400px、640px、320px 寬度檢查 masthead：無文字重疊、無垂直 overflow、主內容未被遮住，導覽入口可用。
- 鍵盤 Tab 可依序到達品牌與三個入口，每個焦點都有清楚外框。
- `spectra analyze optimize-dashboard-navigation --json` 無 Critical/Warning，且 `spectra validate optimize-dashboard-navigation` 通過。

**Scope boundaries:**

- In scope: `dashboard.html` 的導覽 markup，以及 `src/styles/dashboard.css` 的 dashboard 專屬導覽與響應式樣式。
- Out of scope: `src/dashboard.js`、`src/styles/main.css`、dashboard 表單內容、`index.html` 工具列、任何資料或導向邏輯變更。

## Risks / Trade-offs

- [Risk] 320px 螢幕可能無法同時完整顯示品牌與三個入口 → Mitigation: 行動版隱藏品牌副標、壓縮間距，並讓 nav 區可水平捲動而不移除入口。
- [Risk] dashboard 專屬 override 與 `main.css` 通用 `.toolbar` 權重衝突 → Mitigation: 所有覆寫以 `.dashboard-toolbar` 或 `.toolbar.dashboard-toolbar` 定位，且 dashboard.css 保持在 main.css 之後載入。
- [Risk] 新的 `index.html` 入口可能被誤認為直接回到上一張卡 → Mitigation: 標籤明確使用「圖卡預覽」，不使用模糊的「返回」。
