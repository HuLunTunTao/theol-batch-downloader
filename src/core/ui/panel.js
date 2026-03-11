import { OVERLAY_ID } from '../shared/constants';
import { createOverlayTemplate } from './template';

export function createPanelController({
  uiDocument,
  ensureStyle,
  getRootTree,
  setNodeStateDeep,
  refreshAncestors,
  walkTree,
  getTreeSummary,
  getExtFromIconClass,
  isActionInProgress,
  onDownloadZip,
  onDownloadFolder
}) {
  function removeOverlay() {
    const element = uiDocument.getElementById(OVERLAY_ID);
    if (element) element.remove();
  }

  function updateProgress(text, percent = 0) {
    const textEl = uiDocument.querySelector(`#${OVERLAY_ID} .theol-progress-text span:first-child`);
    const percentEl = uiDocument.querySelector(`#${OVERLAY_ID} .theol-progress-percent`);
    const barEl = uiDocument.querySelector(`#${OVERLAY_ID} .theol-progress-bar`);
    if (textEl) textEl.textContent = text;
    if (percentEl) percentEl.textContent = `${Math.floor(percent)}%`;
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function updateSummary(root) {
    const summary = getTreeSummary(root);
    const summaryEl = uiDocument.querySelector(`#${OVERLAY_ID} .theol-summary`);
    if (!summaryEl) return;
    summaryEl.replaceChildren(
      makeTag(`目录 ${Math.max(0, summary.folders - 1)}`),
      makeTag(`文件 ${summary.files}`),
      makeTag(`已选 ${summary.selectedFiles}`)
    );
  }

  function makeTag(text) {
    const tag = uiDocument.createElement('span');
    tag.className = 'theol-tag';
    tag.textContent = text;
    return tag;
  }

  function makeEmptyState(text) {
    const empty = uiDocument.createElement('div');
    empty.className = 'theol-empty';
    empty.textContent = text;
    return empty;
  }

  function syncCheckboxDOM(node) {
    if (!node || !node.el) return;

    const checkbox = node.el.querySelector(':scope > .theol-node-row input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = !!node.checked;
      checkbox.indeterminate = !!node.indeterminate;
    }

    if (node.type === 'folder') {
      const childrenWrap = node.el.querySelector(':scope > ul');
      if (childrenWrap) {
        childrenWrap.style.display = node.expanded ? '' : 'none';
      }

      const toggle = node.el.querySelector(':scope > .theol-node-row .theol-toggle');
      if (toggle && !toggle.classList.contains('placeholder')) {
        toggle.textContent = node.expanded ? '▼' : '▶';
      }

      for (const child of node.children) {
        syncCheckboxDOM(child);
      }
    }
  }

  function updateAllDOM(root) {
    if (!root) return;
    syncCheckboxDOM(root);
    updateSummary(root);
  }

  function createNodeElement(node) {
    const li = uiDocument.createElement('li');
    li.className = node.type === 'folder' ? 'theol-folder' : 'theol-file';
    node.el = li;

    const row = uiDocument.createElement('div');
    row.className = 'theol-node-row';

    const toggle = uiDocument.createElement('button');
    toggle.type = 'button';
    toggle.className = 'theol-toggle';
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
      updateAllDOM(getRootTree());
    });

    const icon = uiDocument.createElement('span');
    icon.className = 'theol-icon';
    icon.textContent = node.type === 'folder' ? '📁' : '📄';

    const name = uiDocument.createElement('span');
    name.className = 'theol-name';
    name.textContent = node.name;

    const meta = uiDocument.createElement('span');
    meta.className = 'theol-meta';
    meta.textContent = node.type === 'folder'
      ? (node.scanError ? '扫描失败' : `${node.children.length} 项`)
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
    const treeContainer = uiDocument.querySelector(`#${OVERLAY_ID} .theol-tree`);
    if (!treeContainer) return;

    treeContainer.replaceChildren();
    if (!root.children.length) {
      treeContainer.appendChild(makeEmptyState('未扫描到任何资源。'));
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
    overlay.appendChild(createOverlayTemplate(uiDocument));

    overlay.querySelector('.theol-close').addEventListener('click', () => {
      if (isActionInProgress()) return;
      removeOverlay();
    });

    overlay.addEventListener('click', event => {
      if (event.target === overlay && !isActionInProgress()) {
        removeOverlay();
      }
    });

    overlay.querySelector('[data-action="select-all"]').addEventListener('click', () => {
      const rootTree = getRootTree();
      if (!rootTree) return;
      setNodeStateDeep(rootTree, true);
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="unselect-all"]').addEventListener('click', () => {
      const rootTree = getRootTree();
      if (!rootTree) return;
      setNodeStateDeep(rootTree, false);
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="expand-all"]').addEventListener('click', () => {
      const rootTree = getRootTree();
      if (!rootTree) return;
      walkTree(rootTree, node => {
        if (node.type === 'folder') node.expanded = true;
      });
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="collapse-all"]').addEventListener('click', () => {
      const rootTree = getRootTree();
      if (!rootTree) return;
      walkTree(rootTree, node => {
        if (node.type === 'folder' && node !== rootTree) node.expanded = false;
      });
      updateAllDOM(rootTree);
    });

    overlay.querySelector('[data-action="download-zip"]').addEventListener('click', async () => {
      await onDownloadZip();
    });

    overlay.querySelector('[data-action="download-folder"]').addEventListener('click', async () => {
      await onDownloadFolder();
    });

    const mountRoot = uiDocument.body || uiDocument.documentElement;
    mountRoot.appendChild(overlay);
  }

  function setActionButtonsDisabled(disabled) {
    const buttons = uiDocument.querySelectorAll(`#${OVERLAY_ID} .theol-btn, #${OVERLAY_ID} .theol-close`);
    buttons.forEach(button => {
      button.disabled = disabled;
    });
  }

  function showScanError(errorText) {
    const tree = uiDocument.querySelector(`#${OVERLAY_ID} .theol-tree`);
    if (!tree) return;
    tree.replaceChildren(makeEmptyState(`扫描失败：${errorText}`));
  }

  return {
    createOverlay,
    removeOverlay,
    renderTree,
    setActionButtonsDisabled,
    showScanError,
    syncCheckboxDOM,
    updateAllDOM,
    updateProgress
  };
}
