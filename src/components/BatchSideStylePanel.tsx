import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Sliders,
  Type,
  Copy,
  Check,
  ArrowRightLeft,
  Save,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { Bubble, BubbleSideStyle, DefaultSideStyles, WebFont } from '../types';
import {
  COLOR_PALETTE,
  DEFAULT_META_FONT_FAMILY,
  getMetaOrderedFonts,
} from '../data/presetFonts';
import { FontPasteMatcher } from './FontPasteMatcher';
import { FontSelectDropdown } from './FontSelectDropdown';

interface BatchSideStylePanelProps {
  bubbles: Bubble[];
  defaultSideStyles: DefaultSideStyles;
  savedSideStyles: DefaultSideStyles;
  onUpdateSideStyle: (side: 'left' | 'right' | 'center', updated: Partial<BubbleSideStyle>) => void;
  onSaveSideStyle: (side: 'left' | 'right' | 'center') => void;
  onRevertSideStyle: (side: 'left' | 'right' | 'center') => void;
  onCopySideStyle: (fromSide: 'left' | 'right' | 'center', toSide: 'left' | 'right' | 'center') => void;
  fonts: WebFont[];
  onOpenFontManager: () => void;
  onActiveSideChange?: (side: 'left' | 'center' | 'right') => void;
}

export const BatchSideStylePanel: React.FC<BatchSideStylePanelProps> = ({
  bubbles,
  defaultSideStyles,
  savedSideStyles,
  onUpdateSideStyle,
  onSaveSideStyle,
  onRevertSideStyle,
  onCopySideStyle,
  fonts,
  onOpenFontManager,
  onActiveSideChange,
}) => {
  const [activeSide, setActiveSideState] = useState<'left' | 'center' | 'right'>('left');
  const setActiveSide = (side: 'left' | 'center' | 'right') => {
    setActiveSideState(side);
    onActiveSideChange?.(side);
  };
  const [notification, setNotification] = useState<string | null>(null);

  // Category & Sub-section open/close states
  const [isTextCategoryOpen, setIsTextCategoryOpen] = useState(true);
  const [isSpacingOpen, setIsSpacingOpen] = useState(false);
  const [isBubbleCategoryOpen, setIsBubbleCategoryOpen] = useState(true);
  const [isBubbleSizeOpen, setIsBubbleSizeOpen] = useState(false);
  const [isBubbleStyleOpen, setIsBubbleStyleOpen] = useState(false);

  const currentStyle = defaultSideStyles[activeSide] || defaultSideStyles.left;
  const savedStyle = savedSideStyles[activeSide] || savedSideStyles.left;
  // Determine if current working style differs from saved default
  const isModified = JSON.stringify(currentStyle) !== JSON.stringify(savedStyle);

  const sideBubbles = bubbles.filter((b) => b.align === activeSide);

  const sideLabel = (side: 'left' | 'center' | 'right') =>
    side === 'left' ? '왼쪽' : side === 'center' ? '중앙' : '오른쪽';

  const otherSides: ('left' | 'center' | 'right')[] = (['left', 'center', 'right'] as const).filter(
    (s) => s !== activeSide
  );

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  const handleSave = () => {
    onSaveSideStyle(activeSide);
    showNotification(
      `${sideLabel(activeSide)} 기본서식이 저장되었습니다.`
    );
  };

  const handleRevert = () => {
    onRevertSideStyle(activeSide);
    showNotification(
      `${sideLabel(activeSide)} 서식을 이전 저장 상태로 되돌렸습니다.`
    );
  };

  const handleCopy = (toSide: 'left' | 'center' | 'right') => {
    onCopySideStyle(activeSide, toSide);
    showNotification(
      `${sideLabel(activeSide)} 서식을 ${sideLabel(toSide)}에 복사했습니다.`
    );
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Side Selector Tabs (3 columns: left, center, right) */}
      <div className="rounded-xl border border-stone-200 bg-stone-100 p-1">
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            id="tab-batch-left"
            onClick={() => setActiveSide('left')}
            title="왼쪽 말풍선 서식"
            className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-1.5 px-1 text-xs font-semibold transition ${
              activeSide === 'left'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <AlignLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">왼쪽</span>
            <span className="rounded-full bg-stone-200/80 px-1.5 py-0.2 text-[10px] text-stone-600">
              {bubbles.filter((b) => b.align === 'left').length}
            </span>
          </button>

          <button
            type="button"
            id="tab-batch-center"
            onClick={() => setActiveSide('center')}
            title="중앙 말풍선 서식"
            className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-1.5 px-1 text-xs font-semibold transition ${
              activeSide === 'center'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <AlignCenter className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">중앙</span>
            <span className="rounded-full bg-stone-200/80 px-1.5 py-0.2 text-[10px] text-stone-600">
              {bubbles.filter((b) => b.align === 'center').length}
            </span>
          </button>

          <button
            type="button"
            id="tab-batch-right"
            onClick={() => setActiveSide('right')}
            title="오른쪽 말풍선 서식"
            className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-1.5 px-1 text-xs font-semibold transition ${
              activeSide === 'right'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <AlignRight className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">오른쪽</span>
            <span className="rounded-full bg-stone-200/80 px-1.5 py-0.2 text-[10px] text-stone-600">
              {bubbles.filter((b) => b.align === 'right').length}
            </span>
          </button>
        </div>
      </div>

      {/* Notification Alert */}
      {notification && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Live Preview & Save/Revert Banner */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-900">
              {sideLabel(activeSide)} 서식 일괄 설정
            </span>
            {isModified ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                실시간 반영 중
              </span>
            ) : (
              <span className="rounded-md bg-stone-200/70 px-1.5 py-0.5 text-[10px] text-stone-600">
                기본서식과 일치
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-500">
            <span className="text-[10px] text-stone-400">복사:</span>
            {otherSides.map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => handleCopy(target)}
                className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition"
                title={`${sideLabel(target)}에 이 서식 복사`}
              >
                → {sideLabel(target)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-stone-600 leading-relaxed">
          아래 서식을 조절하면 화면의 <strong>{sideLabel(activeSide)} 말풍선({sideBubbles.length}개)에 즉시 반영</strong>됩니다. 개별 편집으로 서식을 설정한 글자는 그대로 유지됩니다.
        </p>

        {/* Action Buttons: 저장 / 원래대로 */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            id="btn-save-side-style"
            onClick={handleSave}
            disabled={!isModified}
            title="저장"
            className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              isModified
                ? 'border-stone-900 bg-stone-900 text-white shadow-xs hover:bg-stone-800 active:scale-[0.99] cursor-pointer'
                : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Save
              className={`h-3.5 w-3.5 shrink-0 ${
                isModified ? 'text-amber-300' : 'text-stone-400'
              }`}
            />
            <span className="hidden sm:inline">저장</span>
          </button>

          <button
            type="button"
            id="btn-revert-side-style"
            onClick={handleRevert}
            disabled={!isModified}
            title="원래대로"
            className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              isModified
                ? 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 active:scale-[0.99] shadow-2xs cursor-pointer'
                : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">원래대로</span>
          </button>
        </div>
      </div>

      {/* Category 1: 텍스트 (기본 폰트 / 글자 서식 & 정렬 / 기본 글자 크기 / 글자 색상 / 글자 간격) */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsTextCategoryOpen((prev) => !prev)}
          className="flex w-full items-center justify-between bg-stone-50/90 px-3.5 py-2.5 text-left hover:bg-stone-100/80 transition cursor-pointer"
        >
          <span className="text-xs font-bold text-stone-800">텍스트</span>
          <ChevronDown
            className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${
              isTextCategoryOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isTextCategoryOpen && (
          <div className="p-3.5 space-y-4 border-t border-stone-100">
            {/* 1. Font Family */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">기본 폰트</label>
                <button
                  type="button"
                  onClick={onOpenFontManager}
                  className="text-[11px] text-stone-500 hover:text-stone-800 hover:underline"
                >
                  폰트 관리 +
                </button>
              </div>
              <FontSelectDropdown
                fonts={fonts}
                value={currentStyle.fontFamily}
                onChange={(family) =>
                  onUpdateSideStyle(activeSide, { fontFamily: family })
                }
              />

              <FontPasteMatcher
                fonts={fonts}
                currentFamily={currentStyle.fontFamily}
                onApplyFont={(family, fontName) => {
                  onUpdateSideStyle(activeSide, { fontFamily: family });
                  showNotification(
                    `${sideLabel(activeSide)} 서식에 '${fontName}' 폰트가 적용되었습니다.`
                  );
                }}
                onOpenFontManager={onOpenFontManager}
                targetLabel={`${sideLabel(activeSide)} 일괄 서식`}
              />
            </div>

            {/* 2. Text Formatting Bar: Bold, Italic, Strikethrough, Underline & Text Align */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700">글자 서식 & 정렬</label>
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-200 bg-stone-50/60 p-1">
                {/* Bold */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, { isBold: !currentStyle.isBold })
                  }
                  className={`rounded p-1.5 transition ${
                    currentStyle.isBold
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="굵게 (Bold)"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, { isItalic: !currentStyle.isItalic })
                  }
                  className={`rounded p-1.5 transition ${
                    currentStyle.isItalic
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="기울임 (Italic)"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>

                {/* Strikethrough */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, {
                      isStrikethrough: !currentStyle.isStrikethrough,
                    })
                  }
                  className={`rounded p-1.5 transition ${
                    currentStyle.isStrikethrough
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="취소표 / 취소선 (Strikethrough)"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, {
                      isUnderline: !currentStyle.isUnderline,
                    })
                  }
                  className={`rounded p-1.5 transition ${
                    currentStyle.isUnderline
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="밑줄 (Underline)"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>

                <div className="mx-1 h-4 w-[1px] bg-stone-300" />

                {/* Text Align Left */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, { textAlign: 'left' })
                  }
                  className={`rounded p-1.5 transition ${
                    currentStyle.textAlign === 'left'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="텍스트 좌측 정렬"
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>

                {/* Text Align Center */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, { textAlign: 'center' })
                  }
                  className={`rounded p-1.5 transition ${
                    currentStyle.textAlign === 'center'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="텍스트 중앙 정렬"
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>

                {/* Text Align Right */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, { textAlign: 'right' })
                  }
                  className={`rounded p-1.5 transition ${
                    currentStyle.textAlign === 'right'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="텍스트 우측 정렬"
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Font Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">기본 글자 크기</span>
                <span className="font-mono text-stone-700 font-medium">
                  {currentStyle.fontSize}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="14"
                  max="42"
                  value={currentStyle.fontSize}
                  onChange={(e) =>
                    onUpdateSideStyle(activeSide, { fontSize: Number(e.target.value) })
                  }
                  className="w-full accent-stone-900"
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>작게 (14px)</span>
                <span>기본 (22px)</span>
                <span>크게 (42px)</span>
              </div>
            </div>

            {/* 4. Text Color */}
            <div>
              <label className="text-xs font-semibold text-stone-700">글자 색상</label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={currentStyle.color}
                  onChange={(e) =>
                    onUpdateSideStyle(activeSide, { color: e.target.value })
                  }
                  className="h-8 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                />
                <div className="flex flex-1 flex-wrap gap-1">
                  {COLOR_PALETTE.text.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        onUpdateSideStyle(activeSide, { color: c.value })
                      }
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                      className={`h-6 w-6 rounded-full border border-stone-300 transition-transform ${
                        currentStyle.color.toLowerCase() === c.value.toLowerCase()
                          ? 'scale-110 ring-2 ring-stone-900'
                          : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Collapsible 글자 간격 (자간 / 행간 / 텍스트 상하 위치) - white bg with top/bottom dividers */}
            <div className="border-y border-stone-200 py-2.5 bg-white">
              <button
                type="button"
                onClick={() => setIsSpacingOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left hover:text-stone-900 transition cursor-pointer"
              >
                <span className="text-xs font-semibold text-stone-700">
                  글자 간격
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-200 ${
                    isSpacingOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSpacingOpen && (
                <div className="space-y-3 pt-3">
                  {/* Letter Spacing */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">자간 (Letter Spacing)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-1.5"
                        max="4"
                        step="0.5"
                        value={currentStyle.letterSpacing ?? 0.5}
                        onChange={(e) =>
                          onUpdateSideStyle(activeSide, {
                            letterSpacing: Number(e.target.value),
                          })
                        }
                        className="w-24 accent-stone-900"
                      />
                      <span className="w-9 text-right font-mono text-xs">
                        {currentStyle.letterSpacing ?? 0.5}px
                      </span>
                    </div>
                  </div>

                  {/* Line Height */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">행간 (Line Height)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1.2"
                        max="2.2"
                        step="0.1"
                        value={currentStyle.lineHeight ?? 1.5}
                        onChange={(e) =>
                          onUpdateSideStyle(activeSide, {
                            lineHeight: Number(e.target.value),
                          })
                        }
                        className="w-24 accent-stone-900"
                      />
                      <span className="w-9 text-right font-mono text-xs">
                        {currentStyle.lineHeight ?? 1.5}배
                      </span>
                    </div>
                  </div>

                  {/* Text Vertical Offset (텍스트 상하 위치 미세조정) */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-600">텍스트 상하 위치</span>
                      {(currentStyle.textOffsetY ?? 0) !== 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSideStyle(activeSide, { textOffsetY: 0 })
                          }
                          className="rounded bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 hover:bg-stone-300"
                          title="텍스트 상하 위치 0px로 초기화"
                        >
                          초기화
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={currentStyle.textOffsetY ?? 0}
                        onChange={(e) =>
                          onUpdateSideStyle(activeSide, {
                            textOffsetY: Number(e.target.value),
                          })
                        }
                        className="w-24 accent-stone-900"
                      />
                      <span className="w-9 text-right font-mono text-xs">
                        {(currentStyle.textOffsetY ?? 0) > 0
                          ? `+${currentStyle.textOffsetY}px`
                          : `${currentStyle.textOffsetY ?? 0}px`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category 2: 말풍선 (일반/구름 선택 / 말풍선 배경색 / 말풍선 크기 / 스타일) */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsBubbleCategoryOpen((prev) => !prev)}
          className="flex w-full items-center justify-between bg-stone-50/90 px-3.5 py-2.5 text-left hover:bg-stone-100/80 transition cursor-pointer"
        >
          <span className="text-xs font-bold text-stone-800">말풍선</span>
          <ChevronDown
            className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${
              isBubbleCategoryOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isBubbleCategoryOpen && (
          <div className="p-3.5 space-y-4 border-t border-stone-100">
            {/* Bubble Shape (일반 / 구름 말풍선) - moved to very top of 말풍선 */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateSideStyle(activeSide, {
                    bubbleShape: 'default',
                  })
                }
                className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border py-1.5 px-1 text-xs font-medium transition cursor-pointer ${
                  (currentStyle.bubbleShape || 'default') === 'default'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                일반 말풍선
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSideStyle(activeSide, {
                    bubbleShape: 'cloud',
                  })
                }
                className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border py-1.5 px-1 text-xs font-medium transition cursor-pointer ${
                  currentStyle.bubbleShape === 'cloud'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                구름 말풍선
              </button>
            </div>

            {/* Bubble Background Color */}
            <div>
              <label className="text-xs font-semibold text-stone-700">말풍선 배경색</label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={
                    currentStyle.bgColor === 'transparent'
                      ? '#FFFFFF'
                      : currentStyle.bgColor
                  }
                  onChange={(e) =>
                    onUpdateSideStyle(activeSide, { bgColor: e.target.value })
                  }
                  className="h-8 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                />
                <div className="flex flex-1 flex-wrap gap-1">
                  {COLOR_PALETTE.bubbleBg.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        onUpdateSideStyle(activeSide, { bgColor: c.value })
                      }
                      style={{
                        backgroundColor:
                          c.value === 'transparent' ? '#ffffff' : c.value,
                      }}
                      title={c.label}
                      className={`relative h-6 w-6 rounded-full border border-stone-300 transition-transform ${
                        currentStyle.bgColor.toLowerCase() === c.value.toLowerCase()
                          ? 'scale-110 ring-2 ring-stone-900'
                          : 'hover:scale-105'
                      }`}
                    >
                      {c.value === 'transparent' && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-stone-400">
                          ∅
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Collapsible sections: 말풍선 크기 & 스타일 (white bg with top/bottom dividers) */}
            <div className="divide-y divide-stone-200 border-y border-stone-200 bg-white">
              {/* 1) 말풍선 크기 (모서리 둥글기 / 상하·좌우 여백) */}
              <div className="py-2.5">
                <button
                  type="button"
                  onClick={() => setIsBubbleSizeOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left hover:text-stone-900 transition cursor-pointer"
                >
                  <span className="text-xs font-semibold text-stone-700">
                    말풍선 크기
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-200 ${
                      isBubbleSizeOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isBubbleSizeOpen && (
                  <div className="space-y-3 pt-3">
                    {/* Border Radius (Independent per bubbleShape) */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">
                        {currentStyle.bubbleShape === 'cloud'
                          ? '모서리 둥글기 (구름)'
                          : '모서리 둥글기 (일반)'}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="4"
                          max="32"
                          value={
                            currentStyle.bubbleShape === 'cloud'
                              ? (currentStyle.cloudBorderRadius ?? 14)
                              : currentStyle.borderRadius
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (currentStyle.bubbleShape === 'cloud') {
                              onUpdateSideStyle(activeSide, {
                                cloudBorderRadius: val,
                              });
                            } else {
                              onUpdateSideStyle(activeSide, {
                                borderRadius: val,
                              });
                            }
                          }}
                          className="w-28 accent-stone-900"
                        />
                        <span className="w-8 text-right font-mono text-xs">
                          {currentStyle.bubbleShape === 'cloud'
                            ? (currentStyle.cloudBorderRadius ?? 14)
                            : currentStyle.borderRadius}
                          px
                        </span>
                      </div>
                    </div>

                    {/* Padding Y (Independent per bubbleShape, default 8px for cloud) */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">
                        {currentStyle.bubbleShape === 'cloud'
                          ? '상하 내부 여백 (구름)'
                          : '상하 내부 여백 (일반)'}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="4"
                          max="36"
                          value={
                            currentStyle.bubbleShape === 'cloud'
                              ? (currentStyle.cloudPaddingY ?? 8)
                              : currentStyle.paddingY
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (currentStyle.bubbleShape === 'cloud') {
                              onUpdateSideStyle(activeSide, {
                                cloudPaddingY: val,
                              });
                            } else {
                              onUpdateSideStyle(activeSide, {
                                paddingY: val,
                              });
                            }
                          }}
                          className="w-28 accent-stone-900"
                        />
                        <span className="w-8 text-right font-mono text-xs">
                          {currentStyle.bubbleShape === 'cloud'
                            ? (currentStyle.cloudPaddingY ?? 8)
                            : currentStyle.paddingY}
                          px
                        </span>
                      </div>
                    </div>

                    {/* Padding X (Independent per bubbleShape) */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">
                        {currentStyle.bubbleShape === 'cloud'
                          ? '좌우 내부 여백 (구름)'
                          : '좌우 내부 여백 (일반)'}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={
                            currentStyle.bubbleShape === 'cloud'
                              ? (currentStyle.cloudPaddingX ?? 24)
                              : currentStyle.paddingX
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (currentStyle.bubbleShape === 'cloud') {
                              onUpdateSideStyle(activeSide, {
                                cloudPaddingX: val,
                              });
                            } else {
                              onUpdateSideStyle(activeSide, {
                                paddingX: val,
                              });
                            }
                          }}
                          className="w-28 accent-stone-900"
                        />
                        <span className="w-8 text-right font-mono text-xs">
                          {currentStyle.bubbleShape === 'cloud'
                            ? (currentStyle.cloudPaddingX ?? 24)
                            : currentStyle.paddingX}
                          px
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2) 스타일 (말풍선 꼬리 + 외곽 테두리 & 그림자) */}
              <div className="py-2.5">
                <button
                  type="button"
                  onClick={() => setIsBubbleStyleOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left hover:text-stone-900 transition cursor-pointer"
                >
                  <span className="text-xs font-semibold text-stone-700">
                    스타일
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-200 ${
                      isBubbleStyleOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isBubbleStyleOpen && (
                  <div className="space-y-2.5 pt-3">
                    {/* Bubble Tail Checkbox */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">말풍선 꼬리</span>
                      <input
                        type="checkbox"
                        checked={Boolean(
                          currentStyle.hasTail ?? (activeSide !== 'center')
                        )}
                        onChange={(e) =>
                          onUpdateSideStyle(activeSide, {
                            hasTail: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded accent-stone-900"
                      />
                    </div>

                    {/* Border Toggle */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">외곽 테두리선</span>
                      <input
                        type="checkbox"
                        checked={currentStyle.hasBorder}
                        onChange={(e) =>
                          onUpdateSideStyle(activeSide, { hasBorder: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-stone-900"
                      />
                    </div>

                    {currentStyle.hasBorder && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-600">테두리 색상</span>
                        <input
                          type="color"
                          value={currentStyle.borderColor || '#E5DED3'}
                          onChange={(e) =>
                            onUpdateSideStyle(activeSide, { borderColor: e.target.value })
                          }
                          className="h-6 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                        />
                      </div>
                    )}

                    {/* Shadow Toggle */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">은은한 입체 그림자</span>
                      <input
                        type="checkbox"
                        checked={currentStyle.hasShadow}
                        onChange={(e) =>
                          onUpdateSideStyle(activeSide, { hasShadow: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-stone-900"
                      />
                    </div>

                    {/* Bottom Solid Shadow Toggle (4px) */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">하단 그림자 (4px 단색)</span>
                      <input
                        type="checkbox"
                        checked={Boolean(currentStyle.hasBottomShadow)}
                        onChange={(e) =>
                          onUpdateSideStyle(activeSide, { hasBottomShadow: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-stone-900"
                      />
                    </div>

                    {currentStyle.hasBottomShadow && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-600">하단 그림자 색상</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-stone-500">
                            {currentStyle.bottomShadowColor || '#b9a98e'}
                          </span>
                          <input
                            type="color"
                            value={currentStyle.bottomShadowColor || '#b9a98e'}
                            onChange={(e) =>
                              onUpdateSideStyle(activeSide, { bottomShadowColor: e.target.value })
                            }
                            className="h-6 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Speaker Name & Date Batch Settings (Moved to very bottom) */}
      <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-700">
            이름/시간 표시
          </label>
          <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => onUpdateSideStyle(activeSide, { showMeta: true })}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                Boolean(currentStyle.showMeta)
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ON
            </button>
            <button
              type="button"
              onClick={() => onUpdateSideStyle(activeSide, { showMeta: false })}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                !Boolean(currentStyle.showMeta)
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              OFF
            </button>
          </div>
        </div>

        {Boolean(currentStyle.showMeta) && (
          <div className="space-y-3 pt-1 border-t border-stone-200/80">
            {/* Theme Selector (2 Versions) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-stone-600">
                표시 테마
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, {
                      showMeta: true,
                      metaTheme: 'outside',
                    })
                  }
                  className={`rounded-lg border px-2.5 py-1.5 text-center text-xs font-semibold transition cursor-pointer ${
                    (currentStyle.metaTheme || 'inside') === 'outside'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  메신저
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSideStyle(activeSide, {
                      showMeta: true,
                      metaTheme: 'inside',
                    })
                  }
                  className={`rounded-lg border px-2.5 py-1.5 text-center text-xs font-semibold transition cursor-pointer ${
                    (currentStyle.metaTheme || 'inside') === 'inside'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  이체통
                </button>
              </div>
            </div>

            {/* Name & Date Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600">
                  이름
                </label>
                <input
                  type="text"
                  value={currentStyle.speaker || ''}
                  onChange={(e) =>
                    onUpdateSideStyle(activeSide, {
                      showMeta: true,
                      speaker: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600">
                  시간
                </label>
                <input
                  type="text"
                  value={currentStyle.dateText || ''}
                  onChange={(e) =>
                    onUpdateSideStyle(activeSide, {
                      showMeta: true,
                      dateText: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Separate Font Family for Name/Date */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-stone-600">
                  폰트
                </label>
              </div>
              <FontSelectDropdown
                fonts={getMetaOrderedFonts(fonts)}
                value={currentStyle.metaFontFamily || DEFAULT_META_FONT_FAMILY}
                onChange={(metaFontFamily) =>
                  onUpdateSideStyle(activeSide, { metaFontFamily })
                }
              />
            </div>

            {/* Separate Color for Name/Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone-600">
                색상
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    currentStyle.metaColor ||
                    (activeSide === 'right' ? '#cdaf77' : '#777674')
                  }
                  onChange={(e) =>
                    onUpdateSideStyle(activeSide, { metaColor: e.target.value })
                  }
                  className="h-7 w-7 cursor-pointer rounded border border-stone-200 bg-white p-0.5"
                />
                <div className="flex flex-1 flex-wrap gap-1">
                  {COLOR_PALETTE.metaText.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        onUpdateSideStyle(activeSide, { metaColor: c.value })
                      }
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                      className={`h-5 w-5 rounded-full border border-stone-300 transition-transform cursor-pointer ${
                        (
                          currentStyle.metaColor ||
                          (activeSide === 'right' ? '#cdaf77' : '#777674')
                        ).toLowerCase() === c.value.toLowerCase()
                          ? 'scale-110 ring-2 ring-stone-900'
                          : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
