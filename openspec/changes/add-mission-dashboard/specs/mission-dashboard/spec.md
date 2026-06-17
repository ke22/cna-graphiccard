## ADDED Requirements

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

### Requirement: Open selected tab in the timeline template

The dashboard SHALL open the selected tab in the existing template by navigating to `index.html` with a `sheet` query parameter set to the tab's gviz CSV export URL and a `title` parameter set to the tab's name, both URL-encoded. The dashboard SHALL NOT modify the template's data-loading, pagination, rendering, or export logic.

#### Scenario: Opening a selected tab

- **WHEN** a tab is selected and the editor triggers open
- **THEN** the dashboard SHALL navigate to `index.html?sheet=<encoded gviz CSV URL for that gid>&title=<encoded tab title>`

#### Scenario: Open attempted with no tab selected

- **WHEN** no tab is selected and the editor triggers open
- **THEN** the dashboard SHALL NOT navigate and SHALL keep the open action unavailable or show a prompt

##### Example: Assembled template URL

- **GIVEN** spreadsheet ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` and selected tab title `美伊戰爭大事記` with `sheetId` `0`
- **WHEN** the editor opens the tab
- **THEN** the target URL SHALL be `index.html?sheet=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8%2Fgviz%2Ftq%3Ftqx%3Dout%3Acsv%26gid%3D0&title=%E7%BE%8E%E4%BC%8A%E6%88%B0%E7%88%AD%E5%A4%A7%E4%BA%8B%E8%A8%98`

### Requirement: Switch spreadsheet tabs from the timeline template

When the template is opened with a `sheet` query parameter that contains a Google spreadsheet ID and gid, the template SHALL show a toolbar dropdown listing the same spreadsheet tabs. Changing the dropdown SHALL navigate directly to the selected tab's `index.html?sheet=<encoded gviz CSV URL>&title=<encoded tab title>` URL.

#### Scenario: Template opened from dashboard

- **WHEN** the template loads with a `sheet` query parameter containing spreadsheet ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` and `gid=0`
- **THEN** the toolbar SHALL show a tab dropdown
- **AND** the dropdown SHALL select the current gid

#### Scenario: Switching to another tab

- **WHEN** the editor selects another tab in the template toolbar dropdown
- **THEN** the template SHALL navigate to the selected tab's encoded gviz CSV URL and title

##### Example: Switch from gid 0 to gid 123456

- **GIVEN** the template is displaying spreadsheet ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` with current `gid=0`
- **AND** the tab dropdown contains title `第二張圖卡` with `sheetId` `123456`
- **WHEN** the editor selects `第二張圖卡`
- **THEN** the target URL SHALL be `index.html?sheet=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8%2Fgviz%2Ftq%3Ftqx%3Dout%3Acsv%26gid%3D123456&title=%E7%AC%AC%E4%BA%8C%E5%BC%B5%E5%9C%96%E5%8D%A1`

### Requirement: Fit timeline preview to the viewport

The template SHALL scale the on-screen preview to use the available viewport width and height while preserving the 1200px card export dimensions. The preview scaling SHALL NOT change the DOM card dimensions used for PNG export.

#### Scenario: Preview on a smaller viewport

- **WHEN** the viewport is smaller than the 1200px card dimensions
- **THEN** the preview SHALL scale down so the card fits within the visible viewport area below the toolbar

#### Scenario: Exporting scaled preview

- **WHEN** the editor exports cards while the preview is scaled
- **THEN** the export SHALL temporarily remove preview scaling and render the original 1200px card dimensions
