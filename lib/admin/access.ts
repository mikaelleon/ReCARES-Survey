import type { Timestamp } from 'firebase/firestore';

export type AdminRole = 'superadmin' | 'admin' | 'adviser';
export type AdminStatus = 'pending' | 'active' | 'removed';
export type AdminAccessState = 'unauthenticated' | 'pending' | 'removed' | 'active';

export const ADMIN_ROLE_OPTIONS: AdminRole[] = ['admin', 'adviser', 'superadmin'];

/** UI labels — `admin` surfaces as Proponent. */
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Proponent',
  adviser: 'Adviser',
  superadmin: 'Superadmin',
};

export type RoleTone = 'proponent' | 'adviser' | 'superadmin';

export function roleTone(role: AdminRole | string | null | undefined): RoleTone {
  const normalized = (role || '').trim().toLowerCase();
  if (normalized === 'superadmin') return 'superadmin';
  if (normalized === 'adviser' || normalized === 'advisor') return 'adviser';
  return 'proponent';
}

export function roleLabel(role: AdminRole | string | null | undefined): string {
  const tone = roleTone(role);
  if (tone === 'superadmin') return ADMIN_ROLE_LABELS.superadmin;
  if (tone === 'adviser') return ADMIN_ROLE_LABELS.adviser;
  if (role === 'admin' || !role) return ADMIN_ROLE_LABELS.admin;
  // Free-text requestedRole (pending) — title-case as shown.
  return String(role);
}

export function isAssignableRole(value: string): value is AdminRole {
  return value === 'admin' || value === 'adviser' || value === 'superadmin';
}

export function isActiveGrantedRole(role: AdminRole | null | undefined): boolean {
  return role === 'admin' || role === 'adviser' || role === 'superadmin';
}

export const DASHBOARD_PERMISSION_KEYS = [
  'responsesDashboard',
  'interviewInvites',
  'findingNotes',
] as const;

export type DashboardPermissionKey = (typeof DASHBOARD_PERMISSION_KEYS)[number];

export const DASHBOARD_PERMISSION_LABELS: Record<DashboardPermissionKey, string> = {
  responsesDashboard: 'Responses dashboard',
  interviewInvites: 'Interview invites',
  findingNotes: 'Findings log',
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
  if (adminDoc.status === 'active' && isActiveGrantedRole(adminDoc.role)) {
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
    findingNotes: false,
  };
}

/** Proponents and superadmins may create/edit/delete finding notes; advisers are read-only. */
export function canWriteFindingNotes(
  adminDoc: AdminProfile | null | undefined,
): boolean {
  if (!adminDoc || adminDoc.status !== 'active') return false;
  return adminDoc.role === 'admin' || adminDoc.role === 'superadmin';
}

/** Advisers and superadmins may start a review thread. Proponents may only reply. */
export function canCreateRootFeedback(role: AdminRole | null | undefined): boolean {
  return role === 'adviser' || role === 'superadmin';
}

/** Only advisers and superadmins may mark a thread resolved or reopen it. */
export function canResolveThread(role: AdminRole | null | undefined): boolean {
  return role === 'adviser' || role === 'superadmin';
}

export function pathForAccessState(state: AdminAccessState): string {
  if (state === 'pending') return '/admin/pending';
  if (state === 'removed') return '/admin/removed';
  if (state === 'active') return '/admin/dashboard';
  return '/admin/login';
}
