import { ICON_EXT_MAP, MIME_EXT_MAP } from '../../config/file-mappings';

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function sanitizeName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '') || '未命名';
}

export function hasExtension(name) {
  const base = String(name || '').trim();
  if (!base) return false;
  const lastSlash = Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\'));
  const file = base.slice(lastSlash + 1);
  return /\.[A-Za-z0-9]{1,8}$/.test(file);
}

export function getExtFromIconClass(iconClass) {
  if (!iconClass) return '';
  for (const key of Object.keys(ICON_EXT_MAP)) {
    if (iconClass.includes(key)) return ICON_EXT_MAP[key];
  }
  return '';
}

export function getExtFromMime(mime) {
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

  let match = header.match(/filename\*\s*=\s*([^;]+)/i);
  if (match) {
    let value = match[1].trim().replace(/^UTF-8''/i, '').replace(/^['"]|['"]$/g, '');
    value = decodeMaybeURIComponent(value);
    return sanitizeName(value);
  }

  match = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (match) {
    return sanitizeName(decodeMaybeURIComponent(match[1].trim()));
  }

  match = header.match(/filename\s*=\s*([^;]+)/i);
  if (match) {
    return sanitizeName(decodeMaybeURIComponent(match[1].trim().replace(/^['"]|['"]$/g, '')));
  }

  return '';
}

export function resolveFinalFilename(fileNode, headers) {
  const contentDisposition = headers.get('content-disposition') || '';
  const contentType = headers.get('content-type') || '';
  const cdName = decodeContentDispositionFilename(contentDisposition);

  const mimeExt = getExtFromMime(contentType);
  const iconExt = getExtFromIconClass(fileNode.iconClass);
  const fallbackExt = mimeExt || iconExt || '';

  let finalName = cdName || fileNode.name || '未命名';
  finalName = sanitizeName(finalName);

  if (!hasExtension(finalName) && fallbackExt) {
    finalName += fallbackExt;
  }

  return finalName;
}

export async function fetchGBKText(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`页面请求失败：${res.status} ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  return new TextDecoder('gbk').decode(buffer);
}

export function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

export function fileSizeText(bytes) {
  if (!bytes || Number.isNaN(bytes)) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
