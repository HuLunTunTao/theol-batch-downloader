import {
  fetchGBKText,
  getExtFromIconClass,
  hasExtension,
  parseHTML,
  sanitizeName
} from '../shared/helpers';

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
    scanError: '',
    fileCount: 0,
    folderCount: 1,
    selectedFileCount: 0,
    el: null
  };
}

function makeFileNode({ name, pathSegments, previewUrl, downloadUrl, iconClass, fileid, resid, lid }) {
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
    previewUrl,
    downloadUrl,
    iconClass,
    fileid,
    resid,
    lid,
    parent: null,
    checked: false,
    indeterminate: false,
    fileCount: 1,
    folderCount: 0,
    selectedFileCount: 0,
    el: null
  };
}

function appendChild(parent, child) {
  child.parent = parent;
  parent.children.push(child);
}

function parseFolderId(href, pageUrl) {
  try {
    const url = new URL(href, pageUrl);
    return url.searchParams.get('folderid') || '';
  } catch {
    return '';
  }
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

  let fullUrl = '';
  try {
    fullUrl = new URL(href, pageUrl).href;
  } catch {
    return null;
  }
  const folderId = parseFolderId(fullUrl, pageUrl);
  if (!folderId) return null;

  return {
    folderId,
    name,
    url: fullUrl
  };
}

function parseRowAsFile(tr, pageUrl, activeResourceOrigin) {
  const fileLink = tr.querySelector("a[href*='download_preview.jsp']");
  if (!fileLink) return null;

  const href = fileLink.getAttribute('href') || '';
  let urlObj;
  try {
    urlObj = new URL(href, pageUrl);
  } catch {
    return null;
  }

  const fileid = urlObj.searchParams.get('fileid') || '';
  const resid = urlObj.searchParams.get('resid') || '';
  const lid = urlObj.searchParams.get('lid') || '';

  if (!fileid || !resid || !lid) return null;

  const iconSpan = tr.querySelector('span[class*="ico_"]');
  const iconClass = iconSpan ? iconSpan.className : '';

  const downloadUrl = `${activeResourceOrigin}/meol/common/script/download.jsp?fileid=${encodeURIComponent(fileid)}&resid=${encodeURIComponent(resid)}&lid=${encodeURIComponent(lid)}`;

  return {
    name: fileLink.textContent.trim() || '未命名',
    previewUrl: urlObj.href,
    downloadUrl,
    iconClass,
    fileid,
    resid,
    lid
  };
}

function recordScanError(errors, pathSegments, folderName, message) {
  const fullPath = [...pathSegments, sanitizeName(folderName)].filter(Boolean).join('/');
  errors.push({
    path: fullPath || sanitizeName(folderName) || '未命名目录',
    message
  });
}

function finalizeTreeStats(node) {
  if (node.type === 'file') {
    node.fileCount = 1;
    node.folderCount = 0;
    node.selectedFileCount = node.checked ? 1 : 0;
    return;
  }

  let fileCount = 0;
  let folderCount = 1;
  let selectedFileCount = 0;
  for (const child of node.children) {
    finalizeTreeStats(child);
    fileCount += child.fileCount || 0;
    folderCount += child.folderCount || 0;
    selectedFileCount += child.selectedFileCount || 0;
  }

  node.fileCount = fileCount;
  node.folderCount = folderCount;
  node.selectedFileCount = selectedFileCount;
}

async function scanFolderPage(pageUrl, folderName, pathSegments, visitedFolderIds, activeResourceOrigin, errors) {
  const html = await fetchGBKText(pageUrl);
  const doc = parseHTML(html);
  const folderNode = makeFolderNode(folderName, pathSegments, pageUrl);

  const rows = extractRows(doc);

  for (const tr of rows) {
    let fileInfo = null;
    try {
      fileInfo = parseRowAsFile(tr, pageUrl, activeResourceOrigin);
    } catch {
      fileInfo = null;
    }
    if (fileInfo) {
      appendChild(folderNode, makeFileNode({
        ...fileInfo,
        pathSegments: [...pathSegments]
      }));
      continue;
    }

    let folderInfo = null;
    try {
      folderInfo = parseRowAsFolder(tr, pageUrl);
    } catch {
      folderInfo = null;
    }
    if (folderInfo) {
      if (visitedFolderIds.has(folderInfo.folderId)) continue;
      visitedFolderIds.add(folderInfo.folderId);

      let childNode;
      try {
        childNode = await scanFolderPage(
          folderInfo.url,
          folderInfo.name,
          [...pathSegments, sanitizeName(folderInfo.name)],
          visitedFolderIds,
          activeResourceOrigin,
          errors
        );
      } catch (error) {
        childNode = makeFolderNode(folderInfo.name, [...pathSegments, sanitizeName(folderInfo.name)], folderInfo.url);
        childNode.scanError = error && error.message ? error.message : String(error);
        recordScanError(errors, pathSegments, folderInfo.name, childNode.scanError);
      }
      appendChild(folderNode, childNode);
    }
  }

  finalizeTreeStats(folderNode);
  return folderNode;
}

export async function buildTreeFromCurrentPage(currentUrl, activeResourceOrigin) {
  const currentUrlObj = new URL(currentUrl);
  const currentFolderId = currentUrlObj.searchParams.get('folderid') || '0';

  const currentHTML = await fetchGBKText(currentUrl);
  const currentDoc = parseHTML(currentHTML);

  const root = makeFolderNode(
    currentFolderId === '0' ? '课程资源' : '当前目录',
    [],
    currentUrl
  );
  const errors = [];
  root.scanErrors = errors;

  const rows = extractRows(currentDoc);
  const visited = new Set();
  if (currentFolderId) visited.add(currentFolderId);

  for (const tr of rows) {
    let fileInfo = null;
    try {
      fileInfo = parseRowAsFile(tr, currentUrl, activeResourceOrigin);
    } catch {
      fileInfo = null;
    }
    if (fileInfo) {
      appendChild(root, makeFileNode({
        ...fileInfo,
        pathSegments: []
      }));
      continue;
    }

    let folderInfo = null;
    try {
      folderInfo = parseRowAsFolder(tr, currentUrl);
    } catch {
      folderInfo = null;
    }
    if (folderInfo) {
      if (visited.has(folderInfo.folderId)) continue;
      visited.add(folderInfo.folderId);

      let childNode;
      try {
        childNode = await scanFolderPage(
          folderInfo.url,
          folderInfo.name,
          [sanitizeName(folderInfo.name)],
          visited,
          activeResourceOrigin,
          errors
        );
      } catch (error) {
        childNode = makeFolderNode(folderInfo.name, [sanitizeName(folderInfo.name)], folderInfo.url);
        childNode.scanError = error && error.message ? error.message : String(error);
        recordScanError(errors, [], folderInfo.name, childNode.scanError);
      }
      appendChild(root, childNode);
    }
  }

  finalizeTreeStats(root);
  return root;
}

export function walkTree(node, fn) {
  fn(node);
  if (node.type === 'folder') {
    for (const child of node.children) {
      walkTree(child, fn);
    }
  }
}

export function getAllFiles(node) {
  const files = [];
  walkTree(node, currentNode => {
    if (currentNode.type === 'file') files.push(currentNode);
  });
  return files;
}

export function getSelectedFiles(node) {
  const files = [];
  walkTree(node, currentNode => {
    if (currentNode.type === 'file' && currentNode.checked) files.push(currentNode);
  });
  return files;
}

export function countFolders(node) {
  return node && typeof node.folderCount === 'number'
    ? node.folderCount
    : 0;
}

export function getTreeSummary(node) {
  return {
    folders: node && typeof node.folderCount === 'number' ? node.folderCount : countFolders(node),
    files: node && typeof node.fileCount === 'number' ? node.fileCount : getAllFiles(node).length,
    selectedFiles: node && typeof node.selectedFileCount === 'number' ? node.selectedFileCount : getSelectedFiles(node).length
  };
}

export function setNodeStateDeep(node, checked) {
  node.checked = checked;
  node.indeterminate = false;
  node.selectedFileCount = 0;
  if (node.type === 'folder') {
    for (const child of node.children) {
      setNodeStateDeep(child, checked);
    }
    node.selectedFileCount = checked ? node.fileCount : 0;
  } else {
    node.selectedFileCount = checked ? 1 : 0;
  }
}

export function refreshAncestors(node) {
  if (node.type === 'file') {
    node.selectedFileCount = node.checked ? 1 : 0;
  } else {
    node.selectedFileCount = node.children.reduce((sum, child) => sum + (child.selectedFileCount || 0), 0);
  }

  let current = node.parent;
  while (current) {
    const children = current.children || [];
    const allChecked = children.length > 0 && children.every(child => child.checked && !child.indeterminate);
    const noneChecked = children.every(child => !child.checked && !child.indeterminate);
    const selectedFileCount = children.reduce((sum, child) => sum + (child.selectedFileCount || 0), 0);

    current.checked = allChecked;
    current.indeterminate = !allChecked && !noneChecked;
    current.selectedFileCount = selectedFileCount;

    current = current.parent;
  }
}
