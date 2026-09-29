import React from 'react';
import {
  Download,
  FileText,
  Sparkles,
  Copy,
  RotateCcw,
  Undo2,
  Check,
  Loader2,
  Layers,
} from 'lucide-react';
import { CanvasConfig } from '../types';

interface HeaderToolbarProps {
  onOpenImportModal: () => void;
  onOpenFontManager: () => void;
  onOpenStylePresetModal: () => void;
  onResetToSample: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  canvasConfig: CanvasConfig;
  onExportPng: () => Promise<void>;
  onCopyClipboard: () => Promise<void>;
  isExporting: boolean;
  copiedSuccess: boolean;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  onOpenImportModal,
  onOpenFontManager,
  onOpenStylePresetModal,
  onResetToSample,
  onUndo,
  canUndo = false,
  onExportPng,
  onCopyClipboard,
  isExporting,
  copiedSuccess,
}) => {
  return (
    <header
      id="app-header-toolbar"
      className="sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-2 border-b border-stone-200 bg-white/95 px-3 sm:px-6 shadow-xs backdrop-blur-md"
    >
      {/* Left: Tools and Actions (폰트목록&추가 / 쪽지일괄변환 / 서식 / 뒤로가기 / 초기화) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          id="btn-open-font-manager"
          onClick={onOpenFontManager}
          title="폰트목록&추가"
          aria-label="폰트목록&추가"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-amber-200 bg-amber-50/70 p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-amber-900 shadow-2xs hover:bg-amber-100/70 transition cursor-pointer"
        >
          <Sparkles className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-amber-700" />
          <span className="hidden sm:inline">폰트목록&amp;추가</span>
        </button>

        <button
          type="button"
          id="btn-open-text-import"
          onClick={onOpenImportModal}
          title="쪽지일괄변환"
          aria-label="쪽지일괄변환"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
        >
          <FileText className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-stone-500" />
          <span className="hidden sm:inline">쪽지일괄변환</span>
        </button>

        <button
          type="button"
          id="btn-open-style-preset"
          onClick={onOpenStylePresetModal}
          title="서식 내보내기/불러오기"
          aria-label="서식"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
        >
          <Layers className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-stone-500" />
          <span className="hidden sm:inline">서식</span>
        </button>

        {onUndo && (
          <button
            type="button"
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="뒤로가기 (Ctrl+Z)"
            aria-label="뒤로가기"
            className="flex items-center justify-center gap-1 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-2.5 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          >
            <Undo2 className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
            <span className="hidden md:inline">뒤로가기</span>
          </button>
        )}

        <button
          type="button"
          onClick={onResetToSample}
          title="초기화"
          aria-label="초기화"
          className="flex items-center justify-center shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:p-1.5 text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
        </button>
      </div>

      {/* Right: Export & Copy */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          id="btn-copy-clipboard"
          onClick={() => {
            if (!isExporting) {
              onCopyClipboard();
            }
          }}
          aria-disabled={isExporting}
          title={copiedSuccess ? '복사 완료!' : '클립보드 복사'}
          aria-label={copiedSuccess ? '복사 완료!' : '클립보드 복사'}
          className={`flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition ${
            isExporting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
          }`}
        >
          {copiedSuccess ? (
            <>
              <Check className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-emerald-600" />
              <span className="hidden lg:inline text-emerald-700 font-semibold">복사 완료!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-stone-500" />
              <span className="hidden lg:inline">클립보드 복사</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="btn-export-png"
          onClick={onExportPng}
          disabled={isExporting}
          title={isExporting ? '저장 중...' : 'PNG 고화질 저장'}
          aria-label={isExporting ? '저장 중...' : 'PNG 고화질 저장'}
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-stone-900 p-2 lg:px-4 lg:py-1.5 text-xs font-medium text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 animate-spin" />
              <span className="hidden lg:inline">저장 중...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
              <span className="hidden lg:inline">PNG 고화질 저장</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
