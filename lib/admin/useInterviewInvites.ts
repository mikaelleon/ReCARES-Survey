'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  deleteInterviewInvite,
  listInterviewInvites,
  updateInterviewContactStatus,
  type InterviewInviteRow,
} from '@/lib/firebase/interviewManage';
import type { InterviewContactStatus } from '@/survey/schema';

/**
 * Shared interviewInterest loader + mutations for KPIs, calendar, and Kanban.
 */
export function useInterviewInvites() {
  const [rows, setRows] = useState<InterviewInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await listInterviewInvites();
    setRows(next);
  }, []);

  useEffect(() => {
    setLoading(true);
    void refresh()
      .catch(() => setError('Could not load interview invites from Firestore.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  const run = useCallback(
    async (id: string, action: () => Promise<void>, success: string) => {
      setBusyId(id);
      setError(null);
      setNote(null);
      try {
        await action();
        await refresh();
        setNote(success);
      } catch {
        setError('That action failed. Check your connection and permissions.');
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  const markContacted = useCallback(
    (id: string, email: string) =>
      run(
        id,
        () => updateInterviewContactStatus(id, 'pending_confirmation' as InterviewContactStatus),
        `Marked ${email} as contacted.`,
      ),
    [run],
  );

  const confirm = useCallback(
    (id: string, email: string) =>
      run(id, () => updateInterviewContactStatus(id, 'confirmed'), `Confirmed interview for ${email}.`),
    [run],
  );

  const withdraw = useCallback(
    (id: string, email: string) =>
      run(id, () => deleteInterviewInvite(id), `Withdrew invite for ${email}.`),
    [run],
  );

  return {
    rows,
    loading,
    error,
    note,
    busyId,
    markContacted,
    confirm,
    withdraw,
  };
}
