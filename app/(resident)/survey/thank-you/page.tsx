import { Button } from '@/components/ui/Button';

export default function ThankYouPage() {
  return (
    <div
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
          animation: 'riseIn 420ms ease-in-out both',
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
        <p
          style={{
            margin: '16px 0 0',
            fontSize: 16,
            lineHeight: 1.55,
            color: 'var(--text-body)',
            textWrap: 'pretty',
          }}
        >
          Your response has been recorded. Your answers are combined with everyone else&apos;s and
          compiled into a report for our academic adviser. If the results show this kind of system
          would genuinely help the community, we plan to bring that report to the Homeowners
          Association as part of proposing it formally.
        </p>
        <p
          style={{
            margin: '16px 0 0',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--text-caption)',
            textWrap: 'pretty',
          }}
        >
          Nothing you submitted is attached to your name. If you have a question about the study, use
          the inquiry form on the homepage.
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="primary" href="/">
            Back to the homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
