// Utility for applying rich-text formatting to selected substrings within a speech bubble

let savedRange: Range | null = null;
let savedBubbleId: string | null = null;

/**
 * Save current text selection if it is inside the given bubble
 */
export function recordSelection(bubbleId: string) {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
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

/**
 * Clear saved selection
 */
export function clearSavedSelection() {
  savedRange = null;
  savedBubbleId = null;
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

  // Ensure selection is active in DOM
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Focus container
  container.focus();

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

      // 4. Reselect the newly styled content
      if (sel) {
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.addRange(newRange);
        savedRange = newRange.cloneRange();
        savedBubbleId = bubbleId;
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
    // Update saved range
    if (sel && sel.rangeCount > 0) {
      savedRange = sel.getRangeAt(0).cloneRange();
      savedBubbleId = bubbleId;
    }
  }

  return executed;
}
