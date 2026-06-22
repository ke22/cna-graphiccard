## 1. 建立共用彈窗模組

- [x] 1.1 建立 shared `src/tutorial-popup.js` module，實作 `initTutorialPopup()` 函式（符合設計決策「Shared `src/tutorial-popup.js` module」與「Popup JS is loaded by both pages via a shared module」規格）：使用 native `<dialog>` element（設計決策「Use native `<dialog>` element」），動態建立 `<dialog id="tutorial-dialog">` 並附加至 `document.body`（可重入）；依 trigger element id convention `btn-tutorial` 查詢 `#btn-tutorial` 並綁定 click 以呼叫 `dialog.showModal()`；`#btn-tutorial` 不存在時靜默返回。驗證：在 `index.html` 與 `dashboard.html` 各呼叫 `initTutorialPopup()`，確認 DOM 中只出現一個 `#tutorial-dialog`。

- [x] 1.2 實作「Popup closes on standard dismiss gestures」：Escape 鍵（原生支援）、`#tutorial-close` 按鈕 click、backdrop 點擊（判斷 `event.target === dialogEl`，此為 backdrop click 的標準偵測方式）三種路徑均呼叫 `dialog.close()`，關閉後執行 `document.getElementById('btn-tutorial').focus()` 歸還焦點。以 `try/catch` 包覆 `showModal()`，不支援 `<dialog>` 的舊瀏覽器 fallback 為 `window.open('tutorial.html')`。驗證：手動測試 Escape、× 按鈕、backdrop 點擊三種關閉路徑均正常關閉且焦點回到觸發元素。

- [x] 1.3 注入彈窗內容，滿足「User tutorial presents three-step operation guide」與「Developer tutorial remains accessible via link」規格：Dialog 內包含標題「如何產出時間軸圖卡」、三個步驟（Step 1：開啟 `dashboard.html` → 貼入 Google 試算表網址 → 點「連結」；Step 2：選擇分頁與版型 → 點「開啟」；Step 3：確認版型/模式 → 點「匯出」），footer 放置 `<a href="tutorial.html" id="tutorial-dev-link">開發者說明 →</a>`。不含終端機指令、URL 參數或 CSV 欄位規格。驗證：開啟彈窗後確認三個步驟可見，「開發者說明 →」點擊後導向 `tutorial.html`。

## 2. 新增彈窗樣式（Styles in `src/styles/tutorial-popup.css`）

- [x] 2.1 建立 `src/styles/tutorial-popup.css`（設計決策「Styles in `src/styles/tutorial-popup.css`」），為 `#tutorial-dialog` 設定：置中（`margin: auto`）、最大寬度 560px、白底、圓角、box-shadow；`::backdrop` 設定 `rgba(0,0,0,0.45)` 遮罩；`#tutorial-close` 按鈕絕對定位右上角；步驟使用 `<ol>` 排版。驗證：在 `index.html` 開啟彈窗，視覺確認彈窗居中、backdrop 可見、步驟列表整齊、× 位於右上角。

## 3. 更新 index.html

- [x] 3.1 在 `index.html` 套用「Popup triggers on button/link activation」：(a) 將 `<a href="tutorial.html" class="toolbar-link">教學</a>` 改為 `<a id="btn-tutorial" href="#" class="toolbar-link">教學</a>`（trigger element id convention: `btn-tutorial`）；(b) 加入 `<link rel="stylesheet" href="src/styles/tutorial-popup.css">`；(c) 在 `src/main.js` 的 `<script>` 後加入 `<script type="module">import { initTutorialPopup } from './src/tutorial-popup.js'; initTutorialPopup();</script>`。驗證：點擊「教學」後頁面不跳轉，`#tutorial-dialog` 出現在頁面上方。

## 4. 更新 dashboard.html

- [x] 4.1 在 `dashboard.html` 套用「Popup triggers on button/link activation」與「Popup JS is loaded by both pages via a shared module」：(a) 將導覽列中 `<a class="dashboard-nav-link" href="tutorial.html">使用教學</a>` 改為 `<a id="btn-tutorial" href="#" class="dashboard-nav-link">使用教學</a>`（trigger element id convention: `btn-tutorial`）；(b) 加入 `<link rel="stylesheet" href="src/styles/tutorial-popup.css">`；(c) 加入 `<script type="module">import { initTutorialPopup } from './src/tutorial-popup.js'; initTutorialPopup();</script>`。驗證：點擊「使用教學」後 dashboard 頁面不跳轉，彈窗正確顯示。
