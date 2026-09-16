'use client';

import Link from 'next/link';
import { useState, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: ReactNode;
  onDark?: boolean;
  children?: ReactNode;
  fullWidth?: boolean;
}

interface ButtonAsButtonProps extends ButtonBaseProps {
  href?: undefined;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  type?: never;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  onDark = false,
  children,
  onClick,
  type = 'button',
  href,
  fullWidth = false,
}: ButtonProps) {
  const [hover, setHover] = useState(false);

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const height = size === 'sm' ? 40 : 44;

  const base: CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-button-size)',
    fontWeight: 'var(--text-button-weight)',
    letterSpacing: 'var(--text-button-tracking)',
    textTransform: 'uppercase',
    height,
    minWidth: height,
    width: fullWidth ? '100%' : undefined,
    padding: '0 20px',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition:
      'background var(--motion-duration) var(--motion-ease), opacity var(--motion-duration) var(--motion-ease)',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    boxSizing: 'border-box',
  };

  const onDarkText = onDark ? 'var(--white)' : 'var(--text-body)';
  const onDarkBorder = onDark ? 'rgba(255,255,255,.7)' : 'var(--border-default)';

  const primaryFill = onDark
    ? hover && !disabled
      ? 'var(--accent-hover)'
      : 'var(--accent-selected)'
    : hover && !disabled
      ? 'var(--accent-hover)'
      : 'var(--accent-primary)';

  const primaryText =
    onDark || (hover && !disabled) ? 'var(--text-on-accent)' : 'var(--text-on-primary)';

  const style: CSSProperties = isPrimary
    ? { ...base, background: primaryFill, color: primaryText }
    : isSecondary
      ? {
          ...base,
          background: 'transparent',
          color: onDarkText,
          border: `1px solid ${onDarkBorder}`,
        }
      : {
          ...base,
          background: 'transparent',
          color: 'var(--bright-amber)',
          border: 'none',
          padding: '0 8px',
        };

  const hoverHandlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
        aria-disabled={disabled || undefined}
        {...hoverHandlers}
      >
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      style={style}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
      disabled={disabled}
      {...hoverHandlers}
    >
      {icon}
      {children}
    </button>
  );
}
