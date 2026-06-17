import {
  DEFAULT_SPREADSHEET_URL,
  buildTemplateUrl,
  fetchSpreadsheetTabs,
  parseSpreadsheetId,
} from './sheets-api.js';

const STORAGE_KEY = 'cna-dashboard-sheet-url';

const sheetUrlInput = document.getElementById('sheet-url');
const connectBtn = document.getElementById('btn-connect');
const tabSelect = document.getElementById('tab-select');
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
    selected.dataset.title || selected.textContent || ''
  );
  window.location.href = target;
}

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

const storedUrl = localStorage.getItem(STORAGE_KEY);
sheetUrlInput.value = storedUrl || DEFAULT_SPREADSHEET_URL;
connectSpreadsheet();
