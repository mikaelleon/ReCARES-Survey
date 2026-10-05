'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import type { InterviewInviteRow } from '@/lib/firebase/interviewManage';

function formatWhen(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Contact history for one interview opt-in — never joined to survey answers.
 */
export function InterviewNotesDrawer({
  row,
  busy,
  onClose,
  onAddNote,
}: {
  row: InterviewInviteRow | null;
  busy: boolean;
  onClose: () => void;
  onAddNote: (text: string) => void;
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    setText('');
  }, [row?.id]);

  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [row, onClose]);

  if (!row) return null;

  const notes = [...(row.notes ?? [])].sort((a, b) => b.at.localeCompare(a.at));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || busy) return;
    onAddNote(text.trim());
    setText('');
  };

  return (
    <AdminOverlayPortal>
      <div className="admin-drawer-root" role="presentation">
        <button type="button" className="admin-drawer__backdrop" aria-label="Close notes" onClick={onClose} />
        <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="interview-notes-title">
          <header className="admin-drawer__head">
            <div>
              <h2 id="interview-notes-title" className="admin-drawer__title">
                Contact notes
              </h2>
              <p className="admin-drawer__sub">{row.email}</p>
            </div>
            <button type="button" className="admin-drawer__close" onClick={onClose}>
              Close
            </button>
          </header>
          <div className="admin-drawer__body">
            <p className="admin-drawer__hint">
              These notes are for the research team only. They are not linked to the anonymous survey
              answers.
            </p>
            <form className="inquiry-note-form" onSubmit={handleSubmit}>
              <Textarea
                id={`interview-note-${row.id}`}
                name="note"
                label="Add a note"
                value={text}
                rows={4}
                disabled={busy}
                onChange={(e) => setText(e.target.value)}
              />
              <Button variant="primary" type="submit" disabled={busy || !text.trim()}>
                Save note
              </Button>
            </form>
            {notes.length === 0 ? (
              <p className="admin-drawer__hint">No notes yet.</p>
            ) : (
              <ol className="interview-notes-list">
                {notes.map((n) => (
                  <li key={n.id}>
                    <p className="interview-notes-list__meta">
                      {n.byName} · {formatWhen(n.at)}
                    </p>
                    <p className="interview-notes-list__text">{n.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </AdminOverlayPortal>
  );
}
