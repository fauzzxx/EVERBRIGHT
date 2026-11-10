import { X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { navigation } from '../../data/navigation';
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
  const wa = whatsappUrl(generalEnquiryMessage({}));

  return (
    <div
      ref={ref}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="weave fixed inset-0 z-[70] flex flex-col bg-midnight text-ivory invisible"
    >
      <div className="gutter flex h-[var(--nav-h)] items-center justify-between border-b border-ivory/10">
        <Wordmark />
        <button ref={closeBtn} type="button" onClick={onClose} className="flex items-center gap-3" aria-label="Close menu">
          <span className="eyebrow text-[0.6rem]">Close</span>
          <X size={20} strokeWidth={1} />
        </button>
      </div>
      <nav className="gutter flex flex-1 flex-col justify-center overflow-y-auto py-10" aria-label="Mobile">
        <ol className="space-y-[clamp(0.4rem,1.6vh,1rem)]">
          {navigation.map((item, i) => (
            <li key={item.anchor} className="overflow-hidden">
              <button
                type="button"
                data-menu-link
                onClick={() => {
                  onClose();
                  setTimeout(() => onNavigate(item.anchor), 380);
                }}
                className="group flex w-full items-baseline gap-5 text-left"
              >
                <span className="flex items-baseline gap-5">
                  <span className="eyebrow w-6 text-[0.6rem] text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <span
                    className={`font-serif text-[clamp(1.7rem,6.4vw,3.6rem)] font-light leading-[1.05] transition-colors group-hover:text-gold ${
                      active === item.anchor ? 'text-gold' : ''
                    }`}
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
