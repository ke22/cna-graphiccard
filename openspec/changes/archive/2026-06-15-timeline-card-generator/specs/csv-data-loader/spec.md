## ADDED Requirements

### Requirement: CSV file loading from mission directory
The system SHALL read a CSV file from `missions/<mission-name>/` directory when a mission name is provided via URL query parameter (`?mission=<name>`). The CSV file SHALL be located by globbing for the first `.csv` file in that directory. If no CSV file is found, the system SHALL display an error message: "無法載入資料：{mission} 不存在".

#### Scenario: Successful CSV load
- **WHEN** the user opens `index.html?mission=2026_美伊戰爭大事記`
- **THEN** the system fetches `missions/2026_美伊戰爭大事記/美伊戰爭大事記 - 工作表1.csv` and parses it into a node array

#### Scenario: Mission not found
- **WHEN** the user opens `index.html?mission=nonexistent`
- **THEN** the system displays the error message "無法載入資料：nonexistent 不存在" and renders no cards

### Requirement: CSV parsing into typed node array
The system SHALL parse the CSV using RFC 4180 rules (supporting quoted fields containing commas, newlines, and double-quote escaping). The first row SHALL be treated as a header row and skipped. Each subsequent row SHALL produce one timeline node object.

#### Scenario: Standard single-paragraph node
- **WHEN** a CSV row contains `3月8日,伊朗宣布由已故最高領袖之子接任最高領袖。`
- **THEN** the parser produces `{ date: "3月8日", content: "伊朗宣布由已故最高領袖之子接任最高領袖。" }`

#### Scenario: Multi-paragraph node with embedded newlines
- **WHEN** a CSV row contains a quoted field with embedded newlines (e.g., the 2月28日 entry with two paragraphs)
- **THEN** the parser preserves the embedded newlines in the `content` field

##### Example: multi-paragraph parsing
- **GIVEN** CSV row: `2月28日,"段落一\n\n段落二"`
- **WHEN** parsed
- **THEN** result is `{ date: "2月28日", content: "段落一\n\n段落二" }`

#### Scenario: Field containing comma inside quotes
- **GIVEN** a CSV field value wrapped in double-quotes containing a literal comma
- **WHEN** parsed
- **THEN** the comma is treated as part of the field value, not a column separator

### Requirement: Node array output contract
The CSV loader SHALL export an async function `loadNodes(missionName)` that returns a Promise resolving to an array of node objects `Array<{ date: string, content: string }>`. The array order SHALL match the CSV row order (top to bottom, excluding header).

#### Scenario: 22-node mission produces 22 nodes
- **GIVEN** the 美伊戰爭大事記 CSV with 22 data rows
- **WHEN** `loadNodes("2026_美伊戰爭大事記")` is called
- **THEN** the resolved array contains exactly 22 objects, each with non-empty `date` and `content` fields
