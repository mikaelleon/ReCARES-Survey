'use client';

import { useEffect, useState } from 'react';
import { getInstrument } from '@/lib/firebase/instruments';
import { DEFAULT_INSTRUMENT } from '@/survey/defaultInstrument';
import type { Instrument } from '@/survey/model';

const cache = new Map<string, Instrument | null>();

/**
 * The survey version a response was answered on, so its answers read in the original
 * wording. Falls back to the built-in v1 when a version cannot be read.
 */
export function useResponseInstrument(version: string | undefined): {
  instrument: Instrument;
  exact: boolean;
} {
  const key = version || DEFAULT_INSTRUMENT.version;
  const [loaded, setLoaded] = useState<Instrument | null | undefined>(
    key === DEFAULT_INSTRUMENT.version ? DEFAULT_INSTRUMENT : cache.get(key),
  );

  useEffect(() => {
    if (key === DEFAULT_INSTRUMENT.version) {
      setLoaded(DEFAULT_INSTRUMENT);
      return;
    }
    if (cache.has(key)) {
      setLoaded(cache.get(key));
      return;
    }
    let stop = false;
    setLoaded(undefined);
    getInstrument(key)
      .catch(() => null)
      .then((inst) => {
        cache.set(key, inst);
        if (!stop) setLoaded(inst);
      });
    return () => {
      stop = true;
    };
  }, [key]);

  return loaded
    ? { instrument: loaded, exact: true }
    : { instrument: DEFAULT_INSTRUMENT, exact: false };
}
