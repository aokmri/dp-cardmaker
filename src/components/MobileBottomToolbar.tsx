import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Palette,
  Maximize2,
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
  Plus,
  Sparkles,
  Check,
  X,
  ArrowUp,
  ArrowDown,
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
import { applyTextareaClipboardPaste } from '../utils/pasteFormatter';

export type MobileToolId =
  | 'batch'
  | 'typography'
  | 'color'
  | 'spacing'
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 1800);
  };

  const toggleTool = (tool: Exclude<MobileToolId, null>) => {
    setOpenTool((prev) => (prev === tool ? null : tool));
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
        paddingY: selectedBubble.paddingY,
        paddingX: selectedBubble.paddingX,
        hasShadow: selectedBubble.hasShadow,
        hasBorder: selectedBubble.hasBorder,
        borderColor: selectedBubble.borderColor || '#E5DED3',
        letterSpacing: selectedBubble.letterSpacing ?? 0,
        lineHeight: selectedBubble.lineHeight ?? 1.5,
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
      paddingY: style.paddingY,
      paddingX: style.paddingX,
      hasShadow: style.hasShadow,
      hasBorder: style.hasBorder,
      borderColor: style.borderColor,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
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
    onUpdateSideStyle(side, {
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
      paddingY: selectedBubble.paddingY,
      paddingX: selectedBubble.paddingX,
      hasShadow: selectedBubble.hasShadow,
      hasBorder: selectedBubble.hasBorder,
      borderColor: selectedBubble.borderColor,
      letterSpacing: selectedBubble.letterSpacing,
      lineHeight: selectedBubble.lineHeight,
    });
    onUpdateBubble({ customStyleKeys: [] });
    onSaveSideStyle(side);
    const sideLabel =
      side === 'left' ? '왼쪽' : side === 'center' ? '중앙' : '오른쪽';
    showToast(`${sideLabel} 기본서식으로 저장됨`);
  };

  // Shared Target Switcher Header inside Typography/Color/Spacing popovers
  const renderTargetHeader = (title: string) => (
    <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 px-3.5 py-2 bg-stone-50/90">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-bold text-stone-800 whitespace-nowrap">
          {title}
        </span>
        {toastMsg && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 truncate">
            <Check className="h-3 w-3 shrink-0" />
            {toastMsg}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Toggle between editing the selected bubble vs batch default side */}
        <div className="flex items-center rounded-lg bg-stone-200/75 p-0.5 text-[11px]">
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
      label: '폰트·텍스트',
      icon: <Type className="h-4 w-4" />,
    },
    {
      id: 'color',
      label: '색상·배경',
      icon: <Palette className="h-4 w-4" />,
    },
    {
      id: 'spacing',
      label: '배치·여백',
      icon: <Maximize2 className="h-4 w-4" />,
    },
    {
      id: 'batch',
      label: '일괄서식',
      icon: <Sliders className="h-4 w-4" />,
    },
    {
      id: 'canvasBg',
      label: '배경지·질감',
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      id: 'canvasLayout',
      label: '구분선·규격',
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
          {/* 1. TYPOGRAPHY & TEXT CONTENT POPOVER */}
          {openTool === 'typography' && (
            <div className="flex flex-col max-h-[42vh]">
              {renderTargetHeader('폰트 · 텍스트 설정')}
              <div className="overflow-y-auto p-3.5 space-y-3">
                {!isEditingSingle ? (
                  renderBatchSideSelector()
                ) : selectedBubble ? (
                  /* Quick Reset & Save as Default row at the very top of Single mode */
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

                {/* Font Selector */}
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

                {/* Font Size + Style Toggles + Alignment */}
                <div className="space-y-2 pt-1 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 font-medium">글자 크기</span>
                    <span className="font-mono font-semibold text-stone-800">
                      {activeStyle.fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="44"
                    value={activeStyle.fontSize}
                    onChange={(e) =>
                      handleStyleChange({ fontSize: Number(e.target.value) })
                    }
                    className="w-full accent-stone-900"
                  />

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

                {/* Direct Text & Speaker Input when editing a single bubble */}
                {isEditingSingle && selectedBubble && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">
                        대사 내용
                      </label>
                      <textarea
                        rows={2}
                        value={selectedBubble.text}
                        onChange={(e) =>
                          onUpdateBubble({
                            text: e.target.value,
                            html: undefined,
                          })
                        }
                        onPaste={(e) =>
                          applyTextareaClipboardPaste(
                            e,
                            selectedBubble.text,
                            onUpdateBubble
                          )
                        }
                        style={{ fontFamily: selectedBubble.fontFamily }}
                        className="w-full rounded-lg border border-stone-200 p-2 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
                        placeholder="대사 텍스트를 입력하세요"
                      />
                    </div>
                  </div>
                )}

                {/* Speaker Name & Date Section (works for both Single and Batch mode) */}
                <div className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50/70 p-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-stone-700">
                      이름/시간 표시
                    </label>
                    <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => handleStyleChange({ showMeta: true })}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
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
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
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
                    <div className="space-y-2.5 pt-1.5 border-t border-stone-200/80">
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

          {/* 2. COLOR & BUBBLE BACKGROUND POPOVER */}
          {openTool === 'color' && (
            <div className="flex flex-col max-h-[42vh]">
              {renderTargetHeader('글자색 · 말풍선 배경')}
              <div className="overflow-y-auto p-3.5 space-y-3.5">
                {!isEditingSingle && renderBatchSideSelector()}

                {/* Text Color */}
                <div className="space-y-1.5">
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

                {/* Bubble Background Color */}
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

                {/* Border & Shadow Toggles */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="grid grid-cols-3 gap-1.5">
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

          {/* 3. SPACING & ALIGNMENT POPOVER */}
          {openTool === 'spacing' && (
            <div className="flex flex-col max-h-[42vh]">
              {renderTargetHeader('배치 · 여백 · 간격')}
              <div className="overflow-y-auto p-3.5 space-y-3">
                {isEditingSingle && selectedBubble ? (
                  <div className="space-y-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-600">
                        말풍선 위치 & 순서 이동
                      </span>
                      <div className="flex items-center gap-1">
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
                  renderBatchSideSelector()
                )}

                {/* Bubble Tail ON/OFF (right before Corner Radius) */}
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-[11px] font-semibold text-stone-600">
                    말풍선 꼬리 (뾰족 모서리)
                  </span>
                  <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleStyleChange({ hasTail: true })}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        (activeStyle.hasTail ??
                          (isEditingSingle && selectedBubble
                            ? selectedBubble.align !== 'center'
                            : activeBatchSide !== 'center'))
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'text-stone-600'
                      }`}
                    >
                      ON
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStyleChange({ hasTail: false })}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        !(activeStyle.hasTail ??
                          (isEditingSingle && selectedBubble
                            ? selectedBubble.align !== 'center'
                            : activeBatchSide !== 'center'))
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'text-stone-600'
                      }`}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                {/* Sliders in compact 2-column grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-600 mb-0.5">
                      <span>모서리 둥글기</span>
                      <span className="font-mono font-semibold">
                        {activeStyle.borderRadius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="36"
                      value={activeStyle.borderRadius}
                      onChange={(e) =>
                        handleStyleChange({
                          borderRadius: Number(e.target.value),
                        })
                      }
                      className="w-full accent-stone-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-stone-600 mb-0.5">
                      <span>상하 여백</span>
                      <span className="font-mono font-semibold">
                        {activeStyle.paddingY}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="36"
                      value={activeStyle.paddingY}
                      onChange={(e) =>
                        handleStyleChange({ paddingY: Number(e.target.value) })
                      }
                      className="w-full accent-stone-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-stone-600 mb-0.5">
                      <span>좌우 여백</span>
                      <span className="font-mono font-semibold">
                        {activeStyle.paddingX}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="48"
                      value={activeStyle.paddingX}
                      onChange={(e) =>
                        handleStyleChange({ paddingX: Number(e.target.value) })
                      }
                      className="w-full accent-stone-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-stone-600 mb-0.5">
                      <span>줄 간격</span>
                      <span className="font-mono font-semibold">
                        {(activeStyle.lineHeight ?? 1.5).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.1"
                      max="2.2"
                      step="0.05"
                      value={activeStyle.lineHeight ?? 1.5}
                      onChange={(e) =>
                        handleStyleChange({
                          lineHeight: Number(e.target.value),
                        })
                      }
                      className="w-full accent-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. BATCH DEFAULT PRESET MANAGER POPOVER */}
          {openTool === 'batch' && (
            <div className="flex flex-col max-h-[42vh]">
              <div className="flex items-center justify-between border-b border-stone-200/80 px-3.5 py-2 bg-stone-50/90">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-800">
                    일괄 기본서식 관리 (좌/중/우)
                  </span>
                  {toastMsg && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <Check className="h-3 w-3" />
                      {toastMsg}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenTool(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-y-auto p-3.5 space-y-3">
                {renderBatchSideSelector()}

                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveSideStyle(activeBatchSide);
                      showToast('기본서식으로 저장됨');
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-stone-900 py-2 font-semibold text-white shadow-2xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    현재 서식 저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRevertSideStyle(activeBatchSide);
                      showToast('저장된 서식으로 복원됨');
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white py-2 font-medium text-stone-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    원래대로 복원
                  </button>
                </div>

                {/* Copy between sides */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-stone-500 shrink-0">서식 복사:</span>
                  {(['left', 'center', 'right'] as const)
                    .filter((s) => s !== activeBatchSide)
                    .map((otherSide) => {
                      const fromLabel =
                        otherSide === 'left'
                          ? '왼쪽'
                          : otherSide === 'center'
                          ? '중앙'
                          : '오른쪽';
                      const toLabel =
                        activeBatchSide === 'left'
                          ? '왼쪽'
                          : activeBatchSide === 'center'
                          ? '중앙'
                          : '오른쪽';
                      return (
                        <button
                          key={otherSide}
                          type="button"
                          onClick={() => {
                            onCopySideStyle(otherSide, activeBatchSide);
                            showToast(`${fromLabel} → ${toLabel} 복사됨`);
                          }}
                          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 py-1.5 px-2 text-stone-700 font-medium active:bg-stone-100"
                        >
                          {fromLabel} 서식 가져오기
                        </button>
                      );
                    })}
                </div>

                {/* Quick Font & Bg Color for activeBatchSide */}
                <div className="space-y-2 pt-1 border-t border-stone-100">
                  <FontSelectDropdown
                    fonts={fonts}
                    value={defaultSideStyles[activeBatchSide].fontFamily}
                    onChange={(fontFamily) =>
                      onUpdateSideStyle(activeBatchSide, { fontFamily })
                    }
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">
                      글자 크기 ({defaultSideStyles[activeBatchSide].fontSize}px)
                    </span>
                    <input
                      type="range"
                      min="12"
                      max="44"
                      value={defaultSideStyles[activeBatchSide].fontSize}
                      onChange={(e) =>
                        onUpdateSideStyle(activeBatchSide, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="w-40 accent-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. CANVAS BACKGROUND & TEXTURE POPOVER */}
          {openTool === 'canvasBg' && (
            <div className="flex flex-col max-h-[42vh]">
              <div className="flex items-center justify-between border-b border-stone-200/80 px-3.5 py-2 bg-stone-50/90">
                <span className="text-xs font-bold text-stone-800">
                  카드 배경색 · 이미지 · 종이 질감
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
                        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-left text-[11px] font-semibold text-stone-800 active:bg-stone-100"
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
                        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-left text-[11px] font-semibold text-stone-800 active:bg-stone-100"
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
                        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-left text-[11px] font-semibold text-stone-800 active:bg-stone-100"
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
              </div>
            </div>
          )}

          {/* 6. CANVAS LAYOUT & DIVIDERS POPOVER */}
          {openTool === 'canvasLayout' && (
            <div className="flex flex-col max-h-[42vh]">
              <div className="flex items-center justify-between border-b border-stone-200/80 px-3.5 py-2 bg-stone-50/90">
                <span className="text-xs font-bold text-stone-800">
                  구분선 · 카드 규격 · 머리말
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
                {/* Top/Bottom Dividers */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700">
                      상/하단 구분선 표시
                    </span>
                    <input
                      type="checkbox"
                      checked={canvasConfig.showDividers}
                      onChange={(e) =>
                        onUpdateCanvasConfig({ showDividers: e.target.checked })
                      }
                      className="h-4 w-4 accent-stone-900 rounded"
                    />
                  </div>

                  {canvasConfig.showDividers && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-200/80 text-xs">
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

                {/* Card dimensions & Bubble spacing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-600 mb-0.5">
                      <span>카드 가로폭</span>
                      <span className="font-mono font-semibold">
                        {canvasConfig.width}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="480"
                      max="1080"
                      step="10"
                      value={canvasConfig.width}
                      onChange={(e) =>
                        onUpdateCanvasConfig({ width: Number(e.target.value) })
                      }
                      className="w-full accent-stone-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-stone-600 mb-0.5">
                      <span>말풍선 간격</span>
                      <span className="font-mono font-semibold">
                        {canvasConfig.bubbleSpacing}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="56"
                      value={canvasConfig.bubbleSpacing}
                      onChange={(e) =>
                        onUpdateCanvasConfig({
                          bubbleSpacing: Number(e.target.value),
                        })
                      }
                      className="w-full accent-stone-900"
                    />
                  </div>
                </div>

                {/* Header / Footer toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
                      <span>상단 머리말</span>
                      <input
                        type="checkbox"
                        checked={canvasConfig.showHeader}
                        onChange={(e) =>
                          onUpdateCanvasConfig({ showHeader: e.target.checked })
                        }
                        className="h-3.5 w-3.5 accent-stone-900"
                      />
                    </label>
                    {canvasConfig.showHeader && (
                      <input
                        type="text"
                        value={canvasConfig.headerText}
                        onChange={(e) =>
                          onUpdateCanvasConfig({ headerText: e.target.value })
                        }
                        placeholder="머리말 입력"
                        className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
                      <span>하단 꼬리말</span>
                      <input
                        type="checkbox"
                        checked={canvasConfig.showFooter}
                        onChange={(e) =>
                          onUpdateCanvasConfig({ showFooter: e.target.checked })
                        }
                        className="h-3.5 w-3.5 accent-stone-900"
                      />
                    </label>
                    {canvasConfig.showFooter && (
                      <input
                        type="text"
                        value={canvasConfig.footerText}
                        onChange={(e) =>
                          onUpdateCanvasConfig({ footerText: e.target.value })
                        }
                        placeholder="꼬리말 입력"
                        className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                      />
                    )}
                  </div>
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
                <div className="flex items-center gap-0.5">
                  {tool.icon}
                  {isActive ? (
                    <ChevronDown className="h-2.5 w-2.5 opacity-80" />
                  ) : (
                    <ChevronUp className="h-2.5 w-2.5 opacity-40" />
                  )}
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
