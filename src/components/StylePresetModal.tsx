import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  FileDown,
  Upload,
  Sparkles,
  Check,
  RotateCcw,
  ChevronDown,
  Layers,
} from 'lucide-react';
import {
  BubbleSideStyle,
  CanvasConfig,
  DefaultSideStyles,
  WebFont,
} from '../types';
import { DEFAULT_META_FONT_FAMILY, INITIAL_SIDE_STYLES } from '../data/presetFonts';
import { useRasterizedPaperTexture } from '../utils/paperTexture';

type SideKey = 'left' | 'center' | 'right';

interface StoredPresetEntry {
  id: string;
  fileName: string;
  loadedAt: string;
  isFullPreset: boolean;
  singleStyle?: BubbleSideStyle;
  singleSide?: SideKey;
  sideStyles?: DefaultSideStyles;
  canvasConfig?: Partial<CanvasConfig>;
  customFonts?: WebFont[];
}

interface StylePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSideStyles: DefaultSideStyles;
  canvasConfig: CanvasConfig;
  fonts: WebFont[];
  onExportSidePreset: (side: SideKey, styleOverride?: BubbleSideStyle) => void;
  onExportAllPreset: (
    sidesOverride?: DefaultSideStyles,
    canvasOverride?: CanvasConfig
  ) => void;
  onApplySideStyle: (
    side: SideKey,
    style: BubbleSideStyle,
    customFonts?: WebFont[]
  ) => void;
  onApplyFullPreset: (
    sides: DefaultSideStyles,
    canvasConfig?: Partial<CanvasConfig>,
    customFonts?: WebFont[]
  ) => void;
}

const SIDE_META: {
  key: SideKey;
  label: string;
  sampleText: string;
  sampleSpeaker: string;
  sampleTime: string;
}[] = [
  {
    key: 'left',
    label: '왼쪽 말풍선',
    sampleText: '이세계에서 도착한\n왼쪽 말풍선 서식입니다.',
    sampleSpeaker: '보낸 이',
    sampleTime: '오후 08:15',
  },
  {
    key: 'center',
    label: '중앙 말풍선',
    sampleText: '중앙 나레이션 및 독백\n말풍선 서식입니다.',
    sampleSpeaker: '나레이션',
    sampleTime: '제 1장',
  },
  {
    key: 'right',
    label: '오른쪽 말풍선',
    sampleText: '답장으로 보내는\n오른쪽 말풍선 서식입니다.',
    sampleSpeaker: '받는 이',
    sampleTime: '오후 08:16',
  },
];

const RECENT_PRESETS_STORAGE_KEY = 'manhwa_recent_style_preset_files_v1';

export const StylePresetModal: React.FC<StylePresetModalProps> = ({
  isOpen,
  onClose,
  defaultSideStyles,
  canvasConfig,
  fonts,
  onExportSidePreset,
  onExportAllPreset,
  onApplySideStyle,
  onApplyFullPreset,
}) => {
  // Detect narrow width OR portrait (height > width) so it stacks vertically
  const [isVertical, setIsVertical] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 860 || window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsVertical(
        window.innerWidth < 860 || window.innerHeight > window.innerWidth
      );
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Snapshot when modal opens so user can revert individual slots if desired
  const [initialSnapshot, setInitialSnapshot] =
    useState<DefaultSideStyles | null>(null);
  const [initialCanvasSnapshot, setInitialCanvasSnapshot] =
    useState<CanvasConfig | null>(null);

  // Track which side has been updated via import in this session
  const [importedFlags, setImportedFlags] = useState<
    Record<SideKey, string | null>
  >({
    left: null,
    center: null,
    right: null,
  });

  // Track loaded file per side if it's a multi-side preset so user can switch which side from the file to preview
  const [loadedFilePerSide, setLoadedFilePerSide] = useState<
    Record<SideKey, StoredPresetEntry | null>
  >({
    left: null,
    center: null,
    right: null,
  });

  const [selectedSourceSidePerSlot, setSelectedSourceSidePerSlot] = useState<
    Record<SideKey, SideKey | 'all'>
  >({
    left: 'left',
    center: 'center',
    right: 'right',
  });

  // Recent loaded preset files for dropdown selection
  const [recentPresets, setRecentPresets] = useState<StoredPresetEntry[]>(
    () => {
      try {
        const raw = localStorage.getItem(RECENT_PRESETS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  );

  const [dragOverSide, setDragOverSide] = useState<SideKey | 'all' | null>(
    null
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const textureLayer = useRasterizedPaperTexture(
    canvasConfig.bgColor,
    canvasConfig.paperTexture
  );

  const fileInputRefs: Record<
    SideKey | 'all',
    React.RefObject<HTMLInputElement | null>
  > = {
    left: useRef<HTMLInputElement>(null),
    center: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
    all: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (isOpen) {
      setInitialSnapshot({
        left: { ...defaultSideStyles.left },
        center: { ...defaultSideStyles.center },
        right: { ...defaultSideStyles.right },
      });
      setInitialCanvasSnapshot({ ...canvasConfig });
      setImportedFlags({ left: null, center: null, right: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const saveRecentPreset = (entry: StoredPresetEntry) => {
    setRecentPresets((prev) => {
      const filtered = prev.filter((p) => p.fileName !== entry.fileName);
      const next = [entry, ...filtered].slice(0, 12);
      try {
        localStorage.setItem(RECENT_PRESETS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  const parsePresetFile = async (
    file: File
  ): Promise<StoredPresetEntry | null> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') return null;

      // Case 1: Single bubble side preset ({ type: 'manhwa-bubble-side-preset', style: {...} })
      if (parsed.style && typeof parsed.style === 'object') {
        const baseSide: SideKey =
          parsed.side === 'center' || parsed.side === 'right'
            ? parsed.side
            : 'left';
        const mergedStyle: BubbleSideStyle = {
          ...INITIAL_SIDE_STYLES[baseSide],
          ...parsed.style,
        };
        return {
          id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: file.name,
          loadedAt: new Date().toISOString(),
          isFullPreset: false,
          singleSide: baseSide,
          singleStyle: mergedStyle,
          customFonts: Array.isArray(parsed.customFonts)
            ? parsed.customFonts
            : [],
        };
      }

      // Case 2: Full card style preset ({ defaultSideStyles: { left, center, right }, canvasConfig })
      const rawSides = parsed.defaultSideStyles || parsed;
      if (rawSides.left || rawSides.center || rawSides.right) {
        const sideStyles: DefaultSideStyles = {
          left: { ...INITIAL_SIDE_STYLES.left, ...(rawSides.left || {}) },
          center: { ...INITIAL_SIDE_STYLES.center, ...(rawSides.center || {}) },
          right: { ...INITIAL_SIDE_STYLES.right, ...(rawSides.right || {}) },
        };
        return {
          id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: file.name,
          loadedAt: new Date().toISOString(),
          isFullPreset: true,
          sideStyles,
          canvasConfig:
            parsed.canvasConfig && typeof parsed.canvasConfig === 'object'
              ? parsed.canvasConfig
              : undefined,
          customFonts: Array.isArray(parsed.customFonts)
            ? parsed.customFonts
            : [],
        };
      }

      // Case 3: Direct BubbleSideStyle object
      if (parsed.fontFamily || parsed.bgColor || parsed.color) {
        const mergedStyle: BubbleSideStyle = {
          ...INITIAL_SIDE_STYLES.left,
          ...parsed,
        };
        return {
          id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: file.name,
          loadedAt: new Date().toISOString(),
          isFullPreset: false,
          singleSide: 'left',
          singleStyle: mergedStyle,
          customFonts: [],
        };
      }

      return null;
    } catch {
      return null;
    }
  };

  const applyPresetEntryToSide = (
    targetSide: SideKey,
    entry: StoredPresetEntry,
    sourceSideOverride?: SideKey | 'all'
  ) => {
    setLoadedFilePerSide((prev) => ({ ...prev, [targetSide]: entry }));

    if (entry.isFullPreset && entry.sideStyles) {
      const chosenSource = sourceSideOverride || targetSide;
      setSelectedSourceSidePerSlot((prev) => ({
        ...prev,
        [targetSide]: chosenSource,
      }));

      if (chosenSource === 'all') {
        onApplyFullPreset(
          entry.sideStyles,
          entry.canvasConfig,
          entry.customFonts
        );
        setImportedFlags({
          left: entry.fileName,
          center: entry.fileName,
          right: entry.fileName,
        });
        showToast(`'${entry.fileName}' 전체 서식 및 배경지가 적용되었습니다.`);
      } else {
        const styleToApply = entry.sideStyles[chosenSource];
        onApplySideStyle(targetSide, styleToApply, entry.customFonts);
        setImportedFlags((prev) => ({ ...prev, [targetSide]: entry.fileName }));
        showToast(
          `'${entry.fileName}' 서식이 ${
            targetSide === 'left'
              ? '왼쪽'
              : targetSide === 'center'
              ? '중앙'
              : '오른쪽'
          } 말풍선에 적용되었습니다.`
        );
      }
    } else if (entry.singleStyle) {
      onApplySideStyle(targetSide, entry.singleStyle, entry.customFonts);
      setImportedFlags((prev) => ({ ...prev, [targetSide]: entry.fileName }));
      showToast(
        `'${entry.fileName}' 서식이 ${
          targetSide === 'left'
            ? '왼쪽'
            : targetSide === 'center'
            ? '중앙'
            : '오른쪽'
        } 말풍선에 적용되었습니다.`
      );
    }
  };

  const handleFileForSide = async (targetSide: SideKey, file: File) => {
    const entry = await parsePresetFile(file);
    if (!entry) {
      showToast('유효한 서식(.json) 파일이 아닙니다.');
      return;
    }
    saveRecentPreset(entry);
    applyPresetEntryToSide(targetSide, entry, targetSide);
  };

  const handleFileForAll = async (file: File) => {
    const entry = await parsePresetFile(file);
    if (!entry) {
      showToast('유효한 서식(.json) 파일이 아닙니다.');
      return;
    }
    saveRecentPreset(entry);
    if (entry.isFullPreset && entry.sideStyles) {
      onApplyFullPreset(
        entry.sideStyles,
        entry.canvasConfig,
        entry.customFonts
      );
      setImportedFlags({
        left: entry.fileName,
        center: entry.fileName,
        right: entry.fileName,
      });
      showToast(`'${entry.fileName}' 일괄 서식(배경지 포함)이 적용되었습니다.`);
    } else if (entry.singleStyle) {
      const targetSide = entry.singleSide || 'left';
      onApplySideStyle(targetSide, entry.singleStyle, entry.customFonts);
      setImportedFlags((prev) => ({ ...prev, [targetSide]: entry.fileName }));
      showToast(
        `'${entry.fileName}' 단일 서식이 ${
          targetSide === 'left'
            ? '왼쪽'
            : targetSide === 'center'
            ? '중앙'
            : '오른쪽'
        } 말풍선에 적용되었습니다.`
      );
    }
  };

  const handleRevertSlot = (side: SideKey) => {
    if (!initialSnapshot) return;
    onApplySideStyle(side, initialSnapshot[side]);
    setImportedFlags((prev) => ({ ...prev, [side]: null }));
    setLoadedFilePerSide((prev) => ({ ...prev, [side]: null }));
    showToast('이전 서식으로 되돌렸습니다.');
  };

  const getFontDisplayName = (family: string) => {
    const matched = fonts.find(
      (f) => f.family.toLowerCase() === family.toLowerCase()
    );
    if (matched) return matched.name;
    return family.replace(/['"]/g, '').split(',')[0].trim();
  };

  // Render realistic bubble preview for a given side
  const renderBubblePreview = (
    side: SideKey,
    style: BubbleSideStyle,
    sampleText: string,
    sampleSpeaker: string,
    sampleTime: string
  ) => {
    const r = style.borderRadius ?? 14;
    const hasTail =
      style.hasTail !== undefined ? style.hasTail : side !== 'center';
    const borderRadiusStr = !hasTail
      ? `${r}px`
      : side === 'right'
      ? `${r}px 0px ${r}px ${r}px`
      : `0px ${r}px ${r}px ${r}px`;

    const shadows: string[] = [];
    if (style.hasBottomShadow) {
      shadows.push(`0 4px 0 0 ${style.bottomShadowColor || '#b9a98e'}`);
    }
    if (style.hasShadow) {
      shadows.push(
        '0 4px 14px -2px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      );
    }

    const textDecorations: string[] = [];
    if (style.isStrikethrough) textDecorations.push('line-through');
    if (style.isUnderline) textDecorations.push('underline');

    const showMeta = Boolean(style.showMeta);
    const metaTheme = style.metaTheme || 'inside';
    const speakerStr = style.speaker?.trim() || sampleSpeaker;
    const timeStr = style.dateText?.trim() || sampleTime;
    const metaFont = style.metaFontFamily || DEFAULT_META_FONT_FAMILY;
    const metaColor =
      style.metaColor || (side === 'right' ? '#cdaf77' : '#777674');

    return (
      <div
        className="relative flex min-h-[175px] w-full flex-col justify-center overflow-hidden rounded-xl border border-stone-200/80 p-4 transition-colors"
        style={{
          backgroundColor: canvasConfig.bgColor || '#faf9f8',
        }}
      >
        {canvasConfig.bgImageUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("${canvasConfig.bgImageUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: canvasConfig.bgImageOpacity ?? 1,
            }}
          />
        )}

        {canvasConfig.paperTexture !== 'none' &&
          canvasConfig.paperTexture !== 'custom' &&
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

        <div
          className={`relative z-10 flex w-full flex-col ${
            side === 'left'
              ? 'items-start'
              : side === 'right'
              ? 'items-end'
              : 'items-center'
          }`}
        >
          {/* Outside Meta: Speaker above */}
          {showMeta && metaTheme === 'outside' && (
            <div
              className="mb-1 text-xs font-semibold tracking-wide"
              style={{
                fontFamily: metaFont,
                color: metaColor,
              }}
            >
              {speakerStr}
            </div>
          )}

          <div
            className={`flex items-end gap-1.5 max-w-full ${
              side === 'right'
                ? 'justify-end'
                : side === 'center'
                ? 'justify-center'
                : 'justify-start'
            }`}
          >
            {showMeta && metaTheme === 'outside' && side === 'right' && (
              <span
                className="shrink-0 whitespace-nowrap text-[11px] leading-none pb-0.5"
                style={{
                  fontFamily: metaFont,
                  color: metaColor,
                }}
              >
                {timeStr}
              </span>
            )}

            <div
              style={{
                backgroundColor: style.bgColor,
                borderRadius: borderRadiusStr,
                paddingTop: `${Math.min(style.paddingY ?? 14, 24)}px`,
                paddingBottom: `${Math.min(style.paddingY ?? 14, 24)}px`,
                paddingLeft: `${Math.min(style.paddingX ?? 18, 28)}px`,
                paddingRight: `${Math.min(style.paddingX ?? 18, 28)}px`,
                boxShadow: shadows.length > 0 ? shadows.join(', ') : 'none',
                border: style.hasBorder
                  ? `1px solid ${style.borderColor || '#E5DED3'}`
                  : 'none',
                maxWidth: '100%',
              }}
              className="transition-all duration-150"
            >
              <div
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: `${Math.min(Math.max(style.fontSize || 16, 12), 22)}px`,
                  color: style.color,
                  fontWeight: style.isBold ? 700 : 400,
                  fontStyle: style.isItalic ? 'italic' : 'normal',
                  textDecoration: textDecorations.join(' ') || 'none',
                  textAlign: style.textAlign,
                  letterSpacing: style.letterSpacing
                    ? `${style.letterSpacing}px`
                    : 'normal',
                  lineHeight: style.lineHeight || 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'keep-all',
                }}
              >
                {sampleText}
              </div>

              {/* Inside Meta */}
              {showMeta && metaTheme === 'inside' && (
                <div
                  className="mt-1.5 pt-1 border-t"
                  style={{
                    borderColor:
                      style.hasBorder && style.borderColor
                        ? style.borderColor
                        : 'rgba(120, 113, 108, 0.22)',
                    textAlign: side === 'right' ? 'right' : style.textAlign,
                  }}
                >
                  <div
                    className="inline-flex items-center whitespace-nowrap text-xs leading-snug"
                    style={{
                      fontFamily: metaFont,
                      color: metaColor,
                    }}
                  >
                    <span className="font-semibold">{speakerStr}</span>
                    <span className="mx-1.5 opacity-65">•</span>
                    <span>{timeStr}</span>
                  </div>
                </div>
              )}
            </div>

            {showMeta && metaTheme === 'outside' && side !== 'right' && (
              <span
                className="shrink-0 whitespace-nowrap text-[11px] leading-none pb-0.5"
                style={{
                  fontFamily: metaFont,
                  color: metaColor,
                }}
              >
                {timeStr}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-3 sm:p-6 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                서식 내보내기 / 불러오기
              </h2>
              <p className="text-[11px] text-stone-500">
                왼쪽·중앙·오른쪽 말풍선 서식을 개별 또는 배경지 포함 일괄 파일로 저장하고 불러옵니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toastMsg && (
          <div className="mx-5 mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 shadow-2xs">
            <Check className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Body: 3 Bubbles (Horizontal on wide landscape, Vertical on mobile or narrow/tall screens) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            className={`grid gap-4 ${
              isVertical ? 'grid-cols-1' : 'grid-cols-3'
            }`}
          >
            {SIDE_META.map(({ key, label, sampleText, sampleSpeaker, sampleTime }) => {
              const style = defaultSideStyles[key] || defaultSideStyles.left;
              const isDraggingHere = dragOverSide === key;
              const loadedEntry = loadedFilePerSide[key];
              const importedFileName = importedFlags[key];

              return (
                <div
                  key={key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverSide !== key) setDragOverSide(key);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverSide === key) setDragOverSide(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverSide(null);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      await handleFileForSide(key, file);
                    }
                  }}
                  className={`flex flex-col justify-between rounded-2xl border p-3.5 transition-all ${
                    isDraggingHere
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/50'
                      : importedFileName
                      ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                      : 'border-stone-200 bg-stone-50/50 shadow-2xs'
                  }`}
                >
                  {/* Top Title & Info */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-800">
                          {label}
                        </span>
                        {importedFileName && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                            <Sparkles className="h-2.5 w-2.5" />
                            미리보기 적용됨
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[120px] rounded bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-200">
                          {getFontDisplayName(style.fontFamily)}
                        </span>
                        {importedFileName && initialSnapshot && (
                          <button
                            type="button"
                            onClick={() => handleRevertSlot(key)}
                            title="불러오기 전 서식으로 되돌리기"
                            className="inline-flex items-center gap-0.5 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            원래대로
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bubble Live Preview Box */}
                    {renderBubblePreview(
                      key,
                      style,
                      sampleText,
                      sampleSpeaker,
                      sampleTime
                    )}
                  </div>

                  {/* Bottom Controls for this Bubble */}
                  <div className="mt-3 space-y-2">
                    {/* Export / Import Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onExportSidePreset(key, style);
                          showToast(`${label} 서식을 파일로 저장했습니다.`);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
                      >
                        <FileDown className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                        <span>내보내기</span>
                      </button>

                      <input
                        ref={fileInputRefs[key]}
                        type="file"
                        accept=".json,application/json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await handleFileForSide(key, file);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs[key].current?.click()}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-stone-800 transition cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                        <span>불러오기</span>
                      </button>
                    </div>

                    {/* File Dropdown & Drag-and-Drop Zone */}
                    <div className="space-y-1.5">
                      {/* Dropdown to pick from recently loaded files or switch side from a multi-side file */}
                      <div className="relative">
                        <select
                          aria-label={`${label} 서식 파일 선택 드롭다운`}
                          value={
                            loadedEntry
                              ? `${loadedEntry.id}::${
                                  loadedEntry.isFullPreset
                                    ? selectedSourceSidePerSlot[key]
                                    : 'single'
                                }`
                              : ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            if (val === '__browse__') {
                              fileInputRefs[key].current?.click();
                              return;
                            }
                            const [entryId, sideChoice] = val.split('::');
                            const found = recentPresets.find(
                              (p) => p.id === entryId
                            );
                            if (found) {
                              applyPresetEntryToSide(
                                key,
                                found,
                                sideChoice === 'left' ||
                                  sideChoice === 'center' ||
                                  sideChoice === 'right' ||
                                  sideChoice === 'all'
                                  ? sideChoice
                                  : key
                              );
                            }
                          }}
                          className="w-full appearance-none rounded-lg border border-stone-200 bg-white py-1.5 pl-2.5 pr-7 text-[11px] font-medium text-stone-700 hover:border-stone-300 focus:border-stone-800 focus:outline-none cursor-pointer"
                        >
                          <option value="">
                            {importedFileName
                              ? `적용됨: ${importedFileName} (파일 드롭/변경)`
                              : '서식 파일 드롭 또는 목록에서 선택...'}
                          </option>
                          <option value="__browse__">
                            + 기기에서 새 서식 파일(.json) 찾아보기...
                          </option>
                          {recentPresets.map((preset) =>
                            preset.isFullPreset ? (
                              <optgroup
                                key={preset.id}
                                label={`📁 ${preset.fileName} (일괄 서식)`}
                              >
                                <option value={`${preset.id}::left`}>
                                  {preset.fileName} - 왼쪽 말풍선 서식 적용
                                </option>
                                <option value={`${preset.id}::center`}>
                                  {preset.fileName} - 중앙 말풍선 서식 적용
                                </option>
                                <option value={`${preset.id}::right`}>
                                  {preset.fileName} - 오른쪽 말풍선 서식 적용
                                </option>
                                <option value={`${preset.id}::all`}>
                                  {preset.fileName} - 전체(배경지 포함) 일괄 적용
                                </option>
                              </optgroup>
                            ) : (
                              <option
                                key={preset.id}
                                value={`${preset.id}::single`}
                              >
                                📄 {preset.fileName} 서식 적용
                              </option>
                            )
                          )}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer: Bottom Center Batch Export (includes Background) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragOverSide !== 'all') setDragOverSide('all');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragOverSide === 'all') setDragOverSide(null);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverSide(null);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              await handleFileForAll(file);
            }
          }}
          className={`flex flex-col items-center justify-center gap-2 border-t px-5 py-4 transition-colors ${
            dragOverSide === 'all'
              ? 'border-amber-400 bg-amber-50/70'
              : 'border-stone-200 bg-stone-50/90'
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              id="btn-modal-batch-export"
              onClick={() => {
                onExportAllPreset(defaultSideStyles, canvasConfig);
                showToast('배경지를 포함한 전체 서식을 일괄 내보냈습니다.');
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-stone-800 active:scale-[0.99] transition cursor-pointer"
            >
              <FileDown className="h-4 w-4 text-amber-300 shrink-0" />
              <span>일괄 내보내기 (배경지 포함)</span>
            </button>

            <input
              ref={fileInputRefs.all}
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await handleFileForAll(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              id="btn-modal-batch-import"
              onClick={() => fileInputRefs.all.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
            >
              <Upload className="h-4 w-4 text-stone-500 shrink-0" />
              <span>일괄 불러오기</span>
            </button>

            {initialSnapshot &&
              initialCanvasSnapshot &&
              (importedFlags.left ||
                importedFlags.center ||
                importedFlags.right) && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyFullPreset(initialSnapshot, initialCanvasSnapshot);
                    setImportedFlags({ left: null, center: null, right: null });
                    showToast('모든 서식을 처음 상태로 되돌렸습니다.');
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>전체 원래대로</span>
                </button>
              )}
          </div>
          <p className="text-[11px] text-stone-500 text-center">
            일괄 내보내기 시 왼쪽·중앙·오른쪽 말풍선 서식과 현재 배경지 설정이 함께 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
