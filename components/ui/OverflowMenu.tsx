'use client';

import { MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export interface OverflowItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Explains why an item is disabled; shown as its title. */
  hint?: string;
  danger?: boolean;
  onSelect: () => void;
}

/**
 * "More actions" menu. Keyboard: Enter/Space/ArrowDown opens, arrows move, Home/End jump,
 * Escape closes and returns focus to the button. Destructive items are styled apart and
 * should still confirm in the caller.
 */
export function OverflowMenu({
  label,
  items,
  triggerLabel,
  align = 'right',
}: {
  /** Accessible name, for example "More actions for A1". */
  label: string;
  items: OverflowItem[];
  /** Optional visible text next to the icon. */
  triggerLabel?: string;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) wrapRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const onMenuKey = (event: React.KeyboardEvent) => {
    const nodes = Array.from(wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      nodes[(index + 1) % nodes.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nodes[(index - 1 + nodes.length) % nodes.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      nodes[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="overflow-menu" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`overflow-menu__btn${triggerLabel ? ' has-label' : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
        {triggerLabel ? <span>{triggerLabel}</span> : null}
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label={label} className={`overflow-menu__list overflow-menu__list--${align}`} onKeyDown={onMenuKey}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`overflow-menu__item${item.danger ? ' is-danger' : ''}`}
              disabled={item.disabled}
              title={item.hint}
              onClick={() => {
                close(false);
                item.onSelect();
              }}
            >
              <span aria-hidden="true" className="overflow-menu__icon">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
