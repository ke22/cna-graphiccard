# accessible-card-typography Specification

## Purpose

TBD - created by archiving change 'accessible-card-typography'. Update Purpose after archive.

## Requirements

### Requirement: Balanced elder-friendly card type scale

All three card templates SHALL use the following default typography values. The system SHALL NOT require a user toggle or URL parameter to enable them.

#### Scenario: Computed styles match the accessible scale

- **WHEN** timeline, headline, and template3 cards are rendered
- **THEN** their computed font sizes and line heights match the table below

##### Example: Required typography values

| Element | Font size | Line height |
| --- | ---: | ---: |
| Mission title | 52px | 1.2 |
| Year badge | 36px | 1.15 |
| Timeline date | 32px | 1.35 |
| Timeline body | 32px | 1.6 |
| Headline time | 32px | 1.35 |
| Headline subhead | 34px | 1.45 |
| Headline body | 32px | 1.6 |
| Template3 date | 32px | 1.25 |
| Template3 clock | 34px | 1.2 |
| Template3 clock suffix | 30px | 1.2 |
| Template3 subhead | 34px | 1.4 |
| Template3 body | 32px | 1.6 |
| Footer metadata | 28px | 1.5 |

---
### Requirement: Enlarged typography preserves card output behavior

Split-mode cards SHALL remain 1200×1200px and SHALL NOT clip or overflow their rendered content. The paginator SHALL continue using rendered DOM height and SHALL create additional cards when enlarged content exceeds the available height. Single-image mode SHALL remain 1200px wide with content-driven height. Fixed-card JPG export SHALL remain 2× scale, `image/jpeg`, 2400×2400px, and use the `card-{n}.jpg` filename pattern.

#### Scenario: Split mode adds pages instead of clipping text

- **WHEN** enlarged typography causes the current content to exceed one fixed card
- **THEN** the paginator creates additional 1200×1200px cards
- **AND** every card satisfies `scrollHeight <= clientHeight + 1`

#### Scenario: Single-image mode expands vertically

- **WHEN** any sample mission is rendered with `split=0`
- **THEN** the card width remains 1200px and its height expands to fit all content without horizontal overflow

#### Scenario: JPG export contract is unchanged

- **WHEN** a fixed card is exported
- **THEN** the capture uses scale 2 and produces a 2400×2400px `image/jpeg` download named `card-{n}.jpg`

---
### Requirement: Footer reserve matches enlarged metadata

Footer metadata SHALL use 28px text with 1.5 line height. A one-line footer SHALL retain an 84px content reserve, and a two-line footer SHALL use a 132px content reserve so footer text does not overlap card content.

#### Scenario: Two metadata rows reserve sufficient height

- **GIVEN** both source and updated metadata are present
- **WHEN** the card content height is calculated
- **THEN** the available body height excludes a 132px footer reserve
- **AND** footer text does not overlap or clip card content
