export const OVERLAY_TEMPLATE_HTML = `
  <div class="theol-modal">
    <div class="theol-header">
      <div class="theol-title-row">
        <h2 class="theol-title">课程资源批量下载</h2>
        <button type="button" class="theol-close" title="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="theol-subtitle">自动递归目录、树状勾选、补全常见后缀、支持 ZIP 或按原目录结构保存到文件夹。</div>
    </div>

    <div class="theol-toolbar">
      <div class="left">
        <button type="button" class="theol-btn secondary" data-action="select-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          全选
        </button>
        <button type="button" class="theol-btn secondary" data-action="unselect-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
          清空
        </button>
        <button type="button" class="theol-btn secondary" data-action="expand-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>
          展开全部
        </button>
        <button type="button" class="theol-btn secondary" data-action="collapse-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 11 12 6 17 11"></polyline><polyline points="7 18 12 13 17 18"></polyline></svg>
          收起全部
        </button>
      </div>
      <div class="right theol-summary"></div>
    </div>

    <div class="theol-body">
      <div class="theol-tree">
        <div class="theol-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 12px; display: block; opacity: 0.5;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          正在扫描课程资源，请稍候…
        </div>
      </div>
    </div>

    <div class="theol-footer">
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          <button type="button" class="theol-btn primary" data-action="download-zip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            下载压缩包 ZIP
          </button>
          <button type="button" class="theol-btn ghost" data-action="download-folder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            下载到本地文件夹
          </button>
        </div>
      </div>
      <div class="theol-progress-text">
        <span>等待操作…</span>
        <span class="theol-progress-percent">0%</span>
      </div>
      <div class="theol-progress"><div class="theol-progress-bar"></div></div>
    </div>
  </div>
`;
