## Why

目前三種圖卡的主要內文為 27–28px、頁尾為 24px；圖卡縮放顯示在手機或社群平台後，對高齡讀者不夠友善。需要以一致的平衡大字級提升閱讀性，同時維持現有品牌視覺、固定卡片尺寸與完整內容。

## What Changes

- 將三種匯出圖卡的標題、年代、日期／時間、小標、內文與頁尾提高到一致的高齡友善字級階層。
- 主標調整為 52px、年代 36px、日期／時間 32–34px、小標 34px、內文 32px、頁尾 28px。
- 配合字級微調標籤行高與版型三時刻列最低高度，內文行高維持 1.6。
- 將雙行頁尾的版面保留高度由 116px 調整為 132px，避免較大頁尾文字擠壓卡片內容。
- 保留 1200×1200 固定卡片、單張長圖、2× JPG 匯出與現有斷頁演算法；字級增加後允許切分模式自動增加卡片張數。

## Capabilities

### New Capabilities

- `accessible-card-typography`: 三種圖卡共同的高齡友善字級階層、行高、頁尾空間及無溢出驗收契約。

### Modified Capabilities

(none)

## Impact

- Affected specs: `accessible-card-typography`
- Affected code:
  - Modified: `src/styles/timeline.css`
  - Modified: `src/styles/headline.css`
  - Modified: `src/styles/template3.css`
  - Modified: `src/main.js`
  - New: (none)
  - Removed: (none)
