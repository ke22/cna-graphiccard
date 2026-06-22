## Summary

Restructure the `template3`（版型三·時間小標）node so the date, timeline dot, and clock sit on one horizontal row with a fixed-width date column, and render each date only on its first occurrence.

## Motivation

The current `template3` rendering has three defects:

1. The date is wrapped in an unstyled `.node-wrapper` `<div>` that stacks the date as a plain block *above* the node, despite the code comment claiming it positions the date to the left. The intended left-of-dot layout was never realized.
2. The date can render twice — `.node-date-part` shows the date, and for rows without a clock time `.node-time-fallback` shows the same date again.
3. The `template3-datetime-timeline` spec already requires "Same-date sharing" (consecutive same-date nodes omit the date), and `buildNodes` already computes a `showDate` flag, but `renderNode` ignores it, so repeated dates print on every row. This is spec-vs-code drift.

A single-row header (date · dot · clock) with a fixed-width date column reads as a proper timeline — all dots align on one vertical line — and fixes all three defects at once.

## Proposed Solution

Rebuild `renderNode` in 版型三 so each node is one horizontal header row followed by the stacked subhead and content:

- Header row: `.node-date-part`（fixed-width column, right-aligned toward the dot）then the timeline dot then `.node-clock-row`（clock + optional suffix）, baseline-aligned.
- The date column keeps a fixed width via a CSS custom property so dots align vertically across all rows even when the date text is blank.
- Honor the existing `showDate` flag: render the date text only on the first node of each date; on repeats keep the column width but leave the text blank.
- Remove the duplicate date path so a date never appears in both the date column and the fallback time line.

## Alternatives Considered

- Keep the date stacked above the node and only restyle sizes/spacing — rejected; does not deliver the timeline look the user asked for and leaves dots misaligned.
- Center-align the date/dot/clock row instead of baseline — rejected; baseline reads cleaner with the 28px date vs 36px clock size mix.

## Impact

- Affected specs: `template3-datetime-timeline`（modified — layout and same-date sharing rendering）
- Affected code:
  - Modified: src/templates/template3.js
  - Modified: src/styles/template3.css
  - Modified: src/renderer.js (additive only — tag the timeline container with the active template id so `template3.css` can reposition the shared timeline line/dots for the left-side date column without affecting 版型一/二)
