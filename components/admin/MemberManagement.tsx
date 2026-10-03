'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  rejectPendingAdmin,
  removeActiveMember,
  updateActiveMember,
  type AdminMemberRow,
  type InviteRow,
} from '@/lib/firebase/adminManage';

function PermissionChecks({
  value,
  onChange,
}: {
  value: AdminPermissions;
  onChange: (next: AdminPermissions) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {DASHBOARD_PERMISSION_KEYS.map((key) => (
        <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={Boolean(value[key])}
            onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
          />
          {DASHBOARD_PERMISSION_LABELS[key as DashboardPermissionKey]}
        </label>
      ))}
    </div>
  );
}

/**
 * Superadmin-only: pending approvals, active members, invite create/list.
 */
export function MemberManagement() {
  const { user, isSuperadmin } = useAuth();
  const [pending, setPending] = useState<AdminMemberRow[]>([]);
  const [active, setActive] = useState<AdminMemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [approveRole, setApproveRole] = useState<Record<string, AdminRole>>({});
  const [approvePerms, setApprovePerms] = useState<Record<string, AdminPermissions>>({});
  const [editRole, setEditRole] = useState<Record<string, AdminRole>>({});
  const [editPerms, setEditPerms] = useState<Record<string, AdminPermissions>>({});

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('admin');
  const [invitePerms, setInvitePerms] = useState<AdminPermissions>(emptyPermissions());
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [p, a, i] = await Promise.all([
      listAdminsByStatus('pending'),
      listAdminsByStatus('active'),
      listInvites(),
    ]);
    setPending(p);
    setActive(a);
    setInvites(i);
    setApproveRole((prev) => {
      const next = { ...prev };
      for (const row of p) if (!next[row.uid]) next[row.uid] = 'admin';
      return next;
    });
    setApprovePerms((prev) => {
      const next = { ...prev };
      for (const row of p) if (!next[row.uid]) next[row.uid] = emptyPermissions();
      return next;
    });
    setEditRole((prev) => {
      const next = { ...prev };
      for (const row of a) next[row.uid] = row.role === 'superadmin' ? 'superadmin' : 'admin';
      return next;
    });
    setEditPerms((prev) => {
      const next = { ...prev };
      for (const row of a) next[row.uid] = { ...emptyPermissions(), ...row.permissions };
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isSuperadmin) return;
    void refresh().catch(() => setError('Could not load members or invites.'));
  }, [isSuperadmin, refresh]);

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

  return (
    <section className="admin-section" aria-labelledby="admin-members-title">
      <h2 id="admin-members-title" className="admin-section__title admin-section__title--h2">
        Members and invites
      </h2>
      <p className="admin-section__lead">
        Superadmin tools. Invite links are copied and sent manually — no email is sent from the
        app. Rejecting a pending account deletes their profile document; disabling their Auth login
        still needs a Cloud Function.
      </p>

      {error ? (
        <p className="na-error" role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p role="status" style={{ color: 'var(--emerald-500)', fontSize: 14 }}>
          {note}
        </p>
      ) : null}

      <div className="admin-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Pending approvals</h3>
        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-caption)', fontSize: 14 }}>No pending requests.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pending.map((row) => (
              <li
                key={row.uid}
                style={{
                  borderTop: '1px solid var(--border-subtle, rgba(0,0,0,.08))',
                  paddingTop: 16,
                }}
              >
                <div style={{ fontWeight: 600 }}>{row.fullName || 'Unnamed'}</div>
                <div style={{ fontSize: 14, color: 'var(--text-caption)' }}>{row.email}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  Requested role (hint only): {row.requestedRole || '—'}
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 14 }}>
                    Assign role{' '}
                    <select
                      value={approveRole[row.uid] || 'admin'}
                      onChange={(event) =>
                        setApproveRole((prev) => ({
                          ...prev,
                          [row.uid]: event.target.value as AdminRole,
                        }))
                      }
                    >
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  </label>
                  <PermissionChecks
                    value={approvePerms[row.uid] || emptyPermissions()}
                    onChange={(next) => setApprovePerms((prev) => ({ ...prev, [row.uid]: next }))}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            approvePendingAdmin({
                              uid: row.uid,
                              role: approveRole[row.uid] || 'admin',
                              permissions: approvePerms[row.uid] || emptyPermissions(),
                              approvedBy: user.uid,
                            }),
                          `Approved ${row.email}.`,
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void run(() => rejectPendingAdmin(row.uid), `Rejected ${row.email}.`)
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Active members</h3>
        {active.length === 0 ? (
          <p style={{ color: 'var(--text-caption)', fontSize: 14 }}>No active members.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {active.map((row) => (
              <li
                key={row.uid}
                style={{
                  borderTop: '1px solid var(--border-subtle, rgba(0,0,0,.08))',
                  paddingTop: 16,
                }}
              >
                <div style={{ fontWeight: 600 }}>{row.fullName || 'Unnamed'}</div>
                <div style={{ fontSize: 14, color: 'var(--text-caption)' }}>{row.email}</div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 14 }}>
                    Role{' '}
                    <select
                      value={editRole[row.uid] || 'admin'}
                      onChange={(event) =>
                        setEditRole((prev) => ({
                          ...prev,
                          [row.uid]: event.target.value as AdminRole,
                        }))
                      }
                      disabled={row.uid === user.uid}
                    >
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  </label>
                  <PermissionChecks
                    value={editPerms[row.uid] || emptyPermissions()}
                    onChange={(next) => setEditPerms((prev) => ({ ...prev, [row.uid]: next }))}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            updateActiveMember({
                              uid: row.uid,
                              role: editRole[row.uid] || 'admin',
                              permissions: editPerms[row.uid] || emptyPermissions(),
                            }),
                          `Updated ${row.email}.`,
                        )
                      }
                    >
                      Save changes
                    </Button>
                    {row.uid !== user.uid ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Remove access for ${row.email}? This is a soft removal (status: removed).`,
                            )
                          ) {
                            return;
                          }
                          void run(
                            () => removeActiveMember({ uid: row.uid, removedBy: user.uid }),
                            `Removed ${row.email}.`,
                          );
                        }}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Create invite</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
          <Input
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            required
          />
          <label style={{ fontSize: 14 }}>
            Role{' '}
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as AdminRole)}
            >
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
          </label>
          <PermissionChecks value={invitePerms} onChange={setInvitePerms} />
          <Button
            variant="primary"
            disabled={busy || !inviteEmail.trim()}
            onClick={() =>
              void run(async () => {
                const created = await createInvite({
                  email: inviteEmail,
                  role: inviteRole,
                  permissions: invitePerms,
                  createdBy: user.uid,
                });
                const link = inviteSignupUrl(created.id);
                setLastInviteLink(link);
                setInviteEmail('');
                setInvitePerms(emptyPermissions());
                try {
                  await navigator.clipboard.writeText(link);
                  setNote('Invite created. Signup link copied to clipboard.');
                } catch {
                  setNote('Invite created. Copy the link below.');
                }
              }, 'Invite created.')
            }
          >
            Create invite link
          </Button>
          {lastInviteLink ? (
            <p style={{ fontSize: 13, wordBreak: 'break-all', margin: 0 }}>
              Link: <code>{lastInviteLink}</code>
            </p>
          ) : null}
        </div>
      </div>

      <div className="admin-panel">
        <h3 style={{ marginTop: 0 }}>Invites</h3>
        {invites.length === 0 ? (
          <p style={{ color: 'var(--text-caption)', fontSize: 14 }}>No invites yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {invites.map((row) => (
              <li
                key={row.id}
                style={{
                  padding: '12px 0',
                  borderTop: '1px solid var(--border-subtle, rgba(0,0,0,.08))',
                  fontSize: 14,
                }}
              >
                <div style={{ fontWeight: 600 }}>{row.email}</div>
                <div style={{ color: 'var(--text-caption)' }}>
                  {row.role} · {row.used ? 'Used' : 'Outstanding'}
                </div>
                {!row.used ? (
                  <button
                    type="button"
                    className="admin-topbar__logout"
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      const link = inviteSignupUrl(row.id);
                      void navigator.clipboard.writeText(link).then(
                        () => setNote('Invite link copied.'),
                        () => setLastInviteLink(link),
                      );
                    }}
                  >
                    Copy signup link
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
