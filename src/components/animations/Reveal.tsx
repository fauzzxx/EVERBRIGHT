import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  /** animate direct children one after another */
  stagger?: number;
  start?: string;
}

/** Fade + rise into view (optionally staggering its direct children). */
export function Reveal({ children, className, y = 28, delay = 0, stagger, start = 'top 88%' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : el;
      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration: 1.2,
        ease: 'expo.out',
        delay,
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [y, delay, stagger, start]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** scroll-linked vertical drift in percent of the image height */
  parallax?: number;
  delay?: number;
  width?: number;
  height?: number;
  eager?: boolean;
}

/** Curtain mask reveal with optional scroll-linked drift. */
export function ImageReveal({ src, alt, className, imgClassName, parallax = 0, delay = 0, width, height, eager }: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const img = el.querySelector('img');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.5,
          ease: 'expo.inOut',
          delay,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        },
      );
      gsap.fromTo(
        img,
        { scale: 1.3 },
        { scale: 1, duration: 2, ease: 'expo.out', delay: delay + 0.15, scrollTrigger: { trigger: el, start: 'top 90%', once: true } },
      );
      if (parallax) {
        gsap.fromTo(
          el,
          { yPercent: parallax },
          {
            yPercent: -parallax,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
    }, el);
    return () => ctx.revert();
  }, [parallax, delay]);
  return (
    <div ref={ref} className={className}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={imgClassName}
      />
    </div>
  );
}
