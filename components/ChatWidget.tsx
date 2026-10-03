'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

const AGENT_ID = 'agent_5001m3znwnmnfhvsvfp2wpza517v';

function isAdminPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/** Try to open the ElevenLabs ConvAI bubble (shadow DOM launcher). */
export function openChatWidget(): void {
  if (typeof document === 'undefined') return;
  const host = document.querySelector('elevenlabs-convai');
  const root = host?.shadowRoot;
  const button =
    root?.querySelector('button') ??
    root?.querySelector('[role="button"]') ??
    host;
  if (button instanceof HTMLElement) button.click();
}

/**
 * ElevenLabs conversational AI widget for RAGbot.
 * Resident site only — hidden on proponent/superadmin admin routes.
 */
export function ChatWidget() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;

  return (
    <>
      <elevenlabs-convai agent-id={AGENT_ID} />
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
      />
    </>
  );
}
