## Context

`tutorial.html` is a full-page developer reference (293 lines) covering system architecture, local server setup, CSV column schemas, and URL parameter formats. Both `index.html` and `dashboard.html` link to it as their only help resource. Journalists and editors who use the tool daily only need three operational steps; the current page forces them to scroll through developer content to find them.

The toolbar in `index.html` links with `<a href="tutorial.html" class="toolbar-link">教學</a>`. The dashboard nav links with `<a class="dashboard-nav-link" href="tutorial.html">使用教學</a>`. Both navigate away from the working page.

## Goals / Non-Goals

**Goals:**
- Replace the navigate-away behaviour with an in-page `<dialog>` popup
- Put a 3-step user-facing guide inside the popup
- Keep `tutorial.html` intact for developers, accessible via a link in the popup footer
- Share popup logic in a single JS file loaded by both pages

**Non-Goals:**
- Modifying `tutorial.html` content
- Including CSV column specs or URL parameter docs in the popup
- Adding i18n or multi-language support
- Embedding `tutorial.html` via iframe

## Decisions

### Use native `<dialog>` element

`<dialog>` provides backdrop rendering, focus trapping, and Escape-key handling for free without a third-party library. The `showModal()` method opens it as a true modal. Backdrop clicks require a small event listener to compare `event.target` against the dialog element itself (clicking the `::backdrop` pseudo-element fires the click on the `<dialog>` itself).

Alternative considered: custom `<div>` overlay with `position: fixed`. Rejected because focus management and Escape handling must be re-implemented manually.

### Shared `src/tutorial-popup.js` module

Both pages need identical popup behavior. A shared ES module with an `initTutorialPopup()` function keeps the code DRY and ensures updates propagate to both pages. The module creates the `<dialog>` DOM dynamically and appends it to `document.body`, so neither HTML file needs to declare a dialog element inline.

Alternative considered: inline `<dialog>` in each HTML file. Rejected because content updates would require editing two files.

### Trigger element ID convention: `btn-tutorial`

`index.html` currently uses an `<a>` tag; `dashboard.html` uses an `<a>` inside the nav. Both will be given `id="btn-tutorial"` and their `href` will be changed to `#`. `initTutorialPopup()` queries `#btn-tutorial` and attaches the click handler.

### Styles in `src/styles/tutorial-popup.css`

Dialog styles are isolated from `main.css` and `dashboard.css` to avoid cascade conflicts. `tutorial-popup.css` is linked in both `index.html` and `dashboard.html`.

## Implementation Contract

**Behavior observable by the user:**
- Clicking "教學" / "使用教學" opens an overlay dialog; the page behind remains visible
- The dialog shows three numbered steps with plain-language copy (no code blocks)
- A "開發者說明 →" link in the dialog footer opens `tutorial.html`
- Pressing Escape, clicking ×, or clicking the backdrop closes the dialog
- After close, keyboard focus returns to `#btn-tutorial`

**Interface / module shape:**
```js
// src/tutorial-popup.js (ES module, no default export)
export function initTutorialPopup() { ... }
// Creates <dialog id="tutorial-dialog"> and appends to document.body on first call (idempotent)
// Binds click on #btn-tutorial → dialog.showModal()
// Binds Escape (native), × button click, and backdrop click → dialog.close()
```

**DOM contract:**
- `<dialog id="tutorial-dialog">` injected into `<body>` by `initTutorialPopup()`
- `<button id="tutorial-close" aria-label="關閉教學">` inside dialog
- `<a href="tutorial.html" id="tutorial-dev-link">開發者說明 →</a>` in dialog footer
- Trigger element on both pages: `<a id="btn-tutorial" href="#">教學</a>` (index) / `<a id="btn-tutorial" href="#" class="dashboard-nav-link">使用教學</a>` (dashboard)

**Failure modes:**
- If `#btn-tutorial` is absent on a page, `initTutorialPopup()` returns silently (no error thrown)
- If `<dialog>` is not supported (very old browser), `showModal()` throws; the catch block falls back to `window.open('tutorial.html')`

**Acceptance criteria:**
1. On `index.html`: click "教學" → dialog appears, no page navigation
2. On `dashboard.html`: click "使用教學" → dialog appears, no page navigation
3. Escape key closes dialog
4. × button closes dialog
5. Clicking backdrop area closes dialog
6. "開發者說明 →" link opens `tutorial.html`
7. `tutorial.html` is unchanged

**In scope:** `index.html`, `dashboard.html`, new `src/tutorial-popup.js`, new `src/styles/tutorial-popup.css`
**Out of scope:** `tutorial.html`, any existing tutorial CSS or JS files, card rendering logic

## Risks / Trade-offs

- [`<dialog>` backdrop click detection] The backdrop click fires on the `<dialog>` element, so the listener must check `event.target === dialogEl`. This is correct but non-obvious — a comment in the code is warranted. → Mitigation: comment in source explaining the pattern.
- [Focus return after close] Native `<dialog>.close()` does not always return focus to the opener in all browsers. → Mitigation: manually call `document.getElementById('btn-tutorial').focus()` in the close handler.
