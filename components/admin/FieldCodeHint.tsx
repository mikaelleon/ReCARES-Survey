'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

type TipCoords = {
  top: number;
  left: number;
  width: number;
  placeBelow: boolean;
};

/**
 * Inline field-code label with an info control that reveals plain-language question text.
 * Tip is portaled to document.body so overflow:hidden parents (Dashboard fit-viewport) cannot clip it.
 */
export function FieldCodeHint({
  children,
  content,
}: {
  children: ReactNode;
  content: string;
}) {
  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<TipCoords | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setCoords(null);
      return;
    }

    const update = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width = Math.min(280, Math.max(160, window.innerWidth * 0.7));
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      const placeBelow = rect.top < 140;
      setCoords({
        top: placeBelow ? rect.bottom + 8 : rect.top - 8,
        left,
        width,
        placeBelow,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        const tip = document.getElementById(tipId);
        if (tip && tip.contains(event.target as Node)) return;
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, tipId]);

  const tip =
    mounted && open && coords
      ? createPortal(
          <span
            id={tipId}
            role="tooltip"
            className={`field-code-hint__tip${coords.placeBelow ? ' is-below' : ' is-above'}`}
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            {content}
          </span>,
          document.body,
        )
      : null;

  return (
    <span className="field-code-hint" ref={rootRef}>
      <span className="field-code-hint__label">{children}</span>
      <button
        ref={btnRef}
        type="button"
        className="field-code-hint__btn"
        aria-label="What this field means"
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={12} strokeWidth={2.4} aria-hidden="true" />
      </button>
      {tip}
    </span>
  );
}

/** Plain-language copy for bare survey codes shown on the Dashboard. */
export const FIELD_CODE_HELP = {
  s1s3:
    'Average of: “The HOA office hours make it hard for me to do my transactions,” “I have to visit the HOA office in person even for simple matters,” and “I receive a response to my concerns within a reasonable time.”',
  f1f6:
    'Likelihood scores for six proposed website features (visitor pre-registration, street/event permits, tenant/owner forms, ID photo registration, request tracking, and accessibility options). “99” / not-shown answers are excluded from the average.',
  c1: '“In the past 12 months, which describes you?” — requested a street/event closure, was affected by one, both, or neither.',
  c2c3:
    'C2: “The process of getting a street or event closure permit is clear.” C3: “Notices about street closures and rerouting reach me in time.” Asked only when C1 is Requested, Affected, or Both.',
  r1: '“I am comfortable uploading a photo of my valid ID.”',
  r2: '“I trust that only authorized HOA personnel would see my ID.”',
  iv1: '“Would you be open to being contacted for a possible follow-up interview?”',
  a4: 'Screening question: “Do you or another member of your household have a disability or mobility limitation?” This count is Yes answers only — not the same as the Accessibility Needs path.',
  p4: 'Optional: “Typical wait at the gate, in minutes.”',
  ac1: 'Accessibility needs checklist shown only after A4 = Yes (disability or mobility limitation in the household).',
} as const;
