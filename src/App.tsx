import { useState, useRef, useEffect } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Bubble,
  BubbleSideStyle,
  CanvasConfig,
  CardThemeId,
  DefaultSideStyles,
  SIDE_STYLE_KEYS,
  WebFont,
} from './types';
import {
  DEFAULT_META_FONT_FAMILY,
  PRESET_FONTS,
  INITIAL_BUBBLES,
  INITIAL_CANVAS_CONFIG,
  INITIAL_SIDE_STYLES,
} from './data/presetFonts';
import { generateRasterizedTextureTile } from './utils/paperTexture';
import {
  getStoredCustomFonts,
  getSafeFontEmbedCSS,
  injectPresetFonts,
  saveCustomFont,
} from './utils/fontLoader';
import { CanvasCard } from './components/CanvasCard';
import { HeaderToolbar } from './components/HeaderToolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { MobileBottomToolbar } from './components/MobileBottomToolbar';
import { FontManagerModal } from './components/FontManagerModal';
import { TextImportModal } from './components/TextImportModal';
import { StylePresetModal } from './components/StylePresetModal';
import { Info, Plus } from 'lucide-react';

export default function App() {
  // Load saved styles with complete defaults for left, center, right
  const loadSavedSideStyles = (): DefaultSideStyles => {
    try {
      const saved = localStorage.getItem('manhwa_default_side_styles_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          left: { ...INITIAL_SIDE_STYLES.left, ...(parsed.left || {}) },
          center: { ...INITIAL_SIDE_STYLES.center, ...(parsed.center || {}) },
          right: { ...INITIAL_SIDE_STYLES.right, ...(parsed.right || {}) },
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_SIDE_STYLES;
  };

  const [bubbles, setBubbles] = useState<Bubble[]>(INITIAL_BUBBLES);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>(INITIAL_CANVAS_CONFIG);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [fonts, setFonts] = useState<WebFont[]>(PRESET_FONTS);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isStylePresetModalOpen, setIsStylePresetModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [zoomLevel] = useState(1);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [inspectorTab, setInspectorTab] = useState<'batch' | 'single' | 'canvas'>('batch');
  const [activeBatchSide, setActiveBatchSide] = useState<'left' | 'center' | 'right'>('left');

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileViewport = viewportWidth < 768;
  const effectiveZoom = isExporting
    ? 1
    : isMobileViewport
    ? Math.min(1, Math.max(0.38, (viewportWidth - 24) / canvasConfig.width))
    : zoomLevel;

  // Left, Center, Right Bubble Saved Default Formatting State (Persisted)
  const [savedSideStyles, setSavedSideStyles] = useState<DefaultSideStyles>(loadSavedSideStyles);

  // Current working/live-editing side styles
  const [defaultSideStyles, setDefaultSideStyles] = useState<DefaultSideStyles>(loadSavedSideStyles);

  // Undo History Stack
  const [historyStack, setHistoryStack] = useState<
    {
      bubbles: Bubble[];
      canvasConfig: CanvasConfig;
      defaultSideStyles: DefaultSideStyles;
    }[]
  >([]);
  const lastPushTimeRef = useRef<number>(0);

  const recordHistory = (coalesce = false) => {
    const now = Date.now();
    if (coalesce && now - lastPushTimeRef.current < 450) {
      lastPushTimeRef.current = now;
      return;
    }
    lastPushTimeRef.current = now;
    const snapshot = {
      bubbles: bubbles.map((b) => ({
        ...b,
        customStyleKeys: b.customStyleKeys ? [...b.customStyleKeys] : undefined,
      })),
      canvasConfig: { ...canvasConfig },
      defaultSideStyles: {
        left: { ...defaultSideStyles.left },
        center: { ...defaultSideStyles.center },
        right: { ...defaultSideStyles.right },
      },
    };
    setHistoryStack((prev) => [...prev.slice(-39), snapshot]);
  };

  const handleUndo = () => {
    setHistoryStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setBubbles(last.bubbles);
      setCanvasConfig(last.canvasConfig);
      setDefaultSideStyles(last.defaultSideStyles);
      lastPushTimeRef.current = 0;
      return prev.slice(0, -1);
    });
  };

  // Global Ctrl+Z / Cmd+Z shortcut for Undo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stagePointerDownInsideBubbleRef = useRef<boolean>(false);

  // Load preset and custom fonts on mount & clear legacy localStorage cache
  useEffect(() => {
    try {
      localStorage.removeItem('manhwa_default_side_styles');
      localStorage.removeItem('manhwa_default_side_styles_v3');
      localStorage.removeItem('manhwa_saved_bubbles');
      localStorage.removeItem('manhwa_locked_default_bubbles');
      localStorage.removeItem('manhwa_saved_canvas_config');
      localStorage.removeItem('manhwa_locked_canvas_config');
    } catch {
      // ignore
    }
    injectPresetFonts(PRESET_FONTS);
    const customFonts = getStoredCustomFonts();
    if (customFonts.length > 0) {
      setFonts([...PRESET_FONTS, ...customFonts]);
    }
  }, []);

  // Save default side styles to local storage
  useEffect(() => {
    try {
      localStorage.setItem('manhwa_default_side_styles_v5', JSON.stringify(savedSideStyles));
    } catch {
      // ignore
    }
  }, [savedSideStyles]);

  const selectedBubble = bubbles.find((b) => b.id === selectedBubbleId) || null;

  // Select bubble handler - automatically switches to 'single' (개별편집) tab, or 'canvas' (배경지) when deselected
  const handleSelectBubble = (id: string | null) => {
    setSelectedBubbleId(id);
    if (id) {
      setInspectorTab('single');
    } else {
      setInspectorTab('canvas');
    }
  };

  // Add a new speech bubble using side default style
  const handleAddBubble = (forcedAlign?: 'left' | 'right' | 'center') => {
    recordHistory(false);
    const lastBubble = bubbles[bubbles.length - 1];
    const newY = lastBubble ? lastBubble.y + 100 : 100;
    const nextAlign = forcedAlign || (lastBubble?.align === 'left' ? 'right' : 'left');
    const sideStyle = defaultSideStyles[nextAlign] || defaultSideStyles.left;

    const newBubble: Bubble = {
      id: `b-${Date.now()}`,
      text: '새 문장을 적어보세요.',
      align: nextAlign,
      x: nextAlign === 'left' ? 8 : nextAlign === 'right' ? 45 : 26,
      y: newY,
      fontFamily: sideStyle.fontFamily,
      fontSize: sideStyle.fontSize,
      color: sideStyle.color,
      bgColor: sideStyle.bgColor,
      isBold: sideStyle.isBold,
      isItalic: sideStyle.isItalic,
      isStrikethrough: sideStyle.isStrikethrough,
      isUnderline: sideStyle.isUnderline,
      textAlign: sideStyle.textAlign,
      borderRadius: sideStyle.borderRadius,
      cloudBorderRadius: sideStyle.cloudBorderRadius ?? 14,
      bubbleShape: sideStyle.bubbleShape || 'default',
      hasTail: sideStyle.hasTail,
      cornerStyle: 'directional',
      paddingY: sideStyle.paddingY,
      paddingX: sideStyle.paddingX,
      cloudPaddingY: sideStyle.cloudPaddingY ?? 8,
      cloudPaddingX: sideStyle.cloudPaddingX ?? 24,
      hasShadow: sideStyle.hasShadow,
      hasBottomShadow: sideStyle.hasBottomShadow,
      bottomShadowColor: sideStyle.bottomShadowColor,
      hasBorder: sideStyle.hasBorder,
      borderColor: sideStyle.borderColor,
      letterSpacing: sideStyle.letterSpacing,
      lineHeight: sideStyle.lineHeight,
      textOffsetY: sideStyle.textOffsetY ?? 0,
      showMeta: sideStyle.showMeta ?? false,
      speaker: sideStyle.speaker || '',
      dateText: sideStyle.dateText || '',
      metaTheme: sideStyle.metaTheme || 'inside',
      metaFontFamily: sideStyle.metaFontFamily || DEFAULT_META_FONT_FAMILY,
      metaColor:
        sideStyle.metaColor || (nextAlign === 'right' ? '#cdaf77' : '#777674'),
      customStyleKeys: [],
    };

    setBubbles((prev) => [...prev, newBubble]);
    setSelectedBubbleId(newBubble.id);
    setInspectorTab('single');
  };

  // Helper: apply a side's default style to a bubble while preserving keys modified via Individual Edit (개별편집)
  const applySideStylePreservingCustom = (
    bubble: Bubble,
    sideStyle: BubbleSideStyle,
    explicitUpdatedKeys?: (keyof BubbleSideStyle)[]
  ): Bubble => {
    const customSet = new Set(bubble.customStyleKeys || []);
    const explicitSet = new Set(explicitUpdatedKeys || []);
    const nonCustomUpdates: Partial<Bubble> = {};
    for (const key of SIDE_STYLE_KEYS) {
      if (customSet.has(key) && !explicitSet.has(key)) continue;
      // Keep each bubble's extracted speaker/dateText unless speaker/dateText was explicitly edited in batch settings (or bubble has none)
      if (
        (key === 'speaker' || key === 'dateText') &&
        !explicitSet.has(key) &&
        Boolean(bubble[key]?.trim())
      ) {
        continue;
      }
      (nonCustomUpdates as Record<string, unknown>)[key] = sideStyle[key];
      if (explicitSet.has(key)) {
        customSet.delete(key);
      }
    }
    return {
      ...bubble,
      ...nonCustomUpdates,
      customStyleKeys: Array.from(customSet),
    };
  };

  // Update side style in real-time and immediately reflect onto the canvas
  // Individual formatted letters (b.html spans) and individually edited bubble properties (customStyleKeys) are preserved!
  const handleUpdateSideStyle = (
    side: 'left' | 'right' | 'center',
    updated: Partial<BubbleSideStyle>
  ) => {
    recordHistory(true);
    const updatedKeys = Object.keys(updated) as (keyof BubbleSideStyle)[];
    setDefaultSideStyles((prev) => {
      const nextStyle = { ...prev[side], ...updated };
      const nextState = { ...prev, [side]: nextStyle };

      // Live-update all bubbles on this side on the canvas (for non-individually-customized properties)
      setBubbles((currentBubbles) =>
        currentBubbles.map((b) => {
          if (b.align !== side) return b;
          return applySideStylePreservingCustom(b, nextStyle, updatedKeys);
        })
      );

      return nextState;
    });
  };

  // Save the current side style as the persistent default
  const handleSaveSideStyle = (side: 'left' | 'right' | 'center') => {
    setDefaultSideStyles((latestDefault) => {
      const current = latestDefault[side];
      setSavedSideStyles((prev) => {
        const nextSaved = {
          ...prev,
          [side]: { ...current },
        };
        try {
          localStorage.setItem('manhwa_default_side_styles_v5', JSON.stringify(nextSaved));
        } catch {
          // ignore
        }
        return nextSaved;
      });
      return latestDefault;
    });
  };

  // Revert the current side style to the previously saved default
  // and immediately restore the bubbles on this side on the canvas
  const handleRevertSideStyle = (side: 'left' | 'right' | 'center') => {
    recordHistory(false);
    const original = savedSideStyles[side];
    setDefaultSideStyles((prev) => ({
      ...prev,
      [side]: { ...original },
    }));

    // Immediately restore bubbles on this side back to saved original style
    // (Preserving b.html and individually edited properties in customStyleKeys)
    setBubbles((currentBubbles) =>
      currentBubbles.map((b) => {
        if (b.align !== side) return b;
        return applySideStylePreservingCustom(b, original);
      })
    );
  };

  // Copy style between sides and live-update
  const handleCopySideStyle = (
    fromSide: 'left' | 'right' | 'center',
    toSide: 'left' | 'right' | 'center'
  ) => {
    recordHistory(false);
    const copied = { ...defaultSideStyles[fromSide] };
    setDefaultSideStyles((prev) => ({
      ...prev,
      [toSide]: copied,
    }));
    setBubbles((currentBubbles) =>
      currentBubbles.map((b) => {
        if (b.align !== toSide) return b;
        return applySideStylePreservingCustom(b, copied);
      })
    );
  };

  // Update specific bubble
  // - When changing text/bubble position (align: left, right, center), non-individually-edited properties
  //   automatically switch to the target position's default style (defaultSideStyles[newAlign]).
  // - When editing style properties in Individual Edit (개별편집), those keys are recorded in customStyleKeys.
  const handleUpdateBubble = (id: string, updated: Partial<Bubble>) => {
    recordHistory(true);
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;

        // 1. If customStyleKeys is explicitly provided (e.g. preset reset to []), apply directly
        if (updated.customStyleKeys !== undefined) {
          return { ...b, ...updated };
        }

        // 2. If position (align) is being changed (left / center / right)
        if (updated.align !== undefined) {
          const targetSideStyle =
            defaultSideStyles[updated.align] || defaultSideStyles.left;
          const withPositionDefaultStyle = applySideStylePreservingCustom(
            b,
            targetSideStyle
          );

          // Check if any explicit style keys were also passed alongside align
          const explicitStyleKeys = (
            Object.keys(updated) as (keyof Bubble)[]
          ).filter((k) =>
            SIDE_STYLE_KEYS.includes(k as keyof BubbleSideStyle)
          ) as (keyof BubbleSideStyle)[];

          const nextCustomKeys =
            explicitStyleKeys.length > 0
              ? Array.from(
                  new Set([...(b.customStyleKeys || []), ...explicitStyleKeys])
                )
              : b.customStyleKeys || [];

          return {
            ...withPositionDefaultStyle,
            ...updated,
            customStyleKeys: nextCustomKeys,
          };
        }

        // 3. Individual style edits in 개별편집 (record modified style keys, and remove keys that reverted to default)
        const editedStyleKeys = (
          Object.keys(updated) as (keyof Bubble)[]
        ).filter((k) =>
          SIDE_STYLE_KEYS.includes(k as keyof BubbleSideStyle)
        ) as (keyof BubbleSideStyle)[];

        const mergedBubble: Bubble = { ...b, ...updated };
        if (editedStyleKeys.length > 0) {
          const sideStyle =
            defaultSideStyles[mergedBubble.align] || defaultSideStyles.left;
          const candidateKeys = Array.from(
            new Set([...(b.customStyleKeys || []), ...editedStyleKeys])
          );
          const nextCustomKeys = candidateKeys.filter((key) => {
            const bVal = mergedBubble[key];
            const sVal = sideStyle[key];
            if (typeof bVal === 'string' && typeof sVal === 'string') {
              return bVal.toLowerCase() !== sVal.toLowerCase();
            }
            if (typeof bVal === 'boolean' || typeof sVal === 'boolean') {
              return Boolean(bVal) !== Boolean(sVal);
            }
            return bVal !== sVal;
          });
          return {
            ...mergedBubble,
            customStyleKeys: nextCustomKeys,
          };
        }

        return mergedBubble;
      })
    );
  };

  // Delete bubble
  const handleDeleteBubble = (id: string) => {
    recordHistory(false);
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    if (selectedBubbleId === id) {
      handleSelectBubble(null);
    }
  };

  // Duplicate bubble
  const handleDuplicateBubble = (id: string) => {
    recordHistory(false);
    const targetIndex = bubbles.findIndex((b) => b.id === id);
    if (targetIndex === -1) return;
    const target = bubbles[targetIndex];

    const duplicated: Bubble = {
      ...target,
      id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customStyleKeys: target.customStyleKeys ? [...target.customStyleKeys] : [],
      y: target.y + 70,
      x: Math.min(80, target.x + 3),
    };

    setBubbles((prev) => {
      const next = [...prev];
      next.splice(targetIndex + 1, 0, duplicated);
      return next;
    });
    setSelectedBubbleId(duplicated.id);
  };

  // Move or duplicate bubble via long-press drag (and Alt+drag copy)
  const handleMoveOrCopyBubble = (
    bubbleId: string,
    targetIndex: number,
    targetAlign: 'left' | 'right' | 'center',
    isCopy: boolean
  ) => {
    recordHistory(false);
    const sourceIdx = bubbles.findIndex((b) => b.id === bubbleId);
    if (sourceIdx === -1) return;
    const sourceBubble = bubbles[sourceIdx];

    // Apply target side's default style when alignment changes (resetting to target side's style)
    const targetSideStyle =
      defaultSideStyles[targetAlign] || defaultSideStyles.left;
    const alignedBubble: Bubble =
      targetAlign !== sourceBubble.align
        ? {
            ...sourceBubble,
            ...targetSideStyle,
            speaker:
              targetSideStyle.speaker?.trim() ||
              sourceBubble.speaker ||
              '',
            dateText:
              sourceBubble.dateText?.trim() ||
              targetSideStyle.dateText ||
              '',
            align: targetAlign,
            html: undefined,
            customStyleKeys: [],
          }
        : { ...sourceBubble };

    if (isCopy) {
      const copiedBubble: Bubble = {
        ...alignedBubble,
        id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        customStyleKeys: alignedBubble.customStyleKeys
          ? [...alignedBubble.customStyleKeys]
          : [],
      };
      setBubbles((prev) => {
        const next = [...prev];
        const clampedIndex = Math.max(0, Math.min(next.length, targetIndex));
        next.splice(clampedIndex, 0, copiedBubble);
        return next;
      });
      setSelectedBubbleId(copiedBubble.id);
    } else {
      setBubbles((prev) => {
        const next = [...prev];
        next.splice(sourceIdx, 1);
        const adjustedIndex =
          targetIndex > sourceIdx ? targetIndex - 1 : targetIndex;
        const clampedIndex = Math.max(0, Math.min(next.length, adjustedIndex));
        next.splice(clampedIndex, 0, alignedBubble);
        return next;
      });
      setSelectedBubbleId(alignedBubble.id);
    }
  };

  // Bulk import
  const handleImportBubbles = (newBubbles: Bubble[], mode: 'replace' | 'append') => {
    recordHistory(false);

    // Populate defaultSideStyles with extracted nickname (이름), date/time (시간), and fontFamily per side
    setDefaultSideStyles((prev) => {
      const next = {
        left: { ...prev.left },
        center: { ...prev.center },
        right: { ...prev.right },
      };
      for (const side of ['left', 'center', 'right'] as const) {
        const sideBubbles = newBubbles.filter((b) => b.align === side);
        const firstWithSpeaker = sideBubbles.find((b) => b.speaker?.trim());
        const firstWithDate = sideBubbles.find((b) => b.dateText?.trim());
        const firstWithFont = sideBubbles.find((b) => b.fontFamily?.trim());
        if (firstWithSpeaker?.speaker) {
          next[side].speaker = firstWithSpeaker.speaker.trim();
        }
        if (firstWithDate?.dateText) {
          next[side].dateText = firstWithDate.dateText.trim();
        }
        if (firstWithFont?.fontFamily) {
          next[side].fontFamily = firstWithFont.fontFamily;
        }
      }
      return next;
    });

    if (mode === 'replace') {
      setBubbles(newBubbles);
    } else {
      setBubbles((prev) => [...prev, ...newBubbles]);
    }
    if (newBubbles.length > 0) {
      setSelectedBubbleId(newBubbles[0].id);
    }
  };

  // Reset to initial sample without window.confirm (iframe-safe)
  const handleResetToSample = () => {
    recordHistory(false);
    setDefaultSideStyles(INITIAL_SIDE_STYLES);
    setSavedSideStyles(INITIAL_SIDE_STYLES);
    setBubbles(INITIAL_BUBBLES);
    setCanvasConfig(INITIAL_CANVAS_CONFIG);
    setSelectedBubbleId(null);
  };

  // Apply a Card Theme preset (구버전 / 기본 화이트 / 기본 다크)
  const handleApplyTheme = (themeId: CardThemeId) => {
    recordHistory(false);

    let leftPatch: Partial<BubbleSideStyle>;
    let rightPatch: Partial<BubbleSideStyle>;
    let centerPatch: Partial<BubbleSideStyle>;
    let canvasBgColor: string;
    let canvasPaperTexture: CanvasConfig['paperTexture'];

    if (themeId === 'legacy') {
      // 1. 구버전 : 현재 기본 테마 (미세 한지 결)
      leftPatch = {
        bgColor: '#FBF8F1',
        hasBorder: true,
        borderColor: '#E5DED3',
        hasShadow: true,
        hasBottomShadow: false,
        bottomShadowColor: '#b9a98e',
        hasTail: true,
        metaColor: '#777674',
      };
      rightPatch = {
        bgColor: '#FBF5E6',
        hasBorder: true,
        borderColor: '#E5DED3',
        hasShadow: true,
        hasBottomShadow: false,
        bottomShadowColor: '#b9a98e',
        hasTail: true,
        metaColor: '#cdaf77',
      };
      centerPatch = {
        color: '#34312F',
        bgColor: 'transparent',
        hasBorder: false,
        hasShadow: false,
        hasBottomShadow: false,
        hasTail: false,
        metaColor: '#777674',
      };
      canvasBgColor = '#faf9f8';
      canvasPaperTexture = 'paper';
    } else if (themeId === 'default-white') {
      // 2. 기본 화이트 : 말풍선색 faf9f8, 말풍선 외곽선 색 6b5843, 하단그림자 색 b9a98e, 말풍선 꼬리 off, 배경지 색 faf9f8, 매끄러운 일반지
      leftPatch = {
        bgColor: '#faf9f8',
        hasBorder: true,
        borderColor: '#6b5843',
        hasShadow: false,
        hasBottomShadow: true,
        bottomShadowColor: '#b9a98e',
        hasTail: false,
        metaColor: '#665c52',
      };
      rightPatch = {
        bgColor: '#faf9f8',
        hasBorder: true,
        borderColor: '#6b5843',
        hasShadow: false,
        hasBottomShadow: true,
        bottomShadowColor: '#b9a98e',
        hasTail: false,
        metaColor: '#665c52',
      };
      centerPatch = {
        color: '#34312F',
        bgColor: 'transparent',
        hasBorder: false,
        hasShadow: false,
        hasBottomShadow: false,
        hasTail: false,
        metaColor: '#665c52',
      };
      canvasBgColor = '#faf9f8';
      canvasPaperTexture = 'none';
    } else {
      // 3. 기본 다크 : 왼쪽 말풍선색 d1ab67, 오른쪽 말풍선 색 ddc9a1, 그림자, 외곽선 없음, 말풍선 꼬리 off, 배경지 색 1b150c, 매끄러운 일반지, 중앙 글씨 색 하얀색
      leftPatch = {
        bgColor: '#d1ab67',
        hasBorder: false,
        hasShadow: false,
        hasBottomShadow: false,
        hasTail: false,
        metaColor: '#51382a',
      };
      rightPatch = {
        bgColor: '#ddc9a1',
        hasBorder: false,
        hasShadow: false,
        hasBottomShadow: false,
        hasTail: false,
        metaColor: '#51382a',
      };
      centerPatch = {
        color: '#FFFFFF',
        bgColor: 'transparent',
        hasBorder: false,
        hasShadow: false,
        hasBottomShadow: false,
        hasTail: false,
        metaColor: '#51382a',
      };
      canvasBgColor = '#1b150c';
      canvasPaperTexture = 'none';
    }

    const themeKeys: (keyof BubbleSideStyle)[] = [
      'bgColor',
      'hasBorder',
      'borderColor',
      'hasShadow',
      'hasBottomShadow',
      'bottomShadowColor',
      'hasTail',
      'metaColor',
    ];

    setDefaultSideStyles((prev) => ({
      left: { ...prev.left, ...leftPatch },
      center: { ...prev.center, ...centerPatch },
      right: { ...prev.right, ...rightPatch },
    }));

    setBubbles((prevBubbles) =>
      prevBubbles.map((b) => {
        const patch =
          b.align === 'left'
            ? leftPatch
            : b.align === 'right'
            ? rightPatch
            : centerPatch;
        const keysToClear =
          b.align === 'center' ? [...themeKeys, 'color' as const] : themeKeys;
        const filteredCustomKeys = (b.customStyleKeys || []).filter(
          (k) => !keysToClear.includes(k)
        );
        return {
          ...b,
          ...patch,
          customStyleKeys: filteredCustomKeys,
        };
      })
    );

    setCanvasConfig((prev) => ({
      ...prev,
      bgColor: canvasBgColor,
      bgImageUrl: '',
      paperTexture: canvasPaperTexture,
    }));
  };

  // Update canvas config with undo tracking
  const handleUpdateCanvasConfig = (updated: Partial<CanvasConfig>) => {
    recordHistory(true);
    setCanvasConfig((prev) => ({ ...prev, ...updated }));
  };

  // Toggle layout mode
  const handleToggleLayoutMode = () => {
    setCanvasConfig((prev) => ({
      ...prev,
      isFreePositionMode: !prev.isFreePositionMode,
    }));
  };

  // Export to high-res PNG
  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setSelectedBubbleId(null);

    try {
      // Ensure web fonts and rasterized paper texture are completely ready before rendering
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await generateRasterizedTextureTile(
        canvasConfig.bgColor,
        canvasConfig.paperTexture
      );

      // Small delay to ensure state and unselected borders have cleared
      await new Promise((resolve) => setTimeout(resolve, 80));

      const fontEmbedCSS = await getSafeFontEmbedCSS(canvasRef.current);

      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.98,
        pixelRatio: 2.5, // 2.5x sharp resolution
        fontEmbedCSS,
        filter: (node) =>
          typeof HTMLIFrameElement === 'undefined' ||
          !(node instanceof HTMLIFrameElement),
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.download = `dialogue-card-${dateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to clipboard
  const handleCopyClipboard = async () => {
    if (!canvasRef.current || isExporting) return;
    const targetNode = canvasRef.current;

    // Ensure the document/window has focus before invoking Clipboard API
    try {
      window.focus();
    } catch {
      // ignore
    }

    setIsExporting(true);
    setSelectedBubbleId(null);

    const createBlobPromise = async (): Promise<Blob> => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await generateRasterizedTextureTile(
        canvasConfig.bgColor,
        canvasConfig.paperTexture
      );

      await new Promise((resolve) => setTimeout(resolve, 80));

      const fontEmbedCSS = await getSafeFontEmbedCSS(targetNode);

      const generated = await toBlob(targetNode, {
        quality: 0.98,
        pixelRatio: 2.0,
        fontEmbedCSS,
        filter: (node) =>
          typeof HTMLIFrameElement === 'undefined' ||
          !(node instanceof HTMLIFrameElement),
      });

      if (!generated) {
        throw new Error('Blob generation failed');
      }
      return generated;
    };

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          // Pass Promise<Blob> directly into ClipboardItem synchronously during the click gesture
          // so transient user activation and document focus are preserved.
          const item = new ClipboardItem({
            'image/png': createBlobPromise(),
          });
          await navigator.clipboard.write([item]);
        } catch {
          // Fallback for browsers that require a resolved Blob instead of Promise<Blob>
          const resolvedBlob = await createBlobPromise();
          window.focus();
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': resolvedBlob }),
          ]);
        }
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }
    } catch {
      // If clipboard write is blocked because the document lost focus (e.g., user clicked outside the iframe),
      // avoid throwing an unhandled console error.
    } finally {
      setIsExporting(false);
    }
  };

  // Font added from modal
  const handleAddCustomFont = (newFont: WebFont) => {
    setFonts((prev) => {
      const exists = prev.some((f) => f.id === newFont.id);
      return exists ? prev : [...prev, newFont];
    });
    if (selectedBubbleId) {
      handleUpdateBubble(selectedBubbleId, { fontFamily: newFont.family });
    }
  };

  // Font removed from modal
  const handleRemoveCustomFont = (fontId: string) => {
    setFonts((prev) => prev.filter((f) => f.id !== fontId));
  };

  // Move selected bubble up or down in the list
  const handleMoveBubbleOrder = (direction: 'up' | 'down') => {
    if (!selectedBubbleId) return;
    recordHistory(false);
    setBubbles((prev) => {
      const idx = prev.findIndex((b) => b.id === selectedBubbleId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  // Export single side style preset (.json file)
  const handleExportSidePreset = (
    side: 'left' | 'center' | 'right',
    styleOverride?: BubbleSideStyle
  ) => {
    try {
      const styleToExport = styleOverride || defaultSideStyles[side];
      const usedCustomFonts = fonts.filter(
        (f) =>
          f.isCustom &&
          (f.family.toLowerCase() === styleToExport.fontFamily?.toLowerCase() ||
            f.family.toLowerCase() ===
              styleToExport.metaFontFamily?.toLowerCase())
      );
      const presetData = {
        version: 1,
        type: 'manhwa-bubble-side-preset',
        side,
        exportedAt: new Date().toISOString(),
        style: styleToExport,
        customFonts: usedCustomFonts,
      };
      const blob = new Blob([JSON.stringify(presetData, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const sideKor =
        side === 'left' ? '왼쪽' : side === 'center' ? '중앙' : '오른쪽';
      const link = document.createElement('a');
      link.href = url;
      link.download = `이체통-${sideKor}서식-${dateStr}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to export side style preset', err);
    }
  };

  // Export all styles + background preset (.json file)
  const handleExportAllPreset = (
    sidesOverride?: DefaultSideStyles,
    canvasOverride?: CanvasConfig
  ) => {
    try {
      const presetData = {
        version: 1,
        type: 'manhwa-card-style-preset',
        exportedAt: new Date().toISOString(),
        defaultSideStyles: sidesOverride || defaultSideStyles,
        canvasConfig: canvasOverride || canvasConfig,
        customFonts: fonts.filter((f) => f.isCustom),
      };
      const blob = new Blob([JSON.stringify(presetData, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = url;
      link.download = `이체통-일괄서식-${dateStr}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to export style preset', err);
    }
  };

  // Apply imported single side style
  const handleApplySidePreset = (
    side: 'left' | 'center' | 'right',
    style: BubbleSideStyle,
    customFonts?: WebFont[]
  ) => {
    recordHistory(false);

    if (Array.isArray(customFonts) && customFonts.length > 0) {
      for (const cf of customFonts) {
        if (cf && cf.id && cf.name && cf.family) {
          saveCustomFont({ ...cf, isCustom: true });
        }
      }
      const loadedCustom = getStoredCustomFonts();
      setFonts([...PRESET_FONTS, ...loadedCustom]);
    }

    const mergedSideStyle: BubbleSideStyle = {
      ...INITIAL_SIDE_STYLES[side],
      ...style,
    };

    setDefaultSideStyles((prev) => ({
      ...prev,
      [side]: mergedSideStyle,
    }));
    setSavedSideStyles((prev) => ({
      ...prev,
      [side]: mergedSideStyle,
    }));

    setBubbles((prevBubbles) =>
      prevBubbles.map((b) => {
        if (b.align !== side) return b;
        const keepSpeaker = b.speaker?.trim()
          ? b.speaker
          : mergedSideStyle.speaker || '';
        const keepDate = b.dateText?.trim()
          ? b.dateText
          : mergedSideStyle.dateText || '';
        const preservedCustomKeys: (keyof BubbleSideStyle)[] = [];
        if (b.speaker?.trim()) preservedCustomKeys.push('speaker');
        if (b.dateText?.trim()) preservedCustomKeys.push('dateText');

        return {
          ...b,
          ...mergedSideStyle,
          speaker: keepSpeaker,
          dateText: keepDate,
          customStyleKeys: preservedCustomKeys,
        };
      })
    );
  };

  // Apply full preset (all 3 sides + optional background config)
  const handleApplyFullPreset = (
    sides: DefaultSideStyles,
    nextCanvasConfig?: Partial<CanvasConfig>,
    customFonts?: WebFont[]
  ) => {
    recordHistory(false);

    if (Array.isArray(customFonts) && customFonts.length > 0) {
      for (const cf of customFonts) {
        if (cf && cf.id && cf.name && cf.family) {
          saveCustomFont({ ...cf, isCustom: true });
        }
      }
      const loadedCustom = getStoredCustomFonts();
      setFonts([...PRESET_FONTS, ...loadedCustom]);
    }

    const nextSideStyles: DefaultSideStyles = {
      left: { ...INITIAL_SIDE_STYLES.left, ...(sides.left || {}) },
      center: { ...INITIAL_SIDE_STYLES.center, ...(sides.center || {}) },
      right: { ...INITIAL_SIDE_STYLES.right, ...(sides.right || {}) },
    };

    setDefaultSideStyles(nextSideStyles);
    setSavedSideStyles(nextSideStyles);

    setBubbles((prevBubbles) =>
      prevBubbles.map((b) => {
        const sideStyle = nextSideStyles[b.align] || nextSideStyles.left;
        const keepSpeaker = b.speaker?.trim()
          ? b.speaker
          : sideStyle.speaker || '';
        const keepDate = b.dateText?.trim()
          ? b.dateText
          : sideStyle.dateText || '';
        const preservedCustomKeys: (keyof BubbleSideStyle)[] = [];
        if (b.speaker?.trim()) preservedCustomKeys.push('speaker');
        if (b.dateText?.trim()) preservedCustomKeys.push('dateText');

        return {
          ...b,
          ...sideStyle,
          speaker: keepSpeaker,
          dateText: keepDate,
          customStyleKeys: preservedCustomKeys,
        };
      })
    );

    if (nextCanvasConfig && typeof nextCanvasConfig === 'object') {
      setCanvasConfig((prev) => ({
        ...prev,
        ...nextCanvasConfig,
      }));
    }
  };

  return (
    <div id="app-root" className="flex h-screen w-screen flex-col overflow-hidden bg-stone-100 font-sans">
      {/* Top Main Navigation Toolbar */}
      <HeaderToolbar
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenFontManager={() => setIsFontModalOpen(true)}
        onOpenStylePresetModal={() => setIsStylePresetModalOpen(true)}
        onResetToSample={handleResetToSample}
        onUndo={handleUndo}
        canUndo={historyStack.length > 0}
        canvasConfig={canvasConfig}
        onExportPng={handleExportPng}
        onCopyClipboard={handleCopyClipboard}
        isExporting={isExporting}
        copiedSuccess={copiedSuccess}
      />

      {/* Main Workspace Area: Canvas Stage (Left/Center) + Inspector (Right) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Stage Wrapper with Floating + Button at bottom-right */}
        <div className="relative flex flex-1 min-w-0 overflow-hidden">
          {/* Canvas Scrollable Stage */}
          <main
            id="canvas-stage"
            className="relative flex flex-1 min-w-0 flex-col items-center justify-start overflow-y-auto overflow-x-auto p-3 pb-44 sm:p-8 md:pb-12 lg:p-12"
            onMouseDownCapture={(e) => {
              const target = e.target as HTMLElement;
              stagePointerDownInsideBubbleRef.current = Boolean(
                target.closest('[id^="bubble-container-"]') ||
                  target.closest('#floating-text-toolbar')
              );
            }}
            onClick={() => {
              if (stagePointerDownInsideBubbleRef.current) {
                stagePointerDownInsideBubbleRef.current = false;
                return;
              }
              const sel = window.getSelection();
              if (sel && !sel.isCollapsed && sel.toString().length > 0) {
                return;
              }
              handleSelectBubble(null);
            }}
          >
            {/* Title Bar above Canvas */}
            <div className="mb-3 md:mb-4 flex items-center justify-between gap-2 w-full max-w-[800px] text-xs text-stone-500">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-stone-700 font-semibold">
                  이체통 출력소
                </span>
                <span className="truncate text-stone-500">
                  이세계 우체통 특화 카드 메이커
                </span>
              </div>
            </div>

            {/* Actual Card Rendered Container */}
            <div
              id="canvas-scaler"
              style={{
                transform: `scale(${effectiveZoom})`,
                transformOrigin: 'top center',
              }}
              className="transition-transform duration-100"
            >
              <CanvasCard
                ref={canvasRef}
                config={canvasConfig}
                bubbles={bubbles}
                selectedBubbleId={selectedBubbleId}
                onSelectBubble={handleSelectBubble}
                onUpdateBubble={(id, updated) => handleUpdateBubble(id, updated)}
                onDeleteBubble={handleDeleteBubble}
                onDuplicateBubble={handleDuplicateBubble}
                onMoveOrCopyBubble={handleMoveOrCopyBubble}
                fonts={fonts}
                isExporting={isExporting}
              />
            </div>

            {/* Footer Guide Tips */}
            <div className="hidden md:flex mt-8 items-center gap-2 rounded-xl border border-stone-200 bg-white/70 px-4 py-2.5 text-xs text-stone-500 shadow-2xs backdrop-blur-xs">
              <Info className="h-4 w-4 shrink-0 text-amber-700" />
              <span className="leading-relaxed">
                말풍선을 <strong>길게 누르고 드래그</strong>하면 위치를 이동하고, <strong>Alt를 누른 채 드래그</strong>하면 말풍선을 복사할 수 있습니다.
                <br />
                텍스트 드래그 시 <strong>선택한 글자만</strong> 서식/색상이 적용됩니다.
              </span>
            </div>

            <p className="mt-4 text-center text-[8pt] text-stone-400">
              해당 사이트는 바이브 코딩으로 제작되었습니다.
            </p>
          </main>

          {/* Twitter-style Floating Circular (+) Button at bottom-right of Canvas */}
          <button
            type="button"
            id="btn-add-bubble-fab"
            onClick={() => handleAddBubble()}
            title="말풍선 추가"
            aria-label="말풍선 추가"
            className="fixed md:absolute bottom-20 right-5 md:bottom-7 md:right-7 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg ring-1 ring-white/15 hover:bg-stone-800 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Inspector Panel (Desktop >= md) */}
        <InspectorPanel
          activeTab={inspectorTab}
          onTabChange={setInspectorTab}
          selectedBubble={selectedBubble}
          bubbles={bubbles}
          onUpdateBubble={(updated) => {
            if (selectedBubbleId) {
              handleUpdateBubble(selectedBubbleId, updated);
            }
          }}
          onDeleteBubble={() => {
            if (selectedBubbleId) handleDeleteBubble(selectedBubbleId);
          }}
          onDuplicateBubble={() => {
            if (selectedBubbleId) handleDuplicateBubble(selectedBubbleId);
          }}
          canvasConfig={canvasConfig}
          onUpdateCanvasConfig={handleUpdateCanvasConfig}
          fonts={fonts}
          onOpenFontManager={() => setIsFontModalOpen(true)}
          defaultSideStyles={defaultSideStyles}
          savedSideStyles={savedSideStyles}
          onUpdateSideStyle={handleUpdateSideStyle}
          onSaveSideStyle={handleSaveSideStyle}
          onRevertSideStyle={handleRevertSideStyle}
          onCopySideStyle={handleCopySideStyle}
          onSelectBubbleById={handleSelectBubble}
          onActiveBatchSideChange={setActiveBatchSide}
          onApplyTheme={handleApplyTheme}
        />

        {/* Samsung Notes-style Bottom Icon Bar & Popover (Mobile < md) */}
        <MobileBottomToolbar
          selectedBubble={selectedBubble}
          bubbles={bubbles}
          onSelectBubble={handleSelectBubble}
          onUpdateBubble={(updated) => {
            if (selectedBubbleId) {
              handleUpdateBubble(selectedBubbleId, updated);
            }
          }}
          onDeleteBubble={() => {
            if (selectedBubbleId) handleDeleteBubble(selectedBubbleId);
          }}
          onDuplicateBubble={() => {
            if (selectedBubbleId) handleDuplicateBubble(selectedBubbleId);
          }}
          onMoveBubbleOrder={handleMoveBubbleOrder}
          onAddBubble={handleAddBubble}
          canvasConfig={canvasConfig}
          onUpdateCanvasConfig={handleUpdateCanvasConfig}
          fonts={fonts}
          onOpenFontManager={() => setIsFontModalOpen(true)}
          defaultSideStyles={defaultSideStyles}
          savedSideStyles={savedSideStyles}
          onUpdateSideStyle={handleUpdateSideStyle}
          onSaveSideStyle={handleSaveSideStyle}
          onRevertSideStyle={handleRevertSideStyle}
          onCopySideStyle={handleCopySideStyle}
          activeBatchSide={activeBatchSide}
          onActiveBatchSideChange={setActiveBatchSide}
          onApplyTheme={handleApplyTheme}
        />
      </div>

      {/* Integrated Style Preset Export/Import Modal */}
      <StylePresetModal
        isOpen={isStylePresetModalOpen}
        onClose={() => setIsStylePresetModalOpen(false)}
        defaultSideStyles={defaultSideStyles}
        canvasConfig={canvasConfig}
        fonts={fonts}
        onExportSidePreset={handleExportSidePreset}
        onExportAllPreset={handleExportAllPreset}
        onApplySideStyle={handleApplySidePreset}
        onApplyFullPreset={handleApplyFullPreset}
      />

      {/* External Font Manager Modal */}
      <FontManagerModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
        fonts={fonts}
        onAddFont={handleAddCustomFont}
        onRemoveFont={handleRemoveCustomFont}
        onSelectFont={(family) => {
          if (inspectorTab === 'single' && selectedBubbleId) {
            handleUpdateBubble(selectedBubbleId, { fontFamily: family });
          } else {
            handleUpdateSideStyle(activeBatchSide, { fontFamily: family });
          }
        }}
        currentFamily={
          inspectorTab === 'single' && selectedBubble
            ? selectedBubble.fontFamily
            : defaultSideStyles[activeBatchSide]?.fontFamily || ''
        }
      />

      {/* Bulk Text Import Modal */}
      <TextImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportBubbles}
        defaultFontFamily={selectedBubble?.fontFamily || "'Nanum Pen Script', cursive"}
        defaultSideStyles={defaultSideStyles}
        fonts={fonts}
        onOpenFontManager={() => setIsFontModalOpen(true)}
      />
    </div>
  );
}
