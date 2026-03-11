const SVG_NS = 'http://www.w3.org/2000/svg';

function createElement(uiDocument, tagName, { className, textContent, attrs, style } = {}) {
  const element = uiDocument.createElement(tagName);
  if (className) element.className = className;
  if (typeof textContent === 'string') element.textContent = textContent;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
  }
  if (style) {
    Object.assign(element.style, style);
  }
  return element;
}

function createSvg(uiDocument, width, height, viewBox, children, attrs = {}) {
  const svg = uiDocument.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  for (const [key, value] of Object.entries(attrs)) {
    svg.setAttribute(key, value);
  }
  for (const child of children) {
    svg.appendChild(child);
  }
  return svg;
}

function createSvgNode(uiDocument, tagName, attrs) {
  const node = uiDocument.createElementNS(SVG_NS, tagName);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

function createButton(uiDocument, { className, action, text, title, svg }) {
  const button = createElement(uiDocument, 'button', { className, attrs: { type: 'button' } });
  if (action) button.dataset.action = action;
  if (title) button.title = title;
  if (svg) button.appendChild(svg);
  if (text) button.append(` ${text}`);
  return button;
}

export function createOverlayTemplate(uiDocument) {
  const modal = createElement(uiDocument, 'div', { className: 'theol-modal' });

  const header = createElement(uiDocument, 'div', { className: 'theol-header' });
  const titleRow = createElement(uiDocument, 'div', { className: 'theol-title-row' });
  const title = createElement(uiDocument, 'h2', { className: 'theol-title', textContent: '课程资源批量下载' });
  const closeIcon = createSvg(uiDocument, 20, 20, '0 0 24 24', [
    createSvgNode(uiDocument, 'line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    createSvgNode(uiDocument, 'line', { x1: '6', y1: '6', x2: '18', y2: '18' })
  ], {
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  });
  const closeButton = createButton(uiDocument, {
    className: 'theol-close',
    title: '关闭',
    svg: closeIcon
  });
  titleRow.append(title, closeButton);
  header.appendChild(titleRow);
  header.appendChild(createElement(uiDocument, 'div', {
    className: 'theol-subtitle',
    textContent: '自动递归目录、树状勾选、补全常见后缀、支持 ZIP 或按原目录结构保存到文件夹。'
  }));

  const toolbar = createElement(uiDocument, 'div', { className: 'theol-toolbar' });
  const leftActions = createElement(uiDocument, 'div', { className: 'left' });
  const summary = createElement(uiDocument, 'div', { className: 'right theol-summary' });
  const toolbarButtons = [
    {
      action: 'select-all',
      text: '全选',
      svg: createSvg(uiDocument, 14, 14, '0 0 24 24', [
        createSvgNode(uiDocument, 'polyline', { points: '9 11 12 14 22 4' }),
        createSvgNode(uiDocument, 'path', { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' })
      ], {
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    },
    {
      action: 'unselect-all',
      text: '清空',
      svg: createSvg(uiDocument, 14, 14, '0 0 24 24', [
        createSvgNode(uiDocument, 'rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' })
      ], {
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    },
    {
      action: 'expand-all',
      text: '展开全部',
      svg: createSvg(uiDocument, 14, 14, '0 0 24 24', [
        createSvgNode(uiDocument, 'polyline', { points: '7 13 12 18 17 13' }),
        createSvgNode(uiDocument, 'polyline', { points: '7 6 12 11 17 6' })
      ], {
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    },
    {
      action: 'collapse-all',
      text: '收起全部',
      svg: createSvg(uiDocument, 14, 14, '0 0 24 24', [
        createSvgNode(uiDocument, 'polyline', { points: '7 11 12 6 17 11' }),
        createSvgNode(uiDocument, 'polyline', { points: '7 18 12 13 17 18' })
      ], {
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    }
  ];
  for (const config of toolbarButtons) {
    leftActions.appendChild(createButton(uiDocument, {
      className: 'theol-btn secondary',
      action: config.action,
      text: config.text,
      svg: config.svg
    }));
  }
  toolbar.append(leftActions, summary);

  const body = createElement(uiDocument, 'div', { className: 'theol-body' });
  const tree = createElement(uiDocument, 'div', { className: 'theol-tree' });
  const empty = createElement(uiDocument, 'div', { className: 'theol-empty' });
  empty.appendChild(createSvg(uiDocument, 32, 32, '0 0 24 24', [
    createSvgNode(uiDocument, 'circle', { cx: '12', cy: '12', r: '10' }),
    createSvgNode(uiDocument, 'polyline', { points: '12 6 12 12 16 14' })
  ], {
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }));
  empty.firstChild.style.margin = '0 auto 12px';
  empty.firstChild.style.display = 'block';
  empty.firstChild.style.opacity = '0.5';
  empty.append('正在扫描课程资源，请稍候…');
  tree.appendChild(empty);
  body.appendChild(tree);

  const footer = createElement(uiDocument, 'div', { className: 'theol-footer' });
  const footerTop = createElement(uiDocument, 'div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    }
  });
  const footerActions = createElement(uiDocument, 'div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px'
    }
  });
  footerActions.append(
    createButton(uiDocument, {
      className: 'theol-btn primary',
      action: 'download-zip',
      text: '下载压缩包 ZIP',
      svg: createSvg(uiDocument, 16, 16, '0 0 24 24', [
        createSvgNode(uiDocument, 'path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
        createSvgNode(uiDocument, 'polyline', { points: '7 10 12 15 17 10' }),
        createSvgNode(uiDocument, 'line', { x1: '12', y1: '15', x2: '12', y2: '3' })
      ], {
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    }),
    createButton(uiDocument, {
      className: 'theol-btn ghost',
      action: 'download-folder',
      text: '下载到本地文件夹',
      svg: createSvg(uiDocument, 16, 16, '0 0 24 24', [
        createSvgNode(uiDocument, 'path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
        createSvgNode(uiDocument, 'line', { x1: '12', y1: '11', x2: '12', y2: '17' }),
        createSvgNode(uiDocument, 'line', { x1: '9', y1: '14', x2: '15', y2: '14' })
      ], {
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    })
  );
  footerTop.appendChild(footerActions);

  const progressText = createElement(uiDocument, 'div', { className: 'theol-progress-text' });
  progressText.append(
    createElement(uiDocument, 'span', { textContent: '等待操作…' }),
    createElement(uiDocument, 'span', { className: 'theol-progress-percent', textContent: '0%' })
  );
  const progress = createElement(uiDocument, 'div', { className: 'theol-progress' });
  progress.appendChild(createElement(uiDocument, 'div', { className: 'theol-progress-bar' }));

  footer.append(footerTop, progressText, progress);
  modal.append(header, toolbar, body, footer);
  return modal;
}
