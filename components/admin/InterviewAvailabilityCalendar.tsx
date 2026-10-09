'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildAvailabilityMonth,
  type AvailabilityDay,
} from '@/lib/admin/interviewAnalytics';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import type { InterviewInviteRow } from '@/lib/firebase/interviewManage';

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Absolute scale, so one invite is never shown as the darkest "peak".
 * Peak only marks the busiest day(s) once at least two people overlap.
 */
function heatClass(count: number, max: number): string {
  if (count <= 0 || max <= 0) return 'is-empty';
  if (count >= 2 && count === max) return 'is-peak';
  if (count >= 3) return 'is-high';
  if (count >= 2) return 'is-mid';
  return 'is-low';
}

function startOfToday(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function timeLabel(row: InterviewInviteRow): string {
  if (row.preferredTime === 'Other' && row.preferredTimeOther) {
    return row.preferredTimeOther;
  }
  return row.preferredTime;
}

/**
 * Interactive month calendar — heat from preferredDays on open invites.
 * Click a day to inspect who is most available that weekday.
 */
export function InterviewAvailabilityCalendar({
  rows,
  loading = false,
}: {
  rows: InterviewInviteRow[];
  loading?: boolean;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const { days, maxCount, peakWeekday } = useMemo(
    () => buildAvailabilityMonth(rows, cursor.getFullYear(), cursor.getMonth()),
    [rows, cursor],
  );

  const selected: AvailabilityDay | null = useMemo(() => {
    if (!selectedIso) {
      return days.find((d) => d.inMonth && d.isPeak) ?? days.find((d) => d.inMonth) ?? null;
    }
    return days.find((d) => d.isoDate === selectedIso) ?? null;
  }, [days, selectedIso]);

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <article className="dash-insight iv-cal skel-region" aria-busy="true">
        <span className="visually-hidden">Loading availability calendar</span>
        <ChartSkeleton height={280} />
      </article>
    );
  }

  return (
    <article className="dash-insight iv-cal" aria-labelledby="iv-cal-title">
      <header className="iv-cal__head">
        <h2 id="iv-cal-title" className="dash-insight__title">
          Availability
          {maxCount > 0 && peakWeekday ? (
            <span className="iv-cal__peak">
              {' '}
              · Peak {peakWeekday}s ({maxCount})
            </span>
          ) : null}
        </h2>
        <div className="iv-cal__nav">
          <button
            type="button"
            className="iv-cal__nav-btn"
            aria-label="Previous month"
            onClick={() =>
              setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
            }
          >
            <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <p className="iv-cal__month" aria-live="polite">
            {monthLabel}
          </p>
          <button
            type="button"
            className="iv-cal__nav-btn"
            aria-label="Next month"
            onClick={() =>
              setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
            }
          >
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="iv-cal__grid" role="grid" aria-label={`Availability for ${monthLabel}`}>
        {WEEK_LABELS.map((label) => (
          <div key={label} className="iv-cal__dow" role="columnheader">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const selectedDay = selected?.isoDate === day.isoDate;
          const dayTime = new Date(
            day.date.getFullYear(),
            day.date.getMonth(),
            day.date.getDate(),
          ).getTime();
          const today = startOfToday();
          return (
            <button
              key={day.isoDate}
              type="button"
              role="gridcell"
              className={[
                'iv-cal__day',
                heatClass(day.inMonth ? day.count : 0, maxCount),
                day.inMonth ? '' : 'is-outside',
                day.isPeak && maxCount >= 2 ? 'is-peak-day' : '',
                day.inMonth && dayTime < today ? 'is-past' : '',
                day.inMonth && dayTime === today ? 'is-today' : '',
                selectedDay ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!day.inMonth}
              aria-selected={selectedDay}
              aria-label={`${day.date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}: ${day.count} available`}
              onClick={() => setSelectedIso(day.isoDate)}
            >
              <span className="iv-cal__date">{day.date.getDate()}</span>
              {day.inMonth && day.count > 0 ? (
                <span className="iv-cal__count">{day.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="iv-cal__legend" aria-hidden="true">
        <span>Fewer</span>
        <i className="iv-cal__swatch is-low" />
        <i className="iv-cal__swatch is-mid" />
        <i className="iv-cal__swatch is-high" />
        <i className="iv-cal__swatch is-peak" />
        <span>More available</span>
        <span className="iv-cal__legend-note">Past days are dimmed</span>
      </div>

      <div className="iv-cal__detail" aria-live="polite">
        {selected && selected.inMonth ? (
          <>
            <h3 className="iv-cal__detail-title">
              {selected.date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
              <span className="iv-cal__detail-meta">
                {selected.count} available · prefers {selected.weekday}s
              </span>
            </h3>
            {selected.matches.length === 0 ? (
              <p className="iv-cal__empty">No open invites prefer this weekday.</p>
            ) : (
              <ul className="iv-cal__list">
                {selected.matches.map((row) => (
                  <li key={row.id} className="iv-cal__item">
                    <span className="iv-cal__email" title={row.email}>
                      {row.email}
                    </span>
                    <span className="iv-cal__tag">{row.interviewFormat}</span>
                    <span className="iv-cal__tag iv-cal__tag--time">{timeLabel(row)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="iv-cal__empty">Select a day to see who is available.</p>
        )}
      </div>
    </article>
  );
}
