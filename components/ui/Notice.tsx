import type { CSSProperties, ReactNode } from 'react';

export interface NoticeProps {
  children: ReactNode;
  /** The stub (the tear-off button) under the paper. Without one, the paper ends the notice. */
  stub?: ReactNode;
  /** Two black cable ties at the top corners. */
  tied?: boolean;
  /** Plays the wind gust on load (the hero). Board notices gust from their board instead. */
  gust?: boolean;
  /** Tear state: idle | tearing | torn | restored. Set by useTear. */
  tear?: string;
  className?: string;
  id?: string;
  /** Paper accessible name, when the notice is a landmark. */
  'aria-labelledby'?: string;
  style?: CSSProperties;
}

/**
 * One paper sheet on the fence. Markup and behavior live in styles/notice.css.
 * The paper stays light in dark theme, the way emerald cards stay emerald.
 */
export function Notice({
  children,
  stub,
  tied = true,
  gust = false,
  tear = 'idle',
  className = '',
  id,
  style,
  'aria-labelledby': labelledBy,
}: NoticeProps) {
  const classes = ['notice', gust ? 'notice--gust' : '', stub ? '' : 'notice--plain', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-tear={tear} id={id} style={style} aria-labelledby={labelledBy}>
      <div className="notice__shadow" aria-hidden="true" />
      <div className="notice__paper">{children}</div>
      {stub}
      {tied ? (
        <>
          <i className="notice__tie notice__tie--l" aria-hidden="true" />
          <i className="notice__tie notice__tie--r" aria-hidden="true" />
        </>
      ) : null}
    </div>
  );
}

/** The four brand colors, printed once under a notice's first line. */
export function NoticeRule() {
  return (
    <div className="notice__rule" aria-hidden="true">
      <i style={{ background: 'var(--dark-emerald)' }} />
      <i style={{ background: 'var(--emerald-400)' }} />
      <i style={{ background: 'var(--harvest-orange)' }} />
      <i style={{ background: 'var(--bright-amber)' }} />
    </div>
  );
}
