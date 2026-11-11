'use client';

import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  RotateCcw,
  Copy,
  Layers,
  Type,
  Maximize2,
  Minimize2,
  Sparkles,
  Table as TableIcon,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  PageAppearanceSettings,
  PRESET_THEMES,
  BACKGROUND_SWATCHES,
  TABLE_HEADER_SWATCHES,
  ALTERNATING_ROW_PRESETS,
  FONT_OPTIONS,
  ALL_PAGE_KEYS,
  DEFAULT_PAGE_APPEARANCE
} from '@/lib/appearance';

interface AppearanceCustomizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  currentSettings: PageAppearanceSettings;
  onPreviewChange: (newSettings: PageAppearanceSettings) => void;
  onSave: (settings: PageAppearanceSettings) => Promise<void>;
  onResetPage: () => Promise<void>;
  onApplyToAll: (settings: PageAppearanceSettings) => Promise<void>;
  onCopyFromPage: (fromPage: string) => Promise<void>;
}

export default function AppearanceCustomizerDrawer({
  isOpen,
  onClose,
  activePage,
  currentSettings,
  onPreviewChange,
  onSave,
  onResetPage,
  onApplyToAll,
  onCopyFromPage,
}: AppearanceCustomizerDrawerProps) {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<PageAppearanceSettings>({ ...currentSettings });
  const [activeTabSection, setActiveTabSection] = useState<'presets' | 'background' | 'typography' | 'tables' | 'colors' | 'tools'>('presets');
  const [copySourcePage, setCopySourcePage] = useState<string>(
    ALL_PAGE_KEYS.find(k => k !== activePage) || 'Overview'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Update a single setting and trigger immediate live preview
  const updateSetting = <K extends keyof PageAppearanceSettings>(key: K, value: PageAppearanceSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    onPreviewChange(updated);
  };

  // Apply a preset theme
  const applyPreset = (presetName: string) => {
    const preset = PRESET_THEMES[presetName];
    if (preset) {
      const updated = { ...preset, presetName };
      setSettings(updated);
      onPreviewChange(updated);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      await onSave(settings);
      setSaveSuccessMsg(`Appearance for "${activePage}" saved successfully!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert('Error saving appearance: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToAll = async () => {
    if (confirm(`Apply these appearance settings to ALL pages across Dreamloom Financial?`)) {
      setIsSaving(true);
      try {
        await onApplyToAll(settings);
        setSaveSuccessMsg('Applied to all pages successfully!');
        setTimeout(() => setSaveSuccessMsg(null), 2500);
      } catch (err: any) {
        alert('Error: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleReset = async () => {
    if (confirm(`Reset appearance for "${activePage}" back to system defaults?`)) {
      await onResetPage();
      setSettings({ ...DEFAULT_PAGE_APPEARANCE });
      onPreviewChange(DEFAULT_PAGE_APPEARANCE);
      setSaveSuccessMsg(`"${activePage}" reset to default.`);
      setTimeout(() => setSaveSuccessMsg(null), 2000);
    }
  };

  const handleCopy = async () => {
    try {
      await onCopyFromPage(copySourcePage);
      setSaveSuccessMsg(`Copied settings from "${copySourcePage}".`);
      setTimeout(() => setSaveSuccessMsg(null), 2000);
    } catch (err: any) {
      alert('Error copying: ' + err.message);
    }
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] md:w-[500px] bg-white border-l border-slate-200 shadow-2xl flex flex-col font-sans text-slate-800 transition-transform duration-300 ease-out"
      aria-label="Appearance Customisation Panel"
    >
      {/* 1. Header Bar */}
      <div className="bg-[#064E3B] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 select-none shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight leading-tight">Appearance &amp; Customisation</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Active Page:</span>
              <span className="text-[11px] bg-emerald-800/80 text-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-600/50">
                {activePage}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          title="Close Customizer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Success Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-900 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-2 overflow-x-auto shrink-0 select-none text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTabSection('presets')}
          className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTabSection === 'presets'
              ? 'border-[#064E3B] text-[#064E3B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>
        <button
          onClick={() => setActiveTabSection('background')}
          className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTabSection === 'background'
              ? 'border-[#064E3B] text-[#064E3B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Surfaces</span>
        </button>
        <button
          onClick={() => setActiveTabSection('typography')}
          className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTabSection === 'typography'
              ? 'border-[#064E3B] text-[#064E3B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Typography</span>
        </button>
        <button
          onClick={() => setActiveTabSection('tables')}
          className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTabSection === 'tables'
              ? 'border-[#064E3B] text-[#064E3B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Tables</span>
        </button>
        <button
          onClick={() => setActiveTabSection('colors')}
          className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTabSection === 'colors'
              ? 'border-[#064E3B] text-[#064E3B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Colors</span>
        </button>
        <button
          onClick={() => setActiveTabSection('tools')}
          className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTabSection === 'tools'
              ? 'border-[#064E3B] text-[#064E3B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Sync</span>
        </button>
      </div>

      {/* 4. Scrollable Controls Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-xs text-slate-700">

        {/* SECTION A: PRESET THEMES */}
        {activeTabSection === 'presets' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">One-Click Professional Themes</h3>
              <p className="text-[11px] text-slate-500">Apply a balanced theme immediately, then refine any color or font.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(PRESET_THEMES).map(([name, preset]) => {
                const isSelected = settings.presetName === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyPreset(name)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#064E3B] ring-2 ring-[#064E3B]/20 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-xs">{name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#064E3B]" />}
                    </div>
                    {/* Visual Color Palette Chips */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs" style={{ backgroundColor: preset.pageBg }} title="Page Background" />
                      <div className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs" style={{ backgroundColor: preset.tableHeaderBg }} title="Table Header" />
                      <div className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs" style={{ backgroundColor: preset.oddRowBg }} title="Alternating Row" />
                      <div className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs" style={{ backgroundColor: preset.buttonBg }} title="Primary Button" />
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 font-medium">Font: {preset.fontFamily}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Selecting a preset applies immediately to the live preview. You can still modify any individual property before clicking Save.</span>
            </div>
          </div>
        )}

        {/* SECTION B: BACKGROUNDS & SURFACES */}
        {activeTabSection === 'background' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">Canvas &amp; Surfaces</h3>
              <p className="text-[11px] text-slate-500">Customize main page background, card panels, and borders.</p>
            </div>

            {/* Page Background Swatches */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Page Background Colour</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {BACKGROUND_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => updateSetting('pageBg', swatch.hex)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                      settings.pageBg.toLowerCase() === swatch.hex.toLowerCase()
                        ? 'border-[#064E3B] ring-2 ring-[#064E3B]/20 font-bold text-[#064E3B]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: swatch.hex }} />
                    <span className="text-[11px] truncate">{swatch.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Colour Picker */}
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="color"
                  value={settings.pageBg}
                  onChange={(e) => updateSetting('pageBg', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                />
                <div className="flex-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Custom Page Background (Hex)</span>
                  <input
                    type="text"
                    value={settings.pageBg}
                    onChange={(e) => updateSetting('pageBg', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Card Background */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Card / Container Background</label>
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="color"
                  value={settings.cardBg}
                  onChange={(e) => updateSetting('cardBg', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                />
                <div className="flex-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Card Container Colour</span>
                  <input
                    type="text"
                    value={settings.cardBg}
                    onChange={(e) => updateSetting('cardBg', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Border Colour */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Panel &amp; Divider Border Colour</label>
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="color"
                  value={settings.borderColor}
                  onChange={(e) => updateSetting('borderColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                />
                <div className="flex-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Border Hex</span>
                  <input
                    type="text"
                    value={settings.borderColor}
                    onChange={(e) => updateSetting('borderColor', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: TYPOGRAPHY & FONTS */}
        {activeTabSection === 'typography' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">Typography &amp; Font Families</h3>
              <p className="text-[11px] text-slate-500">Switch between 10 professional font designs with live preview.</p>
            </div>

            {/* Font Family Cards */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800">Select Font Family</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = settings.fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateSetting('fontFamily', f.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-[#064E3B] ring-2 ring-[#064E3B]/20 bg-emerald-50/50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs" style={{ fontFamily: f.cssFamily }}>
                          {f.name}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-[#064E3B]" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{f.category}</p>
                      <p className="text-[11px] text-slate-700 mt-1 truncate" style={{ fontFamily: f.cssFamily }}>
                        123,456 KES • Dreamloom
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size Preset Scales */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Overall Font Size Scale</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {(['small', 'medium', 'large', 'xlarge'] as const).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => updateSetting('fontSizeScale', scale)}
                    className={`py-2 rounded-lg border text-center font-bold capitalize transition text-xs ${
                      settings.fontSizeScale === scale
                        ? 'border-[#064E3B] bg-[#064E3B] text-white'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>

              {/* Custom Size Slider */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-700">Custom Base Font Size</span>
                  <span className="text-xs font-mono font-bold text-[#064E3B]">{settings.fontSizeCustom || 14}px</span>
                </div>
                <input
                  type="range"
                  min={11}
                  max={20}
                  step={1}
                  value={settings.fontSizeCustom || 14}
                  onChange={(e) => updateSetting('fontSizeCustom', Number(e.target.value))}
                  className="w-full accent-[#064E3B] cursor-pointer"
                />
              </div>
            </div>

            {/* Granular Independent Font Sizes */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="block font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                Granular Component Font Sizes (px)
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Main Heading (H1)</label>
                  <input
                    type="number"
                    min={18}
                    max={40}
                    value={settings.mainHeadingSize || 24}
                    onChange={(e) => updateSetting('mainHeadingSize', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section Heading (H2)</label>
                  <input
                    type="number"
                    min={14}
                    max={30}
                    value={settings.sectionHeadingSize || 18}
                    onChange={(e) => updateSetting('sectionHeadingSize', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Table Headings</label>
                  <input
                    type="number"
                    min={9}
                    max={16}
                    value={settings.tableHeadingSize || 11}
                    onChange={(e) => updateSetting('tableHeadingSize', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Table Cell Content</label>
                  <input
                    type="number"
                    min={10}
                    max={18}
                    value={settings.tableContentSize || 12}
                    onChange={(e) => updateSetting('tableContentSize', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Form Labels</label>
                  <input
                    type="number"
                    min={10}
                    max={16}
                    value={settings.formLabelSize || 12}
                    onChange={(e) => updateSetting('formLabelSize', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Action Buttons</label>
                  <input
                    type="number"
                    min={10}
                    max={16}
                    value={settings.buttonSize || 12}
                    onChange={(e) => updateSetting('buttonSize', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION D: TABLES & REGISTERS */}
        {activeTabSection === 'tables' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">Table &amp; Register Customisation</h3>
              <p className="text-[11px] text-slate-500">Fine-tune header styling, alternating row rows, and cell spacing.</p>
            </div>

            {/* Alternating Row Presets */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Alternating Row Colour Combinations</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {ALTERNATING_ROW_PRESETS.map((p) => {
                  const isMatch = settings.evenRowBg.toLowerCase() === p.even.toLowerCase() && settings.oddRowBg.toLowerCase() === p.odd.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        updateSetting('evenRowBg', p.even);
                        updateSetting('oddRowBg', p.odd);
                      }}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition ${
                        isMatch
                          ? 'border-[#064E3B] ring-2 ring-[#064E3B]/20 bg-emerald-50/40 font-bold'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[11px]">{p.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: p.even }} />
                        <span className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: p.odd }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Granular Even/Odd Row Pickers */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="block text-[11px] font-bold text-slate-700 mb-1.5">First Row (Even)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.evenRowBg}
                      onChange={(e) => updateSetting('evenRowBg', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={settings.evenRowBg}
                      onChange={(e) => updateSetting('evenRowBg', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-700 mb-1.5">Second Row (Odd)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.oddRowBg}
                      onChange={(e) => updateSetting('oddRowBg', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={settings.oddRowBg}
                      onChange={(e) => updateSetting('oddRowBg', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Header Styling */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Table Header Background &amp; Text</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {TABLE_HEADER_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => updateSetting('tableHeaderBg', swatch.hex)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
                      settings.tableHeaderBg.toLowerCase() === swatch.hex.toLowerCase()
                        ? 'border-[#064E3B] ring-2 ring-[#064E3B]/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: swatch.hex }} />
                    <span className="text-[11px]">{swatch.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="block text-[11px] font-bold text-slate-700 mb-1">Header Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.tableHeaderBg}
                      onChange={(e) => updateSetting('tableHeaderBg', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={settings.tableHeaderBg}
                      onChange={(e) => updateSetting('tableHeaderBg', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-700 mb-1">Header Font Colour</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.tableHeaderTextColor}
                      onChange={(e) => updateSetting('tableHeaderTextColor', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={settings.tableHeaderTextColor}
                      onChange={(e) => updateSetting('tableHeaderTextColor', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row Spacing */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Table Row Spacing (Padding)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'relaxed'] as const).map((spacing) => (
                  <button
                    key={spacing}
                    type="button"
                    onClick={() => updateSetting('tableRowSpacing', spacing)}
                    className={`py-2 rounded-lg border text-center font-bold capitalize transition text-xs ${
                      settings.tableRowSpacing === spacing
                        ? 'border-[#064E3B] bg-[#064E3B] text-white'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {spacing}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: COLORS & CONTRAST */}
        {activeTabSection === 'colors' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">Text &amp; Button Palette</h3>
              <p className="text-[11px] text-slate-500">Fine-tune contrast and branding colors across the interface.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Heading Color */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="block font-bold text-slate-800 text-xs">Headings Colour</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.headingColor}
                    onChange={(e) => updateSetting('headingColor', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={settings.headingColor}
                    onChange={(e) => updateSetting('headingColor', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Main Body Text Color */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="block font-bold text-slate-800 text-xs">Main Body Text Colour</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryTextColor}
                    onChange={(e) => updateSetting('primaryTextColor', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={settings.primaryTextColor}
                    onChange={(e) => updateSetting('primaryTextColor', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Secondary Muted Text Color */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="block font-bold text-slate-800 text-xs">Secondary / Muted Text</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondaryTextColor}
                    onChange={(e) => updateSetting('secondaryTextColor', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={settings.secondaryTextColor}
                    onChange={(e) => updateSetting('secondaryTextColor', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Table Data Cells Text Color */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="block font-bold text-slate-800 text-xs">Table Cell Text Colour</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.tableTextColor}
                    onChange={(e) => updateSetting('tableTextColor', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={settings.tableTextColor}
                    onChange={(e) => updateSetting('tableTextColor', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Primary Button Background */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="block font-bold text-slate-800 text-xs">Primary Button Background</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.buttonBg}
                    onChange={(e) => updateSetting('buttonBg', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={settings.buttonBg}
                    onChange={(e) => updateSetting('buttonBg', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Primary Button Text */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="block font-bold text-slate-800 text-xs">Button Font Colour</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.buttonTextColor}
                    onChange={(e) => updateSetting('buttonTextColor', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={settings.buttonTextColor}
                    onChange={(e) => updateSetting('buttonTextColor', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION F: TOOLS & SYNC */}
        {activeTabSection === 'tools' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">Page Synchronization &amp; Presets</h3>
              <p className="text-[11px] text-slate-500">Copy styling between pages or apply current theme system-wide.</p>
            </div>

            {/* Apply To All Pages */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <span className="block font-bold text-emerald-950 text-xs">Apply Current Appearance to All Pages</span>
              <p className="text-[11px] text-emerald-800">
                Instantly propagate this customized theme to all modules across Dreamloom Financial.
              </p>
              <button
                type="button"
                onClick={handleApplyToAll}
                disabled={isSaving}
                className="w-full py-2 px-3 bg-[#064E3B] hover:bg-[#0A5C36] text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Apply to All System Pages
              </button>
            </div>

            {/* Copy From Another Page */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="block font-bold text-slate-900 text-xs">Copy Appearance From Another Page</span>
              <div className="flex items-center gap-2">
                <select
                  value={copySourcePage}
                  onChange={(e) => setCopySourcePage(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                >
                  {ALL_PAGE_KEYS.filter(k => k !== activePage).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
                >
                  Copy Theme
                </button>
              </div>
            </div>

            {/* Reset This Page */}
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2">
              <span className="block font-bold text-rose-950 text-xs">Reset This Page</span>
              <p className="text-[11px] text-rose-800">
                Restore default Dreamloom Classic styling for &quot;{activePage}&quot; only. Other pages remain untouched.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-3 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset &quot;{activePage}&quot; to Default</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 5. Sticky Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            onPreviewChange(currentSettings);
            onClose();
          }}
          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition shadow-2xs"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreviewChange(settings)}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
            title="Preview current changes on screen"
          >
            Apply Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-[#064E3B] hover:bg-[#0A5C36] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Appearance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
