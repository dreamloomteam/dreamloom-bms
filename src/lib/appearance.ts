/**
 * Dreamloom BMS — Dynamic Page Appearance & Customisation Engine
 * Allows granular, per-page visual customization for backgrounds,
 * typography, font sizes, headings, tables, alternating rows, borders, and buttons.
 */

export interface PageAppearanceSettings {
  // 1. Backgrounds & Surfaces
  pageBg: string;              // Main canvas background
  cardBg: string;              // Container card background
  borderColor: string;         // Panel and divider border color

  // 2. Typography & Fonts
  fontFamily: string;          // Selected font family identifier
  fontSizeScale: 'small' | 'medium' | 'large' | 'xlarge' | 'custom';
  fontSizeCustom?: number;     // Custom base font size in px
  mainHeadingSize?: number;    // h1 font size (px)
  sectionHeadingSize?: number; // h2 font size (px)
  tableHeadingSize?: number;   // th font size (px)
  tableContentSize?: number;   // td font size (px)
  formLabelSize?: number;      // label font size (px)
  buttonSize?: number;         // button font size (px)
  secondaryTextSize?: number;  // muted text font size (px)

  // 3. Text & Heading Colours
  primaryTextColor: string;    // Main text font colour
  headingColor: string;        // Main and section headings colour
  secondaryTextColor: string;  // Muted/secondary text colour

  // 4. Table & Register Customisation
  tableBg: string;             // Table container / body background
  tableHeaderBg: string;       // Table header background (th)
  tableHeaderTextColor: string;// Table header text colour
  evenRowBg: string;           // First alternating row colour
  oddRowBg: string;            // Second alternating row colour
  tableTextColor: string;      // Table data cells text colour
  tableRowSpacing: 'compact' | 'normal' | 'relaxed'; // Row padding scale

  // 5. Buttons & Controls
  buttonBg: string;            // Primary button background colour
  buttonTextColor: string;     // Primary button text colour

  // 6. Metadata
  presetName?: string;         // Name of preset if applied
  lastUpdated?: string;        // ISO timestamp of last save
}

export interface FontOption {
  id: string;
  name: string;
  category: string;
  cssFamily: string;
  preview: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'Inter', name: 'Inter', category: 'Modern Geometric Sans', cssFamily: "'Inter', sans-serif", preview: 'Clean modern corporate typography' },
  { id: 'Roboto', name: 'Roboto', category: 'Neo-Grotesque Sans', cssFamily: "'Roboto', sans-serif", preview: 'Balanced mechanical readability' },
  { id: 'Open Sans', name: 'Open Sans', category: 'Humanist Sans', cssFamily: "'Open Sans', sans-serif", preview: 'Friendly and highly legible' },
  { id: 'Lato', name: 'Lato', category: 'Warm Semi-Rounded', cssFamily: "'Lato', sans-serif", preview: 'Warm corporate elegance' },
  { id: 'Poppins', name: 'Poppins', category: 'Geometric Display', cssFamily: "'Poppins', sans-serif", preview: 'Striking modern headings' },
  { id: 'Montserrat', name: 'Montserrat', category: 'Urban Architectural', cssFamily: "'Montserrat', sans-serif", preview: 'Distinctive financial hierarchy' },
  { id: 'Nunito', name: 'Nunito', category: 'Soft Rounded Sans', cssFamily: "'Nunito', sans-serif", preview: 'Approachable rounded balance' },
  { id: 'Source Sans 3', name: 'Source Sans 3', category: 'UI Workhorse', cssFamily: "'Source Sans 3', sans-serif", preview: 'Clear UI and data tables' },
  { id: 'Arial', name: 'Arial', category: 'Classic Standard', cssFamily: 'Arial, Helvetica, sans-serif', preview: 'Universal cross-platform standard' },
  { id: 'System Default', name: 'System Default', category: 'Native OS', cssFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", preview: 'Fastest native system stack' },
];

export interface ColorSwatch {
  name: string;
  hex: string;
  border?: string;
}

export const BACKGROUND_SWATCHES: ColorSwatch[] = [
  { name: 'Pure White', hex: '#FFFFFF', border: '#E2E8F0' },
  { name: 'Light Grey', hex: '#F4F6F8', border: '#E2E8F0' },
  { name: 'Soft Green', hex: '#F0FDF4', border: '#BBF7D0' },
  { name: 'Pale Mint', hex: '#E6F4EA', border: '#A7F3D0' },
  { name: 'Cream', hex: '#FFFBEB', border: '#FDE68A' },
  { name: 'Light Blue', hex: '#F0F9FF', border: '#BAE6FD' },
  { name: 'Light Beige', hex: '#FDF8F0', border: '#E7DFD5' },
  { name: 'Dark Charcoal', hex: '#1E293B', border: '#334155' },
  { name: 'Dark Navy', hex: '#0F172A', border: '#1E293B' },
];

export const TABLE_HEADER_SWATCHES: ColorSwatch[] = [
  { name: 'Dreamloom Mint', hex: '#E6F4EA' },
  { name: 'Slate Light', hex: '#F1F5F9' },
  { name: 'Forest Emerald', hex: '#064E3B' },
  { name: 'Ocean Sky', hex: '#E0F2FE' },
  { name: 'Royal Navy', hex: '#0F172A' },
  { name: 'Warm Amber', hex: '#FEF3C7' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

export const ALTERNATING_ROW_PRESETS: { name: string; even: string; odd: string }[] = [
  { name: 'White & Pale Mint (Default)', even: '#FFFFFF', odd: '#F2F9F5' },
  { name: 'White & Light Blue', even: '#FFFFFF', odd: '#F0F9FF' },
  { name: 'Grey & Pure White', even: '#FFFFFF', odd: '#F8FAFC' },
  { name: 'Cream & Soft White', even: '#FFFFFF', odd: '#FFFDF5' },
  { name: 'Soft Green & Mint', even: '#FFFFFF', odd: '#ECFDF5' },
  { name: 'Dark Navy & Slate', even: '#1E293B', odd: '#142036' },
  { name: 'Minimal White Only', even: '#FFFFFF', odd: '#FFFFFF' },
];

export const PRESET_THEMES: Record<string, PageAppearanceSettings> = {
  'Dreamloom Classic': {
    presetName: 'Dreamloom Classic',
    pageBg: '#F4F6F8',
    cardBg: '#FFFFFF',
    borderColor: '#E2E8F0',
    fontFamily: 'Inter',
    fontSizeScale: 'medium',
    fontSizeCustom: 14,
    mainHeadingSize: 24,
    sectionHeadingSize: 18,
    tableHeadingSize: 11,
    tableContentSize: 12,
    formLabelSize: 12,
    buttonSize: 12,
    secondaryTextSize: 11,
    primaryTextColor: '#0F172A',
    headingColor: '#064E3B',
    secondaryTextColor: '#64748B',
    tableBg: '#FFFFFF',
    tableHeaderBg: '#E6F4EA',
    tableHeaderTextColor: '#334155',
    evenRowBg: '#FFFFFF',
    oddRowBg: '#F2F9F5',
    tableTextColor: '#0F172A',
    tableRowSpacing: 'normal',
    buttonBg: '#064E3B',
    buttonTextColor: '#FFFFFF',
  },
  'Corporate White': {
    presetName: 'Corporate White',
    pageBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    borderColor: '#CBD5E1',
    fontFamily: 'Roboto',
    fontSizeScale: 'medium',
    fontSizeCustom: 14,
    mainHeadingSize: 24,
    sectionHeadingSize: 18,
    tableHeadingSize: 11,
    tableContentSize: 12,
    formLabelSize: 12,
    buttonSize: 12,
    secondaryTextSize: 11,
    primaryTextColor: '#0F172A',
    headingColor: '#0F172A',
    secondaryTextColor: '#64748B',
    tableBg: '#FFFFFF',
    tableHeaderBg: '#F1F5F9',
    tableHeaderTextColor: '#1E293B',
    evenRowBg: '#FFFFFF',
    oddRowBg: '#F8FAFC',
    tableTextColor: '#1E293B',
    tableRowSpacing: 'normal',
    buttonBg: '#0F172A',
    buttonTextColor: '#FFFFFF',
  },
  'Emerald Green': {
    presetName: 'Emerald Green',
    pageBg: '#F0FDF4',
    cardBg: '#FFFFFF',
    borderColor: '#BBF7D0',
    fontFamily: 'Poppins',
    fontSizeScale: 'medium',
    fontSizeCustom: 14,
    mainHeadingSize: 24,
    sectionHeadingSize: 18,
    tableHeadingSize: 11,
    tableContentSize: 12,
    formLabelSize: 12,
    buttonSize: 12,
    secondaryTextSize: 11,
    primaryTextColor: '#052E16',
    headingColor: '#166534',
    secondaryTextColor: '#15803D',
    tableBg: '#FFFFFF',
    tableHeaderBg: '#DCFCE7',
    tableHeaderTextColor: '#14532D',
    evenRowBg: '#FFFFFF',
    oddRowBg: '#F0FDF4',
    tableTextColor: '#052E16',
    tableRowSpacing: 'normal',
    buttonBg: '#15803D',
    buttonTextColor: '#FFFFFF',
  },
  'Ocean Blue': {
    presetName: 'Ocean Blue',
    pageBg: '#F0F9FF',
    cardBg: '#FFFFFF',
    borderColor: '#BAE6FD',
    fontFamily: 'Montserrat',
    fontSizeScale: 'medium',
    fontSizeCustom: 14,
    mainHeadingSize: 24,
    sectionHeadingSize: 18,
    tableHeadingSize: 11,
    tableContentSize: 12,
    formLabelSize: 12,
    buttonSize: 12,
    secondaryTextSize: 11,
    primaryTextColor: '#0C4A6E',
    headingColor: '#0284C7',
    secondaryTextColor: '#0369A1',
    tableBg: '#FFFFFF',
    tableHeaderBg: '#E0F2FE',
    tableHeaderTextColor: '#0369A1',
    evenRowBg: '#FFFFFF',
    oddRowBg: '#F0F9FF',
    tableTextColor: '#0F172A',
    tableRowSpacing: 'normal',
    buttonBg: '#0284C7',
    buttonTextColor: '#FFFFFF',
  },
  'Soft Neutral': {
    presetName: 'Soft Neutral',
    pageBg: '#FDF8F0',
    cardBg: '#FFFFFF',
    borderColor: '#FDE68A',
    fontFamily: 'Lato',
    fontSizeScale: 'medium',
    fontSizeCustom: 14,
    mainHeadingSize: 24,
    sectionHeadingSize: 18,
    tableHeadingSize: 11,
    tableContentSize: 12,
    formLabelSize: 12,
    buttonSize: 12,
    secondaryTextSize: 11,
    primaryTextColor: '#292524',
    headingColor: '#451A03',
    secondaryTextColor: '#78716C',
    tableBg: '#FFFFFF',
    tableHeaderBg: '#FEF3C7',
    tableHeaderTextColor: '#78350F',
    evenRowBg: '#FFFFFF',
    oddRowBg: '#FFFBEB',
    tableTextColor: '#292524',
    tableRowSpacing: 'normal',
    buttonBg: '#78350F',
    buttonTextColor: '#FFFFFF',
  },
  'Modern Dark': {
    presetName: 'Modern Dark',
    pageBg: '#0F172A',
    cardBg: '#1E293B',
    borderColor: '#334155',
    fontFamily: 'Inter',
    fontSizeScale: 'medium',
    fontSizeCustom: 14,
    mainHeadingSize: 24,
    sectionHeadingSize: 18,
    tableHeadingSize: 11,
    tableContentSize: 12,
    formLabelSize: 12,
    buttonSize: 12,
    secondaryTextSize: 11,
    primaryTextColor: '#F8FAFC',
    headingColor: '#38BDF8',
    secondaryTextColor: '#94A3B8',
    tableBg: '#1E293B',
    tableHeaderBg: '#334155',
    tableHeaderTextColor: '#F8FAFC',
    evenRowBg: '#1E293B',
    oddRowBg: '#142036',
    tableTextColor: '#F1F5F9',
    tableRowSpacing: 'normal',
    buttonBg: '#2563EB',
    buttonTextColor: '#FFFFFF',
  },
};

export const DEFAULT_PAGE_APPEARANCE: PageAppearanceSettings = PRESET_THEMES['Dreamloom Classic'];

export const ALL_PAGE_KEYS = [
  'Overview',
  'Member Directory',
  'Contributions',
  'Deposits',
  'Loan Portfolio',
  'Fines & Penalties',
  'Expenses',
  'Investments',
  'Projects',
  'Suppliers',
  'Documents',
  'Assets',
  'Inventory',
  'Users',
  'Reports',
  'Settings',
  'Administration',
  'Login Log',
  'Edit Log',
];

export function getFontFamilyCss(fontId: string): string {
  const match = FONT_OPTIONS.find(f => f.id === fontId);
  return match ? match.cssFamily : "'Inter', sans-serif";
}

export function getRowPaddingCss(spacing: 'compact' | 'normal' | 'relaxed'): string {
  switch (spacing) {
    case 'compact':
      return '0.375rem'; // 6px
    case 'relaxed':
      return '1rem'; // 16px
    case 'normal':
    default:
      return '0.625rem'; // 10px
  }
}

/**
 * Generates an optimized, highly scoped CSS string for the current page
 * that immediately overrides and customizes the view without disrupting financial logic.
 */
export function generateAppearanceCss(app: PageAppearanceSettings): string {
  const fontCss = getFontFamilyCss(app.fontFamily);
  const rowPy = getRowPaddingCss(app.tableRowSpacing);

  const baseFontPx =
    app.fontSizeScale === 'small'
      ? 12
      : app.fontSizeScale === 'large'
      ? 16
      : app.fontSizeScale === 'xlarge'
      ? 18
      : app.fontSizeCustom || 14;

  const h1Px = app.mainHeadingSize || Math.round(baseFontPx * 1.7);
  const h2Px = app.sectionHeadingSize || Math.round(baseFontPx * 1.3);
  const thPx = app.tableHeadingSize || Math.max(10, Math.round(baseFontPx * 0.82));
  const tdPx = app.tableContentSize || Math.max(11, Math.round(baseFontPx * 0.88));
  const labelPx = app.formLabelSize || Math.max(11, Math.round(baseFontPx * 0.88));
  const btnPx = app.buttonSize || Math.max(11, Math.round(baseFontPx * 0.88));
  const secondaryPx = app.secondaryTextSize || Math.max(10, Math.round(baseFontPx * 0.78));

  return `
    /* ========================================================================= */
    /* DYNAMIC APPEARANCE STYLESHEET (Dreamloom BMS) */
    /* ========================================================================= */
    
    #dashboard-content-area,
    .page-custom-area {
      background-color: ${app.pageBg} !important;
      color: ${app.primaryTextColor} !important;
      font-family: ${fontCss} !important;
      font-size: ${baseFontPx}px !important;
    }

    #dashboard-content-area h1,
    .page-custom-area h1,
    #dashboard-content-area .page-title {
      color: ${app.headingColor} !important;
      font-family: ${fontCss} !important;
      font-size: ${h1Px}px !important;
    }

    #dashboard-content-area h2,
    .page-custom-area h2,
    #dashboard-content-area .section-title {
      color: ${app.headingColor} !important;
      font-family: ${fontCss} !important;
      font-size: ${h2Px}px !important;
    }

    #dashboard-content-area h3,
    .page-custom-area h3 {
      color: ${app.headingColor} !important;
      font-family: ${fontCss} !important;
    }

    /* Table Heading Background & Text Colour */
    #dashboard-content-area table thead,
    #dashboard-content-area table thead tr,
    #dashboard-content-area table thead th,
    #dashboard-content-area thead.bg-\\[\\#E6F4EA\\],
    #dashboard-content-area thead.bg-\\[\\#064E3B\\],
    #dashboard-content-area .table-header-custom {
      background-color: ${app.tableHeaderBg} !important;
      color: ${app.tableHeaderTextColor} !important;
      font-size: ${thPx}px !important;
      font-family: ${fontCss} !important;
    }

    #dashboard-content-area table thead th span,
    #dashboard-content-area table thead th {
      color: ${app.tableHeaderTextColor} !important;
    }

    /* Table Body Background */
    #dashboard-content-area table tbody,
    #dashboard-content-area .table-body-custom {
      background-color: ${app.tableBg} !important;
      color: ${app.tableTextColor} !important;
      font-family: ${fontCss} !important;
    }

    /* Alternating Table Row Colours */
    #dashboard-content-area table tbody tr:nth-child(even):not(.highlight-row),
    #dashboard-content-area table tbody tr.bg-white:not(.highlight-row) {
      background-color: ${app.evenRowBg} !important;
    }

    #dashboard-content-area table tbody tr:nth-child(odd):not(.highlight-row),
    #dashboard-content-area table tbody tr.bg-\\[\\#F2F9F5\\]:not(.highlight-row) {
      background-color: ${app.oddRowBg} !important;
    }

    /* Table Body Cells Font Size & Padding */
    #dashboard-content-area table tbody td {
      padding-top: ${rowPy} !important;
      padding-bottom: ${rowPy} !important;
      color: ${app.tableTextColor} !important;
      font-size: ${tdPx}px !important;
    }

    /* Borders */
    #dashboard-content-area table,
    #dashboard-content-area table th,
    #dashboard-content-area table td,
    #dashboard-content-area .border-slate-200,
    #dashboard-content-area .border-slate-200\\/90,
    #dashboard-content-area .border-slate-100,
    #dashboard-content-area .border-emerald-900\\/10 {
      border-color: ${app.borderColor} !important;
    }

    /* White Content Card Panels */
    #dashboard-content-area .bg-white:not(tr):not(th):not(button):not(input):not(select):not(.stay-white) {
      background-color: ${app.cardBg} !important;
    }

    /* Action Buttons (Primary) */
    #dashboard-content-area button.bg-\\[\\#064E3B\\],
    #dashboard-content-area button.bg-\\[\\#0A5C36\\],
    #dashboard-content-area button.btn-primary-custom {
      background-color: ${app.buttonBg} !important;
      color: ${app.buttonTextColor} !important;
      font-size: ${btnPx}px !important;
    }

    /* Form Labels */
    #dashboard-content-area label {
      font-size: ${labelPx}px !important;
    }

    /* Secondary / Muted Text */
    #dashboard-content-area .text-slate-500,
    #dashboard-content-area .text-slate-400,
    #dashboard-content-area .secondary-text {
      color: ${app.secondaryTextColor} !important;
      font-size: ${secondaryPx}px !important;
    }
  `;
}
