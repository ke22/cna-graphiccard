## Why

教學頁目前以獨立頁面（`tutorial.html`）呈現，點擊後需跳離工作頁面，打斷操作流程；且內容混雜了開發者技術細節（終端機指令、CSV 欄位規格），不適合直接給記者或編輯閱讀。

## What Changes

- 「教學」觸發點（`index.html` 工具列連結、`dashboard.html` 導覽列連結）改為開啟同頁 `<dialog>` 彈窗，不再跳轉新頁面
- 彈窗內呈現**使用者版教學**：三步驟操作指引（開啟 Dashboard → 選擇分頁 → 匯出），無技術術語
- 彈窗底部提供「開發者說明」文字連結，導向現有的 `tutorial.html`（開發者版本保留不動）
- 新增共用模組 `src/tutorial-popup.js`，兩個頁面均引入

## Non-Goals (optional)

- 不修改 `tutorial.html` 現有內容
- 不在彈窗中放入 CSV 欄位格式說明
- 不以 iframe 嵌入 `tutorial.html`

## Capabilities

### New Capabilities

- `tutorial-popup`: 可在任意頁面觸發的教學彈窗，以 `<dialog>` 元素實作，呈現使用者版三步驟教學

### Modified Capabilities

(none)

## Impact

- Affected specs: tutorial-popup（新）
- Affected code:
  - New: `src/tutorial-popup.js`, `src/styles/tutorial-popup.css`
  - Modified: `index.html`, `dashboard.html`
  - Removed: (none)
