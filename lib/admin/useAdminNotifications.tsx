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
import { effectiveSurveyStatus } from '@/survey/instrument';

const SEEN_KEY = 'recares-admin-bell-seen';

/** Stable clock for synthetic status rows so remounts do not re-bump unread. */
const SYNTHETIC_AT_MS = 1;

export interface AdminNotificationItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  /** When the underlying event happened. 0 / 1 mean "no real timestamp". */
  atMs: number;
}

export interface AdminNotificationView extends AdminNotificationItem {
  read: boolean;
}

interface AdminNotificationsValue {
  items: AdminNotificationView[];
  unreadCount: number;
  /** Mark one notification read. */
  markRead: (id: string) => void;
  /** Put a notification back to unread. */
  markUnread: (id: string) => void;
  /** Mark everything currently listed as read. */
  markAllRead: () => void;
  /** @deprecated Use markAllRead. */
  markSeen: () => void;
}

/** Per-user read state, kept in this browser. */
interface ReadState {
  /** Everything at or before this time counts as read. */
  baselineMs: number;
  /** id -> event time that was read. A newer event on the same id is unread again. */
  read: Record<string, number>;
  /** ids the user explicitly put back to unread (wins over everything). */
  unread: Record<string, true>;
}

const EMPTY_STATE: ReadState = { baselineMs: 0, read: {}, unread: {} };

const AdminNotificationsContext = createContext<AdminNotificationsValue | null>(null);

function seenStorageKey(uid: string): string {
  return `${SEEN_KEY}:${uid}`;
}

function stateStorageKey(uid: string): string {
  return `recares-admin-notif-state:${uid}`;
}

function readState(uid: string): ReadState {
  try {
    const raw = localStorage.getItem(stateStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReadState>;
      return {
        baselineMs: Number.isFinite(parsed.baselineMs) ? Number(parsed.baselineMs) : 0,
        read: parsed.read && typeof parsed.read === 'object' ? parsed.read : {},
        unread: parsed.unread && typeof parsed.unread === 'object' ? parsed.unread : {},
      };
    }
    // Migrate the old "last opened" timestamp so existing users do not see everything as new.
    const legacy = localStorage.getItem(seenStorageKey(uid)) ?? localStorage.getItem(SEEN_KEY);
    const n = legacy != null ? Number(legacy) : 0;
    return { ...EMPTY_STATE, baselineMs: Number.isFinite(n) ? n : 0 };
  } catch {
    return { ...EMPTY_STATE };
  }
}

function writeState(uid: string, state: ReadState): void {
  try {
    // Keep the map from growing forever: only the newest 300 ids.
    const entries = Object.entries(state.read);
    const trimmed =
      entries.length > 300
        ? Object.fromEntries(entries.sort((a, b) => b[1] - a[1]).slice(0, 300))
        : state.read;
    localStorage.setItem(stateStorageKey(uid), JSON.stringify({ ...state, read: trimmed }));
  } catch {
    /* ignore quota / private mode */
  }
}

function isRead(item: AdminNotificationItem, state: ReadState): boolean {
  if (state.unread[item.id]) return false;
  const readAt = state.read[item.id];
  if (readAt != null && readAt >= item.atMs) return true;
  return item.atMs <= state.baselineMs;
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
  const { user, isSuperadmin, can, canTeamOps } = useAuth();
  const role = user?.role ?? null;
  const [rawItems, setItems] = useState<AdminNotificationItem[]>([]);
  const [readStateValue, setReadStateValue] = useState<ReadState>(EMPTY_STATE);

  useEffect(() => {
    if (!user) {
      setReadStateValue(EMPTY_STATE);
      return;
    }
    setReadStateValue(readState(user.uid));
  }, [user]);

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

    if (canTeamOps) {
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
    }

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
          // Stable so opening the bell (and later sessions) can clear the badge.
          atMs: SYNTHETIC_AT_MS,
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
        const raw = snap.data() as Record<string, unknown> | undefined;
        const config = mapSurveyConfig(raw);
        const effective = effectiveSurveyStatus(config);
        if (effective === 'open') {
          buckets.survey = [];
        } else {
          const statusAt = createdMs(raw ?? {}, ['updatedAt']);
          buckets.survey = [
            {
              id: `survey-window-${config.status}`,
              title: effective === 'paused' ? 'Survey paused' : 'Survey closed',
              detail: 'Residents cannot submit until a superadmin reopens it.',
              href: isSuperadmin ? '/admin/survey/' : '/admin/dashboard/',
              atMs: statusAt > 0 ? statusAt : SYNTHETIC_AT_MS,
            },
          ];
        }
        publish();
      }),
    );

    return () => {
      for (const stop of unsubs) stop();
    };
  }, [user, isSuperadmin, can, canTeamOps, role]);

  const items = useMemo<AdminNotificationView[]>(
    () => rawItems.map((item) => ({ ...item, read: isRead(item, readStateValue) })),
    [rawItems, readStateValue],
  );

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const update = useCallback(
    (change: (prev: ReadState) => ReadState) => {
      if (!user) return;
      setReadStateValue((prev) => {
        const next = change(prev);
        writeState(user.uid, next);
        return next;
      });
    },
    [user],
  );

  const markRead = useCallback(
    (id: string) => {
      const item = rawItems.find((row) => row.id === id);
      update((prev) => {
        const unread = { ...prev.unread };
        delete unread[id];
        return {
          ...prev,
          unread,
          read: { ...prev.read, [id]: Math.max(item?.atMs ?? 0, Date.now()) },
        };
      });
    },
    [rawItems, update],
  );

  const markUnread = useCallback(
    (id: string) => {
      update((prev) => ({ ...prev, unread: { ...prev.unread, [id]: true } }));
    },
    [update],
  );

  const markAllRead = useCallback(() => {
    update((prev) => ({ baselineMs: Date.now(), read: prev.read, unread: {} }));
  }, [update]);

  const value = useMemo(
    () => ({ items, unreadCount, markRead, markUnread, markAllRead, markSeen: markAllRead }),
    [items, unreadCount, markRead, markUnread, markAllRead],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>{children}</AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications(): AdminNotificationsValue {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    return {
      items: [],
      unreadCount: 0,
      markRead: () => undefined,
      markUnread: () => undefined,
      markAllRead: () => undefined,
      markSeen: () => undefined,
    };
  }
  return ctx;
}
