import { jsPDF } from 'jspdf';
import { toSvg } from 'html-to-image';

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
  const widthPx = canvasEl.offsetWidth || 600;
  const heightPx = canvasEl.offsetHeight || 1000;
  const scaleX = canvasRect.width > 0 ? canvasRect.width / widthPx : 1;
  const scaleY = canvasRect.height > 0 ? canvasRect.height / heightPx : 1;
  const pdfScale = 0.75; // 72 pt/in / 96 px/in
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
    const fontSizePt = Math.max(8, fontSizePx * pdfScale);

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
          const unscaledLeft = (rect.left - canvasRect.left) / scaleX;
          const unscaledTop = (rect.top - canvasRect.top) / scaleY;
          const unscaledWidth = rect.width / scaleX;
          const unscaledHeight = rect.height / scaleY;

          const ptX = unscaledLeft * pdfScale;
          const ptY = unscaledTop * pdfScale;
          const ptWidth = unscaledWidth * pdfScale;
          const ptHeight = unscaledHeight * pdfScale;

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
 * Creates a single continuous high-fidelity PDF page:
 * 1. For long documents, renders seamlessly in vertical chunks directly from vector SVG at 3.0x (288 DPI).
 *    This completely bypasses browser canvas limits (16,384px) and prevents downsampling blur!
 * 2. Invisible Unicode text layer enables full selection, copying, and text search across the single page.
 */
export async function exportCardToPdf(
  canvasEl: HTMLDivElement,
  dataUrlOrNull: string | null,
  filename: string,
  fontEmbedCSS?: string
): Promise<void> {
  const widthPx = canvasEl.offsetWidth || 600;
  const heightPx = canvasEl.offsetHeight || 1000;

  const ptWidth = widthPx * 0.75;
  const ptHeight = heightPx * 0.75;
  const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [ptWidth, ptHeight],
    compress: true,
  });

  // 1. Primary Engine: Prepare Vector SVG for chunked rendering (bypasses browser canvas dimension limits)
  let svgImg: HTMLImageElement | null = null;
  try {
    const svgDataUrl = await toSvg(canvasEl, {
      fontEmbedCSS,
      filter: (node) =>
        typeof HTMLIFrameElement === 'undefined' ||
        !(node instanceof HTMLIFrameElement),
    });
    svgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = svgDataUrl;
    });
  } catch (err) {
    console.warn('Vector toSvg preparation failed in exportCardToPdf, using fallback:', err);
  }

  const ratio = 3.0; // 3.0x ultra-sharp print resolution (288 DPI)
  const targetWidthPx = widthPx * ratio;

  if (svgImg) {
    // Render the single continuous page in vertical bands of at most 2,500px each
    // Each band canvas is only ~7,500px tall (way below the 16,384px limit), preventing any downscaling!
    let currentTop = 0;
    while (currentTop < heightPx) {
      const chunkHeight = Math.min(2500, heightPx - currentTop);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = targetWidthPx;
      sliceCanvas.height = Math.max(1, Math.round(chunkHeight * ratio));

      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          svgImg,
          0,
          currentTop,
          widthPx,
          chunkHeight,
          0,
          0,
          sliceCanvas.width,
          sliceCanvas.height
        );
      }
      const chunkDataUrl = sliceCanvas.toDataURL('image/png');

      const chunkPtTop = currentTop * 0.75;
      const chunkPtHeight = chunkHeight * 0.75;

      pdf.addImage(
        chunkDataUrl,
        'PNG',
        0,
        chunkPtTop,
        ptWidth,
        chunkPtHeight,
        undefined,
        'FAST'
      );

      currentTop += chunkHeight;
    }
  } else if (dataUrlOrNull) {
    // Fallback: Embed direct raster image
    pdf.addImage(dataUrlOrNull, 'PNG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
  }

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

export interface PdfSlice {
  topPx: number;
  heightPx: number;
  bottomPx: number;
}

/**
 * Calculates optimal vertical slice boundaries so that:
 * 1. Slices approach A4 aspect ratio (1 : √2 ≈ 1.4142) without forcing rigid heights.
 * 2. NO speech bubble is EVER cut in the middle or edges.
 *    The split criteria strictly uses the speech bubble card wrapping the text, preserving tails, padding, borders, and metadata.
 * 3. Page heights expand/shrink flexibly to find the natural safe gaps between speech bubbles.
 */
export function calculateOptimalPdfSlices(canvasEl: HTMLElement): PdfSlice[] {
  if (typeof window === 'undefined' || !canvasEl) {
    return [{ topPx: 0, heightPx: 1000, bottomPx: 1000 }];
  }

  const canvasRect = canvasEl.getBoundingClientRect();
  const canvasWidth = canvasEl.offsetWidth || 600;
  const canvasHeight = canvasEl.offsetHeight || 1000;

  // Scale factor to normalize viewport client rect coordinates to true unscaled CSS layout coordinates
  const scaleY = canvasRect.height > 0 ? canvasRect.height / canvasHeight : 1;
  const toLayoutY = (clientCoord: number) => (clientCoord - canvasRect.top) / scaleY;

  // Standard A4 aspect ratio height in CSS pixels (1 : 1.4142)
  const a4TargetHeightPx = canvasWidth * Math.SQRT2;

  // If the canvas is already roughly 1 page or smaller, no split is needed
  if (canvasHeight <= a4TargetHeightPx * 1.15) {
    return [{ topPx: 0, heightPx: canvasHeight, bottomPx: canvasHeight }];
  }

  // 1. Identify forbidden zones (areas that must NOT be cut through)
  const forbiddenZones: { top: number; bottom: number }[] = [];

  // Header decorative section
  const stageEl = canvasEl.querySelector('#canvas-dialogue-stage');
  const bubblesAreaEl = canvasEl.querySelector('#canvas-bubbles-area');
  if (stageEl && bubblesAreaEl) {
    const headerEl = bubblesAreaEl.previousElementSibling as HTMLElement | null;
    if (headerEl && headerEl.offsetHeight > 0) {
      const hBottom = toLayoutY(headerEl.getBoundingClientRect().bottom) + 6;
      if (hBottom > 0) {
        forbiddenZones.push({ top: 0, bottom: hBottom });
      }
    }
  }

  // Footer decorative section
  if (stageEl && bubblesAreaEl) {
    const footerEl = bubblesAreaEl.nextElementSibling as HTMLElement | null;
    if (footerEl && footerEl.offsetHeight > 0) {
      const fTop = toLayoutY(footerEl.getBoundingClientRect().top) - 6;
      if (fTop < canvasHeight) {
        forbiddenZones.push({ top: fTop, bottom: canvasHeight });
      }
    }
  }

  // 2. Identify all speech bubbles using the bubble card that wraps the text as the primary boundary
  const rowEls = Array.from(canvasEl.querySelectorAll<HTMLElement>('[data-bubble-row-index]'));
  const bubbleCards: { top: number; bottom: number }[] = [];

  if (rowEls.length > 0) {
    for (const row of rowEls) {
      // Find the visual bubble card wrapping the text
      const box = row.querySelector<HTMLElement>('[id^="bubble-box-"]') || row;
      const cont = row.querySelector<HTMLElement>('[id^="bubble-container-"]') || row;
      const boxRect = box.getBoundingClientRect();
      const contRect = cont.getBoundingClientRect();

      // The entire bubble boundary including speaker name, date, bubble card, shadow, and tail
      const top = Math.min(toLayoutY(boxRect.top), toLayoutY(contRect.top));
      const bottom = Math.max(toLayoutY(boxRect.bottom), toLayoutY(contRect.bottom));

      // Buffer of 4px to ensure borders and shadows are completely enclosed
      const bTop = Math.max(0, top - 4);
      const bBottom = Math.min(canvasHeight, bottom + 4);

      if (bBottom > bTop) {
        bubbleCards.push({ top: bTop, bottom: bBottom });
      }
    }
  } else {
    // Fallback: query by bubble container or box
    const fallbackEls = Array.from(
      canvasEl.querySelectorAll<HTMLElement>('[id^="bubble-box-"], [id^="bubble-container-"]')
    );
    for (const el of fallbackEls) {
      const rect = el.getBoundingClientRect();
      const top = Math.max(0, toLayoutY(rect.top) - 4);
      const bottom = Math.min(canvasHeight, toLayoutY(rect.bottom) + 4);
      if (bottom > top) {
        bubbleCards.push({ top, bottom });
      }
    }
  }

  for (const b of bubbleCards) {
    forbiddenZones.push(b);
  }

  // Sort forbidden zones from top to bottom
  forbiddenZones.sort((a, b) => a.top - b.top);

  // Merge overlapping or nearly adjacent forbidden zones
  const mergedZones: { top: number; bottom: number }[] = [];
  for (const zone of forbiddenZones) {
    if (mergedZones.length === 0) {
      mergedZones.push({ ...zone });
    } else {
      const last = mergedZones[mergedZones.length - 1];
      if (zone.top <= last.bottom + 2) {
        last.bottom = Math.max(last.bottom, zone.bottom);
      } else {
        mergedZones.push({ ...zone });
      }
    }
  }

  // 3. Derive 100% safe cut gaps between forbidden zones (strictly in open space between speech bubbles)
  interface SafeGap {
    top: number;
    bottom: number;
    cutY: number;
  }
  const safeGaps: SafeGap[] = [];
  for (let i = 0; i < mergedZones.length - 1; i++) {
    const gapTop = mergedZones[i].bottom;
    const gapBottom = mergedZones[i + 1].top;
    if (gapBottom > gapTop) {
      safeGaps.push({
        top: gapTop,
        bottom: gapBottom,
        cutY: Math.round((gapTop + gapBottom) / 2),
      });
    }
  }

  // If no safe gap can be found (e.g. single giant continuous block), return 1 page
  if (safeGaps.length === 0) {
    return [{ topPx: 0, heightPx: canvasHeight, bottomPx: canvasHeight }];
  }

  // 4. Dynamically segment into balanced A4-like pages
  const cuts: number[] = [0];
  let currentTop = 0;

  while (currentTop < canvasHeight) {
    const remaining = canvasHeight - currentTop;
    // If remaining content fits comfortably on 1 page (within 1.15x of A4 target), finalize
    if (remaining <= a4TargetHeightPx * 1.15) {
      cuts.push(canvasHeight);
      break;
    }

    // Estimate how many pages remain to balance heights harmoniously
    const estimatedPagesRem = Math.max(1, Math.round(remaining / a4TargetHeightPx));
    const balancedTargetHeight = remaining / estimatedPagesRem;
    const idealCut = currentTop + balancedTargetHeight;

    // Minimum distance from currentTop (at least 30% of target or 180px) to prevent tiny slivers
    const minCut = currentTop + Math.min(180, a4TargetHeightPx * 0.3);
    const validGaps = safeGaps.filter(
      (g) => g.cutY >= minCut && g.cutY < canvasHeight - 20
    );

    if (validGaps.length === 0) {
      // Pick any gap strictly after currentTop + 20
      const fallbackGaps = safeGaps.filter((g) => g.cutY > currentTop + 20);
      if (fallbackGaps.length > 0) {
        const chosen = fallbackGaps[0];
        cuts.push(chosen.cutY);
        currentTop = chosen.cutY;
      } else {
        cuts.push(canvasHeight);
        break;
      }
    } else {
      // Pick the gap closest to idealCut
      let bestGap = validGaps[0];
      let bestDiff = Math.abs(bestGap.cutY - idealCut);
      for (let j = 1; j < validGaps.length; j++) {
        const diff = Math.abs(validGaps[j].cutY - idealCut);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestGap = validGaps[j];
        }
      }
      cuts.push(bestGap.cutY);
      currentTop = bestGap.cutY;
    }
  }

  const slices: PdfSlice[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const topPx = cuts[i];
    const bottomPx = cuts[i + 1];
    const heightPx = bottomPx - topPx;
    if (heightPx > 0) {
      slices.push({ topPx, bottomPx, heightPx });
    }
  }

  return slices.length > 0
    ? slices
    : [{ topPx: 0, heightPx: canvasHeight, bottomPx: canvasHeight }];
}

/**
 * Creates a multi-page high-fidelity PDF by splitting the canvas into A4-proportional pages:
 * 1. Speech bubbles are never cut through (boundaries strictly sit between bubbles).
 * 2. Each page is rendered independently from vector SVG at 3.0x ultra-high resolution (288 DPI).
 *    Because slices are rendered individually (~2,500px canvases), it NEVER exceeds browser
 *    canvas limits (16,384px) and NEVER downsamples, even for infinitely long conversations!
 * 3. Invisible Unicode text layer is accurately synchronized with the image position on each page (0 drift).
 */
export async function exportCardToSplitPdf(
  canvasEl: HTMLDivElement,
  dataUrlOrNull: string | null,
  filename: string,
  fontEmbedCSS?: string
): Promise<{ pageCount: number }> {
  const widthPx = canvasEl.offsetWidth || 600;
  const heightPx = canvasEl.offsetHeight || 1000;

  const slices = calculateOptimalPdfSlices(canvasEl);

  // 1. Primary Engine: Prepare Vector SVG for chunked rendering (bypasses browser canvas dimension limits)
  let svgImg: HTMLImageElement | null = null;
  try {
    const svgDataUrl = await toSvg(canvasEl, {
      fontEmbedCSS,
      filter: (node) =>
        typeof HTMLIFrameElement === 'undefined' ||
        !(node instanceof HTMLIFrameElement),
    });
    svgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = svgDataUrl;
    });
  } catch (err) {
    console.warn('Vector toSvg preparation failed, will use fallback:', err);
  }

  // Fallback: If vector SVG fails, load provided raster dataUrl
  let fallbackImg: HTMLImageElement | null = null;
  if (!svgImg && dataUrlOrNull) {
    fallbackImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = dataUrlOrNull;
    });
  }

  // Extract visible text lines with unscaled layout coordinates
  const textLines = extractCanvasTextLines(canvasEl);

  // Register Korean TTF font for Unicode text search and copy layer
  const fontBase64 = await getKoreanPdfFontBase64();

  let pdf: jsPDF | null = null;
  const ratio = 3.0; // 3.0x sharp print resolution (288 DPI)
  const targetWidthPx = widthPx * ratio;

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const pagePtWidth = widthPx * 0.75;
    const pagePtHeight = slice.heightPx * 0.75;
    const orientation = pagePtWidth > pagePtHeight ? 'landscape' : 'portrait';

    let sliceDataUrl: string = '';

    if (svgImg) {
      // Render this page slice directly from vector SVG into an independent small canvas
      // Total canvas height is only ~2,500px, completely immune to 16,384px browser downscaling!
      const sliceCanvas = document.createElement('canvas');
      const targetHeightPx = Math.max(1, Math.round(slice.heightPx * ratio));
      sliceCanvas.width = targetWidthPx;
      sliceCanvas.height = targetHeightPx;

      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          svgImg,
          0,
          slice.topPx,
          widthPx,
          slice.heightPx,
          0,
          0,
          sliceCanvas.width,
          sliceCanvas.height
        );
      }
      sliceDataUrl = sliceCanvas.toDataURL('image/png');
    } else if (fallbackImg) {
      const imgScaleY = fallbackImg.naturalHeight / heightPx;
      const naturalWidth = fallbackImg.naturalWidth;
      const srcY = Math.round(slice.topPx * imgScaleY);
      const srcBottom = Math.round(slice.bottomPx * imgScaleY);
      const srcH = Math.max(1, srcBottom - srcY);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = naturalWidth;
      sliceCanvas.height = srcH;
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          fallbackImg,
          0,
          srcY,
          naturalWidth,
          srcH,
          0,
          0,
          naturalWidth,
          srcH
        );
      }
      sliceDataUrl = sliceCanvas.toDataURL('image/png');
    }

    if (!sliceDataUrl) continue;

    // 2. Initialize or add page in PDF
    if (i === 0) {
      pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [pagePtWidth, pagePtHeight],
        compress: true,
      });

      if (fontBase64) {
        try {
          pdf.addFileToVFS('NanumGothic.ttf', fontBase64);
          pdf.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
          pdf.setFont('NanumGothic');
        } catch (e) {
          console.warn('Failed to register NanumGothic in jsPDF', e);
        }
      }
    } else if (pdf) {
      pdf.addPage([pagePtWidth, pagePtHeight], orientation);
    }

    if (!pdf) continue;

    // 3. Embed high-res raster slice
    pdf.addImage(
      sliceDataUrl,
      'PNG',
      0,
      0,
      pagePtWidth,
      pagePtHeight,
      undefined,
      'FAST'
    );

    // 4. Render invisible text layer for this page
    const sliceTopPt = slice.topPx * 0.75;
    const sliceBottomPt = slice.bottomPx * 0.75;

    for (const line of textLines) {
      const lineCenterPt = line.ptY + line.ptHeight / 2;
      // Check if text line belongs to this slice
      if (lineCenterPt >= sliceTopPt - 1 && lineCenterPt < sliceBottomPt + 1) {
        try {
          const localPtX = line.ptX;
          const localPtY = line.ptY - sliceTopPt;

          pdf.setFontSize(line.fontSizePt);

          let charSpace: number | undefined = undefined;
          if (line.text.length > 1 && line.ptWidth > 0) {
            const textWidth = pdf.getTextWidth(line.text);
            if (textWidth > 0) {
              const diff = line.ptWidth - textWidth;
              const space = diff / (line.text.length - 1);
              charSpace = Math.max(-3, Math.min(12, space));
            }
          }

          pdf.text(line.text, localPtX, localPtY, {
            baseline: 'top',
            renderingMode: 'invisible',
            charSpace: charSpace !== undefined ? charSpace : undefined,
          });
        } catch (err) {
          // Continue overlaying other lines if one fails
        }
      }
    }
  }

  // 5. Save the generated PDF
  if (pdf) {
    pdf.save(filename);
  }

  return { pageCount: slices.length };
}
