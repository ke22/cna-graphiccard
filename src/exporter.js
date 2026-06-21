// JPG 匯出模組
// 依序對每張 .card 呼叫 html2canvas，以 2x scale 截圖並觸發下載。

const DEFAULT_LABEL = '匯出所有卡片';

/**
 * 觸發單一 canvas 的 JPG 下載。
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
function downloadCanvas(canvas, filename) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/jpeg');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 依序匯出頁面上所有 .card 為 JPG（card-{n}.jpg）。
 * 過程中更新按鈕文字以提供進度回饋。
 * @param {HTMLButtonElement} [button] - 進度回饋按鈕（可選）
 * @returns {Promise<void>}
 */
export async function exportCards(button) {
  if (!window.html2canvas) {
    // 防禦：理論上按鈕已被 disabled，但仍避免未捕獲例外
    return;
  }

  const cards = [...document.querySelectorAll('.card')];
  const total = cards.length;
  if (total === 0) return;

  const btn = button || document.getElementById('btn-export');
  if (btn) btn.disabled = true;

  try {
    document.body.classList.add('is-exporting');
    for (let i = 0; i < total; i++) {
      const canvas = await window.html2canvas(cards[i], {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      downloadCanvas(canvas, `card-${i + 1}.jpg`);
      if (btn) btn.textContent = `匯出中… (${i + 1}/${total})`;
    }
  } finally {
    document.body.classList.remove('is-exporting');
    if (btn) {
      btn.textContent = DEFAULT_LABEL;
      btn.disabled = false;
    }
  }
}

/**
 * 初始化匯出按鈕：綁定點擊事件；若 html2canvas 不可用則停用按鈕。
 * @param {HTMLButtonElement} button
 */
export function setupExport(button) {
  if (!button) return;
  if (!window.html2canvas) {
    button.disabled = true;
    button.title = '請在 Chrome/Firefox 中開啟';
    return;
  }
  button.addEventListener('click', () => exportCards(button));
}
