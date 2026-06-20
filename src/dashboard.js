import {
  DEFAULT_SPREADSHEET_URL,
  buildTemplateUrl,
  fetchSpreadsheetTabs,
  loadSpreadsheets,
  parseSpreadsheetId,
} from './sheets-api.js';

const STORAGE_KEY = 'cna-dashboard-sheet-url';

const sheetUrlInput = document.getElementById('sheet-url');
const sheetSelect = document.getElementById('sheet-select');
const connectBtn = document.getElementById('btn-connect');
const tabSelect = document.getElementById('tab-select');
const templateSelect = document.getElementById('template-select');
const openBtn = document.getElementById('btn-open');
const statusEl = document.getElementById('dash-status');

let currentSpreadsheetId = '';

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', type === 'error');
  statusEl.classList.toggle('is-success', type === 'success');
}

function resetTabs(message = '尚未連結試算表') {
  tabSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  option.textContent = message;
  tabSelect.appendChild(option);
  tabSelect.disabled = true;
  openBtn.disabled = true;
}

function populateTabs(tabs) {
  tabSelect.innerHTML = '';
  tabs.forEach(({ title, sheetId }) => {
    const option = document.createElement('option');
    option.value = String(sheetId);
    option.textContent = title;
    option.dataset.title = title;
    tabSelect.appendChild(option);
  });
  tabSelect.disabled = false;
  openBtn.disabled = tabSelect.value === '';
}

async function connectSpreadsheet() {
  const url = sheetUrlInput.value.trim();
  const spreadsheetId = parseSpreadsheetId(url);

  if (!spreadsheetId) {
    currentSpreadsheetId = '';
    resetTabs();
    setStatus('無法辨識試算表網址', 'error');
    return;
  }

  connectBtn.disabled = true;
  openBtn.disabled = true;
  resetTabs('讀取分頁中…');
  setStatus('讀取分頁中…');

  try {
    const tabs = await fetchSpreadsheetTabs(spreadsheetId);
    currentSpreadsheetId = spreadsheetId;
    populateTabs(tabs);
    localStorage.setItem(STORAGE_KEY, url);
    setStatus(`已連結 ${tabs.length} 個分頁`, 'success');
  } catch (err) {
    currentSpreadsheetId = '';
    resetTabs();
    const message =
      err && err.message ? err.message : '無法讀取試算表分頁（請確認試算表已公開共用）';
    setStatus(message, 'error');
  } finally {
    connectBtn.disabled = false;
  }
}

function openSelectedTab() {
  const selected = tabSelect.selectedOptions[0];
  if (!currentSpreadsheetId || !selected || !selected.value) {
    openBtn.disabled = true;
    return;
  }

  const target = buildTemplateUrl(
    currentSpreadsheetId,
    selected.value,
    selected.dataset.title || selected.textContent || '',
    { template: templateSelect ? templateSelect.value : '' }
  );
  window.location.href = target;
}

// 以 spreadsheets.json 填入試算表下拉選單；並依目前網址預選對應項目。
async function populateSheetSelect(currentUrl) {
  const sheets = await loadSpreadsheets();
  sheetSelect.innerHTML = '';
  const custom = document.createElement('option');
  custom.value = '';
  custom.textContent = '自訂網址…';
  sheetSelect.appendChild(custom);
  sheets.forEach(({ name, url, id }) => {
    const option = document.createElement('option');
    option.value = url;
    option.textContent = name || id;
    option.dataset.id = id;
    sheetSelect.appendChild(option);
  });
  // 依目前網址的 spreadsheet id 預選（找不到時維持「自訂網址…」）
  const currentId = parseSpreadsheetId(currentUrl);
  const match = sheets.find((s) => s.id === currentId);
  sheetSelect.value = match ? match.url : '';
}

sheetSelect.addEventListener('change', () => {
  const url = sheetSelect.value;
  if (!url) return; // 「自訂網址…」：交由使用者自行輸入
  sheetUrlInput.value = url;
  connectSpreadsheet();
});

connectBtn.addEventListener('click', () => {
  connectSpreadsheet();
});

sheetUrlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    connectSpreadsheet();
  }
});

tabSelect.addEventListener('change', () => {
  openBtn.disabled = tabSelect.value === '';
});

openBtn.addEventListener('click', openSelectedTab);

resetTabs();

// 初始：記憶網址 > spreadsheets.json 第一筆 > 內建預設；填入試算表選單後自動連結列分頁。
async function init() {
  const sheets = await loadSpreadsheets();
  const storedUrl = localStorage.getItem(STORAGE_KEY);
  const initialUrl = storedUrl || (sheets[0] && sheets[0].url) || DEFAULT_SPREADSHEET_URL;
  sheetUrlInput.value = initialUrl;
  await populateSheetSelect(initialUrl);
  connectSpreadsheet();
}

init();
