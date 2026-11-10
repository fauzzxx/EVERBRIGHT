import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';

/** A single champagne-gold thread across the top of the viewport tracking page progress. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    const setX = gsap.quickSetter(el, 'scaleX');
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => setX(self.progress),
    });
    return () => st.kill();
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px origin-left scale-x-0 bg-gold/80"
    />
  );
}
