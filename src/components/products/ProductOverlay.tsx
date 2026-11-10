import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useCatalog } from '../../context/CatalogContext';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { gsap } from '../../lib/gsap';
import { ProductDetail } from './ProductDetail';

interface OverlayState {
  background: unknown;
  origin?: { x: number; y: number; w: number; h: number } | null;
  from?: string;
}

/** Full-screen product view layered over the home page (route: /products/:id). */
export function ProductOverlay() {
  const { productId = '' } = useParams();
  const { getProduct } = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as OverlayState;
  const product = getProduct(productId);
  const { stop, start } = useSmoothScroll();
  const [imageIndex, setImageIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const firstId = useRef(productId);
  const returnFocusId = useRef(state?.from ?? productId);

  // Scroll lock while open; restore focus to the originating card on close.
  useEffect(() => {
    stop();
    return () => {
      start();
      const card = document.querySelector<HTMLElement>(`[data-product-card="${returnFocusId.current}"]`);
      card?.focus({ preventScroll: true });
    };
  }, [stop, start]);

  // Entrance: backdrop, panel, and the card image flying into the stage.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.overlay-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
      gsap.fromTo(
        panelRef.current,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.inOut' },
      );
      gsap.from('.detail-copy > *', { y: 30, autoAlpha: 0, duration: 1, stagger: 0.05, ease: 'expo.out', delay: 0.55 });
      const origin = state?.origin;
      const stage = stageRef.current;
      if (origin && stage) {
        const img = stage.querySelector('img');
        const r = stage.getBoundingClientRect();
        if (img && r.width > 0) {
          const s = Math.max(origin.w / r.width, origin.h / r.height);
          gsap.from(img, {
            x: origin.x + origin.w / 2 - (r.left + r.width / 2),
            y: origin.y + origin.h / 2 - (r.top + r.height / 2),
            scale: s,
            duration: 1.25,
            ease: 'expo.inOut',
            clearProps: 'transform',
          });
        }
      }
    }, root);
    return () => ctx.revert();
    // only on first open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Product switch inside the overlay (previous / next).
  useLayoutEffect(() => {
    setImageIndex(0);
    if (productId === firstId.current || prefersReducedMotion() || !rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll('.detail-copy > *, .detail-media'),
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.03, ease: 'expo.out' },
    );
    panelRef.current?.querySelector('.detail-info')?.scrollTo({ top: 0 });
    panelRef.current?.firstElementChild?.scrollTo({ top: 0 });
    rootRef.current.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true });
  }, [productId]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const finish = () => {
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
      if (idx > 0) navigate(-1);
      else navigate('/', { replace: true });
    };
    if (prefersReducedMotion() || !rootRef.current) return finish();
    gsap
      .timeline({ onComplete: finish })
      .to(panelRef.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'expo.inOut' }, 0)
      .to('.overlay-backdrop', { opacity: 0, duration: 0.5 }, 0.3);
  }, [navigate]);

  const goToProduct = useCallback(
    (id: string) => navigate(`/products/${id}`, { replace: true, state: { ...state, origin: null } }),
    [navigate, state],
  );

  // Keyboard: Esc closes, arrows move through the gallery, Tab stays inside.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!product) return;
      const n = product.images.length;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight' && n > 1) {
        setImageIndex((i) => (i + 1) % n);
      } else if (e.key === 'ArrowLeft' && n > 1) {
        setImageIndex((i) => (i - 1 + n) % n);
      } else if (e.key === 'Tab' && rootRef.current) {
        const f = rootRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, close]);

  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!product) navigate('/', { replace: true });
  }, [product, navigate]);

  useEffect(() => {
    if (product) document.title = `${product.name} — Everbright Uniforms`;
    return () => {
      document.title = 'Everbright Uniforms — Dressed for Purpose';
    };
  }, [product]);

  if (!product) return null;

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="product-title" className="fixed inset-0 z-[80]">
      <div className="overlay-backdrop absolute inset-0 bg-midnight-deep/70 backdrop-blur-sm" onClick={close} />
      <div ref={panelRef} className="absolute inset-0 overflow-hidden lg:inset-4 xl:inset-6" data-lenis-prevent>
        <ProductDetail
          product={product}
          mode="overlay"
          imageIndex={imageIndex}
          onImageIndex={setImageIndex}
          onClose={close}
          onNavigate={goToProduct}
          stageRef={stageRef}
        />
      </div>
    </div>
  );
}
