import { resolveResourceContext, resolveUIDocument } from './context/resource-context';
import { createDownloadActions } from './download/actions';
import { BUTTON_ID, STYLE_ID } from './shared/constants';
import {
  escapeHTML,
  fileSizeText,
  getExtFromIconClass,
  resolveFinalFilename,
  sanitizeName,
  sleep
} from './shared/helpers';
import {
  buildTreeFromCurrentPage,
  countFolders,
  getAllFiles,
  getSelectedFiles,
  refreshAncestors,
  setNodeStateDeep,
  walkTree
} from './tree/tree-model';
import { createPanelController } from './ui/panel';
import { ensureStyle } from './ui/style';

export function runBatchDownloader() {
  'use strict';

  let rootTree = null;
  let scanInProgress = false;
  let actionInProgress = false;
  let activeResourceOrigin = location.origin;

  const uiDocument = resolveUIDocument();

  let downloadActions = null;
  const panelController = createPanelController({
    uiDocument,
    ensureStyle: () => ensureStyle({ uiDocument }),
    getRootTree: () => rootTree,
    setNodeStateDeep,
    refreshAncestors,
    walkTree,
    getAllFiles,
    getSelectedFiles,
    countFolders,
    getExtFromIconClass,
    escapeHTML,
    isActionInProgress: () => actionInProgress,
    onDownloadZip: async () => {
      if (downloadActions) await downloadActions.handleDownloadZip();
    },
    onDownloadFolder: async () => {
      if (downloadActions) await downloadActions.handleDownloadFolder();
    }
  });

  downloadActions = createDownloadActions({
    uiDocument,
    getRootTree: () => rootTree,
    isActionInProgress: () => actionInProgress,
    setActionInProgress: value => {
      actionInProgress = value;
    },
    setActionButtonsDisabled: panelController.setActionButtonsDisabled,
    updateProgress: panelController.updateProgress,
    getSelectedFiles,
    resolveFinalFilename,
    fileSizeText,
    sanitizeName,
    sleep
  });

  function setMainButtonLoading(loading, text = '批量下载') {
    const context = resolveResourceContext();
    const button = context ? context.doc.getElementById(BUTTON_ID) : null;
    if (!button) return;
    button.disabled = loading;
    button.textContent = loading ? text : '批量下载';
  }

  async function openPanelAndScan() {
    if (scanInProgress) return;

    scanInProgress = true;
    setMainButtonLoading(true, '扫描中…');
    panelController.createOverlay();
    panelController.updateProgress('正在递归扫描课程资源…', 8);

    try {
      const context = resolveResourceContext();
      if (!context) {
        throw new Error('未找到课程资源列表页面。请先进入“课程资源”列表页后再试。');
      }

      activeResourceOrigin = new URL(context.win.location.href).origin;
      rootTree = await buildTreeFromCurrentPage(context.win.location.href, activeResourceOrigin);
      panelController.renderTree(rootTree);

      rootTree.expanded = true;
      panelController.syncCheckboxDOM(rootTree);

      const files = getAllFiles(rootTree);
      panelController.updateProgress(`扫描完成：发现 ${files.length} 个文件。`, 100);
    } catch (err) {
      console.error(err);
      panelController.showScanError(err.message || String(err));
      panelController.updateProgress('扫描失败。', 0);
    } finally {
      scanInProgress = false;
      setMainButtonLoading(false);
    }
  }

  function injectButton() {
    ensureStyle({ uiDocument });
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

    const button = context.doc.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = '批量下载';
    button.addEventListener('click', openPanelAndScan);

    target.appendChild(button);
  }

  function init() {
    injectButton();
    setInterval(injectButton, 1500);
  }

  init();
}
