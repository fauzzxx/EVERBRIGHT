import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import type { ProductImage } from '../../types/catalog';

interface Props {
  images: ProductImage[];
  index: number;
  onIndex(i: number): void;
  /** element that receives the shared-element entrance (first image) */
  stageRef?: React.RefObject<HTMLDivElement | null>;
}

export function ProductGallery({ images, index, onIndex, stageRef }: Props) {
  const [zoom, setZoom] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const prevIndex = useRef(index);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const current = images[index];
  const count = images.length;

  useLayoutEffect(() => {
    setZoom(false);
    const img = imgRef.current;
    if (!img || prevIndex.current === index || prefersReducedMotion()) {
      prevIndex.current = index;
      return;
    }
    const dir = index > prevIndex.current ? 1 : -1;
    prevIndex.current = index;
    gsap.fromTo(
      img,
      { autoAlpha: 0, xPercent: 6 * dir, scale: 1.02 },
      { autoAlpha: 1, xPercent: 0, scale: 1, duration: 0.9, ease: 'expo.out' },
    );
  }, [index]);

  const go = (d: number) => onIndex((index + d + count) % count);

  const setOrigin = (e: PointerEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    if (!img) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current && Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 8) drag.current.moved = true;
    if (zoom && (e.pointerType === 'mouse' || drag.current)) setOrigin(e);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!zoom && d.moved && Math.abs(dx) > 50 && count > 1) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (!d.moved) {
      setOrigin(e);
      setZoom((z) => !z);
    }
  };

  if (!current) {
    return (
      <div className="print grid h-full w-full place-items-center">
        <span className="eyebrow text-[0.6rem] text-midnight/40">Photograph pending</span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div
        ref={stageRef}
        className={`print relative flex-1 touch-pan-y select-none overflow-hidden ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => (drag.current = null)}
        role="group"
        aria-roledescription="carousel"
        aria-label={`Image ${index + 1} of ${count}: ${current.caption}`}
      >
        <img
          ref={imgRef}
          key={current.src}
          src={current.src}
          alt={current.alt}
          width={current.width}
          height={current.height}
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain p-[6%] transition-transform duration-500 ease-[var(--ease-silk)]"
          style={{ transform: zoom ? 'scale(2.2)' : 'scale(1)' }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-midnight/70">
          <span className="eyebrow text-[0.58rem]">{current.caption}</span>
          <span className="font-serif text-sm italic">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => !z);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center border border-midnight/15 bg-ivory/80 text-midnight backdrop-blur transition-colors hover:bg-midnight hover:text-ivory"
          aria-label={zoom ? 'Zoom out' : 'Zoom in'}
        >
          {zoom ? <Minus size={16} strokeWidth={1.3} /> : <Plus size={16} strokeWidth={1.3} />}
        </button>
        {count > 1 && (
          <>
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(d);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-midnight/15 bg-ivory/70 text-midnight backdrop-blur transition-colors hover:bg-midnight hover:text-ivory ${
                  d < 0 ? 'left-4' : 'right-4'
                }`}
                aria-label={d < 0 ? 'Previous image' : 'Next image'}
              >
                {d < 0 ? <ChevronLeft size={18} strokeWidth={1.2} /> : <ChevronRight size={18} strokeWidth={1.2} />}
              </button>
            ))}
          </>
        )}
      </div>

      {current.note && (
        <p key={current.src} className="border-t border-midnight/10 bg-paper px-5 py-4 text-[0.86rem] leading-relaxed text-midnight/75 sm:px-6">
          <span className="eyebrow mr-2 text-[0.55rem] text-gold">{current.caption}</span>
          {current.note}
        </p>
      )}
      {count > 1 && (
        <div className="flex gap-2 bg-ivory-deep/60 p-3" role="tablist" aria-label="Product images">
          {images.map((im, i) => (
            <button
              key={im.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={im.caption}
              onClick={() => onIndex(i)}
              className={`print relative h-16 w-16 shrink-0 border transition-colors sm:h-20 sm:w-20 ${
                i === index ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={im.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
