'use client';

import type { ReactNode } from 'react';

export interface ViewOption<T extends string> {
  /** The option's identity. `value` is accepted as an alias so existing callers keep working. */
  id?: T;
  value?: T;
  label: string;
  icon: ReactNode;
}

/**
 * Segmented control for choosing how the same data is shown. Each option is a toggle button
 * (aria-pressed) with an icon and a visible-on-wide-screens label.
 */
export function ViewSwitcher<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ViewOption<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="view-switcher" role="group" aria-label={label}>
      {options.map((option) => {
        const optionId = (option.id ?? option.value) as T;
        return (
        <button
          key={optionId}
          type="button"
          className={`view-switcher__btn${value === optionId ? ' is-active' : ''}`}
          aria-pressed={value === optionId}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(optionId)}
        >
          <span aria-hidden="true" className="view-switcher__icon">
            {option.icon}
          </span>
          <span className="view-switcher__label">{option.label}</span>
        </button>
        );
      })}
    </div>
  );
}
