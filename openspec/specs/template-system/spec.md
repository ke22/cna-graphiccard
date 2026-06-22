# template-system Specification

## Purpose

TBD - created by archiving change 'add-headline-template'. Update Purpose after archive.

## Requirements

### Requirement: Template module interface
Each card template SHALL be a module exporting a default object with the shape `{ id: string, columns: object, buildNodes(records, ctx): Array<node>, renderNode(node): HTMLElement }`. `buildNodes` maps parsed CSV records into the template's node model; `renderNode` returns the DOM element for one node's inner structure. Templates SHALL NOT render the card header, year badge, or footer themselves — those belong to the shared card frame.

#### Scenario: Template exposes the required interface
- **WHEN** any registered template module is loaded
- **THEN** its default export has a string `id`, a `columns` object, a `buildNodes` function, and a `renderNode` function

#### Scenario: renderNode returns one node element
- **WHEN** `template.renderNode(node)` is called with a valid node object
- **THEN** it returns a single `HTMLElement` representing that node's inner content, without a header, badge, or footer


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
### Requirement: Template registry and selection
The system SHALL provide `getTemplate(id)` that returns the template module for a given id. Template selection precedence SHALL be: URL `?template=` parameter, then the mission's `template` field in `missions/index.json`, then the default `timeline`. An unknown template id SHALL fall back to `timeline` and emit a `console.warn`, without interrupting rendering.

#### Scenario: Default template when unspecified
- **WHEN** a mission's `missions/index.json` entry has no `template` field and no `?template=` is present
- **THEN** `getTemplate` resolves to the `timeline` template

#### Scenario: Manifest selects template
- **GIVEN** a mission entry with `"template": "headline"`
- **WHEN** the mission loads with no `?template=` override
- **THEN** the `headline` template is used to build and render nodes

#### Scenario: URL overrides manifest
- **GIVEN** a mission entry with `"template": "timeline"`
- **WHEN** the page is opened with `?template=headline`
- **THEN** the `headline` template is used

#### Scenario: Unknown id falls back
- **WHEN** the page is opened with `?template=bogus`
- **THEN** the `timeline` template is used and a warning is logged to the console


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
### Requirement: Shared card frame across templates
The card frame — header (title + CNA logo), year badge insertion on year change, footer (source / updated), smart pagination, split/single output modes, html2canvas export, and preview scaling — SHALL be shared by all templates and SHALL behave identically regardless of which template is selected. The card SHALL remain 1200×1200 in split mode.

#### Scenario: Frame behavior is template-independent
- **WHEN** the same data is rendered under any template in split mode
- **THEN** the header, year badge placement, footer, pagination, and export behavior follow the existing timeline-card rules and each split card is 1200×1200

#### Scenario: Year badge inserted on year change
- **GIVEN** nodes whose `year` changes from one value to another
- **WHEN** rendered under any template
- **THEN** a year badge is inserted before the first node of each new year

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