import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Sparkles, X, ClipboardPaste } from 'lucide-react';
import { WebFont } from '../types';
import {
  detectFontsFromClipboard,
  DetectedFontCandidate,
  requestClipboardWithPermission,
} from '../utils/fontLoader';
import { ClipboardGuideModal } from './ClipboardGuideModal';

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
  const [results, setResults] = useState<DetectedFontCandidate[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [appliedFontName, setAppliedFontName] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [permissionState, setPermissionState] = useState<
    PermissionState | 'unknown'
  >('unknown');

  const richPasteRef = useRef<HTMLDivElement>(null);
  const lastPasteTimeRef = useRef<number>(0);

  const processClipboardContent = useCallback(
    (htmlData: string, plainText: string) => {
      const effectiveText = (
        plainText.trim() || extractPlainTextFromHtml(htmlData)
      )
        .replace(/\s+/g, ' ')
        .trim();

      if (effectiveText) {
        const clipped = effectiveText.slice(0, 60);
        setInputValue(clipped);
      }

      const detected = detectFontsFromClipboard(
        htmlData,
        effectiveText || plainText,
        fonts
      );
      setResults(detected);
      setAppliedFontName(null);

      if (detected.length > 0) {
        const builtInCount = detected.filter(
          (d) => d.matchedFont !== null
        ).length;
        if (builtInCount > 0) {
          setStatusMsg(
            `내장 폰트 ${builtInCount}개를 찾았습니다! 아래 버튼을 눌러 바로 적용하세요.`
          );
        } else {
          setStatusMsg(
            `폰트(${detected.map((d) => d.rawName).join(', ')})를 감지했으나 내장 목록에 없습니다.`
          );
        }
      } else {
        setStatusMsg(
          '복사된 텍스트에 폰트 소스(HTML)가 포함되어 있지 않습니다.'
        );
      }
    },
    [fonts]
  );

  // Global paste listener while the matcher is open: pressing Ctrl+V / Cmd+V anywhere works with 0 security restrictions
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        activeEl !== richPasteRef.current &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (Date.now() - lastPasteTimeRef.current < 200) return;
      lastPasteTimeRef.current = Date.now();

      const htmlData = e.clipboardData?.getData('text/html') || '';
      const plainText = e.clipboardData?.getData('text/plain') || '';
      if (htmlData || plainText) {
        e.preventDefault();
        processClipboardContent(htmlData, plainText);
        setShowGuideModal(false);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isOpen, processClipboardContent]);

  // Explicitly request clipboard permission & read content; if denied, open the user guidance modal
  const handleUnifiedClipboardAction = async (): Promise<boolean> => {
    if (Date.now() - lastPasteTimeRef.current < 500) return true;

    const res = await requestClipboardWithPermission();
    setPermissionState(res.permissionState);

    if (res.status === 'ok') {
      processClipboardContent(res.htmlData, res.plainText);
      return true;
    }

    if (res.status === 'empty') {
      setStatusMsg('클립보드에 복사된 텍스트가 없습니다. 먼저 텍스트를 복사해 주세요.');
      return false;
    }

    // Permission denied or blocked by browser security -> open guidance alert modal
    setShowGuideModal(true);
    return false;
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    lastPasteTimeRef.current = Date.now();

    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    if (richPasteRef.current) {
      richPasteRef.current.innerHTML = '';
    }

    // Process synchronously right away so the textbox updates in 0ms
    processClipboardContent(htmlData, plainText);

    // If clipboardData had no text/html, try async clipboard read in background
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
        <span>폰트 찾기&amp;적용</span>
      </button>
    );
  }

  return (
    <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-950">
          <ClipboardPaste className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          폰트 찾기&amp;적용
        </span>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setResults([]);
            setStatusMsg(null);
            setInputValue('');
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
          onClick={() => {
            void handleUnifiedClipboardAction();
          }}
          onPaste={handlePaste}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/80 px-3 py-2 text-[11px] font-semibold text-amber-950 hover:bg-amber-200/70 focus:border-amber-500 focus:outline-none transition cursor-pointer caret-transparent"
        />
        <div className="pointer-events-none inset-0 absolute flex items-center justify-center gap-1.5 px-3 text-[11px] font-semibold text-amber-950">
          <ClipboardPaste className="h-3.5 w-3.5 text-amber-800 shrink-0" />
          <span>복사한 폰트 불러오기</span>
        </div>
      </div>
      <p className="text-[11px] text-stone-500 leading-snug">
        폰트가 적용된 글을 복사하여 불러오면 폰트의 이름을 알 수 있습니다.
      </p>

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
            {targetLabel}에 &apos;{appliedFontName}&apos; 폰트가 적용되었습니다!
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
                        내장 폰트 일치
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
                        {inputValue.trim() || '이세계에서 도착한 편지입니다.'}
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
                        {isCurrentlySelected ? '적용됨' : '이 폰트로 적용'}
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
                    미내장 폰트
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

      {/* Clipboard Permission & Direct Paste Guide Modal */}
      <ClipboardGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onPasteReceived={(htmlData, plainText) => {
          processClipboardContent(htmlData, plainText);
        }}
        onRetryPermission={handleUnifiedClipboardAction}
        permissionState={permissionState}
      />
    </div>
  );
};
