'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Inbox,
  KeyRound,
  Mail,
  Pencil,
  Shield,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_OPTIONS,
  DASHBOARD_PERMISSION_KEYS,
  DASHBOARD_PERMISSION_LABELS,
  emptyPermissions,
  isAssignableRole,
  roleLabel,
  roleTone,
  type AdminPermissions,
  type AdminRole,
  type DashboardPermissionKey,
  type RoleTone,
} from '@/lib/admin/access';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  generateSignupAccessCode,
  getSignupAccessCode,
  normalizeAccessCode,
} from '@/lib/firebase/accessCode';
import {
  approvePendingAdmin,
  createInvite,
  inviteSignupUrl,
  listAdminsByStatus,
  listInvites,
  permanentlyDeleteRemovedAdmin,
  rejectPendingAdmin,
  removeActiveMember,
  revokeInvite,
  updateActiveMember,
  type AdminMemberRow,
  type InviteRow,
} from '@/lib/firebase/adminManage';

type RoleFilter = 'all' | AdminRole;
type MemberSort = 'name_asc' | 'joined_desc' | 'joined_asc';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function matchesQuery(name: string | undefined, email: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (name || '').toLowerCase().includes(q) || email.toLowerCase().includes(q);
}

function roleForFilter(row: AdminMemberRow): AdminRole | null {
  if (row.role && isAssignableRole(row.role)) return row.role;
  const requested = row.requestedRole?.trim().toLowerCase();
  if (requested === 'advisor') return 'adviser';
  if (requested && isAssignableRole(requested)) return requested;
  return null;
}

function roleIcon(tone: RoleTone) {
  if (tone === 'superadmin') return <Shield size={12} aria-hidden="true" />;
  if (tone === 'adviser') return <BookOpen size={12} aria-hidden="true" />;
  return <User size={12} aria-hidden="true" />;
}

function matchesRoleFilter(
  role: AdminRole | null | undefined,
  filter: RoleFilter,
): boolean {
  if (filter === 'all') return true;
  return role === filter;
}

function timestampMs(
  value: { toMillis?: () => number; toDate?: () => Date } | null | undefined,
): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  return 0;
}

function sortMembers(rows: AdminMemberRow[], sortBy: MemberSort): AdminMemberRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sortBy === 'name_asc') {
      return (a.fullName || a.email).localeCompare(b.fullName || b.email);
    }
    const aT = timestampMs(a.createdAt ?? a.approvedAt);
    const bT = timestampMs(b.createdAt ?? b.approvedAt);
    return sortBy === 'joined_desc' ? bT - aT : aT - bT;
  });
  return copy;
}

function sortInvites(rows: InviteRow[], sortBy: MemberSort): InviteRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sortBy === 'name_asc') return a.email.localeCompare(b.email);
    const aT = timestampMs(a.createdAt);
    const bT = timestampMs(b.createdAt);
    return sortBy === 'joined_desc' ? bT - aT : aT - bT;
  });
  return copy;
}

const PERMISSION_ICONS: Record<DashboardPermissionKey, ReactNode> = {
  responsesDashboard: <BarChart3 size={14} strokeWidth={2.2} aria-hidden="true" />,
  interviewInvites: <CalendarCheck size={14} strokeWidth={2.2} aria-hidden="true" />,
};

function memberInitials(name?: string, email?: string): string {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function emailInitials(email: string): string {
  const local = email.split('@')[0] || email;
  return local.slice(0, 2).toUpperCase();
}

function formatRemovedAt(value: AdminMemberRow['removedAt']): string {
  if (!value || typeof value.toDate !== 'function') return '—';
  try {
    return value.toDate().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function resolveApproveRole(requestedRole?: string): AdminRole {
  const raw = requestedRole?.trim().toLowerCase();
  if (raw === 'superadmin') return 'superadmin';
  if (raw === 'adviser' || raw === 'advisor') return 'adviser';
  return 'admin';
}

function RoleSelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: AdminRole;
  onChange: (role: AdminRole) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <select
      id={id}
      className="admin-kanban-select"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as AdminRole)}
    >
      {ADMIN_ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {ADMIN_ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}

function RoleBadge({ role }: { role: string }) {
  const tone = roleTone(role);
  return (
    <span className={`admin-kanban-role admin-kanban-role--${tone}`}>
      {roleIcon(tone)}
      {roleLabel(role)}
    </span>
  );
}

function PermissionChip({
  icon,
  label,
  active,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`admin-permission-chip${active ? ' is-active' : ' is-inactive'}`}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

/** Card / read-only chips — compact status only. */
function PermissionChips({
  permissions,
  activeOnly = false,
  fullAccess = false,
}: {
  permissions: AdminPermissions;
  activeOnly?: boolean;
  fullAccess?: boolean;
}) {
  if (fullAccess) {
    return (
      <div className="admin-permission-chips">
        <span className="admin-permission-chip is-active" title="Full access">
          <Shield size={14} strokeWidth={2.2} aria-hidden="true" />
          <span>Full access</span>
        </span>
      </div>
    );
  }

  const keys = activeOnly
    ? DASHBOARD_PERMISSION_KEYS.filter((key) => Boolean(permissions[key]))
    : DASHBOARD_PERMISSION_KEYS;

  if (keys.length === 0) {
    return (
      <div className="admin-permission-chips">
        <span className="admin-permission-chip is-inactive">No permissions</span>
      </div>
    );
  }

  return (
    <div className="admin-permission-chips">
      {keys.map((key) => (
        <PermissionChip
          key={key}
          icon={PERMISSION_ICONS[key]}
          label={DASHBOARD_PERMISSION_LABELS[key]}
          active={Boolean(permissions[key])}
        />
      ))}
    </div>
  );
}

/** Modal toggles — full-width switch rows (not tag pills). */
function PermissionToggleList({
  permissions,
  onToggle,
}: {
  permissions: AdminPermissions;
  onToggle: (key: DashboardPermissionKey) => void;
}) {
  return (
    <div className="admin-permission-toggles" role="group" aria-label="Permissions">
      {DASHBOARD_PERMISSION_KEYS.map((key) => {
        const active = Boolean(permissions[key]);
        return (
          <button
            key={key}
            type="button"
            className={`admin-permission-toggle${active ? ' is-on' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(key)}
          >
            <span className="admin-permission-toggle__icon" aria-hidden="true">
              {PERMISSION_ICONS[key]}
            </span>
            <span className="admin-permission-toggle__copy">
              <span className="admin-permission-toggle__label">
                {DASHBOARD_PERMISSION_LABELS[key]}
              </span>
              <span className="admin-permission-toggle__hint">
                {active ? 'Enabled' : 'Off — tap to grant'}
              </span>
            </span>
            <span className="admin-permission-toggle__switch" aria-hidden="true">
              <span className="admin-permission-toggle__knob" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled,
  showLabel = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      className={`admin-kanban-icon-btn admin-kanban-icon-btn--${variant}${showLabel ? ' has-label' : ''}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

function ColumnEmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="admin-kanban-empty">
      <span className="admin-kanban-empty__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="admin-kanban-empty__msg">{message}</p>
    </div>
  );
}

function KanbanCard({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: RoleTone;
}) {
  return (
    <article
      className={`admin-kanban-card${tone ? ` admin-kanban-card--${tone}` : ''}`}
    >
      {children}
    </article>
  );
}

function CardActions({ children }: { children: ReactNode }) {
  return <div className="admin-kanban-card__actions">{children}</div>;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="admin-avatar admin-kanban-card__avatar" aria-hidden="true">
      {initials}
    </span>
  );
}

const DRAWER_EXIT_MS = 240;

/** Right sidebar panel — enter/exit slide + backdrop fade. */
function MembersDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  danger = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}) {
  const titleId = useId();
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setExiting(false);
      return;
    }
    if (!rendered) return;
    setExiting(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setExiting(false);
    }, DRAWER_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered || exiting) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rendered, exiting, onClose]);

  useEffect(() => {
    if (!rendered) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [rendered]);

  if (!rendered) return null;

  return (
    <AdminOverlayPortal>
      <div
        className={`admin-drawer-root members-drawer-root${exiting ? ' is-exiting' : ''}`}
        role="presentation"
      >
        <button
          type="button"
          className={`admin-drawer__backdrop${exiting ? ' is-exiting' : ''}`}
          aria-label="Close panel"
          onClick={onClose}
        />
        <aside
          className={`admin-drawer members-drawer${danger ? ' members-drawer--danger' : ''}${exiting ? ' is-exiting' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="admin-drawer__head">
            <div>
              <h2 id={titleId} className="admin-drawer__title">
                {title}
              </h2>
              {subtitle ? <p className="admin-drawer__sub">{subtitle}</p> : null}
            </div>
            <button type="button" className="admin-drawer__close" onClick={onClose}>
              Close
            </button>
          </header>
          <div className="admin-drawer__body members-drawer__body">{children}</div>
          {footer ? <footer className="members-drawer__foot">{footer}</footer> : null}
        </aside>
      </div>
    </AdminOverlayPortal>
  );
}

/**
 * Superadmin-only: invite → pending → active → removed as a Kanban board.
 */
export function MemberManagement() {
  const { user, isSuperadmin } = useAuth();
  const canManage = isSuperadmin;
  const [pending, setPending] = useState<AdminMemberRow[]>([]);
  const [active, setActive] = useState<AdminMemberRow[]>([]);
  const [removed, setRemoved] = useState<AdminMemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<MemberSort>('name_asc');
  const [hardDeleteTarget, setHardDeleteTarget] = useState<AdminMemberRow | null>(null);
  const [showAccessCodePanel, setShowAccessCodePanel] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [accessCodeBusy, setAccessCodeBusy] = useState(false);
  const [accessCodeNote, setAccessCodeNote] = useState<string | null>(null);
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);

  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('admin');
  const [invitePerms, setInvitePerms] = useState<AdminPermissions>(emptyPermissions());
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null);
  const [inviteDuplicateWarn, setInviteDuplicateWarn] = useState(false);
  const inviteEmailValid = EMAIL_RE.test(inviteEmail.trim());

  const [editingMember, setEditingMember] = useState<AdminMemberRow | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>('admin');
  const [editPerms, setEditPerms] = useState<AdminPermissions>(emptyPermissions());

  const refresh = useCallback(async () => {
    const [p, a, r] = await Promise.all([
      listAdminsByStatus('pending'),
      listAdminsByStatus('active'),
      listAdminsByStatus('removed'),
    ]);
    setPending(p);
    setActive(a);
    setRemoved(r);
    if (isSuperadmin) {
      const i = await listInvites();
      setInvites(i.filter((row) => !row.used));
    } else {
      setInvites([]);
    }
  }, [isSuperadmin]);

  useEffect(() => {
    if (!user) return;
    void refresh().catch(() => setError('Could not load members or invites.'));
  }, [user, refresh]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 160);
    return () => window.clearTimeout(t);
  }, [query]);

  const filtersActive = Boolean(debouncedQuery || roleFilter !== 'all' || sortBy !== 'name_asc');

  const filteredInvites = useMemo(() => {
    const next = invites.filter(
      (row) =>
        matchesQuery(undefined, row.email, debouncedQuery) &&
        matchesRoleFilter(row.role, roleFilter),
    );
    return sortInvites(next, sortBy);
  }, [invites, debouncedQuery, roleFilter, sortBy]);

  const filteredPending = useMemo(() => {
    const next = pending.filter(
      (row) =>
        matchesQuery(row.fullName, row.email, debouncedQuery) &&
        matchesRoleFilter(roleForFilter(row), roleFilter),
    );
    return sortMembers(next, sortBy);
  }, [pending, debouncedQuery, roleFilter, sortBy]);

  const filteredActive = useMemo(() => {
    const next = active.filter(
      (row) =>
        matchesQuery(row.fullName, row.email, debouncedQuery) &&
        matchesRoleFilter(roleForFilter(row), roleFilter),
    );
    return sortMembers(next, sortBy);
  }, [active, debouncedQuery, roleFilter, sortBy]);

  const filteredRemoved = useMemo(() => {
    const next = removed.filter(
      (row) =>
        matchesQuery(row.fullName, row.email, debouncedQuery) &&
        matchesRoleFilter(roleForFilter(row), roleFilter),
    );
    return sortMembers(next, sortBy);
  }, [removed, debouncedQuery, roleFilter, sortBy]);

  const totalVisible =
    filteredInvites.length +
    filteredPending.length +
    filteredActive.length +
    (showRemoved ? filteredRemoved.length : 0);
  const totalAll = invites.length + pending.length + active.length + (showRemoved ? removed.length : 0);

  if (!user) return null;

  const openAccessCodePanel = async () => {
    if (!canManage) return;
    setShowInvitePanel(false);
    setEditingMember(null);
    setHardDeleteTarget(null);
    setShowAccessCodePanel(true);
    setAccessCodeNote(null);
    setAccessCodeError(null);
    setAccessCodeBusy(true);
    try {
      const live = await getSignupAccessCode();
      setAccessCode(live ? normalizeAccessCode(live) : null);
    } catch {
      setAccessCode(null);
      setAccessCodeError('Could not load the access code.');
    } finally {
      setAccessCodeBusy(false);
    }
  };

  const handleGenerateAccessCode = async () => {
    if (!canManage) return;
    if (
      !window.confirm(
        'Generate a new signup access code? The previous code stops working immediately.',
      )
    ) {
      return;
    }
    setAccessCodeBusy(true);
    setAccessCodeNote(null);
    setAccessCodeError(null);
    try {
      const next = await generateSignupAccessCode(user.uid);
      setAccessCode(next);
      try {
        await navigator.clipboard.writeText(next);
        setAccessCodeNote('New access code generated and copied.');
      } catch {
        setAccessCodeNote('New access code generated. Use Copy if you need it on the clipboard.');
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not generate access code.';
      setAccessCodeError(message);
    } finally {
      setAccessCodeBusy(false);
    }
  };

  const handleCopyAccessCode = async () => {
    if (!accessCode) return;
    setAccessCodeError(null);
    try {
      await navigator.clipboard.writeText(accessCode);
      setAccessCodeNote('Access code copied.');
    } catch {
      setAccessCodeError('Could not copy access code. Select the code and copy it manually.');
    }
  };

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await action();
      await refresh();
      setNote(success);
    } catch {
      setError('That action failed. Check your connection and permissions.');
    } finally {
      setBusy(false);
    }
  };

  const openEditPanel = (member: AdminMemberRow) => {
    setShowInvitePanel(false);
    setShowAccessCodePanel(false);
    setHardDeleteTarget(null);
    setEditingMember(member);
    setEditRole(
      member.role && isAssignableRole(member.role) ? member.role : 'admin',
    );
    setEditPerms({ ...emptyPermissions(), ...member.permissions });
  };

  const openInvitePanel = () => {
    setEditingMember(null);
    setShowAccessCodePanel(false);
    setHardDeleteTarget(null);
    setShowInvitePanel(true);
  };

  const openDeletePanel = (member: AdminMemberRow) => {
    setShowInvitePanel(false);
    setEditingMember(null);
    setShowAccessCodePanel(false);
    setHardDeleteTarget(member);
  };

  const closeInvitePanel = () => {
    setShowInvitePanel(false);
    setInviteEmail('');
    setInviteRole('admin');
    setInvitePerms(emptyPermissions());
    setInviteEmailError(null);
    setInviteDuplicateWarn(false);
  };

  const submitInvite = async () => {
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setInviteEmailError('Enter a valid email address.');
      setInviteDuplicateWarn(false);
      return;
    }
    setInviteEmailError(null);
    const duplicate = invites.some((row) => row.email.trim().toLowerCase() === trimmed);
    if (duplicate && !inviteDuplicateWarn) {
      setInviteDuplicateWarn(true);
      setInviteEmailError('A pending invite already exists for this email.');
      return;
    }

    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const created = await createInvite({
        email: trimmed,
        role: inviteRole,
        permissions: invitePerms,
        createdBy: user.uid,
      });
      const link = inviteSignupUrl(created.id);
      await refresh();
      closeInvitePanel();
      try {
        await navigator.clipboard.writeText(link);
        setNote('Invite created. Signup link copied to clipboard.');
      } catch {
        setNote(`Invite created. Link: ${link}`);
      }
    } catch {
      setError('That action failed. Check your connection and permissions.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="dash-page members-page" aria-labelledby="admin-members-title">
      <div className="dash-page__header">
        <h1 id="admin-members-title" className="dash-page__title">
          Members
        </h1>
        <div className="dash-page__tools">
          {canManage ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => void openAccessCodePanel()}>
                <KeyRound size={16} strokeWidth={2.2} aria-hidden="true" />
                Access code
              </Button>
              <Button variant="primary" size="sm" onClick={openInvitePanel}>
                <UserPlus size={16} strokeWidth={2.2} aria-hidden="true" />
                Add Member
              </Button>
            </>
          ) : (
            <p className="members-page__readonly-hint">View only — role changes need a superadmin</p>
          )}
        </div>
      </div>

      {error ? (
        <p className="na-error" role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p role="status" className="admin-kanban-note">
          {note}
        </p>
      ) : null}

      <div className="members-toolbar" role="search">
        <div className="members-toolbar__filters">
          <div className="members-toolbar__search">
            <Input
              label="Search members"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="members-toolbar__select">
            <Select
              label="Role"
              options={['All roles', 'Proponent', 'Adviser', 'Superadmin']}
              value={
                roleFilter === 'all'
                  ? 'All roles'
                  : roleFilter === 'superadmin'
                    ? 'Superadmin'
                    : roleFilter === 'adviser'
                      ? 'Adviser'
                      : 'Proponent'
              }
              onChange={(e) => {
                const v = e.target.value;
                setRoleFilter(
                  v === 'Superadmin'
                    ? 'superadmin'
                    : v === 'Adviser'
                      ? 'adviser'
                      : v === 'Proponent'
                        ? 'admin'
                        : 'all',
                );
              }}
            />
          </div>
          <div className="members-toolbar__select">
            <Select
              label="Sort by"
              options={['Name (A-Z)', 'Recently joined', 'Oldest first']}
              value={
                sortBy === 'joined_desc'
                  ? 'Recently joined'
                  : sortBy === 'joined_asc'
                    ? 'Oldest first'
                    : 'Name (A-Z)'
              }
              onChange={(e) => {
                const v = e.target.value;
                setSortBy(
                  v === 'Recently joined'
                    ? 'joined_desc'
                    : v === 'Oldest first'
                      ? 'joined_asc'
                      : 'name_asc',
                );
              }}
            />
          </div>
        </div>
        <div className="members-toolbar__actions">
          <p className="members-toolbar__count" aria-live="polite">
            Showing {totalVisible} of {totalAll}
          </p>
          <div className="members-toolbar__chips">
            <button
              type="button"
              className={`members-toolbar__chip${showRemoved ? ' is-active' : ''}`}
              onClick={() => setShowRemoved((v) => !v)}
              aria-pressed={showRemoved}
            >
              Removed{removed.length > 0 ? ` · ${removed.length}` : ''}
            </button>
            {filtersActive ? (
              <button
                type="button"
                className="members-toolbar__chip"
                onClick={() => {
                  setQuery('');
                  setRoleFilter('all');
                  setSortBy('name_asc');
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="admin-kanban" role="region" aria-label="Members pipeline">
        <div className="admin-kanban__scroller">
          {/* Invited */}
          <section className="admin-kanban-col" aria-labelledby="kanban-invited">
            <header className="admin-kanban-col__head">
              <Mail size={16} strokeWidth={2.2} aria-hidden="true" />
              <h2 id="kanban-invited" className="admin-kanban-col__title">
                Invited
              </h2>
              <span className="admin-kanban-col__count">{filteredInvites.length}</span>
            </header>
            <div className="admin-kanban-col__body">
              {filteredInvites.length === 0 ? (
                <ColumnEmptyState icon={<Inbox size={24} />} message="No pending invites" />
              ) : (
                filteredInvites.map((invite) => {
                  const tone = roleTone(invite.role);
                  return (
                    <KanbanCard key={invite.id} tone={tone}>
                      <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                        <Avatar initials={emailInitials(invite.email)} />
                        <div className="admin-kanban-card__meta">
                          <div className="admin-kanban-card__name">{invite.email}</div>
                          <div className="admin-kanban-card__muted">Pending signup</div>
                        </div>
                        <RoleBadge role={invite.role} />
                      </div>
                      <PermissionChips
                        permissions={invite.permissions}
                        activeOnly
                        fullAccess={invite.role === 'superadmin'}
                      />
                      {canManage ? (
                        <CardActions>
                          <IconButton
                            icon={<Copy size={14} />}
                            label="Copy link"
                            showLabel
                            disabled={busy}
                            onClick={() => {
                              const link = inviteSignupUrl(invite.id);
                              void navigator.clipboard.writeText(link).then(
                                () => setNote('Invite link copied.'),
                                () =>
                                  setError(
                                    'Could not copy link. Copy from the address bar after opening.',
                                  ),
                              );
                            }}
                          />
                          <IconButton
                            icon={<Trash2 size={14} />}
                            label="Revoke"
                            showLabel
                            variant="danger"
                            disabled={busy}
                            onClick={() => {
                              if (!window.confirm(`Revoke invite for ${invite.email}?`)) return;
                              void run(
                                () => revokeInvite(invite.id),
                                `Revoked invite for ${invite.email}.`,
                              );
                            }}
                          />
                        </CardActions>
                      ) : null}
                    </KanbanCard>
                  );
                })
              )}
            </div>
          </section>

          {/* Pending */}
          <section className="admin-kanban-col" aria-labelledby="kanban-pending">
            <header className="admin-kanban-col__head">
              <CheckCircle2 size={16} strokeWidth={2.2} aria-hidden="true" />
              <h2 id="kanban-pending" className="admin-kanban-col__title">
                Pending Approval
              </h2>
              <span className="admin-kanban-col__count">{filteredPending.length}</span>
            </header>
            <div className="admin-kanban-col__body">
              {filteredPending.length === 0 ? (
                <ColumnEmptyState icon={<Inbox size={24} />} message="No pending requests" />
              ) : (
                filteredPending.map((account) => {
                  const tone = roleTone(account.requestedRole || 'admin');
                  return (
                    <KanbanCard key={account.uid} tone={tone}>
                      <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                        <Avatar initials={memberInitials(account.fullName, account.email)} />
                        <div className="admin-kanban-card__meta">
                          <div className="admin-kanban-card__name">
                            {account.fullName || 'Unnamed'}
                          </div>
                          <div className="admin-kanban-card__muted">{account.email}</div>
                          <div className="admin-kanban-card__muted">
                            Requested: {account.requestedRole || '—'}
                          </div>
                        </div>
                        <RoleBadge role={account.requestedRole || 'admin'} />
                      </div>
                      {canManage ? (
                        <CardActions>
                          <IconButton
                            icon={<CheckCircle2 size={14} />}
                            label="Approve"
                            showLabel
                            variant="primary"
                            disabled={busy}
                            onClick={() =>
                              void run(
                                () =>
                                  approvePendingAdmin({
                                    uid: account.uid,
                                    role: resolveApproveRole(account.requestedRole),
                                    permissions: emptyPermissions(),
                                    approvedBy: user.uid,
                                  }),
                                `Approved ${account.email}.`,
                              )
                            }
                          />
                          <IconButton
                            icon={<XCircle size={14} />}
                            label="Reject"
                            showLabel
                            variant="danger"
                            disabled={busy}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Reject ${account.email}? Their pending profile will be deleted.`,
                                )
                              ) {
                                return;
                              }
                              void run(
                                () => rejectPendingAdmin(account.uid),
                                `Rejected ${account.email}.`,
                              );
                            }}
                          />
                        </CardActions>
                      ) : null}
                    </KanbanCard>
                  );
                })
              )}
            </div>
          </section>

          {/* Active */}
          <section className="admin-kanban-col" aria-labelledby="kanban-active">
            <header className="admin-kanban-col__head">
              <User size={16} strokeWidth={2.2} aria-hidden="true" />
              <h2 id="kanban-active" className="admin-kanban-col__title">
                Active
              </h2>
              <span className="admin-kanban-col__count">{filteredActive.length}</span>
            </header>
            <div className="admin-kanban-col__body">
              {filteredActive.length === 0 ? (
                <ColumnEmptyState icon={<Inbox size={24} />} message="No active members" />
              ) : (
                filteredActive.map((member) => {
                  const tone = roleTone(member.role);
                  return (
                    <KanbanCard key={member.uid} tone={tone}>
                      <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                        <Avatar initials={memberInitials(member.fullName, member.email)} />
                        <div className="admin-kanban-card__meta">
                          <div className="admin-kanban-card__name">
                            {member.fullName || 'Unnamed'}
                          </div>
                          <div className="admin-kanban-card__muted">{member.email}</div>
                        </div>
                        <RoleBadge role={member.role || 'admin'} />
                      </div>
                      <PermissionChips
                        permissions={member.permissions}
                        activeOnly
                        fullAccess={member.role === 'superadmin'}
                      />
                      {canManage ? (
                        <CardActions>
                          <IconButton
                            icon={<Pencil size={14} />}
                            label="Edit"
                            showLabel
                            disabled={busy}
                            onClick={() => openEditPanel(member)}
                          />
                          {member.uid !== user.uid ? (
                            <IconButton
                              icon={<UserMinus size={14} />}
                              label="Remove"
                              showLabel
                              variant="danger"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Remove access for ${member.email}? This is a soft removal (status: removed).`,
                                  )
                                ) {
                                  return;
                                }
                                void run(
                                  () =>
                                    removeActiveMember({
                                      uid: member.uid,
                                      removedBy: user.uid,
                                    }),
                                  `Removed ${member.email}.`,
                                );
                              }}
                            />
                          ) : null}
                        </CardActions>
                      ) : null}
                    </KanbanCard>
                  );
                })
              )}
            </div>
          </section>

          {/* Removed — only when toggled */}
          {showRemoved ? (
            <section className="admin-kanban-col" aria-labelledby="kanban-removed">
              <header className="admin-kanban-col__head">
                <UserMinus size={16} strokeWidth={2.2} aria-hidden="true" />
                <h2 id="kanban-removed" className="admin-kanban-col__title">
                  Removed
                </h2>
                <span className="admin-kanban-col__count">{filteredRemoved.length}</span>
              </header>
              <div className="admin-kanban-col__body">
                {filteredRemoved.length === 0 ? (
                  <ColumnEmptyState icon={<Inbox size={24} />} message="No removed members" />
                ) : (
                  filteredRemoved.map((member) => {
                    const tone = roleTone(member.role);
                    return (
                      <KanbanCard key={member.uid} tone={tone}>
                        <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                          <Avatar initials={memberInitials(member.fullName, member.email)} />
                          <div className="admin-kanban-card__meta">
                            <div className="admin-kanban-card__name">
                              {member.fullName || 'Unnamed'}
                            </div>
                            <div className="admin-kanban-card__muted">{member.email}</div>
                          </div>
                          <RoleBadge role={member.role || 'admin'} />
                        </div>
                        <div className="admin-kanban-card__history">
                          <div>Removed {formatRemovedAt(member.removedAt)}</div>
                          <div>By {member.removedBy || '—'}</div>
                        </div>
                        {canManage ? (
                          <CardActions>
                            <IconButton
                              icon={<Trash2 size={14} />}
                              label="Delete forever"
                              showLabel
                              variant="danger"
                              disabled={busy}
                              onClick={() => openDeletePanel(member)}
                            />
                          </CardActions>
                        ) : null}
                      </KanbanCard>
                    );
                  })
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {canManage ? (
        <MembersDrawer
          open={showInvitePanel}
          title="Add member"
          subtitle="Invite link — sent manually"
          onClose={closeInvitePanel}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={closeInvitePanel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy || !inviteEmailValid}
                onClick={() => void submitInvite()}
              >
                {inviteDuplicateWarn ? 'Create anyway' : 'Create invite link'}
              </Button>
            </>
          }
        >
          <p className="admin-member-modal__lead">
            Creates an unused invite. Copy the signup link and send it yourself — the app does not
            email.
          </p>
          <Input
            id="invite-email"
            label="Email"
            type="email"
            placeholder="name@ub.edu.ph"
            value={inviteEmail}
            onChange={(event) => {
              setInviteEmail(event.target.value);
              setInviteEmailError(null);
              setInviteDuplicateWarn(false);
            }}
            required
            error={inviteEmailError}
          />
          <label className="admin-member-modal__field" htmlFor="invite-role">
            <span className="admin-member-modal__label">Role</span>
            <RoleSelect id="invite-role" value={inviteRole} onChange={setInviteRole} />
          </label>
          <div className="admin-member-modal__field">
            <span className="admin-member-modal__label" id="invite-perms-label">
              Permissions
            </span>
            <p className="admin-member-modal__hint">
              Choose what this admin can open after they accept the invite.
            </p>
            <PermissionToggleList
              permissions={invitePerms}
              onToggle={(key) =>
                setInvitePerms((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            />
          </div>
        </MembersDrawer>
      ) : null}

      {canManage ? (
        <MembersDrawer
          open={Boolean(editingMember)}
          title="Edit member"
          subtitle={
            editingMember
              ? `${editingMember.fullName || 'Unnamed'} · ${editingMember.email}`
              : undefined
          }
          onClose={() => setEditingMember(null)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditingMember(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy || !editingMember}
                onClick={() => {
                  if (!editingMember) return;
                  void run(async () => {
                    await updateActiveMember({
                      uid: editingMember.uid,
                      role: editRole,
                      permissions: editPerms,
                    });
                    setEditingMember(null);
                  }, `Updated ${editingMember.email}.`);
                }}
              >
                Save changes
              </Button>
            </>
          }
        >
          <label className="admin-member-modal__field" htmlFor="edit-role">
            <span className="admin-member-modal__label">Role</span>
            <RoleSelect
              id="edit-role"
              value={editRole}
              onChange={setEditRole}
              disabled={editingMember?.uid === user.uid}
            />
          </label>
          <div className="admin-member-modal__field">
            <span className="admin-member-modal__label">Permissions</span>
            <p className="admin-member-modal__hint">
              Superadmins keep full access regardless of these toggles.
            </p>
            <PermissionToggleList
              permissions={editPerms}
              onToggle={(key) =>
                setEditPerms((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            />
          </div>
        </MembersDrawer>
      ) : null}

      {canManage ? (
        <MembersDrawer
          open={Boolean(hardDeleteTarget)}
          title="Permanently delete?"
          subtitle={hardDeleteTarget?.email}
          danger
          onClose={() => setHardDeleteTarget(null)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setHardDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy || !hardDeleteTarget}
                onClick={() => {
                  if (!hardDeleteTarget) return;
                  const target = hardDeleteTarget;
                  setHardDeleteTarget(null);
                  void run(
                    () => permanentlyDeleteRemovedAdmin(target.uid),
                    `Permanently deleted ${target.email}.`,
                  );
                }}
              >
                Delete forever
              </Button>
            </>
          }
        >
          <p className="admin-member-modal__lead">
            Hard-deletes the removed record. Cannot undo. Auth account disable still needs a Cloud
            Function.
          </p>
        </MembersDrawer>
      ) : null}

      {canManage ? (
        <MembersDrawer
          open={showAccessCodePanel}
          title="Signup access code"
          subtitle="Superadmin only"
          onClose={() => {
            setShowAccessCodePanel(false);
            setAccessCodeNote(null);
            setAccessCodeError(null);
          }}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAccessCodePanel(false);
                  setAccessCodeNote(null);
                  setAccessCodeError(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={accessCodeBusy}
                onClick={() => void handleGenerateAccessCode()}
              >
                {accessCodeBusy ? 'Working…' : 'Generate new code'}
              </Button>
            </>
          }
        >
          <p className="admin-member-modal__lead">
            Shared with new proponents/advisers at signup. Only superadmins can view or rotate it.
            Codes are case-insensitive.
          </p>
          <div className="access-code-box">
            <code className="access-code-box__value">
              {accessCodeBusy ? 'Loading…' : accessCode || 'No code set yet'}
            </code>
            <Button
              variant="secondary"
              size="sm"
              disabled={accessCodeBusy || !accessCode}
              onClick={() => void handleCopyAccessCode()}
            >
              Copy
            </Button>
          </div>
          {accessCodeError ? (
            <p className="na-error" role="alert" style={{ marginTop: 12 }}>
              {accessCodeError}
            </p>
          ) : null}
          {accessCodeNote ? (
            <p role="status" className="admin-kanban-note" style={{ marginTop: 12 }}>
              {accessCodeNote}
            </p>
          ) : null}
        </MembersDrawer>
      ) : null}
    </section>
  );
}
