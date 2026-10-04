'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Inbox,
  Mail,
  Pencil,
  Shield,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  DASHBOARD_PERMISSION_KEYS,
  DASHBOARD_PERMISSION_LABELS,
  emptyPermissions,
  type AdminPermissions,
  type AdminRole,
  type DashboardPermissionKey,
} from '@/lib/admin/access';
import { useAuth } from '@/lib/auth/AuthProvider';
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
  if (row.role === 'superadmin' || row.role === 'admin') return row.role;
  const requested = row.requestedRole?.trim().toLowerCase();
  if (requested === 'superadmin' || requested === 'admin') return requested;
  return null;
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
  return requestedRole?.trim().toLowerCase() === 'superadmin' ? 'superadmin' : 'admin';
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
      <option value="admin">admin</option>
      <option value="superadmin">superadmin</option>
    </select>
  );
}

function RoleBadge({
  role,
  icon,
}: {
  role: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={`admin-kanban-role${role === 'superadmin' ? ' admin-kanban-role--super' : ''}`}
    >
      {icon}
      {role}
    </span>
  );
}

function PermissionChip({
  icon,
  label,
  active,
  onToggle,
  readOnly,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}) {
  if (readOnly || !onToggle) {
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

  return (
    <button
      type="button"
      className={`admin-permission-chip admin-permission-chip--toggle${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={onToggle}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PermissionChips({
  permissions,
  onToggle,
  readOnly,
}: {
  permissions: AdminPermissions;
  onToggle?: (key: DashboardPermissionKey) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="admin-permission-chips">
      {DASHBOARD_PERMISSION_KEYS.map((key) => (
        <PermissionChip
          key={key}
          icon={PERMISSION_ICONS[key]}
          label={DASHBOARD_PERMISSION_LABELS[key]}
          active={Boolean(permissions[key])}
          readOnly={readOnly || !onToggle}
          onToggle={onToggle ? () => onToggle(key) : undefined}
        />
      ))}
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`admin-kanban-icon-btn admin-kanban-icon-btn--${variant}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
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

function KanbanCard({ children }: { children: ReactNode }) {
  return <article className="admin-kanban-card">{children}</article>;
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

function MemberModal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const titleId = useId();
  return (
    <div className="admin-member-modal-root" role="presentation">
      <button
        type="button"
        className="admin-member-modal__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="admin-member-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="admin-member-modal__head">
          <h2 id={titleId} className="admin-member-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="admin-member-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </header>
        <div className="admin-member-modal__body">{children}</div>
        <footer className="admin-member-modal__foot">{footer}</footer>
      </div>
    </div>
  );
}

/**
 * Superadmin-only: invite → pending → active → removed as a Kanban board.
 */
export function MemberManagement() {
  const { user, isSuperadmin } = useAuth();
  const [pending, setPending] = useState<AdminMemberRow[]>([]);
  const [active, setActive] = useState<AdminMemberRow[]>([]);
  const [removed, setRemoved] = useState<AdminMemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<MemberSort>('name_asc');

  const [showInviteModal, setShowInviteModal] = useState(false);
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
    const [p, a, r, i] = await Promise.all([
      listAdminsByStatus('pending'),
      listAdminsByStatus('active'),
      listAdminsByStatus('removed'),
      listInvites(),
    ]);
    setPending(p);
    setActive(a);
    setRemoved(r);
    setInvites(i.filter((row) => !row.used));
  }, []);

  useEffect(() => {
    if (!isSuperadmin) return;
    void refresh().catch(() => setError('Could not load members or invites.'));
  }, [isSuperadmin, refresh]);

  const filteredInvites = useMemo(() => {
    const next = invites.filter(
      (row) =>
        matchesQuery(undefined, row.email, query) && matchesRoleFilter(row.role, roleFilter),
    );
    return sortInvites(next, sortBy);
  }, [invites, query, roleFilter, sortBy]);

  const filteredPending = useMemo(() => {
    const next = pending.filter(
      (row) =>
        matchesQuery(row.fullName, row.email, query) &&
        matchesRoleFilter(roleForFilter(row), roleFilter),
    );
    return sortMembers(next, sortBy);
  }, [pending, query, roleFilter, sortBy]);

  const filteredActive = useMemo(() => {
    const next = active.filter(
      (row) =>
        matchesQuery(row.fullName, row.email, query) &&
        matchesRoleFilter(roleForFilter(row), roleFilter),
    );
    return sortMembers(next, sortBy);
  }, [active, query, roleFilter, sortBy]);

  const filteredRemoved = useMemo(() => {
    const next = removed.filter(
      (row) =>
        matchesQuery(row.fullName, row.email, query) &&
        matchesRoleFilter(roleForFilter(row), roleFilter),
    );
    return sortMembers(next, sortBy);
  }, [removed, query, roleFilter, sortBy]);

  if (!isSuperadmin || !user) return null;

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

  const openEditModal = (member: AdminMemberRow) => {
    setEditingMember(member);
    setEditRole(member.role === 'superadmin' ? 'superadmin' : 'admin');
    setEditPerms({ ...emptyPermissions(), ...member.permissions });
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
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
      closeInviteModal();
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

  const confirmPermanentDelete = (member: AdminMemberRow) => {
    if (
      !window.confirm(
        `Permanently delete ${member.email}? This cannot be undone.`,
      )
    ) {
      return;
    }
    if (
      !window.confirm(
        `Final confirmation: hard-delete the removed record for ${member.email}?`,
      )
    ) {
      return;
    }
    void run(
      () => permanentlyDeleteRemovedAdmin(member.uid),
      `Permanently deleted ${member.email}.`,
    );
  };

  return (
    <section className="admin-section" aria-labelledby="admin-members-title">
      <div className="admin-member-card__head">
        <h1 id="admin-members-title" className="admin-section__title">
          Members and invites
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={16} strokeWidth={2.2} aria-hidden="true" />
          Add Member
        </Button>
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

      <div className="members-toolbar responses-toolbar" role="search">
        <div className="responses-toolbar__inner">
          <div className="admin-toolbar__filters">
            <div className="admin-toolbar__search">
              <Input
                label="Search members"
                placeholder="Search name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="admin-toolbar__select">
              <Select
                label="Role"
                options={['All roles', 'superadmin', 'admin']}
                value={
                  roleFilter === 'all'
                    ? 'All roles'
                    : roleFilter === 'superadmin'
                      ? 'superadmin'
                      : 'admin'
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setRoleFilter(
                    v === 'superadmin' ? 'superadmin' : v === 'admin' ? 'admin' : 'all',
                  );
                }}
              />
            </div>
            <div className="admin-toolbar__select">
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
                filteredInvites.map((invite) => (
                  <KanbanCard key={invite.id}>
                    <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                      <Avatar initials={emailInitials(invite.email)} />
                      <div className="admin-kanban-card__meta">
                        <div className="admin-kanban-card__name">{invite.email}</div>
                        <div className="admin-kanban-card__muted">Pending signup</div>
                      </div>
                      <RoleBadge
                        role={invite.role}
                        icon={
                          invite.role === 'superadmin' ? (
                            <Shield size={12} aria-hidden="true" />
                          ) : (
                            <User size={12} aria-hidden="true" />
                          )
                        }
                      />
                    </div>
                    <PermissionChips permissions={invite.permissions} readOnly />
                    <CardActions>
                      <IconButton
                        icon={<Copy size={14} />}
                        label="Copy invite link"
                        disabled={busy}
                        onClick={() => {
                          const link = inviteSignupUrl(invite.id);
                          void navigator.clipboard.writeText(link).then(
                            () => setNote('Invite link copied.'),
                            () => setError('Could not copy link. Copy from the address bar after opening.'),
                          );
                        }}
                      />
                      <IconButton
                        icon={<Trash2 size={14} />}
                        label="Revoke invite"
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
                  </KanbanCard>
                ))
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
                filteredPending.map((account) => (
                  <KanbanCard key={account.uid}>
                    <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                      <Avatar initials={memberInitials(account.fullName, account.email)} />
                      <div className="admin-kanban-card__meta">
                        <div className="admin-kanban-card__name">
                          {account.fullName || 'Unnamed'}
                        </div>
                        <div className="admin-kanban-card__muted">{account.email}</div>
                      </div>
                      <RoleBadge
                        role={account.requestedRole || 'admin'}
                        icon={<User size={12} aria-hidden="true" />}
                      />
                    </div>
                    <CardActions>
                      <IconButton
                        icon={<CheckCircle2 size={14} />}
                        label="Approve"
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
                        variant="danger"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm(`Reject ${account.email}? Their pending profile will be deleted.`)) {
                            return;
                          }
                          void run(
                            () => rejectPendingAdmin(account.uid),
                            `Rejected ${account.email}.`,
                          );
                        }}
                      />
                    </CardActions>
                  </KanbanCard>
                ))
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
                filteredActive.map((member) => (
                  <KanbanCard key={member.uid}>
                    <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                      <Avatar initials={memberInitials(member.fullName, member.email)} />
                      <div className="admin-kanban-card__meta">
                        <div className="admin-kanban-card__name">
                          {member.fullName || 'Unnamed'}
                        </div>
                        <div className="admin-kanban-card__muted">{member.email}</div>
                      </div>
                      <RoleBadge
                        role={member.role || 'admin'}
                        icon={
                          member.role === 'superadmin' ? (
                            <Shield size={12} aria-hidden="true" />
                          ) : (
                            <User size={12} aria-hidden="true" />
                          )
                        }
                      />
                    </div>
                    <PermissionChips
                      permissions={member.permissions}
                      onToggle={(key) => {
                        const next = {
                          ...emptyPermissions(),
                          ...member.permissions,
                          [key]: !member.permissions?.[key],
                        };
                        void run(
                          () =>
                            updateActiveMember({
                              uid: member.uid,
                              role: member.role === 'superadmin' ? 'superadmin' : 'admin',
                              permissions: next,
                            }),
                          `Updated permissions for ${member.email}.`,
                        );
                      }}
                    />
                    <CardActions>
                      <IconButton
                        icon={<Pencil size={14} />}
                        label="Edit"
                        disabled={busy}
                        onClick={() => openEditModal(member)}
                      />
                      {member.uid !== user.uid ? (
                        <IconButton
                          icon={<UserMinus size={14} />}
                          label="Remove"
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
                  </KanbanCard>
                ))
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
                  filteredRemoved.map((member) => (
                    <KanbanCard key={member.uid}>
                      <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                        <Avatar initials={memberInitials(member.fullName, member.email)} />
                        <div className="admin-kanban-card__meta">
                          <div className="admin-kanban-card__name">
                            {member.fullName || 'Unnamed'}
                          </div>
                          <div className="admin-kanban-card__muted">{member.email}</div>
                        </div>
                        <RoleBadge
                          role={member.role || 'admin'}
                          icon={
                            member.role === 'superadmin' ? (
                              <Shield size={12} aria-hidden="true" />
                            ) : (
                              <User size={12} aria-hidden="true" />
                            )
                          }
                        />
                      </div>
                      <PermissionChips permissions={member.permissions} readOnly />
                      <div className="admin-kanban-card__history">
                        <div>Removed {formatRemovedAt(member.removedAt)}</div>
                        <div>By {member.removedBy || '—'}</div>
                      </div>
                      <CardActions>
                        <IconButton
                          icon={<Trash2 size={14} />}
                          label="Permanently delete"
                          variant="danger"
                          disabled={busy}
                          onClick={() => confirmPermanentDelete(member)}
                        />
                      </CardActions>
                    </KanbanCard>
                  ))
                )}
              </div>
            </section>
          ) : null}
        </div>

        <div className="admin-kanban__footer">
          <button
            type="button"
            className="admin-kanban-toggle-removed"
            onClick={() => setShowRemoved((v) => !v)}
            aria-expanded={showRemoved}
          >
            {showRemoved ? 'Hide removed members' : 'Show removed members'}
            {!showRemoved && removed.length > 0 ? (
              <span className="admin-kanban-col__count">{removed.length}</span>
            ) : null}
          </button>
        </div>
      </div>

      {showInviteModal ? (
        <MemberModal
          title="Add Member"
          onClose={closeInviteModal}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={closeInviteModal}>
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
          <Input
            id="invite-email"
            label="Email"
            type="email"
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
            Role
            <RoleSelect id="invite-role" value={inviteRole} onChange={setInviteRole} />
          </label>
          <div className="admin-member-modal__field">
            <span className="admin-member-modal__label">Permissions</span>
            <PermissionChips
              permissions={invitePerms}
              onToggle={(key) =>
                setInvitePerms((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            />
          </div>
        </MemberModal>
      ) : null}

      {editingMember ? (
        <MemberModal
          title="Edit member"
          onClose={() => setEditingMember(null)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditingMember(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await updateActiveMember({
                      uid: editingMember.uid,
                      role: editRole,
                      permissions: editPerms,
                    });
                    setEditingMember(null);
                  }, `Updated ${editingMember.email}.`)
                }
              >
                Save changes
              </Button>
            </>
          }
        >
          <p className="admin-member-modal__lead">
            {editingMember.fullName || 'Unnamed'} · {editingMember.email}
          </p>
          <label className="admin-member-modal__field" htmlFor="edit-role">
            Role
            <RoleSelect
              id="edit-role"
              value={editRole}
              onChange={setEditRole}
              disabled={editingMember.uid === user.uid}
            />
          </label>
          <div className="admin-member-modal__field">
            <span className="admin-member-modal__label">Permissions</span>
            <PermissionChips
              permissions={editPerms}
              onToggle={(key) =>
                setEditPerms((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            />
          </div>
        </MemberModal>
      ) : null}
    </section>
  );
}
