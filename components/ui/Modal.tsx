'use client';

import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

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
    zIndex: 100,
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
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={stopPropagation}>
        {children}
      </div>
    </div>
  );
}
