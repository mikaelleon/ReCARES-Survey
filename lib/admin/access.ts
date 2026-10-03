import type { Timestamp } from 'firebase/firestore';

export type AdminRole = 'superadmin' | 'admin';
export type AdminStatus = 'pending' | 'active' | 'removed';
export type AdminAccessState = 'unauthenticated' | 'pending' | 'removed' | 'active';

export const DASHBOARD_PERMISSION_KEYS = [
  'responsesDashboard',
  'interviewInvites',
] as const;

export type DashboardPermissionKey = (typeof DASHBOARD_PERMISSION_KEYS)[number];

export const DASHBOARD_PERMISSION_LABELS: Record<DashboardPermissionKey, string> = {
  responsesDashboard: 'Responses dashboard',
  interviewInvites: 'Interview invites',
};

export type AdminPermissions = Partial<Record<DashboardPermissionKey, boolean>> & {
  [dashboardKey: string]: boolean;
};

export interface AdminProfile {
  fullName: string;
  email: string;
  /** What the person typed at signup. Informational only. Never grants access. */
  requestedRole: string;
  /** null until a superadmin approves (or invite redeems). */
  role: AdminRole | null;
  status: AdminStatus;
  permissions: AdminPermissions;
  /** Per-admin pinned Summary chart ids (Responses page). */
  summaryWidgets?: string[];
  createdAt?: Timestamp | null;
  approvedAt?: Timestamp | null;
  approvedBy?: string;
  /** Role / permissions edits (and other non-status updates). */
  updatedAt?: Timestamp | null;
  removedAt?: Timestamp | null;
  removedBy?: string;
  /** Set when the profile was created from an invite (rules audit). */
  inviteId?: string;
}

export interface AdminInvite {
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
  createdAt?: Timestamp | null;
  createdBy: string;
  used: boolean;
  usedAt?: Timestamp | null;
}

export function getAdminAccessState(
  adminDoc: AdminProfile | null,
): AdminAccessState {
  if (!adminDoc) return 'unauthenticated';
  if (adminDoc.status === 'pending') return 'pending';
  if (adminDoc.status === 'removed') return 'removed';
  if (adminDoc.status === 'active' && (adminDoc.role === 'admin' || adminDoc.role === 'superadmin')) {
    return 'active';
  }
  return 'unauthenticated';
}

/** Superadmin passes every permission check regardless of the permissions map. */
export function hasPermission(
  adminDoc: AdminProfile | null | undefined,
  key: DashboardPermissionKey,
): boolean {
  if (!adminDoc || adminDoc.status !== 'active') return false;
  if (adminDoc.role === 'superadmin') return true;
  return Boolean(adminDoc.permissions?.[key]);
}

export function emptyPermissions(): AdminPermissions {
  return {
    responsesDashboard: false,
    interviewInvites: false,
  };
}

export function pathForAccessState(state: AdminAccessState): string {
  if (state === 'pending') return '/admin/pending';
  if (state === 'removed') return '/admin/removed';
  if (state === 'active') return '/admin/dashboard';
  return '/admin/login';
}
