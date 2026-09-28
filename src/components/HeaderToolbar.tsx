import React from 'react';
import {
  Download,
  Plus,
  FileText,
  Sparkles,
  Copy,
  RotateCcw,
  Check,
  Loader2,
} from 'lucide-react';
import { CanvasConfig } from '../types';

interface HeaderToolbarProps {
  onAddBubble: () => void;
  onOpenImportModal: () => void;
  onOpenFontManager: () => void;
  onResetToSample: () => void;
  canvasConfig: CanvasConfig;
  onExportPng: () => Promise<void>;
  onCopyClipboard: () => Promise<void>;
  isExporting: boolean;
  copiedSuccess: boolean;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  onAddBubble,
  onOpenImportModal,
  onOpenFontManager,
  onResetToSample,
  canvasConfig,
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
      {/* Left: Tools and Actions (말풍선 추가, 쪽지 일괄 변환, 외부 글꼴 불러오기, 새로고침) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          id="btn-add-bubble"
          onClick={onAddBubble}
          title="말풍선 추가"
          aria-label="말풍선 추가"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
        >
          <Plus className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-amber-700" />
          <span className="hidden sm:inline">말풍선 추가</span>
        </button>

        <button
          type="button"
          id="btn-open-text-import"
          onClick={onOpenImportModal}
          title="쪽지 일괄 변환"
          aria-label="쪽지 일괄 변환"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
        >
          <FileText className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-stone-500" />
          <span className="hidden sm:inline">쪽지 일괄 변환</span>
        </button>

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
          onClick={onCopyClipboard}
          disabled={isExporting}
          title={copiedSuccess ? '복사 완료!' : '클립보드 복사'}
          aria-label={copiedSuccess ? '복사 완료!' : '클립보드 복사'}
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50 transition"
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
