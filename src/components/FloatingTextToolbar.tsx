import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eraser,
  Type,
  ChevronDown,
} from 'lucide-react';
import { WebFont } from '../types';
import { COLOR_PALETTE } from '../data/presetFonts';
import { formatSelection, getSelectionTextColor } from '../utils/richText';

interface FloatingTextToolbarProps {
  bubbleId: string;
  position: { top: number; left: number };
  fonts: WebFont[];
  currentFontFamily?: string;
  onUpdateContent: (newHtml: string, newText: string, fontFamily?: string) => void;
  onClose?: () => void;
}

export const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  bubbleId,
  position,
  fonts,
  onUpdateContent,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [activeSelectionColor, setActiveSelectionColor] = useState<string | null>(
    () => getSelectionTextColor(bubbleId)
  );

  const handleCommand = (
    command: 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'removeFormat'
  ) => {
    formatSelection(bubbleId, { command }, onUpdateContent);
    if (command === 'removeFormat') {
      setActiveSelectionColor(getSelectionTextColor(bubbleId));
    }
  };

  const handleColor = (color: string) => {
    formatSelection(bubbleId, { color }, onUpdateContent);
    setActiveSelectionColor(color);
  };

  const handleFontSize = (size: number) => {
    formatSelection(bubbleId, { fontSize: size }, onUpdateContent);
    setShowSizePicker(false);
  };

  const handleFontFamily = (family: string) => {
    formatSelection(bubbleId, { fontFamily: family }, (newHtml, newText) => {
      onUpdateContent(newHtml, newText);
    });
    setShowFontPicker(false);
  };

  return (
    <div
      id="floating-text-toolbar"
      style={{
        position: 'fixed',
        top: `${Math.max(12, position.top)}px`,
        left: `${Math.max(12, Math.min(window.innerWidth - 340, position.left))}px`,
        zIndex: 100,
      }}
      className="flex items-center gap-1 rounded-xl border border-stone-800 bg-stone-900/95 px-2 py-1.5 text-white shadow-2xl backdrop-blur-md transition-all select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('bold');
        }}
        className="rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
        title="선택 글자 굵게 (Bold)"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('italic');
        }}
        className="rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
        title="선택 글자 기울임 (Italic)"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('underline');
        }}
        className="rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
        title="선택 글자 밑줄 (Underline)"
      >
        <Underline className="h-3.5 w-3.5" />
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('strikeThrough');
        }}
        className="rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
        title="선택 글자 취소선 (Strikethrough)"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-[1px] bg-stone-700" />

      {/* Text Color Picker Popover */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const detected = getSelectionTextColor(bubbleId);
            if (detected) setActiveSelectionColor(detected);
            setShowColorPicker(!showColorPicker);
            setShowSizePicker(false);
            setShowFontPicker(false);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition ${
            showColorPicker ? 'bg-stone-700 text-amber-300' : 'text-stone-200 hover:bg-stone-700'
          }`}
          title="선택 글자 색상 변경"
        >
          <span
            className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-2xs shrink-0"
            style={{
              backgroundColor:
                activeSelectionColor || getSelectionTextColor(bubbleId) || '#2B2623',
            }}
          />
          <span className="text-[11px]">색상</span>
        </button>

        {showColorPicker && (
          <div
            className="absolute left-0 top-full mt-2 z-50 w-52 rounded-xl border border-stone-200 bg-white p-3 text-stone-900 shadow-xl animate-in fade-in duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-stone-500">
              <span>선택 영역 글자색</span>
              {activeSelectionColor && (
                <span className="font-mono text-[10px] text-stone-700 uppercase">
                  {activeSelectionColor}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2.5">
              {COLOR_PALETTE.text.map((c) => {
                const isCurrentColor =
                  (activeSelectionColor || '').toLowerCase() ===
                  c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleColor(c.value);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition cursor-pointer ${
                      isCurrentColor
                        ? 'bg-amber-50 ring-1 ring-amber-400'
                        : 'hover:bg-stone-100'
                    }`}
                    title={c.label}
                  >
                    <span
                      className={`h-4 w-4 rounded-full border border-black/10 shadow-2xs transition-transform ${
                        isCurrentColor ? 'scale-110 ring-2 ring-stone-900' : ''
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="text-[9px] text-stone-600 truncate max-w-full">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
              <span className="text-stone-600 text-[11px]">직접 선택:</span>
              <input
                type="color"
                value={
                  activeSelectionColor &&
                  activeSelectionColor.startsWith('#') &&
                  activeSelectionColor.length === 7
                    ? activeSelectionColor
                    : '#C84B31'
                }
                onChange={(e) => handleColor(e.target.value)}
                className="h-6 w-10 cursor-pointer rounded border border-stone-200 p-0.5"
              />
            </div>
          </div>
        )}
      </div>

      {/* Font Size Selector */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowSizePicker(!showSizePicker);
            setShowColorPicker(false);
            setShowFontPicker(false);
          }}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
            showSizePicker ? 'bg-stone-700 text-amber-300' : 'text-stone-200 hover:bg-stone-700'
          }`}
          title="선택 글자 크기 조절"
        >
          <span className="text-[11px] font-medium">크기</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {showSizePicker && (
          <div
            className="absolute left-0 top-full mt-2 z-50 w-36 rounded-xl border border-stone-200 bg-white p-1 text-stone-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-stone-400">글자 크기 (px)</div>
            {[16, 18, 20, 22, 26, 30, 36].map((size) => (
              <button
                key={size}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFontSize(size);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-100 transition"
              >
                <span>{size}px</span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {size === 22 ? '기본' : size < 20 ? '작게' : '강조'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Family Selector */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowFontPicker(!showFontPicker);
            setShowColorPicker(false);
            setShowSizePicker(false);
          }}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
            showFontPicker ? 'bg-stone-700 text-amber-300' : 'text-stone-200 hover:bg-stone-700'
          }`}
          title="선택 글자 글꼴 변경"
        >
          <Type className="h-3.5 w-3.5" />
          <span className="text-[11px]">글꼴</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {showFontPicker && (
          <div
            className="absolute right-0 top-full mt-2 z-50 w-48 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1 text-stone-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-stone-400">선택 영역 글꼴</div>
            {fonts.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFontFamily(f.family);
                }}
                style={{ fontFamily: f.family }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-stone-800 hover:bg-stone-100 text-left transition"
              >
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-1 h-4 w-[1px] bg-stone-700" />

      {/* Remove Format */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('removeFormat');
        }}
        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-700 hover:text-rose-300 transition"
        title="선택 글자 서식 지우기 (기본으로)"
      >
        <Eraser className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
