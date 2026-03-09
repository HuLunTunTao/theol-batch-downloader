import JSZip from 'jszip';

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
  async function fetchFileBlobAndName(fileNode) {
    const res = await fetch(fileNode.downloadUrl, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`${fileNode.name} 下载失败：${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    const finalName = resolveFinalFilename(fileNode, res.headers);
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
