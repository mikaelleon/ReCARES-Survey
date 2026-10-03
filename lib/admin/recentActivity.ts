import type { Timestamp } from 'firebase/firestore';
import type { AdminProfile } from '@/lib/admin/access';

export type AdminActivityKind =
  | 'account_created'
  | 'account_updated'
  | 'access_requested'
  | 'account_deleted';

export interface AdminActivityItem {
  id: string;
  kind: AdminActivityKind;
  label: string;
  detail: string;
  atMs: number;
  href: string;
}

function tsToMs(value: Timestamp | null | undefined): number | null {
  if (!value) return null;
  try {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
  } catch {
    return null;
  }
  return null;
}

function displayName(row: Pick<AdminProfile, 'fullName' | 'email'>): string {
  const name = (row.fullName || '').trim();
  if (name) return name;
  return row.email.trim() || 'Unknown member';
}

function farEnough(a: number, b: number | null, gapMs = 60_000): boolean {
  if (b == null) return true;
  return Math.abs(a - b) >= gapMs;
}

/**
 * Build a chronological feed of account lifecycle events from admin docs.
 * Pending → requested only. Active/removed → created / updated / deleted.
 */
export function buildAdminActivityFeed(
  members: Array<AdminProfile & { uid: string }>,
  limit = 6,
): AdminActivityItem[] {
  const items: AdminActivityItem[] = [];

  for (const row of members) {
    const name = displayName(row);
    const createdMs = tsToMs(row.createdAt ?? null);
    const approvedMs = tsToMs(row.approvedAt ?? null);
    const updatedMs = tsToMs(row.updatedAt ?? null);
    const removedMs = tsToMs(row.removedAt ?? null);

    if (row.status === 'pending') {
      if (createdMs != null) {
        items.push({
          id: `${row.uid}-requested`,
          kind: 'access_requested',
          label: 'Requested access',
          detail: name,
          atMs: createdMs,
          href: '/admin/members/',
        });
      }
      continue;
    }

    if (createdMs != null) {
      items.push({
        id: `${row.uid}-created`,
        kind: 'account_created',
        label: 'Account created',
        detail: name,
        atMs: createdMs,
        href: '/admin/members/',
      });
    }

    if (updatedMs != null && farEnough(updatedMs, createdMs)) {
      items.push({
        id: `${row.uid}-updated`,
        kind: 'account_updated',
        label: 'Account updated',
        detail: name,
        atMs: updatedMs,
        href: '/admin/members/',
      });
    } else if (
      approvedMs != null &&
      farEnough(approvedMs, createdMs) &&
      (updatedMs == null || farEnough(approvedMs, updatedMs))
    ) {
      items.push({
        id: `${row.uid}-approved`,
        kind: 'account_updated',
        label: 'Account updated',
        detail: name,
        atMs: approvedMs,
        href: '/admin/members/',
      });
    }

    if (row.status === 'removed' && removedMs != null) {
      items.push({
        id: `${row.uid}-deleted`,
        kind: 'account_deleted',
        label: 'Account deleted',
        detail: name,
        atMs: removedMs,
        href: '/admin/members/',
      });
    }
  }

  return items.sort((a, b) => b.atMs - a.atMs).slice(0, limit);
}
