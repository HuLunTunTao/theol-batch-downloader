export const OVERLAY_TEMPLATE_HTML = `
  <div class="theol-modal">
    <div class="theol-header">
      <div class="theol-title-row">
        <h2 class="theol-title">课程资源批量下载</h2>
        <button type="button" class="theol-close" title="关闭">✕</button>
      </div>
      <div class="theol-subtitle">自动递归目录、树状勾选、补全常见后缀、支持 ZIP 或按原目录结构保存到文件夹。</div>
    </div>

    <div class="theol-toolbar">
      <div class="left">
        <button type="button" class="theol-btn secondary" data-action="select-all">全选</button>
        <button type="button" class="theol-btn secondary" data-action="unselect-all">清空</button>
        <button type="button" class="theol-btn secondary" data-action="expand-all">展开全部</button>
        <button type="button" class="theol-btn secondary" data-action="collapse-all">收起全部</button>
      </div>
      <div class="right theol-summary"></div>
    </div>

    <div class="theol-body">
      <div class="theol-tree">
        <div class="theol-empty">正在扫描课程资源，请稍候…</div>
      </div>
    </div>

    <div class="theol-footer">
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          <button type="button" class="theol-btn primary" data-action="download-zip">下载压缩包 ZIP</button>
          <button type="button" class="theol-btn ghost" data-action="download-folder">下载到本地文件夹</button>
        </div>
        <div style="font-size:12px;color:#667085;">“下载到本地文件夹”需要 Chromium 系浏览器支持文件系统访问 API。</div>
      </div>
      <div class="theol-progress-text">等待操作…</div>
      <div class="theol-progress"><div class="theol-progress-bar"></div></div>
    </div>
  </div>
`;
