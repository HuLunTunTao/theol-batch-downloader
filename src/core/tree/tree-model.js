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

  const fullUrl = new URL(href, pageUrl).href;
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

async function scanFolderPage(pageUrl, folderName, pathSegments, visitedFolderIds, activeResourceOrigin) {
  const html = await fetchGBKText(pageUrl);
  const doc = parseHTML(html);
  const folderNode = makeFolderNode(folderName, pathSegments, pageUrl);

  const rows = extractRows(doc);

  for (const tr of rows) {
    const fileInfo = parseRowAsFile(tr, pageUrl, activeResourceOrigin);
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
        visitedFolderIds,
        activeResourceOrigin
      );
      appendChild(folderNode, childNode);
    }
  }

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

  const rows = extractRows(currentDoc);
  const visited = new Set();
  if (currentFolderId) visited.add(currentFolderId);

  for (const tr of rows) {
    const fileInfo = parseRowAsFile(tr, currentUrl, activeResourceOrigin);
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
        visited,
        activeResourceOrigin
      );
      appendChild(root, childNode);
    }
  }

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
  let count = 0;
  walkTree(node, currentNode => {
    if (currentNode.type === 'folder') count += 1;
  });
  return count;
}

export function setNodeStateDeep(node, checked) {
  node.checked = checked;
  node.indeterminate = false;
  if (node.type === 'folder') {
    for (const child of node.children) {
      setNodeStateDeep(child, checked);
    }
  }
}

export function refreshAncestors(node) {
  let current = node.parent;
  while (current) {
    const children = current.children || [];
    const allChecked = children.length > 0 && children.every(child => child.checked && !child.indeterminate);
    const noneChecked = children.every(child => !child.checked && !child.indeterminate);

    current.checked = allChecked;
    current.indeterminate = !allChecked && !noneChecked;

    current = current.parent;
  }
}
