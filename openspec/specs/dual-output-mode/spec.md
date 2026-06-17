# dual-output-mode Specification

## Purpose

TBD - created by archiving change 'timeline-card-generator'. Update Purpose after archive.

## Requirements

### Requirement: Preview mode as default
The page SHALL default to preview mode on load. In preview mode, all `.card` elements SHALL be visible in a vertically scrollable layout. A toolbar at the top of the page SHALL display the mission name and a button labeled "匯出所有卡片".

#### Scenario: Page loads in preview mode
- **WHEN** the user opens `index.html?mission=2026_美伊戰爭大事記`
- **THEN** a toolbar is visible with the text "2026_美伊戰爭大事記" and a button "匯出所有卡片", and all cards are visible and scrollable

---
### Requirement: PNG export for each card
When the user clicks "匯出所有卡片", the system SHALL use `html2canvas` to capture each `.card` element sequentially and trigger a browser download for each. The exported PNG SHALL be named `card-{n}.png` where `{n}` is the 1-based card index.

#### Scenario: Export produces one PNG per card
- **WHEN** the user clicks "匯出所有卡片" with 3 cards rendered
- **THEN** the browser triggers 3 sequential file downloads named `card-1.png`, `card-2.png`, `card-3.png`

#### Scenario: Export uses 2x scale for high DPI
- **WHEN** `html2canvas` is called for each card
- **THEN** the call includes `{ scale: 2 }` option, resulting in a 2400×2400px PNG output

---
### Requirement: Export error handling
If `html2canvas` is not available (e.g., script failed to load), the "匯出所有卡片" button SHALL display the tooltip "請在 Chrome/Firefox 中開啟" and SHALL be disabled (non-clickable). The system SHALL NOT throw an uncaught error.

#### Scenario: html2canvas unavailable
- **WHEN** `window.html2canvas` is undefined at the time the user clicks the button
- **THEN** the button is visually disabled and displays the message "請在 Chrome/Firefox 中開啟"; no download is triggered

---
### Requirement: Export progress feedback
During export, the button text SHALL change to "匯出中… ({n}/{total})" updating for each card as it completes. After all exports finish, the button text SHALL return to "匯出所有卡片".

#### Scenario: Button text updates during export
- **GIVEN** 3 cards are being exported
- **WHEN** the second card finishes exporting
- **THEN** the button text shows "匯出中… (2/3)"
- **THEN** after the third card finishes, the button text returns to "匯出所有卡片"
