## Context

中央社（CNA）圖卡製作流程需要將記者從 Google 試算表整理的事件時間軸資料，轉換為符合品牌視覺規範的新聞圖卡。目前以 SVG 模板（1200×1404px）為設計參考，包含深藍色頁首、左側垂直 Timeline 線、圓形節點與文字區塊。

本次以「2026 美伊戰爭大事記」（22 個節點）為首個任務，驗證完整流程。

**現有資源：**
- `missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv`：欄位為「日期, 內容」，共 22 筆，部分內容含多段落換行
- `/Users/yulincho/Desktop/timeline_template.svg`：視覺設計參考，1200×1404px

## Goals / Non-Goals

**Goals:**
- 讀取任意 missions/ 子目錄的 CSV，渲染為符合模板的 Timeline HTML 頁面
- 固定寬度 1200px，高度依內容自動撐開
- 智慧斷頁：節點不被切割，整個節點移至下一張卡片
- 雙輸出模式：滾動預覽 + 獨立 1200×1200 卡片匯出（PNG）
- 視覺還原 SVG 模板：#004E98 頁首、#F7F7F7 背景、左側線段、橢圓節點

**Non-Goals:**
- 不串接 Google Sheets 即時 API（僅讀 CSV）
- 不提供視覺化拖拉編輯
- 不支援 Timeline 以外的圖表類型
- 不做後端服務或資料庫

## Decisions

### 技術選型：純 HTML/CSS/JS，無框架

**決策：** 使用 Vanilla HTML + CSS + JS，以本機瀏覽器開啟 `index.html`。

**理由：**
- 無需建置工具或伺服器，記者直接在本機使用
- html2canvas 可在瀏覽器中直接截圖 DOM，無需 puppeteer
- 模板還原以 CSS 較 SVG 更易維護

**放棄的替代方案：**
- Next.js/Vite：建置複雜，非技術使用者難以操作
- Puppeteer：需 Node.js 環境，超出本工具目標

### 斷頁演算法：運行時 DOM 高度測量

**決策：** 先渲染所有節點到隱藏容器，用 `getBoundingClientRect()` 測量每個節點實際高度，再計算分頁。

**理由：**
- 節點內容為可變長度中文段落，無法靜態預估高度
- DOM 測量在所有 Google Fonts 載入後進行，確保高度準確

**關鍵參數：**
- 卡片可用內容高度 = 1200px（總高）- 232px（頁首）- 40px（上間距）- 40px（下間距）= **888px**
- 節點不可分割：若 `accumulated + nodeHeight > 888`，整個節點移至下一張卡片
- 每張卡片底部自動填滿至 1200px（用 padding 補足）

### 雙輸出模式架構

**決策：** 同一頁面切換「滾動預覽」與「匯出模式」。

- **滾動預覽**：所有卡片在頁面上連續顯示，有視覺間距，方便校對
- **匯出模式**：JS 依序對每張 `.card` 元素呼叫 `html2canvas`，生成並下載 PNG

### CSS 視覺設計系統

| Token | 值 |
|---|---|
| `--color-header` | `#004E98`（深藍） |
| `--color-bg` | `#F7F7F7`（淺灰底） |
| `--color-node` | `#004E98`（節點圓點） |
| `--color-line` | `#B9BBC2`（垂直連線） |
| `--color-text-year` | `#1F2933` |
| `--color-text-content` | `#12141A` |
| `--card-width` | `1200px` |
| `--card-height` | `1200px` |
| `--header-height` | `232px` |

### 模組職責劃分

```
src/
  csv-loader.js    → 讀取並解析 CSV，回傳 [{date, content}] 陣列
  paginator.js     → 接收節點陣列，回傳 [[card1nodes], [card2nodes], ...]
  renderer.js      → 接收分頁資料，產生 HTML DOM 結構
  exporter.js      → 使用 html2canvas 批次匯出 PNG
  styles/
    main.css       → 全域樣式、CSS 變數、工具列
    timeline.css   → 卡片、頁首、節點、連線樣式
```

## Implementation Contract

### 行為（使用者觀察）

1. 使用者以瀏覽器開啟 `index.html?mission=2026_美伊戰爭大事記`
2. 頁面自動讀取對應 CSV，解析後渲染 Timeline 卡片
3. 若 22 個節點超過單張卡片容量，自動分頁（預計 3 張）
4. 點擊「匯出所有卡片」按鈕 → 瀏覽器依序下載 `card-1.png`、`card-2.png`…

### 資料介面

```js
// csv-loader.js 輸出
[{ date: "2月28日", content: "美國與以色列…\n\n伊朗向以色列…" }]

// paginator.js 輸出
[[node1, node2, ...], [node8, node9, ...], ...]  // 每個子陣列為一張卡片的節點

// paginator.js 輸入參數
paginate(nodes, maxHeight = 888)
```

### 失敗模式

- CSV 路徑不存在 → 頁面顯示錯誤訊息「無法載入資料：{mission} 不存在」
- html2canvas 不可用 → 匯出按鈕顯示「請在 Chrome/Firefox 中開啟」
- 單個節點高度 > 888px → 強制放入卡片（不無限遞迴），並在 console 警告

### 驗收條件

1. 在 Chrome 開啟 `index.html?mission=2026_美伊戰爭大事記`，頁面正常顯示所有 22 個節點，分布於多張卡片
2. 每張卡片視覺上符合：深藍頁首、灰底、左側垂直線、圓形節點
3. 無任何節點在卡片邊界處被視覺截斷
4. 點擊匯出 → 每張卡片生成獨立 1200×1200 PNG，共 N 個檔案
5. 節點完整性：每個 CSV 節點在輸出中僅出現一次

### 範圍邊界

**在範圍內：** CSV 讀取、HTML 渲染、斷頁算法、雙模式輸出、視覺樣式
**在範圍外：** Google Sheets API、後端、資料庫、非 Timeline 圖表、動畫效果

## Risks / Trade-offs

- [風險] html2canvas 在高 DPI 螢幕輸出模糊 → 緩解：設定 `scale: 2` 參數，輸出 2400×2400，再由使用者縮放
- [風險] 中文字型在截圖中顯示異常 → 緩解：使用 Web Safe 字型或 Google Fonts 預先載入後再觸發匯出
- [風險] CSV 內容含半形逗號導致解析錯誤 → 緩解：使用標準 RFC 4180 CSV 解析，支援引號包覆欄位
- [取捨] 純前端方案無法控制列印精度，DPI 依瀏覽器而定 → 可接受，本工具定位為網頁截圖而非印刷品
