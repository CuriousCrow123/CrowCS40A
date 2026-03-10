/**
 * Reactive prefers-reduced-motion detector.
 * Call during component initialization. Returns object with reactive `current` property.
 */
export function createReducedMotion() {
  if (typeof window === 'undefined') return { get current() { return false; } };

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = $state(mql.matches);

  $effect(() => {
    const handler = (e: MediaQueryListEvent) => { reduced = e.matches; };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  });

  return { get current() { return reduced; } };
}
