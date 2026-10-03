'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildAvailabilityMonth,
  type AvailabilityDay,
} from '@/lib/admin/interviewAnalytics';
import type { InterviewInviteRow } from '@/lib/firebase/interviewManage';

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function heatClass(count: number, max: number): string {
  if (count <= 0 || max <= 0) return 'is-empty';
  const ratio = count / max;
  if (ratio >= 1) return 'is-peak';
  if (ratio >= 0.67) return 'is-high';
  if (ratio >= 0.34) return 'is-mid';
  return 'is-low';
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
      <article className="dash-insight iv-cal" aria-hidden="true">
        <div className="dash-stat--skeleton" style={{ minHeight: 280 }} />
      </article>
    );
  }

  return (
    <article className="dash-insight iv-cal" aria-labelledby="iv-cal-title">
      <header className="iv-cal__head">
        <div>
          <h2 id="iv-cal-title" className="dash-insight__title">
            Availability Calendar
          </h2>
          <p className="dash-insight__hint">
            {maxCount > 0 && peakWeekday
              ? `Peak open availability: ${peakWeekday}s (${maxCount} invite${maxCount === 1 ? '' : 's'})`
              : 'Open invites’ preferred weekdays — confirmed interviews excluded'}
          </p>
        </div>
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
          return (
            <button
              key={day.isoDate}
              type="button"
              role="gridcell"
              className={[
                'iv-cal__day',
                heatClass(day.inMonth ? day.count : 0, maxCount),
                day.inMonth ? '' : 'is-outside',
                day.isPeak ? 'is-peak-day' : '',
                selectedDay ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!day.inMonth}
              aria-pressed={selectedDay}
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
