import Lenis from 'lenis';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { prefersReducedMotion } from './useReducedMotion';

interface ScrollApi {
  scrollTo(target: string | number | HTMLElement, opts?: { immediate?: boolean; offset?: number }): void;
  stop(): void;
  start(): void;
  lenis(): Lenis | null;
}

const Ctx = createContext<ScrollApi | null>(null);

/** Lenis smooth scrolling, driven by the GSAP ticker so ScrollTrigger stays in sync. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const locks = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback<ScrollApi['scrollTo']>((target, opts = {}) => {
    const el =
      typeof target === 'string' ? (target === 'top' ? 0 : document.getElementById(target.replace(/^#/, ''))) : target;
    if (el === null) return;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(el as HTMLElement | number, {
        offset: opts.offset ?? 0,
        immediate: opts.immediate,
        duration: 1.6,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        force: true,
      });
    } else {
      const y = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
      window.scrollTo({ top: y, behavior: opts.immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, []);

  const api = useMemo<ScrollApi>(
    () => ({
      scrollTo,
      stop() {
        locks.current += 1;
        lenisRef.current?.stop();
        document.documentElement.style.overflow = 'hidden';
      },
      start() {
        locks.current = Math.max(0, locks.current - 1);
        if (locks.current === 0) {
          lenisRef.current?.start();
          document.documentElement.style.overflow = '';
        }
      },
      lenis: () => lenisRef.current,
    }),
    [scrollTo],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSmoothScroll() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSmoothScroll must be used inside SmoothScrollProvider');
  return ctx;
}
