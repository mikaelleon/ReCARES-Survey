'use client';

export function FirestoreBlockedNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        margin: '0 0 16px',
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(255, 193, 7, 0.18)',
        border: '1px solid rgba(255, 193, 7, 0.55)',
        color: 'var(--text-body)',
        fontSize: 14,
        lineHeight: 1.55,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 6 }}>Firestore blocked by the browser</strong>
      <span>{message}</span>
      <span style={{ display: 'block', marginTop: 8 }}>
        In Brave: click the lion Shields icon → set Shields to <strong>Down</strong> for this site,
        then refresh. Other blockers: allow <code>firestore.googleapis.com</code>.
      </span>
    </div>
  );
}
