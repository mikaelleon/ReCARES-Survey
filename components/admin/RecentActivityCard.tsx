'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserMinus, UserPlus, UserRoundPen, UserRoundSearch } from 'lucide-react';
import {
  buildAdminActivityFeed,
  type AdminActivityItem,
  type AdminActivityKind,
} from '@/lib/admin/recentActivity';
import { listAdminsByStatus } from '@/lib/firebase/adminManage';
import { useAuth } from '@/lib/auth/AuthProvider';

function formatRelative(ms: number, now = Date.now()): string {
  if (!Number.isFinite(ms)) return '—';
  const diffSec = Math.round((now - ms) / 1000);
  if (diffSec < 60) return 'Just now';
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function ActivityIcon({ kind }: { kind: AdminActivityKind }) {
  const props = { size: 14, strokeWidth: 2.2, 'aria-hidden': true as const };
  if (kind === 'access_requested') return <UserRoundSearch {...props} />;
  if (kind === 'account_updated') return <UserRoundPen {...props} />;
  if (kind === 'account_deleted') return <UserMinus {...props} />;
  return <UserPlus {...props} />;
}

/**
 * Superadmin rail card — account lifecycle events from admins collection.
 */
export function RecentActivityCard({ limit = 5 }: { limit?: number }) {
  const { isSuperadmin } = useAuth();
  const [items, setItems] = useState<AdminActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isSuperadmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    void Promise.all([
      listAdminsByStatus('pending'),
      listAdminsByStatus('active'),
      listAdminsByStatus('removed'),
    ])
      .then(([pending, active, removed]) => {
        if (cancelled) return;
        setItems(buildAdminActivityFeed([...pending, ...active, ...removed], limit));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setItems([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperadmin, limit]);

  if (!isSuperadmin) return null;

  return (
    <article className="dash-activity" aria-labelledby="dash-activity-title">
      <header className="dash-activity__head">
        <h2 id="dash-activity-title" className="dash-activity__title">
          Recent Activity
        </h2>
        <Link href="/admin/members/" className="dash-activity__link">
          Members →
        </Link>
      </header>

      {loading ? (
        <div className="dash-stat--skeleton" style={{ minHeight: 96 }} aria-hidden="true" />
      ) : error ? (
        <p className="dash-activity__empty">Could not load account activity.</p>
      ) : items.length === 0 ? (
        <p className="dash-activity__empty">No account activity yet.</p>
      ) : (
        <ul className="dash-activity__list">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="dash-activity__item">
                <span className={`dash-activity__icon dash-activity__icon--${item.kind}`}>
                  <ActivityIcon kind={item.kind} />
                </span>
                <span className="dash-activity__meta">
                  <span className="dash-activity__label">{item.label}</span>
                  <span className="dash-activity__detail" title={item.detail}>
                    {item.detail}
                  </span>
                  <span className="dash-activity__time">{formatRelative(item.atMs)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
