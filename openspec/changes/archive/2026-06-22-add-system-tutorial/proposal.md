## Why

目前系統只有給開發者看的技術文件（`HANDOFF.md`、`docs/templates/*.md`），沒有給「想知道怎麼用」的人（編輯、設計師、新加入協作者）一個可在瀏覽器內循序閱讀、操作的教學頁面。新增一個獨立的教學頁，用跟現有專案一致的純前端（無框架、無建置）方式呈現，讓使用者不需要先讀程式碼就能理解三個版型、CSV 欄位、Dashboard 流程與匯出方式。

## What Changes

- 新增 `tutorial.html` 作為教學頁面入口，純前端 HTML/CSS/JS，不依賴任何建置工具或外部框架（與 `index.html`/`dashboard.html` 一致）。
- 教學內容依章節組織，至少涵蓋：系統簡介、本機啟動方式（`python3 -m http.server`）、三個版型（版型一時間軸／版型二標題時間軸／版型三時間小標）各自的 CSV 欄位與一個範例列、Dashboard 串接 Google 試算表流程、模板工具列切換版型與切分／不切分模式、2× JPG 匯出流程。
- 章節導覽：左側（或頂部）固定的章節清單，點擊可跳轉頁面內對應區塊；目前捲動到的章節在導覽清單中標示為作用中狀態。
- 從 `index.html` 與 `dashboard.html` 的工具列新增一個連到 `tutorial.html` 的連結，方便使用者發現教學頁。
- 不更動任何版型渲染邏輯、CSV 解析、分頁或匯出流程的既有行為；教學頁僅為新增的靜態說明與導覽互動。

## Capabilities

### New Capabilities

- `system-tutorial-page`：獨立的 `tutorial.html` 教學頁面，提供章節式導覽，說明系統啟動方式、三版型 CSV schema、Dashboard 連結試算表流程，以及切換版型/模式與匯出 2× JPG 的操作步驟。

### Modified Capabilities

(none)

## Impact

- Affected specs: `system-tutorial-page`
- Affected code:
  - New: `tutorial.html`, `src/styles/tutorial.css`, `src/tutorial.js`
  - Modified: `index.html`, `dashboard.html`, `HANDOFF.md`
  - Removed: (none)
