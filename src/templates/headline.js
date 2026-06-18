// 版型二 · 標題時間軸（Headline Template）
// 欄位：年代 / 標題 / 時間 / 小標 / 內文 / 資料來源 / 更新時間（年代一律西元）。
// 節點結構：圓點 + 時間（粗體）+ 小標（粗體摘要）+ 內文（詳述，可省略）三層 stacked。

import { createDot } from '../renderer.js';

// 標頭別名：逐列欄位（單一值欄位 標題/資料來源/更新時間 由 csv-loader 共用擷取）
const COLUMNS = {
  year: ['年代', '年'],
  date: ['時間', '日期'],
  subhead: ['小標'],
  content: ['內文', '內容'],
};

const pick = (r, names) => {
  for (const n of names) if (r[n] !== undefined) return r[n];
  return '';
};

/**
 * 將解析後的 CSV 列映射為標題時間軸節點。
 * 年代向下填充（西元，照欄位值），無年代時退回 ctx.fallbackYear；跨年標 badge。
 * 小標與內文皆空的列不產生節點（來源資料常有空列／僅分隔用列）。
 *
 * @param {Array<Object>} records - parseCSV 的輸出
 * @param {{fallbackYear?: string}} [ctx]
 * @returns {Array<{year: string, date: string, subhead: string, content: string, badge: boolean}>}
 */
function buildNodes(records, ctx = {}) {
  const fallbackYear = ctx.fallbackYear || '';
  let carriedYear = '';
  let prevYear = null;
  const nodes = [];

  records.forEach((r) => {
    const rawYear = pick(r, COLUMNS.year);
    if (rawYear) carriedYear = rawYear; // 年代向下填充（空列也可攜帶年代）

    const date = pick(r, COLUMNS.date);
    const subhead = pick(r, COLUMNS.subhead);
    const content = pick(r, COLUMNS.content);
    // 小標與內文皆空：視為空列／分隔列，不產生節點（年代仍已攜帶）
    if (!subhead && !content) return;

    const year = carriedYear || fallbackYear;
    const badge = Boolean(year) && year !== prevYear;
    prevYear = year;
    nodes.push({ year, date, subhead, content, badge });
  });

  return nodes;
}

/**
 * 渲染標題時間軸節點內部結構（.node：圓點 + 時間 + 小標 + 內文）。
 * 外層 .tl-item 與年代徽章由框架（renderItem）負責。
 * 小標為空不渲染 .node-subhead；內文為空不渲染 .node-content。內文逐字照 CSV。
 *
 * @param {{date: string, subhead: string, content: string}} node
 * @returns {HTMLElement}
 */
function renderNode(node) {
  const el = document.createElement('div');
  el.className = 'node node--headline';
  el.appendChild(createDot());

  const time = document.createElement('div');
  time.className = 'node-time';
  time.textContent = node.date;
  el.appendChild(time);

  if (node.subhead) {
    const subhead = document.createElement('div');
    subhead.className = 'node-subhead';
    subhead.textContent = node.subhead;
    el.appendChild(subhead);
  }

  if (node.content) {
    const content = document.createElement('div');
    content.className = 'node-content';
    // 內文逐字照 CSV；段內換行與空行由 CSS white-space: pre-wrap 原樣保留
    content.textContent = node.content;
    el.appendChild(content);
  }

  return el;
}

export default { id: 'headline', columns: COLUMNS, buildNodes, renderNode };
