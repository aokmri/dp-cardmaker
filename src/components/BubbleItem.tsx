import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Trash2, Copy, ArrowLeftRight } from 'lucide-react';
import { Bubble, WebFont } from '../types';
import { FloatingTextToolbar } from './FloatingTextToolbar';
import { recordSelection, getSelectionWithinBubble } from '../utils/richText';

interface BubbleItemProps {
  bubble: Bubble;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: Partial<Bubble>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onStartLongPressDrag?: (
    bubbleId: string,
    clientX: number,
    clientY: number,
    altKey: boolean
  ) => void;
  isBeingDragged?: boolean;
  isDragCopyMode?: boolean;
  canvasWidth?: number;
  fonts?: WebFont[];
  isExporting?: boolean;
}

function formatInitialTextToHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export const BubbleItem: React.FC<BubbleItemProps> = ({
  bubble,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onStartLongPressDrag,
  isBeingDragged = false,
  isDragCopyMode = false,
  canvasWidth,
  fonts = [],
  isExporting = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleBoxRef = useRef<HTMLDivElement>(null);
  const textEditableRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTextDraggingRef = useRef<boolean>(false);
  const isPointerDownInBubbleRef = useRef<boolean>(false);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExporting || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(`#bubble-actions-${bubble.id}`) ||
      target.closest('#floating-text-toolbar')
    ) {
      return;
    }

    isPointerDownInBubbleRef.current = true;
    isTextDraggingRef.current = false;

    // If user already has an active text selection inside the document, do not trigger long-press drag
    const activeSel = window.getSelection();
    if (activeSel && !activeSel.isCollapsed && activeSel.toString().length > 0) {
      clearLongPressTimer();
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const initialAlt = e.altKey;
    pointerStartRef.current = { x: startX, y: startY };

    clearLongPressTimer();
    pointerStartRef.current = { x: startX, y: startY };

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      // Never start long-press if user is dragging/selecting text
      const sel = window.getSelection();
      if (
        isTextDraggingRef.current ||
        (sel && !sel.isCollapsed && sel.toString().length > 0)
      ) {
        return;
      }
      if (onStartLongPressDrag) {
        window.getSelection()?.removeAllRanges();
        textEditableRef.current?.blur();
        setFloatingToolbarPos(null);
        onSelect();
        onStartLongPressDrag(bubble.id, startX, startY, initialAlt);
      }
    }, 360);
  };

  const handleMouseMoveBeforeLongPress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || longPressTimerRef.current === null) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    // As soon as pointer moves (> 2px) or text selection begins, treat as text drag and cancel long-press
    const sel = window.getSelection();
    if (
      Math.hypot(dx, dy) > 2 ||
      (sel && !sel.isCollapsed && sel.toString().length > 0)
    ) {
      isTextDraggingRef.current = true;
      clearLongPressTimer();
    }
  };

  const fitBubbleToWrappedText = useCallback(() => {
    const textEl = textEditableRef.current;
    const boxEl = bubbleBoxRef.current;
    if (!textEl || !boxEl) return;

    // 1. Reset to max-content so the browser lays out text up to the 95% max-width limit
    boxEl.style.width = 'max-content';

    const elClientWidth = textEl.clientWidth;
    if (elClientWidth <= 0) return;

    const elRect = textEl.getBoundingClientRect();
    const scale = elRect.width / elClientWidth || 1;
    const initialHeight = textEl.offsetHeight;

    // 2. Measure the tightest horizontal span across all rendered text fragments
    const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let minLeft = Infinity;
    let maxRight = -Infinity;

    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.textContent && currentNode.textContent.length > 0) {
        range.selectNodeContents(currentNode);
        const rects = range.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (r.width > 0.5 && r.height > 0.5) {
            if (r.left < minLeft) minLeft = r.left;
            if (r.right > maxRight) maxRight = r.right;
          }
        }
      }
      currentNode = walker.nextNode();
    }

    if (minLeft < Infinity && maxRight > minLeft) {
      const tightTextWidth = (maxRight - minLeft) / scale;
      if (tightTextWidth > 0 && tightTextWidth < elClientWidth - 1) {
        const borderExtra = bubble.hasBorder ? 2 : 0;
        let targetBoxWidth =
          Math.ceil(tightTextWidth + 1) + bubble.paddingX * 2 + borderExtra;
        boxEl.style.width = `${targetBoxWidth}px`;

        // Ensure shrinking never triggers an unintended extra line break
        if (textEl.offsetHeight > initialHeight) {
          targetBoxWidth += 4;
          boxEl.style.width = `${targetBoxWidth}px`;
          if (textEl.offsetHeight > initialHeight) {
            boxEl.style.width = 'max-content';
          }
        }
      }
    }
  }, [bubble.hasBorder, bubble.paddingX]);

  // Sync initial or updated html into contentEditable without interrupting typing, then fit width
  useLayoutEffect(() => {
    if (textEditableRef.current) {
      const targetHtml = bubble.html || formatInitialTextToHtml(bubble.text);
      if (textEditableRef.current.innerHTML !== targetHtml) {
        textEditableRef.current.innerHTML = targetHtml;
      }
    }
    fitBubbleToWrappedText();
  }, [
    bubble.html,
    bubble.text,
    bubble.fontFamily,
    bubble.fontSize,
    bubble.isBold,
    bubble.isItalic,
    bubble.letterSpacing,
    bubble.lineHeight,
    bubble.textAlign,
    bubble.paddingX,
    bubble.paddingY,
    bubble.hasBorder,
    bubble.align,
    canvasWidth,
    isExporting,
    fitBubbleToWrappedText,
  ]);

  // Re-fit when parent stage width changes or webfonts finish loading
  useEffect(() => {
    const parentEl = wrapperRef.current?.parentElement;
    let observer: ResizeObserver | null = null;
    if (parentEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        fitBubbleToWrappedText();
      });
      observer.observe(parentEl);
    }

    const fontSet = document.fonts;
    const handleFontsLoaded = () => fitBubbleToWrappedText();
    if (fontSet) {
      fontSet.ready.then(handleFontsLoaded).catch(() => {});
      fontSet.addEventListener?.('loadingdone', handleFontsLoaded);
    }

    return () => {
      observer?.disconnect();
      fontSet?.removeEventListener?.('loadingdone', handleFontsLoaded);
    };
  }, [fitBubbleToWrappedText]);

  const checkSelection = () => {
    recordSelection(bubble.id);
    const range = getSelectionWithinBubble(bubble.id);
    if (range && !range.collapsed && range.toString().trim().length > 0) {
      const rect = range.getBoundingClientRect();
      setFloatingToolbarPos({
        top: rect.top - 46,
        left: rect.left + rect.width / 2 - 130,
      });
    } else {
      setFloatingToolbarPos(null);
    }
  };

  useEffect(() => {
    const handleDocSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setFloatingToolbarPos(null);
        return;
      }
      // Active text selection detected -> disable long-press immediately
      isTextDraggingRef.current = true;
      clearLongPressTimer();
      checkSelection();
    };

    const handleWindowMouseUp = () => {
      clearLongPressTimer();
      if (isPointerDownInBubbleRef.current) {
        isPointerDownInBubbleRef.current = false;
        checkSelection();
      }
      isTextDraggingRef.current = false;
    };

    document.addEventListener('selectionchange', handleDocSelectionChange);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      document.removeEventListener('selectionchange', handleDocSelectionChange);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [bubble.id, clearLongPressTimer]);

  const handleInput = () => {
    fitBubbleToWrappedText();
    if (textEditableRef.current) {
      onUpdate({
        html: textEditableRef.current.innerHTML,
        text: textEditableRef.current.innerText,
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plainText = e.clipboardData.getData('text/plain');
    if (!plainText) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const lines = plainText.split(/\r?\n/);
      const frag = document.createDocumentFragment();
      let lastNode: Node | null = null;
      lines.forEach((line, idx) => {
        if (idx > 0) {
          const br = document.createElement('br');
          frag.appendChild(br);
          lastNode = br;
        }
        if (line.length > 0) {
          const textNode = document.createTextNode(line);
          frag.appendChild(textNode);
          lastNode = textNode;
        }
      });
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    if (textEditableRef.current) {
      // Strip any foreign inline styles so pasted text adopts this bubble's own style
      const allStyled = textEditableRef.current.querySelectorAll('*');
      allStyled.forEach((el) => {
        if (el instanceof HTMLElement && el.tagName.toLowerCase() !== 'br') {
          el.removeAttribute('style');
          if (el.tagName.toLowerCase() === 'font') {
            el.removeAttribute('face');
            el.removeAttribute('color');
            el.removeAttribute('size');
          }
        }
      });
      fitBubbleToWrappedText();
      onUpdate({
        html: textEditableRef.current.innerHTML,
        text: textEditableRef.current.innerText,
      });
    }
  };

  const handleBlur = () => {
    handleInput();
  };

  const toggleAlign = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextAlign =
      bubble.align === 'left' ? 'right' : bubble.align === 'right' ? 'center' : 'left';
    onUpdate({
      align: nextAlign,
    });
  };

  // Corner rule:
  // When hasTail is on: Left has Top-left sharp (0px), Right has Top-right sharp (0px)
  // When hasTail is off: All 4 corners rounded
  const getBorderRadius = () => {
    const r = bubble.borderRadius ?? 14;
    const hasTail = bubble.hasTail !== undefined ? bubble.hasTail : bubble.align !== 'center';
    if (!hasTail) {
      return `${r}px ${r}px ${r}px ${r}px`;
    }
    if (bubble.align === 'right') {
      return `${r}px 0px ${r}px ${r}px`;
    }
    return `0px ${r}px ${r}px ${r}px`;
  };

  const getBoxShadow = () => {
    const shadows: string[] = [];
    if (bubble.hasBottomShadow) {
      shadows.push(`0 4px 0 0 ${bubble.bottomShadowColor || '#b9a98e'}`);
    }
    if (bubble.hasShadow) {
      shadows.push('0 4px 14px -2px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.03)');
    }
    return shadows.length > 0 ? shadows.join(', ') : 'none';
  };

  // Fixed max-width limit to 95%
  const maxLimit = '95%';

  // Text decoration styles for base bubble
  const textDecorations: string[] = [];
  if (bubble.isStrikethrough) textDecorations.push('line-through');
  if (bubble.isUnderline) textDecorations.push('underline');

  const textStyle: React.CSSProperties = {
    fontFamily: bubble.fontFamily,
    fontSize: `${bubble.fontSize}px`,
    color: bubble.color,
    fontWeight: bubble.isBold ? 700 : 400,
    fontStyle: bubble.isItalic ? 'italic' : 'normal',
    textDecoration: textDecorations.join(' ') || 'none',
    textAlign: bubble.textAlign,
    letterSpacing: bubble.letterSpacing ? `${bubble.letterSpacing}px` : 'normal',
    lineHeight: bubble.lineHeight || 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
    width: '100%',
    display: 'block',
    outline: 'none',
    cursor: 'text',
  };

  const bubbleContainerStyle: React.CSSProperties = {
    backgroundColor: bubble.bgColor,
    borderRadius: getBorderRadius(),
    paddingTop: `${bubble.paddingY}px`,
    paddingBottom: `${bubble.paddingY}px`,
    paddingLeft: `${bubble.paddingX}px`,
    paddingRight: `${bubble.paddingX}px`,
    boxShadow: getBoxShadow(),
    border: bubble.hasBorder
      ? `1px solid ${bubble.borderColor || '#E5DED3'}`
      : 'none',
    width: 'max-content',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    alignSelf:
      bubble.align === 'left'
        ? 'flex-start'
        : bubble.align === 'right'
        ? 'flex-end'
        : 'center',
    width: 'fit-content',
    maxWidth: maxLimit,
  };

  return (
    <div
      ref={wrapperRef}
      id={`bubble-container-${bubble.id}`}
      style={wrapperStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveBeforeLongPress}
      onMouseUp={clearLongPressTimer}
      onMouseLeave={clearLongPressTimer}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative select-none transition-all ${
        isBeingDragged
          ? isDragCopyMode
            ? 'z-40 opacity-85 ring-2 ring-emerald-500 rounded-2xl'
            : 'z-40 opacity-45 scale-[0.98]'
          : isSelected
          ? 'z-30'
          : 'z-10'
      }`}
    >
      {/* Floating Action Menu on select */}
      {isSelected && !isExporting && (
        <div
          id={`bubble-actions-${bubble.id}`}
          className="absolute -top-10 left-0 z-40 flex items-center gap-1 whitespace-nowrap rounded-lg border border-stone-200 bg-white/95 px-2 py-1 shadow-md backdrop-blur-xs text-xs text-stone-600 print:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={toggleAlign}
            className="flex items-center gap-1 whitespace-nowrap shrink-0 rounded px-1.5 py-1 hover:bg-stone-100 text-stone-700 transition"
            title="말풍선 정렬 방향 전환 (좌측/우측/중앙)"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px]">
              {bubble.align === 'left'
                ? '좌측'
                : bubble.align === 'right'
                ? '우측'
                : '중앙'}
            </span>
          </button>
          <div className="h-3 w-[1px] shrink-0 bg-stone-200" />
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded p-1 shrink-0 hover:bg-stone-100 text-stone-700 transition"
            title="말풍선 복제"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 shrink-0 hover:bg-rose-50 text-rose-600 transition"
            title="말풍선 삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Floating Rich-Text Toolbar on dragged substring */}
      {isSelected && floatingToolbarPos && !isExporting && (
        <FloatingTextToolbar
          bubbleId={bubble.id}
          position={floatingToolbarPos}
          fonts={fonts}
          currentFontFamily={bubble.fontFamily}
          onUpdateContent={(newHtml, newText, newFontFamily) => {
            onUpdate({
              html: newHtml,
              text: newText,
              ...(newFontFamily ? { fontFamily: newFontFamily } : {}),
            });
          }}
          onClose={() => setFloatingToolbarPos(null)}
        />
      )}

      {/* Speaker name label if present */}
      {bubble.speaker && (
        <div
          className={`mb-1 text-xs font-semibold tracking-wide text-stone-600 ${
            bubble.align === 'right' ? 'text-right' : 'text-left'
          }`}
          style={{ fontFamily: bubble.fontFamily }}
        >
          {bubble.speaker}
        </div>
      )}

      {/* Speech bubble card */}
      <div
        ref={bubbleBoxRef}
        id={`bubble-box-${bubble.id}`}
        style={bubbleContainerStyle}
        className={`relative transition-shadow duration-150 ${
          isSelected && !isExporting
            ? 'ring-2 ring-amber-500/70 ring-offset-2 ring-offset-transparent'
            : 'hover:ring-1 hover:ring-stone-300'
        }`}
      >
        <div
          ref={textEditableRef}
          id={`bubble-text-${bubble.id}`}
          contentEditable={!isExporting}
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onMouseUp={checkSelection}
          onKeyUp={checkSelection}
          style={textStyle}
        />
      </div>
    </div>
  );
};
