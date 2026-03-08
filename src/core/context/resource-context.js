export function resolveUIDocument() {
  try {
    if (window.top && window.top !== window && window.top.document) {
      return window.top.document;
    }
  } catch {
    // ignore cross-origin access
  }
  return document;
}

export function isResourceListDocument(doc) {
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

export function resolveResourceContext() {
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
