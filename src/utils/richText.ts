// Utility for applying rich-text formatting to selected substrings within a speech bubble
import { BubbleSideStyle } from '../types';

let savedRange: Range | null = null;
let savedBubbleId: string | null = null;

/**
 * Save current text selection if it is inside the given bubble
 */
export function recordSelection(bubbleId: string) {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.closest('#floating-text-toolbar') ||
          activeEl.closest('#inspector-sidebar') ||
          activeEl.closest('#mobile-bottom-toolbar') ||
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'SELECT')
      ) {
        return;
      }
      if (savedBubbleId === bubbleId) {
        savedRange = null;
        savedBubbleId = null;
      }
      return;
    }
    const range = sel.getRangeAt(0);
    const container = document.getElementById(`bubble-text-${bubbleId}`);
    if (
      container &&
      (container.contains(range.commonAncestorContainer) ||
        container === range.commonAncestorContainer)
    ) {
      savedRange = range.cloneRange();
      savedBubbleId = bubbleId;
    }
  } catch {
    // Ignore cross-origin or invalid range selection errors
  }
}

/**
 * Strips inline font-family declarations from a bubble's rich HTML string
 * so whole-bubble font changes or resets apply uniformly.
 */
export function stripInlineFontFamilyFromHtml(html?: string): string | undefined {
  if (!html) return html;
  if (typeof document === 'undefined') return html;
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const allEls = temp.querySelectorAll('*');
  allEls.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.removeProperty('font-family');
      if (node.tagName.toLowerCase() === 'font' && node.hasAttribute('face')) {
        node.removeAttribute('face');
      }
      const styleAttr = node.getAttribute('style');
      if (styleAttr !== null && styleAttr.trim() === '') {
        node.removeAttribute('style');
      }
    }
  });
  return temp.innerHTML;
}

const INLINE_FORMAT_SELECTOR =
  'b,strong,i,em,u,ins,s,strike,del,font,span,mark,sub,sup';

/**
 * Strips ALL inline text formatting (font-family, font-size, color, bold, italic,
 * underline, strikethrough, spans, font tags, inline style attributes) from a bubble's
 * rich HTML string while preserving line breaks (<br>, <div>, <p>), so resetting a bubble
 * restores every character to the side's default style.
 */
export function stripAllInlineFormattingFromHtml(html?: string): string | undefined {
  if (!html) return html;
  if (typeof document === 'undefined') return html;
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 1. Remove inline style / font attributes from all elements
  const allEls = temp.querySelectorAll('*');
  allEls.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.removeAttribute('style');
      node.removeAttribute('color');
      node.removeAttribute('size');
      node.removeAttribute('face');
      node.removeAttribute('class');
    }
  });

  // 2. Unwrap all inline formatting tags while preserving their text and <br> children
  let inlineEl = temp.querySelector(INLINE_FORMAT_SELECTOR);
  while (inlineEl) {
    const parent = inlineEl.parentNode;
    if (parent) {
      while (inlineEl.firstChild) {
        parent.insertBefore(inlineEl.firstChild, inlineEl);
      }
      parent.removeChild(inlineEl);
    } else {
      break;
    }
    inlineEl = temp.querySelector(INLINE_FORMAT_SELECTOR);
  }

  return temp.innerHTML;
}

function normalizeCssColor(color?: string): string {
  if (!color) return '';
  if (typeof Option === 'undefined') return color.trim().toLowerCase();
  const s = new Option().style;
  s.color = color.trim();
  return (s.color || color.trim()).toLowerCase();
}

function normalizeFontFamilyName(fontFamily?: string): string {
  if (!fontFamily) return '';
  return fontFamily
    .split(',')[0]
    .replace(/['"]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Checks whether any character/substring in `html` has inline text formatting
 * (bold, italic, underline, strikethrough, color, fontSize, fontFamily) that differs
 * from the bubble's default style.
 */
export function hasInlineTextFormatting(
  html?: string,
  defaultStyle?: Partial<BubbleSideStyle>
): boolean {
  if (!html || typeof document === 'undefined') return false;
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const baseBold = Boolean(defaultStyle?.isBold);
  const baseItalic = Boolean(defaultStyle?.isItalic);
  const baseUnderline = Boolean(defaultStyle?.isUnderline);
  const baseStrikethrough = Boolean(defaultStyle?.isStrikethrough);
  const baseColor = normalizeCssColor(defaultStyle?.color);
  const baseFontSize = defaultStyle?.fontSize;
  const baseFontFamily = normalizeFontFamilyName(defaultStyle?.fontFamily);

  const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    const text = currentNode.textContent || '';
    if (text.length > 0) {
      const ancestors: HTMLElement[] = [];
      let curr = currentNode.parentElement;
      while (curr && curr !== temp) {
        ancestors.unshift(curr);
        curr = curr.parentElement;
      }

      if (ancestors.length > 0) {
        let isBold = baseBold;
        let isItalic = baseItalic;
        let isUnderline = baseUnderline;
        let isStrikethrough = baseStrikethrough;
        let color = baseColor;
        let fontSize = baseFontSize;
        let fontFamily = baseFontFamily;

        for (const el of ancestors) {
          const tag = el.tagName.toUpperCase();
          if (tag === 'B' || tag === 'STRONG') isBold = true;
          if (tag === 'I' || tag === 'EM') isItalic = true;
          if (tag === 'U' || tag === 'INS') isUnderline = true;
          if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') {
            isStrikethrough = true;
          }
          if (tag === 'FONT') {
            const attrColor = el.getAttribute('color');
            if (attrColor) color = normalizeCssColor(attrColor);
            const attrFace = el.getAttribute('face');
            if (attrFace) fontFamily = normalizeFontFamilyName(attrFace);
            const attrSize = el.getAttribute('size');
            if (attrSize) {
              const parsed = parseFloat(attrSize);
              if (!Number.isNaN(parsed)) fontSize = parsed;
            }
          }

          if (el.getAttribute('style')) {
            const fw = (el.style.fontWeight || '').trim().toLowerCase();
            if (fw) {
              if (fw === 'bold' || fw === 'bolder' || /^[6-9]00$/.test(fw)) {
                isBold = true;
              } else if (
                fw === 'normal' ||
                fw === 'lighter' ||
                /^[1-5]00$/.test(fw)
              ) {
                isBold = false;
              }
            }

            const fs = (el.style.fontStyle || '').trim().toLowerCase();
            if (fs) {
              if (fs === 'italic' || fs === 'oblique') {
                isItalic = true;
              } else if (fs === 'normal') {
                isItalic = false;
              }
            }

            const td = (
              (el.style.textDecoration || '') +
              ' ' +
              (el.style.textDecorationLine || '')
            ).toLowerCase();
            if (td.includes('underline')) isUnderline = true;
            if (td.includes('line-through')) isStrikethrough = true;
            if (td.trim() === 'none') {
              isUnderline = false;
              isStrikethrough = false;
            }

            if (el.style.color) {
              color = normalizeCssColor(el.style.color);
            }
            if (el.style.fontSize) {
              const parsed = parseFloat(el.style.fontSize);
              if (!Number.isNaN(parsed)) fontSize = parsed;
            }
            if (el.style.fontFamily) {
              fontFamily = normalizeFontFamilyName(el.style.fontFamily);
            }
          }
        }

        if (
          isBold !== baseBold ||
          isItalic !== baseItalic ||
          isUnderline !== baseUnderline ||
          isStrikethrough !== baseStrikethrough ||
          (baseColor && color !== baseColor) ||
          (baseFontSize !== undefined && fontSize !== baseFontSize) ||
          (baseFontFamily && fontFamily !== baseFontFamily)
        ) {
          return true;
        }
      }
    }
    currentNode = walker.nextNode();
  }

  return false;
}

/**
 * Clear saved selection
 */
export function clearSavedSelection() {
  if (savedBubbleId && typeof document !== 'undefined') {
    const el = document.getElementById(`bubble-text-${savedBubbleId}`);
    el?.removeAttribute('data-ps-color-active');
  }
  savedRange = null;
  savedBubbleId = null;
}

function rgbOrCssColorToHex(cssColor: string): string | null {
  if (!cssColor) return null;
  const trimmed = cssColor.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    return (
      '#' +
      [r, g, b]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
    );
  }
  return null;
}

/**
 * Returns the effective hex text color of the currently selected text inside a bubble, if any.
 */
export function getSelectionTextColor(bubbleId: string): string | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  const range = getSelectionWithinBubble(bubbleId);
  if (!range || range.collapsed || range.toString().trim().length === 0) {
    return null;
  }
  const container = document.getElementById(`bubble-text-${bubbleId}`);
  if (!container) return null;

  let targetEl: HTMLElement | null = null;
  const startNode = range.startContainer;
  if (startNode.nodeType === Node.TEXT_NODE) {
    targetEl = startNode.parentElement;
  } else if (startNode instanceof HTMLElement) {
    const child = startNode.childNodes[range.startOffset];
    if (child instanceof HTMLElement) {
      targetEl = child;
    } else if (child && child.parentElement) {
      targetEl = child.parentElement;
    } else {
      targetEl = startNode;
    }
  }

  while (targetEl && container.contains(targetEl)) {
    if (targetEl.style && targetEl.style.color) {
      const hex = rgbOrCssColorToHex(targetEl.style.color);
      if (hex) return hex;
    }
    if (targetEl.tagName.toLowerCase() === 'font') {
      const attrColor = targetEl.getAttribute('color');
      if (attrColor) {
        const hex = rgbOrCssColorToHex(attrColor);
        if (hex) return hex;
      }
    }
    if (targetEl === container) break;
    targetEl = targetEl.parentElement;
  }

  const computed = window.getComputedStyle(
    startNode.nodeType === Node.TEXT_NODE
      ? startNode.parentElement || container
      : (startNode as HTMLElement)
  ).color;
  return rgbOrCssColorToHex(computed);
}

/**
 * Get current selection range within the target bubble
 */
export function getSelectionWithinBubble(bubbleId: string): Range | null {
  try {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const container = document.getElementById(`bubble-text-${bubbleId}`);
      if (
        container &&
        (container.contains(range.commonAncestorContainer) ||
          container === range.commonAncestorContainer)
      ) {
        savedRange = range.cloneRange();
        savedBubbleId = bubbleId;
        return range;
      }
    }
  } catch {
    // Ignore selection errors
  }

  // Fallback to saved range if still valid for this bubble
  if (savedBubbleId === bubbleId && savedRange) {
    return savedRange;
  }

  return null;
}

/**
 * Restore the selection into the DOM
 */
export function restoreSelection(): boolean {
  if (!savedRange) return false;
  const sel = window.getSelection();
  if (!sel) return false;
  try {
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  } catch {
    return false;
  }
}

function cleanEmptySpans(root: DocumentFragment) {
  const spans = root.querySelectorAll('span');
  spans.forEach((s) => {
    const styleAttr = s.getAttribute('style');
    if (!styleAttr || styleAttr.trim() === '') {
      if (s.attributes.length <= 1) {
        const parent = s.parentNode;
        if (parent) {
          while (s.firstChild) {
            parent.insertBefore(s.firstChild, s);
          }
          parent.removeChild(s);
        }
      }
    }
  });
}

/**
 * Apply inline style or formatting command to the selected text within a bubble
 */
export function formatSelection(
  bubbleId: string,
  options: {
    command?: 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'removeFormat';
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  },
  onContentChange?: (newHtml: string, newText: string) => void
): boolean {
  const container = document.getElementById(`bubble-text-${bubbleId}`);
  if (!container) return false;

  const range = getSelectionWithinBubble(bubbleId);
  if (!range || range.collapsed) {
    return false;
  }

  // Ensure selection is active in DOM when not actively dragging a native input control
  const activeEl = document.activeElement as HTMLElement | null;
  const isUsingInputControl =
    activeEl &&
    (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT');

  const sel = window.getSelection();
  if (sel && !isUsingInputControl) {
    sel.removeAllRanges();
    sel.addRange(range);
  }

  if (!isUsingInputControl) {
    container.focus();
  }

  if (options.color) {
    container.setAttribute('data-ps-color-active', 'true');
  } else if (options.command === 'removeFormat') {
    container.removeAttribute('data-ps-color-active');
  }

  let executed = false;

  if (options.command === 'removeFormat') {
    try {
      document.execCommand('removeFormat', false);
      // Also clean any leftover inline styles inside the range
      const fragment = range.extractContents();
      const allEls = fragment.querySelectorAll('*');
      allEls.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.removeAttribute('style');
          if (el.tagName.toLowerCase() === 'font') {
            el.removeAttribute('size');
            el.removeAttribute('color');
            el.removeAttribute('face');
          }
        }
      });
      cleanEmptySpans(fragment);
      range.insertNode(fragment);
      executed = true;
    } catch {
      document.execCommand('removeFormat', false);
      executed = true;
    }
  } else if (options.command) {
    document.execCommand(options.command, false);
    executed = true;
  } else if (options.fontSize || options.fontFamily || options.color) {
    try {
      const commonNode = range.commonAncestorContainer;
      const parentEl =
        commonNode.nodeType === Node.TEXT_NODE
          ? commonNode.parentElement
          : (commonNode as HTMLElement);
      const selectedText = range.toString();

      let targetSpan: HTMLSpanElement | null = null;

      if (
        parentEl &&
        parentEl !== container &&
        container.contains(parentEl) &&
        parentEl.tagName.toLowerCase() === 'span' &&
        (parentEl.textContent || '') === selectedText
      ) {
        targetSpan = parentEl as HTMLSpanElement;
        const allDescendants = targetSpan.querySelectorAll('*');
        allDescendants.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (options.fontSize) {
              node.style.removeProperty('font-size');
              if (node.tagName.toLowerCase() === 'font' && node.hasAttribute('size')) {
                node.removeAttribute('size');
              }
            }
            if (options.fontFamily) {
              node.style.removeProperty('font-family');
              if (node.tagName.toLowerCase() === 'font' && node.hasAttribute('face')) {
                node.removeAttribute('face');
              }
            }
            if (options.color) {
              node.style.removeProperty('color');
              if (node.tagName.toLowerCase() === 'font' && node.hasAttribute('color')) {
                node.removeAttribute('color');
              }
            }
          }
        });
        if (options.fontSize) {
          targetSpan.style.fontSize = `${options.fontSize}px`;
        }
        if (options.fontFamily) {
          targetSpan.style.fontFamily = options.fontFamily;
        }
        if (options.color) {
          targetSpan.style.color = options.color;
        }
      } else {
        const fragment = range.extractContents();
        const allDescendants = fragment.querySelectorAll('*');

        // 1. Clear conflicting descendant styles so the newly chosen style rules all text uniformly
        allDescendants.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (options.fontSize) {
              node.style.removeProperty('font-size');
              if (node.tagName.toLowerCase() === 'font' && node.hasAttribute('size')) {
                node.removeAttribute('size');
              }
            }
            if (options.fontFamily) {
              node.style.removeProperty('font-family');
              if (node.tagName.toLowerCase() === 'font' && node.hasAttribute('face')) {
                node.removeAttribute('face');
              }
            }
            if (options.color) {
              node.style.removeProperty('color');
              if (node.tagName.toLowerCase() === 'font' && node.hasAttribute('color')) {
                node.removeAttribute('color');
              }
            }
          }
        });

        // 2. Clean up any redundant empty spans inside the extracted fragment
        cleanEmptySpans(fragment);

        // 3. Create the wrapping span with requested styles
        const span = document.createElement('span');
        if (options.fontSize) {
          span.style.fontSize = `${options.fontSize}px`;
        }
        if (options.fontFamily) {
          span.style.fontFamily = options.fontFamily;
        }
        if (options.color) {
          span.style.color = options.color;
        }

        span.appendChild(fragment);
        range.insertNode(span);
        targetSpan = span;
      }

      // 4. Reselect the newly styled content
      if (targetSpan) {
        const newRange = document.createRange();
        newRange.selectNodeContents(targetSpan);
        savedRange = newRange.cloneRange();
        savedBubbleId = bubbleId;
        if (sel && !isUsingInputControl) {
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
      executed = true;
    } catch {
      if (options.color) {
        document.execCommand('foreColor', false, options.color);
        executed = true;
      } else if (options.fontFamily) {
        document.execCommand('fontName', false, options.fontFamily);
        executed = true;
      }
    }
  }

  if (executed) {
    const updatedHtml = container.innerHTML;
    const updatedText = container.innerText;
    if (onContentChange) {
      onContentChange(updatedHtml, updatedText);
    }
    // Update saved range if browser selection is currently active inside the bubble
    if (sel && sel.rangeCount > 0 && !isUsingInputControl) {
      const currentRange = sel.getRangeAt(0);
      if (
        !currentRange.collapsed &&
        (container.contains(currentRange.commonAncestorContainer) ||
          container === currentRange.commonAncestorContainer)
      ) {
        savedRange = currentRange.cloneRange();
        savedBubbleId = bubbleId;
      }
    }
  }

  return executed;
}
