import { WebFont } from '../types';

const CUSTOM_FONTS_STORAGE_KEY = 'text_card_maker_custom_fonts';

const cssCache = new Map<string, string>();
const fontDataUrlCache = new Map<string, string>();

function injectFontElement(fontId: string, cssOrUrl: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(`font-style-${fontId}`)) return;

  const trimmed = cssOrUrl.trim();

  // <link ...> tag
  if (trimmed.startsWith('<link') || trimmed.includes('<link')) {
    const hrefMatch = trimmed.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      const link = document.createElement('link');
      link.id = `font-style-${fontId}`;
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      link.href = hrefMatch[1];
      document.head.appendChild(link);
      return;
    }
  }

  // Direct URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const link = document.createElement('link');
    link.id = `font-style-${fontId}`;
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    link.href = trimmed;
    document.head.appendChild(link);
    return;
  }

  // @import url(...) only -> convert to <link crossorigin="anonymous"> when possible
  const importOnlyMatch = trimmed.match(
    /^@import\s+(?:url\()?['"]?(https?:\/\/[^'")\s]+)['"]?\)?\s*;?$/i
  );
  if (importOnlyMatch && importOnlyMatch[1]) {
    const link = document.createElement('link');
    link.id = `font-style-${fontId}`;
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    link.href = importOnlyMatch[1];
    document.head.appendChild(link);
    return;
  }

  const styleEl = document.createElement('style');
  styleEl.id = `font-style-${fontId}`;
  styleEl.textContent = trimmed;
  document.head.appendChild(styleEl);
}

/**
 * Injects preset fonts' @font-face rules into a single stylesheet in document.head
 */
export function injectPresetFonts(presetFonts: WebFont[]): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('preset-fonts-stylesheet')) return;

  const fontFaceRules: string[] = [];
  for (const font of presetFonts) {
    const source = font.cssRule || font.url;
    if (!source) continue;
    const trimmed = source.trim();
    if (trimmed.startsWith('@font-face')) {
      fontFaceRules.push(trimmed);
    } else {
      injectFontElement(font.id, trimmed);
    }
  }

  if (fontFaceRules.length > 0) {
    const styleEl = document.createElement('style');
    styleEl.id = 'preset-fonts-stylesheet';
    styleEl.textContent = fontFaceRules.join('\n\n');
    document.head.appendChild(styleEl);
  }
}

/**
 * Loads custom fonts saved in localStorage into the document
 */
export function getStoredCustomFonts(): WebFont[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: WebFont[] = JSON.parse(raw);
    parsed.forEach((font) => {
      const source = font.cssRule || font.url;
      if (source) {
        injectFontElement(font.id, source);
      }
    });
    return parsed;
  } catch (err) {
    console.error('Failed to read custom fonts from localStorage', err);
    return [];
  }
}

export function saveCustomFont(font: WebFont): void {
  const existing = getStoredCustomFonts();
  const filtered = existing.filter((f) => f.id !== font.id);
  filtered.push(font);
  try {
    localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to save font to localStorage', err);
  }
}

export function removeCustomFont(fontId: string): void {
  const existing = getStoredCustomFonts();
  const filtered = existing.filter((f) => f.id !== fontId);
  try {
    localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove font from localStorage', err);
  }
  const el = document.getElementById(`font-style-${fontId}`);
  if (el) el.remove();
}

/**
 * Loads a web font via @import code or direct stylesheet URL (Noonnu, Google Fonts, CDN)
 */
export function loadWebFontFromCss(fontId: string, fontName: string, cssInput: string): WebFont {
  const cssText = cssInput.trim();
  let fontFamily = fontName.trim();

  // If user pasted a full <link ...> tag
  if (cssText.startsWith('<link') || cssText.includes('<link')) {
    const hrefMatch = cssText.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      injectFontElement(fontId, cssText);

      const webFont: WebFont = {
        id: fontId,
        name: fontName,
        family: `'${fontFamily}', sans-serif`,
        category: 'custom',
        sourceType: 'noonnu',
        cssRule: cssInput,
        isCustom: true,
      };
      saveCustomFont(webFont);
      return webFont;
    }
  }

  // If user pasted just a URL (e.g. https://fonts.googleapis.com/css2?... or CDN)
  if (cssText.startsWith('http://') || cssText.startsWith('https://')) {
    injectFontElement(fontId, cssText);

    const webFont: WebFont = {
      id: fontId,
      name: fontName,
      family: `'${fontFamily}', sans-serif`,
      category: 'custom',
      sourceType: 'url',
      url: cssText,
      isCustom: true,
    };
    saveCustomFont(webFont);
    return webFont;
  }

  // Check if @font-face has font-family defined
  const familyMatch = cssText.match(/font-family\s*:\s*['"]?([^'";]+)['"]?/i);
  if (familyMatch && familyMatch[1]) {
    fontFamily = familyMatch[1].trim();
  }

  injectFontElement(fontId, cssText);

  const webFont: WebFont = {
    id: fontId,
    name: fontName || fontFamily,
    family: `'${fontFamily}', sans-serif`,
    category: 'custom',
    sourceType: 'noonnu',
    cssRule: cssInput,
    isCustom: true,
  };
  saveCustomFont(webFont);
  return webFont;
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: mimeType });
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Loads a local font file (.ttf, .otf, .woff, .woff2) into the browser using the FontFace API
 */
export async function loadFontFromFile(file: File, customName?: string): Promise<WebFont> {
  const fontName = (customName?.trim() || file.name.replace(/\.[^/.]+$/, '')).trim();
  const buffer = await file.arrayBuffer();

  const fontFace = new FontFace(fontName, buffer);
  const loadedFace = await fontFace.load();
  document.fonts.add(loadedFace);

  const fontId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Also inject a @font-face style tag with data URL so html-to-image exports local fonts properly
  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mime =
      ext === 'woff2'
        ? 'font/woff2'
        : ext === 'woff'
        ? 'font/woff'
        : ext === 'otf'
        ? 'font/otf'
        : 'font/ttf';
    const dataUrl = await arrayBufferToDataUrl(buffer, mime);
    const styleEl = document.createElement('style');
    styleEl.id = `font-style-${fontId}`;
    styleEl.textContent = `@font-face { font-family: '${fontName}'; src: url('${dataUrl}'); }`;
    document.head.appendChild(styleEl);
  } catch {
    // Non-fatal fallback
  }

  const webFont: WebFont = {
    id: fontId,
    name: fontName,
    family: `'${fontName}', sans-serif`,
    category: 'custom',
    sourceType: 'file',
    isCustom: true,
  };

  return webFont;
}

function normalizeFontFamilyName(name: string): string {
  return name.trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();
}

function collectUsedFontFamilies(root: HTMLElement): Set<string> {
  const used = new Set<string>();
  const visit = (el: HTMLElement) => {
    const familyStr = el.style.fontFamily || window.getComputedStyle(el).fontFamily || '';
    familyStr.split(',').forEach((part) => {
      const normalized = normalizeFontFamilyName(part);
      if (normalized) used.add(normalized);
    });
    Array.from(el.children).forEach((child) => {
      if (child instanceof HTMLElement) visit(child);
    });
  };
  visit(root);
  return used;
}

function collectUsedCodePoints(root: HTMLElement): Set<number> {
  const text = root.textContent || '';
  const points = new Set<number>();
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined) points.add(cp);
  }
  // Always include basic ASCII space/punctuation
  points.add(0x20);
  return points;
}

function doesUnicodeRangeOverlap(unicodeRange: string | undefined, usedCodePoints: Set<number>): boolean {
  if (!unicodeRange || !unicodeRange.trim() || usedCodePoints.size === 0) {
    return true;
  }
  const ranges = unicodeRange.split(',');
  for (const raw of ranges) {
    const token = raw.trim().replace(/^[uU]\+/, '');
    if (!token) continue;
    let start = 0;
    let end = 0;
    if (token.includes('?')) {
      start = parseInt(token.replace(/\?/g, '0'), 16);
      end = parseInt(token.replace(/\?/g, 'F'), 16);
    } else if (token.includes('-')) {
      const [s, e] = token.split('-');
      start = parseInt(s, 16);
      end = parseInt(e, 16);
    } else {
      start = parseInt(token, 16);
      end = start;
    }
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    for (const cp of usedCodePoints) {
      if (cp >= start && cp <= end) {
        return true;
      }
    }
  }
  return false;
}

interface ParsedFontFaceRule {
  cssText: string;
  fontFamily: string;
  unicodeRange?: string;
  baseUrl?: string | null;
}

function parseFontFaceBlocksFromCSS(cssText: string, baseUrl?: string | null): ParsedFontFaceRule[] {
  const results: ParsedFontFaceRule[] = [];
  const matches = cssText.match(/@font-face\s*\{[^}]+\}/gi) || [];
  for (const block of matches) {
    const familyMatch = block.match(/font-family\s*:\s*([^;}\n]+)/i);
    if (!familyMatch) continue;
    const fontFamily = normalizeFontFamilyName(familyMatch[1]);
    const rangeMatch = block.match(/unicode-range\s*:\s*([^;}\n]+)/i);
    const unicodeRange = rangeMatch ? rangeMatch[1].trim() : undefined;
    results.push({
      cssText: block,
      fontFamily,
      unicodeRange,
      baseUrl,
    });
  }
  return results;
}

async function fetchTextCached(url: string): Promise<string | null> {
  if (cssCache.has(url)) return cssCache.get(url)!;
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const text = await res.text();
    cssCache.set(url, text);
    return text;
  } catch {
    return null;
  }
}

async function fetchFontAsDataUrlCached(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url;
  if (fontDataUrlCache.has(url)) return fontDataUrlCache.get(url)!;
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    fontDataUrlCache.set(url, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

async function inlineFontUrlsInRule(rule: ParsedFontFaceRule): Promise<string> {
  let cssText = rule.cssText;
  const urlMatches = Array.from(cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/gi));
  for (const match of urlMatches) {
    const fullMatch = match[0];
    const rawUrl = match[2].trim();
    if (!rawUrl || rawUrl.startsWith('data:')) continue;

    let resolvedUrl = rawUrl;
    if (rawUrl.startsWith('//')) {
      resolvedUrl = `https:${rawUrl}`;
    } else if (!/^https?:\/\//i.test(rawUrl) && rule.baseUrl) {
      try {
        resolvedUrl = new URL(rawUrl, rule.baseUrl).href;
      } catch {
        // keep rawUrl
      }
    }

    const dataUrl = await fetchFontAsDataUrlCached(resolvedUrl);
    if (dataUrl) {
      cssText = cssText.replace(fullMatch, `url("${dataUrl}")`);
    }
  }
  return cssText;
}

/**
 * Safely builds fontEmbedCSS for html-to-image without triggering cross-origin
 * CSSStyleSheet.cssRules SecurityErrors or flooding the network with unused unicode-range subsets.
 */
export interface DetectedFontCandidate {
  rawName: string;
  matchedFont: WebFont | null;
}

function normalizeCompactKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[-_\s]+/g, '')
    .trim();
}

function stripWeightSuffix(str: string): string {
  return str
    .replace(
      /[-_]?([1-9]00|[1-9]thin|[1-9]extralight|[1-9]light|[1-9]regular|[1-9]medium|[1-9]semibold|[1-9]bold|[1-9]extrabold|[1-9]black|regular|rg|bold|light|medium|thin|black|otf00|otflighta|otfbolda|regularttf|boldttf|ttf|otf|web)$/i,
      ''
    )
    .replace(/[RLBM]$/, '');
}

function getFontSearchKeys(font: WebFont): string[] {
  const keys = new Set<string>();
  const addKey = (val: string) => {
    const clean = normalizeCompactKey(val);
    if (clean && clean.length >= 2) {
      keys.add(clean);
      if (clean.endsWith('체') && clean.length > 2) {
        keys.add(clean.slice(0, -1));
      } else if (/[가-힣]$/.test(clean)) {
        keys.add(`${clean}체`);
      }
    }
  };

  addKey(font.name);
  addKey(font.id);

  const primaryFamily = font.family.split(',')[0].replace(/['"]/g, '').trim();
  addKey(primaryFamily);
  addKey(stripWeightSuffix(primaryFamily));

  if (font.cssRule) {
    const urlMatch = font.cssRule.match(/url\(['"]?([^'")]+)['"]?\)/i);
    if (urlMatch && urlMatch[1]) {
      const filePart = urlMatch[1].split('/').pop() || '';
      const fileStem = filePart.replace(/\.(woff2?|ttf|otf|eot)(\?.*)?$/i, '');
      if (fileStem) {
        addKey(fileStem);
        addKey(stripWeightSuffix(fileStem));
      }
    }
  }

  return Array.from(keys);
}

/**
 * Matches a candidate font name/family against the app's built-in / registered WebFont list.
 */
export function matchBuiltInFont(candidate: string, fonts: WebFont[]): WebFont | null {
  const cleanCandidate = normalizeCompactKey(candidate);
  const strippedCandidate = normalizeCompactKey(stripWeightSuffix(candidate));
  if (!cleanCandidate) return null;

  // 1. Exact key match
  for (const font of fonts) {
    const keys = getFontSearchKeys(font);
    if (
      keys.includes(cleanCandidate) ||
      (strippedCandidate.length >= 2 && keys.includes(strippedCandidate))
    ) {
      return font;
    }
  }

  // 2. Partial / substring match for sufficiently specific names (>= 3 chars)
  if (cleanCandidate.length >= 3) {
    for (const font of fonts) {
      const keys = getFontSearchKeys(font);
      if (
        keys.some(
          (k) =>
            k.length >= 3 &&
            (k.includes(cleanCandidate) || cleanCandidate.includes(k))
        )
      ) {
        return font;
      }
    }
  }

  return null;
}

const IGNORED_GENERIC_FONTS = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'inherit',
  'initial',
  'unset',
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
  'roboto',
  'helvetica neue',
  'arial',
  'apple sd gothic neo',
  'malgun gothic',
  '맑은 고딕',
  '맑은고딕',
  'dotum',
  '돋움',
  'gulim',
  '굴림',
  'batang',
  '바탕',
]);

export interface ClipboardReadResult {
  status: 'ok' | 'empty' | 'denied';
  htmlData: string;
  plainText: string;
  permissionState: PermissionState | 'unknown';
}

/**
 * Explicitly requests clipboard read access and returns HTML + plain text,
 * or reports permission denial so the UI can show the fallback paste modal.
 */
export async function requestClipboardWithPermission(): Promise<ClipboardReadResult> {
  let htmlData = '';
  let plainText = '';
  let permissionDenied = false;
  let permissionState: PermissionState | 'unknown' = 'unknown';

  // 1. Trigger explicit clipboard read right on the user click gesture (prompts browser permission UI)
  if (typeof navigator !== 'undefined' && navigator.clipboard && 'read' in navigator.clipboard) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          plainText += await blob.text();
        }
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          htmlData += await blob.text();
        }
      }
      if (htmlData || plainText) {
        return { status: 'ok', htmlData, plainText, permissionState: 'granted' };
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'SecurityError') {
        permissionDenied = true;
      }
    }
  }

  // 2. Fallback to readText() if read() wasn't supported or failed
  if (
    !htmlData &&
    !plainText &&
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    'readText' in navigator.clipboard
  ) {
    try {
      plainText = await navigator.clipboard.readText();
      if (plainText) {
        return { status: 'ok', htmlData: '', plainText, permissionState: 'granted' };
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'SecurityError') {
        permissionDenied = true;
      }
    }
  }

  // 3. Query Permissions API for detailed permission state
  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({
        name: 'clipboard-read' as PermissionName,
      });
      permissionState = status.state;
      if (status.state === 'denied') {
        permissionDenied = true;
      }
    } catch {
      // Some browsers (e.g. Safari/Firefox) do not support querying 'clipboard-read'
    }
  }

  if (permissionDenied) {
    return {
      status: 'denied',
      htmlData: '',
      plainText: '',
      permissionState: permissionState === 'unknown' ? 'denied' : permissionState,
    };
  }

  return {
    status: htmlData || plainText ? 'ok' : 'empty',
    htmlData,
    plainText,
    permissionState,
  };
}

/**
 * Searches built-in fonts by partial keyword (returns up to 8 matches)
 */
export function searchBuiltInFonts(query: string, fonts: WebFont[], limit = 8): WebFont[] {
  const cleanQuery = normalizeCompactKey(query);
  const strippedQuery = normalizeCompactKey(stripWeightSuffix(query));
  if (!cleanQuery) return [];

  const exactMatches: WebFont[] = [];
  const partialMatches: WebFont[] = [];

  for (const font of fonts) {
    const keys = getFontSearchKeys(font);
    if (
      keys.includes(cleanQuery) ||
      (strippedQuery.length >= 2 && keys.includes(strippedQuery))
    ) {
      exactMatches.push(font);
    } else if (
      keys.some(
        (k) =>
          k.includes(cleanQuery) ||
          (cleanQuery.length >= 2 && cleanQuery.includes(k))
      )
    ) {
      partialMatches.push(font);
    }
  }

  return [...exactMatches, ...partialMatches].slice(0, limit);
}

/**
 * Extracts font candidates from clipboard HTML and/or plain text and matches against built-in fonts.
 */
export function detectFontsFromClipboard(
  htmlData: string,
  plainText: string,
  fonts: WebFont[]
): DetectedFontCandidate[] {
  const candidates: string[] = [];
  const addCandidate = (raw: string) => {
    const decoded = raw
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/['"`]/g, '')
      .replace(/!important/gi, '')
      .trim();
    if (!decoded) return;
    if (IGNORED_GENERIC_FONTS.has(decoded.toLowerCase())) return;
    if (!candidates.some((c) => c.toLowerCase() === decoded.toLowerCase())) {
      candidates.push(decoded);
    }
  };

  if (htmlData) {
    const decodedHtml = htmlData
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'");

    // 1. Parse via DOMParser to accurately inspect inline style.fontFamily, face, and class attributes
    if (typeof DOMParser !== 'undefined') {
      try {
        const doc = new DOMParser().parseFromString(htmlData, 'text/html');
        const elements = doc.querySelectorAll('*');
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style && htmlEl.style.fontFamily) {
            htmlEl.style.fontFamily.split(',').forEach(addCandidate);
          }
          const faceAttr = htmlEl.getAttribute('face');
          if (faceAttr) {
            faceAttr.split(',').forEach(addCandidate);
          }
          const dataFont =
            htmlEl.getAttribute('data-font') ||
            htmlEl.getAttribute('data-font-family');
          if (dataFont) {
            dataFont.split(',').forEach(addCandidate);
          }
          const className = htmlEl.getAttribute('class');
          if (className) {
            className.split(/\s+/).forEach((cls) => {
              const qlMatch = cls.match(/^(?:ql-font-|font-)(.+)$/i);
              if (qlMatch && qlMatch[1]) {
                const matched = matchBuiltInFont(qlMatch[1], fonts);
                if (matched) addCandidate(matched.name);
              }
            });
          }
        });
      } catch {
        // Ignore DOMParser errors and continue with regex fallback
      }
    }

    // 2. Regex fallback (supports quoted font names inside style="font-family: 'Name', ...")
    const familyRegex = /font-family\s*:\s*([^;<>}]+)/gi;
    let match;
    while ((match = familyRegex.exec(decodedHtml)) !== null) {
      const rawValue = match[1].replace(/["']\s*$/, '');
      const parts = rawValue.split(',');
      for (const part of parts) {
        addCandidate(part);
      }
    }

    const faceAttrRegex = /<font[^>]+face=["']([^"']+)["']/gi;
    while ((match = faceAttrRegex.exec(decodedHtml)) !== null) {
      const parts = match[1].split(',');
      for (const part of parts) {
        addCandidate(part);
      }
    }
  }

  if (plainText) {
    const trimmed = plainText.trim();
    // Check if plainText contains font-family CSS or @font-face url
    const cssFamilyMatch = trimmed.match(/font-family\s*:\s*([^;}\n]+)/i);
    if (cssFamilyMatch && cssFamilyMatch[1]) {
      cssFamilyMatch[1].split(',').forEach(addCandidate);
    }

    const urlMatch = trimmed.match(/url\(['"]?([^'")]+)['"]?\)/i);
    if (urlMatch && urlMatch[1]) {
      const filePart = urlMatch[1].split('/').pop() || '';
      const fileStem = filePart.replace(/\.(woff2?|ttf|otf|eot)(\?.*)?$/i, '');
      if (fileStem) addCandidate(fileStem);
    }

    // If no HTML font-family was found, check if user typed a keyword or font name
    if (candidates.length === 0 && trimmed.length > 0 && trimmed.length <= 60 && !trimmed.includes('\n')) {
      const multiMatches = searchBuiltInFonts(trimmed, fonts, 6);
      if (multiMatches.length > 0) {
        for (const m of multiMatches) {
          if (!candidates.some((c) => c.toLowerCase() === m.name.toLowerCase())) {
            candidates.push(m.name);
          }
        }
      } else {
        addCandidate(trimmed);
      }
    } else if (candidates.length === 0) {
      // Check if any built-in font name is mentioned in the text
      for (const f of fonts) {
        if (trimmed.includes(f.name)) {
          addCandidate(f.name);
        }
      }
    }
  }

  return candidates.map((rawName) => ({
    rawName,
    matchedFont: matchBuiltInFont(rawName, fonts),
  }));
}

/**
 * Safely builds fontEmbedCSS for html-to-image without triggering cross-origin
 * CSSStyleSheet.cssRules SecurityErrors or flooding the network with unused unicode-range subsets.
 */
export async function getSafeFontEmbedCSS(node: HTMLElement): Promise<string> {
  try {
    const usedFonts = collectUsedFontFamilies(node);
    const usedCodePoints = collectUsedCodePoints(node);
    const allFontRules: ParsedFontFaceRule[] = [];

    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      let rulesAccessible = false;
      try {
        const cssRules = sheet.cssRules;
        if (cssRules) {
          rulesAccessible = true;
          for (const rule of Array.from(cssRules)) {
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              const fontRule = rule as CSSFontFaceRule;
              const family = normalizeFontFamilyName(
                fontRule.style.getPropertyValue('font-family')
              );
              const unicodeRange =
                fontRule.style.getPropertyValue('unicode-range') || undefined;
              if (family) {
                allFontRules.push({
                  cssText: fontRule.cssText,
                  fontFamily: family,
                  unicodeRange,
                  baseUrl: sheet.href,
                });
              }
            } else if (rule.type === CSSRule.IMPORT_RULE) {
              const importRule = rule as CSSImportRule;
              if (importRule.href) {
                const remoteCss = await fetchTextCached(importRule.href);
                if (remoteCss) {
                  allFontRules.push(
                    ...parseFontFaceBlocksFromCSS(remoteCss, importRule.href)
                  );
                }
              }
            }
          }
        }
      } catch {
        rulesAccessible = false;
      }

      if (!rulesAccessible && sheet.href) {
        const remoteCss = await fetchTextCached(sheet.href);
        if (remoteCss) {
          allFontRules.push(...parseFontFaceBlocksFromCSS(remoteCss, sheet.href));
        }
      }
    }

    const matchingRules = allFontRules.filter(
      (r) =>
        usedFonts.has(r.fontFamily) &&
        doesUnicodeRangeOverlap(r.unicodeRange, usedCodePoints)
    );

    if (matchingRules.length === 0) {
      return '';
    }

    const inlinedRules: string[] = [];
    // Process in small batches of 6 to avoid browser network resource exhaustion
    const batchSize = 6;
    for (let i = 0; i < matchingRules.length; i += batchSize) {
      const batch = matchingRules.slice(i, i + batchSize);
      const results = await Promise.all(batch.map((r) => inlineFontUrlsInRule(r)));
      inlinedRules.push(...results);
    }

    return inlinedRules.join('\n');
  } catch {
    return '';
  }
}

