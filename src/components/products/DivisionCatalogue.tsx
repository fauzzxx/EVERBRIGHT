import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import type { Division } from '../../types/catalog';
import { ProductCard } from './ProductCard';

const PAGE = 12;

interface Props {
  division: Division;
  tone: 'dark' | 'light';
}

/** Category index + product grid for one division. */
export function DivisionCatalogue({ division, tone }: Props) {
  const { categoriesFor, productsFor, categoryLabel } = useCatalog();
  const { scrollTo } = useSmoothScroll();
  const categories = categoriesFor(division.id);
  const total = categories.reduce((n, c) => n + c.count, 0);
  const [cat, setCat] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const products = useMemo(() => productsFor(division.id, cat), [productsFor, division.id, cat]);
  const visible = products.slice(0, limit);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const map = new Map<string, typeof categories>();
    categories.forEach((c) => map.set(c.group, [...(map.get(c.group) ?? []), c]));
    return [...map.entries()];
  }, [categories]);

  // Reveal cards as they scroll in. Cards whose trigger has not fired yet are
  // reset on cleanup so the next run (new category, "show more", remount) picks them up.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-card]:not([data-shown])'));
    if (prefersReducedMotion() || !cards.length) return;
    const pending = new Set(cards);
    cards.forEach((c) => c.setAttribute('data-shown', ''));
    gsap.set(cards, { autoAlpha: 0, y: 46 });
    const batch = ScrollTrigger.batch(cards, {
      start: 'top 94%',
      once: true,
      onEnter: (els) => {
        els.forEach((e) => pending.delete(e as HTMLElement));
        gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.15, stagger: 0.075, ease: 'expo.out', overwrite: true });
      },
    });
    ScrollTrigger.refresh();
    return () => {
      batch.forEach((t) => t.kill());
      pending.forEach((el) => {
        el.removeAttribute('data-shown');
        gsap.set(el, { clearProps: 'opacity,visibility,transform' });
      });
    };
  }, [cat, limit]);

  const choose = (id: string) => {
    if (id === cat) return;
    setCat(id);
    setLimit(PAGE);
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) scrollTo(rootRef.current!, { offset: -24 });
  };

  const muted = tone === 'dark' ? 'text-ivory/50' : 'text-midnight/50';
  const rule = tone === 'dark' ? 'border-ivory/12' : 'border-midnight/12';
  const activeLabel = cat === 'all' ? `All ${division.shortName} designs` : categoryLabel(cat);

  const indexButton = (id: string, label: string, count: number, n: string) => {
    const on = cat === id;
    return (
      <button
        type="button"
        onClick={() => choose(id)}
        aria-pressed={on}
        className={`group flex w-full items-baseline gap-3 py-2 text-left transition-colors ${on ? 'text-gold' : ''}`}
      >
        <span className={`eyebrow w-6 shrink-0 text-[0.55rem] ${on ? 'text-gold' : muted}`}>{n}</span>
        <span className={`text-[0.92rem] leading-snug transition-opacity ${on ? '' : 'opacity-75 group-hover:opacity-100'}`}>
          {label}
        </span>
        <span aria-hidden="true" className={`mx-1 flex-1 translate-y-[-3px] border-b border-dotted ${rule}`} />
        <span className={`font-serif text-base italic ${on ? 'text-gold' : muted}`}>{String(count).padStart(2, '0')}</span>
      </button>
    );
  };

  let n = 0;
  return (
    <div ref={rootRef} className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Category index — sticky column on desktop, chip rail on mobile */}
      <aside className="min-w-0 lg:col-span-3">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+2.5rem)]">
          <p className={`eyebrow mb-4 text-[0.6rem] ${muted}`}>Catalogue index</p>
          <div className="hidden lg:block">
            {indexButton('all', 'All designs', total, '00')}
            {groups.map(([group, cats]) => (
              <div key={group} className="mt-6">
                <p className="eyebrow mb-1 text-[0.58rem] text-gold/80">{group}</p>
                {cats.map((c) => {
                  n += 1;
                  return <div key={c.id}>{indexButton(c.id, c.label, c.count, String(n).padStart(2, '0'))}</div>;
                })}
              </div>
            ))}
          </div>
          <div className="scrollbar-none -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2 lg:hidden">
            {[{ id: 'all', label: 'All', count: total }, ...categories].map((c) => {
              const on = cat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => choose(c.id)}
                  aria-pressed={on}
                  className={`shrink-0 border px-4 py-2.5 text-[0.78rem] whitespace-nowrap transition-colors ${
                    on ? 'border-gold bg-gold text-midnight' : `${rule} ${tone === 'dark' ? 'text-ivory/80' : 'text-midnight/80'}`
                  }`}
                >
                  {c.label} <span className="ml-1 opacity-60">{c.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:col-span-9">
        <div className={`mb-10 flex items-end justify-between gap-6 border-b pb-5 ${rule}`}>
          <h3 className="font-serif text-[clamp(1.7rem,3.2vw,2.8rem)] font-light leading-none">{activeLabel}</h3>
          <p className={`eyebrow shrink-0 text-[0.6rem] ${muted}`}>
            {products.length} {products.length === 1 ? 'design' : 'designs'}
          </p>
        </div>

        {products.length === 0 ? (
          <p className={`font-serif text-xl italic ${muted}`}>Products for this division will appear here once the catalogue is supplied.</p>
        ) : (
          <div key={cat} ref={gridRef} className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 md:gap-y-16">
            {visible.map((p, i) => (
              <ProductCard key={p.id} product={p} categoryLabel={categoryLabel(p.category)} index={i} />
            ))}
          </div>
        )}

        {products.length > limit && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className={`eyebrow text-[0.58rem] ${muted}`}>
              Showing {visible.length} of {products.length}
            </p>
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className={`btn ${tone === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
            >
              Show more designs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
