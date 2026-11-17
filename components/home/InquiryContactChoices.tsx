'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { openChatWidget } from '@/components/ChatWidget';

/**
 * Inquiry section copy + channel choice: team form or RAGbot chat.
 * Printed on the notice it sits in (see HomePage). The quiet link at the foot is the
 * proponents' way in, kept from the old footer.
 */
export function InquiryContactChoices() {
  return (
    <>
      <p className="notice__body">
        Have a question about this survey or the study behind it? Choose how you want to reach out.
      </p>
      <ul className="contact-list">
        <li>Send a message with the form. A member of the proponent team will reply.</li>
        <li>Chat with RAGbot for quick answers about the survey, screening, and FAQ topics.</li>
      </ul>
      <p className="notice__body" style={{ marginTop: 14 }}>
        You can also use either option if you would like to know more about the study before deciding
        whether to participate.
      </p>
      <button
        type="button"
        className="notice__link"
        style={{
          alignSelf: 'flex-start',
          marginTop: 12,
          gap: 8,
          background: 'none',
          border: 0,
          padding: 0,
          cursor: 'pointer',
        }}
        onClick={() => openChatWidget()}
      >
        <MessageCircle size={18} strokeWidth={2.4} aria-hidden="true" />
        Chat with RAGbot
      </button>
      <Link href="/admin/login" className="notice__quiet" style={{ marginTop: 4 }}>
        Proponent access
      </Link>
    </>
  );
}
