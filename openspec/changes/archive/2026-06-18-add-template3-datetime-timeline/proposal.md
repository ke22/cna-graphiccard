## Why

既有版型二能呈現「時間 → 小標 → 內文」，但時間欄位仍是一整行文字。南韓戒嚴這類即時事件密集、常以「日期＋時分」記錄，若把 `12月3日22 : 50 左右` 原樣排成一行，時刻不夠醒目，也不利於快速掃讀。

## What Changes

- 新增**版型三**（`template3`）：沿用 `年代,標題,時間,小標,內文,資料來源,更新時間` schema，但將 `時間` 拆成日期、時刻與可選後綴，且支援連續同日事件共享同一個日期標籤。
- 新增 `src/templates/template3.js` 與 `src/styles/template3.css`，節點呈現為「日期＋醒目時刻 → 小標 → 內文」；內文保留換行、項目符號與編號。
- 在模板 registry、模板頁 toolbar、dashboard 版型選單加入 `template3`。
- 新增本機樣本任務 `2024_南韓戒嚴大事記`，方便立即測試版型三。

## Capabilities

### New Capabilities

- `template3-datetime-timeline`: 版型三資料 schema、時間拆分規則、同日時間共享日期標籤（same-date sharing）、節點渲染、選單與樣本任務。

### Modified Capabilities

- `template-system`: registry 與版型選單多支援 `template3`。

## Impact

- Affected specs: 新增 `template3-datetime-timeline`，擴充 template selection 行為。
- Affected code:
  - New: `src/templates/template3.js`, `src/styles/template3.css`, `docs/templates/版型三-時間小標.md`, `missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv`
  - Modified: `src/templates/registry.js`, `index.html`, `dashboard.html`, `missions/index.json`
