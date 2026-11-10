import { useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { Product } from '../../types/catalog';

interface Props {
  product: Product;
  categoryLabel: string;
  /** index within the visible grid, used for priority loading */
  index: number;
}

const HOVER_VIEWS = new Set(['back', 'side']);

export function ProductCard({ product, categoryLabel, index }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [primary] = product.images;
  const secondary = product.images.find((im) => HOVER_VIEWS.has(im.view));
  const href = `/products/${product.id}`;
  const [loaded, setLoaded] = useState(false);

  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const img = e.currentTarget.querySelector('img');
    const r = img?.getBoundingClientRect();
    navigate(href, {
      state: {
        background: location,
        origin: r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null,
        from: product.id,
      },
    });
  };

  return (
    <a
      href={href}
      onClick={open}
      data-card
      data-product-card={product.id}
      data-cursor="View"
      className="group block outline-offset-4"
      aria-label={`${product.name} — ${categoryLabel}`}
    >
      <div className="print aspect-[4/5]">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${loaded || !primary ? 'opacity-100' : 'opacity-0'}`}
        >
        {primary ? (
          <img
            ref={(el) => {
              if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
            }}
            onLoad={() => setLoaded(true)}
            src={primary.src}
            alt={primary.alt}
            width={primary.width}
            height={primary.height}
            loading={index < 6 ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-contain p-[8%] transition-[transform,opacity] duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-[1.045] ${
              secondary ? 'group-hover:opacity-0' : ''
            }`}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center eyebrow text-[0.6rem] text-midnight/40">
            Photograph pending
          </span>
        )}
        {secondary && (
          <img
            src={secondary.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full scale-[1.02] object-contain p-[8%] opacity-0 transition-[transform,opacity] duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-[1.045] group-hover:opacity-100"
          />
        )}
        </div>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-x-100" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow truncate text-[0.56rem] tracking-[0.24em] opacity-55">{categoryLabel}</p>
          <h3 className="mt-2 font-serif text-[1.3rem] font-normal leading-[1.15] transition-colors duration-500 group-hover:text-gold">
            {product.name}
          </h3>
        </div>
        <span aria-hidden="true" className="mt-5 shrink-0 text-lg leading-none opacity-40 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-gold">
          →
        </span>
      </div>
    </a>
  );
}
