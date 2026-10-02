import { Button } from '@/components/ui/Button';

export default function ThankYouPage({
  searchParams,
}: {
  searchParams?: { interview?: string };
}) {
  const interviewSent = searchParams?.interview === 'sent';

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
        }}
      >
        <h1
          style={{
            margin: 0,
            color: 'var(--text-headline)',
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          Thank you.
        </h1>
        <p className="na-intro">
          {interviewSent
            ? 'Your interview interest was saved separately from any survey answers.'
            : 'Results will be reported only as group totals.'}
        </p>
        {interviewSent ? null : (
          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="secondary" href="/survey/interview">
              Optional interview invitation
            </Button>
            <Button variant="primary" href="/">
              Back to the homepage
            </Button>
          </div>
        )}
        {interviewSent ? (
          <div style={{ marginTop: 28 }}>
            <Button variant="primary" href="/">
              Back to the homepage
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
