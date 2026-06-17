# smart-pagination Specification

## Purpose

TBD - created by archiving change 'timeline-card-generator'. Update Purpose after archive.

## Requirements

### Requirement: Runtime DOM height measurement
The paginator SHALL measure each timeline node's rendered height using `getBoundingClientRect().height` after the node is rendered in a hidden off-screen container (positioned with `visibility: hidden; position: absolute; top: -9999px`). Measurement SHALL occur after all web fonts are loaded (`document.fonts.ready`).

#### Scenario: Heights measured after font load
- **WHEN** `paginate(nodes)` is called
- **THEN** the function awaits `document.fonts.ready` before measuring any node height, ensuring font-dependent line heights are accurate

---
### Requirement: Node integrity during pagination
A timeline node SHALL NOT be split across two cards. If adding the next node would cause the accumulated content height to exceed `maxHeight` (default: 888px), the entire node SHALL be placed at the top of the next card.

The available content height per card is calculated as:
`maxHeight = cardHeight(1200) - headerHeight(232) - paddingTop(40) - paddingBottom(40) = 888px`

#### Scenario: Node that fits stays on current card
- **GIVEN** accumulated height is 500px and the next node height is 200px
- **WHEN** `500 + 200 <= 888`
- **THEN** the node is appended to the current card's node list

#### Scenario: Node that overflows moves to next card
- **GIVEN** accumulated height is 700px and the next node height is 250px
- **WHEN** `700 + 250 = 950 > 888`
- **THEN** the current card is finalized at 700px content height, and the node starts a new card

##### Example: pagination boundary
| Accumulated (px) | Next node (px) | Sum | Action |
|---|---|---|---|
| 700 | 150 | 850 | stays (≤ 888) |
| 700 | 200 | 900 | moves to next card (> 888) |
| 0 | 950 | 950 | forced onto card (node > maxHeight) |

---
### Requirement: Oversized node fallback
If a single node's height exceeds `maxHeight` (888px), the system SHALL place the node on its own card without infinite recursion. The system SHALL log a console warning: `[paginator] Node at index {i} height {h}px exceeds maxHeight {max}px — placed alone.`

#### Scenario: Single oversized node placed alone
- **GIVEN** a node with measured height of 950px and maxHeight of 888px
- **WHEN** the paginator processes this node
- **THEN** the node occupies a card by itself, and a console warning is logged

---
### Requirement: Paginator function contract
The system SHALL export an async function `paginate(nodes, maxHeight = 888)` that returns a Promise resolving to `Array<Array<{date: string, content: string}>>` — an array of cards, each card being an array of node objects.

#### Scenario: 22 nodes produce multiple cards
- **GIVEN** the 22 美伊戰爭大事記 nodes with mixed content lengths
- **WHEN** `paginate(nodes, 888)` is called
- **THEN** the result is an array of 2–4 sub-arrays, each sub-array containing between 1 and 22 nodes, with the total node count across all cards equal to 22
