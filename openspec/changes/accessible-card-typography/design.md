## Context

三種圖卡都輸出為 1200px 寬，但主要內文僅 27–28px；圖片縮放到手機或社群動態牆後，等效閱讀尺寸接近一般介面 14px，對高齡讀者偏小。現有 paginator 已在字型載入後以實際 DOM 高度量測節點，因此字級放大可以沿用同一斷頁機制，只需接受卡片張數增加。版型三樣式目前另有既存修改，實作必須只動本 change 指定的 typography declarations。

## Goals / Non-Goals

**Goals:**

- 三種圖卡共用一致、平衡的高齡友善字級階層。
- 保持標題、年代、時間、小標、內文與頁尾的視覺層級，不以單純等比例放大造成失衡。
- 維持完整內容、1200×1200 固定卡片、單張長圖與 2× JPG 輸出。
- 讓現有 DOM 量測自動增加分頁，不引入新的斷頁分支。

**Non-Goals:**

- 不新增標準／大字模式、URL 參數或使用者設定。
- 不修改 Dashboard、教學頁、預覽工具列、配色、字重、圓點或卡片尺寸。
- 不截短內容、不限制最大卡片張數、不改變 JPG 匯出格式。
- 不重構 paginator 或 template renderer。

## Decisions

### Balanced elder-friendly type scale

採用已確認的平衡放大，而不是強力放大或可切換模式。共同主標為 52px／1.2、年代徽章 36px／1.15、主要內文 32px／1.6、頁尾 28px／1.5。版型一日期為 32px／1.35；版型二時間為 32px／1.35、小標 34px／1.45；版型三日期為 32px／1.25、時刻 34px／1.2、時刻 suffix 30px／1.2、小標 34px／1.4、內文 32px／1.6，並把 clock row 最低高度調整為 41px。

不採用統一百分比 transform，因為它會同時放大圓點、留白與容器，且隱藏測量容器可能和實際卡片產生不同計算結果。所有值直接更新既有 selector，確保 paginator 的量測樣式與渲染樣式一致。

### Preserve card dimensions and let pagination grow

固定卡片維持 1200×1200；不切分模式維持 1200px 寬與自動高度。切分模式允許卡片張數增加，`paginator.js` 仍等待 `document.fonts.ready` 並量測 `getBoundingClientRect().height`，不修改演算法、節點間距或卡片容量上限。

不採用維持原張數的壓縮間距或文字截斷，因為會抵銷高齡友善與內容完整性；不採用更大卡片，因為會破壞既有輸出規格。

### Footer reserve follows enlarged metadata

頁尾垂直 padding 仍為 18px＋22px。28px 字級、1.5 行高時，單行高度為 42px，加 padding 共 82px，現有 84px 單行 reserve 足夠；雙行為 42×2＋8px gap＋40px padding＝132px，因此只把 `FOOTER_TWO_LINE` 從 116 改為 132，並更新註解中的 24px 為 28px。

## Implementation Contract

**Behavior:**

- timeline、headline、template3 三種版型預設使用本設計定義的精確字級與行高，不提供切換。
- 切分模式每張卡片仍為 1200×1200，任何節點不得被裁切或超出 card；較大文字可使 paginator 產生更多卡片。
- 不切分模式仍為 1200px 寬、內容決定高度，文字不裁切。
- 0／1／2 個頁尾 metadata 欄位皆不和內容重疊；雙行頁尾使用 132px reserve。
- JPG 匯出仍使用 scale 2、`image/jpeg` 與 `card-{n}.jpg`，固定卡片輸出 2400×2400。

**Interface / data shape:**

- 不新增 DOM class、JavaScript API、設定、query parameter 或資料欄位。
- 只更新既有 CSS selector 的 `font-size`／`line-height`／`min-height`，以及 `src/main.js` 的 `FOOTER_TWO_LINE` 常數與相關註解。
- `paginator.js`、`renderer.js`、template JavaScript 與 exporter 不變。

**Failure modes:**

- 若較大字級讓同一節點超過可用高度，沿用 paginator 的既有 fallback：該節點獨占一卡並輸出警告；不得新增裁切或縮字 fallback。
- 長 mission title 若超出頁首寬度，實作不得另行改字重、卡片寬度或隱藏文字；須在三個現有 sample mission 上確認無 overflow。
- 版型三既存的日期／事件對齊和其他未提交修改必須保留，只調整列出的 typography declarations。

**Acceptance criteria:**

- computed styles 符合 Balanced elder-friendly type scale 的所有精確值。
- 三個 sample mission 在 split 模式皆輸出一張以上 1200×1200 卡片，`scrollHeight <= clientHeight + 1`，不要求維持原卡片數。
- 三個 sample mission 在 `split=0` 時寬度為 1200px、高度自動延伸且無水平 overflow。
- 0／1／2 個 metadata 狀態皆無 footer/content 重疊；雙行 reserve 為 132。
- 匯出 probe 顯示所有 capture scale 為 2、固定卡片為 2400×2400、MIME 為 `image/jpeg`、檔名為 `.jpg`。
- Spectra analyze 無 Critical/Warning，validate 通過。

**Scope boundaries:**

- In scope: `src/styles/timeline.css`、`src/styles/headline.css`、`src/styles/template3.css` 的字級／行高，以及 `src/main.js` 的雙行頁尾 reserve。
- Out of scope: Dashboard／教學／工具列樣式、字級切換 UI、斷頁演算法、DOM 結構、配色／字重／圓點／間距重設、輸出尺寸與格式。

## Risks / Trade-offs

- [Risk] 切分卡片張數增加 → Mitigation: 這是已接受的可讀性取捨，驗收只要求無 overflow，不鎖定卡片數。
- [Risk] 版型三的既存未提交樣式被覆蓋 → Mitigation: 只精確修改 typography declarations，不重寫整個檔案；套用後以 focused diff 檢查。
- [Risk] 頁尾放大後壓縮正文容量 → Mitigation: 將雙行 reserve 精確調整為 132px，交由 paginator 自動增加卡片。
