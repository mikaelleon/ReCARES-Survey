import { Fragment } from 'react';

/**
 * Renders text with **bold** markers as <strong>. The markers live in the
 * English copy and are repeated in the Tagalog copy, so the same phrases stand
 * out in both languages. Text without markers renders as plain text.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : <Fragment key={index}>{part}</Fragment>,
      )}
    </>
  );
}
