## Why

Dashboard 頂部目前只有頁面標題與「教學」連結，缺乏產品層級、目前頁識別和前往圖卡預覽的直接入口；在窄螢幕上也只有通用 toolbar 排版。導覽應更像可信賴的新聞編輯工作台，同時維持既有 Sheets 操作流程不變。

## What Changes

- 將 dashboard 頂部改為語意化的 `<header>`／`<nav>` 結構，保留既有 `#toolbar` 與 `.toolbar` 相容性。
- 建立「CNA GRAPHICS／圖卡工作台」品牌層級，使用深海軍藍、紅色細線與編輯台式排版，和主內容形成清楚層次。
- 新增 Dashboard、圖卡預覽、使用教學三個導覽入口；Dashboard 標示 `aria-current="page"`。
- 補齊鍵盤 focus、hover、active、觸控尺寸和窄螢幕緊湊排版。
- 不改動 Google Sheets 連結、分頁選擇、版型選擇或開啟圖卡的 JavaScript 行為。

## Capabilities

### New Capabilities

- `dashboard-navigation`: Dashboard 的品牌導覽、目前頁狀態、跨頁入口、鍵盤可用性與響應式行為。

### Modified Capabilities

(none)

## Impact

- Affected specs: `dashboard-navigation`
- Affected code:
  - Modified: `dashboard.html`
  - Modified: `src/styles/dashboard.css`
  - New: (none)
  - Removed: (none)
