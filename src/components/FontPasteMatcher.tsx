import React, { useState, useRef } from 'react';
import { Search, Check, Sparkles, X, ClipboardPaste, Eye } from 'lucide-react';
import { WebFont } from '../types';
import {
  detectFontsFromClipboard,
  DetectedFontCandidate,
} from '../utils/fontLoader';

interface FontPasteMatcherProps {
  fonts: WebFont[];
  currentFamily: string;
  onApplyFont: (family: string, fontName: string) => void;
  onOpenFontManager?: () => void;
  targetLabel?: string; // e.g. '왼쪽 일괄 서식' or '선택한 말풍선'
}

function extractPlainTextFromHtml(html: string): string {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').trim();
  } catch {
    return html.replace(/<[^>]+>/g, ' ').trim();
  }
}

export const FontPasteMatcher: React.FC<FontPasteMatcherProps> = ({
  fonts,
  currentFamily,
  onApplyFont,
  onOpenFontManager,
  targetLabel = '현재 서식',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sampleText, setSampleText] = useState('');
  const [results, setResults] = useState<DetectedFontCandidate[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [appliedFontName, setAppliedFontName] = useState<string | null>(null);
  const [showVisualCompare, setShowVisualCompare] = useState(false);
  const [compareCategory, setCompareCategory] = useState<
    'serif' | 'sans' | 'handwriting' | 'display'
  >('serif');
  const richPasteRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastPasteTimeRef = useRef<number>(0);

  const processClipboardContent = (htmlData: string, plainText: string) => {
    const effectiveText = (
      plainText.trim() || extractPlainTextFromHtml(htmlData)
    )
      .replace(/\s+/g, ' ')
      .trim();

    if (effectiveText) {
      const clipped = effectiveText.slice(0, 60);
      setInputValue(clipped);
      setSampleText(clipped.slice(0, 40));
    }

    const detected = detectFontsFromClipboard(
      htmlData,
      effectiveText || plainText,
      fonts
    );
    setResults(detected);
    setAppliedFontName(null);

    if (detected.length > 0) {
      const builtInCount = detected.filter((d) => d.matchedFont !== null).length;
      if (builtInCount > 0) {
        setStatusMsg(
          `내장 글꼴 ${builtInCount}개를 찾았습니다! 아래 버튼을 눌러 바로 적용하세요.`
        );
        setShowVisualCompare(false);
      } else {
        setStatusMsg(
          `글꼴(${detected.map((d) => d.rawName).join(', ')})을 감지했으나 내장 목록에 없습니다.`
        );
      }
    } else {
      setStatusMsg(
        '복사된 텍스트에 글꼴 소스(HTML)가 포함되어 있지 않습니다. 아래에서 글꼴 모양을 직접 비교해 보세요.'
      );
      setShowVisualCompare(true);
    }
  };

  // Click handler: immediately reads clipboard, puts text into the input box, and detects font
  const handleUnifiedClipboardAction = async () => {
    if (Date.now() - lastPasteTimeRef.current < 500) return;

    let htmlData = '';
    let plainText = '';

    // Read plain text immediately first so the textbox updates right away
    if (navigator.clipboard && 'readText' in navigator.clipboard) {
      try {
        plainText = await navigator.clipboard.readText();
        if (plainText.trim()) {
          const immediateText = plainText.replace(/\s+/g, ' ').trim().slice(0, 60);
          setInputValue(immediateText);
          setSampleText(immediateText.slice(0, 40));
        }
      } catch {
        // Continue to navigator.clipboard.read()
      }
    }

    // Read rich HTML clipboard items for font-family source detection
    if (navigator.clipboard && 'read' in navigator.clipboard) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            htmlData += await blob.text();
          }
          if (!plainText && item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            plainText += await blob.text();
          }
        }
      } catch {
        // Ignore if read() is blocked
      }
    }

    if (htmlData || plainText) {
      processClipboardContent(htmlData, plainText);
      searchInputRef.current?.focus();
      return;
    }

    // Fallback if browser blocks programmatic clipboard read (e.g. iframe policy)
    searchInputRef.current?.focus();
    setStatusMsg(
      '브라우저 보안 설정으로 자동 불러오기가 제한되었습니다. 아래 입력칸에 바로 붙여넣기(Ctrl+V 또는 길게 누르기)를 해주세요.'
    );
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    lastPasteTimeRef.current = Date.now();

    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    // Keep unified contentEditable button clean after native paste
    if (richPasteRef.current) {
      richPasteRef.current.innerHTML = '';
    }

    // Process synchronously right away so the textbox updates in 0ms
    processClipboardContent(htmlData, plainText);

    // If clipboardData had no text/html (e.g. mobile keyboard paste), try async clipboard read in background
    if (!htmlData && navigator.clipboard && 'read' in navigator.clipboard) {
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
          processClipboardContent(asyncHtml, plainText);
        }
      } catch {
        // Ignore permission error
      }
    }
  };

  const handleManualSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setStatusMsg(
        '복사한 텍스트를 붙여넣거나 찾을 글꼴 이름(예: 리디, 고운, 나눔)을 입력해주세요.'
      );
      setResults([]);
      return;
    }
    const detected = detectFontsFromClipboard('', trimmed, fonts);
    setResults(detected);
    setAppliedFontName(null);

    if (detected.length > 0 && detected.some((d) => d.matchedFont !== null)) {
      setStatusMsg(`'${trimmed}' 관련 내장 글꼴을 찾았습니다!`);
      setShowVisualCompare(false);
    } else {
      setStatusMsg(
        `'${trimmed}'와(과) 일치하는 내장 글꼴을 찾지 못했습니다. 아래에서 모양을 직접 비교해 보세요.`
      );
      setShowVisualCompare(true);
    }
  };

  const handleApply = (font: WebFont) => {
    onApplyFont(font.family, font.name);
    setAppliedFontName(font.name);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50/60 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100/70 transition cursor-pointer"
      >
        <ClipboardPaste className="h-3.5 w-3.5 text-amber-700 shrink-0" />
        <span>글꼴 찾기&amp;적용</span>
      </button>
    );
  }

  const compareFonts = fonts.filter((f) => f.category === compareCategory);
  const previewPhrase =
    sampleText || inputValue.trim() || '이세계에서 도착한 편지입니다.';

  return (
    <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-950">
          <ClipboardPaste className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          글꼴 찾기&amp;적용
        </span>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setResults([]);
            setStatusMsg(null);
            setInputValue('');
            setShowVisualCompare(false);
          }}
          className="rounded p-0.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700"
          title="닫기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Single Unified Button */}
      <div className="relative">
        <div
          ref={richPasteRef}
          role="button"
          tabIndex={0}
          contentEditable
          suppressContentEditableWarning
          inputMode="none"
          onClick={handleUnifiedClipboardAction}
          onPaste={handlePaste}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/80 px-3 py-2 text-[11px] font-semibold text-amber-950 hover:bg-amber-200/70 focus:border-amber-500 focus:outline-none transition cursor-pointer select-none caret-transparent"
        />
        <div className="pointer-events-none inset-0 absolute flex items-center justify-center gap-1.5 px-3 text-[11px] font-semibold text-amber-950">
          <ClipboardPaste className="h-3.5 w-3.5 text-amber-800 shrink-0" />
          <span>복사한 글꼴 불러오기</span>
        </div>
      </div>

      {/* Font Name / Pasted Text Input */}
      <div className="flex gap-1">
        <input
          ref={searchInputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleManualSearch();
            }
          }}
          placeholder="폰트 이름 직접 검색 (예: 리디, 고운, 나눔, 명조)"
          className="w-full min-w-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-800 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleManualSearch}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-stone-800 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-stone-700 transition cursor-pointer"
        >
          <Search className="h-3 w-3" />
          <span>찾기</span>
        </button>
      </div>

      {statusMsg && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-stone-600 leading-snug">
          <span>{statusMsg}</span>
          {results.length === 0 && inputValue.trim() && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                (inputValue.trim() || '웹폰트') + ' 폰트'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-800 hover:bg-stone-100"
            >
              구글 검색 ↗
            </a>
          )}
        </div>
      )}

      {appliedFontName && (
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800">
          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            {targetLabel}에 &apos;{appliedFontName}&apos; 글꼴이 적용되었습니다!
          </span>
        </div>
      )}

      {results.length > 0 && (
        <div className="max-h-52 overflow-y-auto space-y-1.5 pt-0.5 pr-0.5">
          {results.map((item) => {
            const matched = item.matchedFont;
            const isCurrentlySelected =
              matched &&
              (currentFamily === matched.family ||
                currentFamily.includes(matched.name));

            if (matched) {
              return (
                <div
                  key={`${item.rawName}-${matched.id}`}
                  className="flex flex-col gap-1.5 rounded-lg border border-emerald-300 bg-white p-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        내장 글꼴 일치
                      </span>
                      <p
                        className="mt-1 truncate text-xs font-semibold text-stone-900"
                        style={{ fontFamily: matched.family }}
                      >
                        {matched.name}
                      </p>
                      <p
                        className="mt-0.5 truncate text-[11px] text-stone-600"
                        style={{ fontFamily: matched.family }}
                      >
                        {previewPhrase}
                      </p>
                      {item.rawName.toLowerCase() !==
                        matched.name.toLowerCase() && (
                        <p className="truncate text-[10px] text-stone-400">
                          감지된 이름: {item.rawName}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApply(matched)}
                      className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                        isCurrentlySelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      <span>
                        {isCurrentlySelected ? '적용됨' : '이 글꼴로 적용'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.rawName}
                className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white p-2"
              >
                <div className="min-w-0">
                  <span className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                    미내장 글꼴
                  </span>
                  <p className="mt-0.5 truncate text-xs font-medium text-stone-800">
                    {item.rawName}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      item.rawName + ' 폰트'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-stone-50 px-2 py-1 text-[10px] font-semibold text-stone-800 hover:bg-stone-100 transition"
                  >
                    <span>구글 검색 ↗</span>
                  </a>
                  {onOpenFontManager && (
                    <button
                      type="button"
                      onClick={onOpenFontManager}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>폰트목록&amp;추가</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visual Font Comparison Toggle (when mobile app doesn't copy HTML tags at all) */}
      <div className="pt-1 border-t border-amber-200/70">
        <button
          type="button"
          onClick={() => setShowVisualCompare((prev) => !prev)}
          className="flex w-full items-center justify-between text-[11px] font-medium text-amber-900 hover:text-amber-950 py-0.5 cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-amber-700" />
            복사한 문구로 글꼴 모양 직접 비교하기
          </span>
          <span className="text-[10px] text-amber-700">
            {showVisualCompare ? '접기 ▲' : '열기 ▼'}
          </span>
        </button>

        {showVisualCompare && (
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: 'serif', label: '명조/바탕' },
                  { id: 'sans', label: '고딕/돋움' },
                  { id: 'handwriting', label: '손글씨' },
                  { id: 'display', label: '장식/특수' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCompareCategory(cat.id)}
                  className={`rounded-md py-1 text-[10px] font-semibold transition cursor-pointer ${
                    compareCategory === cat.id
                      ? 'bg-stone-800 text-white'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
              {compareFonts.map((f) => {
                const isSelected =
                  currentFamily === f.family || currentFamily.includes(f.name);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleApply(f)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50/70'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-stone-400">
                        {f.name}
                      </p>
                      <p
                        className="truncate text-xs text-stone-900 mt-0.5"
                        style={{ fontFamily: f.family }}
                      >
                        {previewPhrase}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isSelected ? '적용됨' : '적용'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
