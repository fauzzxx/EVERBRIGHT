import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';

/** `?motion=reduced` in the URL forces reduced motion (useful for QA). */
function forced() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('motion') === 'reduced';
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return forced() || window.matchMedia(query).matches;
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

export function isFinePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
