import JSZip from 'jszip/lib/index.js';
import { parseHTML } from '../shared/helpers';

export function createDownloadActions({
  uiDocument,
  getRootTree,
  isActionInProgress,
  setActionInProgress,
  setActionButtonsDisabled,
  updateProgress,
  getSelectedFiles,
  resolveFinalFilename,
  fileSizeText,
  sanitizeName,
  sleep
}) {
  async function fetchTextDocument(url) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`页面请求失败：${res.status} ${res.statusText}`);
    }
    const buffer = await res.arrayBuffer();
    return new TextDecoder('gbk').decode(buffer);
  }

  function extractOfficialDownloadUrl(fileNode, previewDoc, previewUrl) {
    const directLink = previewDoc.querySelector("a[href*='/meol/common/script/download.jsp']");
    if (directLink) {
      const href = directLink.getAttribute('href') || '';
      if (href) return new URL(href, previewUrl).href;
    }

    const scripts = Array.from(previewDoc.querySelectorAll('script'));
    const previewScript = scripts
      .map(script => script.textContent || '')
      .find(text => text.includes('/meol/analytics/resPdfShow.do'));

    if (previewScript) {
      const match = previewScript.match(/encodeURIComponent\(\s*["']([^"']*\/meol\/analytics\/resPdfShow\.do\?[^"']+)["']\s*\)/i);
      if (match && match[1]) {
        return new URL(match[1], previewUrl).href;
      }
    }

    if (fileNode.downloadUrl) return fileNode.downloadUrl;
    throw new Error(`${fileNode.name} 未找到官方下载地址。`);
  }

  async function resolveOfficialDownloadUrl(fileNode) {
    if (fileNode.officialDownloadUrl) return fileNode.officialDownloadUrl;
    if (!fileNode.previewUrl) {
      fileNode.officialDownloadUrl = fileNode.downloadUrl;
      return fileNode.officialDownloadUrl;
    }

    const previewHtml = await fetchTextDocument(fileNode.previewUrl);
    const previewDoc = parseHTML(previewHtml);
    const officialUrl = extractOfficialDownloadUrl(fileNode, previewDoc, fileNode.previewUrl);
    fileNode.officialDownloadUrl = officialUrl;
    return officialUrl;
  }

  function isPdfLikeFile(fileNode, finalName, headers) {
    const contentType = (headers.get('content-type') || '').toLowerCase();
    return /\.pdf$/i.test(finalName || '')
      || /\.pdf$/i.test(fileNode.name || '')
      || fileNode.iconClass.includes('ico_pdf')
      || contentType.includes('application/pdf');
  }

  async function readBlobHeadText(blob, length = 512) {
    const headBuffer = await blob.slice(0, length).arrayBuffer();
    return new TextDecoder('utf-8', { fatal: false }).decode(headBuffer).trimStart();
  }

  async function validateDownloadedBlob(fileNode, blob, finalName, headers) {
    const contentType = (headers.get('content-type') || '').toLowerCase();
    const headText = await readBlobHeadText(blob);

    if (isPdfLikeFile(fileNode, finalName, headers)) {
      if (!headText.startsWith('%PDF-')) {
        throw new Error(`${finalName} 下载内容不是有效 PDF，可能返回了登录页或错误页。`);
      }
      return;
    }

    const looksLikeHtml = /^<(?:!doctype\s+html|html\b|head\b|body\b|script\b)/i.test(headText);
    const looksLikeErrorPage = /(登录|login|统一身份认证|error|异常|未找到|404|403)/i.test(headText.slice(0, 300));

    if (contentType.includes('text/html') || (looksLikeHtml && looksLikeErrorPage)) {
      throw new Error(`${finalName} 下载内容是网页而不是文件，可能登录已失效或资源链接不可用。`);
    }
  }

  async function fetchFileBlobAndName(fileNode) {
    const downloadUrl = await resolveOfficialDownloadUrl(fileNode);
    const res = await fetch(downloadUrl, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`${fileNode.name} 下载失败：${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    const finalName = resolveFinalFilename(fileNode, res.headers);
    await validateDownloadedBlob(fileNode, blob, finalName, res.headers);
    return { blob, finalName };
  }

  async function blobToZipInput(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // JSZip uses instanceof checks for ArrayBuffer/Uint8Array, which can fail in Firefox
    // extension realms. A plain Array survives cross-realm detection.
    return Array.from(bytes);
  }

  const ZIP_SIZE_WARN_BYTES = 512 * 1024 * 1024;
  const ZIP_COUNT_WARN_THRESHOLD = 400;

  function splitFilename(name) {
    const match = /^(.*?)(\.[^.]+)?$/.exec(String(name || '').trim());
    return {
      base: (match && match[1]) || '未命名',
      ext: (match && match[2]) || ''
    };
  }

  function makeUniqueRelativePath(pathSegments, fileName, usedRelativePaths) {
    const safeSegments = pathSegments.map(segment => sanitizeName(segment)).filter(Boolean);
    const safeName = sanitizeName(fileName) || 'download.bin';
    const { base, ext } = splitFilename(safeName);

    let suffix = 0;
    while (true) {
      const candidateName = suffix === 0 ? `${base}${ext}` : `${base} (${suffix + 1})${ext}`;
      const candidatePath = [...safeSegments, candidateName].join('/');
      if (!usedRelativePaths.has(candidatePath)) {
        usedRelativePaths.add(candidatePath);
        return {
          relativePath: candidatePath,
          pathSegments: safeSegments,
          fileName: candidateName
        };
      }
      suffix += 1;
    }
  }

  async function fileExistsInDirectory(dirHandle, fileName) {
    try {
      await dirHandle.getFileHandle(fileName);
      return true;
    } catch (error) {
      if (error && error.name === 'NotFoundError') return false;
      throw error;
    }
  }

  async function makeAvailableFileName(dirHandle, fileName) {
    const safeName = sanitizeName(fileName) || 'download.bin';
    const { base, ext } = splitFilename(safeName);

    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? `${base}${ext}` : `${base} (${suffix + 1})${ext}`;
      if (!(await fileExistsInDirectory(dirHandle, candidate))) {
        return candidate;
      }
      suffix += 1;
    }
  }

  function parseSizeFromHeaders(headers) {
    const contentRange = headers.get('content-range') || '';
    const match = contentRange.match(/\/(\d+)\s*$/);
    if (match) {
      const total = Number.parseInt(match[1], 10);
      if (Number.isFinite(total) && total >= 0) return total;
    }

    const length = Number.parseInt(headers.get('content-length') || '', 10);
    if (Number.isFinite(length) && length >= 0) return length;
    return null;
  }

  async function fetchFileSize(fileNode) {
    const downloadUrl = await resolveOfficialDownloadUrl(fileNode);

    try {
      const headRes = await fetch(downloadUrl, {
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
      const rangeRes = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Range: 'bytes=0-0'
        }
      });
      if (!rangeRes.ok) return null;

      const hasContentRange = !!rangeRes.headers.get('content-range');
      if (rangeRes.status !== 206 && !hasContentRange) {
        if (rangeRes.body) {
          try {
            await rangeRes.body.cancel();
          } catch {
            // ignore stream cancel errors
          }
        }
        return null;
      }

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
      updateProgress(`正在统计大小…（${i + 1}/${selectedFiles.length}）`, ((i + 1) / selectedFiles.length) * 100);
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

    return {
      ok: confirmFn(`确认开始下载？\n\n${countText}\n${sizeText}`),
      knownTotalBytes,
      unknownCount
    };
  }

  function shouldWarnZipRisk(selectedFiles, knownTotalBytes, unknownCount) {
    return knownTotalBytes >= ZIP_SIZE_WARN_BYTES
      || selectedFiles.length >= ZIP_COUNT_WARN_THRESHOLD
      || unknownCount > 0;
  }

  function confirmZipRisk(selectedFiles, knownTotalBytes, unknownCount) {
    const confirmFn = (uiDocument.defaultView && uiDocument.defaultView.confirm)
      ? uiDocument.defaultView.confirm.bind(uiDocument.defaultView)
      : window.confirm.bind(window);

    const reasonText = knownTotalBytes >= ZIP_SIZE_WARN_BYTES
      ? `已知数据量约 ${fileSizeText(knownTotalBytes)}`
      : unknownCount > 0
        ? `有 ${unknownCount} 个文件大小未知`
        : `文件数量达到 ${selectedFiles.length} 个`;

    return confirmFn(
      `ZIP 打包可能占用较高内存并导致页面卡顿或失败。\n\n${reasonText}\n建议优先使用“下载到本地文件夹”。\n\n是否仍继续 ZIP 下载？`
    );
  }

  async function fallbackFlatDownload(selectedFiles) {
    let done = 0;
    const usedRelativePaths = new Set();
    for (const file of selectedFiles) {
      updateProgress(`下载中：${file.name}（${done + 1}/${selectedFiles.length}）`, (done / selectedFiles.length) * 100);
      const { blob, finalName } = await fetchFileBlobAndName(file);
      const { relativePath } = makeUniqueRelativePath(file.pathSegments, finalName, usedRelativePaths);
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = relativePath || sanitizeName(finalName) || 'download.bin';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(anchor.href), 60_000);
      done += 1;
      await sleep(200);
    }
    updateProgress(`完成：已创建 ${selectedFiles.length} 个下载任务（浏览器若支持会按目录结构保存）`, 100);
  }

  function getRuntimeAPI() {
    if (typeof browser !== 'undefined' && browser && browser.runtime && browser.runtime.sendMessage) {
      return browser;
    }
    if (typeof chrome !== 'undefined' && chrome && chrome.runtime && chrome.runtime.sendMessage) {
      return chrome;
    }
    return null;
  }

  function getExtensionRelativeDownloadSupport() {
    const runtimeApi = getRuntimeAPI();
    if (!runtimeApi || !runtimeApi.runtime || !runtimeApi.runtime.id) return null;
    return runtimeApi;
  }

  async function fallbackExtensionRelativeDownload(selectedFiles) {
    const runtimeApi = getExtensionRelativeDownloadSupport();
    if (!runtimeApi) return false;

    // Direct downloads API writes server responses straight to disk and cannot verify
    // whether the payload is a real file or an HTML/login error page first.
    return false;
  }

  async function getOrCreateSubdir(dirHandle, folderName) {
    return dirHandle.getDirectoryHandle(sanitizeName(folderName), { create: true });
  }

  async function writeBlobToFileSystem(rootDirHandle, pathSegments, fileName, blob) {
    let dir = rootDirHandle;
    for (const segment of pathSegments) {
      dir = await getOrCreateSubdir(dir, segment);
    }
    const availableFileName = await makeAvailableFileName(dir, fileName);
    const fileHandle = await dir.getFileHandle(availableFileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function handleDownloadZip() {
    if (isActionInProgress()) return;

    const rootTree = getRootTree();
    if (!rootTree) return;

    const selectedFiles = getSelectedFiles(rootTree);
    if (!selectedFiles.length) {
      alert('请先勾选至少一个文件或目录。');
      return;
    }

    const confirmation = await confirmBeforeDownload(selectedFiles);
    if (!confirmation.ok) {
      updateProgress('已取消。', 0);
      return;
    }

    if (shouldWarnZipRisk(selectedFiles, confirmation.knownTotalBytes, confirmation.unknownCount)) {
      const confirmed = confirmZipRisk(selectedFiles, confirmation.knownTotalBytes, confirmation.unknownCount);
      if (!confirmed) {
        updateProgress('已取消。', 0);
        return;
      }
    }

    setActionInProgress(true);
    setActionButtonsDisabled(true);
    updateProgress('正在准备 ZIP 组件…', 0);

    try {
      const zip = new JSZip();
      let done = 0;
      let totalBytes = 0;
      const usedRelativePaths = new Set();

      for (const file of selectedFiles) {
        updateProgress(`下载中：${file.name}（${done + 1}/${selectedFiles.length}）`, (done / selectedFiles.length) * 100);
        const { blob, finalName } = await fetchFileBlobAndName(file);
        totalBytes += blob.size || 0;

        const { relativePath } = makeUniqueRelativePath(file.pathSegments, finalName, usedRelativePaths);

        zip.file(relativePath, await blobToZipInput(blob));
        done += 1;
      }

      updateProgress('正在生成 ZIP，请稍候…', 96);
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(zipBlob);
      anchor.download = `课程资源_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(anchor.href), 60_000);

      updateProgress(`完成：已打包 ${selectedFiles.length} 个文件，原始数据约 ${fileSizeText(totalBytes)}`, 100);
    } catch (err) {
      console.error(err);
      alert(`ZIP 下载失败：${err.message || err}`);
      updateProgress('下载失败。', 0);
    } finally {
      setActionInProgress(false);
      setActionButtonsDisabled(false);
    }
  }

  async function handleDownloadFolder() {
    if (isActionInProgress()) return;

    const rootTree = getRootTree();
    if (!rootTree) return;

    const selectedFiles = getSelectedFiles(rootTree);
    if (!selectedFiles.length) {
      alert('请先勾选至少一个文件或目录。');
      return;
    }

    const confirmation = await confirmBeforeDownload(selectedFiles);
    if (!confirmation.ok) {
      updateProgress('已取消。', 0);
      return;
    }

    setActionInProgress(true);
    setActionButtonsDisabled(true);

    try {
      const usedExtensionFallback = await fallbackExtensionRelativeDownload(selectedFiles);
      if (usedExtensionFallback) {
        return;
      }

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
      const usedRelativePaths = new Set();

      for (const file of selectedFiles) {
        updateProgress(`下载并写入：${file.name}（${done + 1}/${selectedFiles.length}）`, (done / selectedFiles.length) * 100);
        const { blob, finalName } = await fetchFileBlobAndName(file);
        totalBytes += blob.size || 0;
        const uniqueTarget = makeUniqueRelativePath(file.pathSegments, finalName, usedRelativePaths);
        await writeBlobToFileSystem(dirHandle, uniqueTarget.pathSegments, uniqueTarget.fileName, blob);
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
      setActionInProgress(false);
      setActionButtonsDisabled(false);
    }
  }

  return {
    handleDownloadFolder,
    handleDownloadZip
  };
}
