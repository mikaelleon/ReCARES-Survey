'use client';

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { THEME_SHIFT } from '@/lib/theme/ThemeProvider';
import { prefersReducedMotion } from '@/lib/ui/useTear';
import {
  isStageSection,
  STAGE_GO,
  STAGE_SECTION,
  STAGE_STATE,
  STAGE_STEP,
  type StageSection,
  type StageState,
} from '@/lib/ui/stage';

/**
 * The landing page: one locked screen, a long fence rail, notices hung from it.
 * You move along the fence by swiping, pressing Next or Previous, using the navbar,
 * the arrow keys, the mouse wheel, or dragging the photo. Native scroll-snap does
 * the movement, so touch momentum, trackpads and assistive tech all work.
 *
 * Storyboard of a move (all derived from the real scroll position):
 *   - the rail and notices travel 1:1 with the scroll
 *   - the photo behind travels at drift/scrollRange of that speed (depth)
 *   - each hanging notice lags the rail and swings back (follow-through)
 */

interface Stop {
  el: HTMLElement;
  left: number;
  section: StageSection;
  label: string;
}

const FALLBACK_STOPS = [
  { section: 'survey' as StageSection, label: 'Survey' },
  { section: 'about' as StageSection, label: 'About' },
  { section: 'faq' as StageSection, label: 'FAQ' },
  { section: 'contact' as StageSection, label: 'Contact' },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/* ---------------------------------------------------------------------------
   Panels and cells. A panel is one wide-screen stop (it holds one or two cells);
   below 1280px panels dissolve and every cell is its own stop (see stage.css).
   --------------------------------------------------------------------------- */
const SectionContext = createContext<StageSection>('survey');

export function StagePanel({
  section,
  label,
  align = 'start',
  children,
}: {
  section: StageSection;
  label: string;
  align?: 'start' | 'end';
  children: ReactNode;
}) {
  return (
    <SectionContext.Provider value={section}>
      <div
        className="stage__panel"
        data-stop=""
        data-section={section}
        data-label={label}
        data-align={align}
        role="group"
        aria-roledescription="slide"
        aria-label={label}
      >
        {children}
      </div>
    </SectionContext.Provider>
  );
}

export function StageCell({
  label,
  width,
  grow = 1,
  children,
}: {
  label: string;
  /** Widest the notice gets on a wide screen, in px. */
  width: number;
  grow?: number;
  children: ReactNode;
}) {
  const section = useContext(SectionContext);
  return (
    <div
      className="stage__cell"
      data-stop=""
      data-section={section}
      data-label={label}
      role="group"
      aria-label={label}
      data-fixed={grow === 0 ? '' : undefined}
      style={{ '--w': `${width}px`, '--grow': grow } as CSSProperties}
    >
      <div className="stage__hang">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */

export function FenceStage({ photo, children }: { photo: ReactNode; children: ReactNode }) {
  const stageRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const stopsRef = useRef<Stop[]>([]);
  const indexRef = useRef(0);
  const driftRef = useRef(0);
  const kickSway = useRef<() => void>(() => {});

  const [index, setIndex] = useState(0);
  const [stops, setStops] = useState<{ section: StageSection; label: string }[]>(FALLBACK_STOPS);

  /** Find the stops of the current layout: panels on wide screens, cells below that. */
  const collect = useCallback(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    const photoEl = photoRef.current;
    if (!wrap || !stage || !track) return;

    const found: Stop[] = [];
    wrap.querySelectorAll<HTMLElement>('[data-stop]').forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === 'contents' || style.scrollSnapAlign.startsWith('none')) return;
      found.push({
        el,
        left: el.offsetLeft,
        section: el.dataset.section as StageSection,
        label: el.dataset.label ?? '',
      });
    });
    stopsRef.current = found;
    if (found.length) {
      setStops((prev) => {
        const next = found.map((s) => ({ section: s.section, label: s.label }));
        const same =
          prev.length === next.length &&
          prev.every((p, i) => p.section === next[i].section && p.label === next[i].label);
        return same ? prev : next;
      });
    }
    driftRef.current = photoEl ? Math.max(0, photoEl.offsetWidth - track.clientWidth) : 0;
  }, []);

  /** Photo depth, and which stop is nearest. */
  const measure = useCallback(() => {
    const track = trackRef.current;
    const photoEl = photoRef.current;
    if (!track) return;
    const x = track.scrollLeft;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    if (photoEl) {
      const p = max > 0 ? clamp(x / max, 0, 1) : 0;
      photoEl.style.transform = `translate3d(${(-p * driftRef.current).toFixed(2)}px,0,0)`;
    }
    let best = 0;
    let bestDistance = Infinity;
    stopsRef.current.forEach((s, i) => {
      const distance = Math.abs(Math.min(s.left, max) - x);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    if (best !== indexRef.current) {
      indexRef.current = best;
      setIndex(best);
    }
  }, []);

  const goTo = useCallback((i: number, instant = false) => {
    const track = trackRef.current;
    const stop = stopsRef.current[clamp(i, 0, stopsRef.current.length - 1)];
    if (!track || !stop) return;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    track.scrollTo({
      left: Math.min(stop.left, max),
      behavior: instant || prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  const goNext = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  /* --- Setup: lock the page, find stops, jump to a hash ---------------------- */
  useEffect(() => {
    document.documentElement.classList.add('is-stage');
    collect();
    measure();

    const hash = window.location.hash.slice(1);
    if (isStageSection(hash)) {
      const i = stopsRef.current.findIndex((s) => s.section === hash);
      if (i > 0) goTo(i, true);
    }

    const resize = () => {
      collect();
      measure();
      goTo(indexRef.current, true);
    };
    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(() => {
      collect();
      measure();
    });
    if (wrapRef.current) observer.observe(wrapRef.current);

    return () => {
      document.documentElement.classList.remove('is-stage');
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, [collect, measure, goTo]);

  /* --- Report the section, keep the URL and offscreen notices honest ---------- */
  useEffect(() => {
    const stop = stopsRef.current[index];
    if (!stop) return;
    stopsRef.current.forEach((s, i) => {
      if (i === index) s.el.removeAttribute('inert');
      else s.el.setAttribute('inert', '');
    });
    const state: StageState = {
      index,
      count: stopsRef.current.length,
      label: stop.label,
      section: stop.section,
    };
    window.__stageSection = stop.section;
    window.__stageState = state;
    window.dispatchEvent(new CustomEvent(STAGE_SECTION, { detail: stop.section }));
    window.dispatchEvent(new CustomEvent<StageState>(STAGE_STATE, { detail: state }));
    const url =
      stop.section === 'survey'
        ? window.location.pathname + window.location.search
        : `#${stop.section}`;
    try {
      window.history.replaceState(window.history.state, '', url);
    } catch {
      /* some embedded browsers refuse; the stage still works */
    }
  }, [index, stops]);

  /* --- Navbar and hero asks ---------------------------------------------------- */
  useEffect(() => {
    const onGo = (e: Event) => {
      const section = (e as CustomEvent<StageSection>).detail;
      const i = stopsRef.current.findIndex((s) => s.section === section);
      if (i >= 0) goTo(i);
    };
    const onStep = (e: Event) => {
      const direction = (e as CustomEvent<number>).detail;
      if (direction > 0 && indexRef.current >= stopsRef.current.length - 1) goTo(0);
      else goTo(indexRef.current + direction);
    };
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      const i = isStageSection(hash) ? stopsRef.current.findIndex((st) => st.section === hash) : -1;
      if (i >= 0) goTo(i);
    };
    window.addEventListener(STAGE_GO, onGo);
    window.addEventListener(STAGE_STEP, onStep);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener(STAGE_GO, onGo);
      window.removeEventListener(STAGE_STEP, onStep);
      window.removeEventListener('hashchange', onHash);
      window.__stageState = undefined;
      window.__stageSection = undefined;
    };
  }, [goTo]);

  /* --- Theme change: day -> dusk -> night, night -> dawn -> day -------------------------
     Storyboard (ambient light, not a UI response, so slower and softer than a move; the two
     crossfades overlap, the way light actually drifts, instead of stopping at the middle):
       0ms     the middle shot starts fading in over the one on screen
       450ms   the final shot starts fading in, while the middle one is still arriving
       1250ms  both done; inline styles drop and the theme's CSS holds the final shot
     Interrupted: running fades jump to their end, then the new sequence starts from there. */
  useEffect(() => {
    const photoEl = photoRef.current;
    if (!photoEl) return;
    const FADE_MS = 800;
    const OFFSET_MS = 450;
    const EASE = 'cubic-bezier(0.45, 0, 0.55, 1)'; // sine in and out: light eases, it does not snap
    let z = 10;
    let running: Animation[] = [];
    let timer = 0;

    const shot = (name: string) => photoEl.querySelector<HTMLElement>(`[data-shot="${name}"]`);
    const settle = () => {
      running.forEach((a) => a.cancel());
      running = [];
      photoEl.querySelectorAll<HTMLElement>('[data-shot]').forEach((el) => el.removeAttribute('style'));
    };

    const onShift = (e: Event) => {
      const to = (e as CustomEvent<'light' | 'dark'>).detail;
      window.clearTimeout(timer);
      if (prefersReducedMotion()) {
        settle();
        return;
      }
      /* Whatever is on screen now stays fully opaque underneath the new shot. */
      const from = shot(to === 'dark' ? 'day' : 'night');
      const mid = shot(to === 'dark' ? 'dusk' : 'dawn');
      const end = shot(to === 'dark' ? 'night' : 'day');
      if (!from || !mid || !end) return;
      running.forEach((a) => a.finish());
      photoEl.querySelectorAll<HTMLElement>('[data-shot]').forEach((el) => {
        el.style.opacity = el === from ? '1' : '0';
        el.style.zIndex = '1';
      });
      const fade = (el: HTMLElement, delay: number) => {
        el.style.zIndex = String(++z);
        const a = el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: FADE_MS,
          delay,
          easing: EASE,
          fill: 'both',
        });
        running.push(a);
      };
      fade(mid, 0);
      fade(end, OFFSET_MS);
      timer = window.setTimeout(settle, OFFSET_MS + FADE_MS + 60);
    };
    window.addEventListener(THEME_SHIFT, onShift);
    return () => {
      window.removeEventListener(THEME_SHIFT, onShift);
      window.clearTimeout(timer);
    };
  }, []);

  /* --- Keyboard ----------------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      /* Keys are fired fast and often, so they jump: the new stop shows on the next frame. */
      const last = stopsRef.current.length - 1;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(Math.min(last, indexRef.current + 1), true);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(Math.max(0, indexRef.current - 1), true);
      else if (e.key === 'Home') goTo(0, true);
      else if (e.key === 'End') goTo(last, true);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, goTo]);

  /* --- Scroll, wheel, drag, peek tap, sway --------------------------------------- */
  useEffect(() => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;

    let frame = 0;
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
      }
      kickSway.current();
    };
    track.addEventListener('scroll', onScroll, { passive: true });

    /* Hanging notices lag the rail, then swing back. A damped spring on the real
       scroll velocity, applied straight to each notice's hang, resting on an exact
       identity so the type is crisp whenever you read it. */
    let swayRaf = 0;
    let running = false;
    let lastX = track.scrollLeft;
    let lastT = 0;
    let sway = 0;
    let swayVelocity = 0;
    const tick = (now: number) => {
      /* Time-based, so a 120Hz screen and a slow phone swing the same way. The constants
         are tuned for 60Hz: k is "how many 60Hz frames this frame is worth". */
      const dt = Math.min(48, Math.max(1, now - lastT));
      lastT = now;
      const k = dt / 16.667;
      const x = track.scrollLeft;
      const pxPerMs = (x - lastX) / dt;
      lastX = x;
      const target = prefersReducedMotion() ? 0 : clamp(-pxPerMs * 3.4, -4, 4);
      swayVelocity += (target - sway) * 0.14 * k;
      swayVelocity *= Math.pow(0.78, k);
      sway += swayVelocity * k;
      const rest =
        Math.abs(sway) < 0.03 && Math.abs(swayVelocity) < 0.02 && Math.abs(pxPerMs) < 0.012;
      const value = rest ? '' : `rotate(${sway.toFixed(3)}deg)`;
      wrap.querySelectorAll<HTMLElement>('.stage__hang').forEach((h) => {
        h.style.transform = value;
      });
      if (rest) {
        running = false;
        return;
      }
      swayRaf = requestAnimationFrame(tick);
    };
    kickSway.current = () => {
      if (running) return;
      running = true;
      lastX = track.scrollLeft;
      lastT = performance.now();
      swayRaf = requestAnimationFrame(tick);
    };

    /* Mouse wheel: nothing scrolls vertically here, so a vertical wheel moves one stop.
       Trackpad horizontal swipes are left to the browser. */
    let accumulated = 0;
    let lastWheel = 0;
    let streamUsed = false; // a trackpad flick is one stream of events: it moves one stop, once
    let lastNav = 0;
    const canScrollInside = (start: EventTarget | null, dy: number) => {
      let el = start as HTMLElement | null;
      while (el && el !== track) {
        if (el.scrollHeight > el.clientHeight + 1) {
          const overflowY = getComputedStyle(el).overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') {
            const atTop = el.scrollTop <= 0;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
            if ((dy < 0 && !atTop) || (dy > 0 && !atBottom)) return true;
          }
        }
        el = el.parentElement;
      }
      return false;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (canScrollInside(e.target, e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheel > 140) {
        streamUsed = false; // a pause: this is a new gesture
        accumulated = 0;
      }
      lastWheel = now;
      if (streamUsed || now - lastNav < 320) return;
      accumulated += e.deltaY;
      if (Math.abs(accumulated) < 30) return;
      streamUsed = true;
      lastNav = now;
      if (accumulated > 0) goNext();
      else goPrev();
    };
    track.addEventListener('wheel', onWheel, { passive: false });

    /* Mouse drag on the photo and rail (never on a notice, so text stays selectable). */
    let drag: { x: number; left: number; moved: boolean; from: number } | null = null;
    let suppressClick = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if ((e.target as HTMLElement).closest('.notice, a, button, input, textarea, select, label')) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false, from: indexRef.current };
      track.style.scrollSnapType = 'none';
      track.style.cursor = 'grabbing';
      track.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      track.scrollLeft = drag.left - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const { moved, from } = drag;
      drag = null;
      track.style.scrollSnapType = '';
      track.style.cursor = '';
      if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
      if (!moved) return;
      suppressClick = true;
      window.setTimeout(() => (suppressClick = false), 0);
      if (dx < -60) goTo(from + 1);
      else if (dx > 60) goTo(from - 1);
      else goTo(from);
    };
    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);

    /* Tap the notice peeking in at the right edge to bring it in. */
    const onClick = (e: MouseEvent) => {
      if (suppressClick) return;
      const target = e.target as HTMLElement;
      if (target.closest('.notice, a, button, input, textarea, select, label')) return;
      const active = stopsRef.current[indexRef.current];
      if (active?.el.contains(target)) return;
      const rect = track.getBoundingClientRect();
      if (e.clientX - rect.left > rect.width - 96) goNext();
    };
    track.addEventListener('click', onClick);

    return () => {
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('wheel', onWheel);
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', onUp);
      track.removeEventListener('pointercancel', onUp);
      track.removeEventListener('click', onClick);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(swayRaf);
      kickSway.current = () => {};
    };
  }, [measure, goNext, goPrev, goTo]);

  const atStart = index === 0;
  const atEnd = index >= stops.length - 1;
  const nextLabel = stops[index + 1]?.label;
  const prevLabel = stops[index - 1]?.label;
  const here = stops[index];

  return (
    <section
      ref={stageRef}
      className="stage"
      aria-roledescription="carousel"
      aria-label="About the survey"
    >
      <div ref={photoRef} className="stage__photo">
        {photo}
      </div>

      <div ref={trackRef} className="stage__track">
        <div ref={wrapRef} className="stage__wrap">
          <div className="stage__rail" aria-hidden="true" />
          <i className="stage__post stage__post--start" aria-hidden="true" />
          <i className="stage__post stage__post--end" aria-hidden="true" />
          {children}
        </div>
      </div>

      <div className="stage__bar" role="group" aria-label="Move along the notices">
        <button
          type="button"
          className="stage__btn stage__btn--icon"
          onClick={goPrev}
          disabled={atStart}
          aria-label={prevLabel ? `Back to ${prevLabel}` : 'Back'}
        >
          <ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="stage__btn"
          onClick={atEnd ? () => goTo(0) : goNext}
        >
          <span>{atEnd ? 'Back to start' : `Next: ${nextLabel ?? ''}`}</span>
          {atEnd ? (
            <RotateCcw size={20} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <ChevronRight size={22} strokeWidth={2.4} aria-hidden="true" />
          )}
        </button>
        <div className="stage__ticks" aria-hidden="true">
          {stops.map((s, i) => (
            <i key={`${s.section}-${s.label}`} data-on={i === index} />
          ))}
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {here ? `${here.label}, ${index + 1} of ${stops.length}` : ''}
      </p>
    </section>
  );
}
