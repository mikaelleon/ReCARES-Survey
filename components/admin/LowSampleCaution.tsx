'use client';

const DEFAULT_THRESHOLD = 10;

/**
 * Compact low-n caveat — one line, no tall banner.
 */
export function LowSampleCaution({
  responseCount,
  threshold = DEFAULT_THRESHOLD,
  noun = 'response',
}: {
  responseCount: number;
  threshold?: number;
  noun?: string;
}) {
  if (responseCount <= 0 || responseCount >= threshold) return null;
  const plural = responseCount === 1 ? noun : `${noun}s`;
  return (
    <p className="dash-caution" role="note">
      Early signal · n={responseCount} {plural} — not a reliable figure yet.
    </p>
  );
}
