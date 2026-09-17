'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { MessageCircle, Mic, MicOff, Send, X } from 'lucide-react';

type Role = 'bot' | 'user';

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: 'Hi — I am the ReCARES RAGbot. Ask about the survey, screening, or community assessment. Type or use the mic. Answers will use project docs once RAG is wired.',
};

function stubReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes('survey') || q.includes('start')) {
    return 'Residents start at “Start the survey” on the home page. Screening comes first, then the assessment sections.';
  }
  if (q.includes('privacy') || q.includes('safe') || q.includes('data')) {
    return 'Personal-safety answers stay gated. Only proponents with the shared access code can read that section.';
  }
  if (q.includes('faq') || q.includes('contact')) {
    return 'FAQ and contact sit further down the home page. Use the inquiry form if you need a human reply.';
  }
  return 'Thanks — RAG retrieval is not connected yet. Your question is noted in this stub chat. Try the FAQ below, or ask again after docs are indexed.';
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speechLang(): string {
  if (typeof navigator === 'undefined') return 'en-PH';
  const nav = navigator.language || 'en-PH';
  if (nav.toLowerCase().startsWith('fil') || nav.toLowerCase().startsWith('tl')) {
    return 'fil-PH';
  }
  return nav;
}

/**
 * Bottom-right RAGbot chat shell. Stub replies until retrieval backend exists.
 * Voice input via Web Speech API when the browser supports it.
 */
export function RagBotChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const titleId = useId();
  const panelId = useId();

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    if (!listening) inputRef.current?.focus();
  }, [open, messages, busy, listening]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.stop();
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stopListening();
      setVoiceHint(null);
    }
  }, [open, stopListening]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (listeningRef.current) {
          stopListening();
          return;
        }
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;

      stopListening();

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setVoiceHint(null);
      setBusy(true);

      await new Promise((r) => setTimeout(r, 480));

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: stubReply(text),
        },
      ]);
      setBusy(false);
    },
    [busy, stopListening],
  );

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || busy) return;

    stopListening();
    setVoiceHint(null);

    const rec = new Ctor();
    rec.lang = speechLang();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      if (interim) {
        setInput(interim);
        setVoiceHint('Listening…');
      }
      if (finalText.trim()) {
        const spoken = finalText.trim();
        setInput(spoken);
        setVoiceHint(null);
        listeningRef.current = false;
        setListening(false);
        void send(spoken);
      }
    };

    rec.onerror = (event) => {
      listeningRef.current = false;
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceHint('Mic permission blocked. Allow microphone for this site.');
      } else if (event.error === 'no-speech') {
        setVoiceHint('No speech heard. Tap mic and try again.');
      } else if (event.error !== 'aborted') {
        setVoiceHint('Voice input failed. Try typing instead.');
      }
    };

    rec.onend = () => {
      if (listeningRef.current) {
        listeningRef.current = false;
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    listeningRef.current = true;
    setListening(true);
    setVoiceHint('Listening… speak now');
    try {
      rec.start();
    } catch {
      listeningRef.current = false;
      setListening(false);
      setVoiceHint('Could not start mic. Try again.');
    }
  }, [busy, send, stopListening]);

  const toggleVoice = () => {
    if (listening) stopListening();
    else startListening();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="ragbot">
      {open ? (
        <section
          id={panelId}
          className="ragbot__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="ragbot__head">
            <div>
              <h2 id={titleId} className="ragbot__title">
                RAGbot
              </h2>
              <p className="ragbot__sub">
                ReCARES assistant · stub
                {voiceSupported ? ' · voice ready' : ''}
              </p>
            </div>
            <button
              type="button"
              className="ragbot__icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </header>

          <div ref={listRef} className="ragbot__messages" aria-live="polite">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ragbot__bubble ragbot__bubble--${m.role}`}
              >
                {m.text}
              </div>
            ))}
            {busy ? (
              <div className="ragbot__bubble ragbot__bubble--bot ragbot__bubble--typing">
                Thinking…
              </div>
            ) : null}
          </div>

          <form className="ragbot__form" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor={`${panelId}-input`}>
              Message
            </label>
            <textarea
              id={`${panelId}-input`}
              ref={inputRef}
              className="ragbot__input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder={
                listening
                  ? 'Listening…'
                  : voiceSupported
                    ? 'Ask about the survey… or use the mic'
                    : 'Ask about the survey…'
              }
              disabled={busy}
              aria-describedby={voiceHint ? `${panelId}-voice-hint` : undefined}
            />
            <div className="ragbot__actions">
              {voiceSupported ? (
                <button
                  type="button"
                  className={`ragbot__mic${listening ? ' ragbot__mic--live' : ''}`}
                  onClick={toggleVoice}
                  disabled={busy}
                  aria-pressed={listening}
                  aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                >
                  {listening ? (
                    <MicOff size={18} strokeWidth={2.4} aria-hidden="true" />
                  ) : (
                    <Mic size={18} strokeWidth={2.4} aria-hidden="true" />
                  )}
                </button>
              ) : null}
              <button
                type="submit"
                className="ragbot__send"
                disabled={busy || !input.trim()}
                aria-label="Send message"
              >
                <Send size={18} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            {voiceHint ? (
              <p id={`${panelId}-voice-hint`} className="ragbot__voice-hint" role="status">
                {voiceHint}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="ragbot__fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? 'Close RAGbot chat' : 'Open RAGbot chat'}
      >
        {open ? (
          <X size={22} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <MessageCircle size={22} strokeWidth={2.4} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
