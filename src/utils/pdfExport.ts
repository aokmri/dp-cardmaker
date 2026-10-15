import { jsPDF } from 'jspdf';

export interface ExtractedTextLine {
  text: string;
  ptX: number;
  ptY: number;
  ptWidth: number;
  ptHeight: number;
  fontSizePt: number;
}

let cachedFontBase64: string | null = null;
let fontLoadPromise: Promise<string | null> | null = null;

const LOCAL_FONT_PATH = '/fonts/NanumGothic.ttf';
const CDN_FONT_PATH =
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf';

/**
 * Converts an ArrayBuffer to a standard base64 string safely without stack overflow.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Loads the Korean TTF font for PDF export.
 * Caches in memory for instant reuse on subsequent exports.
 */
export async function getKoreanPdfFontBase64(): Promise<string | null> {
  if (cachedFontBase64) return cachedFontBase64;
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    try {
      // 1. Try local same-origin font first
      const res = await fetch(LOCAL_FONT_PATH);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        cachedFontBase64 = arrayBufferToBase64(buffer);
        return cachedFontBase64;
      }
    } catch {
      // fallback to CDN
    }

    try {
      // 2. Fallback to public CDN
      const res = await fetch(CDN_FONT_PATH);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        cachedFontBase64 = arrayBufferToBase64(buffer);
        return cachedFontBase64;
      }
    } catch (err) {
      console.warn('Could not load Korean PDF font for text layer:', err);
    }

    return null;
  })();

  return fontLoadPromise;
}

/**
 * Preloads the font in the background so export is instantaneous.
 */
export function preloadPdfFont() {
  if (typeof window !== 'undefined') {
    getKoreanPdfFontBase64().catch(() => {});
  }
}

/**
 * Extracts visible text lines and their precise bounding boxes relative to canvasEl,
 * converting CSS pixels into standard PDF points (1 px = 0.75 pt).
 */
export function extractCanvasTextLines(canvasEl: HTMLElement): ExtractedTextLine[] {
  if (typeof window === 'undefined' || !canvasEl) return [];

  const canvasRect = canvasEl.getBoundingClientRect();
  const scale = 0.75; // 72 pt/in / 96 px/in
  const extractedLines: ExtractedTextLine[] = [];

  const walker = document.createTreeWalker(
    canvasEl,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        // Skip non-text visual controls (buttons, icons, drop indicators)
        if (
          parent.closest('button') ||
          parent.closest('svg') ||
          parent.closest('[data-pdf-ignore]')
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        // Check if element is visually rendered
        const style = window.getComputedStyle(parent);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          parseFloat(style.opacity || '1') === 0
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    if (!parent) continue;

    const style = window.getComputedStyle(parent);
    const fontSizePx = parseFloat(style.fontSize) || 16;
    const fontSizePt = Math.max(8, fontSizePx * scale);

    const fullText = textNode.nodeValue || '';
    if (!fullText.trim()) continue;

    const range = document.createRange();

    // Group characters into lines based on vertical baseline / top change
    let currentLine = '';
    let lineStartOffset = 0;
    let currentTop: number | null = null;

    const pushLine = (endOffset: number) => {
      const trimmed = currentLine.trim();
      if (!trimmed) return;

      const leadingSpaces = currentLine.match(/^\s*/)?.[0].length || 0;
      const startIdx = lineStartOffset + leadingSpaces;
      const endIdx = Math.min(fullText.length, startIdx + trimmed.length);

      try {
        range.setStart(textNode, startIdx);
        range.setEnd(textNode, endIdx);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          const ptX = (rect.left - canvasRect.left) * scale;
          const ptY = (rect.top - canvasRect.top) * scale;
          const ptWidth = rect.width * scale;
          const ptHeight = rect.height * scale;

          extractedLines.push({
            text: trimmed,
            ptX,
            ptY,
            ptWidth,
            ptHeight,
            fontSizePt,
          });
        }
      } catch {
        // ignore range clamp errors
      }
    };

    for (let i = 0; i < fullText.length; i++) {
      const ch = fullText[i];
      if (ch === '\r' || ch === '\n') {
        if (currentLine.trim()) {
          pushLine(i);
        }
        currentLine = '';
        currentTop = null;
        lineStartOffset = i + 1;
        continue;
      }

      try {
        range.setStart(textNode, i);
        range.setEnd(textNode, i + 1);
        const rects = range.getClientRects();

        if (!rects || rects.length === 0) {
          currentLine += ch;
          continue;
        }

        const charTop = rects[0].top;

        if (currentTop === null) {
          currentTop = charTop;
          currentLine = ch;
          lineStartOffset = i;
        } else if (Math.abs(charTop - currentTop) > fontSizePx * 0.45) {
          // New line detected
          if (currentLine.trim()) {
            pushLine(i);
          }
          currentTop = charTop;
          currentLine = ch;
          lineStartOffset = i;
        } else {
          currentLine += ch;
        }
      } catch {
        currentLine += ch;
      }
    }

    if (currentLine.trim()) {
      pushLine(fullText.length);
    }
  }

  return extractedLines;
}

/**
 * Creates a high-fidelity PDF with:
 * 1. 2.5x sharp raster image layer (preserves 100% of fonts, strokes, textures, shadows)
 * 2. Invisible Unicode text layer (enables mouse drag selection, copying, and Ctrl+F text search)
 */
export async function exportCardToPdf(
  canvasEl: HTMLDivElement,
  dataUrl: string,
  filename: string
): Promise<void> {
  const widthPx = canvasEl.offsetWidth;
  const heightPx = canvasEl.offsetHeight;

  const ptWidth = widthPx * 0.75;
  const ptHeight = heightPx * 0.75;
  const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [ptWidth, ptHeight],
    compress: true,
  });

  // 1. Embed 2.5x high-res raster background image layer
  pdf.addImage(dataUrl, 'PNG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');

  // 2. Extract rendered text positions from the card DOM
  const textLines = extractCanvasTextLines(canvasEl);

  // 3. Register Korean TTF font for Unicode text search and copy layer
  const fontBase64 = await getKoreanPdfFontBase64();
  const hasKoreanFont = Boolean(fontBase64);

  if (hasKoreanFont && fontBase64) {
    try {
      pdf.addFileToVFS('NanumGothic.ttf', fontBase64);
      pdf.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
      pdf.setFont('NanumGothic');
    } catch (e) {
      console.warn('Failed to register NanumGothic in jsPDF, falling back to standard font', e);
    }
  }

  // 4. Render invisible text layer (PDF Rendering Mode 3 = Neither fill nor stroke text)
  for (const line of textLines) {
    try {
      pdf.setFontSize(line.fontSizePt);

      let charSpace: number | undefined = undefined;
      if (line.text.length > 1 && line.ptWidth > 0) {
        const textWidth = pdf.getTextWidth(line.text);
        if (textWidth > 0) {
          const diff = line.ptWidth - textWidth;
          const space = diff / (line.text.length - 1);
          // clamp charSpace within reasonable bounds (-3 to 12 pt) to prevent extreme jumps
          charSpace = Math.max(-3, Math.min(12, space));
        }
      }

      pdf.text(line.text, line.ptX, line.ptY, {
        baseline: 'top',
        renderingMode: 'invisible', // invisible text layer
        charSpace: charSpace !== undefined ? charSpace : undefined,
      });
    } catch (err) {
      // Continue overlaying other lines if a single line fails
      console.warn('Failed to place text line in PDF text layer:', line.text, err);
    }
  }

  // 5. Save the resulting PDF
  pdf.save(filename);
}
