import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  ArrowRightLeft,
  AlignLeft,
  Layers,
  Check,
  ClipboardPaste,
  Sparkles,
} from 'lucide-react';
import { Bubble, DefaultSideStyles, WebFont } from '../types';
import { INITIAL_SIDE_STYLES, PRESET_FONTS } from '../data/presetFonts';
import {
  DetectedFontCandidate,
  extractDialogueFontsFromHtml,
  requestClipboardWithPermission,
} from '../utils/fontLoader';
import { FontSelectDropdown } from './FontSelectDropdown';

interface TextImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newBubbles: Bubble[], mode: 'replace' | 'append') => void;
  defaultFontFamily: string;
  defaultSideStyles?: DefaultSideStyles;
  fonts?: WebFont[];
  onOpenFontManager?: () => void;
}

interface ParsedNoteItem {
  text: string;
  nickname: string;
  dateText?: string;
}

/**
 * Parses 이세계 우체통 note format:
 * 대화1
 * 닉네임A
 * •
 * 214세 9월 11일 (또는 2026. 09. 20. 오후 11:57)
 * •
 * 수정  <-- ('•' 뒤의 '수정'은 무시)
 */
function parseMailboxNotes(rawInput: string): {
  items: ParsedNoteItem[];
  nicknames: string[];
  isMailboxFormat: boolean;
} {
  const normalized = rawInput.replace(/\r\n/g, '\n');
  const initialLines = normalized.split('\n');

  const isBulletChar = (s: string) =>
    s === '•' || s === '·' || s === 'ㆍ' || s === '∙' || s === '⋅';

  // Normalize inline bullet variations into canonical separate lines:
  // [닉네임] / • / [날짜·시간]
  // Also strip inline "• 수정" tokens
  const tempLines: string[] = [];
  const inlineBothRegex =
    /^(.+?)\s*[•·ㆍ∙⋅]\s*((?:\d+|n)세\s*(?:\d+|n)월\s*(?:\d+|n)일.*|(?:\d+|n)년\s*(?:\d+|n)월\s*(?:\d+|n)일.*|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?.*|\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}.*|\d+월\s*\d+일.*|\d+\s*(?:초|분|시간|일|주|달|개월|년)\s*전.*|방금\s*전.*|어제.*|오늘.*|(?:오전|오후)\s*\d{1,2}:\d{2}.*)$/i;
  const leadingBulletDateRegex =
    /^[•·ㆍ∙⋅]\s+((?:\d+|n)세\s*(?:\d+|n)월\s*(?:\d+|n)일.*|(?:\d+|n)년\s*(?:\d+|n)월\s*(?:\d+|n)일.*|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?.*|\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}.*|\d+월\s*\d+일.*|\d+\s*(?:초|분|시간|일|주|달|개월|년)\s*전.*|방금\s*전.*|어제.*|오늘.*|(?:오전|오후)\s*\d{1,2}:\d{2}.*)$/i;
  const trailingBulletNickRegex = /^(.+?)\s+[•·ㆍ∙⋅]$/;

  for (const rawLine of initialLines) {
    // 1. If the entire line is just "• 수정", ignore it completely
    if (/^\s*[•·ㆍ∙⋅]\s*수정\s*$/.test(rawLine)) {
      continue;
    }

    // 2. If the line ends with "• 수정" (e.g., "n세 n월 n일 • 수정"), strip the trailing "• 수정"
    const line = rawLine.replace(/\s*[•·ㆍ∙⋅]\s*수정\s*$/, '');
    const trimmed = line.trim();

    const bothMatch = trimmed.match(inlineBothRegex);
    if (bothMatch && bothMatch[1].trim() && bothMatch[2].trim()) {
      tempLines.push(bothMatch[1].trim());
      tempLines.push('•');
      tempLines.push(bothMatch[2].trim());
      continue;
    }

    const leadingMatch = trimmed.match(leadingBulletDateRegex);
    if (leadingMatch && leadingMatch[1].trim()) {
      tempLines.push('•');
      tempLines.push(leadingMatch[1].trim());
      continue;
    }

    const trailingMatch = trimmed.match(trailingBulletNickRegex);
    if (trailingMatch && trailingMatch[1].trim()) {
      tempLines.push(trailingMatch[1].trim());
      tempLines.push('•');
      continue;
    }

    tempLines.push(line);
  }

  // Filter out multi-line "• \n 수정" pairs (where a bullet line is followed by "수정")
  const ignoredIndices = new Set<number>();
  for (let i = 0; i < tempLines.length; i++) {
    if (ignoredIndices.has(i)) continue;
    if (isBulletChar(tempLines[i].trim())) {
      let nextIdx = i + 1;
      while (nextIdx < tempLines.length && tempLines[nextIdx].trim() === '') {
        nextIdx++;
      }
      if (nextIdx < tempLines.length && tempLines[nextIdx].trim() === '수정') {
        ignoredIndices.add(i);
        ignoredIndices.add(nextIdx);
      }
    }
  }

  const rawLines = tempLines.filter((_, idx) => !ignoredIndices.has(idx));

  // Identify indices of bullet separator lines ('•', '·', 'ㆍ', '∙', '⋅')
  const bulletLineIndices: number[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (isBulletChar(trimmed)) {
      bulletLineIndices.push(i);
    }
  }

  if (bulletLineIndices.length > 0) {
    const items: ParsedNoteItem[] = [];
    const nicknameSet = new Set<string>();
    let blockStartIdx = 0;

    for (const bulletIdx of bulletLineIndices) {
      // Find nickname line: last non-empty line before bulletIdx (>= blockStartIdx)
      let nickIdx = bulletIdx - 1;
      while (nickIdx >= blockStartIdx && rawLines[nickIdx].trim() === '') {
        nickIdx--;
      }

      // Find date/meta line: first non-empty line after bulletIdx
      let dateIdx = bulletIdx + 1;
      while (dateIdx < rawLines.length && rawLines[dateIdx].trim() === '') {
        dateIdx++;
      }

      if (nickIdx >= blockStartIdx) {
        const nickname = rawLines[nickIdx].trim();
        const dialogueSlice = rawLines.slice(blockStartIdx, nickIdx);
        // Trim leading and trailing empty lines from the dialogue block
        while (dialogueSlice.length > 0 && dialogueSlice[0].trim() === '') {
          dialogueSlice.shift();
        }
        while (
          dialogueSlice.length > 0 &&
          dialogueSlice[dialogueSlice.length - 1].trim() === ''
        ) {
          dialogueSlice.pop();
        }

        const dialogueText = dialogueSlice.join('\n').trim();
        const parsedDate =
          dateIdx < rawLines.length ? rawLines[dateIdx].trim() : '';
        if (dialogueText.length > 0) {
          items.push({
            text: dialogueText,
            nickname,
            dateText: parsedDate,
          });
          if (nickname) {
            nicknameSet.add(nickname);
          }
        }
      }

      // Next message block starts after the date line
      blockStartIdx = dateIdx + 1;
    }

    // Handle trailing block if user copied up to "대화2 \n 닉네임B" without the last "• \n 날짜"
    if (blockStartIdx < rawLines.length) {
      const remaining = rawLines.slice(blockStartIdx);
      while (remaining.length > 0 && remaining[0].trim() === '') {
        remaining.shift();
      }
      while (
        remaining.length > 0 &&
        remaining[remaining.length - 1].trim() === ''
      ) {
        remaining.pop();
      }

      if (remaining.length >= 2) {
        const lastLine = remaining[remaining.length - 1].trim();
        const trailingDialogue = remaining
          .slice(0, remaining.length - 1)
          .join('\n')
          .trim();
        if (trailingDialogue.length > 0 && lastLine.length > 0 && lastLine.length <= 25) {
          items.push({
            text: trailingDialogue,
            nickname: lastLine,
          });
          nicknameSet.add(lastLine);
        }
      }
    }

    if (items.length > 0) {
      return {
        items,
        nicknames: Array.from(nicknameSet),
        isMailboxFormat: true,
      };
    }
  }

  // Fallback for plain text lines if no mailbox markers exist
  const fallbackParagraphs = normalized
    .split(/\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    items: fallbackParagraphs.map((text) => ({ text, nickname: '' })),
    nicknames: [],
    isMailboxFormat: false,
  };
}

export const TextImportModal: React.FC<TextImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  defaultFontFamily,
  defaultSideStyles = INITIAL_SIDE_STYLES,
  fonts = PRESET_FONTS,
  onOpenFontManager,
}) => {
  const [inputText, setInputText] = useState('');
  const [pastedHtml, setPastedHtml] = useState('');
  const [alignmentRule, setAlignmentRule] = useState<'alternate' | 'left' | 'right'>('alternate');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [nicknameSideMap, setNicknameSideMap] = useState<Record<string, 'left' | 'right'>>({});
  const [userCustomFontMap, setUserCustomFontMap] = useState<Record<string, string>>({});
  const [userCustomSideFontMap, setUserCustomSideFontMap] = useState<
    Partial<Record<'left' | 'right', string>>
  >({});
  const [disabledAutoFontNickMap, setDisabledAutoFontNickMap] = useState<
    Record<string, boolean>
  >({});
  const [disabledAutoFontSideMap, setDisabledAutoFontSideMap] = useState<
    Partial<Record<'left' | 'right', boolean>>
  >({});

  const resetModalTextAndState = () => {
    setInputText('');
    setPastedHtml('');
    setNicknameSideMap({});
    setUserCustomFontMap({});
    setUserCustomSideFontMap({});
    setDisabledAutoFontNickMap({});
    setDisabledAutoFontSideMap({});
  };

  const handleCloseWithReset = () => {
    resetModalTextAndState();
    onClose();
  };

  const parsed = useMemo(() => parseMailboxNotes(inputText), [inputText]);

  // Extract the font specifically used for each '대화' (dialogue) from pasted HTML
  const dialogueFonts = useMemo(
    () => extractDialogueFontsFromHtml(pastedHtml, parsed.items, fonts),
    [pastedHtml, parsed.items, fonts]
  );

  // Aggregate detected '대화' font per nickname
  const detectedFontByNick = useMemo(() => {
    const map: Record<string, DetectedFontCandidate | null> = {};
    for (const nick of parsed.nicknames) {
      const matchedCounts = new Map<
        string,
        { candidate: DetectedFontCandidate; count: number }
      >();
      let firstRawCandidate: DetectedFontCandidate | null = null;

      parsed.items.forEach((item, idx) => {
        if (item.nickname !== nick) return;
        const det = dialogueFonts[idx];
        if (!det) return;
        if (!firstRawCandidate) {
          firstRawCandidate = det;
        }
        if (det.matchedFont) {
          const key = det.matchedFont.id;
          const existing = matchedCounts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            matchedCounts.set(key, { candidate: det, count: 1 });
          }
        }
      });

      if (matchedCounts.size > 0) {
        const best = Array.from(matchedCounts.values()).sort(
          (a, b) => b.count - a.count
        )[0];
        map[nick] = best.candidate;
      } else {
        map[nick] = firstRawCandidate;
      }
    }
    return map;
  }, [parsed.nicknames, parsed.items, dialogueFonts]);

  // Aggregate detected '대화' font per side ('left' | 'right') for plain text / side fallback
  const detectedFontBySide = useMemo(() => {
    const result: Record<'left' | 'right', DetectedFontCandidate | null> = {
      left: null,
      right: null,
    };

    parsed.items.forEach((item, idx) => {
      let side: 'left' | 'right' = 'left';
      if (alignmentRule === 'alternate') {
        if (item.nickname && nicknameSideMap[item.nickname]) {
          side = nicknameSideMap[item.nickname];
        } else {
          side = idx % 2 === 0 ? 'left' : 'right';
        }
      } else if (alignmentRule === 'right') {
        side = 'right';
      }

      const det = dialogueFonts[idx];
      if (!det) return;
      if (!result[side] || (!result[side]?.matchedFont && det.matchedFont)) {
        result[side] = det;
      }
    });

    return result;
  }, [parsed.items, dialogueFonts, alignmentRule, nicknameSideMap]);

  // Initialize default left/right mapping whenever detected nicknames change
  useEffect(() => {
    if (parsed.nicknames.length === 0) return;
    setNicknameSideMap((prev) => {
      const next: Record<string, 'left' | 'right'> = {};
      parsed.nicknames.forEach((nick, idx) => {
        if (prev[nick]) {
          next[nick] = prev[nick];
        } else {
          next[nick] = idx % 2 === 0 ? 'left' : 'right';
        }
      });
      return next;
    });
  }, [parsed.nicknames]);

  if (!isOpen) return null;

  const getFontDisplayName = (family: string) => {
    const matched = fonts.find(
      (f) => f.family.toLowerCase() === family.toLowerCase()
    );
    if (matched) return matched.name;
    return family.replace(/['"]/g, '').split(',')[0].trim();
  };

  const handleTextareaPaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    const htmlData = e.clipboardData.getData('text/html');
    const textarea = e.currentTarget;
    const isReplacingAll =
      !inputText.trim() ||
      (textarea.selectionStart === 0 &&
        textarea.selectionEnd === inputText.length);

    if (isReplacingAll) {
      setUserCustomFontMap({});
      setUserCustomSideFontMap({});
      setDisabledAutoFontNickMap({});
      setDisabledAutoFontSideMap({});
    }

    if (htmlData) {
      setPastedHtml((prev) =>
        isReplacingAll || !prev ? htmlData : `${prev}\n${htmlData}`
      );
      return;
    }

    if (navigator.clipboard && 'read' in navigator.clipboard) {
      try {
        let asyncHtml = '';
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            asyncHtml += await blob.text();
          }
        }
        if (asyncHtml) {
          setPastedHtml((prev) =>
            isReplacingAll || !prev ? asyncHtml : `${prev}\n${asyncHtml}`
          );
        }
      } catch {
        // Ignore clipboard read permission errors
      }
    }
  };

  const handleClipboardPasteButton = async () => {
    const res = await requestClipboardWithPermission();
    if (res.status === 'ok' && (res.plainText || res.htmlData)) {
      let plain = res.plainText;
      if (!plain && res.htmlData && typeof DOMParser !== 'undefined') {
        try {
          const doc = new DOMParser().parseFromString(
            res.htmlData,
            'text/html'
          );
          plain = doc.body?.innerText || doc.body?.textContent || '';
        } catch {
          // ignore
        }
      }
      setUserCustomFontMap({});
      setUserCustomSideFontMap({});
      setDisabledAutoFontNickMap({});
      setDisabledAutoFontSideMap({});
      setInputText(plain);
      setPastedHtml(res.htmlData || '');
    }
  };

  const handleSelectNicknameSide = (targetNick: string, side: 'left' | 'right') => {
    setNicknameSideMap((prev) => {
      const next = { ...prev, [targetNick]: side };
      // When exactly 2 nicknames exist, automatically assign the opposite side to the other nickname
      if (parsed.nicknames.length === 2) {
        const otherNick = parsed.nicknames.find((n) => n !== targetNick);
        if (otherNick) {
          next[otherNick] = side === 'left' ? 'right' : 'left';
        }
      }
      return next;
    });
  };

  const handleSwapSides = () => {
    setNicknameSideMap((prev) => {
      const next: Record<string, 'left' | 'right'> = {};
      for (const nick of parsed.nicknames) {
        next[nick] = (prev[nick] || 'left') === 'left' ? 'right' : 'left';
      }
      return next;
    });
  };

  const handleProcessImport = () => {
    if (!inputText.trim() || parsed.items.length === 0) return;

    const startY = 80;
    const spacing = 100;

    const generatedBubbles: Bubble[] = parsed.items.map((item, index) => {
      let align: 'left' | 'right' | 'center' = 'left';

      if (alignmentRule === 'alternate') {
        if (item.nickname && nicknameSideMap[item.nickname]) {
          align = nicknameSideMap[item.nickname];
        } else {
          align = index % 2 === 0 ? 'left' : 'right';
        }
      } else if (alignmentRule === 'right') {
        align = 'right';
      } else {
        align = 'left';
      }

      const sideStyle = defaultSideStyles[align] || defaultSideStyles.left;
      const isNickAutoDisabled = item.nickname
        ? Boolean(disabledAutoFontNickMap[item.nickname])
        : false;
      const isSideAutoDisabled =
        align === 'left' || align === 'right'
          ? Boolean(disabledAutoFontSideMap[align])
          : false;
      const isAutoDisabled = item.nickname
        ? isNickAutoDisabled
        : isSideAutoDisabled;

      const itemDetectedFont = !isAutoDisabled
        ? dialogueFonts[index]?.matchedFont?.family
        : undefined;
      const nickDetectedFont =
        !isAutoDisabled && item.nickname
          ? detectedFontByNick[item.nickname]?.matchedFont?.family
          : undefined;
      const sideDetectedFont =
        !isAutoDisabled && (align === 'left' || align === 'right')
          ? detectedFontBySide[align]?.matchedFont?.family
          : undefined;

      const resolvedFontFamily =
        (item.nickname ? userCustomFontMap[item.nickname] : undefined) ||
        (align === 'left' || align === 'right'
          ? userCustomSideFontMap[align]
          : undefined) ||
        itemDetectedFont ||
        nickDetectedFont ||
        sideDetectedFont ||
        sideStyle.fontFamily ||
        defaultFontFamily;

      const bubble: Bubble = {
        id: `bubble-${Date.now()}-${index}`,
        text: item.text,
        showMeta: sideStyle.showMeta ?? false,
        speaker: item.nickname || sideStyle.speaker || '',
        dateText: item.dateText || sideStyle.dateText || '',
        metaTheme: sideStyle.metaTheme || 'inside',
        metaFontFamily:
          sideStyle.metaFontFamily || "'KimJeongCheolHandwriting', sans-serif",
        metaColor:
          sideStyle.metaColor || (align === 'right' ? '#cdaf77' : '#777674'),
        align,
        x: align === 'left' ? 8 : 45,
        y: startY + index * spacing,
        fontFamily: resolvedFontFamily,
        fontSize: sideStyle.fontSize,
        color: sideStyle.color,
        bgColor: sideStyle.bgColor,
        isBold: sideStyle.isBold,
        isItalic: sideStyle.isItalic,
        isStrikethrough: sideStyle.isStrikethrough,
        isUnderline: sideStyle.isUnderline,
        textAlign: sideStyle.textAlign,
        borderRadius: sideStyle.borderRadius,
        cloudBorderRadius: sideStyle.cloudBorderRadius ?? 14,
        bubbleShape: sideStyle.bubbleShape || 'default',
        hasTail: sideStyle.hasTail,
        cornerStyle: 'directional',
        paddingY: sideStyle.paddingY,
        paddingX: sideStyle.paddingX,
        cloudPaddingY: sideStyle.cloudPaddingY ?? 8,
        cloudPaddingX: sideStyle.cloudPaddingX ?? 24,
        hasShadow: sideStyle.hasShadow,
        hasBottomShadow: sideStyle.hasBottomShadow,
        bottomShadowColor: sideStyle.bottomShadowColor,
        hasBorder: sideStyle.hasBorder,
        borderColor: sideStyle.borderColor,
        letterSpacing: sideStyle.letterSpacing,
        lineHeight: sideStyle.lineHeight,
        textOffsetY: sideStyle.textOffsetY ?? 0,
        customStyleKeys: [],
      };

      return bubble;
    });

    onImport(generatedBubbles, importMode);
    onClose();
  };

  return (
    <div
      id="text-import-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="text-import-modal"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">
              쪽지 일괄 변환
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseWithReset}
            title="텍스트 초기화 및 닫기"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-stone-700">
                쪽지 텍스트 붙여넣기
              </label>
              <div className="flex items-center gap-2">
                {parsed.items.length > 0 && (
                  <span className="text-[11px] font-medium text-amber-800">
                    대화 {parsed.items.length}개 추출됨
                  </span>
                )}
                {inputText.length > 0 && (
                  <button
                    type="button"
                    onClick={resetModalTextAndState}
                    className="inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
                    title="텍스트박스 내용 초기화"
                  >
                    <X className="h-3 w-3" />
                    <span>초기화</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClipboardPasteButton}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/80 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
                  title="클립보드에서 텍스트와 대화 글꼴 정보를 함께 불러옵니다"
                >
                  <ClipboardPaste className="h-3 w-3 text-amber-700" />
                  <span>클립보드 붙여넣기</span>
                </button>
              </div>
            </div>
            <div className="relative mt-1.5">
              <textarea
                rows={8}
                placeholder={`이세계 우체통에서 나눈 쪽지를 복사하여 붙여넣으면 말풍선과 '대화' 글꼴이 함께 변환됩니다.\n예:\n대화1\n닉네임A\n•\nn세 n월 n일\n대화2\n닉네임B\n•\nn세 n월 n일`}
                value={inputText}
                onPaste={handleTextareaPaste}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputText(val);
                  if (!val.trim()) {
                    setPastedHtml('');
                    setUserCustomFontMap({});
                    setUserCustomSideFontMap({});
                    setDisabledAutoFontNickMap({});
                    setDisabledAutoFontSideMap({});
                  }
                }}
                className="w-full rounded-xl border border-stone-200 p-3.5 pr-9 text-sm text-stone-800 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
              />
              {inputText.length > 0 && (
                <button
                  type="button"
                  onClick={resetModalTextAndState}
                  title="텍스트박스 내용 초기화"
                  className="absolute top-2.5 right-2.5 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Detected Nicknames Left/Right Selector + Detected Dialogue Font underneath each position */}
          {parsed.nicknames.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-stone-50/90 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  닉네임별 말풍선 위치 및 대화 글꼴
                </span>
                {alignmentRule === 'alternate' && parsed.nicknames.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleSwapSides}
                    className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                  >
                    <ArrowRightLeft className="h-3 w-3 text-amber-700" />
                    좌우 맞바꾸기
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsed.nicknames.map((nick) => {
                  const currentSide =
                    alignmentRule === 'left'
                      ? 'left'
                      : alignmentRule === 'right'
                      ? 'right'
                      : nicknameSideMap[nick] || 'left';
                  const detectedInfo = detectedFontByNick[nick] || null;
                  const sideDefaultFont =
                    (defaultSideStyles[currentSide] || defaultSideStyles.left)
                      .fontFamily || defaultFontFamily;
                  const customFontFamily = userCustomFontMap[nick];
                  const isAutoFontDisabled = Boolean(
                    disabledAutoFontNickMap[nick]
                  );
                  const effectiveFontFamily =
                    customFontFamily ||
                    (!isAutoFontDisabled
                      ? detectedInfo?.matchedFont?.family
                      : undefined) ||
                    sideDefaultFont;
                  const effectiveFontName =
                    getFontDisplayName(effectiveFontFamily);
                  const isCurrentlyUsingDetectedFont =
                    Boolean(detectedInfo?.matchedFont) &&
                    !isAutoFontDisabled &&
                    (!customFontFamily ||
                      customFontFamily === detectedInfo?.matchedFont?.family);

                  return (
                    <div
                      key={nick}
                      className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 shadow-2xs"
                    >
                      {/* Top row: Nickname & Bubble Position (왼쪽 / 오른쪽) */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-stone-800">
                          {nick}
                        </span>
                        <div className="flex items-center rounded-lg bg-stone-100 p-0.5 text-[11px] shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (alignmentRule !== 'alternate') {
                                setAlignmentRule('alternate');
                              }
                              handleSelectNicknameSide(nick, 'left');
                            }}
                            className={`rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                              currentSide === 'left'
                                ? 'bg-stone-900 text-white shadow-2xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            왼쪽
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (alignmentRule !== 'alternate') {
                                setAlignmentRule('alternate');
                              }
                              handleSelectNicknameSide(nick, 'right');
                            }}
                            className={`rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                              currentSide === 'right'
                                ? 'bg-stone-900 text-white shadow-2xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            오른쪽
                          </button>
                        </div>
                      </div>

                      {/* Bottom row right underneath bubble position: Detected Dialogue Font & Selector */}
                      <div className="space-y-1.5 border-t border-stone-100 pt-2">
                        <div className="flex items-center justify-between gap-1.5 text-[11px]">
                          <span className="text-stone-500 shrink-0 font-medium">
                            대화 글꼴
                          </span>
                          {detectedInfo?.matchedFont ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isCurrentlyUsingDetectedFont) {
                                  // Clicking '자동적용' reverts to the existing default font for this side
                                  setDisabledAutoFontNickMap((prev) => ({
                                    ...prev,
                                    [nick]: true,
                                  }));
                                  setUserCustomFontMap((prev) => {
                                    const next = { ...prev };
                                    delete next[nick];
                                    return next;
                                  });
                                } else {
                                  // Clicking again re-applies the detected dialogue font
                                  setDisabledAutoFontNickMap((prev) => ({
                                    ...prev,
                                    [nick]: false,
                                  }));
                                  setUserCustomFontMap((prev) => {
                                    const next = { ...prev };
                                    delete next[nick];
                                    return next;
                                  });
                                }
                              }}
                              className={`inline-flex items-center gap-1 min-w-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                                isCurrentlyUsingDetectedFont
                                  ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                                  : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                              }`}
                              title={
                                isCurrentlyUsingDetectedFont
                                  ? '클릭 시 기존 기본 글꼴로 돌아갑니다'
                                  : `클릭 시 감지된 '${detectedInfo.matchedFont.name}' 글꼴을 다시 적용합니다`
                              }
                            >
                              {isCurrentlyUsingDetectedFont && (
                                <Check className="h-3 w-3 shrink-0 text-amber-700" />
                              )}
                              <span
                                className="truncate"
                                style={{
                                  fontFamily: detectedInfo.matchedFont.family,
                                }}
                              >
                                {detectedInfo.matchedFont.name}
                              </span>
                              <span
                                className={`shrink-0 text-[9px] ${
                                  isCurrentlyUsingDetectedFont
                                    ? 'text-amber-700'
                                    : 'text-stone-500'
                                }`}
                              >
                                {isCurrentlyUsingDetectedFont
                                  ? '(자동적용)'
                                  : '(기존글꼴)'}
                              </span>
                            </button>
                          ) : detectedInfo?.rawName ? (
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className="truncate rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600"
                                title={`파악된 대화 글꼴: ${detectedInfo.rawName} (미내장)`}
                              >
                                {detectedInfo.rawName} (미내장)
                              </span>
                              {onOpenFontManager && (
                                <button
                                  type="button"
                                  onClick={onOpenFontManager}
                                  className="shrink-0 inline-flex items-center gap-0.5 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  <span>추가</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span
                              className="truncate text-[10px] text-stone-500"
                              style={{ fontFamily: effectiveFontFamily }}
                            >
                              {effectiveFontName}
                            </span>
                          )}
                        </div>

                        <FontSelectDropdown
                          fonts={fonts}
                          value={effectiveFontFamily}
                          onChange={(family) =>
                            setUserCustomFontMap((prev) => ({
                              ...prev,
                              [nick]: family,
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback Position Font Display when plain text paragraphs (no nicknames) are entered */}
          {parsed.nicknames.length === 0 && parsed.items.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-stone-50/90 p-3 space-y-2">
              <span className="text-xs font-semibold text-stone-700 block">
                말풍선 위치별 대화 글꼴
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['left', 'right'] as const)
                  .filter((side) =>
                    alignmentRule === 'left' ? side === 'left' : true
                  )
                  .map((side) => {
                    const detectedInfo = detectedFontBySide[side];
                    const sideDefaultFont =
                      (defaultSideStyles[side] || defaultSideStyles.left)
                        .fontFamily || defaultFontFamily;
                    const customFont = userCustomSideFontMap[side];
                    const isAutoFontDisabled = Boolean(
                      disabledAutoFontSideMap[side]
                    );
                    const effectiveFontFamily =
                      customFont ||
                      (!isAutoFontDisabled
                        ? detectedInfo?.matchedFont?.family
                        : undefined) ||
                      sideDefaultFont;
                    const effectiveFontName =
                      getFontDisplayName(effectiveFontFamily);
                    const isCurrentlyUsingDetectedFont =
                      Boolean(detectedInfo?.matchedFont) &&
                      !isAutoFontDisabled &&
                      (!customFont ||
                        customFont === detectedInfo?.matchedFont?.family);

                    return (
                      <div
                        key={side}
                        className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-800">
                            {side === 'left' ? '왼쪽 말풍선' : '오른쪽 말풍선'}
                          </span>
                          {detectedInfo?.matchedFont ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isCurrentlyUsingDetectedFont) {
                                  setDisabledAutoFontSideMap((prev) => ({
                                    ...prev,
                                    [side]: true,
                                  }));
                                  setUserCustomSideFontMap((prev) => {
                                    const next = { ...prev };
                                    delete next[side];
                                    return next;
                                  });
                                } else {
                                  setDisabledAutoFontSideMap((prev) => ({
                                    ...prev,
                                    [side]: false,
                                  }));
                                  setUserCustomSideFontMap((prev) => {
                                    const next = { ...prev };
                                    delete next[side];
                                    return next;
                                  });
                                }
                              }}
                              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                                isCurrentlyUsingDetectedFont
                                  ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                                  : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                              }`}
                              style={{
                                fontFamily: detectedInfo.matchedFont.family,
                              }}
                              title={
                                isCurrentlyUsingDetectedFont
                                  ? '클릭 시 기존 기본 글꼴로 돌아갑니다'
                                  : `클릭 시 감지된 '${detectedInfo.matchedFont.name}' 글꼴을 다시 적용합니다`
                              }
                            >
                              {isCurrentlyUsingDetectedFont && (
                                <Check className="h-3 w-3 text-amber-700" />
                              )}
                              {detectedInfo.matchedFont.name}{' '}
                              {isCurrentlyUsingDetectedFont
                                ? '(자동적용)'
                                : '(기존글꼴)'}
                            </button>
                          ) : detectedInfo?.rawName ? (
                            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">
                              {detectedInfo.rawName} (미내장)
                            </span>
                          ) : (
                            <span
                              className="text-[10px] text-stone-500"
                              style={{ fontFamily: effectiveFontFamily }}
                            >
                              {effectiveFontName}
                            </span>
                          )}
                        </div>
                        <FontSelectDropdown
                          fonts={fonts}
                          value={effectiveFontFamily}
                          onChange={(family) =>
                            setUserCustomSideFontMap((prev) => ({
                              ...prev,
                              [side]: family,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700">배치 방향</label>
              <div className="mt-1.5 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAlignmentRule('alternate')}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition cursor-pointer ${
                    alignmentRule === 'alternate'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  좌우 교차
                </button>
                <button
                  type="button"
                  onClick={() => setAlignmentRule('left')}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition cursor-pointer ${
                    alignmentRule === 'left'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                  왼쪽 정렬
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">추가 방식</label>
              <div className="mt-1.5 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition cursor-pointer ${
                    importMode === 'replace'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  전체 교체
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition cursor-pointer ${
                    importMode === 'append'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  뒤에 추가
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleProcessImport}
              disabled={!inputText.trim() || parsed.items.length === 0}
              className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer"
            >
              말풍선으로 변환 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
