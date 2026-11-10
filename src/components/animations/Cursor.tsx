import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Cursor companion for fine pointers: a small gold ring that expands into a
 * labelled disc over elements carrying `data-cursor="Label"`.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const el = ref.current!;
    const label = labelRef.current!;
    el.style.display = 'grid';
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
    let active: Element | null = null;

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      const target = (e.target as Element | null)?.closest?.('[data-cursor]') ?? null;
      if (target !== active) {
        active = target;
        if (target) {
          label.textContent = target.getAttribute('data-cursor') ?? '';
          gsap.to(el, { width: 88, height: 88, backgroundColor: 'rgba(201,174,122,0.92)', borderColor: 'rgba(201,174,122,0)', duration: 0.5, ease: 'expo.out' });
          gsap.to(label, { autoAlpha: 1, duration: 0.3, delay: 0.1 });
        } else {
          gsap.to(el, { width: 10, height: 10, backgroundColor: 'rgba(201,174,122,0)', borderColor: 'rgba(201,174,122,0.9)', duration: 0.5, ease: 'expo.out' });
          gsap.to(label, { autoAlpha: 0, duration: 0.15 });
        }
      }
    };
    const onLeave = () => gsap.to(el, { autoAlpha: 0, duration: 0.3 });
    const onEnter = () => gsap.to(el, { autoAlpha: 1, duration: 0.3 });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.documentElement.addEventListener('pointerenter', onEnter);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.removeEventListener('pointerenter', onEnter);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-[10px] w-[10px] place-items-center rounded-full border border-gold/90 mix-blend-normal"
      style={{ translate: '-50% -50%' }}
    >
      <span ref={labelRef} className="eyebrow invisible text-[0.6rem] tracking-[0.22em] text-midnight opacity-0" />
    </div>
  );
}
