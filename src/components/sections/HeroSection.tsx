import { useLayoutEffect, useRef } from 'react';
import { brand } from '../../config/brand';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { gsap } from '../../lib/gsap';
import { introState } from '../../lib/introState';
import { TextileBackground, type TextileController } from '../animations/TextileBackground';

function Letters({ word }: { word: string }) {
  return (
    <>
      {word.split('').map((ch, i) => (
        <span key={i} className="mask">
          <span>{ch}</span>
        </span>
      ))}
    </>
  );
}

/**
 * Opening sequence:
 * midnight field → threads sweep in → satin emerges → gold seam draws across the
 * centre → EVERBRIGHT rises from the seam → UNIFORM descends from it → tagline,
 * navigation and scroll cue → continuous ambient motion.
 */
export function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const ctrl = useRef<TextileController>({ reveal: 0, threads: 0, sweep: 0, dim: 0 });
  const { scrollTo } = useSmoothScroll();

  useLayoutEffect(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const reduced = prefersReducedMotion();
    const quick = introState.isDone() || introState.playedBefore();

    const ctx = gsap.context(() => {
      if (reduced) {
        Object.assign(ctrl.current, { reveal: 1, threads: 0.55, sweep: 1, dim: 0 });
        introState.complete();
        return;
      }

      gsap.set(q('.hero-top .mask > span'), { yPercent: 112 });
      gsap.set(q('.hero-bottom .mask > span'), { yPercent: -112 });
      gsap.set(q('.hero-seam'), { scaleX: 0 });
      gsap.set(q('.hero-fade'), { autoAlpha: 0, y: 16 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      tl.to(ctrl.current, { sweep: 1, duration: 1.7, ease: 'power2.inOut' }, 0)
        .to(ctrl.current, { threads: 1, duration: 1.2, ease: 'power2.out' }, 0)
        .to(ctrl.current, { reveal: 1, duration: 2.6, ease: 'power2.inOut' }, 0.35)
        .to(q('.hero-seam'), { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 0.6)
        .to(q('.hero-top .mask > span'), { yPercent: 0, duration: 1.35, stagger: 0.045 }, 1.2)
        .to(q('.hero-bottom .mask > span'), { yPercent: 0, duration: 1.25, stagger: 0.055 }, 1.5)
        .to(q('.hero-seam'), { opacity: 0.55, duration: 1.4, ease: 'power2.out' }, 2.3)
        .to(q('.hero-fade'), { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.12, ease: 'power3.out' }, 2.05)
        .call(() => introState.complete(), [], 2.3)
        .to(ctrl.current, { threads: 0.55, duration: 2.2, ease: 'power2.inOut' }, 2.6);
      if (quick) tl.timeScale(2.4);

      // Start once fonts are ready (avoid animating fallback glyphs), never wait > 900ms.
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        tl.play();
      };
      document.fonts?.ready.then(start);
      gsap.delayedCall(0.9, start);

      // Leaving the hero: the lockup drifts up and fades, the satin dims.
      const st = { trigger: el, start: 'top top', end: 'bottom top', scrub: true } as const;
      gsap.to(q('.hero-content'), { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: st });
      gsap.to(ctrl.current, { dim: 0.6, ease: 'none', scrollTrigger: st });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="top"
      data-nav="hero"
      className="relative h-[100svh] min-h-[560px] overflow-hidden bg-midnight text-ivory"
    >
      <TextileBackground controller={ctrl} className="absolute inset-0 h-full w-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,28,23,0.55)_100%)]"
      />

      <div className="hero-content absolute inset-0 grid place-items-center px-4">
        <div className="relative">
        <h1 className="flex flex-col items-center text-center" aria-label={`${brand.heroTop} ${brand.heroBottom}`}>
          <span
            aria-hidden="true"
            className="hero-top display block whitespace-nowrap pl-[0.07em] text-[clamp(3rem,12.6vw,13.5rem)] leading-[0.86] tracking-[0.07em] text-ivory"
          >
            <Letters word={brand.heroTop} />
          </span>
          <span
            aria-hidden="true"
            className="hero-seam mt-[clamp(0.6rem,1.4vw,1.4rem)] block h-px w-[min(100%,88vw)] origin-center bg-[linear-gradient(90deg,transparent,#c9ae7a_18%,#e9d9b4_50%,#c9ae7a_82%,transparent)]"
          />
          <span
            aria-hidden="true"
            className="hero-bottom mt-[clamp(0.7rem,1.6vw,1.6rem)] block whitespace-nowrap pl-[0.6em] font-serif text-[clamp(1.05rem,3.1vw,3.3rem)] font-normal leading-none tracking-[0.6em] text-gold"
          >
            <Letters word={brand.heroBottom} />
          </span>
        </h1>
        {/* Positioned outside the flow so the brand lockup stays perfectly centred */}
        <div className="pointer-events-none absolute left-1/2 top-full mt-[clamp(2.2rem,7vh,4.5rem)] w-[min(92vw,34rem)] -translate-x-1/2 text-center">
          <p className="hero-fade eyebrow text-[0.7rem] tracking-[0.42em] text-gold-soft">{brand.tagline}</p>
          <p className="hero-fade mx-auto mt-4 max-w-xl font-serif text-[clamp(1.05rem,1.5vw,1.3rem)] font-light italic text-ivory/75">
            {brand.supportLine}
          </p>
        </div>
        </div>
      </div>

      <div className="hero-fade absolute inset-x-0 bottom-6 grid grid-cols-[1fr_auto_1fr] items-end gutter text-ivory/60">
        <p className="eyebrow hidden justify-self-start text-[0.6rem] tracking-[0.3em] lg:block">
          Uniform Police · Uniform · Protective Bags
        </p>
        <button
          type="button"
          onClick={() => scrollTo('about')}
          className="group col-start-2 flex flex-col items-center gap-3"
          aria-label="Scroll to About Us"
        >
          <span className="eyebrow text-[0.6rem] tracking-[0.34em] transition-colors group-hover:text-gold">Scroll</span>
          <span className="scroll-thread" />
        </button>
        <p className="eyebrow hidden justify-self-end text-[0.6rem] tracking-[0.3em] lg:block">Scroll to explore</p>
      </div>
    </section>
  );
}
