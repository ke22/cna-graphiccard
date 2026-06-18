// Google Sheets API key for listing spreadsheet tabs.
// Restrict this key in Google Cloud Console to Google Sheets API and the
// production HTTP referrer domains that serve this static site.
export const API_KEY = 'AIzaSyD2Z04MmWE5PgUHektWsDFDeYZUAzNZwUU';
export const PLACEHOLDER_API_KEY = 'AIzaSyDUMMY_REPLACE_WITH_RESTRICTED_SHEETS_KEY';
export const DEFAULT_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1oQgXm582APOM-OqPrztH4rN1yYrJT4OLGTZhuRAcbi8/edit?gid=0#gid=0';

export function parseSpreadsheetId(url) {
  const match = String(url || '').match(/\/spreadsheets\/d\/([^/?#]+)/);
  return match ? match[1] : '';
}

export function parseSheetId(url) {
  const match = String(url || '').match(/[?#&]gid=([^&#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function assertApiKeyConfigured() {
  if (!API_KEY || API_KEY === PLACEHOLDER_API_KEY) {
    throw new Error('尚未設定 Google Sheets API key');
  }
}

export async function fetchSpreadsheetTabs(spreadsheetId) {
  assertApiKeyConfigured();

  const params = new URLSearchParams({
    fields: 'sheets.properties(title,sheetId)',
    key: API_KEY,
  });
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?${params.toString()}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error('無法讀取試算表分頁（請確認試算表已公開共用）');
  }

  const data = await res.json();
  const tabs = (data.sheets || [])
    .map((sheet) => sheet.properties || {})
    .filter((properties) => properties.title && properties.sheetId !== undefined);

  if (tabs.length === 0) {
    throw new Error('此試算表沒有可用分頁');
  }

  return tabs;
}

export function buildGvizCsvUrl(spreadsheetId, sheetId) {
  return (
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}` +
    `/gviz/tq?tqx=out:csv&gid=${sheetId}`
  );
}

export function buildTemplateUrl(spreadsheetId, sheetId, title, options = {}) {
  const gvizUrl = buildGvizCsvUrl(spreadsheetId, sheetId);
  const params = new URLSearchParams({
    sheet: gvizUrl,
    title,
  });

  if (options.template) params.set('template', options.template);
  if (options.split !== undefined && options.split !== null && options.split !== '') {
    params.set('split', String(options.split));
  }

  return `index.html?${params.toString()}`;
}
