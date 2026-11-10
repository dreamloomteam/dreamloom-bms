import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionsDropdownProps {
  items: ActionItem[];
  label?: string;
  align?: 'right' | 'left';
  buttonClassName?: string;
}

export default function ActionsDropdown({
  items,
  label = 'Actions',
  align = 'right',
  buttonClassName
}: ActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.filter(item => !item.hidden);

  // Close when clicking or touching outside
  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Determine whether to open upward or downward based on viewport space
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 220px below button, flip upwards
      if (spaceBelow < 220 && rect.top > 220) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
    setIsOpen(prev => !prev);
  };

  if (visibleItems.length === 0) {
    return (
      <span className="text-slate-400 text-xs italic px-2 py-1">No actions</span>
    );
  }

  const defaultBtnClass =
    'bg-[#0A5C36] hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm transition active:scale-95 select-none focus:outline-none';

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={handleToggle}
        className={buttonClassName || defaultBtnClass}
        title="Actions"
        aria-label="Actions dropdown menu"
      >
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${
            openUpward ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
          } w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-50 text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Normal actions */}
          <div className="py-1">
            {visibleItems
              .filter(item => !item.danger)
              .map(item => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled) {
                      setIsOpen(false);
                      item.onClick(e);
                    }
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center gap-2.5 transition ${
                    item.disabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-800 hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  {item.icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
          </div>

          {/* Danger actions (e.g. Delete) */}
          {visibleItems.some(item => item.danger) && (
            <div className="py-1">
              {visibleItems
                .filter(item => item.danger)
                .map(item => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!item.disabled) {
                        setIsOpen(false);
                        item.onClick(e);
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center gap-2.5 transition ${
                      item.disabled
                        ? 'text-rose-300 cursor-not-allowed'
                        : 'text-rose-600 hover:bg-rose-50 active:bg-rose-100'
                    }`}
                  >
                    {item.icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
