import { ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useCatalog } from '../../context/CatalogContext';
import type { DivisionId, Product } from '../../types/catalog';
import { Reveal } from '../animations/Reveal';

/**
 * Every photograph of a division, grouped by product, each with a short explanation
 * of what it shows. Clicking a photo opens the product on that photo.
 */
export function DivisionGallery({ divisionId, tone = 'dark' }: { divisionId: DivisionId; tone?: 'dark' | 'light' }) {
  const { productsFor } = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();
  const products = productsFor(divisionId);
  const total = products.reduce((n, p) => n + p.images.length, 0);
  if (!total) return null;
  const dark = tone === 'dark';
  const muted = dark ? 'text-ivory/55' : 'text-midnight/55';
  const body = dark ? 'text-ivory/72' : 'text-midnight/72';
  const rule = dark ? 'border-ivory/12' : 'border-midnight/12';

  const open = (p: Product, image: number) =>
    navigate(`/products/${p.id}`, { state: { background: location, origin: null, from: p.id, image } });

  return (
    <div className="mt-[clamp(5rem,9vw,8rem)]">
      <Reveal className={`flex flex-wrap items-end justify-between gap-4 border-b pb-5 ${rule}`}>
        <div>
          <p className="eyebrow text-gold">Photo guide</p>
          <h3 className="mt-3 font-serif text-[clamp(1.7rem,3.2vw,2.8rem)] font-light leading-none">
            Every bag, photo by photo
          </h3>
        </div>
        <p className={`eyebrow text-[0.6rem] ${muted}`}>{total} photographs explained</p>
      </Reveal>

      {products.map((p, pi) => (
        <section key={p.id} className={`border-b py-12 ${rule}`} aria-label={p.name}>
          <Reveal className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-4">
              <span className="font-serif text-sm italic text-gold">{String(pi + 1).padStart(2, '0')}</span>
              <h4 className="font-serif text-[clamp(1.4rem,2.2vw,1.9rem)] font-light leading-tight">{p.name}</h4>
            </div>
            <button
              type="button"
              onClick={() => open(p, 0)}
              className={`group eyebrow flex items-center gap-2 text-[0.58rem] ${muted} hover:text-gold`}
            >
              {p.dimensions ? `${p.dimensions} · ` : ''}View product
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>
          <Reveal stagger={0.06} className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {p.images.map((img, i) => (
              <a
                key={img.src}
                href={`/products/${p.id}`}
                data-cursor="View"
                onClick={(e) => {
                  e.preventDefault();
                  open(p, i);
                }}
                className="group block"
              >
                <div className="print aspect-[4/3] overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain p-[4%] transition-transform duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-[1.04]"
                  />
                </div>
                <p className="eyebrow mt-4 text-[0.56rem] text-gold">{img.caption}</p>
                {img.note && <p className={`mt-2 text-[0.84rem] leading-relaxed ${body}`}>{img.note}</p>}
              </a>
            ))}
          </Reveal>
        </section>
      ))}
    </div>
  );
}
