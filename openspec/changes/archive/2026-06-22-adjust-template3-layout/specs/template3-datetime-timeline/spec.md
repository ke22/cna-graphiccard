## ADDED Requirements

### Requirement: Single-row datetime header layout

Each `template3` node SHALL render its date, timeline dot, and clock on one horizontal header row, followed by the `小標` and `內文` stacked below. The date SHALL occupy a fixed-width column rendered before the dot; the clock (and optional suffix) SHALL render after the dot. The fixed-width date column SHALL keep its width on every node — including nodes whose date text is blank — so that all dots align on a single vertical line. The date text, dot, and clock SHALL be baseline-aligned. A date SHALL NOT be rendered in more than one place within a node; the unparseable-timestamp fallback SHALL NOT duplicate a date already shown in the date column.

#### Scenario: Date, dot, and clock share one row

- **WHEN** a node has `dateText=12月3日`, `clockText=23:45`, and `timeSuffix=通過`
- **THEN** the rendered `.node--template3` SHALL place `12月3日` in the fixed-width date column, the timeline dot after it, and `23:45 通過` after the dot, all on one horizontal row
- **AND** the `小標` and `內文` SHALL render on lines below that row

#### Scenario: Dots align across rows of differing date widths

- **WHEN** consecutive nodes have date column text of differing lengths or blank text
- **THEN** every node's dot SHALL sit at the same horizontal position because the date column width is fixed

#### Scenario: No duplicate date for unparseable timestamp

- **WHEN** a node's `時間` has no `HH:mm` clock and its date is shown in the date column
- **THEN** the node SHALL NOT also render that date in a fallback time line

## MODIFIED Requirements

### Requirement: Same-date sharing

If multiple consecutive nodes in `template3` share the same date (both the same `year` and same `dateText` or `rawTime`), subsequent nodes on that date SHALL NOT render the date text. The `showDate` flag computed in `buildNodes` SHALL drive this behavior — `renderNode` SHALL render the date text only when `showDate` is true. When the date text is suppressed, the fixed-width date column SHALL keep its width (rendering blank) so the dot stays aligned, and only the clock time or time suffix SHALL be rendered after the dot.

#### Scenario: Consecutive nodes on the same date

- **WHEN** consecutive nodes have the same year and same dateText
- **THEN** only the first node SHALL display the date text
- **AND** subsequent nodes SHALL leave the date column blank while keeping its width, and render only their clock time (if present)

#### Scenario: Date reappears when it changes

- **WHEN** three consecutive nodes have dates `12月3日`, `12月3日`, `12月4日`
- **THEN** the date column SHALL render `12月3日`, blank, then `12月4日`
- **AND** all three dots SHALL remain vertically aligned
