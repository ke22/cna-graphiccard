// 版型三 · 時間小標（Template 3）
// 欄位：年代 / 標題 / 時間 / 小標 / 內文 / 資料來源 / 更新時間。
// 節點結構：圓點 + 日期/時刻分離的時間區塊 + 小標（粗體）+ 內文。

import { createDot } from '../renderer.js';

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

function parseTime(rawValue) {
  const rawTime = String(rawValue || '').trim();
  if (!rawTime) return { rawTime: '', dateText: '', clockText: '', timeSuffix: '' };

  const normalized = rawTime.replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(.+?)(\d{1,2}):(\d{2})(.*)$/);
  if (!match) {
    return { rawTime, dateText: rawTime, clockText: '', timeSuffix: '' };
  }

  const dateText = match[1].trim();
  const hour = match[2].padStart(2, '0');
  const minute = match[3];
  const timeSuffix = match[4].trim();
  return { rawTime, dateText, clockText: `${hour}:${minute}`, timeSuffix };
}

/**
 * 將解析後的 CSV 列映射為時間小標節點。
 * 年代向下填充；小標與內文皆空的列不產生節點。
 *
 * @param {Array<Object>} records
 * @param {{fallbackYear?: string}} [ctx]
 * @returns {Array<{year: string, rawTime: string, dateText: string, clockText: string, timeSuffix: string, subhead: string, content: string, badge: boolean}>}
 */
function buildNodes(records, ctx = {}) {
  const fallbackYear = ctx.fallbackYear || '';
  let carriedYear = '';
  let prevYear = null;
  let prevDateText = null;
  const nodes = [];

  records.forEach((r) => {
    const rawYear = pick(r, COLUMNS.year);
    if (rawYear) carriedYear = rawYear;

    const subhead = pick(r, COLUMNS.subhead);
    const content = pick(r, COLUMNS.content);
    if (!subhead && !content) return;

    const timeParts = parseTime(pick(r, COLUMNS.date));
    const year = carriedYear || fallbackYear;
    const badge = Boolean(year) && year !== prevYear;
    
    // Check if date changes (within the same year)
    const showDate = !(year === prevYear && timeParts.dateText === prevDateText);
    
    prevYear = year;
    prevDateText = timeParts.dateText;
    nodes.push({ year, ...timeParts, subhead, content, badge, showDate });
  });

  return nodes;
}

/**
 * 渲染版型三節點內部結構。時間欄位優先拆成日期與時刻；
 * 無法拆分時以原始時間文字單行顯示。
 *
 * @param {{dateText: string, clockText: string, timeSuffix: string, rawTime: string, subhead: string, content: string, showDate?: boolean}} node
 * @returns {HTMLElement}
 */
// 單行表頭：日期欄 + 圓點 + 時刻，三者同列；小標／內文於其下分行。
// 日期僅在 showDate 為真時顯示；同日後續節點留白但保留欄寬，使圓點對齊。
function renderNode(node) {
  const el = document.createElement('div');
  el.className = 'node node--template3';

  // 表頭橫列：日期欄、圓點、時刻列共置一行
  const header = document.createElement('div');
  header.className = 'node-header';

  // 日期欄（固定寬度由 CSS 控制）：同日重複時留白，仍占欄寬以對齊圓點
  const dateDiv = document.createElement('div');
  dateDiv.className = 'node-date-part';
  dateDiv.textContent = node.showDate ? node.dateText || node.rawTime || '' : '';
  header.appendChild(dateDiv);

  // 時間軸圓點：位於日期欄之後，連線經過此處
  header.appendChild(createDot());

  // 時刻列：可解析出 HH:mm 時顯示時刻（+ 後綴）；無時刻則不重複日期（日期已在日期欄）
  const time = document.createElement('div');
  time.className = 'node-time-split';
  if (node.clockText) {
    const clockRow = document.createElement('div');
    clockRow.className = 'node-clock-row';
    const clock = document.createElement('span');
    clock.className = 'node-clock-part';
    clock.textContent = node.clockText;
    clockRow.appendChild(clock);
    if (node.timeSuffix) {
      const suffix = document.createElement('span');
      suffix.className = 'node-time-suffix';
      suffix.textContent = node.timeSuffix;
      clockRow.appendChild(suffix);
    }
    time.appendChild(clockRow);
  }
  header.appendChild(time);

  el.appendChild(header);

  if (node.subhead) {
    const subhead = document.createElement('div');
    subhead.className = 'node-subhead';
    subhead.textContent = node.subhead;
    el.appendChild(subhead);
  }

  if (node.content) {
    const content = document.createElement('div');
    content.className = 'node-content';
    content.textContent = node.content;
    el.appendChild(content);
  }

  return el;
}

export default { id: 'template3', columns: COLUMNS, buildNodes, renderNode };
