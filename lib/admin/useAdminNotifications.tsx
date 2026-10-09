'use client';

import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { canResolveThread } from '@/lib/admin/access';
import { getFirestoreDb } from '@/lib/firebase/config';
import { messageForFirestoreWriteError } from '@/lib/firebase/writeErrors';
import { mapSurveyConfig } from '@/lib/firebase/surveyConfig';
import { surveyAcceptsResponses } from '@/survey/instrument';

const SEEN_KEY = 'recares-admin-bell-seen';

export interface AdminNotificationItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  atMs: number;
}

interface AdminNotificationsValue {
  items: AdminNotificationItem[];
  unreadCount: number;
  markSeen: () => void;
}

const AdminNotificationsContext = createContext<AdminNotificationsValue | null>(null);

function readSeenMs(): number {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function createdMs(data: Record<string, unknown>, fallbackKeys: string[]): number {
  for (const key of ['createdAt', 'submittedAt', ...fallbackKeys]) {
    const value = data[key];
    if (value && typeof value === 'object' && 'toMillis' in value) {
      try {
        return (value as { toMillis: () => number }).toMillis();
      } catch {
        /* continue */
      }
    }
    if (typeof value === 'string') {
      const ms = Date.parse(value);
      if (Number.isFinite(ms)) return ms;
    }
  }
  return 0;
}

/**
 * Live inbox for the admin bell: new inquiries, uncontacted interviews, pending members,
 * a survey-window notice, and review threads that need this role's attention.
 */
export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isSuperadmin, can } = useAuth();
  const role = user?.role ?? null;
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [seenMs, setSeenMs] = useState(0);

  useEffect(() => {
    setSeenMs(readSeenMs());
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const db = getFirestoreDb();
    if (!db) return;

    const unsubs: Array<() => void> = [];
    const buckets: Record<string, AdminNotificationItem[]> = {
      inquiries: [],
      interviews: [],
      pending: [],
      survey: [],
      feedback: [],
    };

    const publish = () => {
      const rest = [
        ...buckets.inquiries,
        ...buckets.interviews,
        ...buckets.pending,
        ...buckets.survey,
      ].sort((a, b) => b.atMs - a.atMs);
      setItems([...buckets.feedback.slice(0, 40), ...rest.slice(0, 8)]);
    };

    unsubs.push(
      onSnapshot(collection(db, 'inquiries'), (snap) => {
        buckets.inquiries = snap.docs
          .map((item) => {
            const data = item.data() as Record<string, unknown>;
            const status = data.status === 'resolved' ? 'resolved' : data.status;
            if (status === 'resolved') return null;
            const email = typeof data.email === 'string' ? data.email : 'Inquiry';
            return {
              id: `inq-${item.id}`,
              title: status === 'in_progress' ? 'Inquiry in progress' : 'New inquiry',
              detail: email,
              href: '/admin/inquiries/',
              atMs: createdMs(data, []),
            } satisfies AdminNotificationItem;
          })
          .filter((row): row is AdminNotificationItem => Boolean(row));
        publish();
      }),
    );

    if (can('interviewInvites')) {
      unsubs.push(
        onSnapshot(collection(db, 'interviewInterest'), (snap) => {
          buckets.interviews = snap.docs
            .map((item) => {
              const data = item.data() as Record<string, unknown>;
              const status = data.contactStatus;
              if (status && status !== 'not_contacted') return null;
              const email = typeof data.email === 'string' ? data.email : 'Interview opt-in';
              return {
                id: `iv-${item.id}`,
                title: 'Interview not contacted',
                detail: email,
                href: '/admin/interviews/',
                atMs: createdMs(data, []),
              } satisfies AdminNotificationItem;
            })
            .filter((row): row is AdminNotificationItem => Boolean(row));
          publish();
        }),
      );
    }

    if (isSuperadmin) {
      unsubs.push(
        onSnapshot(query(collection(db, 'admins'), where('status', '==', 'pending')), (snap) => {
          buckets.pending = snap.docs.map((item) => {
            const data = item.data() as Record<string, unknown>;
            const name =
              (typeof data.fullName === 'string' && data.fullName) ||
              (typeof data.email === 'string' && data.email) ||
              'Pending member';
            return {
              id: `adm-${item.id}`,
              title: 'Access request',
              detail: String(name),
              href: '/admin/members/',
              atMs: createdMs(data, []),
            };
          });
          publish();
        }),
      );
    }

    const feedbackError = (error: unknown) => {
      buckets.feedback = [
        {
          id: 'review-error',
          title: 'Reviews unavailable',
          detail: messageForFirestoreWriteError(error, 'Could not load review alerts.', {
            resourceHint: 'adviserFeedback',
          }),
          href: '/admin/reviews/',
          atMs: Date.now(),
        },
      ];
      publish();
    };

    if (canResolveThread(role)) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'adviserFeedback'), where('status', '==', 'addressed')),
          (snap) => {
            buckets.feedback = snap.docs.flatMap((item) => {
              const data = item.data() as Record<string, unknown>;
              if (data.parentId != null) return [];
              const comment = typeof data.comment === 'string' ? data.comment : 'Review';
              return [
                {
                  id: `review-${item.id}`,
                  title: 'Review awaiting resolution',
                  detail: comment.slice(0, 80),
                  href: `/admin/reviews/?thread=${item.id}`,
                  atMs: createdMs(data, ['updatedAt']),
                } satisfies AdminNotificationItem,
              ];
            });
            publish();
          },
          feedbackError,
        ),
      );
    } else if (role === 'admin') {
      const uid = user.uid;
      let myNoteIds = new Set<string>();
      let fixRows: { noteId: string; item: AdminNotificationItem }[] = [];
      const publishProponent = () => {
        buckets.feedback = fixRows
          .filter((row) => myNoteIds.has(row.noteId))
          .map((row) => row.item);
        publish();
      };
      unsubs.push(
        onSnapshot(
          query(collection(db, 'findingNotes'), where('authorUid', '==', uid)),
          (snap) => {
            myNoteIds = new Set(snap.docs.map((item) => item.id));
            publishProponent();
          },
          feedbackError,
        ),
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'adviserFeedback'), where('severity', '==', 'required_fix')),
          (snap) => {
            fixRows = snap.docs.flatMap((item) => {
              const data = item.data() as Record<string, unknown>;
              if (data.parentId != null || data.status !== 'open' || data.targetType !== 'note') {
                return [];
              }
              const targetId = typeof data.targetId === 'string' ? data.targetId : '';
              if (!targetId) return [];
              const comment = typeof data.comment === 'string' ? data.comment : 'Required fix';
              return [
                {
                  noteId: targetId,
                  item: {
                    id: `review-${item.id}`,
                    title: 'Required fix on your note',
                    detail: comment.slice(0, 80),
                    href: `/admin/reviews/?thread=${item.id}`,
                    atMs: createdMs(data, ['updatedAt']),
                  },
                },
              ];
            });
            publishProponent();
          },
          feedbackError,
        ),
      );
    }

    unsubs.push(
      onSnapshot(doc(db, 'appConfig', 'survey'), (snap) => {
        const config = mapSurveyConfig(snap.data() as Record<string, unknown> | undefined);
        if (surveyAcceptsResponses(config.status)) {
          buckets.survey = [];
        } else {
          buckets.survey = [
            {
              id: 'survey-window',
              title: config.status === 'paused' ? 'Survey paused' : 'Survey closed',
              detail: 'Residents cannot submit until a superadmin reopens it.',
              href: isSuperadmin ? '/admin/survey/' : '/admin/dashboard/',
              atMs: Date.now(),
            },
          ];
        }
        publish();
      }),
    );

    return () => {
      for (const stop of unsubs) stop();
    };
  }, [user, isSuperadmin, can, role]);

  const unreadCount = useMemo(
    () =>
      items.filter(
        (item) => item.atMs > seenMs || item.id === 'survey-window' || item.id.startsWith('review-'),
      ).length,
    [items, seenMs],
  );

  const markSeen = useCallback(() => {
    const now = Date.now();
    setSeenMs(now);
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ items, unreadCount, markSeen }),
    [items, unreadCount, markSeen],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>{children}</AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications(): AdminNotificationsValue {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    return { items: [], unreadCount: 0, markSeen: () => undefined };
  }
  return ctx;
}
