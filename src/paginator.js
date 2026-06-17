// 智慧斷頁模組
// 透過運行時 DOM 高度測量，將節點分組為多張卡片，且節點不被切割。

import { renderNode } from './renderer.js';

const MEASURE_CONTAINER_ID = 'measure-container';
// 卡片內容區寬度 = 卡片寬 1200 - card-body 左右內距各 60 = 1080
// 必須與實際渲染寬度一致，否則高度量測失準導致溢出
const CONTENT_WIDTH = 1080;
// 節點間距，須與 timeline.css 的 .node { margin-bottom } 一致
const NODE_MARGIN = 20;

/**
 * 取得（或建立）文件流外的隱藏測量容器。
 * @returns {HTMLElement}
 */
function getMeasureContainer() {
  let el = document.getElementById(MEASURE_CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MEASURE_CONTAINER_ID;
    el.style.visibility = 'hidden';
    el.style.position = 'absolute';
    el.style.top = '-9999px';
    el.style.left = '0';
    el.style.width = CONTENT_WIDTH + 'px';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * 將節點陣列依實際渲染高度分組為多張卡片。
 * 節點完整不切割：累積高度 + 節點高度 > maxHeight 時，整個節點移至下一張卡片。
 * 單一節點超過 maxHeight 時強制獨立成卡並輸出警告（避免無限遞迴）。
 *
 * @param {Array<{date: string, content: string}>} nodes
 * @param {number} [maxHeight=888] - 每張卡片可用內容高度
 * @param {number} [firstCardReserve=0] - 第一張卡片額外保留高度（西元年徽章用）
 * @returns {Promise<Array<Array<{date: string, content: string}>>>}
 */
export async function paginate(nodes, maxHeight = 888, firstCardReserve = 0) {
  if (!nodes || nodes.length === 0) return [];

  // 確保字型載入後再量測，避免行高不準
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const container = getMeasureContainer();
  container.innerHTML = '';

  // 量測每個節點的實際高度
  const heights = nodes.map((node, i) => {
    const nodeEl = renderNode(node);
    container.appendChild(nodeEl);
    const h = nodeEl.getBoundingClientRect().height;
    container.removeChild(nodeEl);
    if (h > maxHeight) {
      console.warn(
        `[paginator] Node at index ${i} height ${h}px exceeds maxHeight ${maxHeight}px — placed alone.`
      );
    }
    return h;
  });

  // 第一階段：貪婪填滿，求出在不切割節點、不超過 maxHeight 下所需的「最少卡片數」。
  // （順序固定的連續分割，貪婪最大化填充即為最少段數）
  const minCards = packGreedy(heights, maxHeight, firstCardReserve).length;

  // 第二階段：平衡分配。用 DP 把節點切成正好 minCards 段，最小化各段高度與「平均目標」的
  // 平方差，使各卡填充最均勻（外觀最一致），且每段不超過 maxHeight。
  const groups = balancedPartition(heights, maxHeight, minCards, firstCardReserve);
  return groups.map((group) => group.map((i) => nodes[i]));
}

/**
 * 將節點連續切成正好 k 段，最小化各段高度與平均目標的平方差（填充最均勻）。
 * 每段高度不得超過 maxHeight（第一段另扣 firstCardReserve）。失敗時退回貪婪分組。
 * @param {number[]} heights
 * @param {number} maxHeight
 * @param {number} k
 * @param {number} [firstCardReserve=0]
 * @returns {number[][]} 以索引分組的卡片陣列
 */
function balancedPartition(heights, maxHeight, k, firstCardReserve = 0) {
  const n = heights.length;
  const prefix = [0];
  for (let i = 0; i < n; i++) prefix.push(prefix[i] + heights[i]);
  // 節點 a..b（含）的高度 = 各節點高 + 之間的間距
  const footprint = (a, b) => prefix[b + 1] - prefix[a] + (b - a) * NODE_MARGIN;
  const target = footprint(0, n - 1) / k;
  // 第 g 段的高度上限（第一段需為西元年徽章留空間）
  const capForGroup = (g) => maxHeight - (g === 1 ? firstCardReserve : 0);

  const INF = Infinity;
  // dp[g][i] = 將前 i 個節點切成 g 段時，平方差總和的最小值
  const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(INF));
  const back = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(-1));
  dp[0][0] = 0;
  for (let g = 1; g <= k; g++) {
    for (let i = 1; i <= n; i++) {
      for (let j = g - 1; j < i; j++) {
        if (dp[g - 1][j] === INF) continue;
        const fp = footprint(j, i - 1);
        if (fp > capForGroup(g)) continue;
        const dev = fp - target;
        const cost = dp[g - 1][j] + dev * dev;
        if (cost < dp[g][i]) {
          dp[g][i] = cost;
          back[g][i] = j;
        }
      }
    }
  }

  if (dp[k][n] === INF) {
    // 理論上不會發生（minCards 已保證可行），保險起見退回貪婪
    return packGreedy(heights, maxHeight, firstCardReserve);
  }

  const groups = [];
  let i = n;
  let g = k;
  while (g > 0) {
    const j = back[g][i];
    const group = [];
    for (let x = j; x < i; x++) group.push(x);
    groups.unshift(group);
    i = j;
    g -= 1;
  }
  return groups;
}

/**
 * 貪婪填充：依序將節點塞入卡片，超過上限才換頁（第一張卡片另扣 firstCardReserve）。
 * 用於計算最少卡片數與依上限分組。
 * @param {number[]} heights
 * @param {number} maxHeight
 * @param {number} [firstCardReserve=0]
 * @returns {number[][]} 以索引分組的卡片陣列
 */
function packGreedy(heights, maxHeight, firstCardReserve = 0) {
  const cards = [];
  let current = [];
  let accumulated = 0;
  heights.forEach((h, i) => {
    const cap = maxHeight - (cards.length === 0 ? firstCardReserve : 0);
    const footprint = current.length > 0 ? NODE_MARGIN + h : h;
    if (current.length > 0 && accumulated + footprint > cap) {
      cards.push(current);
      current = [i];
      accumulated = h;
    } else {
      current.push(i);
      accumulated += footprint;
    }
  });
  if (current.length > 0) cards.push(current);
  return cards;
}
