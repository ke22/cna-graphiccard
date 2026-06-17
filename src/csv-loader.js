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
 * 支援兩種格式：字串（僅 CSV 檔名）或物件 `{csv, source, updated}`。
 * @param {string} missionName
 * @returns {Promise<{csv: string, source: string, updated: string}>}
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
    return { csv: entry, sheet: '', source: '', updated: '' };
  }
  return {
    csv: entry.csv || '',
    sheet: entry.sheet || '', // Google Sheet 公開 CSV 匯出網址（優先於本機 csv）
    source: entry.source || '',
    updated: entry.updated || '',
  };
}

/**
 * 載入指定任務的中繼資料（資料來源、更新日期）。
 * @param {string} missionName
 * @returns {Promise<{source: string, updated: string}>} 失敗時回傳空字串
 */
export async function loadMeta(missionName) {
  try {
    const { source, updated } = await resolveEntry(missionName);
    return { source, updated };
  } catch (e) {
    return { source: '', updated: '' };
  }
}

/**
 * 載入指定任務的 CSV 並回傳節點陣列。
 * 資料來源優先序：URL ?sheet= 覆寫 > manifest 的 sheet（Google Sheet）> 本機 CSV。
 * 抓 Google Sheet 失敗（離線/CORS/權限）時自動退回本機 CSV。
 *
 * 版型一欄位：年代 / 時間 / 內文（標頭別名：年代|年、時間|日期、內文|內容）。
 * 年代欄可省略（回傳空字串，由呼叫端以任務名稱推算）。
 *
 * @param {string} missionName - 任務名稱（對應 missions/ 下的子目錄）
 * @param {string} [sheetUrlOverride] - 由 URL ?sheet= 傳入的覆寫網址
 * @returns {Promise<{nodes: Array<{year: string, date: string, content: string}>, sheetMeta: {year: string, title: string, source: string, updated: string}}>}
 *   nodes 為時間軸節點（year 已向下填充）；sheetMeta 為整張卡的單一值（取自欄位第一個非空值）
 * @throws {Error} 當任務不存在或所有來源皆無法載入時，錯誤訊息包含任務名稱
 */
export async function loadNodes(missionName, sheetUrlOverride) {
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
  const hasYear = records.some((r) => r['年代'] !== undefined || r['年'] !== undefined);

  // 逐列取時間/內文（版型一：年代/時間/內文，相容舊格式 日期/內容）
  // 年代向下填充：年代欄只需在變動的那一列填值，其餘列沿用上一個年代
  let carriedYear = '';
  const nodes = records.map((r) => {
    const pick = (...names) => {
      for (const n of names) if (r[n] !== undefined) return r[n];
      return undefined;
    };
    const keys = Object.keys(r);
    const rawYear = pick('年代', '年');
    if (rawYear) carriedYear = rawYear;
    const date = pick('時間', '日期') || r[keys[hasYear ? 1 : 0]] || '';
    const content = pick('內文', '內容') || r[keys[hasYear ? 2 : 1]] || '';
    return { year: carriedYear, date, content };
  });

  // 單一值 meta（年代/標題/資料來源/更新時間）：取整欄第一個非空值
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

  return { nodes, sheetMeta };
}
