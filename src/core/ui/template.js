export const OVERLAY_TEMPLATE_HTML = `
  <div class="cau-modal">
    <div class="cau-header">
      <div class="cau-title-row">
        <h2 class="cau-title">课程资源批量下载</h2>
        <button type="button" class="cau-close" title="关闭">✕</button>
      </div>
      <div class="cau-subtitle">自动递归目录、树状勾选、补全常见后缀、支持 ZIP 或按原目录结构保存到文件夹。</div>
    </div>

    <div class="cau-toolbar">
      <div class="left">
        <button type="button" class="cau-btn secondary" data-action="select-all">全选</button>
        <button type="button" class="cau-btn secondary" data-action="unselect-all">清空</button>
        <button type="button" class="cau-btn secondary" data-action="expand-all">展开全部</button>
        <button type="button" class="cau-btn secondary" data-action="collapse-all">收起全部</button>
      </div>
      <div class="right cau-summary"></div>
    </div>

    <div class="cau-body">
      <div class="cau-tree">
        <div class="cau-empty">正在扫描课程资源，请稍候…</div>
      </div>
    </div>

    <div class="cau-footer">
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          <button type="button" class="cau-btn primary" data-action="download-zip">下载压缩包 ZIP</button>
          <button type="button" class="cau-btn ghost" data-action="download-folder">下载到本地文件夹</button>
        </div>
        <div style="font-size:12px;color:#667085;">“下载到本地文件夹”需要 Chromium 系浏览器支持文件系统访问 API。</div>
      </div>
      <div class="cau-progress-text">等待操作…</div>
      <div class="cau-progress"><div class="cau-progress-bar"></div></div>
    </div>
  </div>
`;
