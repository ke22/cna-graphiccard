# mission-dashboard Specification

## Purpose

TBD - created by archiving change 'add-mission-dashboard'. Update Purpose after archive.

## Requirements

### Requirement: Connect spreadsheet and persist its URL

The dashboard SHALL accept a Google Spreadsheet URL, parse the spreadsheet ID from it, and persist the last successfully connected URL in `localStorage` under the key `cna-dashboard-sheet-url`. On load, the dashboard SHALL prefill the input from `localStorage` when a stored URL exists; otherwise it SHALL prefill the configured default spreadsheet URL. The dashboard SHALL automatically attempt to list tabs for the prefilled URL.

#### Scenario: First visit with no stored URL

- **WHEN** the dashboard loads and `localStorage` has no `cna-dashboard-sheet-url`
- **THEN** the URL input SHALL contain `https://docs.google.com/spreadsheets/d/1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8/edit?gid=0#gid=0`
- **AND** the dashboard SHALL attempt to list tabs for that spreadsheet

#### Scenario: Connecting a valid spreadsheet URL

- **WHEN** the editor enters a URL matching `/spreadsheets/d/<ID>/` and triggers connect
- **THEN** the dashboard SHALL extract `<ID>`, fetch its tabs, and on success store the URL in `localStorage`

#### Scenario: Unparseable URL

- **WHEN** the editor submits a URL with no `/spreadsheets/d/<ID>/` segment
- **THEN** the dashboard SHALL display an error message identifying an unrecognized spreadsheet URL and SHALL NOT call the Sheets API

##### Example: Spreadsheet ID extraction

| Input URL | Extracted ID |
| --------- | ------------ |
| https://docs.google.com/spreadsheets/d/1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8/edit#gid=0 | 1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8 |
| https://example.com/foo | (none — error shown) |


<!-- @trace
source: add-mission-dashboard
updated: 2026-06-22
code:
  - src/styles/tutorial-popup.css
  - tutorial.html
  - HANDOFF.md
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - LEARNING.md
  - missions/index.json
  - src/dashboard.js
  - src/styles/headline.css
  - src/styles/tutorial.css
  - src/templates/registry.js
  - src/renderer.js
  - src/styles/dashboard.css
  - src/templates/template3.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - index.html
  - src/templates/headline.js
  - src/sheets-api.js
  - src/styles/main.css
  - src/templates/timeline.js
  - docs/templates/版型三-時間小標.md
  - src/styles/template3.css
  - dashboard.html
  - docs/templates/版型二-標題時間軸.md
  - src/styles/timeline.css
  - probe.html
  - src/exporter.js
  - src/main.js
  - src/csv-loader.js
  - src/tutorial-popup.js
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/paginator.js
  - spreadsheets.json
  - src/tutorial.js
-->

---
### Requirement: List spreadsheet tabs via Sheets API

The dashboard SHALL list the connected spreadsheet's tabs by calling the Google Sheets API v4 `spreadsheets.get` endpoint with `fields=sheets.properties(title,sheetId)` and a public-read API key. Each returned tab SHALL appear as a dropdown option labeled with its `title`, in spreadsheet order, carrying its `sheetId` as the gid.

#### Scenario: Tabs returned successfully

- **WHEN** the Sheets API returns a non-empty `sheets[]` array
- **THEN** the dropdown SHALL contain one option per tab, each labeled with `properties.title` and bound to `properties.sheetId`

#### Scenario: API request fails or sheet is not public

- **WHEN** the Sheets API responds with a non-2xx status
- **THEN** the dashboard SHALL display an error message indicating the tabs cannot be read and that the spreadsheet must be shared publicly

#### Scenario: Spreadsheet has no listable tabs

- **WHEN** the Sheets API returns an empty `sheets[]` array
- **THEN** the dashboard SHALL display an error message stating no usable tabs exist


<!-- @trace
source: add-mission-dashboard
updated: 2026-06-22
code:
  - src/styles/tutorial-popup.css
  - tutorial.html
  - HANDOFF.md
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - LEARNING.md
  - missions/index.json
  - src/dashboard.js
  - src/styles/headline.css
  - src/styles/tutorial.css
  - src/templates/registry.js
  - src/renderer.js
  - src/styles/dashboard.css
  - src/templates/template3.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - index.html
  - src/templates/headline.js
  - src/sheets-api.js
  - src/styles/main.css
  - src/templates/timeline.js
  - docs/templates/版型三-時間小標.md
  - src/styles/template3.css
  - dashboard.html
  - docs/templates/版型二-標題時間軸.md
  - src/styles/timeline.css
  - probe.html
  - src/exporter.js
  - src/main.js
  - src/csv-loader.js
  - src/tutorial-popup.js
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/paginator.js
  - spreadsheets.json
  - src/tutorial.js
-->

---
### Requirement: Open selected tab in the selected template

The dashboard SHALL let the editor choose a template and open the selected tab in the existing template page by navigating to `index.html` with separate `spreadsheet` and `gid` query parameters, a `title` parameter set to the tab's name, and a `template` parameter set to the selected template. The template page SHALL construct the gviz CSV export URL client-side; it SHALL NOT place a nested Google URL in a query parameter because the production edge rejects that URL shape. The dashboard SHALL NOT modify the template's data-loading, pagination, rendering, or export logic.

#### Scenario: Opening a selected tab

- **WHEN** a tab is selected and the editor triggers open
- **THEN** the dashboard SHALL navigate to `index.html?spreadsheet=<spreadsheet ID>&gid=<sheet ID>&title=<encoded tab title>&template=<selected template>`

#### Scenario: Opening headline template

- **WHEN** a tab is selected, the editor selects `headline`, and the editor triggers open
- **THEN** the dashboard SHALL navigate to a URL containing `template=headline`
- **AND** the template page SHALL render using the headline template

#### Scenario: Open attempted with no tab selected

- **WHEN** no tab is selected and the editor triggers open
- **THEN** the dashboard SHALL NOT navigate and SHALL keep the open action unavailable or show a prompt

##### Example: Assembled template URL

- **GIVEN** spreadsheet ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` and selected tab title `美伊戰爭大事記` with `sheetId` `0`
- **WHEN** the editor opens the tab
- **THEN** the target URL SHALL be `index.html?spreadsheet=1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8&gid=0&title=%E7%BE%8E%E4%BC%8A%E6%88%B0%E7%88%AD%E5%A4%A7%E4%BA%8B%E8%A8%98&template=timeline`


<!-- @trace
source: add-mission-dashboard
updated: 2026-06-22
code:
  - src/styles/tutorial-popup.css
  - tutorial.html
  - HANDOFF.md
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - LEARNING.md
  - missions/index.json
  - src/dashboard.js
  - src/styles/headline.css
  - src/styles/tutorial.css
  - src/templates/registry.js
  - src/renderer.js
  - src/styles/dashboard.css
  - src/templates/template3.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - index.html
  - src/templates/headline.js
  - src/sheets-api.js
  - src/styles/main.css
  - src/templates/timeline.js
  - docs/templates/版型三-時間小標.md
  - src/styles/template3.css
  - dashboard.html
  - docs/templates/版型二-標題時間軸.md
  - src/styles/timeline.css
  - probe.html
  - src/exporter.js
  - src/main.js
  - src/csv-loader.js
  - src/tutorial-popup.js
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/paginator.js
  - spreadsheets.json
  - src/tutorial.js
-->

---
### Requirement: Switch spreadsheet tabs from the timeline template

When the template is opened with `spreadsheet` and `gid` query parameters, the template SHALL show a toolbar dropdown listing the same spreadsheet tabs. Changing the dropdown SHALL navigate directly to the selected tab's `index.html?spreadsheet=<spreadsheet ID>&gid=<sheet ID>&title=<encoded tab title>` URL while preserving the current `template` and `split` query parameters when present. For backward compatibility, the template MAY still read legacy `sheet=<encoded gviz CSV URL>` links, but it SHALL generate only the separate-parameter form.

#### Scenario: Template opened from dashboard

- **WHEN** the template loads with `spreadsheet=1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` and `gid=0`
- **THEN** the toolbar SHALL show a tab dropdown
- **AND** the dropdown SHALL select the current gid

#### Scenario: Switching to another tab

- **WHEN** the editor selects another tab in the template toolbar dropdown
- **THEN** the template SHALL navigate with the selected spreadsheet ID, gid, and encoded title
- **AND** the target URL SHALL preserve the current `template` query parameter when present

##### Example: Switch from gid 0 to gid 123456

- **GIVEN** the template is displaying spreadsheet ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` with current `gid=0`
- **AND** the template URL contains `template=headline`
- **AND** the tab dropdown contains title `第二張圖卡` with `sheetId` `123456`
- **WHEN** the editor selects `第二張圖卡`
- **THEN** the target URL SHALL be `index.html?spreadsheet=1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8&gid=123456&title=%E7%AC%AC%E4%BA%8C%E5%BC%B5%E5%9C%96%E5%8D%A1&template=headline`


<!-- @trace
source: add-mission-dashboard
updated: 2026-06-22
code:
  - src/styles/tutorial-popup.css
  - tutorial.html
  - HANDOFF.md
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - LEARNING.md
  - missions/index.json
  - src/dashboard.js
  - src/styles/headline.css
  - src/styles/tutorial.css
  - src/templates/registry.js
  - src/renderer.js
  - src/styles/dashboard.css
  - src/templates/template3.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - index.html
  - src/templates/headline.js
  - src/sheets-api.js
  - src/styles/main.css
  - src/templates/timeline.js
  - docs/templates/版型三-時間小標.md
  - src/styles/template3.css
  - dashboard.html
  - docs/templates/版型二-標題時間軸.md
  - src/styles/timeline.css
  - probe.html
  - src/exporter.js
  - src/main.js
  - src/csv-loader.js
  - src/tutorial-popup.js
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/paginator.js
  - spreadsheets.json
  - src/tutorial.js
-->

---
### Requirement: Switch template from the template toolbar

The template page SHALL show a toolbar template dropdown after loading a mission or spreadsheet/gid selection. The dropdown SHALL reflect the active template and changing it SHALL navigate to the same page state with the selected `template` query parameter while preserving the current `mission` or `spreadsheet`/`gid`, `title`, and `split` parameters.

#### Scenario: Template dropdown reflects active headline template

- **WHEN** the template page loads with `template=headline`
- **THEN** the toolbar template dropdown SHALL select `headline`

#### Scenario: Switching template in toolbar

- **GIVEN** the template page is displaying a spreadsheet/gid selection with `title=type_2` and `split=0`
- **WHEN** the editor selects `timeline` in the toolbar template dropdown
- **THEN** the page SHALL navigate to a URL preserving the same `spreadsheet`, `gid`, `title`, and `split=0`
- **AND** the URL SHALL contain `template=timeline`


<!-- @trace
source: add-mission-dashboard
updated: 2026-06-22
code:
  - src/styles/tutorial-popup.css
  - tutorial.html
  - HANDOFF.md
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - LEARNING.md
  - missions/index.json
  - src/dashboard.js
  - src/styles/headline.css
  - src/styles/tutorial.css
  - src/templates/registry.js
  - src/renderer.js
  - src/styles/dashboard.css
  - src/templates/template3.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - index.html
  - src/templates/headline.js
  - src/sheets-api.js
  - src/styles/main.css
  - src/templates/timeline.js
  - docs/templates/版型三-時間小標.md
  - src/styles/template3.css
  - dashboard.html
  - docs/templates/版型二-標題時間軸.md
  - src/styles/timeline.css
  - probe.html
  - src/exporter.js
  - src/main.js
  - src/csv-loader.js
  - src/tutorial-popup.js
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/paginator.js
  - spreadsheets.json
  - src/tutorial.js
-->

---
### Requirement: Fit timeline preview to the viewport

The template SHALL scale the on-screen preview to use the available viewport width and height while preserving the 1200px card export dimensions. The preview scaling SHALL NOT change the DOM card dimensions used for PNG export.

#### Scenario: Preview on a smaller viewport

- **WHEN** the viewport is smaller than the 1200px card dimensions
- **THEN** the preview SHALL scale down so the card fits within the visible viewport area below the toolbar

#### Scenario: Exporting scaled preview

- **WHEN** the editor exports cards while the preview is scaled
- **THEN** the export SHALL temporarily remove preview scaling and render the original 1200px card dimensions

<!-- @trace
source: add-mission-dashboard
updated: 2026-06-22
code:
  - src/styles/tutorial-popup.css
  - tutorial.html
  - HANDOFF.md
  - missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv
  - missions/2024_南韓戒嚴大事記/南韓戒嚴大事記.csv
  - LEARNING.md
  - missions/index.json
  - src/dashboard.js
  - src/styles/headline.css
  - src/styles/tutorial.css
  - src/templates/registry.js
  - src/renderer.js
  - src/styles/dashboard.css
  - src/templates/template3.js
  - .github/workflows/deploy.yml
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表1.csv
  - index.html
  - src/templates/headline.js
  - src/sheets-api.js
  - src/styles/main.css
  - src/templates/timeline.js
  - docs/templates/版型三-時間小標.md
  - src/styles/template3.css
  - dashboard.html
  - docs/templates/版型二-標題時間軸.md
  - src/styles/timeline.css
  - probe.html
  - src/exporter.js
  - src/main.js
  - src/csv-loader.js
  - src/tutorial-popup.js
  - missions/2026_柯文哲案大事記/柯文哲案大事記 - 工作表2_cleaned.csv
  - src/paginator.js
  - spreadsheets.json
  - src/tutorial.js
-->
