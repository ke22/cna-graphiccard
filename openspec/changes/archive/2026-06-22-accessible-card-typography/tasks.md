## 1. 套用高齡友善字級

- [x] 1.1 依照 **Balanced elder-friendly type scale** 實作需求 **Balanced elder-friendly card type scale** 的共用與版型一字級：在 `src/styles/timeline.css` 將 mission title 設為 52px/1.2、year badge 36px/1.15、timeline date 32px/1.35、timeline body 32px/1.6、footer metadata 28px/1.5；不得修改卡片尺寸、字重、配色、圓點與間距。驗證方式：以 CSS contract 檢查確認每個既有 selector 的 computed target 值完整且 `git diff` 沒有範圍外屬性變更。
- [x] 1.2 依照 **Balanced elder-friendly type scale** 實作需求 **Balanced elder-friendly card type scale** 的版型二字級：在 `src/styles/headline.css` 將 time 設為 32px/1.35、subhead 34px/1.45、body 32px/1.6，保留既有 margin、font-weight 與 white-space 行為。驗證方式：以 CSS contract 檢查三個 `.node--headline` selector 的精確值，並確認沒有其他 declaration 改動。
- [x] 1.3 依照 **Balanced elder-friendly type scale** 實作需求 **Balanced elder-friendly card type scale** 的版型三字級：在 `src/styles/template3.css` 將 date 設為 32px/1.25、clock 34px/1.2、clock suffix 30px/1.2、subhead 34px/1.4、body 32px/1.6，並將 `.node-clock-row` min-height 設為 41px；只修改上述 typography declarations，保留既存日期／事件圓點與對齊修改。驗證方式：以 focused diff 與 CSS contract 檢查確認精確值，且版型三非 typography declarations 無變動。

## 2. 頁尾容量

- [x] 2.1 依照 **Footer reserve follows enlarged metadata** 實作需求 **Footer reserve matches enlarged metadata**：在 `src/main.js` 保留 `FOOTER_ONE_LINE = 84`，將 `FOOTER_TWO_LINE` 由 116 改為 132，並把相關註解更新為 28px 字級；不得修改 footer line 計數、卡片高度或 `currentMaxHeight` 公式。驗證方式：靜態檢查兩個常數與註解，並執行 `node --check src/main.js`。

## 3. 輸出與分頁驗證

- [x] 3.1 依照 **Preserve card dimensions and let pagination grow** 驗證需求 **Enlarged typography preserves card output behavior** 與 **Footer reserve matches enlarged metadata**：對 timeline、headline、template3 三個 sample mission 分別檢查 split 與 `split=0`；split 卡片須維持 1200×1200 且 `scrollHeight <= clientHeight + 1`，卡片張數可增加，single 卡片須維持 1200px 寬並自動增高；以 0／1／2 metadata 狀態確認 footer 不重疊，再以 export probe 確認 scale 2、固定卡片 2400×2400、`image/jpeg`、`.jpg` 檔名。若 Browser 介面不可用，改以 CSS/JS 契約、既有 DOM 量測流程與隔離 export DOM 測試驗證可自動化項目，並記錄未執行的視覺檢查。最後執行 `spectra analyze accessible-card-typography --json` 與 `spectra validate accessible-card-typography`。
