/**
 * Date and Time Utilities for DREAMLOOM HOLDING LIMITED Financial Management System
 * Authoritative Timezone: Africa/Nairobi (UTC+3, East Africa Time)
 */

export const TIMEZONE = 'Africa/Nairobi';

export const ALL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;

export const MONTH_ABBRS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
] as const;

export const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

/**
 * Returns the current date components in Africa/Nairobi timezone
 */
export function getEATCurrentComponents(baseDate: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    monthShort: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  } as Intl.DateTimeFormatOptions);

  const parts = formatter.formatToParts(baseDate);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const year = parseInt(map.year, 10);
  const day = parseInt(map.day, 10);
  const monthName = map.month; // e.g. "November"
  const weekday = map.weekday; // e.g. "Wednesday"
  const hour = map.hour || '00';
  const minute = map.minute || '00';

  const monthIdx = ALL_MONTHS.indexOf(monthName as any);

  return {
    year,
    monthIdx: monthIdx >= 0 ? monthIdx : baseDate.getMonth(),
    monthName,
    monthShort: MONTH_ABBRS[monthIdx >= 0 ? monthIdx : baseDate.getMonth()],
    day,
    weekday,
    hour,
    minute
  };
}

/**
 * Formats header date dynamically in East Africa Time, e.g. "Wednesday, 4 Nov 2026"
 */
export function getEATHeaderDate(baseDate: Date = new Date()): string {
  const { weekday, day, monthShort, year } = getEATCurrentComponents(baseDate);
  return `${weekday}, ${day} ${monthShort} ${year}`;
}

/**
 * Formats date to YYYY-MM-DD in East Africa Time (standard HTML date input format)
 */
export function getEATISODate(baseDate: Date = new Date()): string {
  const { year, monthIdx, day } = getEATCurrentComponents(baseDate);
  const m = String(monthIdx + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Formats date to DD-MMM-YYYY for contributions (e.g. "04-Nov-2026")
 */
export function getEATContributionDate(baseDate: Date = new Date()): string {
  const { day, monthShort, year } = getEATCurrentComponents(baseDate);
  const d = String(day).padStart(2, '0');
  return `${d}-${monthShort}-${year}`;
}

/**
 * Formats full timestamp for logs: "DD/MM/YYYY HH:mm" (e.g. "04/11/2026 09:30")
 */
export function getEATDateTimeString(baseDate: Date = new Date()): string {
  const { day, monthIdx, year, hour, minute } = getEATCurrentComponents(baseDate);
  const d = String(day).padStart(2, '0');
  const m = String(monthIdx + 1).padStart(2, '0');
  return `${d}/${m}/${year} ${hour}:${minute}`;
}

/**
 * Returns current month name in EAT (e.g. "November")
 */
export function getEATCurrentMonthName(): string {
  return getEATCurrentComponents().monthName;
}

/**
 * Returns current year in EAT (e.g. 2026)
 */
export function getEATCurrentYear(): number {
  return getEATCurrentComponents().year;
}

/**
 * Returns month and year combination, e.g. "November 2026"
 */
export function getEATCurrentCycle(): string {
  const { monthName, year } = getEATCurrentComponents();
  return `${monthName} ${year}`;
}

/**
 * Parses varied system date strings to extract month index and year
 */
export function parseDateToMonthYear(dateStr: string | null | undefined): { monthIdx: number; year: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (trimmed === '-' || !trimmed) return null;

  // 1. ISO format: "2026-11-04" or "2026-11"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx <= 11) {
      return { monthIdx, year };
    }
  }

  // 2. Day-Month-Year format: "04-Nov-2026" or "4-Nov-2026"
  const dmyMatch = trimmed.match(/^\d{1,2}-([A-Za-z]{3,})-(\d{4})/);
  if (dmyMatch) {
    const mStr = dmyMatch[1].toLowerCase();
    const year = parseInt(dmyMatch[2], 10);
    const idx = MONTH_ABBRS.findIndex(abbr => abbr.toLowerCase() === mStr.slice(0, 3));
    if (idx >= 0) return { monthIdx: idx, year };
  }

  // 3. Month Name Year format: "October 2026", "Oct 2026", "October, 2026"
  const myMatch = trimmed.match(/^([A-Za-z]{3,})[,\s]+(\d{4})/);
  if (myMatch) {
    const mStr = myMatch[1].toLowerCase();
    const year = parseInt(myMatch[2], 10);
    const idx = MONTH_ABBRS.findIndex(abbr => abbr.toLowerCase() === mStr.slice(0, 3));
    if (idx >= 0) return { monthIdx: idx, year };
  }

  // 4. Fallback check for month string inside e.g. "16th June" (assumes 2026 if year not found)
  for (let i = 0; i < ALL_MONTHS.length; i++) {
    const longName = ALL_MONTHS[i].toLowerCase();
    const shortName = MONTH_ABBRS[i].toLowerCase();
    if (trimmed.toLowerCase().includes(longName) || trimmed.toLowerCase().includes(shortName)) {
      const yearMatch = trimmed.match(/20\d{2}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : 2026;
      return { monthIdx: i, year };
    }
  }

  return null;
}

/**
 * Checks whether a record date matches the selected month and year filters.
 * Supports "All" for month or year to view entire period.
 */
export function matchesMonthAndYear(
  recordDate: string | null | undefined,
  selectedMonth: string,
  selectedYear: number | string
): boolean {
  if (!recordDate || recordDate === '-') return false;
  const parsed = parseDateToMonthYear(recordDate);
  if (!parsed) return false;

  // Year check
  if (selectedYear !== 'All') {
    const yearNum = typeof selectedYear === 'string' ? parseInt(selectedYear, 10) : selectedYear;
    if (parsed.year !== yearNum) return false;
  }

  // Month check
  if (selectedMonth !== 'All') {
    const targetIdx = ALL_MONTHS.findIndex(m => m.toLowerCase() === selectedMonth.toLowerCase());
    if (targetIdx >= 0 && parsed.monthIdx !== targetIdx) {
      return false;
    }
  }

  return true;
}

/**
 * Utility to match member names robustly (handling short vs full names).
 */
export function isSameMemberName(name1: string | null | undefined, name2: string | null | undefined): boolean {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

/**
 * Retrieves the specific month's unsettled contribution for a member.
 * Strictly does NOT combine across different months.
 * The Contributions page remains the primary source of truth.
 */
export function getMemberUnsettledForDate(
  contributions: any[],
  memberName: string | null | undefined,
  dateStr: string | null | undefined
): {
  unsettled: number;
  monthLabel: string;
  monthName: string;
  year: number;
  found: boolean;
  contributionRecord: any | null;
} {
  if (!memberName || !dateStr) {
    return { unsettled: 0, monthLabel: '-', monthName: '', year: 2026, found: false, contributionRecord: null };
  }

  const parsed = parseDateToMonthYear(dateStr);
  if (!parsed) {
    return { unsettled: 0, monthLabel: '-', monthName: '', year: 2026, found: false, contributionRecord: null };
  }

  const monthName = ALL_MONTHS[parsed.monthIdx];
  const year = parsed.year;
  const monthLabel = `${monthName} ${year}`;

  const match = contributions.find(c => {
    if (c.payout) return false;
    return isSameMemberName(c.member, memberName) && matchesMonthAndYear(c.month, monthName, year);
  });

  if (match) {
    return {
      unsettled: Number(match.unsettled) || 0,
      monthLabel,
      monthName,
      year,
      found: true,
      contributionRecord: match
    };
  }

  return {
    unsettled: 0,
    monthLabel,
    monthName,
    year,
    found: false,
    contributionRecord: null
  };
}
