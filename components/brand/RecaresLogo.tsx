'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme/ThemeProvider';

const LOGO = {
  /** Use on dark emerald headers or black backgrounds */
  dark: '/images/ReCARES-LOGO_SVG/logo-darkmode.svg',
  /** Use on white or #e5ebe8 (page) backgrounds */
  light: '/images/ReCARES-LOGO_SVG/logo-lightmode.svg',
  /** Compact mark — preferred on light page surfaces for About us */
  favicon: '/images/ReCARES-LOGO_SVG/logo-favicon.svg',
} as const;

export type LogoSurface = keyof typeof LOGO;

export interface RecaresLogoProps {
  /** Match asset to background: `dark` | `light` | `favicon` */
  surface: LogoSurface;
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * ReCARES mark. Match `surface` to the background behind the logo.
 */
export function RecaresLogo({
  surface,
  size = 40,
  className,
  priority = false,
}: RecaresLogoProps) {
  return (
    <Image
      src={LOGO[surface]}
      alt="ReCARES Survey"
      width={size}
      height={size}
      className={className}
      priority={priority}
      unoptimized
      style={{ display: 'block', width: size, height: size, objectFit: 'contain' }}
    />
  );
}

/**
 * Picks light vs dark logo from the active page theme (page-bg is #e5ebe8 or black).
 */
export function RecaresLogoForPage({
  size = 72,
  className,
  priority = false,
  lightSurface = 'light',
}: Omit<RecaresLogoProps, 'surface'> & {
  /** Asset used when theme is light. About us uses `favicon`. */
  lightSurface?: 'light' | 'favicon';
}) {
  const { theme } = useTheme();
  return (
    <RecaresLogo
      surface={theme === 'dark' ? 'dark' : lightSurface}
      size={size}
      className={className}
      priority={priority}
    />
  );
}
