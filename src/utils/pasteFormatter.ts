export interface TextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export interface StyledSegment extends TextFormatState {
  text: string;
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'TR',
  'ARTICLE',
  'SECTION',
  'HEADER',
  'FOOTER',
  'ASIDE',
]);

const CONTAINER_ONLY_BLOCKS = new Set([
  'UL',
  'OL',
  'TABLE',
  'TBODY',
  'THEAD',
  'TFOOT',
]);

const IGNORED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'META',
  'LINK',
  'TITLE',
  'HEAD',
  'SVG',
  'NOSCRIPT',
]);

function computeFormatState(
  el: HTMLElement,
  parent: TextFormatState
): TextFormatState {
  const tag = el.tagName.toUpperCase();
  let { bold, italic, underline, strikethrough } = parent;

  if (tag === 'B' || tag === 'STRONG') bold = true;
  if (tag === 'I' || tag === 'EM') italic = true;
  if (tag === 'U' || tag === 'INS') underline = true;
  if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') strikethrough = true;

  const styleAttr = el.getAttribute('style');
  if (styleAttr && el.style) {
    const fw = (el.style.fontWeight || '').trim().toLowerCase();
    if (fw) {
      if (fw === 'bold' || fw === 'bolder' || /^[6-9]00$/.test(fw)) {
        bold = true;
      } else if (fw === 'normal' || fw === 'lighter' || /^[1-5]00$/.test(fw)) {
        bold = false;
      }
    }

    const fs = (el.style.fontStyle || '').trim().toLowerCase();
    if (fs) {
      if (fs === 'italic' || fs === 'oblique') {
        italic = true;
      } else if (fs === 'normal') {
        italic = false;
      }
    }

    const td = (
      (el.style.textDecoration || '') +
      ' ' +
      (el.style.textDecorationLine || '')
    ).toLowerCase();
    if (td.includes('underline')) underline = true;
    if (td.includes('line-through')) strikethrough = true;
  }

  return { bold, italic, underline, strikethrough };
}

function hasChildBlockElement(el: HTMLElement): boolean {
  for (let i = 0; i < el.children.length; i++) {
    const childTag = el.children[i].tagName.toUpperCase();
    if (BLOCK_TAGS.has(childTag) || CONTAINER_ONLY_BLOCKS.has(childTag)) {
      return true;
    }
  }
  return false;
}

function isEmptyLeafBlock(el: HTMLElement): boolean {
  if (hasChildBlockElement(el)) return false;
  const text = (el.textContent || '').replace(/[\s\u00A0\u200B]+/g, '');
  if (text.length > 0) return false;

  const brCount = el.querySelectorAll('br').length;
  // A block with 0 or 1 <br> and no visible text (e.g. <p><br></p> or <p>&nbsp;</p>) is a single intentional blank line
  return brCount <= 1;
}

function isTrailingPlaceholderBr(node: Node, parentEl: HTMLElement): boolean {
  if (
    node.nodeType !== Node.ELEMENT_NODE ||
    (node as HTMLElement).tagName.toUpperCase() !== 'BR'
  ) {
    return false;
  }
  const parentTag = parentEl.tagName.toUpperCase();
  if (!BLOCK_TAGS.has(parentTag)) return false;

  // Check if there is any meaningful sibling after this <br>
  let next = node.nextSibling;
  while (next) {
    if (next.nodeType === Node.ELEMENT_NODE) return false;
    if (
      next.nodeType === Node.TEXT_NODE &&
      (next.textContent || '').replace(/[\r\n\t ]+/g, '').length > 0
    ) {
      return false;
    }
    next = next.nextSibling;
  }

  // Only treat as placeholder if the block already had visible text or a preceding <br>
  let prev = node.previousSibling;
  while (prev) {
    if (prev.nodeType === Node.ELEMENT_NODE) {
      const prevTag = (prev as HTMLElement).tagName.toUpperCase();
      if (prevTag === 'BR') return false; // <br><br> at end of block -> second <br> is an intentional blank line
      if ((prev.textContent || '').replace(/[\s\u00A0\u200B]+/g, '').length > 0) {
        return true;
      }
    } else if (
      prev.nodeType === Node.TEXT_NODE &&
      (prev.textContent || '').replace(/[\s\u00A0\u200B]+/g, '').length > 0
    ) {
      return true;
    }
    prev = prev.previousSibling;
  }

  return false;
}

function appendSegmentToLine(
  line: StyledSegment[],
  text: string,
  format: TextFormatState
): void {
  if (!text) return;
  const last = line[line.length - 1];
  if (
    last &&
    last.bold === format.bold &&
    last.italic === format.italic &&
    last.underline === format.underline &&
    last.strikethrough === format.strikethrough
  ) {
    last.text += text;
  } else {
    line.push({
      text,
      bold: format.bold,
      italic: format.italic,
      underline: format.underline,
      strikethrough: format.strikethrough,
    });
  }
}

function normalizePlainTextLineBreaks(plainText: string): string[] {
  const normalized = plainText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Check if the text only uses \n\n (no single \n) while having multiple lines:
  // wait - if plainText came without HTML, we preserve single \n and \n\n as-is unless every break is >=2 and there are 3+ lines
  return normalized.split('\n');
}

/**
 * Parses clipboard HTML and plain text into an array of lines of styled segments.
 * - Distinguishes 1 line break (<p>A</p><p>B</p> or A<br>B) from intentional 2 line breaks (<p>A</p><p><br></p><p>B</p> or A<br><br>B).
 * - Preserves bold, italic, underline, and strikethrough formatting while ignoring foreign fonts/colors/sizes.
 */
export function parseClipboardToStyledLines(
  htmlData: string,
  plainText: string
): StyledSegment[][] {
  const defaultFormat: TextFormatState = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  };

  if (htmlData && typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(htmlData, 'text/html');
      const body = doc.body;
      if (body && (body.textContent || '').trim().length > 0) {
        const hasBlocksOrBr =
          body.querySelector(
            'p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr, br'
          ) !== null;

        const lines: StyledSegment[][] = [];
        let currentLine: StyledSegment[] = [];
        let hasOpenLine = false;

        const flushCurrentLine = () => {
          lines.push(currentLine);
          currentLine = [];
          hasOpenLine = false;
        };

        const walk = (
          node: Node,
          format: TextFormatState,
          inPre: boolean,
          parentEl: HTMLElement
        ) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const raw = node.textContent || '';
            if (!raw) return;

            // Ignore inter-element formatting whitespace between block tags
            if (hasBlocksOrBr && !inPre && /^[\r\n\t ]+$/.test(raw)) {
              const prevIsBlock =
                !node.previousSibling ||
                (node.previousSibling.nodeType === Node.ELEMENT_NODE &&
                  (BLOCK_TAGS.has(
                    (node.previousSibling as HTMLElement).tagName.toUpperCase()
                  ) ||
                    CONTAINER_ONLY_BLOCKS.has(
                      (node.previousSibling as HTMLElement).tagName.toUpperCase()
                    )));
              const nextIsBlock =
                !node.nextSibling ||
                (node.nextSibling.nodeType === Node.ELEMENT_NODE &&
                  (BLOCK_TAGS.has(
                    (node.nextSibling as HTMLElement).tagName.toUpperCase()
                  ) ||
                    CONTAINER_ONLY_BLOCKS.has(
                      (node.nextSibling as HTMLElement).tagName.toUpperCase()
                    )));
              if (prevIsBlock || nextIsBlock) {
                if (/[\r\n]/.test(raw)) {
                  return;
                }
              }
            }

            const cleaned = raw.replace(/\u00A0/g, ' ');

            if (inPre || !hasBlocksOrBr) {
              const parts = cleaned.split(/\r?\n/);
              parts.forEach((part, idx) => {
                if (idx > 0) {
                  flushCurrentLine();
                }
                if (part.length > 0) {
                  appendSegmentToLine(currentLine, part, format);
                  hasOpenLine = true;
                }
              });
            } else {
              const inlineText = cleaned.replace(/[\r\n]+/g, ' ');
              if (inlineText.length > 0) {
                appendSegmentToLine(currentLine, inlineText, format);
                hasOpenLine = true;
              }
            }
            return;
          }

          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as HTMLElement;
          const tag = el.tagName.toUpperCase();

          if (IGNORED_TAGS.has(tag)) return;

          if (tag === 'BR') {
            if (isTrailingPlaceholderBr(el, parentEl)) {
              return;
            }
            flushCurrentLine();
            return;
          }

          const nextFormat = computeFormatState(el, format);
          const nextInPre =
            inPre ||
            tag === 'PRE' ||
            (el.style &&
              (el.style.whiteSpace === 'pre' ||
                el.style.whiteSpace === 'pre-wrap' ||
                el.style.whiteSpace === 'pre-line'));

          const isBlock = BLOCK_TAGS.has(tag);

          if (isBlock) {
            if (hasOpenLine) {
              flushCurrentLine();
            }

            if (isEmptyLeafBlock(el)) {
              // Intentional empty block (<p><br></p> or <p>&nbsp;</p>) -> 1 blank line
              lines.push([]);
              return;
            }

            for (let i = 0; i < el.childNodes.length; i++) {
              walk(el.childNodes[i], nextFormat, nextInPre, el);
            }

            if (hasOpenLine) {
              flushCurrentLine();
            }
          } else {
            for (let i = 0; i < el.childNodes.length; i++) {
              walk(el.childNodes[i], nextFormat, nextInPre, parentEl);
            }
          }
        };

        for (let i = 0; i < body.childNodes.length; i++) {
          walk(body.childNodes[i], defaultFormat, false, body);
        }
        if (hasOpenLine) {
          flushCurrentLine();
        }

        // Trim accidental empty wrapper lines at very start/end unless plainText also starts/ends with newline
        const plainStartsNewline = /^\r?\n/.test(plainText);
        const plainEndsNewline = /\r?\n$/.test(plainText);
        while (lines.length > 1 && lines[0].length === 0 && !plainStartsNewline) {
          lines.shift();
        }
        while (
          lines.length > 1 &&
          lines[lines.length - 1].length === 0 &&
          !plainEndsNewline
        ) {
          lines.pop();
        }

        if (lines.length > 0) {
          return lines;
        }
      }
    } catch {
      // Fallback to plainText below
    }
  }

  const plainLines = normalizePlainTextLineBreaks(plainText);
  return plainLines.map((lineText) =>
    lineText.length > 0 ? [{ text: lineText, ...defaultFormat }] : []
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPasteContentFromClipboard(
  htmlData: string,
  plainText: string
): {
  fragment: DocumentFragment;
  lastNode: Node | null;
  htmlString: string;
  plainString: string;
  hasFormatting: boolean;
} {
  const lines = parseClipboardToStyledLines(htmlData, plainText);
  const fragment = document.createDocumentFragment();
  let lastNode: Node | null = null;
  let hasFormatting = false;

  const htmlLineStrings: string[] = [];
  const plainLineStrings: string[] = [];

  lines.forEach((lineSegments, lineIdx) => {
    if (lineIdx > 0) {
      const br = document.createElement('br');
      fragment.appendChild(br);
      lastNode = br;
    }

    let lineHtml = '';
    let linePlain = '';

    lineSegments.forEach((seg) => {
      if (!seg.text) return;
      linePlain += seg.text;

      let node: Node = document.createTextNode(seg.text);
      let segHtml = escapeHtml(seg.text);

      if (seg.strikethrough) {
        hasFormatting = true;
        const sEl = document.createElement('s');
        sEl.appendChild(node);
        node = sEl;
        segHtml = `<s>${segHtml}</s>`;
      }
      if (seg.underline) {
        hasFormatting = true;
        const uEl = document.createElement('u');
        uEl.appendChild(node);
        node = uEl;
        segHtml = `<u>${segHtml}</u>`;
      }
      if (seg.italic) {
        hasFormatting = true;
        const iEl = document.createElement('i');
        iEl.appendChild(node);
        node = iEl;
        segHtml = `<i>${segHtml}</i>`;
      }
      if (seg.bold) {
        hasFormatting = true;
        const bEl = document.createElement('b');
        bEl.appendChild(node);
        node = bEl;
        segHtml = `<b>${segHtml}</b>`;
      }

      fragment.appendChild(node);
      lastNode = node;
      lineHtml += segHtml;
    });

    htmlLineStrings.push(lineHtml);
    plainLineStrings.push(linePlain);
  });

  return {
    fragment,
    lastNode,
    htmlString: htmlLineStrings.join('<br>'),
    plainString: plainLineStrings.join('\n'),
    hasFormatting,
  };
}

export function applyTextareaClipboardPaste(
  e: {
    preventDefault: () => void;
    currentTarget: HTMLTextAreaElement;
    clipboardData: DataTransfer;
  },
  currentText: string,
  onUpdate: (patch: { text: string; html?: string }) => void
): void {
  const htmlData = e.clipboardData.getData('text/html');
  const plainText = e.clipboardData.getData('text/plain');
  if (!htmlData && !plainText) return;

  e.preventDefault();
  const textarea = e.currentTarget;
  const start = textarea.selectionStart ?? currentText.length;
  const end = textarea.selectionEnd ?? currentText.length;

  const { htmlString, plainString, hasFormatting } =
    buildPasteContentFromClipboard(htmlData, plainText);

  const before = currentText.slice(0, start);
  const after = currentText.slice(end);
  const nextText = before + plainString + after;

  if (hasFormatting) {
    const beforeHtml = escapeHtml(before).replace(/\r?\n/g, '<br>');
    const afterHtml = escapeHtml(after).replace(/\r?\n/g, '<br>');
    onUpdate({
      text: nextText,
      html: beforeHtml + htmlString + afterHtml,
    });
  } else {
    onUpdate({
      text: nextText,
      html: undefined,
    });
  }

  requestAnimationFrame(() => {
    try {
      const nextCursor = start + plainString.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    } catch {
      // Ignore if textarea unmounted
    }
  });
}
