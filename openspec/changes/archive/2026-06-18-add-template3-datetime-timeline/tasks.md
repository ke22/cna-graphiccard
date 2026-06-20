## 1. 版型三實作

- [x] 1.1 新增 `src/templates/template3.js`，沿用 headline schema，將 `時間` 拆成 `dateText`、`clockText`、`timeSuffix`，無法拆分時保留原始時間文字。
- [x] 1.2 新增 `src/styles/template3.css`，限定於 `.node--template3`，呈現日期/時刻分離、小標粗體、內文保留換行。
- [x] 1.3 實作「同日時間共享日期標籤」（same-date sharing）功能：更新 `buildNodes` 與 `renderNode`，若連續節點在同一年份且具有相同的日期，僅在首個節點顯示日期，後續同日節點隱藏日期文字。

## 2. 接線與樣本

- [x] 2.1 在 registry、模板頁、dashboard 選單加入 `template3`。
- [x] 2.2 新增 `2024_南韓戒嚴大事記` 本機 CSV 任務，manifest 指定 `"template": "template3"`。

## 3. 文件與驗證

- [x] 3.1 新增 docs/templates/版型三-時間小標.md，記錄 schema、時間解析與樣本。
- [x] 3.2 執行 `spectra validate add-template3-datetime-timeline --strict`。
- [x] 3.3 瀏覽器 smoke test：切分、不切分、template selector、既有版型無回歸。
- [x] 3.4 驗證「同日時間共享日期標籤」（same-date sharing）之渲染結果，確認同日節點除了首個節點外皆不重複顯示日期。
