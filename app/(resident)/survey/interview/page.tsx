'use client';

import { useRouter } from 'next/navigation';
import { InterviewInvitationForm } from '@/components/survey/InterviewInvitationForm';

/** Standalone fallback. Primary path is embedded on Open problem discovery when IV1 = Yes. */
export default function InterviewPage() {
  const router = useRouter();

  return (
    <div
      className="survey-flow"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      <h1 className="survey-title" style={{ margin: 0 }}>
        Interview Invitation
      </h1>
      <InterviewInvitationForm
        onSent={() => router.push('/survey/thank-you?interview=sent')}
        onSkip={() => router.push('/survey/thank-you')}
      />
    </div>
  );
}
