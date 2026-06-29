// src/ui/uiStyles.ts
// 責務: DOM ベース UI に適用する共通スタイル文字列を一元管理する。

export const UI_COLORS = {
  death: '#ff5b5b',
  relation: '#5bff7a',
  treasure: '#ffd54a',
  money: '#ffe23b',
  generic: '#dddddd',
  panelBg: 'rgba(12, 16, 24, 0.85)',
  panelBorder: '#3a4a6a',
  text: '#e8e8e8',
} as const;

export function basePanelStyle(): Partial<CSSStyleDeclaration> {
  return {
    position: 'absolute',
    background: UI_COLORS.panelBg,
    border: `1px solid ${UI_COLORS.panelBorder}`,
    borderRadius: '6px',
    color: UI_COLORS.text,
    fontFamily: 'sans-serif',
    fontSize: '13px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    zIndex: '10',
  };
}

export function applyStyle(el: HTMLElement, style: Partial<CSSStyleDeclaration>): void {
  Object.assign(el.style, style);
}