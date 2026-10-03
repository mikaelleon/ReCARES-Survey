'use client';

const AGENT_ID = 'agent_5001m3znwnmnfhvsvfp2wpza517v';

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
 * Script is loaded from the root layout via next/script.
 */
export function ChatWidget() {
  return <elevenlabs-convai agent-id={AGENT_ID} />;
}
