// 主流程：讀取 URL mission 參數 → 載入 → 斷頁 → 渲染 → 掛載
// 並初始化工具列與匯出功能。

import { loadNodes, loadMeta } from './csv-loader.js';
import { paginate } from './paginator.js';
import { renderCards, setMission, setLogo, setDot, setMeta } from './renderer.js';
import { setupExport } from './exporter.js';
import {
  buildTemplateUrl,
  fetchSpreadsheetTabs,
  parseSheetId,
  parseSpreadsheetId,
} from './sheets-api.js';

const LOGO_PATH = 'CNAlogo應用_20250311.svg';
const DOT_PATH = 'Timeline dot.svg';

// 卡片版面常數（須與 timeline.css 一致），用於計算斷頁可用高度
const CARD_HEIGHT = 1200;
const HEADER_HEIGHT = 120; // 精簡頁首
const BODY_PADDING = 20 + 20; // card-body 上下內距
const FOOTER_ONE_LINE = 84; // 頁尾 1 行保留高度（24px 字 + 內距）
const FOOTER_TWO_LINE = 116; // 頁尾換行保留高度
const CARD_WIDTH = 1200;
const TOOLBAR_HEIGHT = 60;

/**
 * 載入時間軸圓點 SVG。
 * @returns {Promise<string>} SVG 標記；失敗時回傳空字串
 */
async function loadDot() {
  try {
    const res = await fetch(DOT_PATH);
    if (!res.ok) throw new Error('dot fetch failed');
    return await res.text();
  } catch (e) {
    return '';
  }
}

/**
 * 載入 CNA logo SVG 並重新上色為白色（適配深藍頁首）。
 * inline 進 DOM 可確保 html2canvas 匯出時也能正確渲染。
 * @returns {Promise<string>} SVG 標記；失敗時回傳空字串
 */
async function loadLogo() {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) throw new Error('logo fetch failed');
    let svg = await res.text();
    // 原始 logo 為灰色 #8e8e8e，於深藍頁首改為白色
    svg = svg.replace(/#8e8e8e/gi, '#ffffff');
    return svg;
  } catch (e) {
    return '';
  }
}

/**
 * 在 app 容器顯示錯誤訊息。
 * @param {string} message
 */
function showError(message) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'error-message';
  el.textContent = message;
  app.appendChild(el);
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const mission = params.get('mission') || '';
  const sheetOverride = params.get('sheet') || '';

  const titleEl = document.getElementById('mission-title');
  const exportBtn = document.getElementById('btn-export');

  const [logoSvg, dotSvg] = await Promise.all([loadLogo(), loadDot()]);
  setLogo(logoSvg);
  setDot(dotSvg);

  // 即使 html2canvas 不可用，也先設定匯出按鈕狀態（不丟出例外）
  setupExport(exportBtn);
  setupMissionSwitch(sheetOverride);
  setupPreviewScale();

  if (!mission && !sheetOverride) {
    showError('無法載入資料：未指定任務（請使用 ?mission=任務名稱）');
    return;
  }

  const app = document.getElementById('app');
  const btnSplit = document.getElementById('btn-mode-split');
  const btnSingle = document.getElementById('btn-mode-single');
  const refreshBtn = document.getElementById('btn-refresh');

  // 當前狀態：載入後的節點與斷頁可用高度，供模式切換／重繪使用
  let currentNodes = [];
  let currentMaxHeight = CARD_HEIGHT - HEADER_HEIGHT - BODY_PADDING;
  let currentMode = params.get('split') === '0' ? 'single' : 'split';

  // 兩款輸出：'split'（切分多張 1200×1200）/ 'single'（不切分，單張長圖）
  // 年代徽章高度已內含於各節點的量測高度（renderNode 會渲染徽章），故斷頁無須額外保留。
  async function render(mode) {
    let cards;
    if (mode === 'single') {
      cards = renderCards([currentNodes], { single: true });
    } else {
      const paged = await paginate(currentNodes, currentMaxHeight);
      cards = renderCards(paged);
    }
    app.innerHTML = '';
    cards.forEach((card) => {
      const preview = document.createElement('div');
      preview.className = card.classList.contains('card--single')
        ? 'card-preview card-preview--single'
        : 'card-preview';
      preview.appendChild(card);
      app.appendChild(preview);
    });
  }

  function setMode(mode) {
    currentMode = mode;
    btnSplit.classList.toggle('active', mode === 'split');
    btnSingle.classList.toggle('active', mode === 'single');
    return render(mode);
  }

  // 載入（或重新載入）資料並重繪，沿用目前的切分模式
  async function loadAndRender() {
    const baseMeta = mission ? await loadMeta(mission) : { source: '', updated: '' }; // manifest 的資料來源/更新時間
    // 資料來源：URL ?sheet= 可覆寫為 Google Sheet 公開 CSV 網址（loader 已加 cache-bust）
    const { nodes, sheetMeta } = await loadNodes(mission, sheetOverride || undefined);

    // 標題：URL ?title= > sheet 標題欄 > 任務名稱
    const title = params.get('title') || sheetMeta.title || mission || 'CNA 時間軸圖卡';
    titleEl.textContent = title;
    setMission(title);

    // 年代徽章：年代欄已向下填充；無年代時退回任務名稱中的 4 位數字。
    // 當某節點年代與前一節點不同時標記 badge=true → 該節點上方插入年代徽章（跨年分段）。
    const missionYear = (mission.match(/(\d{4})/) || [])[1] || '';
    let prevYear = null;
    nodes.forEach((n) => {
      n.year = n.year || sheetMeta.year || missionYear;
      n.badge = Boolean(n.year) && n.year !== prevYear;
      prevYear = n.year;
    });

    // 資料來源／更新時間：URL 參數 > sheet 欄位 > manifest（空字串欄位會被隱藏）
    const meta = {
      source: params.has('source') ? params.get('source') : sheetMeta.source || baseMeta.source,
      updated: params.has('updated')
        ? params.get('updated')
        : sheetMeta.updated || baseMeta.updated,
    };
    setMeta(meta);
    // 依頁尾實際行數保留高度（0/1/2 行），計算每張卡片可用內容高度，確保卡片維持 1200×1200
    const footerLines = (meta.source ? 1 : 0) + (meta.updated ? 1 : 0);
    const footerReserve =
      footerLines === 0 ? 0 : footerLines === 1 ? FOOTER_ONE_LINE : FOOTER_TWO_LINE;

    currentNodes = nodes;
    currentMaxHeight = CARD_HEIGHT - HEADER_HEIGHT - BODY_PADDING - footerReserve;
    await render(currentMode);
  }

  btnSplit.addEventListener('click', () => setMode('split'));
  btnSingle.addEventListener('click', () => setMode('single'));

  // 刷新鈕：重新抓表單最新資料並重繪（不必整頁 reload）
  if (refreshBtn) {
    const REFRESH_LABEL = '↻ 刷新';
    let resetTimer = null;
    refreshBtn.addEventListener('click', async () => {
      if (resetTimer) clearTimeout(resetTimer);
      refreshBtn.disabled = true;
      refreshBtn.classList.remove('is-done');
      refreshBtn.textContent = '載入中…';
      try {
        await loadAndRender();
        // 成功：短暫顯示「✓ 已更新」再恢復
        refreshBtn.textContent = '✓ 已更新';
        refreshBtn.classList.add('is-done');
        resetTimer = setTimeout(() => {
          refreshBtn.textContent = REFRESH_LABEL;
          refreshBtn.classList.remove('is-done');
        }, 1800);
      } catch (err) {
        refreshBtn.textContent = REFRESH_LABEL;
        showError(err && err.message ? err.message : `無法載入資料：${mission} 不存在`);
      } finally {
        refreshBtn.disabled = false;
      }
    });
  }

  // 設定初始模式樣式後首次載入
  btnSplit.classList.toggle('active', currentMode === 'split');
  btnSingle.classList.toggle('active', currentMode === 'single');
  try {
    await loadAndRender();
  } catch (err) {
    showError(err && err.message ? err.message : `無法載入資料：${mission} 不存在`);
  }
}

async function setupMissionSwitch(sheetOverride) {
  const spreadsheetId = parseSpreadsheetId(sheetOverride);
  const currentSheetId = parseSheetId(sheetOverride);
  const missionSelect = document.getElementById('mission-select');

  if (!missionSelect || !spreadsheetId) return;

  missionSelect.hidden = false;
  missionSelect.disabled = true;

  try {
    const tabs = await fetchSpreadsheetTabs(spreadsheetId);
    missionSelect.innerHTML = '';
    tabs.forEach(({ title, sheetId }) => {
      const option = document.createElement('option');
      option.value = String(sheetId);
      option.textContent = title;
      option.dataset.title = title;
      missionSelect.appendChild(option);
    });
    if (currentSheetId) missionSelect.value = currentSheetId;
    missionSelect.disabled = false;
  } catch (err) {
    missionSelect.hidden = true;
    return;
  }

  missionSelect.addEventListener('change', () => {
    const selected = missionSelect.selectedOptions[0];
    if (!selected) return;
    window.location.href = buildTemplateUrl(
      spreadsheetId,
      selected.value,
      selected.dataset.title || selected.textContent || ''
    );
  });
}

function setupPreviewScale() {
  const root = document.documentElement;

  function update() {
    const availableWidth = Math.max(320, window.innerWidth - 48);
    const availableHeight = Math.max(320, window.innerHeight - TOOLBAR_HEIGHT - 48);
    const scale = Math.min(availableWidth / CARD_WIDTH, availableHeight / CARD_HEIGHT);
    root.style.setProperty('--preview-scale', String(Math.max(0.28, scale)));
  }

  update();
  window.addEventListener('resize', update);
}

main();
