import React, { useState, useEffect } from 'react';
import {
  Type,
  MessageCircle,
  Move,
  Image as ImageIcon,
  Layout,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Clock,
} from 'lucide-react';
import {
  Bubble,
  BubbleSideStyle,
  CanvasConfig,
  CardThemeId,
  DefaultSideStyles,
  WebFont,
} from '../types';
import {
  COLOR_PALETTE,
  DEFAULT_META_FONT_FAMILY,
  getMetaOrderedFonts,
} from '../data/presetFonts';
import { FontSelectDropdown } from './FontSelectDropdown';
import { FontPasteMatcher } from './FontPasteMatcher';
import {
  formatSelection,
  getSelectionWithinBubble,
  stripInlineFontFamilyFromHtml,
} from '../utils/richText';

export type MobileToolId =
  | 'typography'
  | 'color'
  | 'spacing'
  | 'meta'
  | 'canvasBg'
  | 'canvasLayout'
  | null;

interface MobileBottomToolbarProps {
  selectedBubble: Bubble | null;
  bubbles: Bubble[];
  onSelectBubble: (id: string | null) => void;
  onUpdateBubble: (updated: Partial<Bubble>) => void;
  onDeleteBubble: () => void;
  onDuplicateBubble: () => void;
  onMoveBubbleOrder?: (direction: 'up' | 'down') => void;
  onAddBubble: (align?: 'left' | 'center' | 'right') => void;
  canvasConfig: CanvasConfig;
  onUpdateCanvasConfig: (updated: Partial<CanvasConfig>) => void;
  fonts: WebFont[];
  onOpenFontManager: () => void;
  defaultSideStyles: DefaultSideStyles;
  savedSideStyles: DefaultSideStyles;
  onUpdateSideStyle: (
    side: 'left' | 'right' | 'center',
    updated: Partial<BubbleSideStyle>
  ) => void;
  onSaveSideStyle: (side: 'left' | 'right' | 'center') => void;
  onRevertSideStyle: (side: 'left' | 'right' | 'center') => void;
  onCopySideStyle: (
    fromSide: 'left' | 'right' | 'center',
    toSide: 'left' | 'right' | 'center'
  ) => void;
  activeBatchSide: 'left' | 'center' | 'right';
  onActiveBatchSideChange: (side: 'left' | 'center' | 'right') => void;
  onApplyTheme?: (themeId: CardThemeId) => void;
}

export const MobileBottomToolbar: React.FC<MobileBottomToolbarProps> = ({
  selectedBubble,
  bubbles,
  onSelectBubble,
  onUpdateBubble,
  onDeleteBubble,
  onDuplicateBubble,
  onMoveBubbleOrder,
  onAddBubble,
  canvasConfig,
  onUpdateCanvasConfig,
  fonts,
  onOpenFontManager,
  defaultSideStyles,
  savedSideStyles,
  onUpdateSideStyle,
  onSaveSideStyle,
  onRevertSideStyle,
  onCopySideStyle,
  activeBatchSide,
  onActiveBatchSideChange,
  onApplyTheme,
}) => {
  const [openTool, setOpenTool] = useState<MobileToolId>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'single' | 'batch'>('single');
  const [expandedSliderKey, setExpandedSliderKey] = useState<string | null>(null);
  const [isTextSpacingOpen, setIsTextSpacingOpen] = useState(false);
  const [isBubbleSizeOpen, setIsBubbleSizeOpen] = useState(false);
  const [isCardSizeGroupOpen, setIsCardSizeGroupOpen] = useState(false);

  // Automatically switch to single edit mode and sync batch side when a bubble is tapped on canvas
  useEffect(() => {
    if (selectedBubble) {
      setEditMode('single');
      onActiveBatchSideChange(selectedBubble.align);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBubble?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 1800);
  };

  const toggleTool = (tool: Exclude<MobileToolId, null>) => {
    setExpandedSliderKey(null);
    setOpenTool((prev) => (prev === tool ? null : tool));
  };

  const renderCollapsibleSlider = ({
    sliderKey,
    label,
    displayValue,
    value,
    min,
    max,
    step = 1,
    onChange,
  }: {
    sliderKey: string;
    label: string;
    displayValue: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
  }) => {
    const isExpanded = expandedSliderKey === sliderKey;
    return (
      <div
        className={`rounded-xl border transition-all ${
          isExpanded
            ? 'border-stone-800 bg-stone-50 p-2.5 col-span-full'
            : 'border-stone-200 bg-white hover:bg-stone-50'
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setExpandedSliderKey((prev) =>
              prev === sliderKey ? null : sliderKey
            )
          }
          className={`flex w-full items-center justify-between gap-2 text-left cursor-pointer ${
            isExpanded ? 'mb-2' : 'px-2.5 py-2'
          }`}
        >
          <span className="text-[11px] font-semibold text-stone-700 truncate">
            {label}
          </span>
          <span className="inline-flex items-center gap-1 shrink-0">
            <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-stone-800">
              {displayValue}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-stone-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            )}
          </span>
        </button>

        {isExpanded && (
          <div className="flex items-center gap-2 pt-1.5 border-t border-stone-200/80">
            <button
              type="button"
              onClick={() =>
                onChange(
                  Number(Math.max(min, Number((value - step).toFixed(2))))
                )
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-700 active:bg-stone-100"
              aria-label={`${label} 감소`}
            >
              -
            </button>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full accent-stone-900"
            />
            <button
              type="button"
              onClick={() =>
                onChange(
                  Number(Math.min(max, Number((value + step).toFixed(2))))
                )
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-700 active:bg-stone-100"
              aria-label={`${label} 증가`}
            >
              +
            </button>
          </div>
        )}
      </div>
    );
  };

  // Determine whether typography/color/spacing controls target the selected bubble or batch side style
  const isEditingSingle = Boolean(selectedBubble && editMode === 'single');
  const activeStyle: BubbleSideStyle = isEditingSingle && selectedBubble
    ? {
        fontFamily: selectedBubble.fontFamily,
        fontSize: selectedBubble.fontSize,
        color: selectedBubble.color,
        bgColor: selectedBubble.bgColor,
        isBold: selectedBubble.isBold,
        isItalic: selectedBubble.isItalic,
        isStrikethrough: selectedBubble.isStrikethrough,
        isUnderline: selectedBubble.isUnderline,
        textAlign: selectedBubble.textAlign,
        borderRadius: selectedBubble.borderRadius,
        cloudBorderRadius: selectedBubble.cloudBorderRadius ?? 14,
        bubbleShape: selectedBubble.bubbleShape || 'default',
        hasTail:
          selectedBubble.hasTail !== undefined
            ? selectedBubble.hasTail
            : selectedBubble.align !== 'center',
        paddingY: selectedBubble.paddingY,
        paddingX: selectedBubble.paddingX,
        cloudPaddingY: selectedBubble.cloudPaddingY ?? 8,
        cloudPaddingX: selectedBubble.cloudPaddingX ?? 24,
        hasShadow: selectedBubble.hasShadow,
        hasBottomShadow: Boolean(selectedBubble.hasBottomShadow),
        bottomShadowColor: selectedBubble.bottomShadowColor || '#b9a98e',
        hasBorder: selectedBubble.hasBorder,
        borderColor: selectedBubble.borderColor || '#E5DED3',
        letterSpacing: selectedBubble.letterSpacing ?? 0,
        lineHeight: selectedBubble.lineHeight ?? 1.5,
        textOffsetY: selectedBubble.textOffsetY ?? 0,
        showMeta: selectedBubble.showMeta,
        speaker: selectedBubble.speaker,
        dateText: selectedBubble.dateText,
        metaTheme: selectedBubble.metaTheme,
        metaFontFamily: selectedBubble.metaFontFamily,
        metaColor: selectedBubble.metaColor,
      }
    : defaultSideStyles[activeBatchSide];

  const handleStyleChange = (updated: Partial<BubbleSideStyle>) => {
    if (isEditingSingle && selectedBubble) {
      onUpdateBubble(updated);
    } else {
      onUpdateSideStyle(activeBatchSide, updated);
    }
  };

  const handleFormatCommand = (
    command: 'bold' | 'italic' | 'underline' | 'strikeThrough'
  ) => {
    if (isEditingSingle && selectedBubble) {
      const hasSelection = getSelectionWithinBubble(selectedBubble.id);
      if (
        hasSelection &&
        !hasSelection.collapsed &&
        hasSelection.toString().length > 0
      ) {
        formatSelection(selectedBubble.id, { command }, (newHtml, newText) => {
          onUpdateBubble({ html: newHtml, text: newText });
        });
        return;
      }
    }
    if (command === 'bold') handleStyleChange({ isBold: !activeStyle.isBold });
    if (command === 'italic')
      handleStyleChange({ isItalic: !activeStyle.isItalic });
    if (command === 'underline')
      handleStyleChange({ isUnderline: !activeStyle.isUnderline });
    if (command === 'strikeThrough')
      handleStyleChange({ isStrikethrough: !activeStyle.isStrikethrough });
  };

  const handleTextColor = (color: string) => {
    if (isEditingSingle && selectedBubble) {
      const hasSelection = getSelectionWithinBubble(selectedBubble.id);
      if (
        hasSelection &&
        !hasSelection.collapsed &&
        hasSelection.toString().length > 0
      ) {
        formatSelection(selectedBubble.id, { color }, (newHtml, newText) => {
          onUpdateBubble({ html: newHtml, text: newText });
        });
        return;
      }
    }
    handleStyleChange({ color });
  };

  const handleFontFamily = (fontFamily: string) => {
    if (isEditingSingle && selectedBubble) {
      const hasSelection = getSelectionWithinBubble(selectedBubble.id);
      if (
        hasSelection &&
        !hasSelection.collapsed &&
        hasSelection.toString().length > 0
      ) {
        formatSelection(
          selectedBubble.id,
          { fontFamily },
          (newHtml, newText) => {
            onUpdateBubble({ fontFamily, html: newHtml, text: newText });
          }
        );
        return;
      }
      const cleanedHtml = stripInlineFontFamilyFromHtml(selectedBubble.html);
      onUpdateBubble({
        fontFamily,
        ...(cleanedHtml !== undefined ? { html: cleanedHtml } : {}),
      });
      return;
    }
    onUpdateSideStyle(activeBatchSide, { fontFamily });
  };

  const handleResetSelectedToDefault = () => {
    if (!selectedBubble) return;
    const style =
      defaultSideStyles[selectedBubble.align] || defaultSideStyles.left;
    const cleanedHtml = stripInlineFontFamilyFromHtml(selectedBubble.html);
    onUpdateBubble({
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      color: style.color,
      bgColor: style.bgColor,
      isBold: style.isBold,
      isItalic: style.isItalic,
      isStrikethrough: style.isStrikethrough,
      isUnderline: style.isUnderline,
      textAlign: style.textAlign,
      borderRadius: style.borderRadius,
      cloudBorderRadius: style.cloudBorderRadius ?? 14,
      bubbleShape: style.bubbleShape || 'default',
      hasTail: style.hasTail ?? (selectedBubble.align !== 'center'),
      paddingY: style.paddingY,
      paddingX: style.paddingX,
      cloudPaddingY: style.cloudPaddingY ?? 8,
      cloudPaddingX: style.cloudPaddingX ?? 24,
      hasShadow: style.hasShadow,
      hasBottomShadow: Boolean(style.hasBottomShadow),
      bottomShadowColor: style.bottomShadowColor || '#b9a98e',
      hasBorder: style.hasBorder,
      borderColor: style.borderColor,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      textOffsetY: style.textOffsetY ?? 0,
      showMeta: style.showMeta ?? false,
      metaTheme: style.metaTheme || 'inside',
      metaFontFamily: style.metaFontFamily || DEFAULT_META_FONT_FAMILY,
      metaColor:
        style.metaColor ||
        (selectedBubble.align === 'right' ? '#cdaf77' : '#777674'),
      ...(cleanedHtml !== undefined ? { html: cleanedHtml } : {}),
      customStyleKeys: [],
    });
    const sideLabel =
      selectedBubble.align === 'left'
        ? '왼쪽'
        : selectedBubble.align === 'center'
        ? '중앙'
        : '오른쪽';
    showToast(`${sideLabel} 기본서식으로 초기화됨`);
  };

  const handleSaveSelectedAsDefault = () => {
    if (!selectedBubble) return;
    const side = selectedBubble.align;
    const patch: Partial<BubbleSideStyle> = {
      fontFamily: selectedBubble.fontFamily,
      fontSize: selectedBubble.fontSize,
      color: selectedBubble.color,
      bgColor: selectedBubble.bgColor,
      isBold: selectedBubble.isBold,
      isItalic: selectedBubble.isItalic,
      isStrikethrough: selectedBubble.isStrikethrough,
      isUnderline: selectedBubble.isUnderline,
      textAlign: selectedBubble.textAlign,
      borderRadius: selectedBubble.borderRadius,
      cloudBorderRadius: selectedBubble.cloudBorderRadius ?? 14,
      bubbleShape: selectedBubble.bubbleShape || 'default',
      hasTail:
        selectedBubble.hasTail !== undefined
          ? selectedBubble.hasTail
          : selectedBubble.align !== 'center',
      paddingY: selectedBubble.paddingY,
      paddingX: selectedBubble.paddingX,
      cloudPaddingY: selectedBubble.cloudPaddingY ?? 8,
      cloudPaddingX: selectedBubble.cloudPaddingX ?? 24,
      hasShadow: selectedBubble.hasShadow,
      hasBottomShadow: Boolean(selectedBubble.hasBottomShadow),
      bottomShadowColor: selectedBubble.bottomShadowColor || '#b9a98e',
      hasBorder: selectedBubble.hasBorder,
      borderColor: selectedBubble.borderColor,
      letterSpacing: selectedBubble.letterSpacing,
      lineHeight: selectedBubble.lineHeight,
      textOffsetY: selectedBubble.textOffsetY ?? 0,
      showMeta: selectedBubble.showMeta,
      speaker: selectedBubble.speaker,
      dateText: selectedBubble.dateText,
      metaTheme: selectedBubble.metaTheme,
      metaFontFamily: selectedBubble.metaFontFamily,
      metaColor: selectedBubble.metaColor,
    };
    onUpdateSideStyle(side, patch);
    onUpdateBubble({ customStyleKeys: [] });
    onSaveSideStyle(side);
    const sideLabel =
      side === 'left' ? '왼쪽' : side === 'center' ? '중앙' : '오른쪽';
    showToast(`${sideLabel} 기본서식으로 저장됨`);
  };

  const currentBatchStyle =
    defaultSideStyles[activeBatchSide] || defaultSideStyles.left;
  const savedBatchStyle =
    savedSideStyles[activeBatchSide] || savedSideStyles.left;
  const isBatchModified =
    JSON.stringify(currentBatchStyle) !== JSON.stringify(savedBatchStyle);

  // Shared Target Switcher Header inside Typography/Color/Meta popovers
  const renderTargetHeader = (_title?: string) => (
    <div className="flex items-center justify-between gap-1.5 border-b border-stone-200/80 px-2.5 py-2 bg-stone-50/90">
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Toggle between editing the selected bubble vs batch default side (moved to left) */}
        <div className="flex items-center rounded-lg bg-stone-200/75 p-0.5 text-[11px] shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditMode('single');
              if (!selectedBubble && bubbles.length > 0) {
                onSelectBubble(bubbles[0].id);
              }
            }}
            className={`rounded-md px-2 py-0.5 font-medium transition ${
              isEditingSingle
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600'
            }`}
          >
            개별 말풍선
          </button>
          <button
            type="button"
            onClick={() => setEditMode('batch')}
            className={`rounded-md px-2 py-0.5 font-medium transition ${
              !isEditingSingle
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600'
            }`}
          >
            일괄 기본서식
          </button>
        </div>

        {toastMsg && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 truncate">
            <Check className="h-3 w-3 shrink-0" />
            {toastMsg}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isEditingSingle && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!isBatchModified}
              onClick={() => {
                onSaveSideStyle(activeBatchSide);
                showToast('기본서식으로 저장됨');
              }}
              className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                isBatchModified
                  ? 'border-stone-900 bg-stone-900 text-white shadow-2xs active:bg-stone-800 cursor-pointer'
                  : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Save
                className={`h-3 w-3 shrink-0 ${
                  isBatchModified ? 'text-amber-300' : 'text-stone-400'
                }`}
              />
              <span>서식 저장</span>
            </button>
            <button
              type="button"
              disabled={!isBatchModified}
              onClick={() => {
                onRevertSideStyle(activeBatchSide);
                showToast('저장된 서식으로 복원됨');
              }}
              className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                isBatchModified
                  ? 'border-stone-300 bg-white text-stone-800 shadow-2xs active:bg-stone-100 cursor-pointer'
                  : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              <span>복원</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpenTool(null)}
          aria-label="설정창 닫기"
          className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/70 hover:text-stone-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // Side selector bar when in Batch mode
  const renderBatchSideSelector = () => (
    <div className="flex items-center justify-between gap-1.5 rounded-xl bg-stone-100 p-1 text-xs">
      {(['left', 'center', 'right'] as const).map((side) => {
        const label =
          side === 'left' ? '왼쪽' : side === 'center' ? '중앙' : '오른쪽';
        const count = bubbles.filter((b) => b.align === side).length;
        return (
          <button
            key={side}
            type="button"
            onClick={() => onActiveBatchSideChange(side)}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition ${
              activeBatchSide === side
                ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>{label}</span>
            <span className="text-[10px] opacity-75">({count})</span>
          </button>
        );
      })}
    </div>
  );

  const TOOLS: {
    id: Exclude<MobileToolId, null>;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'typography',
      label: '텍스트',
      icon: <Type className="h-4 w-4" />,
    },
    {
      id: 'color',
      label: '말풍선',
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: 'spacing',
      label: '정렬·위치',
      icon: <Move className="h-4 w-4" />,
    },
    {
      id: 'meta',
      label: '이름·시간',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: 'canvasBg',
      label: '배경지',
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      id: 'canvasLayout',
      label: '머릿말·규격',
      icon: <Layout className="h-4 w-4" />,
    },
  ];

  return (
    <div
      id="mobile-samsung-notes-dock"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col pointer-events-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating Dropdown Panel (Samsung Notes style popover above the bottom bar) */}
      {openTool && (
        <div className="pointer-events-auto mx-2 mb-1.5 overflow-hidden rounded-2xl border border-stone-200/95 bg-white/98 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
          {/* 1. TEXT POPOVER (초기화버튼 > 폰트 > 서식 > 글자크기 > 글자색상 > 글자간격) */}
          {openTool === 'typography' && (
            <div className="flex flex-col max-h-[42vh]">
              {renderTargetHeader('텍스트')}
              <div className="overflow-y-auto p-3.5 space-y-3">
                {/* 1) 초기화버튼 / 일괄 위치 선택 */}
                {!isEditingSingle ? (
                  renderBatchSideSelector()
                ) : selectedBubble ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50/80 p-2">
                    <button
                      type="button"
                      onClick={handleResetSelectedToDefault}
                      className="flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 shadow-2xs active:bg-stone-100 shrink-0"
                    >
                      <RotateCcw className="h-3 w-3 text-stone-600" />
                      <span>서식 초기화</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSelectedAsDefault}
                      className="flex-1 text-center text-[11px] text-stone-600 underline underline-offset-2 truncate px-1"
                    >
                      현재 스타일을{' '}
                      {selectedBubble.align === 'left'
                        ? '왼쪽'
                        : selectedBubble.align === 'center'
                        ? '중앙'
                        : '오른쪽'}{' '}
                      기본서식으로 저장
                    </button>
                  </div>
                ) : null}

                {/* 2) 폰트 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-600">
                      {isEditingSingle ? '폰트' : '기본 폰트'}
                    </span>
                    {!isEditingSingle && (
                      <button
                        type="button"
                        onClick={onOpenFontManager}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:underline"
                      >
                        <Sparkles className="h-3 w-3" />
                        폰트 관리 +
                      </button>
                    )}
                  </div>
                  <FontSelectDropdown
                    fonts={fonts}
                    value={activeStyle.fontFamily}
                    onChange={handleFontFamily}
                  />
                  <FontPasteMatcher
                    fonts={fonts}
                    currentFamily={activeStyle.fontFamily}
                    onApplyFont={(family) => handleFontFamily(family)}
                    onOpenFontManager={onOpenFontManager}
                  />
                </div>

                {/* 3) 서식 (굵게/기울임/밑줄/취소선 + 정렬) */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <span className="block text-[11px] font-semibold text-stone-600">
                    서식
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="grid grid-cols-4 gap-1 flex-1">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormatCommand('bold')}
                        className={`flex h-8 items-center justify-center rounded-lg border transition ${
                          activeStyle.isBold
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormatCommand('italic')}
                        className={`flex h-8 items-center justify-center rounded-lg border transition ${
                          activeStyle.isItalic
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormatCommand('underline')}
                        className={`flex h-8 items-center justify-center rounded-lg border transition ${
                          activeStyle.isUnderline
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <Underline className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormatCommand('strikeThrough')}
                        className={`flex h-8 items-center justify-center rounded-lg border transition ${
                          activeStyle.isStrikethrough
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <Strikethrough className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1 w-28">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => handleStyleChange({ textAlign: align })}
                          className={`flex h-8 items-center justify-center rounded-lg border transition ${
                            activeStyle.textAlign === align
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                          {align === 'center' && (
                            <AlignCenter className="h-3.5 w-3.5" />
                          )}
                          {align === 'right' && (
                            <AlignRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4) 글자 크기 */}
                <div className="pt-2 border-t border-stone-100">
                  {renderCollapsibleSlider({
                    sliderKey: 'typo-fontSize',
                    label: '글자 크기',
                    displayValue: `${activeStyle.fontSize}px`,
                    value: activeStyle.fontSize,
                    min: 12,
                    max: 44,
                    step: 1,
                    onChange: (fontSize) => handleStyleChange({ fontSize }),
                  })}
                </div>

                {/* 5) 글자 색상 */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-600">
                      글자 색상
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {activeStyle.color}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PALETTE.text.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleTextColor(c.value)}
                        title={c.label}
                        style={{ backgroundColor: c.value }}
                        className={`h-7 w-7 rounded-full border border-stone-300 transition-transform ${
                          activeStyle.color.toLowerCase() ===
                          c.value.toLowerCase()
                            ? 'scale-110 ring-2 ring-stone-900 ring-offset-1'
                            : ''
                        }`}
                      />
                    ))}
                    <label className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-stone-700 cursor-pointer">
                      <input
                        type="color"
                        value={activeStyle.color}
                        onChange={(e) => handleTextColor(e.target.value)}
                        className="h-4 w-4 border-0 bg-transparent p-0"
                      />
                      <span>직접 선택</span>
                    </label>
                  </div>
                </div>

                {/* 6) 글자 간격 (자간, 행간, 텍스트 상하 위치) - 기본 접어두기 */}
                <div className="border-y border-stone-200 py-2.5">
                  <button
                    type="button"
                    onClick={() => setIsTextSpacingOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left cursor-pointer"
                  >
                    <span className="text-[11px] font-semibold text-stone-700">
                      글자 간격
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${
                        isTextSpacingOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isTextSpacingOpen && (
                    <div className="grid grid-cols-2 gap-2 pt-2.5">
                      {renderCollapsibleSlider({
                        sliderKey: 'typo-letterSpacing',
                        label: '자간',
                        displayValue: `${activeStyle.letterSpacing ?? 0}px`,
                        value: activeStyle.letterSpacing ?? 0,
                        min: -3,
                        max: 10,
                        step: 0.5,
                        onChange: (letterSpacing) =>
                          handleStyleChange({ letterSpacing }),
                      })}

                      {renderCollapsibleSlider({
                        sliderKey: 'typo-lineHeight',
                        label: '행간',
                        displayValue: (activeStyle.lineHeight ?? 1.5).toFixed(2),
                        value: activeStyle.lineHeight ?? 1.5,
                        min: 1.1,
                        max: 2.2,
                        step: 0.05,
                        onChange: (lineHeight) =>
                          handleStyleChange({ lineHeight }),
                      })}

                      <div className="col-span-2">
                        {renderCollapsibleSlider({
                          sliderKey: 'typo-textOffsetY',
                          label: '텍스트 상하 위치',
                          displayValue:
                            (activeStyle.textOffsetY ?? 0) > 0
                              ? `+${activeStyle.textOffsetY}px`
                              : `${activeStyle.textOffsetY ?? 0}px`,
                          value: activeStyle.textOffsetY ?? 0,
                          min: -12,
                          max: 12,
                          step: 0.5,
                          onChange: (textOffsetY) =>
                            handleStyleChange({ textOffsetY }),
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. BUBBLE POPOVER (일반/구름말풍선 > 말풍선배경색 > 말풍선크기 > 스타일) */}
          {openTool === 'color' && (
            <div className="flex flex-col max-h-[42vh]">
              {renderTargetHeader('말풍선')}
              <div className="overflow-y-auto p-3.5 space-y-3.5">
                {!isEditingSingle && renderBatchSideSelector()}

                {/* 1) 일반 / 구름 말풍선 선택 버튼 */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStyleChange({ bubbleShape: 'default' })}
                    className={`rounded-lg border py-2 text-xs font-semibold transition ${
                      (activeStyle.bubbleShape || 'default') === 'default'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    일반 말풍선
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStyleChange({ bubbleShape: 'cloud' })}
                    className={`rounded-lg border py-2 text-xs font-semibold transition ${
                      activeStyle.bubbleShape === 'cloud'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    구름 말풍선
                  </button>
                </div>

                {/* 2) 말풍선 배경색 */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-600">
                      말풍선 배경색
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {COLOR_PALETTE.bubbleBg.find(
                        (b) =>
                          b.value.toLowerCase() ===
                          activeStyle.bgColor.toLowerCase()
                      )?.label || activeStyle.bgColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PALETTE.bubbleBg.map((c) => {
                      const isTransparent = c.value === 'transparent';
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => handleStyleChange({ bgColor: c.value })}
                          title={c.label}
                          style={{
                            backgroundColor: isTransparent
                              ? '#ffffff'
                              : c.value,
                            backgroundImage: isTransparent
                              ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)'
                              : undefined,
                            backgroundSize: isTransparent
                              ? '8px 8px'
                              : undefined,
                            backgroundPosition: isTransparent
                              ? '0 0, 0 4px, 4px -4px, -4px 0'
                              : undefined,
                          }}
                          className={`relative h-7 w-7 rounded-full border border-stone-300 transition-transform ${
                            activeStyle.bgColor.toLowerCase() ===
                            c.value.toLowerCase()
                              ? 'scale-110 ring-2 ring-stone-900 ring-offset-1'
                              : ''
                          }`}
                        />
                      );
                    })}
                    <label className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-stone-700 cursor-pointer">
                      <input
                        type="color"
                        value={
                          activeStyle.bgColor === 'transparent'
                            ? '#FBF8F1'
                            : activeStyle.bgColor
                        }
                        onChange={(e) =>
                          handleStyleChange({ bgColor: e.target.value })
                        }
                        className="h-4 w-4 border-0 bg-transparent p-0"
                      />
                      <span>직접 선택</span>
                    </label>
                  </div>
                </div>

                {/* 3) 말풍선 크기 (모서리 둥글기, 상하/좌우 여백) - 기본 접어두기 */}
                <div className="border-y border-stone-200 py-2.5">
                  <button
                    type="button"
                    onClick={() => setIsBubbleSizeOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left cursor-pointer"
                  >
                    <span className="text-[11px] font-semibold text-stone-700">
                      말풍선 크기
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${
                        isBubbleSizeOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isBubbleSizeOpen && (
                    <div className="grid grid-cols-2 gap-2 pt-2.5">
                      {renderCollapsibleSlider({
                        sliderKey: 'bubble-borderRadius',
                        label:
                          activeStyle.bubbleShape === 'cloud'
                            ? '모서리 둥글기 (구름)'
                            : '모서리 둥글기 (일반)',
                        displayValue: `${
                          activeStyle.bubbleShape === 'cloud'
                            ? (activeStyle.cloudBorderRadius ?? 14)
                            : activeStyle.borderRadius
                        }px`,
                        value:
                          activeStyle.bubbleShape === 'cloud'
                            ? (activeStyle.cloudBorderRadius ?? 14)
                            : activeStyle.borderRadius,
                        min: 0,
                        max: 36,
                        step: 1,
                        onChange: (val) =>
                          handleStyleChange(
                            activeStyle.bubbleShape === 'cloud'
                              ? { cloudBorderRadius: val }
                              : { borderRadius: val }
                          ),
                      })}

                      {renderCollapsibleSlider({
                        sliderKey: 'bubble-paddingY',
                        label:
                          activeStyle.bubbleShape === 'cloud'
                            ? '상하 여백 (구름)'
                            : '상하 여백 (일반)',
                        displayValue: `${
                          activeStyle.bubbleShape === 'cloud'
                            ? (activeStyle.cloudPaddingY ?? 8)
                            : activeStyle.paddingY
                        }px`,
                        value:
                          activeStyle.bubbleShape === 'cloud'
                            ? (activeStyle.cloudPaddingY ?? 8)
                            : activeStyle.paddingY,
                        min: 4,
                        max: 36,
                        step: 1,
                        onChange: (val) =>
                          handleStyleChange(
                            activeStyle.bubbleShape === 'cloud'
                              ? { cloudPaddingY: val }
                              : { paddingY: val }
                          ),
                      })}

                      <div className="col-span-2">
                        {renderCollapsibleSlider({
                          sliderKey: 'bubble-paddingX',
                          label:
                            activeStyle.bubbleShape === 'cloud'
                              ? '좌우 여백 (구름)'
                              : '좌우 여백 (일반)',
                          displayValue: `${
                            activeStyle.bubbleShape === 'cloud'
                              ? (activeStyle.cloudPaddingX ?? 24)
                              : activeStyle.paddingX
                          }px`,
                          value:
                            activeStyle.bubbleShape === 'cloud'
                              ? (activeStyle.cloudPaddingX ?? 24)
                              : activeStyle.paddingX,
                          min: 10,
                          max: 48,
                          step: 1,
                          onChange: (val) =>
                            handleStyleChange(
                              activeStyle.bubbleShape === 'cloud'
                                ? { cloudPaddingX: val }
                                : { paddingX: val }
                            ),
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4) 스타일 (말풍선 꼬리, 테두리선, 그림자) - 버튼식 */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-stone-600">
                    스타일
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(() => {
                      const hasTailActive =
                        activeStyle.hasTail ??
                        (isEditingSingle && selectedBubble
                          ? selectedBubble.align !== 'center'
                          : activeBatchSide !== 'center');
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            handleStyleChange({ hasTail: !hasTailActive })
                          }
                          className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                            hasTailActive
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-600'
                          }`}
                        >
                          말풍선 꼬리 {hasTailActive ? '켜짐' : '꺼짐'}
                        </button>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() =>
                        handleStyleChange({ hasBorder: !activeStyle.hasBorder })
                      }
                      className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                        activeStyle.hasBorder
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      외곽선 {activeStyle.hasBorder ? '켜짐' : '꺼짐'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleStyleChange({ hasShadow: !activeStyle.hasShadow })
                      }
                      className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                        activeStyle.hasShadow
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      입체그림자 {activeStyle.hasShadow ? '켜짐' : '꺼짐'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleStyleChange({
                          hasBottomShadow: !activeStyle.hasBottomShadow,
                        })
                      }
                      className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                        activeStyle.hasBottomShadow
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      하단그림자 {activeStyle.hasBottomShadow ? '켜짐' : '꺼짐'}
                    </button>
                  </div>

                  {(activeStyle.hasBorder || activeStyle.hasBottomShadow) && (
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      {activeStyle.hasBorder && (
                        <label className="flex items-center gap-1.5 text-[11px] text-stone-600">
                          <span>외곽선 색</span>
                          <input
                            type="color"
                            value={activeStyle.borderColor || '#E5DED3'}
                            onChange={(e) =>
                              handleStyleChange({ borderColor: e.target.value })
                            }
                            className="h-5 w-7 cursor-pointer rounded border border-stone-200 p-0.5"
                          />
                        </label>
                      )}
                      {activeStyle.hasBottomShadow && (
                        <label className="flex items-center gap-1.5 text-[11px] text-stone-600">
                          <span>하단그림자 색</span>
                          <input
                            type="color"
                            value={activeStyle.bottomShadowColor || '#b9a98e'}
                            onChange={(e) =>
                              handleStyleChange({
                                bottomShadowColor: e.target.value,
                              })
                            }
                            className="h-5 w-7 cursor-pointer rounded border border-stone-200 p-0.5"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. SPACING & ALIGNMENT POPOVER (말풍선 정렬 & 위치 이동) */}
          {openTool === 'spacing' && (
            <div className="flex flex-col max-h-[42vh]">
              <div className="flex items-center justify-between border-b border-stone-200/80 px-3.5 py-2 bg-stone-50/90">
                <span className="text-xs font-bold text-stone-800">
                  말풍선 정렬 & 위치 이동
                </span>
                <button
                  type="button"
                  onClick={() => setOpenTool(null)}
                  aria-label="설정창 닫기"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/70 hover:text-stone-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="overflow-y-auto p-3.5 space-y-3">
                {selectedBubble ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {onMoveBubbleOrder && (
                        <>
                          <button
                            type="button"
                            onClick={() => onMoveBubbleOrder('up')}
                            title="위로 이동"
                            className="flex items-center gap-0.5 rounded border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700 active:bg-stone-100"
                          >
                            <ArrowUp className="h-3 w-3" />
                            위
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveBubbleOrder('down')}
                            title="아래로 이동"
                            className="flex items-center gap-0.5 rounded border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700 active:bg-stone-100"
                          >
                            <ArrowDown className="h-3 w-3" />
                            아래
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={onDuplicateBubble}
                        title="말풍선 복제"
                        className="flex items-center gap-0.5 rounded border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700 active:bg-stone-100"
                      >
                        <Copy className="h-3 w-3" />
                        복제
                      </button>
                      <button
                        type="button"
                        onClick={onDeleteBubble}
                        title="말풍선 삭제"
                        className="flex items-center gap-0.5 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 active:bg-rose-100"
                      >
                        <Trash2 className="h-3 w-3" />
                        삭제
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateBubble({ align: 'left', x: 6 })}
                        className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium ${
                          selectedBubble.align === 'left'
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <AlignLeft className="h-3.5 w-3.5" />
                        좌측
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateBubble({ align: 'center', x: 25 })
                        }
                        className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium ${
                          selectedBubble.align === 'center'
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <AlignCenter className="h-3.5 w-3.5" />
                        중앙
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateBubble({ align: 'right', x: 45 })
                        }
                        className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium ${
                          selectedBubble.align === 'right'
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <AlignRight className="h-3.5 w-3.5" />
                        우측
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="py-3 text-center text-xs text-stone-500">
                    위치를 이동할 말풍선을 먼저 선택해 주세요.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 4. SPEAKER NAME & TIME POPOVER */}
          {openTool === 'meta' && (
            <div className="flex flex-col max-h-[42vh]">
              {renderTargetHeader('이름/시간 표시')}
              <div className="overflow-y-auto p-3.5 space-y-3">
                {!isEditingSingle && renderBatchSideSelector()}

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-stone-700">
                      이름/시간 표시
                    </label>
                    <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => handleStyleChange({ showMeta: true })}
                        className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                          Boolean(
                            activeStyle.showMeta ??
                              Boolean(activeStyle.speaker || activeStyle.dateText)
                          )
                            ? 'bg-stone-900 text-white'
                            : 'text-stone-600'
                        }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStyleChange({ showMeta: false })}
                        className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                          !Boolean(
                            activeStyle.showMeta ??
                              Boolean(activeStyle.speaker || activeStyle.dateText)
                          )
                            ? 'bg-stone-900 text-white'
                            : 'text-stone-600'
                        }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>

                  {Boolean(
                    activeStyle.showMeta ??
                      Boolean(activeStyle.speaker || activeStyle.dateText)
                  ) && (
                    <div className="space-y-2.5 pt-2 border-t border-stone-100">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleStyleChange({
                              showMeta: true,
                              metaTheme: 'outside',
                            })
                          }
                          className={`rounded-lg border px-2 py-1.5 text-center text-xs font-semibold ${
                            (activeStyle.metaTheme || 'inside') === 'outside'
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          메신저
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleStyleChange({
                              showMeta: true,
                              metaTheme: 'inside',
                            })
                          }
                          className={`rounded-lg border px-2 py-1.5 text-center text-xs font-semibold ${
                            (activeStyle.metaTheme || 'inside') === 'inside'
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          이체통
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                            이름
                          </label>
                          <input
                            type="text"
                            value={activeStyle.speaker || ''}
                            onChange={(e) =>
                              handleStyleChange({
                                showMeta: true,
                                speaker: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                            시간
                          </label>
                          <input
                            type="text"
                            value={activeStyle.dateText || ''}
                            onChange={(e) =>
                              handleStyleChange({
                                showMeta: true,
                                dateText: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium text-stone-600">
                          폰트
                        </label>
                        <FontSelectDropdown
                          fonts={getMetaOrderedFonts(fonts)}
                          value={
                            activeStyle.metaFontFamily ||
                            DEFAULT_META_FONT_FAMILY
                          }
                          onChange={(metaFontFamily) =>
                            handleStyleChange({ metaFontFamily })
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium text-stone-600">
                          색상
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeStyle.metaColor || '#777674'}
                            onChange={(e) =>
                              handleStyleChange({ metaColor: e.target.value })
                            }
                            className="h-7 w-7 shrink-0 cursor-pointer rounded border border-stone-200 bg-white p-0.5"
                            title="색상"
                          />
                          <div className="flex flex-1 flex-wrap gap-1">
                            {COLOR_PALETTE.metaText.map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() =>
                                  handleStyleChange({ metaColor: c.value })
                                }
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                                className={`h-5 w-5 rounded-full border border-stone-300 transition-transform ${
                                  (
                                    activeStyle.metaColor || '#777674'
                                  ).toLowerCase() === c.value.toLowerCase()
                                    ? 'scale-110 ring-2 ring-stone-900'
                                    : ''
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
            </div>
          )}

          {/* 5. CANVAS BACKGROUND & TEXTURE POPOVER (종이 질감 효과 밑에 상/하단 구분선 추가) */}
          {openTool === 'canvasBg' && (
            <div className="flex flex-col max-h-[42vh]">
              <div className="flex items-center justify-between border-b border-stone-200/80 px-3.5 py-2 bg-stone-50/90">
                <span className="text-xs font-bold text-stone-800">
                  배경지
                </span>
                <button
                  type="button"
                  onClick={() => setOpenTool(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-y-auto p-3.5 space-y-3.5">
                {/* Card Theme Presets (at very top of Canvas Bg popover) */}
                {onApplyTheme && (
                  <div className="space-y-1.5 rounded-xl border border-stone-200 bg-stone-50/70 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-800">
                        카드 테마
                      </span>
                      <span className="text-[10px] text-stone-500">
                        클릭 시 서식 일괄 변경
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onApplyTheme('legacy')}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-semibold transition ${
                          canvasConfig.bgColor.toLowerCase() === '#faf9f8' &&
                          canvasConfig.paperTexture === 'paper' &&
                          !defaultSideStyles.left.hasBottomShadow
                            ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-800 active:bg-stone-100'
                        }`}
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-stone-300"
                          style={{ backgroundColor: '#faf9f8' }}
                        />
                        <span className="truncate">구버전</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyTheme('default-white')}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-semibold transition ${
                          canvasConfig.bgColor.toLowerCase() === '#faf9f8' &&
                          canvasConfig.paperTexture === 'none' &&
                          Boolean(defaultSideStyles.left.hasBottomShadow)
                            ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-800 active:bg-stone-100'
                        }`}
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-[#6b5843]"
                          style={{
                            backgroundColor: '#faf9f8',
                            boxShadow: '0 2px 0 0 #b9a98e',
                          }}
                        />
                        <span className="truncate">기본 화이트</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyTheme('default-dark')}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-semibold transition ${
                          canvasConfig.bgColor.toLowerCase() === '#1b150c'
                            ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-800 active:bg-stone-100'
                        }`}
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-stone-700"
                          style={{ backgroundColor: '#1b150c' }}
                        />
                        <span className="truncate">기본 다크</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3x2 Card Bg Grid + Custom Color */}
                <div className="grid grid-cols-3 gap-1.5">
                  {COLOR_PALETTE.canvasBg.map((bg) => (
                    <button
                      key={bg.value}
                      type="button"
                      onClick={() =>
                        onUpdateCanvasConfig({
                          bgColor: bg.value,
                          bgImageUrl: '',
                        })
                      }
                      className={`flex items-center gap-1.5 rounded-lg border p-2 text-left text-xs transition ${
                        !canvasConfig.bgImageUrl &&
                        canvasConfig.bgColor.toLowerCase() ===
                          bg.value.toLowerCase()
                          ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded border border-stone-300"
                        style={{ backgroundColor: bg.value }}
                      />
                      <span className="truncate text-[11px] text-stone-700">
                        {bg.label}
                      </span>
                    </button>
                  ))}

                  <label
                    className={`flex items-center gap-1.5 rounded-lg border p-2 text-left text-xs cursor-pointer ${
                      !canvasConfig.bgImageUrl &&
                      !COLOR_PALETTE.canvasBg.some(
                        (b) =>
                          b.value.toLowerCase() ===
                          canvasConfig.bgColor.toLowerCase()
                      )
                        ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <input
                      type="color"
                      value={
                        canvasConfig.bgColor.startsWith('#') &&
                        canvasConfig.bgColor.length === 7
                          ? canvasConfig.bgColor
                          : '#F7F7F6'
                      }
                      onChange={(e) =>
                        onUpdateCanvasConfig({
                          bgColor: e.target.value,
                          bgImageUrl: '',
                        })
                      }
                      className="h-4 w-4 shrink-0 rounded border border-stone-300 bg-transparent p-0"
                    />
                    <span className="truncate text-[11px] text-stone-700">
                      색 지정
                    </span>
                  </label>
                </div>

                {/* Device Image Picker */}
                <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs cursor-pointer">
                  <ImageIcon className="h-4 w-4 shrink-0 text-amber-700" />
                  <span className="text-[11px] font-medium text-stone-700">
                    이미지 선택
                  </span>
                  <span className="ml-auto text-[10px] text-stone-400">
                    {canvasConfig.bgImageUrl ? '적용됨' : '기기에서 불러오기'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          onUpdateCanvasConfig({
                            bgImageUrl: reader.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>

                {canvasConfig.bgImageUrl && (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-700">
                        배경 이미지 설정
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateCanvasConfig({ bgImageUrl: '' })}
                        className="text-[10px] text-rose-600 font-medium"
                      >
                        이미지 제거
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      {[
                        { id: 'cover', label: '꽉 채우기' },
                        { id: 'contain', label: '원본 비율' },
                        { id: 'repeat', label: '바둑판 반복' },
                      ].map((fit) => (
                        <button
                          key={fit.id}
                          type="button"
                          onClick={() =>
                            onUpdateCanvasConfig({
                              bgImageFit: fit.id as CanvasConfig['bgImageFit'],
                            })
                          }
                          className={`rounded py-1 border ${
                            (canvasConfig.bgImageFit || 'cover') === fit.id
                              ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                              : 'bg-white text-stone-700 border-stone-200'
                          }`}
                        >
                          {fit.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paper Texture */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <span className="text-[11px] font-semibold text-stone-600 block">
                    종이 질감 효과
                  </span>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { id: 'paper', label: '한지' },
                      { id: 'grain', label: '입자' },
                      { id: 'crumpled', label: '구김' },
                      { id: 'grid', label: '모눈' },
                      { id: 'none', label: '없음' },
                    ].map((tex) => (
                      <button
                        key={tex.id}
                        type="button"
                        onClick={() =>
                          onUpdateCanvasConfig({
                            paperTexture: tex.id as CanvasConfig['paperTexture'],
                          })
                        }
                        className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                          canvasConfig.paperTexture === tex.id
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        {tex.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top/Bottom Dividers (종이질감효과 밑에 상하단 구분선 추가) */}
                <div className="border-y border-stone-200 py-2.5 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-stone-700">
                      상/하단 구분선
                    </span>
                    <input
                      type="checkbox"
                      checked={canvasConfig.showDividers}
                      onChange={(e) =>
                        onUpdateCanvasConfig({ showDividers: e.target.checked })
                      }
                      className="h-4 w-4 accent-stone-900 rounded"
                    />
                  </label>

                  {canvasConfig.showDividers && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                      <div className="flex gap-1">
                        {(['solid', 'dashed', 'double'] as const).map(
                          (style) => (
                            <button
                              key={style}
                              type="button"
                              onClick={() =>
                                onUpdateCanvasConfig({ dividerStyle: style })
                              }
                              className={`rounded px-2 py-1 text-[11px] capitalize ${
                                canvasConfig.dividerStyle === style
                                  ? 'bg-stone-900 text-white font-semibold'
                                  : 'bg-white border border-stone-200 text-stone-600'
                              }`}
                            >
                              {style}
                            </button>
                          )
                        )}
                      </div>

                      <label className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1 cursor-pointer">
                        <input
                          type="color"
                          value={
                            canvasConfig.dividerColor &&
                            canvasConfig.dividerColor.startsWith('#') &&
                            canvasConfig.dividerColor.length === 7
                              ? canvasConfig.dividerColor
                              : '#D1CAC0'
                          }
                          onChange={(e) =>
                            onUpdateCanvasConfig({
                              dividerColor: e.target.value,
                            })
                          }
                          className="h-4 w-4 rounded border border-stone-300 bg-transparent p-0"
                        />
                        <span className="text-[11px] text-stone-600">
                          선 색 지정
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. CANVAS LAYOUT & HEADER/FOOTER POPOVER */}
          {openTool === 'canvasLayout' && (
            <div className="flex flex-col max-h-[42vh]">
              <div className="flex items-center justify-between border-b border-stone-200/80 px-3.5 py-2 bg-stone-50/90">
                <span className="text-xs font-bold text-stone-800">
                  머릿말 · 꼬리말 · 카드 크기 조절
                </span>
                <button
                  type="button"
                  onClick={() => setOpenTool(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-y-auto p-3.5 space-y-3">
                {/* 머릿말 & 꼬리말 */}
                <div className="divide-y divide-stone-200 border-y border-stone-200">
                  <div className="space-y-2 py-2.5">
                    <label className="flex items-center justify-between text-xs font-semibold text-stone-700 cursor-pointer">
                      <span>머릿말</span>
                      <input
                        type="checkbox"
                        checked={canvasConfig.showHeader}
                        onChange={(e) =>
                          onUpdateCanvasConfig({ showHeader: e.target.checked })
                        }
                        className="h-3.5 w-3.5 accent-stone-900 rounded"
                      />
                    </label>
                    {canvasConfig.showHeader && (
                      <div className="space-y-2 pt-1.5 border-t border-stone-100">
                        <input
                          type="text"
                          value={canvasConfig.headerText}
                          onChange={(e) =>
                            onUpdateCanvasConfig({ headerText: e.target.value })
                          }
                          placeholder="머릿말 문구 입력"
                          className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs"
                        />
                        <FontSelectDropdown
                          fonts={fonts}
                          value={
                            canvasConfig.headerFontFamily ||
                            "'Noto Serif KR', serif"
                          }
                          onChange={(headerFontFamily) =>
                            onUpdateCanvasConfig({ headerFontFamily })
                          }
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700">
                            <span>색상</span>
                            <input
                              type="color"
                              value={
                                canvasConfig.headerColor &&
                                canvasConfig.headerColor.startsWith('#') &&
                                canvasConfig.headerColor.length === 7
                                  ? canvasConfig.headerColor
                                  : '#78716c'
                              }
                              onChange={(e) =>
                                onUpdateCanvasConfig({
                                  headerColor: e.target.value,
                                })
                              }
                              className="h-4 w-4 cursor-pointer rounded border border-stone-300 bg-transparent p-0"
                            />
                          </label>
                          <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
                            {(['left', 'center', 'right'] as const).map(
                              (align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() =>
                                    onUpdateCanvasConfig({ headerAlign: align })
                                  }
                                  className={`flex h-6 w-7 items-center justify-center rounded-md ${
                                    (canvasConfig.headerAlign || 'center') ===
                                    align
                                      ? 'bg-stone-900 text-white'
                                      : 'text-stone-600'
                                  }`}
                                >
                                  {align === 'left' && (
                                    <AlignLeft className="h-3.5 w-3.5" />
                                  )}
                                  {align === 'center' && (
                                    <AlignCenter className="h-3.5 w-3.5" />
                                  )}
                                  {align === 'right' && (
                                    <AlignRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 py-2.5">
                    <label className="flex items-center justify-between text-xs font-semibold text-stone-700 cursor-pointer">
                      <span>꼬리말</span>
                      <input
                        type="checkbox"
                        checked={canvasConfig.showFooter}
                        onChange={(e) =>
                          onUpdateCanvasConfig({ showFooter: e.target.checked })
                        }
                        className="h-3.5 w-3.5 accent-stone-900 rounded"
                      />
                    </label>
                    {canvasConfig.showFooter && (
                      <div className="space-y-2 pt-1.5 border-t border-stone-100">
                        <input
                          type="text"
                          value={canvasConfig.footerText}
                          onChange={(e) =>
                            onUpdateCanvasConfig({ footerText: e.target.value })
                          }
                          placeholder="꼬리말 문구 입력"
                          className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs"
                        />
                        <FontSelectDropdown
                          fonts={fonts}
                          value={
                            canvasConfig.footerFontFamily ||
                            "'Noto Serif KR', serif"
                          }
                          onChange={(footerFontFamily) =>
                            onUpdateCanvasConfig({ footerFontFamily })
                          }
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700">
                            <span>색상</span>
                            <input
                              type="color"
                              value={
                                canvasConfig.footerColor &&
                                canvasConfig.footerColor.startsWith('#') &&
                                canvasConfig.footerColor.length === 7
                                  ? canvasConfig.footerColor
                                  : '#78716c'
                              }
                              onChange={(e) =>
                                onUpdateCanvasConfig({
                                  footerColor: e.target.value,
                                })
                              }
                              className="h-4 w-4 cursor-pointer rounded border border-stone-300 bg-transparent p-0"
                            />
                          </label>
                          <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
                            {(['left', 'center', 'right'] as const).map(
                              (align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() =>
                                    onUpdateCanvasConfig({ footerAlign: align })
                                  }
                                  className={`flex h-6 w-7 items-center justify-center rounded-md ${
                                    (canvasConfig.footerAlign || 'center') ===
                                    align
                                      ? 'bg-stone-900 text-white'
                                      : 'text-stone-600'
                                  }`}
                                >
                                  {align === 'left' && (
                                    <AlignLeft className="h-3.5 w-3.5" />
                                  )}
                                  {align === 'center' && (
                                    <AlignCenter className="h-3.5 w-3.5" />
                                  )}
                                  {align === 'right' && (
                                    <AlignRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 카드 크기 조절 (대화 너비, 카드 크기 조절, 말풍선 간격 묶어서 접기) */}
                <div className="border-b border-stone-200 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCardSizeGroupOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left cursor-pointer py-1"
                  >
                    <span className="text-xs font-semibold text-stone-700">
                      카드 크기 조절
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${
                        isCardSizeGroupOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isCardSizeGroupOpen && (
                    <div className="space-y-2.5 pt-2.5">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateCanvasConfig({ width: 640 })}
                          className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                            canvasConfig.width === 640
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          기본 (640px)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateCanvasConfig({ width: 760 })}
                          className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                            canvasConfig.width === 760
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          넓게 (760px)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateCanvasConfig({ width: 880 })}
                          className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${
                            canvasConfig.width === 880
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          와이드 (880px)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {renderCollapsibleSlider({
                          sliderKey: 'canvas-dividerWidth',
                          label: '대화 너비',
                          displayValue: `${canvasConfig.dividerWidth}%`,
                          value: canvasConfig.dividerWidth,
                          min: 60,
                          max: 96,
                          step: 1,
                          onChange: (dividerWidth) =>
                            onUpdateCanvasConfig({ dividerWidth }),
                        })}

                        {renderCollapsibleSlider({
                          sliderKey: 'canvas-width',
                          label: '카드 크기 조절',
                          displayValue: `${canvasConfig.width}px`,
                          value: canvasConfig.width,
                          min: 480,
                          max: 1080,
                          step: 10,
                          onChange: (width) => onUpdateCanvasConfig({ width }),
                        })}

                        <div className="col-span-2">
                          {renderCollapsibleSlider({
                            sliderKey: 'canvas-bubbleSpacing',
                            label: '말풍선 간격',
                            displayValue: `${canvasConfig.bubbleSpacing}px`,
                            value: canvasConfig.bubbleSpacing,
                            min: 8,
                            max: 56,
                            step: 1,
                            onChange: (bubbleSpacing) =>
                              onUpdateCanvasConfig({ bubbleSpacing }),
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Samsung Notes-style Horizontal Bottom Icon Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-1 border-t border-stone-200/90 bg-white/98 px-2 py-1.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1">
          {TOOLS.map((tool) => {
            const isActive = openTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => toggleTool(tool.id)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1.5 min-w-[54px] shrink-0 transition ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 active:bg-stone-200/70'
                }`}
              >
                <div className="flex items-center justify-center">
                  {tool.icon}
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap leading-tight">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
