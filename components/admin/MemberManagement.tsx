'use client';

import { PageHeading } from '@/components/admin/PageHeading';
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { CountLedger } from '@/components/admin/CountLedger';
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
  SIGN_IN_OFF_LABELS,
  SIGN_IN_PERMISSION_HINTS,
  SIGN_IN_PERMISSION_KEYS,
  SIGN_IN_PERMISSION_LABELS,
  type AdminPermissions,
  type AdminRole,
  type DashboardPermissionKey,
  type SignInPermissionKey,
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

/** Sign-in switches are on unless explicitly false, so a member with none set keeps everything. */
function signInOn(permissions: AdminPermissions, key: SignInPermissionKey): boolean {
  return permissions[key] !== false;
}

/** Turning off both methods would lock the person out, so the form refuses it. */
function noSignInMethod(permissions: AdminPermissions): boolean {
  return !signInOn(permissions, 'signInPassword') && !signInOn(permissions, 'signInGoogle');
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

type RosterKind = 'active' | 'invited' | 'pending' | 'removed';

interface RosterEntry {
  key: string;
  kind: RosterKind;
  name: string;
  email: string;
  role: string;
  /** Pages this person can open, as words. */
  access: string;
  /** Sign-in switches that are off, as words; null when nothing is blocked. */
  signIn: string | null;
  /** Only set for rows that are not an active member yet (or any more). */
  status: string | null;
  isSelf: boolean;
  actions: ReactNode;
}

function accessSummary(
  role: string | null | undefined,
  permissions: AdminPermissions,
): { access: string; signIn: string | null } {
  if (role === 'superadmin') return { access: 'All pages', signIn: null };
  const pages = DASHBOARD_PERMISSION_KEYS.filter((key) => Boolean(permissions[key])).map(
    (key) => DASHBOARD_PERMISSION_LABELS[key],
  );
  const blocked = SIGN_IN_PERMISSION_KEYS.filter((key) => !signInOn(permissions, key)).map(
    (key) => SIGN_IN_OFF_LABELS[key],
  );
  return {
    access: pages.length > 0 ? pages.join(', ') : 'No pages',
    signIn: blocked.length > 0 ? blocked.join(', ') : null,
  };
}

/** One person, one ruled line: who, role, what they can open, and what you can do. */
function RosterRow({ entry }: { entry: RosterEntry }) {
  return (
    <li className={`mem-row mem-row--${entry.kind}`}>
      <div className="mem-row__who">
        <p className="mem-row__name" title={entry.name}>
          {entry.name}
          {entry.isSelf ? <span className="mem-row__you"> (you)</span> : null}
        </p>
        {entry.email && entry.email !== entry.name ? (
          <p className="mem-row__sub" title={entry.email}>
            {entry.email}
          </p>
        ) : null}
      </div>
      <div className="mem-row__role">
        <p>{roleLabel(entry.role)}</p>
        {entry.status ? <p className="mem-row__sub">{entry.status}</p> : null}
      </div>
      <div className="mem-row__access">
        <p>{entry.access}</p>
        {entry.signIn ? <p className="mem-row__sub">{entry.signIn}</p> : null}
      </div>
      <div className="mem-row__actions">{entry.actions}</div>
    </li>
  );
}

const SKELETON_ROWS = 3;

/** Placeholder for the roster: the same grid as a real row, a bar for each line of text. */
function RosterSkeleton() {
  return (
    <ul className="mem-list mem-list--loading" aria-busy="true" aria-label="Loading members">
      {Array.from({ length: SKELETON_ROWS }, (_, i) => {
        const delay = { animationDelay: `${i * -150}ms` };
        return (
          <li key={i} className="mem-row" aria-hidden="true">
            <div className="mem-row__who">
              <p><span className="skel mem-skel" style={{ width: '46%', ...delay }} /></p>
              <p><span className="skel mem-skel mem-skel--sub" style={{ width: '70%', ...delay }} /></p>
            </div>
            <div className="mem-row__role">
              <p><span className="skel mem-skel" style={{ width: '56%', ...delay }} /></p>
            </div>
            <div className="mem-row__access">
              <p><span className="skel mem-skel" style={{ width: '78%', ...delay }} /></p>
            </div>
            <div className="mem-row__actions" />
          </li>
        );
      })}
    </ul>
  );
}

function RowAction({
  label,
  onClick,
  tone = 'default',
  disabled,
}: {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`mem-act${tone === 'primary' ? ' mem-act--primary' : ''}${tone === 'danger' ? ' mem-act--danger' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

interface SwitchItem {
  key: string;
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}

/** Full-width switch rows: the words on the left, the switch on the right. */
function SwitchList({ label, items }: { label: string; items: SwitchItem[] }) {
  return (
    <div className="admin-permission-toggles" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`admin-permission-toggle${item.on ? ' is-on' : ''}`}
          aria-pressed={item.on}
          onClick={item.onToggle}
        >
          <span className="admin-permission-toggle__copy">
            <span className="admin-permission-toggle__label">{item.label}</span>
            <span className="admin-permission-toggle__hint">{item.hint}</span>
          </span>
          <span className="admin-permission-toggle__switch" aria-hidden="true">
            <span className="admin-permission-toggle__knob" />
          </span>
        </button>
      ))}
    </div>
  );
}

/** Account switches: on unless explicitly turned off. */
function SignInToggleList({
  permissions,
  onToggle,
}: {
  permissions: AdminPermissions;
  onToggle: (key: SignInPermissionKey) => void;
}) {
  return (
    <SwitchList
      label="Sign-in"
      items={SIGN_IN_PERMISSION_KEYS.map((key) => {
        const on = signInOn(permissions, key);
        return {
          key,
          label: SIGN_IN_PERMISSION_LABELS[key],
          hint: on ? SIGN_IN_PERMISSION_HINTS[key] : 'Off. This person cannot do this',
          on,
          onToggle: () => onToggle(key),
        };
      })}
    />
  );
}

function PermissionToggleList({
  permissions,
  onToggle,
}: {
  permissions: AdminPermissions;
  onToggle: (key: DashboardPermissionKey) => void;
}) {
  return (
    <SwitchList
      label="Permissions"
      items={DASHBOARD_PERMISSION_KEYS.map((key) => {
        const on = Boolean(permissions[key]);
        return {
          key,
          label: DASHBOARD_PERMISSION_LABELS[key],
          hint: on ? 'Can open this page' : 'Cannot open this page',
          on,
          onToggle: () => onToggle(key),
        };
      })}
    />
  );
}

const DRAWER_EXIT_MS = 200;

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
 * Superadmin-only roster: pending requests, unused invites, active members and removed
 * records as one ruled list, filtered by the ledger above it.
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
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), 5000);
    return () => window.clearTimeout(timer);
  }, [note]);
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    body: string;
    label: string;
    action: () => void;
  } | null>(null);
  const [stage, setStage] = useState<'all' | RosterKind>('all');
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // The first rows fade in over the skeleton; rows that mount later (filtering) do not
  const [arriving, setArriving] = useState(true);
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => setArriving(false), 400);
    return () => window.clearTimeout(timer);
  }, [loaded]);
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
    void refresh()
      .catch(() => {
        setLoadFailed(true);
        setError('Could not load members or invites.');
      })
      .finally(() => setLoaded(true));
  }, [user, refresh]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 160);
    return () => window.clearTimeout(t);
  }, [query]);

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
    if (noSignInMethod(invitePerms)) {
      setError('Keep at least one sign-in method on for this invite.');
      return;
    }
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

  const toggleStage = (next: RosterKind) => setStage((prev) => (prev === next ? 'all' : next));
  const ledgerRows = (
    [
      ['active', 'Active', active.length, 'can sign in'],
      ['invited', 'Invited', invites.length, 'link not used yet'],
      ['pending', 'Pending approval', pending.length, 'waiting on you'],
      ['removed', 'Removed', removed.length, 'access ended'],
    ] as const
  ).map(([kind, label, value, hint]) => ({
    label,
    value,
    note: hint,
    active: stage === kind,
    onSelect: () => toggleStage(kind),
  }));
  const filtersOn = Boolean(debouncedQuery || roleFilter !== 'all' || stage !== 'all');
  const showKind = (kind: RosterKind) => (stage === 'all' ? kind !== 'removed' : stage === kind);

  const entries: RosterEntry[] = [];
  if (showKind('pending')) {
    for (const account of filteredPending) {
      entries.push({
        key: `pending-${account.uid}`,
        kind: 'pending',
        name: account.fullName || 'Unnamed',
        email: account.email,
        role: account.requestedRole || 'admin',
        access: 'Set when approved',
        signIn: null,
        status: 'Waiting for approval',
        isSelf: false,
        actions: canManage ? (
          <>
            <RowAction
              label="Approve"
              tone="primary"
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
            <RowAction
              label="Reject"
              tone="danger"
              disabled={busy}
              onClick={() =>
                setPendingConfirm({
                  title: `Reject ${account.email}?`,
                  body: 'Their pending profile is deleted. They can request access again with the access code.',
                  label: 'Reject request',
                  action: () =>
                    void run(() => rejectPendingAdmin(account.uid), `Rejected ${account.email}.`),
                })
              }
            />
          </>
        ) : null,
      });
    }
  }
  if (showKind('invited')) {
    for (const invite of filteredInvites) {
      const summary = accessSummary(invite.role, invite.permissions);
      entries.push({
        key: `invited-${invite.id}`,
        kind: 'invited',
        name: invite.email,
        email: invite.email,
        role: invite.role,
        access: summary.access,
        signIn: summary.signIn,
        status: 'Invite not used yet',
        isSelf: false,
        actions: canManage ? (
          <>
            <RowAction
              label="Copy link"
              tone="primary"
              disabled={busy}
              onClick={() => {
                const link = inviteSignupUrl(invite.id);
                void navigator.clipboard.writeText(link).then(
                  () => setNote('Invite link copied.'),
                  () => setError('Could not copy link. Copy from the address bar after opening.'),
                );
              }}
            />
            <RowAction
              label="Revoke"
              tone="danger"
              disabled={busy}
              onClick={() =>
                setPendingConfirm({
                  title: `Revoke invite for ${invite.email}?`,
                  body: 'The signup link stops working immediately. You can create a new invite later.',
                  label: 'Revoke invite',
                  action: () =>
                    void run(() => revokeInvite(invite.id), `Revoked invite for ${invite.email}.`),
                })
              }
            />
          </>
        ) : null,
      });
    }
  }
  if (showKind('active')) {
    for (const member of filteredActive) {
      const summary = accessSummary(member.role, member.permissions);
      entries.push({
        key: `active-${member.uid}`,
        kind: 'active',
        name: member.fullName || 'Unnamed',
        email: member.email,
        role: member.role || 'admin',
        access: summary.access,
        signIn: summary.signIn,
        status: null,
        isSelf: member.uid === user.uid,
        actions: canManage ? (
          <>
            <RowAction label="Edit" tone="primary" disabled={busy} onClick={() => openEditPanel(member)} />
            {member.uid !== user.uid ? (
              <RowAction
                label="Remove"
                tone="danger"
                disabled={busy}
                onClick={() =>
                  setPendingConfirm({
                    title: `Remove access for ${member.email}?`,
                    body: 'They lose access to the workspace right away. This is a soft removal: the record is kept under Removed and can be deleted permanently later.',
                    label: 'Remove access',
                    action: () =>
                      void run(
                        () => removeActiveMember({ uid: member.uid, removedBy: user.uid }),
                        `Removed ${member.email}.`,
                      ),
                  })
                }
              />
            ) : null}
          </>
        ) : null,
      });
    }
  }
  if (showKind('removed')) {
    for (const member of filteredRemoved) {
      entries.push({
        key: `removed-${member.uid}`,
        kind: 'removed',
        name: member.fullName || 'Unnamed',
        email: member.email,
        role: member.role || 'admin',
        access: 'No access',
        signIn: null,
        status: `Removed ${formatRemovedAt(member.removedAt)}`,
        isSelf: false,
        actions: canManage ? (
          <RowAction label="Delete forever" tone="danger" disabled={busy} onClick={() => openDeletePanel(member)} />
        ) : null,
      });
    }
  }
  return (
    <section className="dash-page members-page" aria-labelledby="admin-members-title">
      <div className="dash-page__header">
        <PageHeading id="admin-members-title" title="Members" sub={"Who can use this workspace. Invite teammates, approve access requests, and change roles and page permissions."} />
        <div className="dash-page__tools">
          {canManage ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => void openAccessCodePanel()}>
                Access code
              </Button>
              <Button variant="primary" size="sm" onClick={openInvitePanel}>
                Add member
              </Button>
            </>
          ) : (
            <p className="members-page__readonly-hint">View only. Role changes need a superadmin</p>
          )}
        </div>
      </div>

      <CountLedger
        label="Members"
        total={active.length}
        totalNote="with access"
        ariaLabel="Members by status"
        loading={!loaded}
        empty={loadFailed}
        rows={ledgerRows}
      />

      <div className="inq-toolbar" role="search">
        <div className="inq-toolbar__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search name or email"
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="inq-toolbar__sort">
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
        <div className="inq-toolbar__sort">
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

      <div className="inq-notes">
        {note ? (
          <p role="status" className="inq-note">
            {note}
          </p>
        ) : null}
        {error ? (
          <p className="inq-note inq-note--error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ConfirmDeleteModal
        open={pendingConfirm !== null}
        title={pendingConfirm?.title ?? ''}
        body={pendingConfirm?.body ?? ''}
        confirmLabel={pendingConfirm?.label ?? 'Confirm'}
        busy={busy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          const next = pendingConfirm;
          setPendingConfirm(null);
          next?.action();
        }}
      />

      {!loaded ? (
        <RosterSkeleton />
      ) : entries.length === 0 ? (
        <div className="inq-state">
          <p className="admin-empty__title">
            {loadFailed ? 'Could not load members' : filtersOn ? 'No one matches' : 'No members yet'}
          </p>
          <p className="admin-empty__body">
            {loadFailed
              ? 'Check your connection and reload the page.'
              : filtersOn
                ? 'Change the search, role or status to see more people.'
                : 'Add a member to create an invite link, or share the access code so people can request access.'}
          </p>
        </div>
      ) : (
        <ul className={`mem-list${arriving ? ' is-arriving' : ''}`} aria-label="Members">
          {entries.map((entry) => (
            <RosterRow key={entry.key} entry={entry} />
          ))}
        </ul>
      )}

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
          <div className="admin-member-modal__field">
            <span className="admin-member-modal__label">Sign-in</span>
            <p className="admin-member-modal__hint">
              {noSignInMethod(invitePerms)
                ? 'Keep at least one way to sign in on.'
                : 'On unless you turn it off. Superadmins are never blocked.'}
            </p>
            <SignInToggleList
              permissions={invitePerms}
              onToggle={(key) =>
                setInvitePerms((prev) => ({ ...prev, [key]: !signInOn(prev, key) }))
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
                disabled={busy || !editingMember || noSignInMethod(editPerms)}
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
          <div className="admin-member-modal__field">
            <span className="admin-member-modal__label">Sign-in</span>
            <p className="admin-member-modal__hint">
              {noSignInMethod(editPerms)
                ? 'Keep at least one way to sign in on, or this person is locked out.'
                : 'On unless you turn it off. Takes effect at their next sign-in.'}
            </p>
            <SignInToggleList
              permissions={editPerms}
              onToggle={(key) =>
                setEditPerms((prev) => ({ ...prev, [key]: !signInOn(prev, key) }))
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
