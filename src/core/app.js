import { ICON_EXT_MAP, MIME_EXT_MAP } from '../config/file-mappings';
import JSZip from 'jszip';

export function runBatchDownloader() {
  'use strict';

  /**********************
   * 配置
   **********************/
  const BUTTON_ID = 'cau-batch-download-btn';
  const OVERLAY_ID = 'cau-download-overlay';
  const STYLE_ID = 'cau-download-style';

  /**********************
   * 状态
   **********************/
  let rootTree = null;
  let scanInProgress = false;
  let actionInProgress = false;
  let activeResourceOrigin = location.origin;
  const uiDocument = resolveUIDocument();

  function resolveUIDocument() {
    try {
      if (window.top && window.top !== window && window.top.document) {
        return window.top.document;
      }
    } catch {
      // ignore cross-origin access
    }
    return document;
  }

  /**********************
   * 基础工具
   **********************/
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function ensureStyle() {
    const hasLocalStyle = !!document.getElementById(STYLE_ID);
    const hasUIStyle = !!uiDocument.getElementById(STYLE_ID);
    if (hasLocalStyle && hasUIStyle) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BUTTON_ID} {
        margin-left: 10px;
        padding: 5px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        color: #fff;
        background: linear-gradient(135deg, #4f8cff, #3a6ff7);
        box-shadow: 0 4px 12px rgba(58,111,247,.25);
        font-size: 13px;
        transition: all .18s ease;
      }
      #${BUTTON_ID}:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(58,111,247,.35);
      }
      #${BUTTON_ID}[disabled] {
        cursor: not-allowed;
        opacity: .7;
        transform: none;
      }

      #${OVERLAY_ID} {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        background: rgba(10, 20, 35, .48);
        z-index: 2147483000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(2px);
      }

      #${OVERLAY_ID} .cau-modal {
        width: min(1080px, 96vw);
        height: min(84vh, 900px);
        background: #fff;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 18px 50px rgba(0, 0, 0, .22);
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      }

      #${OVERLAY_ID} .cau-header {
        padding: 18px 22px 14px;
        background: linear-gradient(135deg, #f7faff, #eef4ff);
        border-bottom: 1px solid #e8eef7;
      }

      #${OVERLAY_ID} .cau-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      #${OVERLAY_ID} .cau-title {
        font-size: 20px;
        font-weight: 700;
        color: #1f2d3d;
        margin: 0;
      }

      #${OVERLAY_ID} .cau-subtitle {
        margin-top: 6px;
        font-size: 13px;
        color: #667085;
      }

      #${OVERLAY_ID} .cau-close {
        border: none;
        background: #fff;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 18px;
        color: #4b5563;
        box-shadow: 0 2px 8px rgba(31,45,61,.08);
      }

      #${OVERLAY_ID} .cau-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        border-bottom: 1px solid #eef2f7;
        background: #fff;
      }

      #${OVERLAY_ID} .cau-toolbar .left,
      #${OVERLAY_ID} .cau-toolbar .right {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      #${OVERLAY_ID} .cau-toolbar .left {
        flex: 1;
      }

      #${OVERLAY_ID} .cau-btn {
        border: none;
        border-radius: 10px;
        padding: 9px 14px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: .18s ease;
      }

      #${OVERLAY_ID} .cau-btn.primary {
        color: #fff;
        background: linear-gradient(135deg, #4f8cff, #3a6ff7);
        box-shadow: 0 6px 14px rgba(58,111,247,.24);
      }

      #${OVERLAY_ID} .cau-btn.primary:hover {
        transform: translateY(-1px);
      }

      #${OVERLAY_ID} .cau-btn.secondary {
        color: #344054;
        background: #f5f7fb;
      }

      #${OVERLAY_ID} .cau-btn.secondary:hover {
        background: #edf2fa;
      }

      #${OVERLAY_ID} .cau-btn.ghost {
        color: #3a6ff7;
        background: #eef4ff;
      }

      #${OVERLAY_ID} .cau-btn[disabled] {
        opacity: .6;
        cursor: not-allowed;
        transform: none !important;
      }

      #${OVERLAY_ID} .cau-summary {
        display: flex;
        gap: 14px;
        align-items: center;
        flex-wrap: wrap;
        font-size: 13px;
        color: #475467;
      }

      #${OVERLAY_ID} .cau-tag {
        padding: 4px 10px;
        border-radius: 999px;
        background: #f2f6ff;
        color: #3555d6;
        font-weight: 600;
      }

      #${OVERLAY_ID} .cau-body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        background:
          linear-gradient(#fff, #fff) padding-box,
          linear-gradient(180deg, #f8fbff, #ffffff) border-box;
        padding: 16px 20px 20px;
      }

      #${OVERLAY_ID} .cau-tree {
        font-size: 14px;
        color: #1f2937;
      }

      #${OVERLAY_ID} .cau-tree ul {
        list-style: none;
        margin: 0;
        padding-left: 22px;
      }

      #${OVERLAY_ID} .cau-tree > ul {
        padding-left: 0;
      }

      #${OVERLAY_ID} .cau-tree li {
        margin: 4px 0;
      }

      #${OVERLAY_ID} .cau-node-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 32px;
        border-radius: 10px;
        padding: 4px 8px;
        transition: background .15s ease;
      }

      #${OVERLAY_ID} .cau-node-row:hover {
        background: #f6f9ff;
      }

      #${OVERLAY_ID} .cau-toggle {
        width: 18px;
        height: 18px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #667085;
        font-size: 12px;
        border-radius: 6px;
      }

      #${OVERLAY_ID} .cau-toggle:hover {
        background: #edf2fa;
      }

      #${OVERLAY_ID} .cau-toggle.placeholder {
        visibility: hidden;
        cursor: default;
      }

      #${OVERLAY_ID} .cau-node-row input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }

      #${OVERLAY_ID} .cau-icon {
        width: 18px;
        text-align: center;
        user-select: none;
      }

      #${OVERLAY_ID} .cau-name {
        flex: 1;
        min-width: 0;
        word-break: break-all;
      }

      #${OVERLAY_ID} .cau-meta {
        font-size: 12px;
        color: #98a2b3;
        white-space: nowrap;
      }

      #${OVERLAY_ID} .cau-folder > .cau-node-row .cau-name {
        font-weight: 600;
      }

      #${OVERLAY_ID} .cau-footer {
        padding: 14px 20px 18px;
        border-top: 1px solid #eef2f7;
        background: #fcfdff;
      }

      #${OVERLAY_ID} .cau-progress-text {
        font-size: 13px;
        color: #475467;
        margin-bottom: 8px;
      }

      #${OVERLAY_ID} .cau-progress {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: #e8eef7;
        overflow: hidden;
      }

      #${OVERLAY_ID} .cau-progress-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #4f8cff, #3a6ff7);
        transition: width .18s ease;
      }

      #${OVERLAY_ID} .cau-empty {
        color: #667085;
        text-align: center;
        padding: 36px 12px;
      }

      @media (max-width: 720px) {
        #${OVERLAY_ID} .cau-modal {
          width: 100%;
          height: 92vh;
          border-radius: 14px;
        }
        #${OVERLAY_ID} .cau-toolbar {
          padding: 12px 14px;
        }
        #${OVERLAY_ID} .cau-body {
          padding: 12px 14px 14px;
        }
        #${OVERLAY_ID} .cau-footer {
          padding: 12px 14px 14px;
        }
      }
    `;
    const localHead = document.head || document.documentElement;
    if (!hasLocalStyle) {
      localHead.appendChild(style);
    }

    if (!hasUIStyle && uiDocument !== document) {
      const uiStyle = uiDocument.createElement('style');
      uiStyle.id = STYLE_ID;
      uiStyle.textContent = style.textContent;
      const uiHead = uiDocument.head || uiDocument.documentElement;
      uiHead.appendChild(uiStyle);
    }
  }

  function sanitizeName(name) {
    return String(name || '')
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\.+$/, '') || '未命名';
  }

  function hasExtension(name) {
    const base = String(name || '').trim();
    if (!base) return false;
    const lastSlash = Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\'));
    const file = base.slice(lastSlash + 1);
    return /\.[A-Za-z0-9]{1,8}$/.test(file);
  }

  function getExtFromIconClass(iconClass) {
    if (!iconClass) return '';
    for (const key of Object.keys(ICON_EXT_MAP)) {
      if (iconClass.includes(key)) return ICON_EXT_MAP[key];
    }
    return '';
  }

  function getExtFromMime(mime) {
    if (!mime) return '';
    const normalized = mime.split(';')[0].trim().toLowerCase();
    return MIME_EXT_MAP[normalized] || '';
  }

  function decodeMaybeURIComponent(str) {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }

  function decodeContentDispositionFilename(header) {
    if (!header) return '';

    // RFC 5987: filename*=UTF-8''...
    let m = header.match(/filename\*\s*=\s*([^;]+)/i);
    if (m) {
      let value = m[1].trim().replace(/^UTF-8''/i, '').replace(/^['"]|['"]$/g, '');
      value = decodeMaybeURIComponent(value);
      return sanitizeName(value);
    }

    // filename="..."
    m = header.match(/filename\s*=\s*"([^"]+)"/i);
    if (m) {
      return sanitizeName(decodeMaybeURIComponent(m[1].trim()));
    }

    // filename=...
    m = header.match(/filename\s*=\s*([^;]+)/i);
    if (m) {
      return sanitizeName(decodeMaybeURIComponent(m[1].trim().replace(/^['"]|['"]$/g, '')));
    }

    return '';
  }

  function resolveFinalFilename(fileNode, headers) {
    const contentDisposition = headers.get('content-disposition') || '';
    const contentType = headers.get('content-type') || '';
    const cdName = decodeContentDispositionFilename(contentDisposition);

    const iconExt = getExtFromIconClass(fileNode.iconClass);
    const mimeExt = getExtFromMime(contentType);
    const fallbackExt = iconExt || mimeExt || '';

    let finalName = cdName || fileNode.name || '未命名';
    finalName = sanitizeName(finalName);

    if (!hasExtension(finalName) && fallbackExt) {
      finalName += fallbackExt;
    }

    return finalName;
  }

  async function fetchGBKText(url) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`页面请求失败：${res.status} ${res.statusText}`);
    }
    const buffer = await res.arrayBuffer();
    return new TextDecoder('gbk').decode(buffer);
  }

  function parseHTML(html) {
    return new DOMParser().parseFromString(html, 'text/html');
  }

  function isResourceListDocument(doc) {
    if (!doc) return false;
    return !!doc.querySelector('table.valuelist') && !!doc.querySelector('.subtitle .subright');
  }

  function findResourceContextInWindow(rootWin) {
    const queue = [rootWin];
    const visited = new Set();

    while (queue.length) {
      const win = queue.shift();
      if (!win || visited.has(win)) continue;
      visited.add(win);

      let doc;
      try {
        doc = win.document;
      } catch {
        continue;
      }
      if (!doc) continue;

      if (isResourceListDocument(doc)) {
        return { win, doc };
      }

      let frameCount = 0;
      try {
        frameCount = win.frames.length;
      } catch {
        frameCount = 0;
      }

      for (let i = 0; i < frameCount; i++) {
        try {
          queue.push(win.frames[i]);
        } catch {
          // ignore inaccessible frame
        }
      }
    }

    return null;
  }

  function resolveResourceContext() {
    const roots = [window];
    try {
      if (window.top && window.top !== window) {
        roots.push(window.top);
      }
    } catch {
      // ignore cross-origin top
    }

    for (const root of roots) {
      const found = findResourceContextInWindow(root);
      if (found) return found;
    }
    return null;
  }

  function parseFolderId(href, pageUrl = activeResourceOrigin) {
    try {
      const url = new URL(href, pageUrl);
      return url.searchParams.get('folderid') || '';
    } catch {
      return '';
    }
  }

  function fileSizeText(bytes) {
    if (!bytes || Number.isNaN(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = bytes;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /**********************
   * 扫描树构建
   **********************/
  function makeFolderNode(name, pathSegments = [], url = '') {
    return {
      type: 'folder',
      name: sanitizeName(name),
      pathSegments,
      url,
      children: [],
      parent: null,
      expanded: true,
      checked: false,
      indeterminate: false,
      el: null
    };
  }

  function makeFileNode({ name, pathSegments, downloadUrl, iconClass, fileid, resid, lid }) {
    let finalName = sanitizeName(name);
    const ext = getExtFromIconClass(iconClass);
    if (!hasExtension(finalName) && ext) {
      finalName += ext;
    }
    return {
      type: 'file',
      name: finalName,
      originalName: sanitizeName(name),
      pathSegments,
      downloadUrl,
      iconClass,
      fileid,
      resid,
      lid,
      parent: null,
      checked: false,
      indeterminate: false,
      el: null
    };
  }

  function appendChild(parent, child) {
    child.parent = parent;
    parent.children.push(child);
  }

  function getCurrentFolderNameFromPage(doc) {
    const rowFolderLink = doc.querySelector("table.valuelist a[href*='listview.jsp?acttype=enter']");
    if (rowFolderLink) return rowFolderLink.textContent.trim() || '当前目录';
    return '当前目录';
  }

  function extractRows(doc) {
    const table = doc.querySelector('table.valuelist');
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.filter(tr => tr.querySelector('td'));
  }

  function parseRowAsFolder(tr, pageUrl) {
    const folderLink = tr.querySelector("a[href*='listview.jsp?acttype=enter']");
    if (!folderLink) return null;
    const href = folderLink.getAttribute('href') || '';
    if (!href.includes('folderid=')) return null;

    const name = folderLink.textContent.trim();
    if (!name || name === '返回上一级目录') return null;

    const fullUrl = new URL(href, pageUrl).href;
    const folderId = parseFolderId(fullUrl, pageUrl);
    if (!folderId) return null;

    return {
      folderId,
      name,
      url: fullUrl
    };
  }

  function parseRowAsFile(tr, pageUrl) {
    const fileLink = tr.querySelector("a[href*='download_preview.jsp']");
    if (!fileLink) return null;

    const href = fileLink.getAttribute('href') || '';
    const urlObj = new URL(href, pageUrl);

    const fileid = urlObj.searchParams.get('fileid') || '';
    const resid = urlObj.searchParams.get('resid') || '';
    const lid = urlObj.searchParams.get('lid') || '';

    if (!fileid || !resid || !lid) return null;

    const iconSpan = tr.querySelector('span[class*="ico_"]');
    const iconClass = iconSpan ? iconSpan.className : '';

    const downloadUrl = `${activeResourceOrigin}/meol/common/script/download.jsp?fileid=${encodeURIComponent(fileid)}&resid=${encodeURIComponent(resid)}&lid=${encodeURIComponent(lid)}`;

    return {
      name: fileLink.textContent.trim() || '未命名',
      downloadUrl,
      iconClass,
      fileid,
      resid,
      lid
    };
  }

  async function scanFolderPage(pageUrl, folderName, pathSegments, visitedFolderIds) {
    const html = await fetchGBKText(pageUrl);
    const doc = parseHTML(html);
    const folderNode = makeFolderNode(folderName, pathSegments, pageUrl);

    const rows = extractRows(doc);

    for (const tr of rows) {
      const fileInfo = parseRowAsFile(tr, pageUrl);
      if (fileInfo) {
        appendChild(folderNode, makeFileNode({
          ...fileInfo,
          pathSegments: [...pathSegments]
        }));
        continue;
      }

      const folderInfo = parseRowAsFolder(tr, pageUrl);
      if (folderInfo) {
        if (visitedFolderIds.has(folderInfo.folderId)) continue;
        visitedFolderIds.add(folderInfo.folderId);

        const childNode = await scanFolderPage(
          folderInfo.url,
          folderInfo.name,
          [...pathSegments, sanitizeName(folderInfo.name)],
          visitedFolderIds
        );
        appendChild(folderNode, childNode);
      }
    }

    return folderNode;
  }

  async function buildTreeFromCurrentPage(currentUrl) {
    const currentUrlObj = new URL(currentUrl);
    const currentFolderId = currentUrlObj.searchParams.get('folderid') || '0';

    const currentHTML = await fetchGBKText(currentUrl);
    const currentDoc = parseHTML(currentHTML);

    const root = makeFolderNode(
      currentFolderId === '0' ? '课程资源' : '当前目录',
      [],
      currentUrl
    );

    const rows = extractRows(currentDoc);
    const visited = new Set();
    if (currentFolderId) visited.add(currentFolderId);

    for (const tr of rows) {
      const fileInfo = parseRowAsFile(tr, currentUrl);
      if (fileInfo) {
        appendChild(root, makeFileNode({
          ...fileInfo,
          pathSegments: []
        }));
        continue;
      }

      const folderInfo = parseRowAsFolder(tr, currentUrl);
      if (folderInfo) {
        if (visited.has(folderInfo.folderId)) continue;
        visited.add(folderInfo.folderId);

        const childNode = await scanFolderPage(
          folderInfo.url,
          folderInfo.name,
          [sanitizeName(folderInfo.name)],
          visited
        );
        appendChild(root, childNode);
      }
    }

    return root;
  }

  function walkTree(node, fn) {
    fn(node);
    if (node.type === 'folder') {
      for (const child of node.children) {
        walkTree(child, fn);
      }
    }
  }

  function getAllFiles(node) {
    const files = [];
    walkTree(node, n => {
      if (n.type === 'file') files.push(n);
    });
    return files;
  }

  function getSelectedFiles(node) {
    const files = [];
    walkTree(node, n => {
      if (n.type === 'file' && n.checked) files.push(n);
    });
    return files;
  }

  function countFolders(node) {
    let count = 0;
    walkTree(node, n => {
      if (n.type === 'folder') count++;
    });
    return count;
  }

  /**********************
   * 选择联动
   **********************/
  function setNodeStateDeep(node, checked) {
    node.checked = checked;
    node.indeterminate = false;
    if (node.type === 'folder') {
      for (const child of node.children) {
        setNodeStateDeep(child, checked);
      }
    }
  }

  function refreshAncestors(node) {
    let current = node.parent;
    while (current) {
      const children = current.children || [];
      const allChecked = children.length > 0 && children.every(c => c.checked && !c.indeterminate);
      const noneChecked = children.every(c => !c.checked && !c.indeterminate);

      current.checked = allChecked;
      current.indeterminate = !allChecked && !noneChecked;

      current = current.parent;
    }
  }

  function syncCheckboxDOM(node) {
    if (!node || !node.el) return;

    const checkbox = node.el.querySelector(':scope > .cau-node-row input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = !!node.checked;
      checkbox.indeterminate = !!node.indeterminate;
    }

    if (node.type === 'folder') {
      const childrenWrap = node.el.querySelector(':scope > ul');
      if (childrenWrap) {
        childrenWrap.style.display = node.expanded ? '' : 'none';
      }

      const toggle = node.el.querySelector(':scope > .cau-node-row .cau-toggle');
      if (toggle && !toggle.classList.contains('placeholder')) {
        toggle.textContent = node.expanded ? '▼' : '▶';
      }

      for (const child of node.children) {
        syncCheckboxDOM(child);
      }
    }
  }

  function updateAllDOM(root) {
    syncCheckboxDOM(root);
    updateSummary(root);
  }

  /**********************
   * UI
   **********************/
  function removeOverlay() {
    const el = uiDocument.getElementById(OVERLAY_ID);
    if (el) el.remove();
  }

  function updateProgress(text, percent = 0) {
    const textEl = uiDocument.querySelector(`#${OVERLAY_ID} .cau-progress-text`);
    const barEl = uiDocument.querySelector(`#${OVERLAY_ID} .cau-progress-bar`);
    if (textEl) textEl.textContent = text;
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function updateSummary(root) {
    const allFiles = getAllFiles(root);
    const selectedFiles = getSelectedFiles(root);
    const summaryEl = uiDocument.querySelector(`#${OVERLAY_ID} .cau-summary`);
    if (!summaryEl) return;

    summaryEl.innerHTML = `
      <span class="cau-tag">目录 ${countFolders(root) - 1}</span>
      <span class="cau-tag">文件 ${allFiles.length}</span>
      <span class="cau-tag">已选 ${selectedFiles.length}</span>
    `;
  }

  function createNodeElement(node) {
    const li = uiDocument.createElement('li');
    li.className = node.type === 'folder' ? 'cau-folder' : 'cau-file';
    node.el = li;

    const row = uiDocument.createElement('div');
    row.className = 'cau-node-row';

    const toggle = uiDocument.createElement('button');
    toggle.type = 'button';
    toggle.className = 'cau-toggle';
    if (node.type === 'folder' && node.children.length > 0) {
      toggle.textContent = node.expanded ? '▼' : '▶';
      toggle.addEventListener('click', () => {
        node.expanded = !node.expanded;
        syncCheckboxDOM(node);
      });
    } else {
      toggle.classList.add('placeholder');
      toggle.textContent = '•';
    }

    const checkbox = uiDocument.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!node.checked;
    checkbox.indeterminate = !!node.indeterminate;
    checkbox.addEventListener('change', () => {
      if (node.type === 'folder') {
        setNodeStateDeep(node, checkbox.checked);
      } else {
        node.checked = checkbox.checked;
        node.indeterminate = false;
      }
      refreshAncestors(node);
      updateAllDOM(rootTree);
    });

    const icon = uiDocument.createElement('span');
    icon.className = 'cau-icon';
    icon.textContent = node.type === 'folder' ? '📁' : '📄';

    const name = uiDocument.createElement('span');
    name.className = 'cau-name';
    name.innerHTML = escapeHTML(node.name);

    const meta = uiDocument.createElement('span');
    meta.className = 'cau-meta';
    meta.textContent = node.type === 'folder'
      ? `${node.children.length} 项`
      : (getExtFromIconClass(node.iconClass) || '');

    row.appendChild(toggle);
    row.appendChild(checkbox);
    row.appendChild(icon);
    row.appendChild(name);
    row.appendChild(meta);
    li.appendChild(row);

    if (node.type === 'folder' && node.children.length > 0) {
      const ul = uiDocument.createElement('ul');
      if (!node.expanded) ul.style.display = 'none';
      for (const child of node.children) {
        ul.appendChild(createNodeElement(child));
      }
      li.appendChild(ul);
    }

    return li;
  }

  function renderTree(root) {
    const treeContainer = uiDocument.querySelector(`#${OVERLAY_ID} .cau-tree`);
    if (!treeContainer) return;

    treeContainer.innerHTML = '';
    if (!root.children.length) {
      treeContainer.innerHTML = `<div class="cau-empty">未扫描到任何资源。</div>`;
      return;
    }

    const ul = uiDocument.createElement('ul');
    ul.appendChild(createNodeElement(root));
    treeContainer.appendChild(ul);

    syncCheckboxDOM(root);
    updateSummary(root);
  }

  function createOverlay() {
    removeOverlay();
    ensureStyle();

    const overlay = uiDocument.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
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

    overlay.querySelector('.cau-close').addEventListener('click', () => {
      if (actionInProgress) return;
      removeOverlay();
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay && !actionInProgress) {
        removeOverlay();
      }
    });

    overlay.querySelector('[data-action="select-all"]').addEventListener('click', () => {
      setNodeStateDeep(rootTree, true);
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="unselect-all"]').addEventListener('click', () => {
      setNodeStateDeep(rootTree, false);
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="expand-all"]').addEventListener('click', () => {
      walkTree(rootTree, n => {
        if (n.type === 'folder') n.expanded = true;
      });
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="collapse-all"]').addEventListener('click', () => {
      walkTree(rootTree, n => {
        if (n.type === 'folder' && n !== rootTree) n.expanded = false;
      });
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="download-zip"]').addEventListener('click', async () => {
      await handleDownloadZip();
    });

    overlay.querySelector('[data-action="download-folder"]').addEventListener('click', async () => {
      await handleDownloadFolder();
    });

    const mountRoot = uiDocument.body || uiDocument.documentElement;
    mountRoot.appendChild(overlay);
  }

  function setActionButtonsDisabled(disabled) {
    const buttons = uiDocument.querySelectorAll(`#${OVERLAY_ID} .cau-btn, #${OVERLAY_ID} .cau-close`);
    buttons.forEach(btn => {
      btn.disabled = disabled;
    });
  }

  /**********************
   * 下载实现
   **********************/
  async function fetchFileBlobAndName(fileNode) {
    const res = await fetch(fileNode.downloadUrl, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`${fileNode.name} 下载失败：${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    const finalName = resolveFinalFilename(fileNode, res.headers);
    return { blob, finalName };
  }

  function parseSizeFromHeaders(headers) {
    const contentRange = headers.get('content-range') || '';
    const m = contentRange.match(/\/(\d+)\s*$/);
    if (m) {
      const total = Number.parseInt(m[1], 10);
      if (Number.isFinite(total) && total >= 0) return total;
    }

    const length = Number.parseInt(headers.get('content-length') || '', 10);
    if (Number.isFinite(length) && length >= 0) return length;
    return null;
  }

  async function fetchFileSize(fileNode) {
    // Some THEOL deployments don't expose real size for HEAD on download.jsp,
    // so we try HEAD first, then fall back to GET Range probing.
    try {
      const headRes = await fetch(fileNode.downloadUrl, {
        method: 'HEAD',
        credentials: 'include'
      });
      if (headRes.ok) {
        const headSize = parseSizeFromHeaders(headRes.headers);
        if (typeof headSize === 'number' && headSize > 0) return headSize;
      }
    } catch {
      // continue to range probe
    }

    try {
      const rangeRes = await fetch(fileNode.downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Range: 'bytes=0-0'
        }
      });
      if (!rangeRes.ok) return null;
      const size = parseSizeFromHeaders(rangeRes.headers);
      if (rangeRes.body) {
        try {
          await rangeRes.body.cancel();
        } catch {
          // ignore stream cancel errors
        }
      }
      return typeof size === 'number' && size > 0 ? size : null;
    } catch {
      return null;
    }
  }

  async function estimateSelectedFilesSize(selectedFiles) {
    let knownTotalBytes = 0;
    let unknownCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const size = await fetchFileSize(selectedFiles[i]);
      if (typeof size === 'number') {
        knownTotalBytes += size;
      } else {
        unknownCount += 1;
      }
      updateProgress(`正在统计大小…（${i + 1}/${selectedFiles.length}）`, (i + 1) / selectedFiles.length * 100);
    }

    return { knownTotalBytes, unknownCount };
  }

  async function confirmBeforeDownload(selectedFiles) {
    updateProgress('正在统计待下载大小…', 0);
    const { knownTotalBytes, unknownCount } = await estimateSelectedFilesSize(selectedFiles);

    const countText = `文件数量：${selectedFiles.length}`;
    const sizeText = unknownCount > 0
      ? `可统计大小：${fileSizeText(knownTotalBytes) || '未知'}（另有 ${unknownCount} 个文件大小未知）`
      : `预计大小：${fileSizeText(knownTotalBytes) || '0 B'}`;

    const confirmFn = (uiDocument.defaultView && uiDocument.defaultView.confirm)
      ? uiDocument.defaultView.confirm.bind(uiDocument.defaultView)
      : window.confirm.bind(window);

    return confirmFn(`确认开始下载？\n\n${countText}\n${sizeText}`);
  }

  async function handleDownloadZip() {
    if (actionInProgress) return;

    const selectedFiles = getSelectedFiles(rootTree);
    if (!selectedFiles.length) {
      alert('请先勾选至少一个文件或目录。');
      return;
    }

    const ok = await confirmBeforeDownload(selectedFiles);
    if (!ok) {
      updateProgress('已取消。', 0);
      return;
    }

    actionInProgress = true;
    setActionButtonsDisabled(true);
    updateProgress('正在准备 ZIP 组件…', 0);

    try {
      const zip = new JSZip();
      let done = 0;
      let totalBytes = 0;

      for (const file of selectedFiles) {
        updateProgress(`下载中：${file.name}（${done + 1}/${selectedFiles.length}）`, done / selectedFiles.length * 100);
        const { blob, finalName } = await fetchFileBlobAndName(file);
        totalBytes += blob.size || 0;

        const relativePath = [...file.pathSegments, finalName]
          .map(sanitizeName)
          .join('/');

        zip.file(relativePath, blob);
        done += 1;
      }

      updateProgress('正在生成 ZIP，请稍候…', 96);
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `课程资源_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);

      updateProgress(`完成：已打包 ${selectedFiles.length} 个文件，原始数据约 ${fileSizeText(totalBytes)}`, 100);
    } catch (err) {
      console.error(err);
      alert(`ZIP 下载失败：${err.message || err}`);
      updateProgress('下载失败。', 0);
    } finally {
      actionInProgress = false;
      setActionButtonsDisabled(false);
    }
  }

  async function getOrCreateSubdir(dirHandle, folderName) {
    return await dirHandle.getDirectoryHandle(sanitizeName(folderName), { create: true });
  }

  async function writeBlobToFileSystem(rootDirHandle, pathSegments, fileName, blob) {
    let dir = rootDirHandle;
    for (const seg of pathSegments) {
      dir = await getOrCreateSubdir(dir, seg);
    }
    const fileHandle = await dir.getFileHandle(sanitizeName(fileName), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function fallbackFlatDownload(selectedFiles) {
    let done = 0;
    for (const file of selectedFiles) {
      updateProgress(`下载中：${file.name}（${done + 1}/${selectedFiles.length}）`, done / selectedFiles.length * 100);
      const { blob, finalName } = await fetchFileBlobAndName(file);
      const nestedDownloadName = [...file.pathSegments, finalName]
        .map(seg => sanitizeName(seg))
        .filter(Boolean)
        .join('/');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nestedDownloadName || sanitizeName(finalName) || 'download.bin';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
      done += 1;
      await sleep(200);
    }
    updateProgress(`完成：已创建 ${selectedFiles.length} 个下载任务（浏览器若支持会按目录结构保存）`, 100);
  }

  async function handleDownloadFolder() {
    if (actionInProgress) return;

    const selectedFiles = getSelectedFiles(rootTree);
    if (!selectedFiles.length) {
      alert('请先勾选至少一个文件或目录。');
      return;
    }

    const ok = await confirmBeforeDownload(selectedFiles);
    if (!ok) {
      updateProgress('已取消。', 0);
      return;
    }

    actionInProgress = true;
    setActionButtonsDisabled(true);

    try {
      if (!window.showDirectoryPicker) {
        updateProgress('浏览器不支持直接写入本地文件夹，改为自动逐个创建下载任务…', 0);
        await fallbackFlatDownload(selectedFiles);
        return;
      }

      updateProgress('请选择要保存到的本地文件夹…', 0);
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      let done = 0;
      let totalBytes = 0;

      for (const file of selectedFiles) {
        updateProgress(`下载并写入：${file.name}（${done + 1}/${selectedFiles.length}）`, done / selectedFiles.length * 100);
        const { blob, finalName } = await fetchFileBlobAndName(file);
        totalBytes += blob.size || 0;
        await writeBlobToFileSystem(dirHandle, file.pathSegments, finalName, blob);
        done += 1;
      }

      updateProgress(`完成：已写入 ${selectedFiles.length} 个文件，数据约 ${fileSizeText(totalBytes)}`, 100);
    } catch (err) {
      if (err && err.name === 'AbortError') {
        updateProgress('已取消。', 0);
      } else {
        console.error(err);
        alert(`下载到本地文件夹失败：${err.message || err}`);
        updateProgress('下载失败。', 0);
      }
    } finally {
      actionInProgress = false;
      setActionButtonsDisabled(false);
    }
  }

  /**********************
   * 主流程
   **********************/
  function setMainButtonLoading(loading, text = '批量下载') {
    const ctx = resolveResourceContext();
    const btn = ctx ? ctx.doc.getElementById(BUTTON_ID) : null;
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? text : '批量下载';
  }

  async function openPanelAndScan() {
    if (scanInProgress) return;

    scanInProgress = true;
    setMainButtonLoading(true, '扫描中…');
    createOverlay();
    updateProgress('正在递归扫描课程资源…', 8);

    try {
      const context = resolveResourceContext();
      if (!context) {
        throw new Error('未找到课程资源列表页面。请先进入“课程资源”列表页后再试。');
      }

      activeResourceOrigin = new URL(context.win.location.href).origin;
      rootTree = await buildTreeFromCurrentPage(context.win.location.href);
      renderTree(rootTree);

      // 默认把根目录展开，但不默认全选
      rootTree.expanded = true;
      syncCheckboxDOM(rootTree);

      const files = getAllFiles(rootTree);
      updateProgress(`扫描完成：发现 ${files.length} 个文件。`, 100);
    } catch (err) {
      console.error(err);
      const tree = uiDocument.querySelector(`#${OVERLAY_ID} .cau-tree`);
      if (tree) {
        tree.innerHTML = `<div class="cau-empty">扫描失败：${escapeHTML(err.message || String(err))}</div>`;
      }
      updateProgress('扫描失败。', 0);
    } finally {
      scanInProgress = false;
      setMainButtonLoading(false);
    }
  }

  function injectButton() {
    ensureStyle();
    const context = resolveResourceContext();
    if (!context) return;

    if (!context.doc.getElementById(STYLE_ID)) {
      const sourceStyle = document.getElementById(STYLE_ID) || uiDocument.getElementById(STYLE_ID);
      if (sourceStyle) {
        const copiedStyle = context.doc.createElement('style');
        copiedStyle.id = STYLE_ID;
        copiedStyle.textContent = sourceStyle.textContent || '';
        (context.doc.head || context.doc.documentElement).appendChild(copiedStyle);
      }
    }

    if (context.doc.getElementById(BUTTON_ID)) return;

    const target = context.doc.querySelector('.subtitle .subright');
    if (!target) return;

    const btn = context.doc.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.textContent = '批量下载';
    btn.addEventListener('click', openPanelAndScan);

    target.appendChild(btn);
  }

  function init() {
    injectButton();
    setInterval(injectButton, 1500);
  }

  init();
}
