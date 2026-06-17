// 卡片渲染模組
// 將分頁後的節點資料轉換為符合視覺規格的 DOM 結構。

// 模組層級保存目前任務名稱，供卡片頁首顯示
let currentMission = '';
// 模組層級保存 CNA logo 的 inline SVG 標記（已重新上色為白色）
let currentLogoSvg = '';
// 模組層級保存時間軸圓點的 inline SVG 標記
let currentDotSvg = '';
// 圓點序號，用於產生唯一的 SVG filter id
let dotSeq = 0;
// 卡片底部中繼資料：資料來源、更新日期
let currentMeta = { source: '', updated: '' };

/**
 * 設定渲染時頁首顯示的任務名稱。
 * @param {string} name
 */
export function setMission(name) {
  currentMission = name || '';
}

/**
 * 設定頁首顯示的 CNA logo（inline SVG 標記）。
 * @param {string} svgMarkup
 */
export function setLogo(svgMarkup) {
  currentLogoSvg = svgMarkup || '';
}

/**
 * 設定時間軸圓點的 inline SVG 標記。
 * @param {string} svgMarkup
 */
export function setDot(svgMarkup) {
  currentDotSvg = svgMarkup || '';
}

/**
 * 設定卡片底部中繼資料。空字串欄位將被隱藏；兩者皆空則不顯示頁尾。
 * @param {{source?: string, updated?: string}} meta
 */
export function setMeta(meta) {
  currentMeta = {
    source: (meta && meta.source) || '',
    updated: (meta && meta.updated) || '',
  };
}

/**
 * 是否有任何頁尾中繼資料需要顯示。
 * @returns {boolean}
 */
export function hasFooter() {
  return Boolean(currentMeta.source || currentMeta.updated);
}

/**
 * 渲染單一時間軸節點為 DOM 元素（外層 .tl-item，可含年代徽章）。
 * 多段落內容（以 \n\n 分隔）拆分為多個 <p>。
 * 當 node.badge 為真時，於節點上方插入「{node.year}年」徽章（跨年分段）。
 *
 * @param {{year?: string, date: string, content: string, badge?: boolean}} node
 * @returns {HTMLElement}
 */
export function renderNode(node) {
  const item = document.createElement('div');
  item.className = 'tl-item';

  // 年代徽章：此節點為某年代起點時，於節點上方插入
  if (node.badge && node.year) {
    const badge = document.createElement('div');
    badge.className = 'year-badge';
    badge.textContent = `${node.year}年`;
    item.appendChild(badge);
  }

  const el = document.createElement('div');
  el.className = 'node';

  const dot = document.createElement('span');
  dot.className = 'node-dot';
  if (currentDotSvg) {
    // 每個圓點的 filter id 需唯一，避免重複 id 導致陰影參照錯亂
    dotSeq += 1;
    dot.innerHTML = currentDotSvg.replace(/filter0_d_18570_652/g, `dotshadow_${dotSeq}`);
  }
  el.appendChild(dot);

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

  item.appendChild(el);
  return item;
}

/**
 * 渲染單一卡片（頁首 + 內容區 + 連線 + 多個節點）。
 * @param {Array<{date: string, content: string}>} nodes
 * @returns {HTMLElement}
 */
function renderCard(nodes, single) {
  const card = document.createElement('div');
  card.className = single ? 'card card--single' : 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  const brand = document.createElement('div');
  brand.className = 'brand';
  if (currentLogoSvg) {
    brand.innerHTML = currentLogoSvg;
  } else {
    // 後備：logo 載入失敗時仍顯示文字
    brand.textContent = '中央社 CNA';
  }
  const mission = document.createElement('div');
  mission.className = 'mission';
  mission.textContent = currentMission;
  header.appendChild(brand);
  header.appendChild(mission);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'card-body';

  // 時間軸容器：包住連線與節點，讓內容可在 body 內垂直置中（連線跟著內容、不突出）
  const timeline = document.createElement('div');
  timeline.className = 'timeline';

  const line = document.createElement('div');
  line.className = 'timeline-line';
  timeline.appendChild(line);

  // 節點（年代徽章已內含於 renderNode，於各年代起點顯示）
  nodes.forEach((node) => timeline.appendChild(renderNode(node)));
  body.appendChild(timeline);
  card.appendChild(body);

  // 頁尾：資料來源 / 更新日期，空欄位隱藏，兩者皆空則不加頁尾
  if (currentMeta.source || currentMeta.updated) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    if (currentMeta.source) {
      const src = document.createElement('div');
      src.className = 'footer-line';
      src.textContent = `資料來源：${currentMeta.source}`;
      footer.appendChild(src);
    }
    if (currentMeta.updated) {
      const upd = document.createElement('div');
      upd.className = 'footer-line';
      upd.textContent = `更新日期：${currentMeta.updated}`;
      footer.appendChild(upd);
    }
    card.appendChild(footer);
  }

  return card;
}

/**
 * 接收二維節點陣列，為每張卡片產生一個 .card DOM 元素。
 * @param {Array<Array<{date: string, content: string}>>} pagedNodes
 * @returns {HTMLElement[]} 卡片 DOM 元素陣列
 */
export function renderCards(pagedNodes, options = {}) {
  return pagedNodes.map((nodes) => renderCard(nodes, options.single));
}
