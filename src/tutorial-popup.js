export function initTutorialPopup() {
  if (document.getElementById('tutorial-dialog')) return;

  const trigger = document.getElementById('btn-tutorial');
  if (!trigger) return;

  const dialog = buildDialog();
  document.body.appendChild(dialog);

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      dialog.showModal();
    } catch (_) {
      window.open('tutorial.html');
    }
  });

  dialog.querySelector('#tutorial-close').addEventListener('click', () => dialog.close());

  // Clicking the ::backdrop pseudo-element fires the click event on the <dialog> itself.
  // Checking event.target === dialog distinguishes backdrop from content clicks.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  // All close paths (Escape, button, backdrop) fire the 'close' event — return focus here.
  dialog.addEventListener('close', () => {
    document.getElementById('btn-tutorial')?.focus();
  });
}

function buildDialog() {
  const dialog = document.createElement('dialog');
  dialog.id = 'tutorial-dialog';
  dialog.setAttribute('aria-labelledby', 'tutorial-dialog-title');
  dialog.innerHTML = `
    <div class="tutorial-dialog-inner">
      <button id="tutorial-close" class="tutorial-dialog-close" aria-label="關閉教學">×</button>
      <h2 id="tutorial-dialog-title" class="tutorial-dialog-heading">使用教學</h2>

      <div class="tutorial-tabs" role="tablist">
        <button class="tutorial-tab is-active" role="tab" aria-selected="true"  data-panel="steps">操作流程</button>
        <button class="tutorial-tab"            role="tab" aria-selected="false" data-panel="templates">版型說明</button>
      </div>

      <div class="tutorial-panel" id="tutorial-panel-steps">
        <ol class="tutorial-dialog-steps">
          <li>
            <strong>選擇分頁</strong>
            <p>在 Dashboard 從「選擇分頁」下拉選單選擇要產出的大事記，點「開啟」。</p>
          </li>
          <li>
            <strong>選擇版型與模式</strong>
            <p>在圖卡頁從工具列選擇版型（版型一／二／三），再選「切分」或「不切分」模式。</p>
          </li>
          <li>
            <strong>匯出</strong>
            <p>確認預覽無誤後，點工具列右側的「匯出」，圖卡將自動下載至電腦。</p>
          </li>
        </ol>
      </div>

      <div class="tutorial-panel is-hidden" id="tutorial-panel-templates">
        <div class="tutorial-template-list">

          <div class="tutorial-template-item">
            <div class="tutorial-template-badge t1">版型一</div>
            <div class="tutorial-template-body">
              <strong>時間軸</strong>
              <p>跨年度的日期事件列表，每個節點呈現一個日期加一段說明。</p>
              <div class="tutorial-cols">
                <span class="col-tag required">年代</span>
                <span class="col-tag required">日期</span>
                <span class="col-tag required">內文</span>
              </div>
            </div>
          </div>

          <div class="tutorial-template-item">
            <div class="tutorial-template-badge t2">版型二</div>
            <div class="tutorial-template-body">
              <strong>標題時間軸</strong>
              <p>在版型一基礎上，加入圖卡大標、節點小標及資料來源。</p>
              <div class="tutorial-cols">
                <span class="col-tag required">年代</span>
                <span class="col-tag required">標題</span>
                <span class="col-tag required">時間</span>
                <span class="col-tag">小標</span>
                <span class="col-tag">內文</span>
                <span class="col-tag">資料來源</span>
                <span class="col-tag">更新時間</span>
              </div>
            </div>
          </div>

          <div class="tutorial-template-item">
            <div class="tutorial-template-badge t3">版型三</div>
            <div class="tutorial-template-body">
              <strong>時間小標</strong>
              <p>同一天有多個時刻精度事件（如 22:23），時刻與小標顯示在同一行。</p>
              <div class="tutorial-cols">
                <span class="col-tag required">年代</span>
                <span class="col-tag required">標題</span>
                <span class="col-tag required" title="格式：月日HH:MM，例如 12月3日22:23">時間 ⁎</span>
                <span class="col-tag">小標</span>
                <span class="col-tag">內文</span>
                <span class="col-tag">資料來源</span>
                <span class="col-tag">更新時間</span>
              </div>
              <p class="tutorial-col-note">⁎ 時間欄須含時刻，例如「12月3日22:23」</p>
            </div>
          </div>

        </div>
        <p class="tutorial-col-legend"><span class="col-tag required">必填</span> 欄位名稱須完全符合；年代欄亦接受「年」或「西元」。</p>
      </div>

      <footer class="tutorial-dialog-footer">
        <a href="tutorial.html" id="tutorial-dev-link" class="tutorial-dev-link">開發者說明 →</a>
      </footer>
    </div>
  `;

  dialog.querySelectorAll('.tutorial-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const panelId = tab.dataset.panel;
      dialog.querySelectorAll('.tutorial-tab').forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      dialog.querySelectorAll('.tutorial-panel').forEach((p) => {
        p.classList.toggle('is-hidden', p.id !== `tutorial-panel-${panelId}`);
      });
    });
  });

  return dialog;
}
