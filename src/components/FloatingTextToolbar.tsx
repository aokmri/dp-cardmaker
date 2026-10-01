import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eraser,
  Type,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { WebFont } from '../types';
import { COLOR_PALETTE } from '../data/presetFonts';
import {
  formatSelection,
  getSelectionTextColor,
  isSelectionSpoiler,
  toggleSpoilerInBubble,
} from '../utils/richText';

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
  const [spoilerActive, setSpoilerActive] = useState<boolean>(() =>
    isSelectionSpoiler(bubbleId)
  );
  const [toolbarOffset, setToolbarOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);

  const handleToolbarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    const barEl = e.currentTarget.closest(
      '#floating-text-toolbar'
    ) as HTMLElement | null;
    const rect = barEl?.getBoundingClientRect();
    const scale =
      barEl && barEl.offsetWidth > 0 && rect
        ? rect.width / barEl.offsetWidth
        : 1;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startOffsetX = toolbarOffset.x;
    const startOffsetY = toolbarOffset.y;

    setIsDraggingToolbar(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startClientX) / (scale || 1);
      const dy = (moveEvent.clientY - startClientY) / (scale || 1);
      setToolbarOffset({
        x: Math.round(startOffsetX + dx),
        y: Math.round(startOffsetY + dy),
      });
    };

    const handlePointerUp = () => {
      setIsDraggingToolbar(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      // Consume the trailing click event so releasing outside the bubble doesn't deselect it
      const suppressClick = (clickEvent: MouseEvent) => {
        clickEvent.stopPropagation();
        window.removeEventListener('click', suppressClick, true);
      };
      window.addEventListener('click', suppressClick, true);
      window.setTimeout(() => {
        window.removeEventListener('click', suppressClick, true);
      }, 80);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleCommand = (
    command: 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'removeFormat'
  ) => {
    formatSelection(bubbleId, { command }, onUpdateContent);
    if (command === 'removeFormat') {
      setActiveSelectionColor(getSelectionTextColor(bubbleId));
      setSpoilerActive(isSelectionSpoiler(bubbleId));
    }
  };

  const handleToggleSpoiler = () => {
    toggleSpoilerInBubble(bubbleId, onUpdateContent);
    setSpoilerActive(isSelectionSpoiler(bubbleId));
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
        left: `${Math.max(12, Math.min(window.innerWidth - 480, position.left))}px`,
        width: 'max-content',
        transform: `translate(${toolbarOffset.x}px, ${toolbarOffset.y}px)`,
        zIndex: 100,
      }}
      className={`hidden md:flex w-max flex-nowrap items-center gap-1 whitespace-nowrap rounded-xl border bg-stone-900/95 px-2 py-1.5 text-white shadow-2xl backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-100 ${
        isDraggingToolbar
          ? 'border-amber-500 ring-2 ring-amber-400/40'
          : 'border-stone-800'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag Handle (same pattern as bubble action bar) */}
      <div
        role="button"
        tabIndex={0}
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={handleToolbarPointerDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setToolbarOffset({ x: 0, y: 0 });
        }}
        className="flex shrink-0 items-center justify-center rounded px-0.5 py-1 text-stone-400 hover:bg-stone-700 hover:text-stone-200 active:text-white cursor-grab active:cursor-grabbing touch-none select-none transition"
        title="드래그하여 보조도구 바 위치 이동 (더블클릭 시 기본 위치로 초기화)"
      >
        <GripVertical className="h-3.5 w-3.5 shrink-0" />
      </div>
      <div className="mx-0.5 h-4 w-[1px] shrink-0 bg-stone-700" />
      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('bold');
        }}
        className="shrink-0 rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
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
        className="shrink-0 rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
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
        className="shrink-0 rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
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
        className="shrink-0 rounded-lg p-1.5 text-stone-200 hover:bg-stone-700 hover:text-white transition"
        title="선택 글자 취소선 (Strikethrough)"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      {/* Spoiler (스포방지) */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleToggleSpoiler();
        }}
        className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
          spoilerActive || isSelectionSpoiler(bubbleId)
            ? 'bg-amber-400 text-stone-950 font-semibold'
            : 'text-stone-200 hover:bg-stone-700 hover:text-white'
        }`}
        title="선택 글자 스포방지 (검은 네모 표기 / 해제)"
      >
        <span className="shrink-0 text-[10px] leading-none">■</span>
        <span className="whitespace-nowrap">
          {spoilerActive || isSelectionSpoiler(bubbleId) ? '스포해제' : '스포방지'}
        </span>
      </button>

      <div className="mx-1 h-4 w-[1px] shrink-0 bg-stone-700" />

      {/* Text Color Picker Popover */}
      <div className="relative shrink-0">
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
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-xs transition ${
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
          <span className="whitespace-nowrap text-[11px]">색상</span>
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
      <div className="relative shrink-0">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowSizePicker(!showSizePicker);
            setShowColorPicker(false);
            setShowFontPicker(false);
          }}
          className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs transition ${
            showSizePicker ? 'bg-stone-700 text-amber-300' : 'text-stone-200 hover:bg-stone-700'
          }`}
          title="선택 글자 크기 조절"
        >
          <span className="whitespace-nowrap text-[11px] font-medium">크기</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
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
      <div className="relative shrink-0">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowFontPicker(!showFontPicker);
            setShowColorPicker(false);
            setShowSizePicker(false);
          }}
          className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs transition ${
            showFontPicker ? 'bg-stone-700 text-amber-300' : 'text-stone-200 hover:bg-stone-700'
          }`}
          title="선택 글자 글꼴 변경"
        >
          <Type className="h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-nowrap text-[11px]">글꼴</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
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

      <div className="mx-1 h-4 w-[1px] shrink-0 bg-stone-700" />

      {/* Remove Format */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('removeFormat');
        }}
        className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-stone-700 hover:text-rose-300 transition"
        title="선택 글자 서식 지우기 (기본으로)"
      >
        <Eraser className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
