// 主流程：讀取 URL mission 參數 → 載入 → 斷頁 → 渲染 → 掛載
// 並初始化工具列與匯出功能。

import { loadRecords, loadMeta, loadMissionNames } from './csv-loader.js';
import { paginate } from './paginator.js';
import { renderCards, setMission, setLogo, setDot, setMeta } from './renderer.js';
import { getTemplate } from './templates/registry.js';
import { setupExport } from './exporter.js';
import {
  buildGvizCsvUrl,
  buildTemplateUrl,
  DEFAULT_SPREADSHEET_URL,
  fetchSpreadsheetTabs,
  loadSpreadsheets,
  parseSheetId,
  parseSpreadsheetId,
} from './sheets-api.js';

const LOGO_PATH = 'CNAlogo應用_20250311.svg';
const DOT_PATH = 'Timeline dot.svg';

// 卡片版面常數（須與 timeline.css 一致），用於計算斷頁可用高度
const CARD_HEIGHT = 1200;
const HEADER_HEIGHT = 120; // 精簡頁首
const BODY_PADDING = 20 + 20; // card-body 上下內距
const FOOTER_ONE_LINE = 84; // 頁尾 1 行保留高度（28px 字 + 內距）
const FOOTER_TWO_LINE = 132; // 頁尾換行保留高度（28px 字 × 2 行 + gap + 內距）
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

function updateQuery(nextValues) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(nextValues).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  window.location.href = `index.html?${params.toString()}`;
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const mission = params.get('mission') || '';
  const legacySheetOverride = params.get('sheet') || '';
  const spreadsheetOverride = params.get('spreadsheet') || '';
  const gidOverride = params.get('gid') || '';
  // CNA's edge firewall rejects a nested encoded URL in ?sheet=. New links pass
  // only the spreadsheet ID and gid, then construct the Google URL client-side.
  const sheetOverride =
    legacySheetOverride ||
    (spreadsheetOverride && gidOverride
      ? buildGvizCsvUrl(spreadsheetOverride, gidOverride)
      : '');

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
    // 未指定任務時導向預設試算表分頁
    const defaultId = parseSpreadsheetId(DEFAULT_SPREADSHEET_URL);
    const defaultGid = parseSheetId(DEFAULT_SPREADSHEET_URL);
    if (defaultId && defaultGid) {
      window.location.replace(buildTemplateUrl(defaultId, defaultGid, ''));
      return;
    }
    // 退回本機 CSV 第一筆
    const names = await loadMissionNames();
    if (names.length > 0) {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.set('mission', names[0]);
      window.location.replace(`index.html?${nextParams.toString()}`);
      return;
    }
    showError('無法載入資料：未指定任務（請使用 ?mission=任務名稱）');
    return;
  }

  const app = document.getElementById('app');
  const btnSplit = document.getElementById('btn-mode-split');
  const btnSingle = document.getElementById('btn-mode-single');
  const refreshBtn = document.getElementById('btn-refresh');
  const templateSelect = document.getElementById('template-select');

  // 當前狀態：載入後的節點、斷頁可用高度與所選版型，供模式切換／重繪使用
  let currentNodes = [];
  let currentMaxHeight = CARD_HEIGHT - HEADER_HEIGHT - BODY_PADDING;
  let currentMode = params.get('split') === '0' ? 'single' : 'split';
  let currentTemplate = getTemplate(); // 預設版型，loadAndRender 會依任務設定覆寫

  if (templateSelect) {
    templateSelect.value = params.get('template') || 'timeline';
    templateSelect.addEventListener('change', () => {
      updateQuery({ template: templateSelect.value });
    });
  }

  // 兩款輸出：'split'（切分多張 1200×1200）/ 'single'（不切分，單張長圖）
  // 年代徽章高度已內含於各節點的量測高度（renderItem 會渲染徽章），故斷頁無須額外保留。
  async function render(mode) {
    let cards;
    if (mode === 'single') {
      cards = renderCards([currentNodes], { single: true, template: currentTemplate });
    } else {
      const paged = await paginate(currentNodes, currentMaxHeight, 0, currentTemplate);
      cards = renderCards(paged, { template: currentTemplate });
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
    const nextUrl = new URL(window.location.href);
    if (mode === 'single') {
      nextUrl.searchParams.set('split', '0');
    } else {
      nextUrl.searchParams.delete('split');
    }
    window.history.replaceState(null, '', nextUrl);
    return render(mode);
  }

  // 載入（或重新載入）資料並重繪，沿用目前的切分模式
  async function loadAndRender() {
    const baseMeta = mission
      ? await loadMeta(mission)
      : { source: '', updated: '', template: undefined }; // manifest 的資料來源/更新時間/版型
    // 資料來源：URL ?spreadsheet=&gid=（或舊版 ?sheet=）可覆寫 Google Sheet
    // 公開 CSV 網址（loader 已加 cache-bust）
    const { records, sheetMeta } = await loadRecords(mission, sheetOverride || undefined);

    // 版型優先序：URL ?template= > manifest template 欄 > 預設 timeline（未知 id 由 registry 退回）
    currentTemplate = getTemplate(params.get('template') || baseMeta.template || undefined);
    if (templateSelect) templateSelect.value = currentTemplate.id;

    // 標題：sheet/CSV 的「標題」欄 > URL ?title=（分頁名 fallback）> 任務名稱
    const title = sheetMeta.title || params.get('title') || mission || 'CNA 時間軸圖卡';
    titleEl.textContent = title;
    setMission(title);

    // 逐列映射為節點交由所選版型：年代向下填充、跨年標 badge（無年代時退回任務名稱中的 4 位數字）。
    const missionYear = (mission.match(/(\d{4})/) || [])[1] || '';
    const nodes = currentTemplate.buildNodes(records, {
      fallbackYear: sheetMeta.year || missionYear,
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
  const params = new URLSearchParams(window.location.search);
  const spreadsheetId = parseSpreadsheetId(sheetOverride);
  const currentSheetId = parseSheetId(sheetOverride);
  const missionSelect = document.getElementById('mission-select');

  if (!missionSelect || !spreadsheetId) return;

  setupSheetSwitch(spreadsheetId, params);

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
      selected.dataset.title || selected.textContent || '',
      {
        template: params.get('template') || '',
        split: params.get('split') || '',
      }
    );
  });
}

// 工具列「切換試算表」：以 spreadsheets.json 列出多份試算表，切換時導向新試算表第一個分頁。
async function setupSheetSwitch(spreadsheetId, params) {
  const sheetSelect = document.getElementById('sheet-select');
  if (!sheetSelect) return;

  let sheets;
  try {
    sheets = await loadSpreadsheets();
  } catch (err) {
    return;
  }
  // 目前試算表不在清單時補入，確保預選有對應項目
  if (!sheets.some((s) => s.id === spreadsheetId)) {
    sheets = [{ name: '目前試算表', url: '', id: spreadsheetId }, ...sheets];
  }

  sheetSelect.innerHTML = '';
  sheets.forEach(({ name, id }) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name || id;
    sheetSelect.appendChild(option);
  });
  sheetSelect.value = spreadsheetId;
  sheetSelect.hidden = sheets.length < 2;

  sheetSelect.addEventListener('change', async () => {
    const nextId = sheetSelect.value;
    if (!nextId || nextId === spreadsheetId) return;
    sheetSelect.disabled = true;
    try {
      const tabs = await fetchSpreadsheetTabs(nextId);
      const first = tabs[0];
      window.location.href = buildTemplateUrl(nextId, first.sheetId, first.title || '', {
        template: params.get('template') || '',
        split: params.get('split') || '',
      });
    } catch (err) {
      sheetSelect.value = spreadsheetId;
      sheetSelect.disabled = false;
    }
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
