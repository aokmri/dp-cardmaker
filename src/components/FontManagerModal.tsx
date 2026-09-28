import React, { useState } from 'react';
import { X, Upload, Plus, Trash2, ExternalLink, Sparkles, Check, Search } from 'lucide-react';
import { WebFont } from '../types';
import {
  loadWebFontFromCss,
  loadFontFromFile,
  removeCustomFont,
  detectFontsFromClipboard,
  DetectedFontCandidate,
} from '../utils/fontLoader';

interface FontManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fonts: WebFont[];
  onAddFont: (font: WebFont) => void;
  onRemoveFont?: (fontId: string) => void;
  onSelectFont: (family: string) => void;
  currentFamily: string;
}

export const FontManagerModal: React.FC<FontManagerModalProps> = ({
  isOpen,
  onClose,
  fonts,
  onAddFont,
  onRemoveFont,
  onSelectFont,
  currentFamily,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'upload' | 'detect'>('custom');
  const [fontName, setFontName] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewText, setPreviewText] = useState('별빛이 흐르는 밤, 당신의 다정한 목소리가 머문다.');
  const [presetSearch, setPresetSearch] = useState('');

  // Font detector state
  const [detectInput, setDetectInput] = useState('');
  const [detectedCandidates, setDetectedCandidates] = useState<DetectedFontCandidate[]>([]);
  const [detectStatus, setDetectStatus] = useState<string>('');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const runDetection = (htmlData: string, plainText: string) => {
    const results = detectFontsFromClipboard(htmlData, plainText, fonts);
    setDetectedCandidates(results);
    setAppliedNotice(null);

    if (results.length > 0) {
      const builtInMatches = results.filter((r) => r.matchedFont !== null);
      if (builtInMatches.length > 0) {
        setDetectStatus(
          `총 ${results.length}개의 글꼴 후보 중 사이트 내장 글꼴 ${builtInMatches.length}개를 찾았습니다! 아래 버튼을 눌러 바로 적용해보세요.`
        );
      } else {
        setDetectStatus(
          `총 ${results.length}개의 글꼴 후보를 발견했으나 사이트 내장 목록에는 없습니다. 아래 구글 검색으로 웹폰트 코드를 찾아 추가해보세요.`
        );
      }
    } else {
      setDetectStatus(
        '클립보드에 HTML 글꼴 서식이 없거나 일치하는 내장 폰트를 찾지 못했습니다. 아래 구글 검색으로 찾아보세요.'
      );
    }
  };

  const handlePasteDetector = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');
    runDetection(htmlData, plainText);
  };

  const handleManualDetectSearch = () => {
    const trimmed = detectInput.trim();
    if (!trimmed) {
      setDetectStatus('복사한 글자를 붙여넣거나 찾을 글꼴 이름을 입력해주세요.');
      setDetectedCandidates([]);
      return;
    }
    const results = detectFontsFromClipboard('', trimmed, fonts);
    setDetectedCandidates(results);
    setAppliedNotice(null);

    const hasBuiltIn = results.some((r) => r.matchedFont !== null);
    if (hasBuiltIn) {
      setDetectStatus('일치하는 사이트 내장 글꼴을 찾았습니다! 아래 버튼을 눌러 바로 적용해보세요.');
    } else {
      setDetectStatus(
        `'${trimmed}'와(과) 일치하는 내장 글꼴이 없습니다. 구글 검색창에서 검색해보세요.`
      );
    }
  };

  const handleAddFromCss = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!cssCode.trim()) {
      setErrorMsg('웹폰트 코드(@font-face, @import, 또는 링크 URL)를 입력해주세요.');
      return;
    }

    try {
      const id = `custom-${Date.now()}`;
      const name = fontName.trim() || '사용자 지정 글꼴';
      const newFont = loadWebFontFromCss(id, name, cssCode);
      onAddFont(newFont);
      onSelectFont(newFont.family);
      setFontName('');
      setCssCode('');
      setActiveTab('presets');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '글꼴을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    try {
      const newFont = await loadFontFromFile(file, fontName.trim() || undefined);
      onAddFont(newFont);
      onSelectFont(newFont.family);
      setFontName('');
      setActiveTab('presets');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '폰트 파일을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveFont = (fontId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeCustomFont(fontId);
    if (onRemoveFont) {
      onRemoveFont(fontId);
    }
  };

  return (
    <div
      id="font-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="font-manager-modal"
        className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              폰트목록&amp;추가
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              타 사이트(눈누, 구글 폰트 등)의 웹폰트나 컴퓨터의 글꼴 파일을 추가해 바로 사용할 수 있습니다.
            </p>
          </div>
          <button
            id="close-font-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-b border-stone-200 overflow-x-auto">
          <button
            id="tab-btn-presets"
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'presets'
                ? 'border-b-2 border-stone-900 text-stone-900'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            전체 글꼴 목록 ({fonts.length})
          </button>
          <button
            id="tab-btn-custom"
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'custom'
                ? 'border-b-2 border-stone-900 text-stone-900'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            웹폰트 추가
          </button>
          <button
            id="tab-btn-upload"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'upload'
                ? 'border-b-2 border-stone-900 text-stone-900'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            폰트 업로드
          </button>
          <button
            id="tab-btn-detect"
            onClick={() => setActiveTab('detect')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'detect'
                ? 'border-b-2 border-stone-900 text-stone-900'
                : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            폰트 찾기
          </button>
        </div>

        {/* Content area */}
        <div className="mt-4 max-h-[460px] overflow-y-auto pr-1">
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 rounded-lg bg-stone-50 p-3">
                <div>
                  <label className="text-xs font-medium text-stone-500">미리보기 문장</label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="mt-1 w-full rounded border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500">내장 글꼴 이름 검색</label>
                  <input
                    type="text"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="예: 고운바탕, 학교안심, 나눔손글씨..."
                    className="mt-1 w-full rounded border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {fonts
                  .filter(
                    (f) =>
                      !presetSearch.trim() ||
                      f.name.toLowerCase().includes(presetSearch.trim().toLowerCase()) ||
                      f.family.toLowerCase().includes(presetSearch.trim().toLowerCase())
                  )
                  .map((f) => {
                    const isSelected = currentFamily.includes(f.name) || currentFamily === f.family;
                    return (
                      <div
                        key={f.id}
                        onClick={() => onSelectFont(f.family)}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-stone-900 bg-stone-50/80 shadow-xs ring-1 ring-stone-900'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-700">{f.name}</span>
                          <div className="flex items-center gap-1.5">
                            {f.isCustom && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                사용자 추가
                              </span>
                            )}
                            {isSelected && <Check className="h-4 w-4 text-stone-900" />}
                            {f.isCustom && (
                              <button
                                onClick={(e) => handleRemoveFont(f.id, e)}
                                title="글꼴 삭제"
                                className="opacity-0 group-hover:opacity-100 rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p
                          className="mt-2 line-clamp-1 text-lg text-stone-900"
                          style={{ fontFamily: f.family }}
                        >
                          {previewText}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleAddFromCss} className="space-y-4">
              {/* 1. 글꼴 이름 */}
              <div>
                <label className="block text-xs font-semibold text-stone-700">글꼴 이름</label>
                <input
                  type="text"
                  placeholder="예: 마루 부리, 온글잎 손글씨"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3.5 py-2 text-sm text-stone-800 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
                />
              </div>

              {/* 2. 웹폰트 코드 */}
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  웹폰트 코드 또는 URL (@font-face, @import, link, 또는 woff2 주소)
                </label>
                <textarea
                  rows={4}
                  placeholder={`@font-face {\n  font-family: 'MyFont';\n  src: url('https://cdn.example.com/font.woff2') format('woff2');\n}`}
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 font-mono text-xs p-3 text-stone-800 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
                />
              </div>

              {/* 3. 연동방법 */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900">
                <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  타 사이트 웹폰트(눈누, 구글 폰트 등) 연동 방법
                </p>
                <p className="mt-1 leading-relaxed">
                  1. 무료 상용 폰트 사이트인 <strong className="underline">눈누(noonnu.cc)</strong>나 구글 폰트에서 원하는 폰트 페이지로 이동합니다.<br />
                  2. <strong>웹폰트로 사용</strong>에 적힌 <code>@font-face {'{ ... }'}</code> 코드나 <code>@import</code>, 또는 <code>.woff2</code> 링크를 복사하여 위에 붙여넣으면 즉시 적용됩니다!
                </p>
              </div>

              {errorMsg && (
                <p className="text-xs font-medium text-rose-600">{errorMsg}</p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="submit-webfont-btn"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  글꼴 등록하고 사용하기
                </button>
              </div>
            </form>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
                <p className="font-semibold text-stone-800">
                  내 컴퓨터에 있는 폰트 파일 직접 등록
                </p>
                <p className="mt-1 leading-relaxed">
                  보유하고 계신 <code>.ttf</code>, <code>.otf</code>, <code>.woff</code>, <code>.woff2</code> 파일을 브라우저로 직접 로드하여 사용할 수 있습니다. 외부 서버로 파일이 전송되지 않고 안전하게 현재 세션에 로드됩니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">글꼴 표시 이름 (선택)</label>
                <input
                  type="text"
                  placeholder="미입력 시 파일명으로 자동 지정"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3.5 py-2 text-sm text-stone-800 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
                />
              </div>

              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 p-8 hover:border-stone-500 hover:bg-stone-50/50 cursor-pointer transition">
                <Upload className="h-8 w-8 text-stone-400" />
                <span className="mt-2 text-sm font-medium text-stone-700">
                  폰트 파일 선택 또는 드래그 앤 드롭
                </span>
                <span className="mt-1 text-xs text-stone-400">
                  지원 형식: .ttf, .otf, .woff, .woff2
                </span>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {errorMsg && (
                <p className="text-xs font-medium text-rose-600">{errorMsg}</p>
              )}
            </div>
          )}

          {activeTab === 'detect' && (
            <div className="space-y-4">
              {/* Paste detection box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    타 사이트에서 복사한 글자를 아래 상자에 붙여넣기(Ctrl+V)하거나 폰트 이름을 입력하세요
                  </label>
                  <button
                    type="button"
                    onClick={handleManualDetectSearch}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>글꼴 찾기</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={detectInput}
                  onChange={(e) => setDetectInput(e.target.value)}
                  onPaste={handlePasteDetector}
                  placeholder="타 웹사이트에서 복사한 글자를 여기에 붙여넣거나(Ctrl+V), 찾고 싶은 글꼴 이름을 입력 후 [글꼴 찾기]를 눌러보세요..."
                  className="w-full rounded-xl border border-stone-200 p-3.5 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
                />

                {detectStatus && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 bg-stone-50 rounded-lg p-2.5">
                    <span>{detectStatus}</span>
                    {detectedCandidates.length === 0 && (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                          (detectInput.trim() || '웹폰트') + ' 폰트'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                      >
                        구글 검색 ↗
                      </a>
                    )}
                  </div>
                )}

                {appliedNotice && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{appliedNotice}</span>
                  </div>
                )}

                {detectedCandidates.length > 0 && (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                    <span className="text-xs font-semibold text-emerald-900">
                      감지된 글꼴 후보 및 내장 글꼴 매칭 결과:
                    </span>
                    <div className="space-y-2 pt-1">
                      {detectedCandidates.map((item) => {
                        const matched = item.matchedFont;
                        const isSelected =
                          matched &&
                          (currentFamily === matched.family ||
                            currentFamily.includes(matched.name));

                        return (
                          <div
                            key={item.rawName}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-white p-3 shadow-2xs"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-stone-900">
                                  {matched ? matched.name : item.rawName}
                                </span>
                                {matched ? (
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                    사이트 내장 글꼴
                                  </span>
                                ) : (
                                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                                    미내장 글꼴
                                  </span>
                                )}
                                {matched &&
                                  item.rawName.toLowerCase() !== matched.name.toLowerCase() && (
                                    <span className="text-[11px] text-stone-400">
                                      (감지명: {item.rawName})
                                    </span>
                                  )}
                              </div>
                              {matched && (
                                <p
                                  className="text-sm text-stone-700 truncate pt-0.5"
                                  style={{ fontFamily: matched.family }}
                                >
                                  {previewText}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {matched ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectFont(matched.family);
                                    setAppliedNotice(
                                      `'${matched.name}' 내장 글꼴로 적용되었습니다!`
                                    );
                                  }}
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-stone-900 text-white hover:bg-stone-800'
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>
                                    {isSelected ? '적용됨' : `'${matched.name}' 글꼴로 적용`}
                                  </span>
                                </button>
                              ) : (
                                <a
                                  href={`https://www.google.com/search?q=${encodeURIComponent(
                                    item.rawName + ' 폰트'
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded border border-stone-300 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-800 hover:bg-stone-100"
                                >
                                  구글 검색 ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
