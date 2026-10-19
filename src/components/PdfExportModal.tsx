import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Files,
  Download,
  Loader2,
  Info,
} from 'lucide-react';
import { calculateOptimalPdfSlices } from '../utils/pdfExport';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (mode: 'single' | 'split') => Promise<void>;
  canvasEl: HTMLElement | null;
  isExporting: boolean;
  exportingFormat: 'png' | 'pdf' | 'pdf-single' | 'pdf-split' | null;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  canvasEl,
  isExporting,
  exportingFormat,
}) => {
  const [splitPageCount, setSplitPageCount] = useState<number>(1);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  const [canvasWidth, setCanvasWidth] = useState<number>(600);

  // Compute page count and canvas dimensions whenever modal is opened
  useEffect(() => {
    if (isOpen && canvasEl) {
      try {
        const slices = calculateOptimalPdfSlices(canvasEl);
        setSplitPageCount(Math.max(1, slices.length));
        setCanvasHeight(canvasEl.offsetHeight || 0);
        setCanvasWidth(canvasEl.offsetWidth || 600);
      } catch (err) {
        console.warn('Failed to calculate split slices:', err);
        setSplitPageCount(1);
      }
    }
  }, [isOpen, canvasEl]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  if (!isOpen) return null;

  const handleExportMode = async (mode: 'single' | 'split') => {
    if (isExporting) return;
    try {
      await onExport(mode);
      onClose();
    } catch {
      // Error handling managed in parent
    }
  };

  const isCurrentSingleExporting = isExporting && exportingFormat === 'pdf-single';
  const isCurrentSplitExporting = isExporting && exportingFormat === 'pdf-split';

  return (
    <div
      id="pdf-export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={isExporting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div
        id="pdf-export-modal-card"
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="pdf-modal-title"
                className="text-base font-bold text-stone-900"
              >
                PDF 저장 설정
              </h2>
              <p className="text-xs text-stone-500">
                원하는 저장 방식을 선택하면 즉시 PDF 파일로 내보냅니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition cursor-pointer disabled:opacity-40"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3">
          {/* Option 1: 단일 페이지 저장 버튼 (단일/분할 순서 변경) */}
          <button
            type="button"
            id="btn-export-pdf-single-direct"
            onClick={() => handleExportMode('single')}
            disabled={isExporting}
            className="group relative flex w-full items-start gap-3.5 rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-rose-400 hover:bg-rose-50/30 hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              {isCurrentSingleExporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-stone-900 group-hover:text-rose-950 transition-colors">
                  단일 페이지 저장
                </span>
                <span className="inline-flex items-center justify-center p-1 text-stone-900 transition-colors shrink-0">
                  {isCurrentSingleExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-stone-900" />
                  ) : (
                    <Download className="h-5 w-5 text-stone-900" />
                  )}
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed pr-2">
                전체 대화를 자르지 않고 세로로 긴 <strong>한 장의 PDF</strong>로 저장합니다.
              </p>
            </div>
          </button>

          {/* Option 2: 분할 페이지 저장 버튼 */}
          <button
            type="button"
            id="btn-export-pdf-split-direct"
            onClick={() => handleExportMode('split')}
            disabled={isExporting}
            className="group relative flex w-full items-start gap-3.5 rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              {isCurrentSplitExporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Files className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900 group-hover:text-indigo-950 transition-colors">
                    분할 페이지 저장
                  </span>
                  <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                    총 {splitPageCount}장
                  </span>
                </div>
                <span className="inline-flex items-center justify-center p-1 text-stone-900 transition-colors shrink-0">
                  {isCurrentSplitExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-stone-900" />
                  ) : (
                    <Download className="h-5 w-5 text-stone-900" />
                  )}
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed pr-2">
                긴 대화를 <strong>A4 비율</strong>에 가깝게 분할하여 저장합니다.
              </p>
            </div>
          </button>

          {/* Document Summary Info Box */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-xs text-stone-600 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-stone-800">
                대화 캔버스 크기: {canvasWidth.toLocaleString()}px ×{' '}
                {canvasHeight.toLocaleString()}px
              </div>
              <div className="text-[11px] text-stone-500">
                세로 4,000px부터는 뷰어 렉 및 화질 저하 방지를 위해 분할 저장을 권장합니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
