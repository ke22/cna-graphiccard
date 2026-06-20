// CSV 載入與解析模組
// 提供 RFC 4180 相容的解析器與 loadNodes() 資料介面

/**
 * 以 RFC 4180 規則解析 CSV 字串。
 * 支援引號包覆欄位（含逗號、換行、雙引號跳脫），第一行視為標頭並跳過。
 *
 * @param {string} text - 原始 CSV 文字
 * @returns {Array<Object>} 以標頭欄名為 key 的物件陣列（不含標頭列）
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  // 統一換行符號為 \n，避免 Windows 的 \r\n 殘留
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < s.length) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          // 跳脫的雙引號
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // 收尾：最後一個欄位 / 列（若檔尾無換行）
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const header = rows[0];
  return rows.slice(1).map((cells) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = cells[idx] !== undefined ? cells[idx] : '';
    });
    return obj;
  });
}

/**
 * 取得 manifest 並回傳指定任務的設定項目。
 * 支援兩種格式：字串（僅 CSV 檔名）或物件 `{csv, sheet, source, updated, template}`。
 * @param {string} missionName
 * @returns {Promise<{csv: string, sheet: string, source: string, updated: string, template: string|undefined}>}
 * @throws {Error} 當任務不存在時
 */
async function resolveEntry(missionName) {
  let manifest;
  try {
    const res = await fetch('missions/index.json');
    if (!res.ok) throw new Error('manifest fetch failed');
    manifest = await res.json();
  } catch (e) {
    throw new Error(`無法載入資料：${missionName} 不存在`);
  }

  const entry = manifest[missionName];
  if (!entry) {
    throw new Error(`無法載入資料：${missionName} 不存在`);
  }
  if (typeof entry === 'string') {
    return { csv: entry, sheet: '', source: '', updated: '', template: undefined };
  }
  return {
    csv: entry.csv || '',
    sheet: entry.sheet || '', // Google Sheet 公開 CSV 匯出網址（優先於本機 csv）
    source: entry.source || '',
    updated: entry.updated || '',
    template: entry.template || undefined, // 版型 id；未設時為 undefined（呼叫端退回預設 timeline）
  };
}

/**
 * 回傳 manifest 內所有任務名稱（依檔案順序）；失敗時回傳空陣列。
 * @returns {Promise<string[]>}
 */
export async function loadMissionNames() {
  try {
    const res = await fetch('missions/index.json');
    if (!res.ok) throw new Error('manifest fetch failed');
    return Object.keys(await res.json());
  } catch (e) {
    return [];
  }
}

/**
 * 載入指定任務的中繼資料（資料來源、更新日期、版型）。
 * @param {string} missionName
 * @returns {Promise<{source: string, updated: string, template: string|undefined}>} 失敗時回傳空字串
 */
export async function loadMeta(missionName) {
  try {
    const { source, updated, template } = await resolveEntry(missionName);
    return { source, updated, template };
  } catch (e) {
    return { source: '', updated: '', template: undefined };
  }
}

/**
 * 載入指定任務的 CSV 並回傳解析後的列與整張卡的單一值 meta。
 * 資料來源優先序：URL ?sheet= 覆寫 > manifest 的 sheet（Google Sheet）> 本機 CSV。
 * 抓 Google Sheet 失敗（離線/CORS/權限）時自動退回本機 CSV。
 *
 * 逐列欄位映射為節點交由各版型的 buildNodes 處理（此處不綁定特定版型）。
 * 單一值 meta（年代/標題/資料來源/更新時間）為各版型共用的「取整欄第一個非空值」。
 *
 * @param {string} missionName - 任務名稱（對應 missions/ 下的子目錄）
 * @param {string} [sheetUrlOverride] - 由 URL ?sheet= 傳入的覆寫網址
 * @returns {Promise<{records: Array<Object>, sheetMeta: {year: string, title: string, source: string, updated: string}}>}
 *   records 為 parseCSV 輸出（以標頭為 key 的物件陣列）；sheetMeta 取自欄位第一個非空值
 * @throws {Error} 當任務不存在或所有來源皆無法載入時，錯誤訊息包含任務名稱
 */
export async function loadRecords(missionName, sheetUrlOverride) {
  const { csv: csvFile, sheet } = missionName
    ? await resolveEntry(missionName)
    : { csv: '', sheet: '' };
  const sheetUrl = sheetUrlOverride || sheet;

  let csvText;
  // 1) 優先嘗試 Google Sheet（公開 CSV），失敗則退回本機 CSV
  if (sheetUrl) {
    try {
      // 加上時間戳記與 no-store，避免瀏覽器/CDN 快取舊資料（記者改完重整即更新）
      const bust = (sheetUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
      const res = await fetch(sheetUrl + bust, { cache: 'no-store' });
      if (!res.ok) throw new Error('sheet fetch failed');
      csvText = await res.text();
    } catch (e) {
      console.warn(`[csv-loader] Google Sheet 載入失敗，改用本機 CSV：`, e && e.message);
    }
  }

  // 2) 本機 CSV
  if (csvText === undefined) {
    if (!csvFile) {
      throw new Error(`無法載入資料：${missionName} 不存在`);
    }
    try {
      const res = await fetch(
        `missions/${encodeURIComponent(missionName)}/${encodeURIComponent(csvFile)}`
      );
      if (!res.ok) throw new Error('csv fetch failed');
      csvText = await res.text();
    } catch (e) {
      throw new Error(`無法載入資料：${missionName} 不存在`);
    }
  }

  const records = parseCSV(csvText);

  // 單一值 meta（年代/標題/資料來源/更新時間）：取整欄第一個非空值（各版型共用）
  const metaFrom = (...names) => {
    for (const r of records) {
      for (const n of names) {
        if (r[n] !== undefined && r[n] !== '') return r[n];
      }
    }
    return '';
  };
  const sheetMeta = {
    year: metaFrom('年代', '年'),
    title: metaFrom('標題', '主題', 'title'),
    source: metaFrom('資料來源', '來源', 'source'),
    updated: metaFrom('更新時間', '更新日期', 'updated'),
  };

  return { records, sheetMeta };
}
