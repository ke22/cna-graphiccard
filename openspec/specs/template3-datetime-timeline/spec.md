# template3-datetime-timeline Specification

## Purpose

TBD - created by archiving change 'add-template3-datetime-timeline'. Update Purpose after archive.

## Requirements

### Requirement: Template3 data schema

The `template3` template SHALL accept the same header-based CSV columns as the headline template: `年代,標題,時間,小標,內文,資料來源,更新時間`. Per-row fields SHALL be `時間`, `小標`, and `內文`. `年代` SHALL fill down and mark a year badge when it changes. Rows whose `小標` and `內文` are both empty SHALL NOT produce nodes.

#### Scenario: Row maps to a template3 node

- **WHEN** a row has `時間=12月3日22 : 23`, `小標=總統尹錫悅透過電視談話宣布實施緊急戒嚴令`, and `內文=任命陸軍參謀總長朴安洙為戒嚴司令`
- **THEN** `buildNodes` SHALL produce a node containing the source text and split time parts for rendering


<!-- @trace
source: add-template3-datetime-timeline
updated: 2026-06-18
code:
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - docs/templates/版型三-時間小標.md
  - missions/.DS_Store
  - src/styles/template3.css
  - src/templates/registry.js
  - dashboard.html
  - src/templates/template3.js
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/index.json
  - index.html
-->

---
### Requirement: Date-time split rendering

The `template3` template SHALL parse `時間` values containing a date and clock time into `dateText`, `clockText`, and optional `timeSuffix`. It SHALL normalize spaces around the colon and display the clock in `HH:mm` form. If the value cannot be parsed, it SHALL render the original time text without failing.

#### Scenario: Standard timestamp

- **WHEN** `時間` is `12月3日22 : 23`
- **THEN** the rendered node SHALL show `12月3日` as the date and `22:23` as the clock

#### Scenario: Timestamp with suffix

- **WHEN** `時間` is `12月3日22 : 50 左右`
- **THEN** the rendered node SHALL show `12月3日` as the date, `22:50` as the clock, and `左右` as the suffix

#### Scenario: Unparseable timestamp

- **WHEN** `時間` does not contain an `HH:mm` clock
- **THEN** the rendered node SHALL show the original time text in a fallback time line


<!-- @trace
source: add-template3-datetime-timeline
updated: 2026-06-18
code:
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - docs/templates/版型三-時間小標.md
  - missions/.DS_Store
  - src/styles/template3.css
  - src/templates/registry.js
  - dashboard.html
  - src/templates/template3.js
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/index.json
  - index.html
-->

---
### Requirement: Same-date sharing

If multiple consecutive nodes in `template3` share the same date (both the same `year` and same `dateText` or `rawTime`), subsequent nodes on that date SHALL NOT render the date text (only their clock time or time suffix SHALL be rendered).

#### Scenario: Consecutive nodes on the same date

- **WHEN** consecutive nodes have the same year and same dateText
- **THEN** only the first node SHALL display the date text
- **AND** subsequent nodes SHALL omit the date text and only render their clock time (if present)


<!-- @trace
source: add-template3-datetime-timeline
updated: 2026-06-18
code:
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - docs/templates/版型三-時間小標.md
  - missions/.DS_Store
  - src/styles/template3.css
  - src/templates/registry.js
  - dashboard.html
  - src/templates/template3.js
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/index.json
  - index.html
-->

---
### Requirement: Template3 selector and sample mission

The template page and dashboard SHALL offer `版型三：時間小標`, using the `template3` query/manifest id. The local mission `2024_南韓戒嚴大事記` SHALL render with `template3` by default.

#### Scenario: Open sample mission

- **WHEN** the template page opens `index.html?mission=2024_南韓戒嚴大事記`
- **THEN** the active template SHALL be `template3`
- **AND** the rendered nodes SHALL use `.node--template3`

#### Scenario: Dashboard can open template3

- **WHEN** the dashboard template dropdown selects `template3` and opens a tab
- **THEN** the target URL SHALL contain `template=template3`

<!-- @trace
source: add-template3-datetime-timeline
updated: 2026-06-18
code:
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - docs/templates/版型三-時間小標.md
  - missions/.DS_Store
  - src/styles/template3.css
  - src/templates/registry.js
  - dashboard.html
  - src/templates/template3.js
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/index.json
  - index.html
-->