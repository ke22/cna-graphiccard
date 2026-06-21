# Handoff — CNA 圖卡產生器

最後更新：2026-06-21

## 這是什麼

中央社（CNA）新聞圖卡產生器，純前端（HTML/CSS/JS，無框架、無建置）。目前支援三個時間軸版型：

- **版型一·時間軸**：欄位 `年代, 時間, 內文`，用於一般事件時間軸。
- **版型二·標題時間軸**：欄位 `年代, 標題, 時間, 小標, 內文, 資料來源, 更新時間`，用於有主標、小標與段落內文的大事記。
- **版型三·時間小標**：欄位 `年代, 標題, 時間, 小標, 內文, 資料來源, 更新時間`，「年代標籤 → 大點日期 → 小點事件」垂直階層，同年同日的連續事件共用日期標題。

年代欄接受別名：`年代`、`年`、`西元`（三個版型均已支援）。

## 目前進行中的 Spectra change

目前沒有進行中的 change。可執行以下指令歸檔已完成的 change：

```bash
spectra archive tutorial-user-popup
spectra archive accessible-card-typography
spectra archive optimize-dashboard-navigation
spectra archive adjust-template3-layout
spectra archive add-system-tutorial
```

## 如何啟動

必須用 HTTP 伺服器開啟，不能雙擊用 `file://`，因為 ES module 與 fetch 會被瀏覽器限制。

```bash
cd /Users/yulincho/Documents/01_Github/cna-graphiccard
python3 -m http.server 8766
```

啟動後開 `dashboard.html` 即自動載入預設試算表（不需要再貼 URL）：

```text
http://localhost:8766/dashboard.html
```

其他常用網址：

```text
http://localhost:8766/index.html?mission=2026_美伊戰爭大事記
http://localhost:8766/index.html?mission=2026_柯文哲案大事記
http://localhost:8766/index.html?mission=2024_南韓戒嚴大事記&template=template3&split=0
```

改完 JS/CSS 後瀏覽器要強制重整 `Cmd+Shift+R`。`python3 -m http.server` 不會送 no-cache header。如果仍看到舊樣式，改用無痕模式，或開 DevTools → Application → Local Storage，清除 `cna-dashboard-sheet-url`。

## 主要檔案

```text
index.html                         工具列（白色 frosted glass 52px）、卡片掛載點
dashboard.html                     Google Sheet 圖卡啟動入口（52px nav，預設試算表自動連結）
tutorial.html                      開發者教學頁：章節式導覽，CSV schema、Dashboard 流程、切換與匯出
probe.html                         headless/iframe 驗證工具

src/
  main.js                          主流程：URL 參數、載入資料、選版型、斷頁、渲染；無 query 時自動導向預設試算表
  dashboard.js                     dashboard 連結試算表、列分頁、開啟模板；init() 自動連結預設試算表
  tutorial.js                      教學頁 IntersectionObserver 捲動高亮（純 script，無 type="module"）
  tutorial-popup.js                共用彈窗模組：initTutorialPopup() 建立 <dialog>、兩個 tab（操作流程 / 版型說明）
  csv-loader.js                    manifest 定位、Google Sheet/本機 CSV 載入、RFC4180 解析
  paginator.js                     量測節點高度、切分/不切分、DP 平衡斷頁、版型三日期延續分頁
  renderer.js                      共用卡片外框、頁首、年代徽章、頁尾
  exporter.js                      html2canvas 以 2× 比例逐卡輸出 JPG
  sheets-api.js                    Sheets API、spreadsheet/gid 解析、gviz URL 組裝；DEFAULT_SPREADSHEET_URL 預設試算表

  templates/
    registry.js                    template id → module；未知 id fallback timeline
    timeline.js                    版型一 buildNodes/renderNode（COLUMNS.year 接受 年代/年/西元）
    headline.js                    版型二 buildNodes/renderNode（COLUMNS.year 接受 年代/年/西元）
    template3.js                   版型三 buildNodes/renderNode（COLUMNS.year 接受 年代/年/西元）

  styles/
    main.css                       全域與 index.html 工具列（白色 frosted glass，tb-group 分隔線，ghost select）
    dashboard.css                  dashboard 52px nav（bottom-border active state，紅色品牌斜線）
    timeline.css                   共用卡片與版型一節點樣式（32px 字體）
    headline.css                   版型二三層節點樣式（34px 小標）
    template3.css                  版型三日期/事件圓點與階層樣式
    tutorial.css                   教學頁版面，scope 在 .tutorial-page
    tutorial-popup.css             <dialog> 彈窗樣式（tabs、步驟列表、版型說明卡片）

missions/
  index.json                       任務 manifest
  2026_美伊戰爭大事記/*.csv         版型一資料（年代欄名為「西元」）
  2026_柯文哲案大事記/*.csv         版型二資料
  2024_南韓戒嚴大事記/*.csv         版型三範例資料
```

## 預設試算表自動載入

`src/sheets-api.js` 定義：

```js
export const DEFAULT_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8/edit?gid=2027148002#gid=2027148002';
```

**三個地方**依賴這個常數：

1. `src/main.js`：`index.html` 無任何 query 時，`window.location.replace(buildTemplateUrl(...))` 導向預設試算表第一個分頁。
2. `src/dashboard.js`：`init()` 優先序：localStorage `cna-dashboard-sheet-url` > `spreadsheets.json` 第一筆 > `DEFAULT_SPREADSHEET_URL`，任何情況都會自動連結。
3. `src/sheets-api.js`：提供給上述兩個檔案 import。

**重要**：`localStorage` 的 `cna-dashboard-sheet-url` 會蓋過 `DEFAULT_SPREADSHEET_URL`。若要重置回預設，在 DevTools → Application → Local Storage 刪除該 key，或用無痕模式。

## 工具列（index.html）

52px 白色 frosted glass（`rgba(255,255,255,0.96)` + `backdrop-filter: blur(12px)`），`border-bottom: 1px solid rgba(0,0,0,0.08)`。

四個 `.tb-group`，`border-left: 1px solid #E5E7EB` 分隔：

| 群組 | 內容 |
|---|---|
| identity | `#mission-title`（任務標題，最大 200px） |
| source | `#sheet-select`（切換試算表，不足 2 個時隱藏）、`#mission-select`（切換分頁） |
| view | `#template-select`（版型）、mode toggle（切分/不切分） |
| actions | `#btn-refresh`（↻）、`#btn-export`（匯出）、`#btn-tutorial`（教學彈窗） |

## Dashboard nav

52px，`align-items: stretch`。左側品牌區：`CNA` slug + 1.5px 紅色斜線 + `圖卡工作台` 名稱。Active 狀態改用 `box-shadow: inset 0 -3px 0 0 var(--dashboard-nav-accent)` 取代白色方框。

## 教學彈窗（tutorial-popup.js）

`index.html` 與 `dashboard.html` 的「教學」/「使用教學」連結（`id="btn-tutorial"`）點擊後開啟 `<dialog id="tutorial-dialog">`，不跳轉頁面。

彈窗兩個 tab：

- **操作流程**：三步驟使用指引（選分頁 → 選版型/模式 → 匯出），無終端機指令或 URL 參數。
- **版型說明**：三個版型的欄位對照表（必填欄位以藍色標籤標示）。

Footer 有「開發者說明 →」連結導向 `tutorial.html`（技術參考保留不變）。

API：

```js
import { initTutorialPopup } from './src/tutorial-popup.js';
initTutorialPopup(); // idempotent；#btn-tutorial 不存在時靜默返回
```

## 卡片字體尺寸（accessible-card-typography）

2026-06-21 字體放大，目標是印出/截圖後清晰閱讀：

| 元素 | 舊 | 新 |
|---|---|---|
| 版型一 內文 | 28px | 32px |
| 版型二/三 小標 | 28px | 34px |
| 版型三 內文 | 28px | 32px |
| 頁尾文字 | 24px | 28px |
| `FOOTER_TWO_LINE`（`main.js`） | 116 | 132 |

## 版型選擇邏輯

`src/main.js` 版型優先序：

1. URL `?template=...`
2. `missions/index.json` 裡該任務的 `template`
3. 預設 `timeline`（`registry.js` 的 `DEFAULT_TEMPLATE_ID`；Dashboard 選單預設 UI 值是 `template3`，兩件事）

未知 template id 在 `registry.js` fallback 到 `timeline` 並 `console.warn`。

## 版型三 · 時間小標 階層

- `parseTime` 將時間欄拆成 dateText、`HH:MM` clockText、與 timeSuffix（例：`12月3日22:50 左右` → 日期 `12月3日`、時刻 `22:50`、suffix `左右`）。
- 同年同日的連續事件只有第一筆 `showDate = true`，其餘共用日期標題。
- `renderNode`：年代徽章（`renderer.js`）→ 可選 `.template3-date-header`（36px 圓點，`showDate` 或 `forceDate`）→ `.template3-event`（20px 圓點 + clock-row + 內文）。
- 有 `clockText` 時，時刻與小標合併在 `.node-clock-row`（`flex-wrap: wrap`）；無 `clockText` 時小標單獨一行。

## 分頁與日期延續（paginator.js）

- 版型三每個節點量測「一般高度」與「強制日期高度」；候選卡片第一節點一律用強制日期高度計算。
- 跨卡續頁：複製首節點並設 `forceDate = true`，確保每張卡片開頭有日期脈絡，不修改原始資料。

## 共用頁首 / 頁尾

- 標題優先序：sheet/CSV `標題` 欄 > URL `?title=` > 任務名稱 > `CNA 時間軸圖卡`。
- 頁尾（`renderer.js`）：`資料來源` 與 `更新日期` 皆空則不渲染。
- `renderer.js` 幫 timeline 容器加 `timeline--<template.id>` class，讓各版型 CSS scope 覆寫不互衝。

## 驗證工具

`probe.html` 用同源 iframe 載入 `index.html`，量測 `.card` 的寬高與 overflow：

```text
http://localhost:8766/probe.html?m=2026_柯文哲案大事記
http://localhost:8766/probe.html?m=2026_柯文哲案大事記&split=0
http://localhost:8766/probe.html?m=2026_柯文哲案大事記&export=1
http://localhost:8766/probe.html?m=2024_南韓戒嚴大事記&template=template3
```

## 後續建議

- 歸檔已完成的 change（見上方指令清單）。
- 若要替換預設試算表，只改 `src/sheets-api.js` 的 `DEFAULT_SPREADSHEET_URL`。記得同時清除使用者瀏覽器的 `cna-dashboard-sheet-url` localStorage，否則舊 URL 仍優先。
- 若要新增版型：沿用 `src/templates/{id}.js` 的 `{ id, columns, buildNodes, renderNode }` 介面；在 `registry.js` 登記；記得在 `tutorial-popup.js` 的版型說明 tab 補充欄位說明。
- 版型三新增任務：`missions/index.json` 加 `template: "template3"` 即可，CSV 欄位與版型二相同。
- 交付前人工驗一次真實 html2canvas 匯出（CDN 可用、JPG 下載正常）。
- Dashboard 交付前確認 Google API key 在部署網域 referrer 限制下可用。
