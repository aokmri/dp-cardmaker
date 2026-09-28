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

const CHOSEONG_NAVER = [
  'g', 'gg', 'n', 'd', 'dd', 'r', 'm', 'b', 'bb', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];
const CHOSEONG_RR = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];
const JUNGSEONG_TABLE = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];
const JONGSEONG_NAVER = [
  '', 'k', 'kk', 'ks', 'n', 'nj', 'nh', 't', 'l', 'rk', 'rm', 'rb', 'rs', 'rt', 'rp', 'rh', 'm', 'p', 'ps', 't', 'ss', 'ng', 't', 't', 'k', 't', 'p', 'h',
];
const JONGSEONG_RR = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't',
];
const JONGSEONG_VOICED = [
  '', 'g', 'gg', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h',
];

const COLLOQUIAL_SYLLABLE_MAP: Record<string, string> = {
  박: 'park',
  김: 'kim',
  강: 'kang',
  권: 'kwon',
  구: 'koo',
  규: 'kyu',
  희: 'hee',
  우: 'woo',
  유: 'yoo',
  윤: 'yoon',
  현: 'hyun',
  형: 'hyung',
  경: 'kyung',
  정: 'jung',
  성: 'sung',
  선: 'sun',
  영: 'young',
  신: 'shin',
  심: 'shim',
  임: 'lim',
  이: 'lee',
};

function romanizeHangulString(
  text: string,
  choseongTable: string[],
  jongseongTable: string[],
  useColloquial = false
): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (useColloquial && COLLOQUIAL_SYLLABLE_MAP[ch]) {
      out += COLLOQUIAL_SYLLABLE_MAP[ch];
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / 588);
      const jung = Math.floor((offset % 588) / 28);
      const jong = offset % 28;
      out +=
        (choseongTable[cho] ?? '') +
        (JUNGSEONG_TABLE[jung] ?? '') +
        (jongseongTable[jong] ?? '');
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase();
    }
  }
  return out;
}

function generateRomanizedVariants(koreanText: string): string[] {
  const variants = new Set<string>();
  const trimmed = koreanText.trim();
  if (!trimmed || !/[가-힣]/.test(trimmed)) return [];

  const baseForms = [trimmed];
  if (trimmed.endsWith('체') && trimmed.length > 1) {
    baseForms.push(trimmed.slice(0, -1));
  } else {
    baseForms.push(`${trimmed}체`);
  }

  for (const form of baseForms) {
    const v1 = romanizeHangulString(form, CHOSEONG_NAVER, JONGSEONG_NAVER, false);
    const v2 = romanizeHangulString(form, CHOSEONG_RR, JONGSEONG_RR, false);
    const v3 = romanizeHangulString(form, CHOSEONG_NAVER, JONGSEONG_VOICED, false);
    const v4 = romanizeHangulString(form, CHOSEONG_NAVER, JONGSEONG_NAVER, true);
    if (v1) variants.add(v1);
    if (v2) variants.add(v2);
    if (v3) variants.add(v3);
    if (v4) variants.add(v4);
  }

  return Array.from(variants);
}

/**
 * Converts a Latin font name into a syllable-preserving phonetic skeleton
 * so spelling variations (e.g. NanumGiBbeumBarkEum vs GibbemBalgeum vs NanumGippeumBalkeum)
 * produce the exact same phonetic key.
 */
function toPhoneticKey(str: string): string {
  const s = normalizeCompactKey(stripWeightSuffix(str));
  if (!s || /[가-힣]/.test(s)) return '';
  return s
    .replace(/nanumsongeulssi/g, 'nanum')
    .replace(/ownglyph|ongleip|ongleeb/g, 'onglip')
    .replace(/tthakgyoansim|hakgyoansim|schoolsafety|schoolsafe/g, 'hakgyoansim')
    .replace(/kyobohandwriting/g, 'kyobo')
    .replace(/uhbee|avi|abi/g, 'uhbee')
    .replace(/(?:che|font|script|handwriting)$/g, '')
    .replace(/park/g, 'pak')
    .replace(/rk|lk|lg/g, 'lk')
    .replace(/rm|lm/g, 'lm')
    .replace(/rb|lb/g, 'lb')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 's')
    .replace(/ph/g, 'p')
    .replace(/woo/g, 'u')
    .replace(/yoo/g, 'yu')
    .replace(/ee/g, 'i')
    .replace(/ea/g, 'ae')
    .replace(/[kgq]+/g, 'k')
    .replace(/[dt]+/g, 't')
    .replace(/[bpv]+/g, 'p')
    .replace(/[jz]+/g, 'j')
    .replace(/[rl]+/g, 'r')
    .replace(/s+/g, 's')
    .replace(/n+/g, 'n')
    .replace(/m+/g, 'm')
    .replace(/h+/g, 'h')
    .replace(/[aeiouyw]+/g, 'a');
}

interface CachedFontKeys {
  exactKeys: string[];
  phoneticKeys: string[];
}

const fontSearchKeyCache = new Map<string, CachedFontKeys>();

function getFontSearchData(font: WebFont): CachedFontKeys {
  const cacheId = `${font.id}::${font.name}::${font.family}`;
  const cached = fontSearchKeyCache.get(cacheId);
  if (cached) return cached;

  const keys = new Set<string>();
  const phoneticSet = new Set<string>();

  const addKey = (val: string) => {
    const clean = normalizeCompactKey(val);
    if (clean && clean.length >= 2) {
      keys.add(clean);
      if (clean.endsWith('체') && clean.length > 2) {
        keys.add(clean.slice(0, -1));
      } else if (/[가-힣]$/.test(clean)) {
        keys.add(`${clean}체`);
      }
      if (!/[가-힣]/.test(clean)) {
        const pk = toPhoneticKey(clean);
        if (pk && pk.length >= 3) {
          phoneticSet.add(pk);
        }
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

  // Generate Korean & Romanized aliases (e.g. '나눔손글씨 기쁨밝음' -> 'NanumGiBbeumBarkEum', '기쁨밝음', etc.)
  if (/[가-힣]/.test(font.name)) {
    for (const rom of generateRomanizedVariants(font.name)) {
      addKey(rom);
    }

    const isNaverHandFont =
      /^나눔\s*손글씨/.test(font.name) ||
      font.id.startsWith('nanum-') ||
      Boolean(font.cssRule && font.cssRule.includes('naverfont_'));

    const foundryRules: {
      pattern: RegExp;
      korPrefixes: string[];
      engPrefixes: string[];
    }[] = [
      {
        pattern: /^나눔\s*손글씨\s*/,
        korPrefixes: ['나눔손글씨', '나눔', ''],
        engPrefixes: ['nanum', 'nanumsongeulssi', ''],
      },
      {
        pattern: /^온글잎\s*/,
        korPrefixes: ['온글잎', ''],
        engPrefixes: ['ownglyph', 'ongleip', 'ongleeb', ''],
      },
      {
        pattern: /^학교안심\s*/,
        korPrefixes: ['학교안심', ''],
        engPrefixes: ['hakgyoansim', 'tthakgyoansim', 'schoolsafety', 'schoolsafe', ''],
      },
      {
        pattern: /^교보\s*손글씨\s*(\d+\s*)?/,
        korPrefixes: ['교보손글씨', '교보', ''],
        engPrefixes: ['kyobohandwriting', 'kyobo', ''],
      },
      {
        pattern: /^카페24\s*/i,
        korPrefixes: ['카페24', ''],
        engPrefixes: ['cafe24', ''],
      },
      {
        pattern: /^어비\s*/,
        korPrefixes: ['어비', ''],
        engPrefixes: ['uhbee', 'avi', 'abi', ''],
      },
      {
        pattern: /^그리운\s*/,
        korPrefixes: ['그리운', ''],
        engPrefixes: ['griun', 'nostalgic', 'missed', ''],
      },
      {
        pattern: /^윤?초록우산어린이\s*/,
        korPrefixes: ['윤초록우산어린이', '초록우산어린이', ''],
        engPrefixes: ['yoonchildfundkorea', 'yunchorokwoosaneorini', 'yoonchowoosan', ''],
      },
      {
        pattern: /^인천교육\s*/,
        korPrefixes: ['인천교육', ''],
        engPrefixes: ['ice', 'incheoneducation', 'incheongyoyuk', ''],
      },
      {
        pattern: /^강원교육\s*/,
        korPrefixes: ['강원교육', ''],
        engPrefixes: ['gangwonedu', 'gangwoneducation', 'gangwongyoyuk', ''],
      },
      {
        pattern: /^전남교육\s*/,
        korPrefixes: ['전남교육', ''],
        engPrefixes: ['jne', 'jeonnameducation', 'jeonnamgyoyuk', ''],
      },
      {
        pattern: /^전주완판본\s*/,
        korPrefixes: ['전주완판본', ''],
        engPrefixes: ['jeonjuwanpanbon', 'jeonju', ''],
      },
      {
        pattern: /^KCC\s*/i,
        korPrefixes: ['kcc', ''],
        engPrefixes: ['kcc', ''],
      },
    ];

    let matchedRule = false;
    for (const rule of foundryRules) {
      if (rule.pattern.test(font.name)) {
        matchedRule = true;
        const coreKor = font.name.replace(rule.pattern, '').trim();
        if (coreKor) {
          for (const kp of rule.korPrefixes) {
            addKey(`${kp}${coreKor}`);
          }
          const coreRoms = generateRomanizedVariants(coreKor);
          for (const rom of coreRoms) {
            for (const ep of rule.engPrefixes) {
              addKey(`${ep}${rom}`);
            }
          }
        }
      }
    }

    if (!matchedRule && isNaverHandFont) {
      const coreKor = font.name.replace(/^나눔\s*/, '').trim();
      addKey(`나눔손글씨${coreKor}`);
      addKey(`나눔${coreKor}`);
      for (const rom of generateRomanizedVariants(coreKor)) {
        addKey(`nanum${rom}`);
        addKey(`nanumsongeulssi${rom}`);
        addKey(rom);
      }
    }
  }

  const result: CachedFontKeys = {
    exactKeys: Array.from(keys),
    phoneticKeys: Array.from(phoneticSet),
  };
  fontSearchKeyCache.set(cacheId, result);
  return result;
}

function getFontSearchKeys(font: WebFont): string[] {
  return getFontSearchData(font).exactKeys;
}

/**
 * Checks whether a single font matches a user search query (supports Korean, English family, and Romanized names).
 */
export function doesFontMatchQuery(font: WebFont, query: string): boolean {
  const cleanQuery = normalizeCompactKey(query);
  if (!cleanQuery) return true;
  const strippedQuery = normalizeCompactKey(stripWeightSuffix(query));
  const { exactKeys, phoneticKeys } = getFontSearchData(font);

  if (
    exactKeys.some(
      (k) =>
        k.includes(cleanQuery) ||
        (strippedQuery.length >= 2 && k.includes(strippedQuery)) ||
        (cleanQuery.length >= 2 && cleanQuery.includes(k))
    )
  ) {
    return true;
  }

  if (!/[가-힣]/.test(cleanQuery) && cleanQuery.length >= 3) {
    const queryPhonetic = toPhoneticKey(cleanQuery);
    if (
      queryPhonetic.length >= 3 &&
      phoneticKeys.some(
        (pk) =>
          pk.includes(queryPhonetic) ||
          (queryPhonetic.length >= 4 && queryPhonetic.includes(pk))
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Matches a candidate font name/family against the app's built-in / registered WebFont list.
 */
export function matchBuiltInFont(candidate: string, fonts: WebFont[]): WebFont | null {
  const cleanCandidate = normalizeCompactKey(candidate);
  const strippedCandidate = normalizeCompactKey(stripWeightSuffix(candidate));
  if (!cleanCandidate) return null;

  // 1. Exact key match (including generated Korean & Romanized aliases like NanumGiBbeumBarkEum)
  for (const font of fonts) {
    const { exactKeys } = getFontSearchData(font);
    if (
      exactKeys.includes(cleanCandidate) ||
      (strippedCandidate.length >= 2 && exactKeys.includes(strippedCandidate))
    ) {
      return font;
    }
  }

  // 2. Exact phonetic key match (handles spelling differences like GibbemBalgeum vs GiBbeumBarkEum)
  const candidatePhonetic = toPhoneticKey(candidate);
  if (candidatePhonetic.length >= 4) {
    for (const font of fonts) {
      const { phoneticKeys } = getFontSearchData(font);
      if (phoneticKeys.includes(candidatePhonetic)) {
        return font;
      }
    }
  }

  // 3. Partial / substring match on exactKeys for sufficiently specific names (>= 3 chars)
  if (cleanCandidate.length >= 3) {
    for (const font of fonts) {
      const { exactKeys } = getFontSearchData(font);
      if (
        exactKeys.some(
          (k) =>
            k.length >= 3 &&
            (k.includes(cleanCandidate) || cleanCandidate.includes(k))
        )
      ) {
        return font;
      }
    }
  }

  // 4. Partial phonetic match for longer Latin font names (>= 5 phonetic chars)
  if (candidatePhonetic.length >= 5) {
    for (const font of fonts) {
      const { phoneticKeys } = getFontSearchData(font);
      if (
        phoneticKeys.some(
          (pk) =>
            pk.length >= 5 &&
            (pk.includes(candidatePhonetic) || candidatePhonetic.includes(pk))
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

  const queryPhonetic = toPhoneticKey(query);
  const exactMatches: WebFont[] = [];
  const partialMatches: WebFont[] = [];

  for (const font of fonts) {
    const { exactKeys, phoneticKeys } = getFontSearchData(font);
    if (
      exactKeys.includes(cleanQuery) ||
      (strippedQuery.length >= 2 && exactKeys.includes(strippedQuery)) ||
      (queryPhonetic.length >= 4 && phoneticKeys.includes(queryPhonetic))
    ) {
      exactMatches.push(font);
    } else if (
      exactKeys.some(
        (k) =>
          k.includes(cleanQuery) ||
          (cleanQuery.length >= 2 && cleanQuery.includes(k))
      ) ||
      (queryPhonetic.length >= 4 &&
        phoneticKeys.some(
          (pk) =>
            pk.includes(queryPhonetic) ||
            (queryPhonetic.length >= 5 && queryPhonetic.includes(pk))
        ))
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

