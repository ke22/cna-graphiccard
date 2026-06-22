## 1. Restructure renderNode to a single header row

Implements requirement **Single-row datetime header layout** and **Same-date sharing**.

- [x] 1.1 In src/templates/template3.js `renderNode`, remove the `.node-wrapper` + date-above-node structure. Build the `.node--template3` element directly, and make its header row contain, in order: the date column element, the timeline dot (`createDot()`), then the clock row. Keep `小標`(`.node-subhead`) and `內文`(`.node-content`) as block lines below the header row. (requirement: Single-row datetime header layout)
- [x] 1.2 Honor the existing `showDate` flag (requirement: Same-date sharing): set the date column's text to `node.dateText || node.rawTime || ''` only when `node.showDate` is true; otherwise leave it empty. The element SHALL still be appended (empty) so the fixed-width column reserves its space.
- [x] 1.3 Remove the duplicate-date path: when there is no `clockText`, do not render a fallback time line that repeats the date already shown in the date column. Render only `timeSuffix`/clock content after the dot.

## 2. Style the header row for alignment

- [x] 2.0 In src/renderer.js, additively tag the timeline container with the active template id (e.g. add class `timeline--<template.id>` in `renderCard`) so template3 CSS can scope the shared timeline line/dot position. Must not change 版型一/二 rendering.
- [x] 2.1 In src/styles/template3.css, lay out the header row as a baseline-aligned horizontal row (date column, dot, clock row on one line). Introduce a `--date-col-width` CSS custom property and apply it as a fixed width to the date column element so dots align vertically across rows; right-align the date text toward the dot. Reposition the shared `.timeline-line` and `.node-dot` for `.timeline--template3` so the connecting line passes through the dots that now sit after the date column.
- [x] 2.2 Adjust `.node-subhead` / `.node-content` indentation so they align under the clock (after the date column + dot), consistent with the new header row.

## 3. Verify

- [x] 3.1 Serve the repo (`python3 -m http.server`) and open the local mission `index.html?mission=2024_南韓戒嚴大事記` (renders with `template3`). Confirm: date+dot+clock render on one row; dots align on one vertical line; for consecutive same-date rows the date appears only on the first and the dot stays aligned; rows without a parseable clock show no duplicated date. Confirm no uncaught console errors.
