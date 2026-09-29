import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { Bubble, CanvasConfig, WebFont } from '../types';
import { getColorLuminance } from '../data/presetFonts';
import { useRasterizedPaperTexture } from '../utils/paperTexture';
import { BubbleItem } from './BubbleItem';

interface CanvasCardProps {
  config: CanvasConfig;
  bubbles: Bubble[];
  selectedBubbleId: string | null;
  onSelectBubble: (id: string | null) => void;
  onUpdateBubble: (id: string, updated: Partial<Bubble>) => void;
  onDeleteBubble: (id: string) => void;
  onDuplicateBubble: (id: string) => void;
  onMoveOrCopyBubble?: (
    bubbleId: string,
    targetIndex: number,
    targetAlign: 'left' | 'right' | 'center',
    isCopy: boolean
  ) => void;
  fonts?: WebFont[];
  isExporting?: boolean;
}

interface DragState {
  bubbleId: string;
  sourceIndex: number;
  targetIndex: number;
  targetAlign: 'left' | 'right' | 'center';
  isCopy: boolean;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  hasMoved: boolean;
}

export const CanvasCard = forwardRef<HTMLDivElement, CanvasCardProps>(
  (
    {
      config,
      bubbles,
      selectedBubbleId,
      onSelectBubble,
      onUpdateBubble,
      onDeleteBubble,
      onDuplicateBubble,
      onMoveOrCopyBubble,
      fonts = [],
      isExporting = false,
    },
    ref
  ) => {
    const bubblesAreaRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const pointerDownInsideBubbleRef = useRef<boolean>(false);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const dragStateRef = useRef<DragState | null>(null);

    const updateDragState = useCallback((next: DragState | null) => {
      dragStateRef.current = next;
      setDragState(next);
    }, []);

    const handleStartLongPressDrag = useCallback(
      (bubbleId: string, clientX: number, clientY: number, altKey: boolean) => {
        const idx = bubbles.findIndex((b) => b.id === bubbleId);
        if (idx === -1) return;
        const sourceBubble = bubbles[idx];
        const initial: DragState = {
          bubbleId,
          sourceIndex: idx,
          targetIndex: idx,
          targetAlign: sourceBubble.align,
          isCopy: altKey,
          startX: clientX,
          startY: clientY,
          clientX,
          clientY,
          hasMoved: false,
        };
        updateDragState(initial);
      },
      [bubbles, updateDragState]
    );

    useEffect(() => {
      if (!dragState) return;

      const computeTargetSlotAndAlign = (clientX: number, clientY: number, current: DragState) => {
        let nextIndex = current.targetIndex;
        let nextAlign = current.targetAlign;

        const areaEl = bubblesAreaRef.current;
        if (areaEl) {
          const rowEls = Array.from(
            areaEl.querySelectorAll<HTMLElement>('[data-bubble-row-index]')
          );
          let slot = rowEls.length;
          for (let i = 0; i < rowEls.length; i++) {
            const rect = rowEls[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (clientY < midY) {
              slot = i;
              break;
            }
          }
          nextIndex = slot;
        }

        const stageEl = stageRef.current || areaEl;
        const dx = Math.abs(clientX - current.startX);
        if (stageEl && dx >= 28) {
          const stageRect = stageEl.getBoundingClientRect();
          if (stageRect.width > 0) {
            const relX = (clientX - stageRect.left) / stageRect.width;
            if (relX < 0.36) {
              nextAlign = 'left';
            } else if (relX > 0.64) {
              nextAlign = 'right';
            } else {
              nextAlign = 'center';
            }
          }
        } else {
          const srcBubble = bubbles[current.sourceIndex];
          if (srcBubble) {
            nextAlign = srcBubble.align;
          }
        }

        return { nextIndex, nextAlign };
      };

      const handleWindowMouseMove = (e: MouseEvent) => {
        const current = dragStateRef.current;
        if (!current) return;
        const movedDist = Math.hypot(
          e.clientX - current.startX,
          e.clientY - current.startY
        );
        const hasMoved = current.hasMoved || movedDist > 4;
        const { nextIndex, nextAlign } = computeTargetSlotAndAlign(
          e.clientX,
          e.clientY,
          current
        );
        updateDragState({
          ...current,
          clientX: e.clientX,
          clientY: e.clientY,
          targetIndex: nextIndex,
          targetAlign: nextAlign,
          isCopy: e.altKey,
          hasMoved,
        });
      };

      const handleWindowKeyChange = (e: KeyboardEvent) => {
        const current = dragStateRef.current;
        if (!current) return;
        if (current.isCopy !== e.altKey) {
          updateDragState({
            ...current,
            isCopy: e.altKey,
          });
        }
      };

      const handleWindowMouseUp = (e: MouseEvent) => {
        const current = dragStateRef.current;
        updateDragState(null);
        if (!current || !current.hasMoved) return;
        const finalIsCopy = e.altKey || current.isCopy;
        if (onMoveOrCopyBubble) {
          onMoveOrCopyBubble(
            current.bubbleId,
            current.targetIndex,
            current.targetAlign,
            finalIsCopy
          );
        }
      };

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      window.addEventListener('keydown', handleWindowKeyChange);
      window.addEventListener('keyup', handleWindowKeyChange);

      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
        window.removeEventListener('keydown', handleWindowKeyChange);
        window.removeEventListener('keyup', handleWindowKeyChange);
      };
    }, [dragState !== null, bubbles, onMoveOrCopyBubble, updateDragState]);
    const bgLuminance = getColorLuminance(config.bgColor);
    const threshold = 45;
    const isDarkBg = bgLuminance <= threshold;
    // How deep into the dark range the background is (0.25 at threshold -> 1.0 at pure black)
    const darkDepth = isDarkBg
      ? Math.min(1, Math.max(0.25, (threshold - bgLuminance + 10) / Math.max(15, threshold)))
      : 0;

    const textureLayer = useRasterizedPaperTexture(
      config.bgColor,
      config.paperTexture
    );

    return (
      <div
        id="card-capture-target"
        ref={ref}
        onMouseDownCapture={(e) => {
          const target = e.target as HTMLElement;
          pointerDownInsideBubbleRef.current = Boolean(
            target.closest('[id^="bubble-container-"]') ||
              target.closest('#floating-text-toolbar')
          );
        }}
        onClick={(e) => {
          if (pointerDownInsideBubbleRef.current) {
            pointerDownInsideBubbleRef.current = false;
            e.stopPropagation();
            return;
          }
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed && sel.toString().length > 0) {
            e.stopPropagation();
            return;
          }
          onSelectBubble(null);
        }}
        style={{
          width: `${config.width}px`,
          minHeight: `${config.minHeight}px`,
          backgroundColor: config.bgColor,
          paddingLeft: `${config.paddingX}px`,
          paddingRight: `${config.paddingX}px`,
          paddingTop: `${config.paddingY}px`,
          paddingBottom: `${config.paddingY}px`,
          isolation: 'isolate',
        }}
        className="relative flex flex-col justify-between overflow-hidden shadow-xl transition-all select-none"
      >
        {/* 0. 사용자 기기에서 선택한 카드 배경 이미지 */}
        {config.bgImageUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("${config.bgImageUrl}")`,
              backgroundSize:
                config.bgImageFit === 'contain'
                  ? 'contain'
                  : config.bgImageFit === 'repeat'
                  ? 'auto'
                  : 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: config.bgImageFit === 'repeat' ? 'repeat' : 'no-repeat',
              opacity: config.bgImageOpacity ?? 1,
            }}
          />
        )}

        {/* 1~4. 종이 질감 효과 (한지 결 / 원고지 모눈 / 빈티지 질감 / 구겨진 종이) — PNG 타일로 래스터화하여 저장·복사 시 100% 동일 출력 */}
        {config.paperTexture !== 'none' &&
          config.paperTexture !== 'custom' &&
          textureLayer.tileDataUrl && (
            <>
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url("${textureLayer.tileDataUrl}")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: textureLayer.backgroundSize,
                }}
              />
              {textureLayer.vignetteCss && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: textureLayer.vignetteCss,
                  }}
                />
              )}
            </>
          )}

        {/* 5. 사용자 지정 직접 가져온 텍스처 (이미지 파일 또는 URL) */}
        {config.paperTexture === 'custom' && config.customTextureUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("${config.customTextureUrl}")`,
              backgroundRepeat: config.customTextureRepeat === 'cover' ? 'no-repeat' : 'repeat',
              backgroundSize: config.customTextureRepeat === 'cover' ? 'cover' : 'auto',
              backgroundPosition: 'center',
              opacity: isDarkBg
                ? Math.min(0.95, (config.customTextureOpacity ?? 0.18) * (1.25 + darkDepth * 0.35))
                : config.customTextureOpacity ?? 0.18,
              mixBlendMode:
                isDarkBg && (config.customTextureBlendMode || 'multiply') === 'multiply'
                  ? 'screen'
                  : config.customTextureBlendMode || 'multiply',
              filter:
                isDarkBg && (config.customTextureBlendMode || 'multiply') === 'multiply'
                  ? 'invert(1) contrast(1.2)'
                  : undefined,
            }}
          />
        )}

        {/* Symmetric Centered Dialogue Stage */}
        <div
          id="canvas-dialogue-stage"
          ref={stageRef}
          className="relative z-10 mx-auto flex w-full flex-1 flex-col justify-between"
          style={{
            width: `${config.dividerWidth || 88}%`,
            maxWidth: '100%',
          }}
        >
          {/* Top Decorative Section */}
          <div className="relative w-full">
            {config.showHeader && config.headerText && (
              <div
                className="mb-3 text-xs tracking-widest whitespace-pre-wrap"
                style={{
                  fontFamily: config.headerFontFamily || "'Noto Serif KR', serif",
                  color: config.headerColor || '#78716c',
                  textAlign: config.headerAlign || 'center',
                }}
              >
                {config.headerText}
              </div>
            )}

            {config.showDividers && (
              <div className="w-full pb-6">
                {config.dividerStyle === 'double' ? (
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      borderTop: `1px solid ${config.dividerColor}`,
                      borderBottom: `1px solid ${config.dividerColor}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      borderColor: config.dividerColor,
                      borderTopWidth: '1px',
                      borderTopStyle: config.dividerStyle === 'dashed' ? 'dashed' : 'solid',
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Bubbles Area: Fixed to Auto-Flow Layout */}
          <div
            id="canvas-bubbles-area"
            ref={bubblesAreaRef}
            className="relative flex w-full flex-col"
          >
            {bubbles.map((bubble, idx) => {
              const showDropIndicatorBefore =
                dragState &&
                dragState.hasMoved &&
                dragState.targetIndex === idx;
              const showDropIndicatorAfter =
                dragState &&
                dragState.hasMoved &&
                idx === bubbles.length - 1 &&
                dragState.targetIndex === bubbles.length;

              const renderDropIndicator = (keySuffix: string) => {
                if (!dragState) return null;
                const alignLabel =
                  dragState.targetAlign === 'left'
                    ? '좌측 정렬'
                    : dragState.targetAlign === 'right'
                    ? '우측 정렬'
                    : '중앙 정렬';
                const justifyCls =
                  dragState.targetAlign === 'left'
                    ? 'justify-start'
                    : dragState.targetAlign === 'right'
                    ? 'justify-end'
                    : 'justify-center';

                return (
                  <div
                    key={`drop-ind-${keySuffix}`}
                    className={`my-2 flex w-full items-center ${justifyCls} pointer-events-none transition-all`}
                  >
                    <div
                      className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-3.5 py-2 text-xs font-semibold shadow-sm ${
                        dragState.isCopy
                          ? 'border-emerald-500 bg-emerald-50/90 text-emerald-800'
                          : 'border-amber-500 bg-amber-50/90 text-amber-900'
                      }`}
                    >
                      <span>
                        {dragState.isCopy ? '여기에 말풍선 복사 (+Alt)' : '여기로 말풍선 위치 이동'}
                      </span>
                      <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium">
                        {alignLabel}
                      </span>
                    </div>
                  </div>
                );
              };

              return (
                <React.Fragment key={bubble.id}>
                  {showDropIndicatorBefore && renderDropIndicator(`before-${idx}`)}
                  <div
                    data-bubble-row-index={idx}
                    style={{
                      marginBottom: idx !== bubbles.length - 1 ? `${config.bubbleSpacing}px` : 0,
                      display: 'flex',
                      justifyContent:
                        bubble.align === 'left'
                          ? 'flex-start'
                          : bubble.align === 'right'
                          ? 'flex-end'
                          : 'center',
                      width: '100%',
                    }}
                  >
                    <BubbleItem
                      bubble={bubble}
                      isSelected={!isExporting && selectedBubbleId === bubble.id}
                      onSelect={() => onSelectBubble(bubble.id)}
                      onUpdate={(updated) => onUpdateBubble(bubble.id, updated)}
                      onDelete={() => onDeleteBubble(bubble.id)}
                      onDuplicate={() => onDuplicateBubble(bubble.id)}
                      onStartLongPressDrag={handleStartLongPressDrag}
                      isBeingDragged={dragState?.bubbleId === bubble.id}
                      isDragCopyMode={Boolean(
                        dragState?.bubbleId === bubble.id && dragState?.isCopy
                      )}
                      canvasWidth={config.width}
                      fonts={fonts}
                      isExporting={isExporting}
                    />
                  </div>
                  {showDropIndicatorAfter && renderDropIndicator(`after-${idx}`)}
                </React.Fragment>
              );
            })}

            {bubbles.length === 0 && (
              <div className="flex h-64 items-center justify-center text-sm text-stone-400">
                말풍선이 없습니다. 상단 메뉴에서 &apos;말풍선 추가&apos; 또는 &apos;텍스트 일괄 변환&apos;을 눌러보세요.
              </div>
            )}
          </div>

          {dragState && !isExporting && (
            <div
              style={{
                position: 'fixed',
                top: `${dragState.clientY + 16}px`,
                left: `${dragState.clientX + 16}px`,
                zIndex: 9999,
              }}
              className={`pointer-events-none flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-xs ${
                dragState.isCopy
                  ? 'bg-emerald-700/95 text-white ring-1 ring-emerald-400'
                  : 'bg-stone-900/95 text-white ring-1 ring-amber-400/80'
              }`}
            >
              <span>
                {dragState.isCopy
                  ? '말풍선 복사 모드 (Alt)'
                  : '말풍선 위치 이동 중 (Alt 누르면 복사)'}
              </span>
            </div>
          )}

          {/* Bottom Decorative Section */}
          <div className="relative w-full">
            {config.showDividers && (
              <div className="w-full pt-6">
                {config.dividerStyle === 'double' ? (
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      borderTop: `1px solid ${config.dividerColor}`,
                      borderBottom: `1px solid ${config.dividerColor}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      borderColor: config.dividerColor,
                      borderTopWidth: '1px',
                      borderTopStyle: config.dividerStyle === 'dashed' ? 'dashed' : 'solid',
                    }}
                  />
                )}
              </div>
            )}

            {config.showFooter && config.footerText && (
              <div
                className="mt-3 text-xs tracking-widest whitespace-pre-wrap"
                style={{
                  fontFamily: config.footerFontFamily || "'Noto Serif KR', serif",
                  color: config.footerColor || '#78716c',
                  textAlign: config.footerAlign || 'center',
                }}
              >
                {config.footerText}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CanvasCard.displayName = 'CanvasCard';
