'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { RESPONSE_QUESTION_OPTIONS } from '@/lib/admin/responseQuestions';
import {
  FINDING_STATUS_LABELS,
  FINDING_STATUSES,
  FINDING_TAG_LABELS,
  FINDING_TAGS,
  validateNoteInput,
  type FindingNoteInput,
  type FindingNoteRow,
  type FindingStatus,
  type FindingTag,
} from '@/lib/firebase/findingNotes';

const TAG_OPTIONS = FINDING_TAGS.map((t) => FINDING_TAG_LABELS[t]);
const STATUS_OPTIONS = FINDING_STATUSES.map((s) => FINDING_STATUS_LABELS[s]);
const QUESTION_OPTIONS = RESPONSE_QUESTION_OPTIONS.map((q) => q.title);

function tagFromLabel(label: string): FindingTag {
  const hit = FINDING_TAGS.find((t) => FINDING_TAG_LABELS[t] === label);
  return hit ?? 'theme';
}

function statusFromLabel(label: string): FindingStatus {
  const hit = FINDING_STATUSES.find((s) => FINDING_STATUS_LABELS[s] === label);
  return hit ?? 'draft';
}

function questionIdFromTitle(title: string): string {
  return RESPONSE_QUESTION_OPTIONS.find((q) => q.title === title)?.id ?? '';
}

function questionTitleFromId(id: string): string {
  return RESPONSE_QUESTION_OPTIONS.find((q) => q.id === id)?.title ?? '';
}

/**
 * Create / edit form for a finding note.
 */
export function FindingNoteForm({
  mode,
  initial,
  presetQuestionId,
  lockedFinal,
  busy,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial?: FindingNoteRow | null;
  presetQuestionId?: string | null;
  lockedFinal?: boolean;
  busy: boolean;
  onSubmit: (input: FindingNoteInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [tag, setTag] = useState<FindingTag>(initial?.tag ?? 'theme');
  const [status, setStatus] = useState<FindingStatus>(initial?.status ?? 'draft');
  const [questionId, setQuestionId] = useState(
    initial?.questionId || presetQuestionId || RESPONSE_QUESTION_OPTIONS[0]?.id || '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const unlockOnly = Boolean(lockedFinal);

  useEffect(() => {
    setTitle(initial?.title ?? '');
    setBody(initial?.body ?? '');
    setTag(initial?.tag ?? 'theme');
    setStatus(initial?.status ?? 'draft');
    setQuestionId(
      initial?.questionId || presetQuestionId || RESPONSE_QUESTION_OPTIONS[0]?.id || '',
    );
    setFieldErrors({});
    setFormError(null);
  }, [initial, presetQuestionId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const input: FindingNoteInput = unlockOnly && initial
      ? {
          title: initial.title,
          body: initial.body,
          tag: initial.tag,
          questionId: initial.questionId,
          status: 'draft',
        }
      : { title, body, tag, status, questionId };
    const errors = validateNoteInput(input, {
      requireDraftStatus: mode === 'create',
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors as Record<string, string>);
      setFormError(null);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    try {
      await onSubmit(input);
    } catch (err) {
      setFormError(err instanceof Error && err.message ? err.message : 'Could not save note.');
    }
  };

  return (
    <form className="finding-note-form" onSubmit={(e) => void handleSubmit(e)}>
      {unlockOnly ? (
        <p className="finding-note-form__banner" role="status">
          This note is <strong>final</strong>. Revert to draft to edit title, body, tag, or question.
        </p>
      ) : null}
      <Input
        id="finding-title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title ?? null}
        disabled={busy || unlockOnly}
        required
      />
      <Textarea
        id="finding-body"
        label="Finding"
        value={body}
        rows={6}
        onChange={(e) => setBody(e.target.value)}
        error={fieldErrors.body ?? null}
        disabled={busy || unlockOnly}
        helperText="10–2000 characters. Link the note to one Responses question."
      />
      <Select
        id="finding-tag"
        label="Tag"
        options={TAG_OPTIONS}
        value={FINDING_TAG_LABELS[tag]}
        onChange={(e) => setTag(tagFromLabel(e.target.value))}
        error={fieldErrors.tag ?? null}
        disabled={busy || unlockOnly}
      />
      <Select
        id="finding-question"
        label="Linked question"
        options={QUESTION_OPTIONS}
        value={questionTitleFromId(questionId)}
        onChange={(e) => setQuestionId(questionIdFromTitle(e.target.value))}
        error={fieldErrors.questionId ?? null}
        disabled={busy || unlockOnly}
      />
      <Select
        id="finding-status"
        label="Status"
        options={unlockOnly ? [FINDING_STATUS_LABELS.draft] : STATUS_OPTIONS}
        value={unlockOnly ? FINDING_STATUS_LABELS.draft : FINDING_STATUS_LABELS[status]}
        onChange={(e) => setStatus(statusFromLabel(e.target.value))}
        error={fieldErrors.status ?? null}
        disabled={busy}
        helperText={
          mode === 'create'
            ? 'New notes start as draft.'
            : 'Final locks editing until you revert to draft.'
        }
      />
      {formError ? (
        <p className="na-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="finding-note-form__actions">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={busy} disabled={busy}>
          {mode === 'create' ? 'Create note' : unlockOnly ? 'Revert to draft' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
