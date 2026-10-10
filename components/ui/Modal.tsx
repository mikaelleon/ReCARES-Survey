'use client';

import { useEffect, useRef, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';

export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open = true, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Esc closes, Tab stays inside, focus returns to the opener on close.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'var(--overlay-backdrop)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  };

  const panelStyle: CSSProperties = {
    background: 'var(--surface-3)',
    border: '1px solid var(--surface-3-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-modal)',
    padding: 32,
    maxWidth: 420,
    width: '90%',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-body)',
  };

  const stopPropagation: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  return (
    <AdminOverlayPortal>
      <div style={backdropStyle} onClick={onClose}>
        <div
          ref={panelRef}
          style={panelStyle}
          role="dialog"
          aria-modal="true"
          onClick={stopPropagation}
        >
          {children}
        </div>
      </div>
    </AdminOverlayPortal>
  );
}
