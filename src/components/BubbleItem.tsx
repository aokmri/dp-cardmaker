import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Trash2, Copy, ArrowLeftRight, GripVertical } from 'lucide-react';
import { Bubble, WebFont } from '../types';
import { FloatingTextToolbar } from './FloatingTextToolbar';
import { recordSelection, getSelectionWithinBubble } from '../utils/richText';
import { buildPasteContentFromClipboard } from '../utils/pasteFormatter';
import { CloudBubbleBackground } from '../utils/cloudBubble';

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
  const insideMetaRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTextDraggingRef = useRef<boolean>(false);
  const isPointerDownInBubbleRef = useRef<boolean>(false);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [boxSize, setBoxSize] = useState<{ width: number; height: number }>({
    width: 140,
    height: 52,
  });
  const [actionBarOffset, setActionBarOffset] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [isDraggingActionBar, setIsDraggingActionBar] = useState(false);

  const handleActionBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    const barEl = e.currentTarget.closest(
      `#bubble-actions-${bubble.id}`
    ) as HTMLElement | null;
    const rect = barEl?.getBoundingClientRect();
    const scale =
      barEl && barEl.offsetWidth > 0 && rect
        ? rect.width / barEl.offsetWidth
        : 1;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startOffsetX = actionBarOffset.x;
    const startOffsetY = actionBarOffset.y;

    setIsDraggingActionBar(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startClientX) / (scale || 1);
      const dy = (moveEvent.clientY - startClientY) / (scale || 1);
      setActionBarOffset({
        x: Math.round(startOffsetX + dx),
        y: Math.round(startOffsetY + dy),
      });
    };

    const handlePointerUp = () => {
      setIsDraggingActionBar(false);
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
    textEditableRef.current?.removeAttribute('data-ps-color-active');

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
    const sel = window.getSelection();
    if (
      Math.hypot(dx, dy) > 2 ||
      (sel && !sel.isCollapsed && sel.toString().length > 0)
    ) {
      isTextDraggingRef.current = true;
      clearLongPressTimer();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isExporting || e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(`#bubble-actions-${bubble.id}`) ||
      target.closest('#floating-text-toolbar')
    ) {
      return;
    }

    const activeSel = window.getSelection();
    if (activeSel && !activeSel.isCollapsed && activeSel.toString().length > 0) {
      clearLongPressTimer();
      return;
    }

    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    isPointerDownInBubbleRef.current = true;
    isTextDraggingRef.current = false;
    textEditableRef.current?.removeAttribute('data-ps-color-active');

    clearLongPressTimer();
    pointerStartRef.current = { x: startX, y: startY };

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
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
        onStartLongPressDrag(bubble.id, startX, startY, false);
      }
    }, 420);
  };

  const handleTouchMoveBeforeLongPress = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || longPressTimerRef.current === null) return;
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = touch.clientX - pointerStartRef.current.x;
    const dy = touch.clientY - pointerStartRef.current.y;
    const sel = window.getSelection();
    if (
      Math.hypot(dx, dy) > 8 ||
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

    const metaEl = insideMetaRef.current;
    const metaWidth = metaEl ? metaEl.offsetWidth : 0;
    const plainContent = (textEl.innerText || '').replace(/\n/g, '').trim();

    if (plainContent.length === 0) {
      const borderExtra = bubble.hasBorder ? 2 : 0;
      const activePadX =
        bubble.bubbleShape === 'cloud'
          ? (bubble.cloudPaddingX ?? 24)
          : bubble.paddingX;
      const placeholderWidth = Math.ceil(textEl.scrollWidth || bubble.fontSize * 4.8);
      const minEmptyInnerWidth = isExporting
        ? Math.max(metaWidth, 24)
        : Math.max(metaWidth, placeholderWidth);
      boxEl.style.width = `${minEmptyInnerWidth + activePadX * 2 + borderExtra}px`;
    } else if (minLeft < Infinity && maxRight > minLeft) {
      const tightTextWidth = (maxRight - minLeft) / scale;
      const requiredInnerWidth = Math.max(tightTextWidth, metaWidth);
      if (requiredInnerWidth > 0 && requiredInnerWidth < elClientWidth - 1) {
        const borderExtra = bubble.hasBorder ? 2 : 0;
        const activePadX =
          bubble.bubbleShape === 'cloud'
            ? (bubble.cloudPaddingX ?? 24)
            : bubble.paddingX;
        let targetBoxWidth =
          Math.ceil(requiredInnerWidth + 1) + activePadX * 2 + borderExtra;
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

    const measuredW = boxEl.offsetWidth;
    const measuredH = boxEl.offsetHeight;
    if (measuredW > 0 && measuredH > 0) {
      setBoxSize((prev) =>
        prev.width === measuredW && prev.height === measuredH
          ? prev
          : { width: measuredW, height: measuredH }
      );
    }
  }, [bubble.bubbleShape, bubble.cloudPaddingX, bubble.hasBorder, bubble.paddingX, isExporting]);

  // Sync initial or updated html into contentEditable without interrupting typing, then fit width
  useLayoutEffect(() => {
    const el = textEditableRef.current;
    if (el) {
      const targetHtml = bubble.html || formatInitialTextToHtml(bubble.text);
      const isFocused = document.activeElement === el;
      const currentClean = el.innerHTML === '<br>' ? '' : el.innerHTML;
      const targetClean = targetHtml === '<br>' ? '' : targetHtml;
      if (currentClean !== targetClean && !(isFocused && targetClean === '' && el.innerHTML === '<br>')) {
        el.innerHTML = targetHtml;
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
    bubble.cloudPaddingX,
    bubble.cloudPaddingY,
    bubble.cloudBorderRadius,
    bubble.hasBorder,
    bubble.bubbleShape,
    bubble.align,
    bubble.showMeta,
    bubble.speaker,
    bubble.dateText,
    bubble.metaTheme,
    bubble.metaFontFamily,
    bubble.metaColor,
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
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.closest('#floating-text-toolbar') ||
          activeEl.closest('#inspector-sidebar') ||
          activeEl.closest('#mobile-bottom-toolbar') ||
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'SELECT')
      ) {
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        textEditableRef.current?.removeAttribute('data-ps-color-active');
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
      const rawHtml = textEditableRef.current.innerHTML;
      const rawText = textEditableRef.current.innerText;
      const isEffectivelyEmpty =
        rawText.replace(/\n/g, '').trim().length === 0 &&
        (rawHtml === '' || rawHtml === '<br>');
      onUpdate({
        html: isEffectivelyEmpty ? '' : rawHtml,
        text: isEffectivelyEmpty ? '' : rawText,
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');
    if (!htmlData && !plainText) return;

    const { fragment, lastNode } = buildPasteContentFromClipboard(
      htmlData,
      plainText
    );

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(fragment);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    if (textEditableRef.current) {
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

  const isBubbleTextEmpty =
    !bubble.text || bubble.text.replace(/\n/g, '').trim().length === 0;
  const minLineHeightPx = Math.max(
    20,
    Math.round(bubble.fontSize * (bubble.lineHeight || 1.6))
  );

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
    minHeight: `${minLineHeightPx}px`,
    minWidth: !isExporting && isBubbleTextEmpty ? '64px' : '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
    width: '100%',
    display: 'block',
    outline: 'none',
    cursor: 'text',
    transform: bubble.textOffsetY ? `translateY(${bubble.textOffsetY}px)` : undefined,
  };

  const isCloudShape = bubble.bubbleShape === 'cloud';
  const effectiveHasTail =
    bubble.hasTail !== undefined ? bubble.hasTail : bubble.align !== 'center';
  const effectiveBorderRadius = isCloudShape
    ? (bubble.cloudBorderRadius ?? 14)
    : (bubble.borderRadius ?? 14);
  const effectivePaddingY = isCloudShape
    ? (bubble.cloudPaddingY ?? 8)
    : bubble.paddingY;
  const effectivePaddingX = isCloudShape
    ? (bubble.cloudPaddingX ?? 24)
    : bubble.paddingX;

  const bubbleContainerStyle: React.CSSProperties = {
    backgroundColor: isCloudShape ? 'transparent' : bubble.bgColor,
    borderRadius: isCloudShape ? `${effectiveBorderRadius}px` : getBorderRadius(),
    paddingTop: `${effectivePaddingY}px`,
    paddingBottom: `${effectivePaddingY}px`,
    paddingLeft: `${effectivePaddingX}px`,
    paddingRight: `${effectivePaddingX}px`,
    boxShadow: isCloudShape ? 'none' : getBoxShadow(),
    border:
      !isCloudShape && bubble.hasBorder
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMoveBeforeLongPress}
      onTouchEnd={clearLongPressTimer}
      onTouchCancel={clearLongPressTimer}
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
          style={{
            transform: `translate(${actionBarOffset.x}px, ${actionBarOffset.y}px)`,
          }}
          className={`absolute -top-10 left-0 z-50 flex items-center gap-1 whitespace-nowrap rounded-lg border bg-white/95 px-1.5 py-1 shadow-md backdrop-blur-xs text-xs text-stone-600 print:hidden ${
            isDraggingActionBar
              ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-lg'
              : 'border-stone-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            role="button"
            tabIndex={0}
            onPointerDown={handleActionBarPointerDown}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setActionBarOffset({ x: 0, y: 0 });
            }}
            className="flex items-center justify-center rounded px-0.5 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:text-stone-900 cursor-grab active:cursor-grabbing touch-none select-none transition"
            title="드래그하여 보조옵션 바 위치 이동 (더블클릭 시 기본 위치로 초기화)"
          >
            <GripVertical className="h-3.5 w-3.5 shrink-0" />
          </div>
          <div className="h-3 w-[1px] shrink-0 bg-stone-200" />
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

      {/* Theme 1 ('outside'): Speaker name above bubble */}
      {Boolean(bubble.showMeta ?? Boolean(bubble.speaker || bubble.dateText)) &&
        (bubble.metaTheme || 'inside') === 'outside' &&
        Boolean(bubble.speaker?.trim()) && (
          <div
            className={`mb-1.5 text-xs font-semibold tracking-wide leading-snug ${
              bubble.align === 'right'
                ? 'text-right'
                : bubble.align === 'center'
                ? 'text-center'
                : 'text-left'
            }`}
            style={{
              fontFamily:
                bubble.metaFontFamily || "'KimJeongCheolHandwriting', sans-serif",
              color:
                bubble.metaColor ||
                (bubble.align === 'right' ? '#cdaf77' : '#777674'),
            }}
          >
            {bubble.speaker?.trim()}
          </div>
        )}

      {/* Bubble + Outside Date Row (KakaoTalk layout when metaTheme === 'outside') */}
      <div
        className={`flex items-end gap-1.5 max-w-full ${
          bubble.align === 'right'
            ? 'justify-end'
            : bubble.align === 'center'
            ? 'justify-center'
            : 'justify-start'
        }`}
      >
        {Boolean(bubble.showMeta ?? Boolean(bubble.speaker || bubble.dateText)) &&
          (bubble.metaTheme || 'inside') === 'outside' &&
          Boolean(bubble.dateText?.trim()) &&
          bubble.align === 'right' && (
            <span
              className="shrink-0 whitespace-nowrap text-[11px] leading-none pb-0.5 select-none"
              style={{
                fontFamily:
                  bubble.metaFontFamily ||
                  "'KimJeongCheolHandwriting', sans-serif",
                color: bubble.metaColor || '#cdaf77',
              }}
            >
              {bubble.dateText?.trim()}
            </span>
          )}

        {/* Speech bubble card */}
        <div
          ref={bubbleBoxRef}
          id={`bubble-box-${bubble.id}`}
          style={bubbleContainerStyle}
          onClick={(e) => {
            if (isExporting) return;
            const target = e.target as HTMLElement;
            const textEl = textEditableRef.current;
            if (
              textEl &&
              target !== textEl &&
              !textEl.contains(target) &&
              !insideMetaRef.current?.contains(target)
            ) {
              textEl.focus();
              const sel = window.getSelection();
              if (sel) {
                const range = document.createRange();
                range.selectNodeContents(textEl);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }}
          className={`relative cursor-text transition-shadow duration-150 ${
            isSelected && !isExporting
              ? 'ring-2 ring-amber-500/70 ring-offset-2 ring-offset-transparent'
              : 'hover:ring-1 hover:ring-stone-300'
          }`}
        >
          {isCloudShape && (
            <CloudBubbleBackground
              width={boxSize.width}
              height={boxSize.height}
              bgColor={bubble.bgColor}
              borderRadius={effectiveBorderRadius}
              align={bubble.align}
              hasTail={effectiveHasTail}
              hasBorder={bubble.hasBorder}
              borderColor={bubble.borderColor}
              hasShadow={bubble.hasShadow}
              hasBottomShadow={bubble.hasBottomShadow}
              bottomShadowColor={bubble.bottomShadowColor}
            />
          )}

          <div
            ref={textEditableRef}
            id={`bubble-text-${bubble.id}`}
            contentEditable={!isExporting}
            suppressContentEditableWarning={true}
            data-empty={!isExporting && isBubbleTextEmpty ? 'true' : undefined}
            data-placeholder="내용 입력..."
            onInput={handleInput}
            onPaste={handlePaste}
            onBlur={handleBlur}
            onMouseUp={checkSelection}
            onKeyUp={checkSelection}
            style={{ ...textStyle, position: 'relative', zIndex: 1 }}
          />

          {/* Theme 2 ('inside'): Bottom divider line + Name • Date inside the bubble */}
          {Boolean(bubble.showMeta ?? Boolean(bubble.speaker || bubble.dateText)) &&
            (bubble.metaTheme || 'inside') === 'inside' &&
            Boolean(bubble.speaker?.trim() || bubble.dateText?.trim()) && (
              <div
                className="relative z-10 mt-1.5 pt-1 border-t select-none"
                style={{
                  borderColor:
                    bubble.hasBorder && bubble.borderColor
                      ? bubble.borderColor
                      : 'rgba(120, 113, 108, 0.22)',
                  textAlign:
                    bubble.align === 'right' ? 'right' : bubble.textAlign,
                }}
              >
                <div
                  ref={insideMetaRef}
                  className="inline-flex items-center whitespace-nowrap text-xs leading-snug"
                  style={{
                    fontFamily:
                      bubble.metaFontFamily ||
                      "'KimJeongCheolHandwriting', sans-serif",
                    color:
                      bubble.metaColor ||
                      (bubble.align === 'right' ? '#cdaf77' : '#777674'),
                  }}
                >
                  {bubble.speaker?.trim() && (
                    <span className="font-semibold">{bubble.speaker.trim()}</span>
                  )}
                  {bubble.speaker?.trim() && bubble.dateText?.trim() && (
                    <span className="mx-1.5 opacity-65">•</span>
                  )}
                  {bubble.dateText?.trim() && (
                    <span>{bubble.dateText.trim()}</span>
                  )}
                </div>
              </div>
            )}
        </div>

        {Boolean(bubble.showMeta ?? Boolean(bubble.speaker || bubble.dateText)) &&
          (bubble.metaTheme || 'inside') === 'outside' &&
          Boolean(bubble.dateText?.trim()) &&
          bubble.align !== 'right' && (
            <span
              className="shrink-0 whitespace-nowrap text-[11px] leading-none pb-0.5 select-none"
              style={{
                fontFamily:
                  bubble.metaFontFamily ||
                  "'KimJeongCheolHandwriting', sans-serif",
                color: bubble.metaColor || '#777674',
              }}
            >
              {bubble.dateText?.trim()}
            </span>
          )}
      </div>
    </div>
  );
};
