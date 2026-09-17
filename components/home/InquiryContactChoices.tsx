'use client';

import { MessageCircle } from 'lucide-react';
import { openRagBot } from '@/components/ragbot/RagBotChat';
import { Button } from '@/components/ui/Button';

/**
 * Inquiry section copy + channel choice: team form or RAGbot chat.
 */
export function InquiryContactChoices() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        height: '100%',
      }}
    >
      <p
        style={{
          margin: 0,
          color: 'var(--text-on-card-neutral)',
          fontSize: 16,
          lineHeight: 1.6,
          textWrap: 'pretty',
        }}
      >
        Have a question about this survey or the study behind it? Choose how you want to reach out.
      </p>
      <ul
        style={{
          margin: 0,
          padding: '0 0 0 1.15em',
          color: 'var(--text-on-card-neutral)',
          fontSize: 16,
          lineHeight: 1.6,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <li style={{ textWrap: 'pretty' }}>
          Send a message with the form — a member of the proponent team will reply.
        </li>
        <li style={{ textWrap: 'pretty' }}>
          Chat with RAGbot for quick answers about the survey, screening, and FAQ topics.
        </li>
      </ul>
      <p
        style={{
          margin: 0,
          color: 'var(--text-on-card-neutral)',
          fontSize: 16,
          lineHeight: 1.6,
          textWrap: 'pretty',
        }}
      >
        You can also use either option if you would like to know more about the study before deciding
        whether to participate.
      </p>
      <div style={{ marginTop: 'auto', paddingTop: 4 }}>
        <Button
          type="button"
          variant="secondary"
          icon={<MessageCircle size={18} strokeWidth={2.4} aria-hidden="true" />}
          onClick={() => openRagBot()}
        >
          Chat with RAGbot
        </Button>
      </div>
    </div>
  );
}
