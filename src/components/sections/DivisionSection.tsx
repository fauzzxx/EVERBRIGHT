import { ArrowDown } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { gsap } from '../../lib/gsap';
import type { DivisionId } from '../../types/catalog';
import { ImageReveal, Reveal } from '../animations/Reveal';
import { TextReveal } from '../animations/TextReveal';
import { DivisionCatalogue } from '../products/DivisionCatalogue';

interface Props {
  divisionId: DivisionId;
  /** visual theme of the chapter */
  tone: 'graphite' | 'ivory' | 'midnight';
  /** replaces the catalogue (e.g. empty-state storytelling) */
  children?: ReactNode;
}

const TONES = {
  graphite: { bg: 'bg-graphite text-ivory', nav: 'dark', muted: 'text-ivory/60', rule: 'border-ivory/12', catalogue: 'dark' },
  midnight: { bg: 'bg-midnight text-ivory weave', nav: 'dark', muted: 'text-ivory/60', rule: 'border-ivory/12', catalogue: 'dark' },
  ivory: { bg: 'bg-paper text-midnight', nav: 'light', muted: 'text-midnight/60', rule: 'border-midnight/12', catalogue: 'light' },
} as const;

/**
 * A division "chapter": the panel opens like a curtain as it enters, a giant
 * index numeral drifts behind the headline, real catalogue photographs reveal
 * through masks, and the catalogue follows.
 */
export function DivisionSection({ divisionId, tone, children }: Props) {
  const { getDivision, getProduct, productsFor, categoriesFor, categoryLabel } = useCatalog();
  const { scrollTo } = useSmoothScroll();
  const division = getDivision(divisionId);
  const t = TONES[tone];
  const count = productsFor(divisionId).length;
  const cats = categoriesFor(divisionId).length;
  const featured = division.featuredProductIds.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => !!p);
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.chapter-panel',
        { clipPath: 'inset(9% 5% 0% 5%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 25%', scrub: 0.6 },
        },
      );
      gsap.fromTo(
        '.chapter-numeral',
        { yPercent: 30 },
        { yPercent: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
      gsap.fromTo(
        '.chapter-rule',
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 70%', once: true } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id={division.anchor} data-nav={t.nav} className={`relative ${tone === 'ivory' ? 'bg-ivory-deep' : 'bg-ivory'}`}>
      <div className={`chapter-panel relative overflow-clip ${t.bg}`}>
        <span
          aria-hidden="true"
          className="chapter-numeral pointer-events-none absolute -right-[2vw] top-[4vw] select-none font-serif text-[clamp(14rem,34vw,34rem)] font-light leading-none text-current opacity-[0.045]"
        >
          {division.index}
        </span>

        <div className="gutter relative pt-[clamp(6rem,12vw,11rem)]">
          <Reveal className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="eyebrow text-gold">Division {division.index}</span>
            <span className="chapter-rule h-px w-16 origin-left bg-gold" />
            <span className={`eyebrow ${t.muted}`}>{division.name}</span>
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-12">
            <TextReveal as="h2" text={division.headline} className="display text-[clamp(2.8rem,7.6vw,8rem)] lg:col-span-8" />
            <Reveal className="lg:col-span-4 lg:pt-6">
              <p className={`text-[1rem] leading-relaxed ${t.muted}`}>{division.intro}</p>
              {count === 0 ? (
                <p className={`mt-8 border-t pt-5 font-serif text-xl italic ${t.rule} text-gold`}>Catalogue in preparation</p>
              ) : (
              <div className={`mt-8 grid grid-cols-2 border-t ${t.rule}`}>
                <div className={`border-r py-5 pr-4 ${t.rule}`}>
                  <p className="display text-5xl text-gold">{count ? String(count).padStart(2, '0') : '—'}</p>
                  <p className={`eyebrow mt-2 text-[0.56rem] ${t.muted}`}>Designs</p>
                </div>
                <div className="py-5 pl-5">
                  <p className="display text-5xl text-gold">{cats ? String(cats).padStart(2, '0') : '—'}</p>
                  <p className={`eyebrow mt-2 text-[0.56rem] ${t.muted}`}>Categories</p>
                </div>
              </div>
              )}
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => scrollTo(`${division.anchor}-catalogue`, { offset: -40 })}
                  className={`btn mt-6 ${tone === 'ivory' ? 'btn-outline-dark' : 'btn-outline-light'}`}
                >
                  Browse the catalogue <ArrowDown size={14} strokeWidth={1.2} />
                </button>
              )}
            </Reveal>
          </div>

          {featured.length > 0 && (
            <div className="mt-[clamp(4rem,9vw,8rem)] grid grid-cols-12 items-start gap-4 sm:gap-6">
              {featured.map((p, i) => {
                const img = p.images[0];
                const cls = [
                  { fig: 'col-span-12 sm:col-span-6', frame: 'aspect-[5/6] sm:aspect-[4/5]' },
                  { fig: 'col-span-6 sm:col-span-3 sm:mt-[30%]', frame: 'aspect-[3/4]' },
                  { fig: 'col-span-6 sm:col-span-3 sm:mt-[8%]', frame: 'aspect-[3/4]' },
                ][i];
                return (
                  <figure key={p.id} className={cls.fig}>
                    <ImageReveal
                      src={img.src}
                      alt={img.alt}
                      width={img.width}
                      height={img.height}
                      parallax={i === 0 ? 4 : 10}
                      delay={i * 0.1}
                      className={`print w-full ${cls.frame}`}
                      imgClassName="h-full w-full object-contain p-[9%]"
                    />
                    <figcaption className={`mt-3 flex justify-between gap-3 text-[0.72rem] ${t.muted}`}>
                      <span>{p.name}</span>
                      <span className="hidden italic md:inline">{categoryLabel(p.category)}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
        </div>

        <div id={`${division.anchor}-catalogue`} className="gutter relative pt-[clamp(5rem,9vw,8rem)] pb-[clamp(6rem,10vw,9rem)]">
          {children ?? <DivisionCatalogue division={division} tone={t.catalogue} />}
        </div>
      </div>
    </section>
  );
}
