'use client';

import { CircleHelp, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';
import { PAGE_HELP } from '@/lib/admin/pageHelp';

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function HelpDialog({ pageId, onClose }: { pageId: string; onClose: () => void }) {
  const help = PAGE_HELP[pageId];
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  // Esc closes, Tab stays inside, focus returns to the title that opened it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  if (!help) return null;

  return (
    <AdminOverlayPortal>
      <div className="page-help__backdrop" onClick={onClose}>
        <div
          ref={panelRef}
          className="page-help"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="page-help__head">
            <div>
              <p className="page-help__eyebrow">About this page</p>
              <h2 id={titleId} className="page-help__title">
                {help.title}
              </h2>
            </div>
            <button type="button" className="page-help__close" aria-label="Close" onClick={onClose}>
              <X size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </header>

          <div className="page-help__body">
            <section>
              <h3 className="page-help__h">What this page is for</h3>
              <p className="page-help__text">{help.purpose}</p>
            </section>

            <section>
              <h3 className="page-help__h">What you can do here</h3>
              <ul className="page-help__items">
                {help.items.map((item) => (
                  <li key={item.name} className="page-help__item">
                    <strong>{item.name}</strong>
                    <p>{item.what}</p>
                    <p className="page-help__why">
                      <span>Why it helps:</span> {item.why}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {help.goodToKnow.length > 0 ? (
              <section>
                <h3 className="page-help__h">Good to know</h3>
                <ul className="page-help__know">
                  {help.goodToKnow.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <footer className="page-help__foot">
            <button type="button" className="rr-btn rr-btn--primary" onClick={onClose}>
              Got it
            </button>
          </footer>
        </div>
      </div>
    </AdminOverlayPortal>
  );
}

const TIP_WIDTH = 420;
const TIP_GAP = 8;
const EDGE = 12;

/**
 * Hover tooltip for the title. It renders on document.body with fixed positioning, so no
 * card, toolbar or animated container can paint over it or clip it. It sits under the
 * title, flips above when there is no room below, and stays inside the window.
 */
function TitleTip({ anchor, id, tip }: { anchor: HTMLElement; id: string; tip: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(TIP_WIDTH, window.innerWidth - EDGE * 2);
    const height = node.offsetHeight;
    const left = Math.max(EDGE, Math.min(rect.left, window.innerWidth - width - EDGE));
    const below = rect.bottom + TIP_GAP;
    const fitsBelow = below + height <= window.innerHeight - EDGE;
    const top = fitsBelow ? below : Math.max(EDGE, rect.top - TIP_GAP - height);
    setPos({ top, left, width });
  }, [anchor, tip]);

  return createPortal(
    <div
        ref={ref}
        id={id}
        role="tooltip"
        className="page-title__tip"
        style={pos ? { top: pos.top, left: pos.left, width: pos.width } : { visibility: 'hidden', width: Math.min(TIP_WIDTH, window.innerWidth - EDGE * 2) }}
      >
        {tip}
        <span className="page-title__tip-hint">Select the title for a full guide.</span>
      </div>, document.body);
}

/**
 * The page title, as a button. Hover or focus shows what the page is for in one line;
 * selecting it opens a plain-language guide to everything on the page.
 * `pageId` is the id of the h1 and the key into PAGE_HELP.
 */
export function PageTitle({ pageId, children }: { pageId: string; children: ReactNode }) {
  const help = PAGE_HELP[pageId];
  const [tipOpen, setTipOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tipId = useId();

  // The tooltip is positioned once, so close it if the page moves underneath it.
  useEffect(() => {
    if (!tipOpen) return;
    const close = () => setTipOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [tipOpen]);

  if (!help) {
    return (
      <h1 id={pageId} className="dash-page__title">
        {children}
      </h1>
    );
  }

  return (
    <h1 id={pageId} className="dash-page__title page-title">
      <button
        ref={buttonRef}
        type="button"
        className="page-title__btn"
        aria-haspopup="dialog"
        aria-describedby={tipOpen ? tipId : undefined}
        onClick={() => {
          setTipOpen(false);
          setDialogOpen(true);
        }}
        onMouseEnter={() => setTipOpen(true)}
        onMouseLeave={() => setTipOpen(false)}
        onFocus={() => setTipOpen(true)}
        onBlur={() => setTipOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setTipOpen(false);
        }}
      >
        <span className="page-title__text">{children}</span>
        <CircleHelp size={18} strokeWidth={2.2} className="page-title__icon" aria-hidden="true" />
        <span className="visually-hidden"> — about this page</span>
      </button>
      {tipOpen && buttonRef.current ? (
        <TitleTip anchor={buttonRef.current} id={tipId} tip={help.tip} />
      ) : null}
      {dialogOpen ? <HelpDialog pageId={pageId} onClose={() => setDialogOpen(false)} /> : null}
    </h1>
  );
}
