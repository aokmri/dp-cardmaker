import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, ClipboardPaste, X, CheckCircle2, RefreshCw } from 'lucide-react';

interface ClipboardGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasteReceived: (htmlData: string, plainText: string) => void;
  onRetryPermission: () => Promise<boolean>;
  permissionState?: PermissionState | 'unknown';
}

export const ClipboardGuideModal: React.FC<ClipboardGuideModalProps> = ({
  isOpen,
  onClose,
  onPasteReceived,
  onRetryPermission,
  permissionState = 'unknown',
}) => {
  const pasteBoxRef = useRef<HTMLDivElement>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRetryError(null);
      return;
    }
    const timer = setTimeout(() => {
      pasteBoxRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    if (pasteBoxRef.current) {
      pasteBoxRef.current.innerHTML = '';
    }

    if (htmlData || plainText) {
      onPasteReceived(htmlData, plainText);
      onClose();
    }
  };

  const handleRetryClick = async () => {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const success = await onRetryPermission();
      if (success) {
        onClose();
      } else {
        setRetryError(
          '브라우저에서 클립보드 접근이 차단되어 있습니다. 주소창 왼쪽 아이콘에서 권한을 허용하거나 아래 칸에 직접 붙여넣어 주세요.'
        );
        pasteBoxRef.current?.focus();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/55 p-4 backdrop-blur-xs"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                클립보드 접근 권한 및 직접 붙여넣기 안내
              </h3>
              <p className="text-[11px] text-stone-500">
                {permissionState === 'denied'
                  ? '현재 브라우저에서 클립보드 읽기 권한이 거부되어 있습니다.'
                  : '브라우저 보안 정책으로 인해 자동 불러오기가 제한되었습니다.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            title="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Direct Paste Box inside the Alert Modal */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
            <ClipboardPaste className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span>방법 1. 아래 칸에 직접 붙여넣기 (권한 설정 없이 즉시 작동)</span>
          </label>
          <div
            ref={pasteBoxRef}
            contentEditable
            suppressContentEditableWarning
            onPaste={handlePaste}
            data-placeholder="여기를 클릭(또는 길게 터치) 후 붙여넣기 (Ctrl+V) 하세요"
            className="flex min-h-[72px] w-full items-center justify-center rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/60 p-3 text-center text-xs font-medium text-stone-700 focus:border-amber-600 focus:bg-amber-50 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-amber-900/70 cursor-text"
          />
          <p className="text-[11px] text-stone-500 leading-relaxed">
            • <strong>PC:</strong> 지금 바로 키보드에서 <kbd className="rounded border border-stone-300 bg-stone-100 px-1 py-0.5 text-[10px] font-semibold">Ctrl</kbd> + <kbd className="rounded border border-stone-300 bg-stone-100 px-1 py-0.5 text-[10px] font-semibold">V</kbd>를 누르면 창이 자동으로 닫히며 글꼴이 인식됩니다.<br />
            • <strong>모바일:</strong> 위 점선 박스를 손가락으로 길게 눌러 <strong>[붙여넣기]</strong>를 선택해 주세요.
          </p>
        </div>

        {/* Browser Permission Instructions */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2 text-[11px] text-stone-600">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-stone-800 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              방법 2. 클립보드 접근 권한 허용하기
            </span>
            <button
              type="button"
              onClick={handleRetryClick}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 shrink-0 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-950 hover:bg-amber-200 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>권한 다시 요청</span>
            </button>
          </div>
          <p className="leading-relaxed">
            브라우저 주소창 왼쪽의 <strong>자물쇠(또는 사이트 설정) 아이콘</strong>을 누른 뒤, <strong>클립보드(Clipboard)</strong> 권한을 <strong>[허용]</strong>으로 변경하면 버튼 클릭 한 번으로 바로 불러올 수 있습니다.
          </p>
          {retryError && (
            <p className="text-[11px] font-medium text-rose-600 pt-0.5">
              {retryError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
