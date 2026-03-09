import { BUTTON_ID, OVERLAY_ID, STYLE_ID } from '../shared/constants';

function buildStyleText() {
  return `
      #${BUTTON_ID} {
        margin-left: 10px;
        padding: 6px 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        color: #fff;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        box-shadow: 0 4px 12px rgba(37,99,235,.25);
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #${BUTTON_ID}:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(37,99,235,.35);
      }
      #${BUTTON_ID}:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(37,99,235,.25);
      }
      #${BUTTON_ID}[disabled] {
        cursor: not-allowed;
        opacity: .6;
        transform: none;
        background: #9ca3af;
        box-shadow: none;
      }

      #${OVERLAY_ID} {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        background: rgba(15, 23, 42, 0.6);
        z-index: 2147483000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      #${OVERLAY_ID} .theol-modal {
        width: min(1080px, 96vw);
        height: min(84vh, 900px);
        background: #ffffff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        display: flex;
        flex-direction: column;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        transform: scale(0.98);
        animation: theol-modal-show 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      @keyframes theol-modal-show {
        to { transform: scale(1); }
      }

      #${OVERLAY_ID} .theol-header {
        padding: 24px 28px 20px;
        background: linear-gradient(180deg, #f8fafc, #ffffff);
        border-bottom: 1px solid #e2e8f0;
      }

      #${OVERLAY_ID} .theol-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      #${OVERLAY_ID} .theol-title {
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.01em;
      }

      #${OVERLAY_ID} .theol-subtitle {
        margin-top: 8px;
        font-size: 14px;
        color: #64748b;
        line-height: 1.5;
      }

      #${OVERLAY_ID} .theol-close {
        border: none;
        background: #f1f5f9;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 16px;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      #${OVERLAY_ID} .theol-close:hover {
        background: #e2e8f0;
        color: #0f172a;
        transform: rotate(90deg);
      }

      #${OVERLAY_ID} .theol-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 16px 28px;
        border-bottom: 1px solid #e2e8f0;
        background: #fafaf9;
      }

      #${OVERLAY_ID} .theol-toolbar .left,
      #${OVERLAY_ID} .theol-toolbar .right {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      #${OVERLAY_ID} .theol-toolbar .left {
        flex: 1;
      }

      #${OVERLAY_ID} .theol-btn {
        border: none;
        border-radius: 10px;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      #${OVERLAY_ID} .theol-btn.primary {
        color: #fff;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        box-shadow: 0 4px 12px rgba(37,99,235,.2);
      }

      #${OVERLAY_ID} .theol-btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(37,99,235,.3);
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
      }

      #${OVERLAY_ID} .theol-btn.secondary {
        color: #334155;
        background: #f1f5f9;
        box-shadow: inset 0 0 0 1px #e2e8f0;
      }

      #${OVERLAY_ID} .theol-btn.secondary:hover {
        background: #e2e8f0;
        color: #0f172a;
      }

      #${OVERLAY_ID} .theol-btn.ghost {
        color: #2563eb;
        background: #eff6ff;
      }

      #${OVERLAY_ID} .theol-btn.ghost:hover {
        background: #dbeafe;
        color: #1d4ed8;
      }

      #${OVERLAY_ID} .theol-btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      #${OVERLAY_ID} .theol-summary {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        font-size: 13px;
        color: #475569;
      }

      #${OVERLAY_ID} .theol-tag {
        padding: 4px 12px;
        border-radius: 9999px;
        background: #eff6ff;
        color: #2563eb;
        font-weight: 600;
        font-size: 13px;
        border: 1px solid #bfdbfe;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }

      #${OVERLAY_ID} .theol-body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        background: #f8fafc;
        padding: 20px 28px;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }

      #${OVERLAY_ID} .theol-body::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      #${OVERLAY_ID} .theol-body::-webkit-scrollbar-track {
        background: transparent;
      }
      #${OVERLAY_ID} .theol-body::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      #${OVERLAY_ID} .theol-body::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      #${OVERLAY_ID} .theol-tree {
        font-size: 14px;
        color: #334155;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      #${OVERLAY_ID} .theol-tree ul {
        list-style: none;
        margin: 0;
        padding-left: 24px;
        position: relative;
      }

      #${OVERLAY_ID} .theol-tree ul::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 12px;
        width: 1px;
        background: #e2e8f0;
        z-index: 1;
      }

      #${OVERLAY_ID} .theol-tree > ul {
        padding-left: 0;
      }
      #${OVERLAY_ID} .theol-tree > ul::before {
        display: none;
      }

      #${OVERLAY_ID} .theol-tree li {
        margin: 2px 0;
        position: relative;
      }

      #${OVERLAY_ID} .theol-node-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 36px;
        border-radius: 8px;
        padding: 4px 8px;
        transition: all 0.15s ease;
        position: relative;
        z-index: 2;
      }

      #${OVERLAY_ID} .theol-node-row:hover {
        background: #f1f5f9;
      }

      #${OVERLAY_ID} .theol-toggle {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #64748b;
        font-size: 12px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      #${OVERLAY_ID} .theol-toggle:hover {
        background: #e2e8f0;
        color: #0f172a;
      }

      #${OVERLAY_ID} .theol-toggle.placeholder {
        visibility: hidden;
        cursor: default;
      }

      #${OVERLAY_ID} .theol-node-row input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #3b82f6;
        border-radius: 4px;
        margin: 0;
      }

      #${OVERLAY_ID} .theol-icon {
        width: 20px;
        text-align: center;
        user-select: none;
        font-size: 16px;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
      }

      #${OVERLAY_ID} .theol-name {
        flex: 1;
        min-width: 0;
        word-break: break-all;
        color: #0f172a;
      }

      #${OVERLAY_ID} .theol-meta {
        font-size: 12px;
        color: #94a3b8;
        white-space: nowrap;
        background: #f8fafc;
        padding: 2px 8px;
        border-radius: 6px;
        border: 1px solid #f1f5f9;
      }

      #${OVERLAY_ID} .theol-folder > .theol-node-row .theol-name {
        font-weight: 600;
        color: #1e293b;
      }

      #${OVERLAY_ID} .theol-footer {
        padding: 20px 28px;
        border-top: 1px solid #e2e8f0;
        background: #ffffff;
      }

      #${OVERLAY_ID} .theol-progress-text {
        font-size: 14px;
        color: #475569;
        margin-bottom: 10px;
        font-weight: 500;
        display: flex;
        justify-content: space-between;
      }

      #${OVERLAY_ID} .theol-progress {
        width: 100%;
        height: 10px;
        border-radius: 9999px;
        background: #f1f5f9;
        overflow: hidden;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
      }

      #${OVERLAY_ID} .theol-progress-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 9999px;
        box-shadow: 0 2px 4px rgba(59,130,246,0.3);
      }

      #${OVERLAY_ID} .theol-empty {
        color: #64748b;
        text-align: center;
        padding: 48px 20px;
        font-size: 15px;
        background: #ffffff;
        border-radius: 8px;
        border: 1px dashed #cbd5e1;
        margin: 10px;
      }

      @media (max-width: 720px) {
        #${OVERLAY_ID} .theol-modal {
          width: 100%;
          height: 92vh;
          border-radius: 14px;
        }
        #${OVERLAY_ID} .theol-toolbar {
          padding: 12px 14px;
        }
        #${OVERLAY_ID} .theol-body {
          padding: 12px 14px 14px;
        }
        #${OVERLAY_ID} .theol-footer {
          padding: 12px 14px 14px;
        }
      }
    `;
}

export function ensureStyle({ uiDocument }) {
  const hasLocalStyle = !!document.getElementById(STYLE_ID);
  const hasUIStyle = !!uiDocument.getElementById(STYLE_ID);
  if (hasLocalStyle && hasUIStyle) return;

  const styleText = buildStyleText();
  if (!hasLocalStyle) {
    const localStyle = document.createElement('style');
    localStyle.id = STYLE_ID;
    localStyle.textContent = styleText;
    const localHead = document.head || document.documentElement;
    localHead.appendChild(localStyle);
  }

  if (!hasUIStyle && uiDocument !== document) {
    const uiStyle = uiDocument.createElement('style');
    uiStyle.id = STYLE_ID;
    uiStyle.textContent = styleText;
    const uiHead = uiDocument.head || uiDocument.documentElement;
    uiHead.appendChild(uiStyle);
  }
}
