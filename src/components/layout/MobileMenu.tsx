import { X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCatalog } from '../../context/CatalogContext';
import { divisionNavOrder, navigation } from '../../data/navigation';
import { whatsappUrl, generalEnquiryMessage, mapsUrl } from '../../lib/enquiry';
import { gsap } from '../../lib/gsap';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { Wordmark } from './Wordmark';

interface Props {
  open: boolean;
  onClose(): void;
  onNavigate(anchor: string): void;
  active: string;
}

export function MobileMenu({ open, onClose, onNavigate, active }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const { stop, start } = useSmoothScroll();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { getDivision } = useCatalog();

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !mounted) return;
    const reduced = prefersReducedMotion();
    const links = el.querySelectorAll('[data-menu-link] > span');
    const meta = el.querySelectorAll('[data-menu-meta]');
    if (open) {
      stop();
      gsap.set(el, { autoAlpha: 1 });
      if (reduced) {
        gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' });
      } else {
        gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' });
        gsap.fromTo(links, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.35 });
        gsap.fromTo(meta, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, delay: 0.6 });
      }
      closeBtn.current?.focus();
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    start();
    if (reduced) {
      setMounted(false);
      return;
    }
    gsap.to(el, {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 0.75,
      ease: 'expo.inOut',
      onComplete: () => setMounted(false),
    });
  }, [open, mounted, onClose, stop, start]);

  if (!mounted) return null;
  const items = [
    ...navigation.slice(0, 2).map((n) => ({ key: n.anchor, label: n.label, anchor: n.anchor, path: '', division: false })),
    ...divisionNavOrder.map((id) => {
      const d = getDivision(id);
      return { key: d.path, label: d.name, anchor: '', path: d.path, division: true };
    }),
    ...navigation.slice(2).map((n) => ({ key: n.anchor, label: n.label, anchor: n.anchor, path: '', division: false })),
  ];
  const wa = whatsappUrl(generalEnquiryMessage({}));

  return (
    <div
      ref={ref}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="weave fixed inset-0 z-[70] flex w-full max-w-[100vw] flex-col overflow-x-hidden bg-midnight text-ivory invisible"
    >
      <div className="gutter flex h-[76px] items-center justify-between border-b border-ivory/10">
        <Wordmark />
        <button ref={closeBtn} type="button" onClick={onClose} className="flex items-center gap-3" aria-label="Close menu">
          <span className="eyebrow text-[0.6rem]">Close</span>
          <X size={20} strokeWidth={1} />
        </button>
      </div>
      <nav className="gutter flex flex-1 flex-col justify-center overflow-y-auto py-10" aria-label="Mobile">
        <ol className="space-y-[clamp(0.4rem,1.6vh,1rem)]">
          {items.map((item, i) => (
            <li
              key={item.key}
              className={`overflow-hidden ${item.division ? 'border-l border-gold/40 pl-4' : ''} ${
                item.division && !items[i - 1]?.division ? 'mt-4 pt-1' : ''
              } ${item.division && !items[i + 1]?.division ? 'mb-4 pb-1' : ''}`}
            >
              <button
                type="button"
                data-menu-link
                onClick={() => {
                  onClose();
                  setTimeout(() => (item.path ? navigate(item.path) : onNavigate(item.anchor)), 380);
                }}
                className="group flex w-full min-w-0 items-baseline gap-5 text-left"
              >
                <span className="flex min-w-0 items-baseline gap-5">
                  <span className="eyebrow w-6 shrink-0 text-[0.6rem] text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <span
                    className={`min-w-0 break-words font-serif font-light leading-[1.08] transition-colors group-hover:text-gold ${
                      item.division ? 'text-[clamp(1.2rem,5vw,2.6rem)]' : 'text-[clamp(1.7rem,6.4vw,3.6rem)]'
                    } ${active === item.anchor && item.anchor ? 'text-gold' : ''}`}
                  >
                    {item.label}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="gutter grid gap-3 border-t border-ivory/10 py-6 sm:grid-cols-2">
        <a
          data-menu-meta
          href={wa ?? undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!wa}
          onClick={(e) => !wa && e.preventDefault()}
          className={`btn btn-gold ${wa ? '' : 'pointer-events-none opacity-45'}`}
        >
          WhatsApp enquiry {wa ? '' : '· number pending'}
        </a>
        <a
          data-menu-meta
          href={mapsUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!mapsUrl}
          onClick={(e) => !mapsUrl && e.preventDefault()}
          className={`btn btn-outline-light ${mapsUrl ? '' : 'pointer-events-none opacity-45'}`}
        >
          Visit official store {mapsUrl ? '' : '· location pending'}
        </a>
      </div>
    </div>
  );
}
