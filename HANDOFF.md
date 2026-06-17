# Handoff — CNA 圖卡產生器（版型一·時間軸）

最後更新：2026-06-17

## 這是什麼

中央社（CNA）新聞圖卡產生器，純前端（HTML/CSS/JS，無框架、無建置）。第一個版型「**版型一·時間軸**」已完成：把記者整理的事件依時間排成品牌圖卡，可從 Google Sheet 即時取資料，輸出固定尺寸 PNG。

完整規格見 `docs/templates/版型一-時間軸.md`。

## 如何啟動（重要）

必須用 HTTP 伺服器開啟，**不可雙擊用 `file://`**（ES module + fetch 會被 CORS 擋）：

```bash
cd /Users/yulincho/Documents/GitHub/cna-graphiccard
python3 -m http.server 8765
# 瀏覽器開：
# http://localhost:8765/index.html?mission=2026_美伊戰爭大事記
```

改完 JS/CSS 後瀏覽器要 **強制重整 `Cmd+Shift+R`**（python http.server 不送 no-cache）。

## 檔案結構

```
index.html                      工具列（標題/切分鈕/刷新/匯出）+ 掛載點
src/
  main.js        主流程：URL 參數 → 載入 → 斷頁 → 渲染；模式切換、刷新鈕
  csv-loader.js  manifest 定位 → 抓 Google Sheet 或本機 CSV → RFC4180 解析
  paginator.js   量測節點高度 → 貪婪求最少卡數 → DP 平衡分配
  renderer.js    DOM 渲染（頁首/年代徽章/連線/節點/頁尾）
  exporter.js    html2canvas 逐卡匯出 2× PNG
  styles/main.css      全域、工具列、按鈕
  styles/timeline.css  卡片、頁首、節點、徽章、頁尾
missions/
  index.json                   任務 manifest（csv / sheet / source / updated）
  2026_美伊戰爭大事記/*.csv      本機後援資料
docs/templates/版型一-時間軸.md  版型一完整規格
CNAlogo應用_20250311.svg         頁首 logo（程式重上色為白）
Timeline dot.svg                 節點圓點
Frame 208.svg                    年代徽章的視覺參考
```

## 目前狀態（全部已驗證）

- **資料**：欄位 `年代,時間,內文`（逐列）＋ `標題,資料來源,更新時間`（取整欄第一個非空值，選填）。
- **Google Sheet 即時更新**：manifest 的 `sheet` 填 gviz CSV 網址；loader 已加 cache-bust。
  目前綁定試算表 ID `1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8` gid=0。
- **跨年分段**：年代欄向下填充，年代變動的節點前自動插「{年}年」徽章（實測 2026/2027 兩段）。
- **兩款輸出**：切分（多張 1200×1200）／不切分（單張長圖），工具列可切換（`?split=0` 預設不切分）。
- **斷頁**：DP 平衡填充、節點不切割、徽章高度自動納入、卡片固定 1200×1200、零溢出。
- **刷新鈕**：重抓表單最新資料並重繪，成功短暫顯示綠色「✓ 已更新」。
- **匯出**：html2canvas 2× PNG（每卡一張 / 不切分則一張長圖）。
- **頁尾**：資料來源、更新日期同一行、24px；空欄位隱藏、皆空則不顯示。

## 待辦 / 下一步候選

- 接第二個分頁（同一試算表、不同 gid）驗證多圖卡管理。
- 規劃版型二、三（不同欄位/版面）→ 程式可朝「可切換版型」重構。
- git：本專案 `.git` 不是有效 repo、無 remote，尚未建立版本控制（見下）。

## Git 狀態

`.git/` 內只有 spectra-app 目錄，非有效 git repo，亦無 remote。若要版本控制需先 `git init` 並設定 GitHub remote。
