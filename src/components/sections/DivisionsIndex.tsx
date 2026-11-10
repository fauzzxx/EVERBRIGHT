import { ArrowDownRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { isFinePointer, prefersReducedMotion } from '../../hooks/useReducedMotion';
import { gsap } from '../../lib/gsap';
import { Reveal } from '../animations/Reveal';
import { TextReveal } from '../animations/TextReveal';

/** Editorial index of the three divisions with a cursor-following preview. */
export function DivisionsIndex() {
  const { catalog, productsFor, categoriesFor, getProduct } = useCatalog();
  const { scrollTo } = useSmoothScroll();
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const list = listRef.current;
    const prev = previewRef.current;
    if (!list || !prev || !isFinePointer() || prefersReducedMotion()) return;
    const xTo = gsap.quickTo(prev, 'x', { duration: 0.7, ease: 'power3.out' });
    const yTo = gsap.quickTo(prev, 'y', { duration: 0.7, ease: 'power3.out' });
    const rTo = gsap.quickTo(prev, 'rotation', { duration: 0.9, ease: 'power3.out' });
    let lastX = 0;
    const move = (e: PointerEvent) => {
      const r = list.getBoundingClientRect();
      xTo(e.clientX - r.left);
      yTo(e.clientY - r.top);
      rTo(gsap.utils.clamp(-6, 6, (e.clientX - lastX) * 0.4));
      lastX = e.clientX;
    };
    list.addEventListener('pointermove', move);
    return () => list.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    const prev = previewRef.current;
    if (!prev || !isFinePointer()) return;
    gsap.to(prev, { autoAlpha: hovered ? 1 : 0, scale: hovered ? 1 : 0.85, duration: 0.6, ease: 'expo.out' });
  }, [hovered]);

  return (
    <section id="divisions" data-nav="light" className="relative bg-ivory-deep text-midnight">
      <div className="gutter py-[clamp(5rem,11vw,9rem)]">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <TextReveal as="h2" text={'Three divisions.\nOne standard.'} className="display text-[clamp(2.6rem,6vw,6rem)] lg:col-span-7" />
          <Reveal className="lg:col-span-4 lg:col-start-9">
            <p className="text-[0.98rem] leading-relaxed text-midnight/70">
              Police and security wear, professional uniforms and protective document bags — each catalogued separately so
              you can go straight to what your team needs.
            </p>
          </Reveal>
        </div>

        <div ref={listRef} className="relative mt-16 border-t border-midnight/15" onPointerLeave={() => setHovered(null)}>
          {catalog.divisions.map((d) => {
            const count = productsFor(d.id).length;
            const cats = categoriesFor(d.id).length;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => scrollTo(d.anchor)}
                onPointerEnter={() => setHovered(d.id)}
                onFocus={() => setHovered(d.id)}
                onBlur={() => setHovered(null)}
                className="group relative grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 overflow-hidden border-b border-midnight/15 py-7 text-left sm:grid-cols-[4rem_1fr_auto] md:grid-cols-[5rem_1.2fr_1fr_auto] md:py-10"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-0 origin-bottom scale-y-0 bg-midnight transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-y-100"
                />
                <span className="relative font-serif text-lg italic text-gold">{d.index}</span>
                <span className="relative font-serif text-[clamp(1.5rem,3.4vw,3.1rem)] font-light leading-none tracking-[0.02em] transition-colors duration-500 group-hover:text-ivory">
                  {d.name}
                </span>
                <span className="relative hidden font-serif text-xl italic text-midnight/60 transition-colors duration-500 group-hover:text-ivory/70 md:block">
                  {d.headline.replace('\n', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                </span>
                <span className="relative flex items-center gap-4 transition-colors duration-500 group-hover:text-ivory">
                  <span className="eyebrow hidden text-[0.58rem] text-midnight/55 transition-colors group-hover:text-ivory/60 sm:inline">
                    {count ? `${count} designs · ${cats} categories` : 'Catalogue pending'}
                  </span>
                  <ArrowDownRight size={22} strokeWidth={1} className="transition-transform duration-500 group-hover:rotate-[-45deg]" />
                </span>
              </button>
            );
          })}

          <div
            ref={previewRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[300px] w-[240px] -translate-x-1/2 -translate-y-1/2 opacity-0 lg:block"
          >
            {catalog.divisions.map((d) => {
              const p = d.previewProductId ? getProduct(d.previewProductId) : undefined;
              return (
                <div
                  key={d.id}
                  className={`print absolute inset-0 shadow-[0_30px_60px_-20px_rgba(5,28,23,0.45)] transition-opacity duration-500 ${
                    hovered === d.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {p ? (
                    <img src={p.images[0].src} alt="" className="absolute inset-0 h-full w-full object-contain p-[10%]" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center px-6 text-center font-serif text-lg italic text-midnight/50">
                      Photography to be supplied
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
