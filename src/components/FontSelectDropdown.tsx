import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { WebFont } from '../types';
import { doesFontMatchQuery } from '../utils/fontLoader';

interface FontSelectDropdownProps {
  fonts: WebFont[];
  value: string;
  onChange: (family: string) => void;
}

export const FontSelectDropdown: React.FC<FontSelectDropdownProps> = ({
  fonts,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalize = (s: string) =>
    s.replace(/['"]/g, '').split(',')[0].trim().toLowerCase();

  const selectedFont =
    fonts.find(
      (f) =>
        f.family === value ||
        normalize(f.family) === normalize(value) ||
        value.includes(f.name)
    ) || fonts[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredFonts = fonts.filter((f) => {
    if (!searchQuery.trim()) return true;
    return doesFontMatchQuery(f, searchQuery);
  });

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onMouseDown={(e) => {
          // Prevent losing active text selection in canvas bubble when opening dropdown
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm text-stone-800 shadow-2xs hover:border-stone-300 focus:border-stone-800 focus:outline-none cursor-pointer transition"
      >
        <span
          className="truncate text-sm text-stone-900"
          style={{ fontFamily: selectedFont?.family || value }}
        >
          {selectedFont ? selectedFont.name : '폰트 선택'}
          {selectedFont?.isCustom ? ' ★' : ''}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 flex max-h-72 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
          {/* Quick Search Input */}
          <div className="flex items-center gap-1.5 border-b border-stone-100 bg-stone-50/80 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="폰트 이름 검색..."
              className="w-full bg-transparent text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchQuery('');
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Font Options List with each font rendered in its own fontFamily */}
          <div className="overflow-y-auto p-1">
            {filteredFonts.length === 0 ? (
              <div className="py-4 text-center text-xs text-stone-400">
                일치하는 폰트가 없습니다.
              </div>
            ) : (
              filteredFonts.map((f) => {
                const isSelected = selectedFont?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(f.family);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <span
                      className="truncate text-sm"
                      style={{ fontFamily: f.family }}
                    >
                      {f.name}
                      {f.isCustom ? ' ★' : ''}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
