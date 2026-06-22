# headline-template Specification

## Purpose

TBD - created by archiving change 'add-headline-template'. Update Purpose after archive.

## Requirements

### Requirement: Headline template data schema
The `headline` template SHALL accept a header-based CSV with columns `年代,標題,時間,小標,內文,資料來源,更新時間`. Per-row fields are `時間` (date), `小標` (subhead), and `內文` (content). The `年代` (year) is a per-row value that SHALL be filled down (only the changed row needs a value) and SHALL be expressed in the Gregorian calendar (西元) as taken verbatim from the column. The single-value fields `標題` (title), `資料來源` (source), and `更新時間` (updated) SHALL each be taken as the first non-empty value in their column. `內文` SHALL be carried verbatim from the CSV cell without modification.

#### Scenario: Row maps to a headline node
- **WHEN** a row has `時間=8月12日`, `小標=北檢主動簽分他字案偵辦柯文哲政治獻金案`, `內文=柯文哲政治獻金案，北檢主動簽分他字案偵辦`
- **THEN** `buildNodes` produces a node `{ date: "8月12日", subhead: "北檢主動簽分他字案偵辦柯文哲政治獻金案", content: "柯文哲政治獻金案，北檢主動簽分他字案偵辦", year, badge }`

#### Scenario: Year fills down in Gregorian form
- **GIVEN** the first row has `年代=2024` and subsequent rows leave `年代` empty until a row with `年代=2025`
- **WHEN** nodes are built
- **THEN** each node before the change carries `year="2024"` and nodes from the change onward carry `year="2025"`

##### Example: title taken as first non-empty
- **GIVEN** the first data row has `標題=柯文哲案大事記` and later rows leave `標題` empty
- **WHEN** nodes are built
- **THEN** the card title resolves to `柯文哲案大事記`


<!-- @trace
source: add-headline-template
updated: 2026-06-22
code:
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - src/sheets-api.js
  - src/tutorial.js
  - src/templates/timeline.js
  - src/styles/dashboard.css
  - HANDOFF.md
  - src/styles/template3.css
  - src/renderer.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - src/main.js
  - src/styles/main.css
  - src/tutorial-popup.js
  - LEARNING.md
  - src/paginator.js
  - probe.html
  - src/exporter.js
  - src/templates/headline.js
  - src/styles/headline.css
  - tutorial.html
  - dashboard.html
  - docs/templates/版型三-時間小標.md
  - src/styles/timeline.css
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/csv-loader.js
  - src/dashboard.js
  - src/templates/registry.js
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - src/styles/tutorial.css
  - src/templates/template3.js
  - docs/templates/版型二-標題時間軸.md
  - index.html
  - missions/index.json
  - spreadsheets.json
  - src/styles/tutorial-popup.css
-->

---
### Requirement: Three-tier stacked node rendering
The `headline` template SHALL render each node as up to three stacked tiers: `.node-time` (the date, bold), `.node-subhead` (the subhead, bold), and `.node-content` (the content, regular weight, line-height ≥ 1.5). The subhead and content left edges SHALL align with each other, indented relative to the time. Text size SHALL meet WCAG (≥16px).

#### Scenario: Full node renders three tiers
- **WHEN** a node with non-empty `date`, `subhead`, and `content` is rendered
- **THEN** the DOM contains `.node-time`, `.node-subhead`, and `.node-content`, with the subhead and content rendered verbatim and their left edges aligned

#### Scenario: Content verbatim
- **WHEN** a node's `content` contains the exact CSV cell text
- **THEN** the `.node-content` text equals the CSV cell value with no characters added or removed


<!-- @trace
source: add-headline-template
updated: 2026-06-22
code:
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - src/sheets-api.js
  - src/tutorial.js
  - src/templates/timeline.js
  - src/styles/dashboard.css
  - HANDOFF.md
  - src/styles/template3.css
  - src/renderer.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - src/main.js
  - src/styles/main.css
  - src/tutorial-popup.js
  - LEARNING.md
  - src/paginator.js
  - probe.html
  - src/exporter.js
  - src/templates/headline.js
  - src/styles/headline.css
  - tutorial.html
  - dashboard.html
  - docs/templates/版型三-時間小標.md
  - src/styles/timeline.css
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/csv-loader.js
  - src/dashboard.js
  - src/templates/registry.js
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - src/styles/tutorial.css
  - src/templates/template3.js
  - docs/templates/版型二-標題時間軸.md
  - index.html
  - missions/index.json
  - spreadsheets.json
  - src/styles/tutorial-popup.css
-->

---
### Requirement: Optional subhead and content degradation
A `headline` node MAY omit the subhead or the content. When `小標` is empty, the `.node-subhead` tier SHALL NOT be rendered. When `內文` is empty, the `.node-content` tier SHALL NOT be rendered. A node whose `小標` and `內文` are both empty SHALL NOT be produced.

#### Scenario: Subhead-only event
- **WHEN** a node has a non-empty `subhead` and an empty `content`
- **THEN** the rendered node contains `.node-time` and `.node-subhead` but no `.node-content`, and no empty placeholder is shown

#### Scenario: Empty event dropped
- **WHEN** a row yields both empty `小標` and empty `內文`
- **THEN** `buildNodes` produces no node for that row

<!-- @trace
source: add-headline-template
updated: 2026-06-22
code:
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - src/sheets-api.js
  - src/tutorial.js
  - src/templates/timeline.js
  - src/styles/dashboard.css
  - HANDOFF.md
  - src/styles/template3.css
  - src/renderer.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - src/main.js
  - src/styles/main.css
  - src/tutorial-popup.js
  - LEARNING.md
  - src/paginator.js
  - probe.html
  - src/exporter.js
  - src/templates/headline.js
  - src/styles/headline.css
  - tutorial.html
  - dashboard.html
  - docs/templates/版型三-時間小標.md
  - src/styles/timeline.css
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/csv-loader.js
  - src/dashboard.js
  - src/templates/registry.js
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - src/styles/tutorial.css
  - src/templates/template3.js
  - docs/templates/版型二-標題時間軸.md
  - index.html
  - missions/index.json
  - spreadsheets.json
  - src/styles/tutorial-popup.css
-->