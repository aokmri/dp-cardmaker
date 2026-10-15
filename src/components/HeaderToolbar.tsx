import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  FileText,
  Type,
  Copy,
  RotateCcw,
  Undo2,
  Check,
  Loader2,
  ChevronDown,
  Image,
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
  onExportPdf: () => Promise<void>;
  onCopyClipboard: () => Promise<void>;
  isExporting: boolean;
  exportingFormat?: 'png' | 'pdf' | null;
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
  onExportPdf,
  onCopyClipboard,
  isExporting,
  exportingFormat = null,
  copiedSuccess,
}) => {
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setIsSaveMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSaveMenuOpen(false);
      }
    };

    if (isSaveMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSaveMenuOpen]);
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
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
        >
          <Type className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-stone-500" />
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
          title="내보내기/불러오기"
          aria-label="내보내기"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 lg:px-3 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
        >
          <Upload className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-stone-500" />
          <span className="hidden sm:inline">내보내기</span>
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
          className="flex items-center justify-center gap-1 whitespace-nowrap shrink-0 rounded-lg border border-stone-200 bg-white p-2 md:px-2.5 lg:py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 text-stone-500" />
          <span className="hidden md:inline">초기화</span>
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

        {/* '저장' 버튼 및 PNG/PDF 다운로드 드롭다운 */}
        <div className="relative" ref={saveMenuRef}>
          <button
            type="button"
            id="btn-export-save"
            onClick={() => {
              if (!isExporting) {
                setIsSaveMenuOpen((prev) => !prev);
              }
            }}
            disabled={isExporting}
            title={isExporting ? '저장 중...' : '저장 (이미지 / PDF)'}
            aria-label={isExporting ? '저장 중...' : '저장'}
            aria-expanded={isSaveMenuOpen}
            aria-haspopup="menu"
            className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-stone-900 p-2 sm:px-3 sm:py-2 lg:px-4 lg:py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 animate-spin" />
                <span className="hidden sm:inline">
                  {exportingFormat === 'pdf' ? 'PDF 저장 중...' : '저장 중...'}
                </span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
                <span className="hidden sm:inline">저장</span>
                <ChevronDown
                  className={`hidden sm:inline-block h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform duration-200 ${
                    isSaveMenuOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </>
            )}
          </button>

          {/* PNG / PDF 드롭다운 메뉴 */}
          {isSaveMenuOpen && !isExporting && (
            <div
              id="dropdown-save-formats"
              role="menu"
              aria-label="저장 형식 선택"
              className="absolute right-0 top-full mt-1.5 w-48 sm:w-52 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2.5 py-1 text-[11px] font-semibold text-stone-400 border-b border-stone-100 mb-1">
                저장 포맷 선택
              </div>

              {/* PNG (이미지 파일) 다운로드 버튼 */}
              <button
                type="button"
                id="btn-export-png"
                role="menuitem"
                onClick={() => {
                  setIsSaveMenuOpen(false);
                  void onExportPng();
                }}
                className="w-full flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-stone-800 hover:bg-stone-100 active:bg-stone-200 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-800 transition">
                    <Image className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">이미지 파일</div>
                    <div className="text-[10px] text-stone-500">투명·웹 이미지</div>
                  </div>
                </div>
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-600">
                  .png
                </span>
              </button>

              {/* PDF 다운로드 버튼 */}
              <button
                type="button"
                id="btn-export-pdf"
                role="menuitem"
                onClick={() => {
                  setIsSaveMenuOpen(false);
                  void onExportPdf();
                }}
                className="w-full flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-stone-800 hover:bg-stone-100 active:bg-stone-200 transition group cursor-pointer mt-0.5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-700 group-hover:bg-rose-100 group-hover:text-rose-800 transition">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">PDF 문서</div>
                    <div className="text-[10px] text-stone-500">텍스트 복사·검색 가능</div>
                  </div>
                </div>
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-600">
                  .pdf
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
