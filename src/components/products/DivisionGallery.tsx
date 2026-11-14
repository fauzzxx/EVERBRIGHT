import { useLocation, useNavigate } from 'react-router';
import { useCatalog } from '../../context/CatalogContext';
import type { DivisionId } from '../../types/catalog';
import { Reveal } from '../animations/Reveal';

/** Every photograph of a division in one editorial masonry wall; each opens its product. */
export function DivisionGallery({ divisionId, tone = 'dark' }: { divisionId: DivisionId; tone?: 'dark' | 'light' }) {
  const { productsFor } = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();
  const items = productsFor(divisionId).flatMap((p) => p.images.map((img, i) => ({ p, img, i })));
  if (!items.length) return null;
  const muted = tone === 'dark' ? 'text-ivory/55' : 'text-midnight/55';

  return (
    <div className="mt-[clamp(5rem,9vw,8rem)]">
      <Reveal className={`flex flex-wrap items-end justify-between gap-4 border-b pb-5 ${tone === 'dark' ? 'border-ivory/12' : 'border-midnight/12'}`}>
        <h3 className="font-serif text-[clamp(1.7rem,3.2vw,2.8rem)] font-light leading-none">Photo gallery</h3>
        <p className={`eyebrow text-[0.6rem] ${muted}`}>{items.length} photographs</p>
      </Reveal>
      <div className="mt-10 columns-2 gap-4 md:columns-3 xl:columns-4 [&>*]:mb-4">
        {items.map(({ p, img, i }) => (
          <a
            key={img.src}
            href={`/products/${p.id}`}
            data-cursor="View"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/products/${p.id}`, { state: { background: location, origin: null, from: p.id, image: i } });
            }}
            className="group block break-inside-avoid"
          >
            <div className="print overflow-hidden">
              <img
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full transition-transform duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-[1.04]"
              />
            </div>
            <p className={`mt-2 flex justify-between gap-3 text-[0.72rem] ${muted}`}>
              <span className="truncate transition-colors group-hover:text-gold">{p.name}</span>
              <span className="shrink-0 italic">{img.caption}</span>
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
