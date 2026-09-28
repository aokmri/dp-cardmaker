import React, { useState } from 'react';
import { Search, Check, Sparkles, X, ClipboardPaste } from 'lucide-react';
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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    const detected = detectFontsFromClipboard(htmlData, plainText, fonts);
    setResults(detected);
    setAppliedFontName(null);

    if (detected.length > 0) {
      const builtInCount = detected.filter((d) => d.matchedFont !== null).length;
      if (builtInCount > 0) {
        setStatusMsg(
          `내장 글꼴 ${builtInCount}개를 찾았습니다! 아래 버튼을 눌러 바로 적용하세요.`
        );
      } else {
        setStatusMsg(
          `글꼴(${detected.map((d) => d.rawName).join(', ')})을 감지했으나 내장 목록에 없습니다.`
        );
      }
    } else {
      setStatusMsg(
        '클립보드에서 글꼴 서식을 찾지 못했습니다. 폰트 이름을 직접 입력해 검색할 수도 있습니다.'
      );
    }
  };

  const handleManualSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setStatusMsg('복사한 텍스트를 붙여넣거나 찾을 글꼴 이름을 입력해주세요.');
      setResults([]);
      return;
    }
    const detected = detectFontsFromClipboard('', trimmed, fonts);
    setResults(detected);
    setAppliedFontName(null);

    if (detected.length > 0 && detected.some((d) => d.matchedFont !== null)) {
      setStatusMsg('일치하는 내장 글꼴을 찾았습니다!');
    } else {
      setStatusMsg(`'${trimmed}'와(과) 일치하는 내장 글꼴을 찾지 못했습니다.`);
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
          }}
          className="rounded p-0.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700"
          title="닫기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex gap-1">
        <input
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
          placeholder="타 사이트 글자 복사 후 붙여넣기(Ctrl+V) 또는 폰트명"
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
          {results.length === 0 && (
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
        <div className="space-y-1.5 pt-0.5">
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
                      {item.rawName.toLowerCase() !== matched.name.toLowerCase() && (
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
                      <span>{isCurrentlySelected ? '적용됨' : '이 글꼴로 적용'}</span>
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
    </div>
  );
};
