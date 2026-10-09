'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { RESPONSE_QUESTION_OPTIONS, isKnownQuestionId } from '@/lib/admin/responseQuestions';
import {
  SEVERITY_LABELS,
  TARGET_LABELS,
  commentInputHasErrors,
  validateCommentInput,
  type CommentFieldErrors,
  type FeedbackSeverity,
  type FeedbackTargetType,
  type RootCommentInput,
} from '@/lib/firebase/adviserFeedback';
import styles from '@/components/admin/reviews/reviews.module.css';

const TARGET_OPTIONS = ['Note', 'Question', 'Instrument'];
const SEVERITY_OPTIONS = ['Suggestion', 'Required fix', 'Approved'];

function targetFromLabel(label: string): FeedbackTargetType {
  if (label === 'Question') return 'question';
  if (label === 'Instrument') return 'instrument';
  return 'note';
}

function severityFromLabel(label: string): FeedbackSeverity {
  if (label === 'Required fix') return 'required_fix';
  if (label === 'Approved') return 'approved';
  return 'suggestion';
}

export interface ReviewNoteOption {
  id: string;
  title: string;
}

/**
 * Root comment form (adviser) or a one-level reply box.
 */
export function CommentForm({
  mode,
  lockedTarget,
  notes,
  notesLoading = false,
  instrumentId,
  busy = false,
  submitLabel,
  onSubmit,
}: {
  mode: 'root' | 'reply';
  lockedTarget?: { targetType: FeedbackTargetType; targetId: string; label: string } | null;
  notes?: ReviewNoteOption[];
  notesLoading?: boolean;
  instrumentId?: string;
  busy?: boolean;
  submitLabel?: string;
  onSubmit: (input: RootCommentInput) => Promise<void>;
}) {
  const [targetType, setTargetType] = useState<FeedbackTargetType>(lockedTarget?.targetType ?? 'note');
  const [targetId, setTargetId] = useState(lockedTarget?.targetId ?? '');
  const [severityLabel, setSeverityLabel] = useState('Suggestion');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<CommentFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (lockedTarget) {
      setTargetType(lockedTarget.targetType);
      setTargetId(lockedTarget.targetId);
      return;
    }
    setTargetId((current) => {
      if (targetType === 'note') {
        const list = notes ?? [];
        if (list.some((note) => note.id === current)) return current;
        return list[0]?.id ?? '';
      }
      if (targetType === 'question') {
        if (isKnownQuestionId(current)) return current;
        return RESPONSE_QUESTION_OPTIONS[0]?.id ?? '';
      }
      return instrumentId || current;
    });
  }, [targetType, lockedTarget, notes, instrumentId]);

  const onFormSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextTargetType = lockedTarget?.targetType ?? targetType;
    const nextTargetId = lockedTarget?.targetId ?? targetId;
    const severity = severityFromLabel(severityLabel);
    const fieldErrors = validateCommentInput(
      {
        comment,
        targetType: mode === 'root' ? nextTargetType : undefined,
        targetId: mode === 'root' ? nextTargetId : undefined,
        severity: mode === 'root' ? severity : undefined,
      },
      {
        mode,
        noteIds: mode === 'root' && nextTargetType === 'note' ? (notes ?? []).map((note) => note.id) : undefined,
      },
    );
    setErrors(fieldErrors);
    setFormError(null);
    if (commentInputHasErrors(fieldErrors)) return;
    try {
      await onSubmit({
        targetType: nextTargetType,
        targetId: nextTargetId,
        comment: comment.trim(),
        severity,
      });
      setComment('');
      setErrors({});
    } catch (error) {
      setFormError(error instanceof Error && error.message ? error.message : 'Could not save that comment.');
    }
  };

  const noteChoices = notes ?? [];

  return (
    <form className="inquiry-note-form" onSubmit={(event) => void onFormSubmit(event)}>
      {mode === 'root' && lockedTarget ? (
        <p className={styles.lockedNote}>On {lockedTarget.label}</p>
      ) : null}
      {mode === 'root' && !lockedTarget ? (
        <>
          <Select
            label="Target"
            options={TARGET_OPTIONS}
            value={TARGET_LABELS[targetType]}
            onChange={(event) => setTargetType(targetFromLabel(event.target.value))}
            error={errors.targetType}
          />
          {targetType === 'note' ? (
            <label className="field">
              <span className="field__label">
                Finding note
                <span className="field__req" aria-hidden="true">
                  *
                </span>
              </span>
              <select
                className={`field__input${errors.targetId ? ' is-invalid' : ''}`}
                value={targetId}
                disabled={busy || notesLoading || noteChoices.length === 0}
                onChange={(event) => setTargetId(event.target.value)}
                aria-invalid={errors.targetId ? true : undefined}
              >
                {noteChoices.length === 0 ? (
                  <option value="">{notesLoading ? 'Loading notes…' : 'No finding notes yet'}</option>
                ) : (
                  noteChoices.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title}
                    </option>
                  ))
                )}
              </select>
              {errors.targetId ? (
                <span className="field__error" role="alert">
                  {errors.targetId}
                </span>
              ) : null}
            </label>
          ) : null}
          {targetType === 'question' ? (
            <label className="field">
              <span className="field__label">
                Question
                <span className="field__req" aria-hidden="true">
                  *
                </span>
              </span>
              <select
                className={`field__input${errors.targetId ? ' is-invalid' : ''}`}
                value={targetId}
                disabled={busy}
                onChange={(event) => setTargetId(event.target.value)}
                aria-invalid={errors.targetId ? true : undefined}
              >
                {RESPONSE_QUESTION_OPTIONS.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.title}
                  </option>
                ))}
              </select>
              {errors.targetId ? (
                <span className="field__error" role="alert">
                  {errors.targetId}
                </span>
              ) : null}
            </label>
          ) : null}
          {targetType === 'instrument' ? (
            <p className={styles.lockedNote}>Instrument {instrumentId || 'v1'}</p>
          ) : null}
          <Select
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={severityLabel}
            onChange={(event) => setSeverityLabel(event.target.value)}
            error={errors.severity}
            required
          />
        </>
      ) : null}
      {mode === 'root' && lockedTarget ? (
        <Select
          label="Severity"
          options={SEVERITY_OPTIONS}
          value={severityLabel}
          onChange={(event) => setSeverityLabel(event.target.value)}
          error={errors.severity}
          required
        />
      ) : null}
      <Textarea
        label={mode === 'reply' ? 'Reply' : 'Comment'}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        required
        rows={4}
        error={errors.comment}
        helperText={`${comment.trim().length}/1000`}
        disabled={busy}
      />
      {formError ? (
        <p className="na-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="sm" loading={busy} disabled={busy}>
          {submitLabel || (mode === 'reply' ? 'Reply' : 'Add review')}
        </Button>
      </div>
    </form>
  );
}
