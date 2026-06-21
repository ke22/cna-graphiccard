// 版型三 · 時間小標（Template 3）
// 欄位：年代 / 標題 / 時間 / 小標 / 內文 / 資料來源 / 更新時間。
// 節點結構：圓點 + 日期/時刻分離的時間區塊 + 小標（粗體）+ 內文。

import { createDot } from '../renderer.js';

const COLUMNS = {
  year: ['年代', '年', '西元'],
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
 * @returns {Array<{year: string, rawTime: string, dateText: string, clockText: string, timeSuffix: string, subhead: string, content: string, badge: boolean, showDate: boolean}>}
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

    // 同年同日的連續事件共用日期標題。
    const showDate = !(year === prevYear && timeParts.dateText === prevDateText);

    prevYear = year;
    prevDateText = timeParts.dateText;
    nodes.push({ year, ...timeParts, subhead, content, badge, showDate });
  });

  return nodes;
}

/**
 * 渲染版型三節點：可選日期標題（大點）＋事件列（小點 + 時刻/小標合併一行 + 內文獨立一行）。
 * forceDate 由斷頁器在同日續頁的首節點設定，確保每張卡片都有日期脈絡。
 *
 * @param {{dateText: string, clockText: string, timeSuffix: string, rawTime: string, subhead: string, content: string, showDate?: boolean, forceDate?: boolean}} node
 * @returns {HTMLElement}
 */
function renderNode(node) {
  const el = document.createElement('div');
  el.className = 'node node--template3';

  if ((node.showDate || node.forceDate) && (node.dateText || node.rawTime)) {
    const dateHeader = document.createElement('div');
    dateHeader.className = 'template3-date-header';
    const dateDot = createDot();
    dateDot.classList.add('template3-date-dot');
    dateHeader.appendChild(dateDot);

    const dateText = document.createElement('div');
    dateText.className = 'node-date-part';
    dateText.textContent = node.dateText || node.rawTime || '';
    dateHeader.appendChild(dateText);
    el.appendChild(dateHeader);
  }

  const event = document.createElement('div');
  event.className = 'template3-event';
  const eventDot = createDot();
  eventDot.classList.add('template3-event-dot');
  event.appendChild(eventDot);

  // 無法解析時原始文字已在日期標題顯示，事件列不再重複。
  // 有時刻時，小標併入同一行；無時刻時，小標獨自佔據第一行。
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
    if (node.subhead) {
      const subhead = document.createElement('span');
      subhead.className = 'node-subhead node-subhead-inline';
      subhead.textContent = node.subhead;
      clockRow.appendChild(subhead);
    }
    event.appendChild(clockRow);
  } else if (node.subhead) {
    const subhead = document.createElement('div');
    subhead.className = 'node-subhead';
    subhead.textContent = node.subhead;
    event.appendChild(subhead);
  }

  if (node.content) {
    const content = document.createElement('div');
    content.className = 'node-content';
    content.textContent = node.content;
    event.appendChild(content);
  }

  el.appendChild(event);

  return el;
}

export default { id: 'template3', columns: COLUMNS, buildNodes, renderNode };
