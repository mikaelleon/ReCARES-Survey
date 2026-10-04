'use client';

import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';

export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

export function Modal({ open = true, onClose, children }: ModalProps) {
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
        <div style={panelStyle} onClick={stopPropagation}>
          {children}
        </div>
      </div>
    </AdminOverlayPortal>
  );
}
