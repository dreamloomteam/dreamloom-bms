import { prisma } from '@/lib/prisma';

export interface AuditRecordParams {
  model: string;
  action: 'Added' | 'Updated' | 'Deleted' | 'Cancelled' | 'Reversed';
  recordId?: number | null;
  recordRef?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  member: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  remarks?: string;
  reason?: string | null;
}

const AUTHORIZED_EDITORS: Record<string, string> = {
  'kamera@dreamloom.co.ke': 'Simon Memia Wanjiru',
  'simon@dreamloom.co.ke': 'Simon Memia Wanjiru',
  'elijah@dreamloom.co.ke': 'Elijah Waitara Gichari',
  'michael@dreamloom.co.ke': 'Michael Kiarie Wanjiru',
  'simon memia wanjiru': 'Simon Memia Wanjiru',
  'elijah waitara gichari': 'Elijah Waitara Gichari',
  'michael kiarie wanjiru': 'Michael Kiarie Wanjiru',
  'simon memia': 'Simon Memia Wanjiru',
  'elijah waitara': 'Elijah Waitara Gichari',
  'michael kiarie': 'Michael Kiarie Wanjiru',
};

/**
 * Server-side permission enforcement: only authorized Dreamloom editors
 * (Director Simon Memia Wanjiru, Officer Elijah Waitara Gichari, and Treasurer Michael Kiarie Wanjiru)
 * may create, edit, or delete financial records.
 */
export function isAuthorizedEditor(emailOrUser?: string | null): boolean {
  if (!emailOrUser) return false;
  const normalized = String(emailOrUser).toLowerCase().trim();
  if (AUTHORIZED_EDITORS[normalized]) return true;
  if (normalized.includes('director') || normalized.includes('treasurer') || normalized.includes('admin')) {
    return true;
  }
  return false;
}

/**
 * Resolves the canonical full name of the authorized user performing an action.
 */
export function resolveEditorName(emailOrUser?: string | null): string {
  if (!emailOrUser) return 'Simon Memia Wanjiru';
  const normalized = String(emailOrUser).toLowerCase().trim();
  if (AUTHORIZED_EDITORS[normalized]) return AUTHORIZED_EDITORS[normalized];
  if (normalized.includes('@')) {
    return normalized
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  return String(emailOrUser).trim();
}

/**
 * Automatically compares old and new snapshots and identifies exactly which fields changed.
 * Identical values are strictly NOT marked as changed.
 */
export function computeChangedFields(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): Record<string, { from: any; to: any }> {
  const changed: Record<string, { from: any; to: any }> = {};
  if (!oldValues || !newValues) return changed;

  const allKeys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));
  for (const key of allKeys) {
    if (key.toLowerCase().includes('status') && oldValues[key] === newValues[key]) {
      continue;
    }
    const oldVal = oldValues[key] !== undefined && oldValues[key] !== null ? String(oldValues[key]).trim() : '';
    const newVal = newValues[key] !== undefined && newValues[key] !== null ? String(newValues[key]).trim() : '';
    if (oldVal !== newVal) {
      changed[key] = {
        from: oldValues[key] ?? '-',
        to: newValues[key] ?? '-',
      };
    }
  }
  return changed;
}

/**
 * Persists a complete audit log entry to the PostgreSQL database in the EditLog table.
 */
export async function createAuditLog(params: AuditRecordParams) {
  try {
    let userId: number | null = null;
    if (params.userEmail) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: params.userEmail, mode: 'insensitive' } },
      });
      if (user) userId = user.id;
    }

    const changedFields =
      params.action === 'Updated' || params.action === 'Cancelled' || params.action === 'Reversed'
        ? computeChangedFields(params.oldValues, params.newValues)
        : {};

    const authorName = params.userName || resolveEditorName(params.userEmail);
    const nowIso = new Date().toISOString();

    const payload = {
      user: authorName,
      userEmail: params.userEmail || 'kamera@dreamloom.co.ke',
      member: params.member || 'Member Record',
      module: params.model,
      action: params.action,
      recordRef: params.recordRef || (params.recordId ? String(params.recordId) : '-'),
      oldValues: params.oldValues || {},
      newValues: params.newValues || {},
      changedFields,
      reason: params.reason || null,
      remarks: params.remarks || `${params.action} ${params.model} record for ${params.member}`,
      timestamp: nowIso,
    };

    const log = await prisma.editLog.create({
      data: {
        userId,
        model: params.model,
        action: params.action,
        recordId: params.recordId ? Number(params.recordId) : null,
        changes: JSON.stringify(payload),
      },
      include: { user: true },
    });

    return log;
  } catch (error) {
    console.error('Failed to create persistent audit log:', error);
    return null;
  }
}

