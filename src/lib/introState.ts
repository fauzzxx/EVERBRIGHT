/**
 * Tracks whether the cinematic intro has finished, so the navigation can wait
 * for it and the intro never replays on route changes within the session.
 */
type Listener = () => void;

const KEY = 'eb-intro-played';
let done = false;
const listeners = new Set<Listener>();

export const introState = {
  isDone: () => done,
  /** True when the full intro already played in this browser session. */
  playedBefore(): boolean {
    try {
      return sessionStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  },
  complete() {
    if (done) return;
    done = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable */
    }
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
