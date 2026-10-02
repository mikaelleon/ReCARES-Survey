import { Button } from '@/components/ui/Button';

export default function ThankYouPage({
  searchParams,
}: {
  searchParams?: { interview?: string; invite?: string };
}) {
  const interviewSent = searchParams?.interview === 'sent';
  const showInvite = searchParams?.invite === '1' && !interviewSent;

  return (
    <div
      className="survey-flow"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      <div
        style={{
          background: 'var(--surface-1)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 'clamp(20px, 3vw, 32px)',
          animation: 'riseIn 360ms ease-in-out both',
        }}
      >
        <h1 className="survey-title" style={{ margin: 0 }}>
          Thank you.
        </h1>
        <p className="na-intro">
          {interviewSent
            ? 'Your interview interest was saved separately from any survey answers.'
            : 'Results will be reported only as group totals.'}
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {showInvite ? (
            <Button variant="secondary" href="/survey/interview">
              Optional interview invitation
            </Button>
          ) : null}
          <Button variant="primary" href="/">
            Back to the homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
