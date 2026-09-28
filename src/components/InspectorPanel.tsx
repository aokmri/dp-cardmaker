import React, { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Sliders,
  Type,
  Maximize2,
  Trash2,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { Bubble, BubbleSideStyle, CanvasConfig, CardThemeId, DefaultSideStyles, WebFont } from '../types';
import { COLOR_PALETTE } from '../data/presetFonts';
import {
  formatSelection,
  getSelectionWithinBubble,
  stripInlineFontFamilyFromHtml,
} from '../utils/richText';
import { BatchSideStylePanel } from './BatchSideStylePanel';
import { FontPasteMatcher } from './FontPasteMatcher';
import { FontSelectDropdown } from './FontSelectDropdown';
import { applyTextareaClipboardPaste } from '../utils/pasteFormatter';

interface InspectorPanelProps {
  selectedBubble: Bubble | null;
  bubbles: Bubble[];
  onUpdateBubble: (updated: Partial<Bubble>) => void;
  onDeleteBubble: () => void;
  onDuplicateBubble: () => void;
  canvasConfig: CanvasConfig;
  onUpdateCanvasConfig: (updated: Partial<CanvasConfig>) => void;
  fonts: WebFont[];
  onOpenFontManager: () => void;
  defaultSideStyles: DefaultSideStyles;
  savedSideStyles: DefaultSideStyles;
  onUpdateSideStyle: (side: 'left' | 'right' | 'center', updated: Partial<BubbleSideStyle>) => void;
  onSaveSideStyle: (side: 'left' | 'right' | 'center') => void;
  onRevertSideStyle: (side: 'left' | 'right' | 'center') => void;
  onCopySideStyle: (fromSide: 'left' | 'right' | 'center', toSide: 'left' | 'right' | 'center') => void;
  onSelectBubbleById?: (id: string) => void;
  activeTab?: 'batch' | 'single' | 'canvas';
  onTabChange?: (tab: 'batch' | 'single' | 'canvas') => void;
  onActiveBatchSideChange?: (side: 'left' | 'center' | 'right') => void;
  onApplyTheme?: (themeId: CardThemeId) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedBubble,
  bubbles,
  onUpdateBubble,
  onDeleteBubble,
  onDuplicateBubble,
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
  onSelectBubbleById,
  activeTab: controlledActiveTab,
  onTabChange,
  onActiveBatchSideChange,
  onApplyTheme,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'batch' | 'single' | 'canvas'>('batch');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab: 'batch' | 'single' | 'canvas') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Auto-switch to single tab whenever a bubble is clicked / selected
  useEffect(() => {
    if (selectedBubble) {
      setActiveTab('single');
    }
  }, [selectedBubble?.id]);

  const handleApplyPresetToSelected = (side: 'left' | 'right' | 'center') => {
    if (!selectedBubble) return;
    const style = defaultSideStyles[side] || defaultSideStyles.left;
    const cleanedHtml = stripInlineFontFamilyFromHtml(selectedBubble.html);
    onUpdateBubble({
      align: side,
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
    const sideName = side === 'left' ? '왼쪽' : side === 'center' ? '중앙' : '오른쪽';
    setSaveSuccessMsg(`${sideName} 기본서식으로 초기화되었습니다.`);
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  const handleSaveCurrentAsDefault = (side: 'left' | 'right' | 'center') => {
    if (!selectedBubble) return;
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
    const sideName = side === 'left' ? '왼쪽' : side === 'center' ? '중앙' : '오른쪽';
    setSaveSuccessMsg(
      `이 말풍선 스타일이 ${sideName} 기본서식으로 저장되었습니다.`
    );
    setTimeout(() => setSaveSuccessMsg(null), 2200);
  };

  // Rich text formatting handlers for selected text substring vs whole bubble
  const handleFormatCommand = (
    command: 'bold' | 'italic' | 'underline' | 'strikeThrough'
  ) => {
    if (!selectedBubble) return;
    const hasSelection = getSelectionWithinBubble(selectedBubble.id);
    if (hasSelection && !hasSelection.collapsed && hasSelection.toString().length > 0) {
      formatSelection(selectedBubble.id, { command }, (newHtml, newText) => {
        onUpdateBubble({ html: newHtml, text: newText });
      });
    } else {
      if (command === 'bold') onUpdateBubble({ isBold: !selectedBubble.isBold });
      if (command === 'italic') onUpdateBubble({ isItalic: !selectedBubble.isItalic });
      if (command === 'underline') onUpdateBubble({ isUnderline: !selectedBubble.isUnderline });
      if (command === 'strikeThrough') onUpdateBubble({ isStrikethrough: !selectedBubble.isStrikethrough });
    }
  };

  const handleTextColor = (color: string) => {
    if (!selectedBubble) return;
    const hasSelection = getSelectionWithinBubble(selectedBubble.id);
    if (hasSelection && !hasSelection.collapsed && hasSelection.toString().length > 0) {
      formatSelection(selectedBubble.id, { color }, (newHtml, newText) => {
        onUpdateBubble({ html: newHtml, text: newText });
      });
    } else {
      onUpdateBubble({ color });
    }
  };

  const handleFontSize = (fontSize: number) => {
    if (!selectedBubble) return;
    const hasSelection = getSelectionWithinBubble(selectedBubble.id);
    if (hasSelection && !hasSelection.collapsed && hasSelection.toString().length > 0) {
      formatSelection(selectedBubble.id, { fontSize }, (newHtml, newText) => {
        onUpdateBubble({ html: newHtml, text: newText });
      });
    } else {
      onUpdateBubble({ fontSize });
    }
  };

  const handleFontFamily = (fontFamily: string) => {
    if (!selectedBubble) return;
    const hasSelection = getSelectionWithinBubble(selectedBubble.id);
    if (hasSelection && !hasSelection.collapsed && hasSelection.toString().length > 0) {
      formatSelection(selectedBubble.id, { fontFamily }, (newHtml, newText) => {
        onUpdateBubble({ fontFamily, html: newHtml, text: newText });
      });
    } else {
      const cleanedHtml = stripInlineFontFamilyFromHtml(selectedBubble.html);
      onUpdateBubble({
        fontFamily,
        ...(cleanedHtml !== undefined ? { html: cleanedHtml } : {}),
      });
    }
  };

  const handleResetFontToDefault = () => {
    if (!selectedBubble) return;
    const sideStyle =
      defaultSideStyles[selectedBubble.align] || defaultSideStyles.left;
    const defaultFont = sideStyle.fontFamily;
    const cleanedHtml = stripInlineFontFamilyFromHtml(selectedBubble.html);
    const nextCustomKeys = (selectedBubble.customStyleKeys || []).filter(
      (k) => k !== 'fontFamily'
    );
    onUpdateBubble({
      fontFamily: defaultFont,
      ...(cleanedHtml !== undefined ? { html: cleanedHtml } : {}),
      customStyleKeys: nextCustomKeys,
    });
    setSaveSuccessMsg('기본 폰트로 초기화되었습니다.');
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  return (
    <aside
      id="inspector-sidebar"
      className="hidden md:flex h-full w-68 sm:w-76 lg:w-84 shrink-0 flex-col border-l border-stone-200 bg-white/95 shadow-sm backdrop-blur-xs"
    >
      {/* 3-Tab Header Navigation */}
      <div className="border-b border-stone-200 bg-stone-50/70 p-2">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-200/60 p-1 text-xs">
          <button
            type="button"
            id="tab-btn-batch"
            onClick={() => setActiveTab('batch')}
            title="일괄수정"
            className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-1.5 font-medium transition ${
              activeTab === 'batch'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 shrink-0 text-amber-700" />
            <span className="hidden sm:inline">일괄수정</span>
          </button>

          <button
            type="button"
            id="tab-btn-single"
            onClick={() => setActiveTab('single')}
            title="개별 편집"
            className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-1.5 font-medium transition ${
              activeTab === 'single'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Type className="h-3.5 w-3.5 shrink-0 text-amber-700" />
            <span className="hidden sm:inline">개별 편집</span>
          </button>

          <button
            type="button"
            id="tab-btn-canvas"
            onClick={() => setActiveTab('canvas')}
            title="배경지"
            className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-1.5 font-medium transition ${
              activeTab === 'canvas'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5 shrink-0 text-stone-600" />
            <span className="hidden sm:inline">배경지</span>
          </button>
        </div>
      </div>

      {/* Action Header for Single Selection */}
      {activeTab === 'single' && selectedBubble && (
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-2.5 bg-stone-50/30">
          <span className="text-xs font-semibold text-stone-700 truncate max-w-[170px]">
            {selectedBubble.align === 'left' ? '좌측 말풍선' : selectedBubble.align === 'center' ? '중앙 말풍선' : '우측 말풍선'}
            {selectedBubble.speaker ? ` (${selectedBubble.speaker})` : ''}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onDuplicateBubble}
              className="rounded p-1 text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 transition"
              title="말풍선 복제"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDeleteBubble}
              className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
              title="말풍선 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {saveSuccessMsg && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 animate-in fade-in duration-150">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {activeTab === 'single' ? (
          selectedBubble ? (
            <>
              {/* 0. Quick Preset Reset & Save as Default (Moved to top) */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-600">
                    기본서식 강제 초기화
                  </span>
                  {(selectedBubble.customStyleKeys?.length ?? 0) > 0 && (
                    <span className="text-[10px] text-amber-700 font-medium">
                      개별 수정됨 ({selectedBubble.customStyleKeys?.length}항목)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToSelected(selectedBubble.align)}
                  title="현재 말풍선 위치의 기본서식으로 초기화"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 hover:border-stone-300 hover:text-stone-900 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0 text-stone-600" />
                  <span>서식 초기화</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCurrentAsDefault(selectedBubble.align)}
                  className="w-full text-center text-[11px] text-stone-600 hover:text-stone-900 underline underline-offset-2 py-0.5 whitespace-nowrap truncate cursor-pointer"
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

              {/* 1. Direct Text Content Editor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-600">내용 텍스트</label>
                <textarea
                  rows={3}
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
                  className="w-full resize-y rounded-lg border border-stone-200 p-2.5 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
                  placeholder="대사 텍스트를 입력하세요"
                />
              </div>

              {/* 2. Font Selector with "기본폰트로 초기화" Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-semibold text-stone-600">폰트</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetFontToDefault}
                      className="flex items-center gap-1 rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
                      title="현재 위치의 기본 폰트로 초기화"
                    >
                      <RotateCcw className="h-3 w-3" />
                      기본폰트로 초기화
                    </button>
                  </div>
                </div>

                <FontSelectDropdown
                  fonts={fonts}
                  value={selectedBubble.fontFamily}
                  onChange={(family) => handleFontFamily(family)}
                />

                <FontPasteMatcher
                  fonts={fonts}
                  currentFamily={selectedBubble.fontFamily}
                  onApplyFont={(family, fontName) => {
                    handleFontFamily(family);
                    setSaveSuccessMsg(`선택한 말풍선에 '${fontName}' 폰트가 적용되었습니다.`);
                    setTimeout(() => setSaveSuccessMsg(null), 2000);
                  }}
                  onOpenFontManager={onOpenFontManager}
                  targetLabel="선택한 말풍선"
                />
              </div>

              {/* 3. Text Formatting Bar: B, I, S(취소표), U, Align */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-600">글자 서식 & 정렬</label>
                </div>

                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-200 bg-stone-50/60 p-1">
                  {/* Bold */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFormatCommand('bold');
                    }}
                    className={`rounded p-1.5 transition ${
                      selectedBubble.isBold
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/60'
                    }`}
                    title="선택 글자 또는 전체 굵게 (Bold)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>

                  {/* Italic */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFormatCommand('italic');
                    }}
                    className={`rounded p-1.5 transition ${
                      selectedBubble.isItalic
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/60'
                    }`}
                    title="선택 글자 또는 전체 기울임 (Italic)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>

                  {/* Strikethrough (취소표/취소선) */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFormatCommand('strikeThrough');
                    }}
                    className={`rounded p-1.5 transition ${
                      selectedBubble.isStrikethrough
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/60'
                    }`}
                    title="선택 글자 또는 전체 취소표 / 취소선 (Strikethrough)"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>

                  {/* Underline */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFormatCommand('underline');
                    }}
                    className={`rounded p-1.5 transition ${
                      selectedBubble.isUnderline
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/60'
                    }`}
                    title="선택 글자 또는 전체 밑줄 (Underline)"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>

                  <div className="mx-1 h-4 w-[1px] bg-stone-300" />

                  {/* Text Align Left */}
                  <button
                    type="button"
                    onClick={() => onUpdateBubble({ textAlign: 'left' })}
                    className={`rounded p-1.5 transition ${
                      selectedBubble.textAlign === 'left'
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
                    onClick={() => onUpdateBubble({ textAlign: 'center' })}
                    className={`rounded p-1.5 transition ${
                      selectedBubble.textAlign === 'center'
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
                    onClick={() => onUpdateBubble({ textAlign: 'right' })}
                    className={`rounded p-1.5 transition ${
                      selectedBubble.textAlign === 'right'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/60'
                    }`}
                    title="텍스트 우측 정렬"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 4. Font Size & Spacing Sliders */}
              <div className="space-y-3">
                {/* Font Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">글자 크기</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="14"
                      max="42"
                      value={selectedBubble.fontSize}
                      onChange={(e) => handleFontSize(Number(e.target.value))}
                      className="w-full accent-stone-900"
                    />
                    <span className="w-8 text-right font-mono text-xs text-stone-700">
                      {selectedBubble.fontSize}px
                    </span>
                  </div>
                </div>

                {/* Letter Spacing */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">자간 (Letter Spacing)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-1.5"
                      max="4"
                      step="0.5"
                      value={selectedBubble.letterSpacing ?? 0.5}
                      onChange={(e) =>
                        onUpdateBubble({ letterSpacing: Number(e.target.value) })
                      }
                      className="w-24 accent-stone-900"
                    />
                    <span className="w-8 text-right font-mono text-xs text-stone-700">
                      {selectedBubble.letterSpacing ?? 0.5}px
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
                      value={selectedBubble.lineHeight ?? 1.5}
                      onChange={(e) =>
                        onUpdateBubble({ lineHeight: Number(e.target.value) })
                      }
                      className="w-24 accent-stone-900"
                    />
                    <span className="w-8 text-right font-mono text-xs text-stone-700">
                      {selectedBubble.lineHeight ?? 1.5}배
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Colors: Text Color & Bubble Background Color */}
              <div className="space-y-3">
                {/* Text Color */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-600">글자 색상</label>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedBubble.color}
                      onChange={(e) => handleTextColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                    />
                    <div className="flex flex-1 flex-wrap gap-1">
                      {COLOR_PALETTE.text.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleTextColor(c.value);
                          }}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                          className={`h-6 w-6 rounded-full border border-stone-300 transition-transform ${
                            selectedBubble.color.toLowerCase() === c.value.toLowerCase()
                              ? 'scale-110 ring-2 ring-stone-900'
                              : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bubble Background Color */}
                <div>
                  <label className="text-xs font-semibold text-stone-600">말풍선 배경색</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        selectedBubble.bgColor === 'transparent'
                          ? '#FFFFFF'
                          : selectedBubble.bgColor
                      }
                      onChange={(e) => onUpdateBubble({ bgColor: e.target.value })}
                      className="h-8 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                    />
                    <div className="flex flex-1 flex-wrap gap-1">
                      {COLOR_PALETTE.bubbleBg.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => onUpdateBubble({ bgColor: c.value })}
                          style={{
                            backgroundColor:
                              c.value === 'transparent' ? '#ffffff' : c.value,
                          }}
                          title={c.label}
                          className={`relative h-6 w-6 rounded-full border border-stone-300 transition-transform ${
                            selectedBubble.bgColor.toLowerCase() === c.value.toLowerCase()
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
              </div>

              {/* 6. Bubble Alignment & Quick Preset Sync */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-600">말풍선(텍스트) 위치 & 기본서식</label>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateBubble({ align: 'left', x: 6 })}
                    title="좌측 배치"
                    className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border py-1.5 px-1 text-xs font-medium transition ${
                      selectedBubble.align === 'left'
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <AlignLeft className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">좌측 배치</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateBubble({ align: 'center', x: 25 })}
                    title="중앙 배치"
                    className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border py-1.5 px-1 text-xs font-medium transition ${
                      selectedBubble.align === 'center'
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <AlignCenter className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">중앙 배치</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateBubble({ align: 'right', x: 45 })}
                    title="우측 배치"
                    className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border py-1.5 px-1 text-xs font-medium transition ${
                      selectedBubble.align === 'right'
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <AlignRight className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">우측 배치</span>
                  </button>
                </div>
              </div>

              {/* 7. Corner Radius & Padding */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <label className="text-xs font-semibold text-stone-700">말풍선 둥글기 & 여백</label>

                {/* Bubble Tail ON/OFF */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">말풍선 꼬리 (뾰족 모서리)</span>
                  <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateBubble({ hasTail: true })}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        (selectedBubble.hasTail ?? (selectedBubble.align !== 'center'))
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      ON
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateBubble({ hasTail: false })}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        !(selectedBubble.hasTail ?? (selectedBubble.align !== 'center'))
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                {/* Border Radius */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">모서리 둥글기</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="4"
                      max="32"
                      value={selectedBubble.borderRadius}
                      onChange={(e) =>
                        onUpdateBubble({ borderRadius: Number(e.target.value) })
                      }
                      className="w-28 accent-stone-900"
                    />
                    <span className="w-8 text-right font-mono text-xs">
                      {selectedBubble.borderRadius}px
                    </span>
                  </div>
                </div>

                {/* Padding Y */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">상하 내부 여백</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="8"
                      max="36"
                      value={selectedBubble.paddingY}
                      onChange={(e) =>
                        onUpdateBubble({ paddingY: Number(e.target.value) })
                      }
                      className="w-28 accent-stone-900"
                    />
                    <span className="w-8 text-right font-mono text-xs">
                      {selectedBubble.paddingY}px
                    </span>
                  </div>
                </div>

                {/* Padding X */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">좌우 내부 여백</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={selectedBubble.paddingX}
                      onChange={(e) =>
                        onUpdateBubble({ paddingX: Number(e.target.value) })
                      }
                      className="w-28 accent-stone-900"
                    />
                    <span className="w-8 text-right font-mono text-xs">
                      {selectedBubble.paddingX}px
                    </span>
                  </div>
                </div>
              </div>

              {/* 7.5 Border & Shadow */}
              <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/50 p-3">
                <label className="text-xs font-semibold text-stone-700">외곽 테두리 & 그림자</label>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">외곽 테두리선</span>
                  <input
                    type="checkbox"
                    checked={selectedBubble.hasBorder}
                    onChange={(e) =>
                      onUpdateBubble({ hasBorder: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-stone-900"
                  />
                </div>

                {selectedBubble.hasBorder && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/80">
                    <span className="text-stone-600">테두리 색상</span>
                    <input
                      type="color"
                      value={selectedBubble.borderColor || '#E5DED3'}
                      onChange={(e) =>
                        onUpdateBubble({ borderColor: e.target.value })
                      }
                      className="h-6 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-stone-600">은은한 입체 그림자</span>
                  <input
                    type="checkbox"
                    checked={selectedBubble.hasShadow}
                    onChange={(e) =>
                      onUpdateBubble({ hasShadow: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-stone-900"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/80">
                  <span className="text-stone-600">하단 그림자 (4px 단색)</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedBubble.hasBottomShadow)}
                    onChange={(e) =>
                      onUpdateBubble({ hasBottomShadow: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-stone-900"
                  />
                </div>

                {selectedBubble.hasBottomShadow && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-600">하단 그림자 색상</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-stone-500">
                        {selectedBubble.bottomShadowColor || '#b9a98e'}
                      </span>
                      <input
                        type="color"
                        value={selectedBubble.bottomShadowColor || '#b9a98e'}
                        onChange={(e) =>
                          onUpdateBubble({ bottomShadowColor: e.target.value })
                        }
                        className="h-6 w-8 cursor-pointer rounded border border-stone-200 p-0.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 8. Speaker Name */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <label className="text-xs font-semibold text-stone-600">화자 이름 (선택)</label>
                <input
                  type="text"
                  placeholder=""
                  value={selectedBubble.speaker || ''}
                  onChange={(e) => onUpdateBubble({ speaker: e.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-800 focus:outline-none"
                />
              </div>
            </>
          ) : (
            /* Empty state when in single mode and no bubble is selected */
            <div className="flex flex-col items-center justify-center text-center py-10 px-2 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800 border border-amber-200/60">
                <Type className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-stone-800">선택된 말풍선 없음</h4>
                <p className="text-xs text-stone-500 leading-relaxed max-w-[220px]">
                  캔버스에서 수정할 말풍선을 클릭하거나 아래 버튼으로 이동하세요.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2 w-full max-w-[200px]">
                {bubbles.length > 0 && onSelectBubbleById && (
                  <button
                    type="button"
                    onClick={() => onSelectBubbleById(bubbles[0].id)}
                    className="w-full rounded-lg border border-stone-300 bg-white py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
                  >
                    첫 번째 말풍선 선택
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('batch')}
                  className="w-full rounded-lg bg-stone-900 py-2 text-xs font-medium text-white hover:bg-stone-800 transition"
                >
                  일괄수정 기본서식 보기
                </button>
              </div>
            </div>
          )
        ) : activeTab === 'batch' ? (
          /* Batch Left/Right Default Styles Panel */
          <BatchSideStylePanel
            bubbles={bubbles}
            defaultSideStyles={defaultSideStyles}
            savedSideStyles={savedSideStyles}
            onUpdateSideStyle={onUpdateSideStyle}
            onSaveSideStyle={onSaveSideStyle}
            onRevertSideStyle={onRevertSideStyle}
            onCopySideStyle={onCopySideStyle}
            fonts={fonts}
            onOpenFontManager={onOpenFontManager}
            onActiveSideChange={onActiveBatchSideChange}
          />
        ) : (
          /* Canvas Global Settings */
          <div className="space-y-6">
            {/* Card Theme Presets (at very top of Canvas tab) */}
            {onApplyTheme && (
              <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-800">카드 테마</label>
                  <span className="text-[10px] text-stone-500">클릭 시 서식 일괄 변경</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onApplyTheme('legacy')}
                    className="flex flex-col items-start gap-1.5 rounded-lg border border-stone-200 bg-white p-2 text-left transition hover:border-stone-400 hover:shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-stone-300"
                        style={{ backgroundColor: '#faf9f8' }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-[#E5DED3]"
                        style={{ backgroundColor: '#FBF8F1' }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-[#E5DED3]"
                        style={{ backgroundColor: '#FBF5E6' }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-800">구버전</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyTheme('default-white')}
                    className="flex flex-col items-start gap-1.5 rounded-lg border border-stone-200 bg-white p-2 text-left transition hover:border-stone-400 hover:shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-stone-300"
                        style={{ backgroundColor: '#faf9f8' }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-[#6b5843]"
                        style={{
                          backgroundColor: '#faf9f8',
                          boxShadow: '0 2px 0 0 #b9a98e',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-800">기본 화이트</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyTheme('default-dark')}
                    className="flex flex-col items-start gap-1.5 rounded-lg border border-stone-200 bg-white p-2 text-left transition hover:border-stone-400 hover:shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-stone-700"
                        style={{ backgroundColor: '#1b150c' }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-stone-400"
                        style={{ backgroundColor: '#d1ab67' }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-stone-400"
                        style={{ backgroundColor: '#ddc9a1' }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-800">기본 다크</span>
                  </button>
                </div>
              </div>
            )}

            {/* Card Background Color */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700">카드 배경색</label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PALETTE.canvasBg.map((bg) => (
                  <button
                    key={bg.value}
                    type="button"
                    onClick={() =>
                      onUpdateCanvasConfig({ bgColor: bg.value, bgImageUrl: '' })
                    }
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition cursor-pointer ${
                      !canvasConfig.bgImageUrl &&
                      canvasConfig.bgColor.toLowerCase() === bg.value.toLowerCase()
                        ? 'border-stone-900 ring-1 ring-stone-900'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded border border-stone-300 shadow-2xs"
                      style={{ backgroundColor: bg.value }}
                    />
                    <span className="truncate text-[11px] text-stone-700">{bg.label}</span>
                  </button>
                ))}

                {/* Custom Background Color Picker ('색 지정') in 6th grid slot */}
                <label
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition cursor-pointer ${
                    !canvasConfig.bgImageUrl &&
                    !COLOR_PALETTE.canvasBg.some(
                      (b) => b.value.toLowerCase() === canvasConfig.bgColor.toLowerCase()
                    )
                      ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                  title="배경색 직접 지정"
                >
                  <input
                    type="color"
                    value={
                      canvasConfig.bgColor.startsWith('#') && canvasConfig.bgColor.length === 7
                        ? canvasConfig.bgColor
                        : '#F7F7F6'
                    }
                    onChange={(e) =>
                      onUpdateCanvasConfig({ bgColor: e.target.value, bgImageUrl: '' })
                    }
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border border-stone-300 bg-transparent p-0"
                  />
                  <span className="truncate text-[11px] text-stone-700">색 지정</span>
                </label>
              </div>

              {/* Device Image Picker Button (Below grid, where custom color picker used to be) */}
              <div className="flex items-center gap-2 pt-1">
                <label
                  className={`flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition cursor-pointer ${
                    canvasConfig.bgImageUrl
                      ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 text-stone-900'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                  }`}
                  title="기기에서 배경 이미지 직접 선택"
                >
                  {canvasConfig.bgImageUrl ? (
                    <span
                      className="h-5 w-5 shrink-0 rounded border border-stone-300 bg-cover bg-center shadow-2xs"
                      style={{ backgroundImage: `url("${canvasConfig.bgImageUrl}")` }}
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0 text-amber-700" />
                  )}
                  <span className="text-[11px] font-medium text-stone-600">
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
              </div>

              {/* Active Background Image Controls */}
              {canvasConfig.bgImageUrl && (
                <div className="rounded-xl border border-stone-200 bg-stone-50/90 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-700">
                      선택된 배경 이미지 설정
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCanvasConfig({ bgImageUrl: '' })}
                      className="flex items-center gap-0.5 text-[10px] text-rose-600 hover:underline cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
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
                        className={`rounded py-1 border transition cursor-pointer ${
                          (canvasConfig.bgImageFit || 'cover') === fit.id
                            ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {fit.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-600">
                      <span>이미지 투명도</span>
                      <span className="font-mono font-semibold text-stone-800">
                        {Math.round((canvasConfig.bgImageOpacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={canvasConfig.bgImageOpacity ?? 1}
                      onChange={(e) =>
                        onUpdateCanvasConfig({
                          bgImageOpacity: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-stone-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Paper Texture */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">종이 질감 효과</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: '매끄러운 일반지' },
                  { id: 'paper', label: '미세 한지 결' },
                  { id: 'grain', label: '빈티지 질감' },
                  { id: 'crumpled', label: '구겨진 종이' },
                  { id: 'grid', label: '원고지 모눈' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      onUpdateCanvasConfig({
                        paperTexture: t.id as CanvasConfig['paperTexture'],
                      })
                    }
                    className={`rounded-lg border py-2 text-xs font-medium transition ${
                      canvasConfig.paperTexture === t.id
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Flow Area Width (Reference image divider match) */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
              <div>
                <span className="text-xs font-semibold text-stone-800">대화 영역 & 구분선 너비</span>
                <p className="text-[11px] text-stone-500">
                  구분선과 말풍선이 위치하는 영역의 폭을 일치시킵니다.
                </p>
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">영역 너비 비율</span>
                  <input
                    type="range"
                    min="60"
                    max="96"
                    value={canvasConfig.dividerWidth}
                    onChange={(e) =>
                      onUpdateCanvasConfig({ dividerWidth: Number(e.target.value) })
                    }
                    className="w-28 accent-stone-900"
                  />
                  <span className="w-8 text-right font-mono text-xs">
                    {canvasConfig.dividerWidth}%
                  </span>
                </div>
              </div>
            </div>

            {/* Top & Bottom Divider Lines (as in reference image) */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-stone-800">상/하단 구분선</span>
                  <p className="text-[11px] text-stone-500">대화 영역과 일치하는 기준선</p>
                </div>
                <input
                  type="checkbox"
                  checked={canvasConfig.showDividers}
                  onChange={(e) =>
                    onUpdateCanvasConfig({ showDividers: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-stone-900"
                />
              </div>

              {canvasConfig.showDividers && (
                <div className="space-y-2.5 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">선 스타일</span>
                    <div className="flex gap-1">
                      {(['solid', 'dashed', 'double'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => onUpdateCanvasConfig({ dividerStyle: style })}
                          className={`rounded px-2 py-0.5 text-[11px] capitalize cursor-pointer ${
                            canvasConfig.dividerStyle === style
                              ? 'bg-stone-800 text-white'
                              : 'bg-white border text-stone-600'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">선 색 지정</span>
                    <label className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1 cursor-pointer hover:border-stone-300">
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
                          onUpdateCanvasConfig({ dividerColor: e.target.value })
                        }
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border border-stone-300 bg-transparent p-0"
                      />
                      <span className="font-mono text-[11px] text-stone-600 uppercase">
                        {canvasConfig.dividerColor || '#D1CAC0'}
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Card Dimensions */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-stone-700">카드 크기 조절</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateCanvasConfig({ width: 640 })}
                  className={`rounded-lg border py-1.5 text-xs font-medium transition ${
                    canvasConfig.width === 640
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  기본 (640px)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCanvasConfig({ width: 760 })}
                  className={`rounded-lg border py-1.5 text-xs font-medium transition ${
                    canvasConfig.width === 760
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  넓게 (760px)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCanvasConfig({ width: 880 })}
                  className={`rounded-lg border py-1.5 text-xs font-medium transition ${
                    canvasConfig.width === 880
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  와이드 (880px)
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">최소 세로 높이</span>
                <input
                  type="range"
                  min="400"
                  max="1200"
                  step="50"
                  value={canvasConfig.minHeight}
                  onChange={(e) =>
                    onUpdateCanvasConfig({ minHeight: Number(e.target.value) })
                  }
                  className="w-32 accent-stone-900"
                />
                <span className="w-12 text-right font-mono text-xs">
                  {canvasConfig.minHeight}px
                </span>
              </div>
            </div>

            {/* Spacing */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700">말풍선 간 간격</label>
              <div className="flex items-center justify-between text-xs">
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={canvasConfig.bubbleSpacing}
                  onChange={(e) =>
                    onUpdateCanvasConfig({ bubbleSpacing: Number(e.target.value) })
                  }
                  className="w-full accent-stone-900"
                />
                <span className="w-12 text-right font-mono text-xs">
                  {canvasConfig.bubbleSpacing}px
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
