'use client';

import {
  formatRangeLabel,
  isCustomInverted,
  isCustomPending,
  type DatePreset,
  type DateRangeValue,
} from '@/lib/admin/dateRange';

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

/**
 * Lightweight date-range control shared by Dashboard + Responses (session-stored).
 * Incomplete Custom falls back to all-time and shows a pending cue.
 * Inverted From/To shows an error and does not apply the range.
 */
export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}) {
  const customPending = isCustomPending(value);
  const customInverted = isCustomInverted(value);

  return (
    <div className="date-range" role="group" aria-label="Date range">
      <div className="date-range__presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`date-range__preset${value.preset === p.id ? ' is-active' : ''}`}
            onClick={() =>
              onChange({
                preset: p.id,
                start: p.id === 'custom' ? value.start : null,
                end: p.id === 'custom' ? value.end : null,
              })
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === 'custom' ? (
        <div
          className={`date-range__custom${customPending || customInverted ? ' is-pending' : ''}`}
          title={
            customInverted
              ? 'From cannot be later than To. Fix the dates before the range applies.'
              : customPending
                ? 'Showing all-time data until both dates are set.'
                : formatRangeLabel(value)
          }
        >
          <p className="date-range__custom-title">Custom range</p>
          <div className="date-range__custom-fields">
            <label>
              From
              <input
                type="date"
                value={value.start ?? ''}
                aria-invalid={customInverted || undefined}
                onChange={(e) =>
                  onChange({ ...value, preset: 'custom', start: e.target.value || null })
                }
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={value.end ?? ''}
                aria-invalid={customInverted || undefined}
                onChange={(e) =>
                  onChange({ ...value, preset: 'custom', end: e.target.value || null })
                }
              />
            </label>
          </div>
          {customInverted ? (
            <p className="date-range__error" role="alert">
              From cannot be later than To. Fix the dates before the range applies.
            </p>
          ) : customPending ? (
            <p className="date-range__pending" role="status">
              Showing all-time data until both dates are set.
            </p>
          ) : (
            <p className="date-range__applied">{formatRangeLabel(value)}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
