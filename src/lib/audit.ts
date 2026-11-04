import { prisma } from '@/lib/prisma';

export interface AuditRecordParams {
  model: string;
  action: 'Added' | 'Updated' | 'Deleted';
  recordId?: number | null;
  userEmail?: string | null;
  userName?: string | null;
  member: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  remarks?: string;
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
    const oldVal = oldValues[key] !== undefined ? String(oldValues[key]).trim() : '';
    const newVal = newValues[key] !== undefined ? String(newValues[key]).trim() : '';
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

    const changedFields = params.action === 'Updated'
      ? computeChangedFields(params.oldValues, params.newValues)
      : {};

    const authorName = params.userName || (params.userEmail ? params.userEmail.split('@')[0].replace('.', ' ') : 'Simon Memia');

    const payload = {
      user: authorName,
      userEmail: params.userEmail || 'simon@dreamloom.co.ke',
      member: params.member || 'Member Record',
      module: params.model,
      action: params.action,
      oldValues: params.oldValues || {},
      newValues: params.newValues || {},
      changedFields,
      remarks: params.remarks || `${params.action} ${params.model} record for ${params.member}`,
      timestamp: new Date().toISOString(),
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
