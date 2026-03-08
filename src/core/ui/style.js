import { BUTTON_ID, OVERLAY_ID, STYLE_ID } from '../shared/constants';

function buildStyleText() {
  return `
      #${BUTTON_ID} {
        margin-left: 10px;
        padding: 5px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        color: #fff;
        background: linear-gradient(135deg, #4f8cff, #3a6ff7);
        box-shadow: 0 4px 12px rgba(58,111,247,.25);
        font-size: 13px;
        transition: all .18s ease;
      }
      #${BUTTON_ID}:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(58,111,247,.35);
      }
      #${BUTTON_ID}[disabled] {
        cursor: not-allowed;
        opacity: .7;
        transform: none;
      }

      #${OVERLAY_ID} {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        background: rgba(10, 20, 35, .48);
        z-index: 2147483000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        backdrop-filter: blur(2px);
      }

      #${OVERLAY_ID} .cau-modal {
        width: min(1080px, 96vw);
        height: min(84vh, 900px);
        background: #fff;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 18px 50px rgba(0, 0, 0, .22);
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      }

      #${OVERLAY_ID} .cau-header {
        padding: 18px 22px 14px;
        background: linear-gradient(135deg, #f7faff, #eef4ff);
        border-bottom: 1px solid #e8eef7;
      }

      #${OVERLAY_ID} .cau-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      #${OVERLAY_ID} .cau-title {
        font-size: 20px;
        font-weight: 700;
        color: #1f2d3d;
        margin: 0;
      }

      #${OVERLAY_ID} .cau-subtitle {
        margin-top: 6px;
        font-size: 13px;
        color: #667085;
      }

      #${OVERLAY_ID} .cau-close {
        border: none;
        background: #fff;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 18px;
        color: #4b5563;
        box-shadow: 0 2px 8px rgba(31,45,61,.08);
      }

      #${OVERLAY_ID} .cau-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        border-bottom: 1px solid #eef2f7;
        background: #fff;
      }

      #${OVERLAY_ID} .cau-toolbar .left,
      #${OVERLAY_ID} .cau-toolbar .right {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      #${OVERLAY_ID} .cau-toolbar .left {
        flex: 1;
      }

      #${OVERLAY_ID} .cau-btn {
        border: none;
        border-radius: 10px;
        padding: 9px 14px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: .18s ease;
      }

      #${OVERLAY_ID} .cau-btn.primary {
        color: #fff;
        background: linear-gradient(135deg, #4f8cff, #3a6ff7);
        box-shadow: 0 6px 14px rgba(58,111,247,.24);
      }

      #${OVERLAY_ID} .cau-btn.primary:hover {
        transform: translateY(-1px);
      }

      #${OVERLAY_ID} .cau-btn.secondary {
        color: #344054;
        background: #f5f7fb;
      }

      #${OVERLAY_ID} .cau-btn.secondary:hover {
        background: #edf2fa;
      }

      #${OVERLAY_ID} .cau-btn.ghost {
        color: #3a6ff7;
        background: #eef4ff;
      }

      #${OVERLAY_ID} .cau-btn[disabled] {
        opacity: .6;
        cursor: not-allowed;
        transform: none !important;
      }

      #${OVERLAY_ID} .cau-summary {
        display: flex;
        gap: 14px;
        align-items: center;
        flex-wrap: wrap;
        font-size: 13px;
        color: #475467;
      }

      #${OVERLAY_ID} .cau-tag {
        padding: 4px 10px;
        border-radius: 999px;
        background: #f2f6ff;
        color: #3555d6;
        font-weight: 600;
      }

      #${OVERLAY_ID} .cau-body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        background:
          linear-gradient(#fff, #fff) padding-box,
          linear-gradient(180deg, #f8fbff, #ffffff) border-box;
        padding: 16px 20px 20px;
      }

      #${OVERLAY_ID} .cau-tree {
        font-size: 14px;
        color: #1f2937;
      }

      #${OVERLAY_ID} .cau-tree ul {
        list-style: none;
        margin: 0;
        padding-left: 22px;
      }

      #${OVERLAY_ID} .cau-tree > ul {
        padding-left: 0;
      }

      #${OVERLAY_ID} .cau-tree li {
        margin: 4px 0;
      }

      #${OVERLAY_ID} .cau-node-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 32px;
        border-radius: 10px;
        padding: 4px 8px;
        transition: background .15s ease;
      }

      #${OVERLAY_ID} .cau-node-row:hover {
        background: #f6f9ff;
      }

      #${OVERLAY_ID} .cau-toggle {
        width: 18px;
        height: 18px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #667085;
        font-size: 12px;
        border-radius: 6px;
      }

      #${OVERLAY_ID} .cau-toggle:hover {
        background: #edf2fa;
      }

      #${OVERLAY_ID} .cau-toggle.placeholder {
        visibility: hidden;
        cursor: default;
      }

      #${OVERLAY_ID} .cau-node-row input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }

      #${OVERLAY_ID} .cau-icon {
        width: 18px;
        text-align: center;
        user-select: none;
      }

      #${OVERLAY_ID} .cau-name {
        flex: 1;
        min-width: 0;
        word-break: break-all;
      }

      #${OVERLAY_ID} .cau-meta {
        font-size: 12px;
        color: #98a2b3;
        white-space: nowrap;
      }

      #${OVERLAY_ID} .cau-folder > .cau-node-row .cau-name {
        font-weight: 600;
      }

      #${OVERLAY_ID} .cau-footer {
        padding: 14px 20px 18px;
        border-top: 1px solid #eef2f7;
        background: #fcfdff;
      }

      #${OVERLAY_ID} .cau-progress-text {
        font-size: 13px;
        color: #475467;
        margin-bottom: 8px;
      }

      #${OVERLAY_ID} .cau-progress {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: #e8eef7;
        overflow: hidden;
      }

      #${OVERLAY_ID} .cau-progress-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #4f8cff, #3a6ff7);
        transition: width .18s ease;
      }

      #${OVERLAY_ID} .cau-empty {
        color: #667085;
        text-align: center;
        padding: 36px 12px;
      }

      @media (max-width: 720px) {
        #${OVERLAY_ID} .cau-modal {
          width: 100%;
          height: 92vh;
          border-radius: 14px;
        }
        #${OVERLAY_ID} .cau-toolbar {
          padding: 12px 14px;
        }
        #${OVERLAY_ID} .cau-body {
          padding: 12px 14px 14px;
        }
        #${OVERLAY_ID} .cau-footer {
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
