'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Check, Search, ShieldCheck } from 'lucide-react';

export interface MemberItem {
  id: string | number;
  name?: string;
  fullName?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
  avatar?: string;
}

interface MemberAutocompleteProps {
  value: string;
  onChange: (fullName: string, member?: MemberItem) => void;
  members: MemberItem[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  autoFocus?: boolean;
  label?: string;
}

export default function MemberAutocomplete({
  value,
  onChange,
  members,
  placeholder = 'Type member name or ID (e.g. Simon, 001)...',
  required = false,
  className = '',
  id,
  autoFocus = false,
  label,
}: MemberAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal query when value prop changes externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute matched member suggestions (case-insensitive, max 6-8 items, deduplicated)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty and dropdown opened, show all initial members up to 8
      return members.slice(0, 8);
    }

    const seenIds = new Set<string>();
    const matched: MemberItem[] = [];

    // Prioritize startsWith matches first, then contains matches
    const startsWithMatches: MemberItem[] = [];
    const containsMatches: MemberItem[] = [];

    for (const m of members) {
      const full = (m.fullName || m.name || '').toLowerCase();
      const first = (m.name || full.split(' ')[0] || '').toLowerCase();
      const idStr = String(m.id || '').toLowerCase();
      const idDigits = idStr.replace(/[^0-9]/g, '');
      const natId = String(m.nationalId || '').toLowerCase();

      const uniqueKey = `${m.id}-${m.fullName || m.name}`;
      if (seenIds.has(uniqueKey)) continue;

      if (
        full.startsWith(q) ||
        first.startsWith(q) ||
        idStr.startsWith(q) ||
        (idDigits && idDigits.startsWith(q))
      ) {
        seenIds.add(uniqueKey);
        startsWithMatches.push(m);
      } else if (
        full.includes(q) ||
        idStr.includes(q) ||
        (idDigits && idDigits.includes(q)) ||
        natId.includes(q)
      ) {
        seenIds.add(uniqueKey);
        containsMatches.push(m);
      }

      if (startsWithMatches.length + containsMatches.length >= 8) break;
    }

    return [...startsWithMatches, ...containsMatches].slice(0, 8);
  }, [members, query]);

  const handleSelect = (member: MemberItem) => {
    const selectedName = member.fullName || member.name || '';
    setQuery(selectedName);
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(selectedName, member);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Tab') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          required={required}
          autoFocus={autoFocus}
          value={query}
          autoComplete="off"
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className={
            className ||
            'w-full bg-[#142036] border border-[#1E2D4A] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm'
          }
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center gap-1">
          <Search className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0F172A] border border-emerald-600/40 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-72 overflow-y-auto backdrop-blur-md">
          <div className="px-3 py-1.5 bg-[#142036] border-b border-[#1E293B] flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Registered Members ({suggestions.length})</span>
            <span className="text-[10px] text-emerald-400">↑↓ to navigate • ↵ select</span>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              No matching members found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="divide-y divide-[#1E293B]/60">
              {suggestions.map((m, idx) => {
                const isActive = activeIndex === idx;
                const displayName = m.fullName || m.name || 'Member';
                const idDisplay = m.id ? String(m.id).replace('MEM-', '') : String(idx + 1).padStart(3, '0');

                return (
                  <button
                    key={`${m.id}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(m)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                      isActive ? 'bg-emerald-950/60 text-white' : 'hover:bg-[#142036] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {displayName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{displayName}</span>
                          {m.role?.includes('Director') && (
                            <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-mono">
                            ID: {idDisplay}
                          </span>
                          {m.nationalId && <span>ID No: {m.nationalId}</span>}
                          {m.role && <span className="text-emerald-300/80">• {m.role}</span>}
                        </div>
                      </div>
                    </div>

                    {query && displayName.toLowerCase().includes(query.toLowerCase()) && (
                      <span className="text-emerald-400 text-xs flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
