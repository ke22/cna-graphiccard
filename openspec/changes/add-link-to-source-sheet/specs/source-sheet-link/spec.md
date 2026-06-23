## ADDED Requirements

### Requirement: Source sheet link in toolbar

The `index.html` toolbar SHALL provide a control that opens the source Google Sheet in a new browser tab. The control SHALL be rendered as an `<a>` element with `target="_blank"` and `rel="noopener"`, placed in the right-hand toolbar group alongside the export and tutorial controls, and styled consistently with the existing tutorial link.

#### Scenario: Opening the source sheet from a spreadsheet-backed preview

- **WHEN** the page is loaded with a spreadsheet and tab (e.g. `index.html?spreadsheet=<id>&gid=<gid>`) and `setupMissionSwitch` resolves a spreadsheet id
- **THEN** the source sheet link SHALL be visible and its `href` SHALL point to the Google Sheets edit URL for the currently previewed tab

#### Scenario: Link hidden when no source spreadsheet exists

- **WHEN** the page is loaded in local-CSV mode (`index.html?mission=<name>` with no `spreadsheet`/`gid`) so `setupMissionSwitch` returns without a spreadsheet id
- **THEN** the source sheet link SHALL remain hidden

### Requirement: Source sheet edit URL construction

The system SHALL provide a pure function `buildSheetEditUrl(spreadsheetId, sheetId)` in `src/sheets-api.js` that returns the Google Sheets edit URL targeting a specific tab. The returned URL SHALL include the `gid` of the previewed tab both as a query parameter and as a URL fragment so the sheet opens scrolled to that tab.

#### Scenario: Building an edit URL for a specific tab

- **WHEN** `buildSheetEditUrl` is called with a spreadsheet id and a sheet gid
- **THEN** it SHALL return a URL of the form `https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit?gid=<gid>#gid=<gid>`

##### Example: concrete edit URL

- **GIVEN** spreadsheetId = `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8`, sheetId = `2027148002`
- **WHEN** `buildSheetEditUrl(spreadsheetId, sheetId)` is called
- **THEN** it returns `https://docs.google.com/spreadsheets/d/1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8/edit?gid=2027148002#gid=2027148002`
