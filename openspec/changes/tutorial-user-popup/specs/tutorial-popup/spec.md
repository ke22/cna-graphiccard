## ADDED Requirements

### Requirement: Popup triggers on button/link activation

The system SHALL open a modal overlay when the user activates the "教學" trigger in index.html toolbar or the "使用教學" trigger in dashboard.html navigation. The overlay SHALL be rendered as a native `<dialog>` element. The current page SHALL remain visible and interactive behind the backdrop.

#### Scenario: Trigger from index.html toolbar

- **WHEN** user clicks the "教學" link in the index.html toolbar
- **THEN** the tutorial `<dialog>` opens on top of the current page without navigating away

#### Scenario: Trigger from dashboard.html nav

- **WHEN** user clicks the "使用教學" link in the dashboard.html navigation bar
- **THEN** the tutorial `<dialog>` opens on top of the current page without navigating away

### Requirement: Popup closes on standard dismiss gestures

The popup SHALL close when the user presses the Escape key, clicks the close button inside the dialog, or clicks the backdrop area outside the dialog content.

#### Scenario: Escape key dismisses popup

- **WHEN** the tutorial popup is open AND user presses Escape
- **THEN** the popup closes and focus returns to the triggering element

#### Scenario: Close button dismisses popup

- **WHEN** the tutorial popup is open AND user clicks the close (×) button
- **THEN** the popup closes

#### Scenario: Backdrop click dismisses popup

- **WHEN** the tutorial popup is open AND user clicks outside the dialog content area
- **THEN** the popup closes

### Requirement: User tutorial presents three-step operation guide

The popup SHALL display a user-facing tutorial with exactly three numbered steps describing how to produce a timeline card. The steps SHALL contain no terminal commands, URL parameters, or CSV column specifications.

#### Scenario: Three steps are visible

- **WHEN** the tutorial popup opens
- **THEN** the user sees Step 1 (開啟 Dashboard, 貼入試算表網址, 點「連結」), Step 2 (選擇分頁與版型, 點「開啟」), and Step 3 (切換版型/模式後點「匯出」), in that order

### Requirement: Developer tutorial remains accessible via link

The popup SHALL include a link to `tutorial.html` (the developer reference) in the footer area of the dialog. Clicking the link SHALL navigate to `tutorial.html` in the current tab.

#### Scenario: Developer link opens full tutorial

- **WHEN** user clicks the "開發者說明" link inside the popup
- **THEN** the browser navigates to tutorial.html

### Requirement: Popup JS is loaded by both pages via a shared module

The tutorial popup behavior SHALL be provided by `src/tutorial-popup.js`. Both `index.html` and `dashboard.html` SHALL load this module. The module SHALL expose an `initTutorialPopup()` function that wires the trigger elements to the dialog open behavior.

#### Scenario: Both pages share the same popup implementation

- **WHEN** `initTutorialPopup()` is called on a page containing an element with `id="btn-tutorial"`
- **THEN** clicking that element opens the tutorial dialog on that page
