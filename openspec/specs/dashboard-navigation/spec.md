# dashboard-navigation Specification

## Purpose

TBD - created by archiving change 'optimize-dashboard-navigation'. Update Purpose after archive.

## Requirements

### Requirement: Dashboard branded navigation

`dashboard.html` SHALL render a semantic header and primary navigation that preserves `id="toolbar"` and the `.toolbar` class. The header SHALL display a CNA GRAPHICS / 圖卡工作台 brand and SHALL provide links to `dashboard.html`, `index.html`, and `tutorial.html` labeled Dashboard, 圖卡預覽, and 使用教學 respectively.

#### Scenario: Dashboard displays all navigation destinations

- **WHEN** a user opens `dashboard.html`
- **THEN** the header displays the product brand and all three navigation links
- **AND** each link points to its specified local HTML destination

---
### Requirement: Current page and keyboard navigation state

The Dashboard link SHALL have `aria-current="page"` and a visually distinct current-page style. The brand and every primary navigation link SHALL be keyboard focusable and SHALL display a visible `:focus-visible` indicator with sufficient contrast against the navigation background.

#### Scenario: Keyboard user identifies the current page and focus

- **WHEN** a user navigates through the dashboard header using the Tab key
- **THEN** focus reaches the brand and each of the three navigation links in DOM order
- **AND** the focused link has a visible focus indicator while Dashboard remains identifiable as the current page

---
### Requirement: Responsive dashboard navigation

The dashboard header SHALL remain a single-row fixed masthead without overlapping its brand, navigation, or main content at viewport widths of 1400px, 640px, and 320px. Each navigation target SHALL provide a minimum 44px touch height. At narrow widths the navigation region SHALL remain horizontally scrollable if its contents exceed the available width, and SHALL NOT hide any destination.

#### Scenario: Navigation remains usable at 320px

- **WHEN** `dashboard.html` is displayed at a 320px viewport width
- **THEN** the brand and primary navigation do not overlap or wrap into multiple rows
- **AND** all three destinations remain reachable through the navigation region

---
### Requirement: Dashboard workflow remains unchanged

The navigation optimization SHALL NOT rename or remove the existing dashboard form controls and SHALL NOT modify the Sheets connection, tab selection, template selection, or open-page behavior implemented by `src/dashboard.js`.

#### Scenario: Existing dashboard controls remain available

- **WHEN** the optimized dashboard navigation is rendered
- **THEN** `sheet-select`, `sheet-url`, `btn-connect`, `tab-select`, `template-select`, `btn-open`, and `dash-status` remain present
- **AND** no navigation JavaScript is required for the existing dashboard workflow
