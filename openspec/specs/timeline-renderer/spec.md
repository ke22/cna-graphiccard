# timeline-renderer Specification

## Purpose

TBD - created by archiving change 'timeline-card-generator'. Update Purpose after archive.

## Requirements

### Requirement: Card visual structure
Each rendered card SHALL be a fixed 1200px wide container. The card SHALL consist of:
1. A header section (height: 232px, background: `#004E98`) containing the CNA brand logo area and mission title
2. A content section (background: `#F7F7F7`) containing the timeline elements
3. A left-side vertical connector line (color: `#B9BBC2`, width: 4px) running from the first to the last node

#### Scenario: Card renders with correct dimensions
- **WHEN** any card is rendered in the DOM
- **THEN** the card element has `width: 1200px` and the header child has `height: 232px` with background color `#004E98`

---
### Requirement: Timeline node visual structure
Each timeline node SHALL render as a group containing:
- A circular dot indicator (diameter: 30px, color: `#004E98`) positioned on the vertical connector line
- A date label (color: `#1F2933`, font-weight: bold) to the right of the dot
- A content text block (color: `#12141A`) below the date label, rendering the CSV cell text verbatim. The raw text (including all newlines) SHALL be set as the element's `textContent`, with line breaks preserved visually via CSS `white-space: pre-wrap`. No paragraph-splitting into `<p>`/`<br>` elements is performed.

#### Scenario: Node renders all visual components
- **WHEN** a node `{ date: "3月8日", content: "伊朗宣布…" }` is rendered
- **THEN** the DOM contains a date element with text "3月8日", a content element with the content text, and a circle element with `background: #004E98`

#### Scenario: Multi-paragraph content renders verbatim with preserved line breaks
- **WHEN** a node's content contains `\n\n` (double newline)
- **THEN** the rendered `.node-content` `textContent` equals the raw CSV cell exactly (including the `\n\n`), and the blank line is shown visually via `white-space: pre-wrap`

---
### Requirement: CSS design token system
The renderer SHALL define all visual values as CSS custom properties on `:root`:
- `--color-header: #004E98`
- `--color-bg: #F7F7F7`
- `--color-node: #004E98`
- `--color-line: #B9BBC2`
- `--color-text-year: #1F2933`
- `--color-text-content: #12141A`
- `--card-width: 1200px`
- `--header-height: 232px`

#### Scenario: Design tokens defined
- **WHEN** the page is loaded
- **THEN** `getComputedStyle(document.documentElement).getPropertyValue('--color-header').trim()` returns `#004E98`

---
### Requirement: Scrollable preview layout
In preview mode (default), all cards SHALL be rendered vertically stacked with a 40px gap between cards, centered on a dark background (`#1a1a2e`), allowing the user to scroll through all cards.

#### Scenario: Preview shows all cards stacked
- **WHEN** the page loads with 22 nodes producing 3 cards
- **THEN** 3 `.card` elements appear in the DOM, vertically stacked with visible spacing between them
