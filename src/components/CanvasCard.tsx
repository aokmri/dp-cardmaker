import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { Bubble, CanvasConfig, WebFont } from '../types';
import { getColorLuminance } from '../data/presetFonts';
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

    // Fixed texture intensities per preset:
    // 미세 한지 결: 15% (어두운 배경 5%), 빈티지 질감: 5%, 구겨진 종이: 5%, 원고지 모눈: 25%
    const intensity =
      config.paperTexture === 'paper'
        ? isDarkBg
          ? 0.05
          : 0.15
        : config.paperTexture === 'grain'
        ? 0.05
        : config.paperTexture === 'crumpled'
        ? 0.05
        : config.paperTexture === 'grid'
        ? 0.25
        : 0.15;

    // 1A. Light-bg Hanji SVG data URI (mulberry fibers + high-contrast dark pulp relief)
    const hanjiSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='hanjiPulp'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04 0.22' numOctaves='3' seed='4' stitchTiles='stitch' result='fibers'/%3E%3CfeColorMatrix in='fibers' type='matrix' values='0 0 0 0 0.28  0 0 0 0 0.21  0 0 0 0 0.14  2.4 -0.9 0 -0.42 0' result='fiberAlpha'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' seed='11' stitchTiles='stitch' result='finePulp'/%3E%3CfeColorMatrix in='finePulp' type='matrix' values='0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0 0.12  2.1 -0.7 0 -0.45 0' result='pulpAlpha'/%3E%3CfeMerge%3E%3CfeMergeNode in='fiberAlpha'/%3E%3CfeMergeNode in='pulpAlpha'/%3E%3C/feMerge%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23hanjiPulp)' opacity='0.72'/%3E%3Cg stroke='%23594532' stroke-linecap='round' fill='none' opacity='0.55'%3E%3Cpath d='M12 28 Q34 22 58 31' stroke-width='0.7'/%3E%3Cpath d='M140 18 Q168 29 195 21' stroke-width='0.55'/%3E%3Cpath d='M78 64 Q96 52 122 60' stroke-width='0.65'/%3E%3Cpath d='M22 112 Q55 124 84 115' stroke-width='0.5'/%3E%3Cpath d='M154 95 Q182 82 214 98' stroke-width='0.75'/%3E%3Cpath d='M45 170 Q72 158 104 172' stroke-width='0.6'/%3E%3Cpath d='M132 156 Q165 172 198 160' stroke-width='0.55'/%3E%3Cpath d='M18 216 Q48 205 76 220' stroke-width='0.65'/%3E%3Cpath d='M162 212 Q192 226 225 210' stroke-width='0.6'/%3E%3Cpath d='M95 14 Q108 42 98 68' stroke-width='0.45'/%3E%3Cpath d='M208 42 Q194 74 212 102' stroke-width='0.5'/%3E%3Cpath d='M62 128 Q48 156 66 184' stroke-width='0.45'/%3E%3C/g%3E%3Cg fill='%234A3828' opacity='0.45'%3E%3Ccircle cx='42' cy='48' r='0.9'/%3E%3Ccircle cx='184' cy='56' r='1.1'/%3E%3Ccircle cx='118' cy='104' r='0.8'/%3E%3Ccircle cx='28' cy='154' r='1.0'/%3E%3Ccircle cx='168' cy='138' r='0.85'/%3E%3Ccircle cx='92' cy='198' r='1.1'/%3E%3Ccircle cx='215' cy='186' r='0.75'/%3E%3C/g%3E%3C/svg%3E")`;

    // 1B. Dark-bg Hanji SVG data URI (silver-ivory mulberry fibers & luminous pulp relief for dark/black paper)
    const hanjiDarkSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='hanjiPulpDark'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04 0.22' numOctaves='3' seed='4' stitchTiles='stitch' result='fibers'/%3E%3CfeColorMatrix in='fibers' type='matrix' values='0 0 0 0 0.88  0 0 0 0 0.83  0 0 0 0 0.75  2.2 -0.8 0 -0.45 0' result='fiberAlpha'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' seed='11' stitchTiles='stitch' result='finePulp'/%3E%3CfeColorMatrix in='finePulp' type='matrix' values='0 0 0 0 0.82  0 0 0 0 0.77  0 0 0 0 0.68  1.9 -0.65 0 -0.48 0' result='pulpAlpha'/%3E%3CfeMerge%3E%3CfeMergeNode in='fiberAlpha'/%3E%3CfeMergeNode in='pulpAlpha'/%3E%3C/feMerge%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23hanjiPulpDark)' opacity='0.68'/%3E%3Cg stroke='%23EAE0D0' stroke-linecap='round' fill='none' opacity='0.65'%3E%3Cpath d='M12 28 Q34 22 58 31' stroke-width='0.75'/%3E%3Cpath d='M140 18 Q168 29 195 21' stroke-width='0.6'/%3E%3Cpath d='M78 64 Q96 52 122 60' stroke-width='0.7'/%3E%3Cpath d='M22 112 Q55 124 84 115' stroke-width='0.55'/%3E%3Cpath d='M154 95 Q182 82 214 98' stroke-width='0.8'/%3E%3Cpath d='M45 170 Q72 158 104 172' stroke-width='0.65'/%3E%3Cpath d='M132 156 Q165 172 198 160' stroke-width='0.6'/%3E%3Cpath d='M18 216 Q48 205 76 220' stroke-width='0.7'/%3E%3Cpath d='M162 212 Q192 226 225 210' stroke-width='0.65'/%3E%3Cpath d='M95 14 Q108 42 98 68' stroke-width='0.5'/%3E%3Cpath d='M208 42 Q194 74 212 102' stroke-width='0.55'/%3E%3Cpath d='M62 128 Q48 156 66 184' stroke-width='0.5'/%3E%3C/g%3E%3Cg fill='%23DFD3C0' opacity='0.55'%3E%3Ccircle cx='42' cy='48' r='0.95'/%3E%3Ccircle cx='184' cy='56' r='1.15'/%3E%3Ccircle cx='118' cy='104' r='0.85'/%3E%3Ccircle cx='28' cy='154' r='1.05'/%3E%3Ccircle cx='168' cy='138' r='0.9'/%3E%3Ccircle cx='92' cy='198' r='1.15'/%3E%3Ccircle cx='215' cy='186' r='0.8'/%3E%3C/g%3E%3C/svg%3E")`;

    // 2A. Light-bg Vintage Grain SVG data URI
    const vintageGrainSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='vintagePaper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.035' numOctaves='4' seed='9' stitchTiles='stitch' result='mottle'/%3E%3CfeColorMatrix in='mottle' type='matrix' values='0 0 0 0 0.34  0 0 0 0 0.24  0 0 0 0 0.14  2.5 -0.8 0 -0.48 0' result='mottleAlpha'/%3E%3CfeTurbulence type='turbulence' baseFrequency='0.82' numOctaves='4' seed='23' stitchTiles='stitch' result='coarseGrain'/%3E%3CfeColorMatrix in='coarseGrain' type='matrix' values='0 0 0 0 0.22  0 0 0 0 0.16  0 0 0 0 0.09  2.8 -1.0 0 -0.52 0' result='grainAlpha'/%3E%3CfeMerge%3E%3CfeMergeNode in='mottleAlpha'/%3E%3CfeMergeNode in='grainAlpha'/%3E%3C/feMerge%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23vintagePaper)' opacity='0.88'/%3E%3Cg fill='%233E2C1C' opacity='0.55'%3E%3Ccircle cx='34' cy='26' r='1.2'/%3E%3Ccircle cx='156' cy='42' r='0.95'/%3E%3Ccircle cx='88' cy='78' r='1.35'/%3E%3Ccircle cx='192' cy='118' r='1.1'/%3E%3Ccircle cx='46' cy='142' r='1.25'/%3E%3Ccircle cx='124' cy='176' r='1.0'/%3E%3Ccircle cx='178' cy='198' r='1.3'/%3E%3Ccircle cx='22' cy='202' r='0.9'/%3E%3C/g%3E%3C/svg%3E")`;

    // 2B. Dark-bg Vintage Grain SVG data URI (weathered antique dust + warm sepia-ivory mottling for dark backgrounds)
    const vintageGrainDarkSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='vintagePaperDark'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.035' numOctaves='4' seed='9' stitchTiles='stitch' result='mottle'/%3E%3CfeColorMatrix in='mottle' type='matrix' values='0 0 0 0 0.84  0 0 0 0 0.76  0 0 0 0 0.64  2.3 -0.75 0 -0.48 0' result='mottleAlpha'/%3E%3CfeTurbulence type='turbulence' baseFrequency='0.82' numOctaves='4' seed='23' stitchTiles='stitch' result='coarseGrain'/%3E%3CfeColorMatrix in='coarseGrain' type='matrix' values='0 0 0 0 0.90  0 0 0 0 0.84  0 0 0 0 0.74  2.6 -0.95 0 -0.52 0' result='grainAlpha'/%3E%3CfeMerge%3E%3CfeMergeNode in='mottleAlpha'/%3E%3CfeMergeNode in='grainAlpha'/%3E%3C/feMerge%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23vintagePaperDark)' opacity='0.82'/%3E%3Cg fill='%23E8DCCB' opacity='0.6'%3E%3Ccircle cx='34' cy='26' r='1.2'/%3E%3Ccircle cx='156' cy='42' r='0.95'/%3E%3Ccircle cx='88' cy='78' r='1.35'/%3E%3Ccircle cx='192' cy='118' r='1.1'/%3E%3Ccircle cx='46' cy='142' r='1.25'/%3E%3Ccircle cx='124' cy='176' r='1.0'/%3E%3Ccircle cx='178' cy='198' r='1.3'/%3E%3Ccircle cx='22' cy='202' r='0.9'/%3E%3C/g%3E%3C/svg%3E")`;

    // 3A. Light-bg 3D Crumpled Paper SVG data URI (pure organic multi-scale crinkle relief, no straight lines)
    const crumpledPaperSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 360 360' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='crumpleRelief' x='0%25' y='0%25' width='100%25' height='100%25'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.015 0.018' numOctaves='5' seed='19' stitchTiles='stitch' result='macroCrumple'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.048' numOctaves='4' seed='7' stitchTiles='stitch' result='microWrinkle'/%3E%3CfeDisplacementMap in='macroCrumple' in2='microWrinkle' scale='16' xChannelSelector='R' yChannelSelector='G' result='warpedCrumple'/%3E%3CfeDiffuseLighting in='warpedCrumple' lighting-color='%23ffffff' surfaceScale='9.5' diffuseConstant='1.05' result='litFacets'%3E%3CfeDistantLight azimuth='135' elevation='38'/%3E%3C/feDiffuseLighting%3E%3CfeColorMatrix in='litFacets' type='matrix' values='0.33 0.33 0.33 0 0  0.31 0.31 0.31 0 0  0.28 0.28 0.28 0 0  0 0 0 1 0' result='warmShadow'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23crumpleRelief)'/%3E%3C/svg%3E")`;

    // 3B. Fine secondary crinkle detail layer (organic micro-folds & paper grain)
    const crumpledMicroSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 260 260' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='crumpleMicro' x='0%25' y='0%25' width='100%25' height='100%25'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.036' numOctaves='4' seed='31' stitchTiles='stitch' result='fineFolds'/%3E%3CfeDiffuseLighting in='fineFolds' lighting-color='%23ffffff' surfaceScale='5.5' diffuseConstant='1.1' result='fineLit'%3E%3CfeDistantLight azimuth='315' elevation='44'/%3E%3C/feDiffuseLighting%3E%3CfeColorMatrix in='fineLit' type='matrix' values='0.33 0.33 0.33 0 0  0.31 0.31 0.31 0 0  0.28 0.28 0.28 0 0  0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23crumpleMicro)'/%3E%3C/svg%3E")`;

    // 3C. Dark-bg 3D Crumpled Paper SVG data URI (pure organic specular fold highlights for dark/black paper)
    const crumpledPaperDarkSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 360 360' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='crumpleReliefDark' x='0%25' y='0%25' width='100%25' height='100%25'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.015 0.018' numOctaves='5' seed='19' stitchTiles='stitch' result='macroCrumple'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.048' numOctaves='4' seed='7' stitchTiles='stitch' result='microWrinkle'/%3E%3CfeDisplacementMap in='macroCrumple' in2='microWrinkle' scale='16' xChannelSelector='R' yChannelSelector='G' result='warpedCrumple'/%3E%3CfeDiffuseLighting in='warpedCrumple' lighting-color='%23f5efe6' surfaceScale='10' diffuseConstant='0.95' result='litFacets'%3E%3CfeDistantLight azimuth='135' elevation='25'/%3E%3C/feDiffuseLighting%3E%3CfeColorMatrix in='litFacets' type='matrix' values='0 0 0 0 0.88  0 0 0 0 0.84  0 0 0 0 0.78  1.5 0 0 -0.58 0' result='highlightAlpha'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23crumpleReliefDark)' opacity='0.88'/%3E%3C/svg%3E")`;

    // 3D. Dark-bg fine secondary crinkle detail layer
    const crumpledMicroDarkSvgDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 260 260' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='crumpleMicroDark' x='0%25' y='0%25' width='100%25' height='100%25'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.036' numOctaves='4' seed='31' stitchTiles='stitch' result='fineFolds'/%3E%3CfeDiffuseLighting in='fineFolds' lighting-color='%23efe6d8' surfaceScale='6.5' diffuseConstant='0.95' result='fineLit'%3E%3CfeDistantLight azimuth='315' elevation='28'/%3E%3C/feDiffuseLighting%3E%3CfeColorMatrix in='fineLit' type='matrix' values='0 0 0 0 0.85  0 0 0 0 0.80  0 0 0 0 0.73  1.35 0 0 -0.56 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23crumpleMicroDark)' opacity='0.78'/%3E%3C/svg%3E")`;

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

        {/* 1. 미세 한지 결 (선명한 전통 한지 닥섬유 결 + 발 무늬 질감) */}
        {config.paperTexture === 'paper' && (
          <>
            <div
              className={`pointer-events-none absolute inset-0 ${
                isDarkBg ? 'mix-blend-screen' : 'mix-blend-multiply'
              }`}
              style={{
                opacity: isDarkBg
                  ? Math.min(0.95, Math.max(0.08, intensity * (0.56 + darkDepth * 0.28)))
                  : Math.min(0.95, Math.max(0.04, intensity * 0.68)),
                backgroundImage: isDarkBg ? hanjiDarkSvgDataUri : hanjiSvgDataUri,
                backgroundSize: '220px 220px',
              }}
            />
            <div
              className={`pointer-events-none absolute inset-0 ${
                isDarkBg ? 'mix-blend-screen' : 'mix-blend-multiply'
              }`}
              style={{
                opacity: isDarkBg
                  ? Math.min(0.55, Math.max(0.04, intensity * (0.24 + darkDepth * 0.14)))
                  : Math.min(0.45, Math.max(0.02, intensity * 0.22)),
                backgroundImage: isDarkBg
                  ? `
                  repeating-linear-gradient(0deg, rgba(232, 222, 206, 0.16) 0px, rgba(232, 222, 206, 0.16) 1px, transparent 1px, transparent 4px),
                  repeating-linear-gradient(90deg, rgba(232, 222, 206, 0.10) 0px, rgba(232, 222, 206, 0.10) 1px, transparent 1px, transparent 18px)
                `
                  : `
                  repeating-linear-gradient(0deg, rgba(90, 70, 48, 0.14) 0px, rgba(90, 70, 48, 0.14) 1px, transparent 1px, transparent 4px),
                  repeating-linear-gradient(90deg, rgba(90, 70, 48, 0.08) 0px, rgba(90, 70, 48, 0.08) 1px, transparent 1px, transparent 18px)
                `,
              }}
            />
          </>
        )}

        {/* 2. 원고지 모눈 (점자/모눈 효과 + 강도 조절 연동) */}
        {config.paperTexture === 'grid' && (
          <div
            className={`pointer-events-none absolute inset-0 ${
              isDarkBg ? 'mix-blend-screen' : 'mix-blend-multiply'
            }`}
            style={{
              opacity: isDarkBg
                ? Math.min(0.65, Math.max(0.04, intensity * (0.28 + darkDepth * 0.18)))
                : Math.min(0.35, Math.max(0.015, intensity * 0.18)),
              backgroundImage: isDarkBg
                ? `radial-gradient(#E8DFD1 0.9px, transparent 0.9px)`
                : `radial-gradient(#2C2520 0.85px, transparent 0.85px)`,
              backgroundSize: '8px 8px',
            }}
          />
        )}

        {/* 3. 빈티지 질감 (고서 양피지 입자 + 에이징 얼룩 & 비네팅 효과) */}
        {config.paperTexture === 'grain' && (
          <>
            <div
              className={`pointer-events-none absolute inset-0 ${
                isDarkBg ? 'mix-blend-screen' : 'mix-blend-multiply'
              }`}
              style={{
                opacity: isDarkBg
                  ? Math.min(0.95, Math.max(0.08, intensity * (0.62 + darkDepth * 0.26)))
                  : Math.min(0.95, Math.max(0.05, intensity * 0.76)),
                backgroundImage: isDarkBg ? vintageGrainDarkSvgDataUri : vintageGrainSvgDataUri,
                backgroundSize: '200px 200px',
              }}
            />
            <div
              className={`pointer-events-none absolute inset-0 ${
                isDarkBg ? 'mix-blend-screen' : 'mix-blend-multiply'
              }`}
              style={{
                opacity: isDarkBg
                  ? Math.min(0.75, Math.max(0.05, intensity * (0.38 + darkDepth * 0.2)))
                  : Math.min(0.85, Math.max(0.04, intensity * 0.55)),
                backgroundImage: isDarkBg
                  ? `radial-gradient(ellipse at center, rgba(224, 206, 178, 0.14) 0%, transparent 55%, rgba(214, 194, 166, 0.24) 100%)`
                  : `radial-gradient(ellipse at center, transparent 35%, rgba(102, 73, 42, 0.28) 100%)`,
              }}
            />
          </>
        )}

        {/* 4. 구겨진 종이 (자연스러운 구김 요철 + 미세 주름 음영 효과) */}
        {config.paperTexture === 'crumpled' && (
          <>
            <div
              className={`pointer-events-none absolute inset-0 ${
                isDarkBg ? 'mix-blend-screen' : 'mix-blend-multiply'
              }`}
              style={{
                opacity: isDarkBg
                  ? Math.min(0.95, Math.max(0.08, intensity * (0.58 + darkDepth * 0.28)))
                  : Math.min(0.92, Math.max(0.06, intensity * 0.65)),
                backgroundImage: isDarkBg ? crumpledPaperDarkSvgDataUri : crumpledPaperSvgDataUri,
                backgroundSize: '360px 360px',
              }}
            />
            <div
              className={`pointer-events-none absolute inset-0 ${
                isDarkBg ? 'mix-blend-screen' : 'mix-blend-multiply'
              }`}
              style={{
                opacity: isDarkBg
                  ? Math.min(0.75, Math.max(0.04, intensity * (0.34 + darkDepth * 0.18)))
                  : Math.min(0.65, Math.max(0.03, intensity * 0.36)),
                backgroundImage: isDarkBg ? crumpledMicroDarkSvgDataUri : crumpledMicroSvgDataUri,
                backgroundSize: '240px 240px',
              }}
            />
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
              <div className="mb-3 text-center text-xs font-serif tracking-widest text-stone-500">
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
              <div className="mt-3 text-center text-xs font-serif tracking-widest text-stone-500">
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
