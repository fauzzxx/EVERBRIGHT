import { useLayoutEffect, useRef, type ElementType } from 'react';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  /** seconds */
  delay?: number;
  stagger?: number;
  /** ScrollTrigger start; ignored when `onMount` */
  start?: string;
  onMount?: boolean;
}

/** Masked word-by-word reveal. Use "\n" in `text` for explicit line breaks. */
export function TextReveal({ text, as: Tag = 'h2', className, delay = 0, stagger = 0.06, start = 'top 86%', onMount }: Props) {
  const ref = useRef<HTMLElement>(null);
  const lines = text.split('\n');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll('.mask > span');
      // Animate y and yPercent together so no stale pixel offset can survive a remount.
      gsap.fromTo(words, { y: 0, yPercent: 115 }, {
        y: 0,
        yPercent: 0,
        duration: 1.25,
        ease: 'expo.out',
        stagger,
        delay,
        scrollTrigger: onMount ? undefined : { trigger: el, start, once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [text, delay, stagger, start, onMount]);

  return (
    <Tag ref={ref} className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(' ').map((word, wi, arr) => (
            <span key={wi}>
              <span className="mask">
                <span>{word}</span>
              </span>
              {wi < arr.length - 1 ? ' ' : null}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
