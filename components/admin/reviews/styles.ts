/**
 * Class names for the Reviews screen. They live in styles/reviews.css (global, `rv-` prefixed)
 * rather than a CSS module, so the page keeps its styling when a module chunk fails to load.
 * `styles.threadBtn` resolves to `rv-thread-btn`.
 */
const cache = new Map<string, string>();

export const styles: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, key) {
    if (typeof key !== 'string') return undefined;
    let name = cache.get(key);
    if (!name) {
      name = `rv-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
      cache.set(key, name);
    }
    return name;
  },
});

export default styles;
