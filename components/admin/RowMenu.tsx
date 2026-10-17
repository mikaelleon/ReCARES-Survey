'use client';

import { MoreHorizontal } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';

export interface RowMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  /** Renders a link instead of a button (for mailto:). */
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

const MENU_WIDTH = 220;
const ITEM_HEIGHT = 44;

/** Overflow ("more actions") menu. Rendered in a portal so table scrollers never clip it. */
export function RowMenu({
  label,
  items,
  disabled = false,
}: {
  label: string;
  items: RowMenuItem[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = items.length * ITEM_HEIGHT + 12;
    const flipUp = rect.bottom + height > window.innerHeight && rect.top > height;
    setPos({
      top: flipUp ? rect.top - height - 4 : rect.bottom + 4,
      left: Math.max(8, Math.min(window.innerWidth - MENU_WIDTH - 8, rect.right - MENU_WIDTH)),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };
    const onViewportChange = () => close(false);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, close]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [],
    );
    if (entries.length === 0) return;
    const index = entries.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (event.key === 'ArrowDown') next = (index + 1) % entries.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + entries.length) % entries.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = entries.length - 1;
    else if (event.key === 'Tab') {
      close(false);
      return;
    }
    if (next >= 0) {
      event.preventDefault();
      entries[next]?.focus();
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="row-menu__trigger"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close(false) : openMenu())}
      >
        <MoreHorizontal size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
      {open && pos ? (
        <AdminOverlayPortal>
          <div
            ref={menuRef}
            className="row-menu"
            role="menu"
            aria-label={label}
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            onKeyDown={onMenuKeyDown}
          >
            {items.map((item) => {
              const className = `row-menu__item${item.danger ? ' is-danger' : ''}`;
              const content = (
                <>
                  {item.icon}
                  <span>{item.label}</span>
                </>
              );
              if (item.href) {
                return (
                  <a
                    key={item.key}
                    role="menuitem"
                    className={className}
                    href={item.href}
                    onClick={() => close(false)}
                  >
                    {content}
                  </a>
                );
              }
              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={className}
                  disabled={item.disabled}
                  aria-disabled={item.disabled || undefined}
                  onClick={() => {
                    close(true);
                    item.onSelect?.();
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </AdminOverlayPortal>
      ) : null}
    </>
  );
}
