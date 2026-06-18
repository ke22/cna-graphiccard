// 版型一 · 時間軸（Timeline Template 1）
// 欄位：年代 / 時間 / 內文（標頭別名：年代|年、時間|日期、內文|內容）。
// 節點結構：圓點 + 時間（粗體）+ 內文（多段落以 \n\n 分隔，段距由 CSS 控制）。

import { createDot } from '../renderer.js';

// 標頭別名：每個欄位可接受的標頭名稱（第一個存在者優先）
const COLUMNS = {
  year: ['年代', '年'],
  date: ['時間', '日期'],
  content: ['內文', '內容'],
};

/**
 * 將解析後的 CSV 列映射為時間軸節點。
 * 年代向下填充（只需在變動列填值），無年代時退回 ctx.fallbackYear；
 * 當某節點年代與前一節點不同時標記 badge=true（跨年分段，框架據此插入年代徽章）。
 * 相容舊格式：無年代欄時以欄位位置取時間/內文。
 *
 * @param {Array<Object>} records - parseCSV 的輸出（以標頭為 key 的物件陣列）
 * @param {{fallbackYear?: string}} [ctx]
 * @returns {Array<{year: string, date: string, content: string, badge: boolean}>}
 */
function buildNodes(records, ctx = {}) {
  const fallbackYear = ctx.fallbackYear || '';
  const hasYear = records.some((r) => r['年代'] !== undefined || r['年'] !== undefined);

  let carriedYear = '';
  let prevYear = null;
  return records.map((r) => {
    const pick = (names) => {
      for (const n of names) if (r[n] !== undefined) return r[n];
      return undefined;
    };
    const keys = Object.keys(r);
    const rawYear = pick(COLUMNS.year);
    if (rawYear) carriedYear = rawYear;
    const date = pick(COLUMNS.date) || r[keys[hasYear ? 1 : 0]] || '';
    const content = pick(COLUMNS.content) || r[keys[hasYear ? 2 : 1]] || '';

    const year = carriedYear || fallbackYear;
    const badge = Boolean(year) && year !== prevYear;
    prevYear = year;
    return { year, date, content, badge };
  });
}

/**
 * 渲染時間軸節點內部結構（.node：圓點 + 時間 + 內文）。
 * 外層 .tl-item 與年代徽章由框架（renderItem）負責。
 * 內文以 \n\n 分段為多個 <p class="para">，文字逐字不更動。
 *
 * @param {{date: string, content: string}} node
 * @returns {HTMLElement}
 */
function renderNode(node) {
  const el = document.createElement('div');
  el.className = 'node';
  el.appendChild(createDot());

  const date = document.createElement('div');
  date.className = 'node-date';
  date.textContent = node.date;
  el.appendChild(date);

  const content = document.createElement('div');
  content.className = 'node-content';
  // 以 \n\n 分段，段落間距改由 CSS 控制（避免原文空行造成過大間距）；
  // 文字不更動，段內單一換行與空白仍由 white-space: pre-wrap 原樣保留
  String(node.content)
    .split(/\n\n+/)
    .forEach((para) => {
      const p = document.createElement('p');
      p.className = 'para';
      p.textContent = para;
      content.appendChild(p);
    });
  el.appendChild(content);

  return el;
}

export default { id: 'timeline', columns: COLUMNS, buildNodes, renderNode };
