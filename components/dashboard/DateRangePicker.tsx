'use client';

import {
  formatRangeLabel,
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
 */
export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}) {
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
        <div className="date-range__custom">
          <label>
            From
            <input
              type="date"
              value={value.start ?? ''}
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
              onChange={(e) =>
                onChange({ ...value, preset: 'custom', end: e.target.value || null })
              }
            />
          </label>
        </div>
      ) : (
        <p className="date-range__label">{formatRangeLabel(value)}</p>
      )}
    </div>
  );
}
