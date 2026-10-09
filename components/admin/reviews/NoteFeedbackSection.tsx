'use client';

import { ReviewInbox } from '@/components/admin/reviews/ReviewInbox';

/**
 * Adviser thread embedded on a Findings Log note.
 */
export function NoteFeedbackSection({
  noteId,
  noteTitle,
}: {
  noteId: string;
  noteTitle?: string;
}) {
  return (
    <ReviewInbox
      compact
      fixedTarget={{ targetType: 'note', targetId: noteId, label: noteTitle || 'this note' }}
    />
  );
}
